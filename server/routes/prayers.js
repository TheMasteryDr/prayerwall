const express = require('express');
const crypto = require('crypto');
const { db } = require('../db/database');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { prayerRateLimiter, basicSpamCheck } = require('../middleware/rateLimiter');

const router = express.Router();

// Helper to generate a consistent client identifier for guest or logged-in users
function getClientIdentifier(req) {
  if (req.user && req.user.id) {
    return `user_${req.user.id}`;
  }
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown_ip';
  const ua = req.headers['user-agent'] || 'unknown_ua';
  return 'guest_' + crypto.createHash('sha256').update(`${ip}-${ua}`).digest('hex').substring(0, 24);
}

// 1. Get all active categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM prayer_requests p WHERE p.category_id = c.id AND p.visibility = 'public' AND p.status IN ('active', 'answered')) as prayer_count
      FROM categories c 
      WHERE c.active = 1 
      ORDER BY c.display_order ASC
    `).all();
    res.json({ categories });
  } catch (err) {
    console.error('Fetch categories error:', err);
    res.status(500).json({ error: 'Failed to load categories.' });
  }
});

// 2. Server-Side Paginated Prayer Wall
router.get('/', optionalAuth, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;

    const category = req.query.category || 'all';
    const sort = req.query.sort || 'latest'; // 'latest', 'most_prayed', 'pastor_prayed', 'needs_prayer'
    const search = (req.query.search || '').trim();

    const clientIdentifier = getClientIdentifier(req);

    // Build query conditions
    const whereClauses = ["p.visibility = 'public'", "p.status IN ('active', 'answered')"];
    const queryParams = [];

    if (category && category !== 'all') {
      whereClauses.push('c.slug = ?');
      queryParams.push(category);
    }

    if (search) {
      whereClauses.push('(p.title LIKE ? OR p.content LIKE ? OR p.author_name LIKE ?)');
      const wild = `%${search}%`;
      queryParams.push(wild, wild, wild);
    }

    // Sort order
    let orderBy = 'p.created_at DESC';
    if (sort === 'most_prayed') {
      orderBy = 'p.prayer_count DESC, p.created_at DESC';
    } else if (sort === 'pastor_prayed') {
      orderBy = 'p.has_pastor_prayed DESC, p.created_at DESC';
    } else if (sort === 'needs_prayer') {
      orderBy = 'p.prayer_count ASC, p.created_at DESC';
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching records for server-side pagination metadata
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM prayer_requests p 
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereSQL}
    `;
    const countResult = db.prepare(countQuery).get(...queryParams);
    const totalRecords = countResult ? countResult.total : 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    // Fetch the specific page of records
    const fetchQuery = `
      SELECT 
        p.id, p.user_id, p.title, p.content, p.visibility, p.status, 
        p.is_anonymous, p.author_name, p.prayer_count, p.has_pastor_prayed,
        p.created_at, p.updated_at,
        c.id as category_id, c.name as category_name, c.slug as category_slug, c.icon as category_icon,
        pr.id as pastor_response_id, pr.pastor_id, pr.pastor_name, pr.response_text as pastor_response_text,
        pr.prayed_only as pastor_prayed_only, pr.created_at as pastor_response_date,
        (SELECT COUNT(*) FROM comments cm WHERE cm.prayer_request_id = p.id AND cm.status = 'approved') as comment_count,
        CASE WHEN pi.id IS NOT NULL THEN 1 ELSE 0 END as user_has_prayed
      FROM prayer_requests p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN pastor_responses pr ON pr.prayer_request_id = p.id
      LEFT JOIN prayer_interactions pi ON pi.prayer_request_id = p.id AND pi.identifier = ?
      ${whereSQL}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const prayers = db.prepare(fetchQuery).all(clientIdentifier, ...queryParams, limit, offset);

    // Format pastor response cleanly
    const formattedPrayers = prayers.map(p => {
      let pastorResponse = null;
      if (p.has_pastor_prayed) {
        pastorResponse = {
          id: p.pastor_response_id,
          pastor_id: p.pastor_id,
          pastor_name: p.pastor_name || 'Pastor Daniel',
          response_text: p.pastor_response_text,
          prayed_only: Boolean(p.pastor_prayed_only),
          created_at: p.pastor_response_date
        };
      }

      return {
        id: p.id,
        title: p.title,
        content: p.content,
        visibility: p.visibility,
        status: p.status,
        is_anonymous: Boolean(p.is_anonymous),
        author_name: p.is_anonymous ? 'Anonymous' : p.author_name,
        prayer_count: p.prayer_count,
        has_pastor_prayed: Boolean(p.has_pastor_prayed),
        pastor_response: pastorResponse,
        comment_count: p.comment_count,
        user_has_prayed: Boolean(p.user_has_prayed),
        category: {
          id: p.category_id,
          name: p.category_name,
          slug: p.category_slug,
          icon: p.category_icon
        },
        created_at: p.created_at
      };
    });

    res.json({
      prayers: formattedPrayers,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Fetch prayers error:', err);
    res.status(500).json({ error: 'Failed to retrieve prayer requests.' });
  }
});

// 3. Single Prayer Request by ID (Strict Privacy Verification)
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid prayer request ID.' });
    }

    const clientIdentifier = getClientIdentifier(req);

    const prayer = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name, c.slug as category_slug, c.icon as category_icon,
        pr.id as pastor_response_id, pr.pastor_id, pr.pastor_name, pr.response_text as pastor_response_text,
        pr.prayed_only as pastor_prayed_only, pr.created_at as pastor_response_date,
        CASE WHEN pi.id IS NOT NULL THEN 1 ELSE 0 END as user_has_prayed
      FROM prayer_requests p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN pastor_responses pr ON pr.prayer_request_id = p.id
      LEFT JOIN prayer_interactions pi ON pi.prayer_request_id = p.id AND pi.identifier = ?
      WHERE p.id = ?
    `).get(clientIdentifier, id);

    if (!prayer) {
      return res.status(404).json({ error: 'Prayer request not found.' });
    }

    // Strict privacy verification:
    // If visibility is 'private', only the owner OR Pastor/Admin can view it!
    const isOwner = req.user && req.user.id === prayer.user_id;
    const isPastorOrAdmin = req.user && (req.user.role === 'pastor' || req.user.role === 'admin');

    if (prayer.visibility === 'private' && !isOwner && !isPastorOrAdmin) {
      return res.status(403).json({ error: 'This prayer request is confidential and private to the requester and pastoral team.' });
    }

    // Fetch approved comments / encouragements
    const comments = db.prepare(`
      SELECT id, user_id, author_name, content, created_at
      FROM comments
      WHERE prayer_request_id = ? AND status = 'approved'
      ORDER BY created_at ASC
    `).all(id);

    let pastorResponse = null;
    if (prayer.has_pastor_prayed) {
      pastorResponse = {
        id: prayer.pastor_response_id,
        pastor_id: prayer.pastor_id,
        pastor_name: prayer.pastor_name || 'Pastor Daniel',
        response_text: prayer.pastor_response_text,
        prayed_only: Boolean(prayer.pastor_prayed_only),
        created_at: prayer.pastor_response_date
      };
    }

    res.json({
      prayer: {
        id: prayer.id,
        title: prayer.title,
        content: prayer.content,
        visibility: prayer.visibility,
        status: prayer.status,
        is_anonymous: Boolean(prayer.is_anonymous),
        author_name: prayer.is_anonymous ? 'Anonymous' : prayer.author_name,
        prayer_count: prayer.prayer_count,
        has_pastor_prayed: Boolean(prayer.has_pastor_prayed),
        pastor_response: pastorResponse,
        user_has_prayed: Boolean(prayer.user_has_prayed),
        category: {
          id: prayer.category_id,
          name: prayer.category_name,
          slug: prayer.category_slug,
          icon: prayer.category_icon
        },
        comments,
        created_at: prayer.created_at,
        is_owner: isOwner,
        can_moderate: isPastorOrAdmin
      }
    });
  } catch (err) {
    console.error('Fetch prayer detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve prayer details.' });
  }
});

