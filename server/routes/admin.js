const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { requirePastor } = require('../middleware/auth');

const router = express.Router();

// Apply requirePastor to all admin routes
router.use(requirePastor);

// 1. Pastoral & Platform Analytics
router.get('/stats', (req, res) => {
  try {
    const totalRequests = db.prepare('SELECT COUNT(*) as count FROM prayer_requests').get().count;
    const publicRequests = db.prepare("SELECT COUNT(*) as count FROM prayer_requests WHERE visibility = 'public'").get().count;
    const privateRequests = db.prepare("SELECT COUNT(*) as count FROM prayer_requests WHERE visibility = 'private'").get().count;
    const totalIntercessions = db.prepare('SELECT COUNT(*) as count FROM prayer_interactions').get().count;
    const awaitingPastor = db.prepare('SELECT COUNT(*) as count FROM prayer_requests WHERE has_pastor_prayed = 0 AND status = "active"').get().count;
    const prayedByPastor = db.prepare('SELECT COUNT(*) as count FROM prayer_requests WHERE has_pastor_prayed = 1').get().count;
    const activeUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get().count;

    res.json({
      stats: {
        totalRequests,
        publicRequests,
        privateRequests,
        totalIntercessions,
        awaitingPastor,
        prayedByPastor,
        activeUsers,
        pendingReports
      }
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
});

// 2. Admin Prayer Request Queue
router.get('/prayers', (req, res) => {
  try {
    const queue = req.query.queue || 'awaiting'; // 'awaiting', 'prayed', 'private', 'answered', 'all'
    const search = (req.query.search || '').trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 15));
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const queryParams = [];

    if (queue === 'awaiting') {
      whereClauses.push('p.has_pastor_prayed = 0 AND p.status = "active"');
    } else if (queue === 'prayed') {
      whereClauses.push('p.has_pastor_prayed = 1');
    } else if (queue === 'private') {
      whereClauses.push('p.visibility = "private"');
    } else if (queue === 'answered') {
      whereClauses.push('p.status = "answered"');
    }

    if (search) {
      whereClauses.push('(p.title LIKE ? OR p.content LIKE ? OR p.author_name LIKE ?)');
      const wild = `%${search}%`;
      queryParams.push(wild, wild, wild);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM prayer_requests p ${whereSQL}`;
    const totalRecords = db.prepare(countQuery).get(...queryParams).total;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    const fetchQuery = `
      SELECT 
        p.*,
        c.name as category_name, c.slug as category_slug,
        u.email as author_email,
        pr.id as pastor_response_id, pr.pastor_name, pr.response_text as pastor_response_text,
        pr.prayed_only as pastor_prayed_only, pr.created_at as pastor_response_date
      FROM prayer_requests p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN pastor_responses pr ON pr.prayer_request_id = p.id
      ${whereSQL}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const prayers = db.prepare(fetchQuery).all(...queryParams, limit, offset);

    const formatted = prayers.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      visibility: p.visibility,
      status: p.status,
      is_anonymous: Boolean(p.is_anonymous),
      author_name: p.author_name,
      author_email: p.author_email,
      prayer_count: p.prayer_count,
      has_pastor_prayed: Boolean(p.has_pastor_prayed),
      pastor_response: p.has_pastor_prayed ? {
        id: p.pastor_response_id,
        pastor_name: p.pastor_name || 'Pastor Daniel',
        response_text: p.pastor_response_text,
        prayed_only: Boolean(p.pastor_prayed_only),
        created_at: p.pastor_response_date
      } : null,
      category: {
        id: p.category_id,
        name: p.category_name,
        slug: p.category_slug
      },
      created_at: p.created_at
    }));

    res.json({
      prayers: formatted,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages
      }
    });
  } catch (err) {
    console.error('Admin prayers error:', err);
    res.status(500).json({ error: 'Failed to retrieve prayer queue.' });
  }
});

