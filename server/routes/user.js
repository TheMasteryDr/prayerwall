const express = require('express');
const { db } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// 1. Get current user's submitted prayer requests
router.get('/prayers', requireAuth, (req, res) => {
  try {
    const prayers = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name, c.slug as category_slug, c.icon as category_icon,
        pr.id as pastor_response_id, pr.pastor_id, pr.pastor_name, pr.response_text as pastor_response_text,
        pr.prayed_only as pastor_prayed_only, pr.created_at as pastor_response_date,
        (SELECT COUNT(*) FROM comments cm WHERE cm.prayer_request_id = p.id) as comment_count
      FROM prayer_requests p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN pastor_responses pr ON pr.prayer_request_id = p.id
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);

    const formatted = prayers.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      visibility: p.visibility,
      status: p.status,
      is_anonymous: Boolean(p.is_anonymous),
      prayer_count: p.prayer_count,
      has_pastor_prayed: Boolean(p.has_pastor_prayed),
      pastor_response: p.has_pastor_prayed ? {
        id: p.pastor_response_id,
        pastor_name: p.pastor_name || 'Pastor Daniel',
        response_text: p.pastor_response_text,
        prayed_only: Boolean(p.pastor_prayed_only),
        created_at: p.pastor_response_date
      } : null,
      comment_count: p.comment_count,
      category: {
        id: p.category_id,
        name: p.category_name,
        slug: p.category_slug,
        icon: p.category_icon
      },
      created_at: p.created_at
    }));

    res.json({ prayers: formatted });
  } catch (err) {
    console.error('Fetch user prayers error:', err);
    res.status(500).json({ error: 'Failed to retrieve your prayer requests.' });
  }
});

// 2. Get prayer requests the current user has prayed for ("Prayers I Stand With")
router.get('/intercessions', requireAuth, (req, res) => {
  try {
    const identifier = `user_${req.user.id}`;
    const prayers = db.prepare(`
      SELECT 
        p.*,
        c.name as category_name, c.slug as category_slug, c.icon as category_icon,
        pr.id as pastor_response_id, pr.pastor_name, pr.response_text as pastor_response_text,
        pr.prayed_only as pastor_prayed_only, pr.created_at as pastor_response_date,
        pi.created_at as intercession_date
      FROM prayer_interactions pi
      JOIN prayer_requests p ON pi.prayer_request_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN pastor_responses pr ON pr.prayer_request_id = p.id
      WHERE pi.identifier = ? AND p.visibility = 'public' AND p.status IN ('active', 'answered')
      ORDER BY pi.created_at DESC
      LIMIT 50
    `).all(identifier);

    const formatted = prayers.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      status: p.status,
      author_name: p.is_anonymous ? 'Anonymous' : p.author_name,
      prayer_count: p.prayer_count,
      has_pastor_prayed: Boolean(p.has_pastor_prayed),
      pastor_response: p.has_pastor_prayed ? {
        pastor_name: p.pastor_name || 'Pastor Daniel',
        response_text: p.pastor_response_text,
        prayed_only: Boolean(p.pastor_prayed_only)
      } : null,
      category: {
        id: p.category_id,
        name: p.category_name,
        slug: p.category_slug,
        icon: p.category_icon
      },
      intercession_date: p.intercession_date,
      created_at: p.created_at
    }));

    res.json({ intercessions: formatted });
  } catch (err) {
    console.error('Fetch intercessions error:', err);
    res.status(500).json({ error: 'Failed to retrieve intercessions.' });
  }
});

// 3. User Notifications Center
router.get('/notifications', requireAuth, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT n.*, p.title as prayer_title
      FROM notifications n
      LEFT JOIN prayer_requests p ON n.prayer_request_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `).all(req.user.id);

    res.json({ notifications });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

// 4. Mark notifications as read
router.post('/notifications/read-all', requireAuth, (req, res) => {
  try {
    const now = new Date().toISOString();
    db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(now, req.user.id);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Unable to update notifications.' });
  }
});

// 5. Update user prayer status (e.g., mark as Answered / Testimony)
router.patch('/prayers/:id/status', requireAuth, (req, res) => {
  try {
    const prayerId = parseInt(req.params.id, 10);
    const { status } = req.body;

    const allowed = ['active', 'answered', 'archived'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid prayer status.' });
    }

    const prayer = db.prepare('SELECT id, user_id FROM prayer_requests WHERE id = ?').get(prayerId);
    if (!prayer) {
      return res.status(404).json({ error: 'Prayer request not found.' });
    }

    if (prayer.user_id !== req.user.id && req.user.role !== 'pastor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You are not authorized to update this prayer request.' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE prayer_requests SET status = ?, updated_at = ? WHERE id = ?').run(status, now, prayerId);

    res.json({
      message: status === 'answered' ? 'Praise God! Your prayer request is now marked as an answered testimony.' : 'Prayer status updated.',
      status
    });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Could not update prayer status.' });
  }
});

module.exports = router;