// 4. Submit New Prayer Request
router.post('/', optionalAuth, prayerRateLimiter, basicSpamCheck, (req, res) => {
  try {
    const {
      title,
      content,
      category_id,
      visibility = 'public',
      is_anonymous = false,
      author_name
    } = req.body;

    if (!title || title.trim().length < 5) {
      return res.status(400).json({ error: 'Please provide a clear title for your prayer request (at least 5 characters).' });
    }

    if (!content || content.trim().length < 10) {
      return res.status(400).json({ error: 'Please share your prayer request in more detail (at least 10 characters).' });
    }

    const catId = parseInt(category_id, 10);
    const category = db.prepare('SELECT id FROM categories WHERE id = ? AND active = 1').get(catId);
    if (!category) {
      return res.status(400).json({ error: 'Please select a valid prayer category.' });
    }

    const validVisibilities = ['public', 'private', 'unlisted'];
    const chosenVisibility = validVisibilities.includes(visibility) ? visibility : 'public';

    let finalAuthor = 'Anonymous';
    const isAnon = Boolean(is_anonymous);

    if (!isAnon) {
      if (req.user && req.user.name) {
        finalAuthor = req.user.name;
      } else if (author_name && author_name.trim().length > 0) {
        finalAuthor = author_name.trim();
      } else {
        finalAuthor = 'Believer';
      }
    }

    const now = new Date().toISOString();
    const userId = req.user ? req.user.id : null;

    const insertPrayer = db.prepare(`
      INSERT INTO prayer_requests (
        user_id, title, content, category_id, visibility, status,
        is_anonymous, author_name, prayer_count, has_pastor_prayed,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, 0, 0, ?, ?)
    `);

    const result = insertPrayer.run(
      userId,
      title.trim(),
      content.trim(),
      catId,
      chosenVisibility,
      isAnon ? 1 : 0,
      finalAuthor,
      now,
      now
    );

    const newPrayerId = result.lastInsertRowid;

    // If private or public, create a notification for Pastor Daniel
    const pastor = db.prepare("SELECT id FROM users WHERE role = 'pastor' LIMIT 1").get();
    if (pastor) {
      const notifMsg = chosenVisibility === 'private'
        ? `New Private Prayer Request from ${isAnon ? 'Anonymous' : finalAuthor}: "${title.trim().substring(0, 40)}..."`
        : `New Prayer Request submitted: "${title.trim().substring(0, 40)}..."`;

      db.prepare(`
        INSERT INTO notifications (user_id, type, prayer_request_id, message, created_at)
        VALUES (?, 'new_request', ?, ?, ?)
      `).run(pastor.id, newPrayerId, notifMsg, now);
    }

    res.status(201).json({
      message: 'Your prayer request has been received. You are not praying alone.',
      prayerId: newPrayerId,
      visibility: chosenVisibility
    });
  } catch (err) {
    console.error('Submit prayer error:', err);
    res.status(500).json({ error: 'Unable to submit prayer request. Please try again.' });
  }
});

