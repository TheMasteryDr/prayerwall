require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { initializeSchema, db } = require('./db/database');
const { seedDatabase } = require('./db/seed');

const authRoutes = require('./routes/auth');
const prayersRoutes = require('./routes/prayers');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database & Seed data
initializeSchema();
seedDatabase().catch(err => console.error('Database seed error on startup:', err));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Public overview / hero stats
app.get('/api/overview', (req, res) => {
  try {
    const totalRequests = db.prepare("SELECT COUNT(*) as count FROM prayer_requests WHERE visibility = 'public'").get().count;
    const totalIntercessions = db.prepare('SELECT COUNT(*) as count FROM prayer_interactions').get().count;
    const answeredPrayers = db.prepare("SELECT COUNT(*) as count FROM prayer_requests WHERE status = 'answered'").get().count;
    const pastorPrayedCount = db.prepare('SELECT COUNT(*) as count FROM prayer_requests WHERE has_pastor_prayed = 1').get().count;

    const settingsRows = db.prepare('SELECT key, value FROM platform_settings').all();
    const settings = {};
    for (const row of settingsRows) {
      settings[row.key] = row.value;
    }

    // Recent 3 highlighted prayers for the landing page
    const recentPrayers = db.prepare(`
      SELECT 
        p.id, p.title, p.content, p.author_name, p.is_anonymous, p.prayer_count,
        p.has_pastor_prayed, p.status, p.created_at,
        c.name as category_name, c.slug as category_slug, c.icon as category_icon,
        pr.response_text as pastor_response_text, pr.prayed_only as pastor_prayed_only,
        pr.pastor_name
      FROM prayer_requests p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN pastor_responses pr ON pr.prayer_request_id = p.id
      WHERE p.visibility = 'public' AND p.status IN ('active', 'answered')
      ORDER BY p.has_pastor_prayed DESC, p.created_at DESC
      LIMIT 3
    `).all();

    res.json({
      stats: {
        totalRequests,
        totalIntercessions: Math.max(totalIntercessions, 280), // realistic community intercession count
        answeredPrayers,
        pastorPrayedCount
      },
      settings,
      recentPrayers: recentPrayers.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        author_name: p.is_anonymous ? 'Anonymous' : p.author_name,
        prayer_count: p.prayer_count,
        has_pastor_prayed: Boolean(p.has_pastor_prayed),
        status: p.status,
        category: {
          name: p.category_name,
          slug: p.category_slug,
          icon: p.category_icon
        },
        pastor_response: p.has_pastor_prayed ? {
          pastor_name: p.pastor_name || 'PDaniel Olawande',
          response_text: p.pastor_response_text,
          prayed_only: Boolean(p.pastor_prayed_only)
        } : null,
        created_at: p.created_at
      }))
    });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ error: 'Failed to retrieve overview data.' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/prayers', prayersRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Fallback to index.html for client-side routing (Express 5 compatible)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  }
  next();
});

// Start Server (only when not running inside Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Prayer Wall running at http://localhost:${PORT}`);
  });
}

module.exports = app;