// 3. Pastoral Prayer Action (Mark as Prayed or Add Written Pastoral Prayer)
router.post('/prayers/:id/pastor-response', (req, res) => {
  try {
    const prayerId = parseInt(req.params.id, 10);
    const { response_text, prayed_only = false } = req.body;

    const prayer = db.prepare('SELECT id, user_id, title FROM prayer_requests WHERE id = ?').get(prayerId);
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer request not found.' });
    }

    const now = new Date().toISOString();
    const pastorName = req.user.name || 'Pastor Daniel';
    const isPrayedOnly = Boolean(prayed_only) || (!response_text || response_text.trim() === '');
    const cleanResponse = isPrayedOnly ? null : response_text.trim();

    // Upsert into pastor_responses
    const existing = db.prepare('SELECT id FROM pastor_responses WHERE prayer_request_id = ?').get(prayerId);
    if (existing) {
      db.prepare(`
        UPDATE pastor_responses 
        SET pastor_id = ?, pastor_name = ?, response_text = ?, prayed_only = ?, updated_at = ?
        WHERE id = ?
      `).run(req.user.id, pastorName, cleanResponse, isPrayedOnly ? 1 : 0, now, existing.id);
    } else {
      db.prepare(`
        INSERT INTO pastor_responses (prayer_request_id, pastor_id, pastor_name, response_text, prayed_only, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(prayerId, req.user.id, pastorName, cleanResponse, isPrayedOnly ? 1 : 0, now, now);
    }

    // Mark prayer as has_pastor_prayed = 1
    db.prepare('UPDATE prayer_requests SET has_pastor_prayed = 1, updated_at = ? WHERE id = ?').run(now, prayerId);

    // Notify requester if registered
    if (prayer.user_id) {
      const notifMsg = isPrayedOnly
        ? `${pastorName} has personally stood in prayer for your request.`
        : `${pastorName} has prayed for your request and provided a pastoral prayer.`;

      const notifType = isPrayedOnly ? 'pastor_prayed' : 'pastor_response';

      db.prepare(`
        INSERT INTO notifications (user_id, type, prayer_request_id, message, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(prayer.user_id, notifType, prayerId, notifMsg, now);
    }

    res.json({
      message: isPrayedOnly
        ? 'Prayer request marked as prayed by Pastor.'
        : 'Pastoral prayer and encouragement published successfully.',
      pastor_response: {
        pastor_name: pastorName,
        response_text: cleanResponse,
        prayed_only: isPrayedOnly,
        created_at: now
      }
    });
  } catch (err) {
    console.error('Pastoral response error:', err);
    res.status(500).json({ error: 'Failed to record pastoral prayer.' });
  }
});

// 4. Moderation Action (Hide, Archive, Restore, Delete)
router.patch('/prayers/:id/moderate', (req, res) => {
  try {
    const prayerId = parseInt(req.params.id, 10);
    const { action } = req.body; // 'hide', 'restore', 'archive', 'delete'
    const now = new Date().toISOString();

    if (action === 'delete') {
      db.prepare('DELETE FROM prayer_requests WHERE id = ?').run(prayerId);
      return res.json({ message: 'Prayer request permanently deleted from platform.' });
    }

    let newStatus = 'active';
    if (action === 'hide') newStatus = 'hidden';
    else if (action === 'archive') newStatus = 'archived';
    else if (action === 'restore') newStatus = 'active';

    db.prepare('UPDATE prayer_requests SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, prayerId);

    res.json({ message: `Prayer request status updated to ${newStatus}.`, status: newStatus });
  } catch (err) {
    console.error('Moderation error:', err);
    res.status(500).json({ error: 'Failed to perform moderation action.' });
  }
});

// 5. Reports Queue
router.get('/reports', (req, res) => {
  try {
    const reports = db.prepare(`
      SELECT 
        r.*,
        p.title as prayer_title, p.content as prayer_content,
        u.name as reporter_name, u.email as reporter_email
      FROM reports r
      LEFT JOIN prayer_requests p ON r.prayer_request_id = p.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 50
    `).all();

    res.json({ reports });
  } catch (err) {
    console.error('Reports fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve moderation reports.' });
  }
});

// 6. Resolve/Dismiss Report
router.patch('/reports/:id', (req, res) => {
  try {
    const reportId = parseInt(req.params.id, 10);
    const { status } = req.body; // 'resolved', 'dismissed'

    db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, reportId);
    res.json({ message: `Report marked as ${status}.` });
  } catch (err) {
    console.error('Update report error:', err);
    res.status(500).json({ error: 'Failed to update report status.' });
  }
});