// 5. "I Prayed" Intercession Action with Duplicate Prevention
router.post('/:id/pray', optionalAuth, (req, res) => {
  try {
    const prayerId = parseInt(req.params.id, 10);
    const identifier = getClientIdentifier(req);
    const userId = req.user ? req.user.id : null;
    const now = new Date().toISOString();

    const prayer = db.prepare('SELECT id, user_id, title, prayer_count, visibility FROM prayer_requests WHERE id = ?').get(prayerId);
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer request not found.' });
    }

    // Check if client has already prayed for this request
    const existing = db.prepare(`
      SELECT id FROM prayer_interactions 
      WHERE prayer_request_id = ? AND identifier = ?
    `).get(prayerId, identifier);

    if (existing) {
      // Allow toggle/undo if user clicks again
      db.prepare('DELETE FROM prayer_interactions WHERE id = ?').run(existing.id);
      db.prepare('UPDATE prayer_requests SET prayer_count = MAX(0, prayer_count - 1), updated_at = ? WHERE id = ?').run(now, prayerId);
      
      const updated = db.prepare('SELECT prayer_count FROM prayer_requests WHERE id = ?').get(prayerId);
      return res.json({
        success: true,
        action: 'unprayed',
        prayer_count: updated.prayer_count,
        has_prayed: false,
        message: 'Prayer intercession updated.'
      });
    }

    // Record new prayer interaction
    db.prepare(`
      INSERT INTO prayer_interactions (prayer_request_id, user_id, identifier, created_at)
      VALUES (?, ?, ?, ?)
    `).run(prayerId, userId, identifier, now);

    // Increment prayer count
    db.prepare(`
      UPDATE prayer_requests 
      SET prayer_count = prayer_count + 1, updated_at = ? 
      WHERE id = ?
    `).run(now, prayerId);

    const updated = db.prepare('SELECT prayer_count FROM prayer_requests WHERE id = ?').get(prayerId);

    // Notify original author if registered and not self
    if (prayer.user_id && (!req.user || req.user.id !== prayer.user_id)) {
      const intercessorName = req.user ? req.user.name : 'A fellow believer';
      db.prepare(`
        INSERT INTO notifications (user_id, type, prayer_request_id, message, created_at)
        VALUES (?, 'prayer', ?, ?, ?)
      `).run(
        prayer.user_id,
        prayerId,
        `${intercessorName} just lifted your prayer request before God.`,
        now
      );
    }

    return res.json({
      success: true,
      action: 'prayed',
      prayer_count: updated.prayer_count,
      has_prayed: true,
      message: 'Thank you for standing in agreement and intercession.'
    });
  } catch (err) {
    console.error('Pray interaction error:', err);
    res.status(500).json({ error: 'Could not record prayer interaction.' });
  }
});

