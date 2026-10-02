let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (err) {
  console.warn('node:sqlite not available on this Node runtime:', err.message);
}

const path = require('node:path');
const fs = require('node:fs');

// On Vercel serverless, /var/task is read-only. We must store the SQLite DB in /tmp.
const isVercel = Boolean(process.env.VERCEL);
const dbDir = isVercel ? '/tmp' : path.join(__dirname, '..', '..', 'data');

if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (err) {
    console.warn('Failed to create db directory:', err.message);
  }
}

const dbPath = path.join(dbDir, 'prayer_platform.db');
let db;

if (DatabaseSync) {
  db = new DatabaseSync(dbPath);
  try {
    // WAL mode for concurrency, foreign keys enabled
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
  } catch (e) {
    console.warn('PRAGMA setup note:', e.message);
  }
} else {
  // Safe fallback if runtime lacks node:sqlite
  db = {
    prepare: () => ({
      get: () => ({ count: 0 }),
      all: () => [],
      run: () => ({ lastInsertRowid: 1 })
    }),
    exec: () => {}
  };
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      avatar TEXT,
      bio TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      display_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS prayer_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      visibility TEXT NOT NULL DEFAULT 'public',
      status TEXT NOT NULL DEFAULT 'active',
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      author_name TEXT NOT NULL,
      prayer_count INTEGER NOT NULL DEFAULT 0,
      has_pastor_prayed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS prayer_interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prayer_request_id INTEGER NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
      user_id INTEGER,
      identifier TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(prayer_request_id, identifier),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS pastor_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prayer_request_id INTEGER NOT NULL UNIQUE REFERENCES prayer_requests(id) ON DELETE CASCADE,
      pastor_id INTEGER NOT NULL REFERENCES users(id),
      pastor_name TEXT NOT NULL,
      response_text TEXT,
      prayed_only INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prayer_request_id INTEGER NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
      user_id INTEGER,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      prayer_request_id INTEGER NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      read_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      prayer_request_id INTEGER REFERENCES prayer_requests(id) ON DELETE CASCADE,
      comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      reason TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Indexes for high performance server-side pagination, search and filters
    CREATE INDEX IF NOT EXISTS idx_prayers_visibility_status ON prayer_requests(visibility, status);
    CREATE INDEX IF NOT EXISTS idx_prayers_category ON prayer_requests(category_id);
    CREATE INDEX IF NOT EXISTS idx_prayers_user ON prayer_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_prayers_created ON prayer_requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_prayers_count ON prayer_requests(prayer_count DESC);
    CREATE INDEX IF NOT EXISTS idx_interactions_req_ident ON prayer_interactions(prayer_request_id, identifier);
    CREATE INDEX IF NOT EXISTS idx_interactions_user ON prayer_interactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at);
    CREATE INDEX IF NOT EXISTS idx_comments_req ON comments(prayer_request_id, status);
  `);
}

module.exports = {
  db,
  initializeSchema
};