// 7. Platform Settings
router.get('/settings', (req, res) => {
  try {
    const settingsRows = db.prepare('SELECT key, value FROM platform_settings').all();
    const settings = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }
    res.json({ settings });
  } catch (err) {
    console.error('Fetch settings error:', err);
    res.status(500).json({ error: 'Failed to load platform settings.' });
  }
});

router.put('/settings', (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings payload.' });
    }

    const upsert = db.prepare(`
      INSERT INTO platform_settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, value] of Object.entries(settings)) {
      upsert.run(key, String(value));
    }

    res.json({ message: 'Platform settings updated successfully.' });
  } catch (err) {
    console.error('Save settings error:', err);
    res.status(500).json({ error: 'Failed to save settings.' });
  }
});

// 8. Registered Members & Intercessors Management
router.get('/members', (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const role = (req.query.role || 'all').trim();
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const offset = (page - 1) * limit;

    const whereClauses = [];
    const queryParams = [];

    if (role && role !== 'all') {
      whereClauses.push('u.role = ?');
      queryParams.push(role);
    }

    if (search) {
      whereClauses.push('(u.name LIKE ? OR u.email LIKE ? OR u.bio LIKE ?)');
      const wild = `%${search}%`;
      queryParams.push(wild, wild, wild);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countQuery = `SELECT COUNT(*) as total FROM users u ${whereSQL}`;
    const totalRecords = db.prepare(countQuery).get(...queryParams).total;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    const fetchQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.avatar,
        u.bio,
        u.created_at,
        u.updated_at,
        (SELECT COUNT(*) FROM prayer_requests WHERE user_id = u.id) as petitions_count,
        (SELECT COUNT(*) FROM prayer_interactions WHERE user_id = u.id) as prayers_lifted,
        (SELECT COUNT(*) FROM comments WHERE user_id = u.id) as comments_count
      FROM users u
      ${whereSQL}
      ORDER BY 
        CASE 
          WHEN u.role = 'pastor' THEN 1
          WHEN u.role = 'moderator' THEN 2
          ELSE 3
        END ASC,
        u.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const members = db.prepare(fetchQuery).all(...queryParams, limit, offset);

    res.json({
      members,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages
      }
    });
  } catch (err) {
    console.error('Admin members fetch error:', err);
    res.status(500).json({ error: 'Failed to retrieve registered members.' });
  }
});

// Update Member Role (user, moderator, pastor)
router.patch('/members/:id/role', (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const { role } = req.body;

    const validRoles = ['user', 'moderator', 'pastor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be user, moderator, or pastor.' });
    }

    const member = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Safety: Prevent self-demotion if current pastor
    if (memberId === req.user.id && role !== 'pastor') {
      return res.status(400).json({ error: 'You cannot demote your own pastoral administrator account.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').run(role, now, memberId);

    res.json({
      message: `Role for ${member.name} updated to ${role}.`,
      member: {
        id: member.id,
        name: member.name,
        role
      }
    });
  } catch (err) {
    console.error('Update member role error:', err);
    res.status(500).json({ error: 'Failed to update member role.' });
  }
});

// Reset Member Password
router.post('/members/:id/reset-password', async (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);
    const { new_password } = req.body;

    const member = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const tempPassword = (new_password && new_password.trim().length >= 6)
      ? new_password.trim()
      : 'AltarPrayer' + Math.floor(1000 + Math.random() * 9000);

    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const now = new Date().toISOString();

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?').run(passwordHash, now, memberId);

    res.json({
      message: `Password for ${member.name} has been reset.`,
      temporaryPassword: tempPassword
    });
  } catch (err) {
    console.error('Reset member password error:', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

// Delete Member Account
router.delete('/members/:id', (req, res) => {
  try {
    const memberId = parseInt(req.params.id, 10);

    const member = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(memberId);
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    if (memberId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own logged-in pastoral account.' });
    }

    if (memberId === 1 && member.role === 'pastor') {
      return res.status(400).json({ error: 'The primary lead pastor account cannot be deleted.' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(memberId);

    res.json({
      message: `Member account for ${member.name} (${member.email}) was permanently removed.`
    });
  } catch (err) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Failed to delete member account.' });
  }
});

module.exports = router;