// 6. Community Prayer Encouragement (Short, moderated comment)
router.post('/:id/comments', optionalAuth, (req, res) => {
  try {
    const prayerId = parseInt(req.params.id, 10);
    const { content, author_name } = req.body;

    if (!content || content.trim().length < 3) {
      return res.status(400).json({ error: 'Please enter a brief word of prayer or scripture.' });
    }

    if (content.trim().length > 300) {
      return res.status(400).json({ error: 'Encouragements should be brief and uplifting (max 300 characters).' });
    }

    const prayer = db.prepare('SELECT id, user_id, visibility FROM prayer_requests WHERE id = ?').get(prayerId);
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer request not found.' });
    }

    if (prayer.visibility === 'private') {
      return res.status(403).json({ error: 'Encouragements cannot be added to private pastoral requests.' });
    }

    let finalAuthor = 'Fellow Intercessor';
    if (req.user) {
      finalAuthor = req.user.name;
    } else if (author_name && author_name.trim().length > 0) {
      finalAuthor = author_name.trim();
    }

    const now = new Date().toISOString();
    const userId = req.user ? req.user.id : null;

    const result = db.prepare(`
      INSERT INTO comments (prayer_request_id, user_id, author_name, content, status, created_at)
      VALUES (?, ?, ?, ?, 'approved', ?)
    `).run(prayerId, userId, finalAuthor, content.trim(), now);

    // Notify author if registered
    if (prayer.user_id && (!req.user || req.user.id !== prayer.user_id)) {
      db.prepare(`
        INSERT INTO notifications (user_id, type, prayer_request_id, message, created_at)
        VALUES (?, 'encouragement', ?, ?, ?)
      `).run(
        prayer.user_id,
        prayerId,
        `${finalAuthor} left a word of encouragement on your prayer request.`,
        now
      );
    }

    res.status(201).json({
      message: 'Encouragement shared with the community.',
      comment: {
        id: result.lastInsertRowid,
        user_id: userId,
        author_name: finalAuthor,
        content: content.trim(),
        created_at: now
      }
    });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Unable to post encouragement.' });
  }
});

// 7. Report Inappropriate Content
router.post('/:id/report', optionalAuth, (req, res) => {
  try {
    const prayerId = parseInt(req.params.id, 10);
    const { reason, details, comment_id } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Please choose a reason for your report.' });
    }

    const now = new Date().toISOString();
    const userId = req.user ? req.user.id : null;

    db.prepare(`
      INSERT INTO reports (user_id, prayer_request_id, comment_id, reason, details, status, created_at)
      VALUES (?, ?, ?, ?, ?, 'pending', ?)
    `).run(userId, prayerId, comment_id ? parseInt(comment_id, 10) : null, reason, details || '', now);

    res.json({ message: 'Thank you. Your report has been submitted to the pastoral moderation team.' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Could not submit report.' });
  }
});

module.exports = router;
