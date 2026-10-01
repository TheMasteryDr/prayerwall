const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { generateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide your full name, email address, and password.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(trimmedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, avatar, bio, created_at, updated_at)
      VALUES (?, ?, ?, 'user', NULL, '', ?, ?)
    `);

    const result = insertUser.run(name.trim(), trimmedEmail, passwordHash, now, now);
    const newUser = db.prepare('SELECT id, name, email, role, avatar, bio FROM users WHERE id = ?').get(result.lastInsertRowid);

    const token = generateToken(newUser);
    return res.status(201).json({
      message: 'Account created successfully. Welcome to Flaming Prayer Wall.',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'A server error occurred during registration. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(trimmedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email address or password.' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio
    };

    const token = generateToken(safeUser);
    return res.json({
      message: 'Welcome back.',
      token,
      user: safeUser
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login error occurred. Please try again.' });
  }
});

// Demo Login for instantaneous testing as PDaniel Olawande or member
router.post('/demo-login', async (req, res) => {
  try {
    const { role } = req.body; // 'pastor', 'member', 'intercessor'
    let user;

    if (role === 'pastor') {
      user = db.prepare("SELECT id, name, email, role, avatar, bio FROM users WHERE role = 'pastor' LIMIT 1").get();
    } else if (role === 'member') {
      user = db.prepare("SELECT id, name, email, role, avatar, bio FROM users WHERE email = 'sarah@example.com' OR role = 'user' LIMIT 1").get();
    } else {
      user = db.prepare("SELECT id, name, email, role, avatar, bio FROM users WHERE role = 'user' ORDER BY id DESC LIMIT 1").get();
    }

    if (!user) {
      return res.status(404).json({ error: 'Demo account not found in database.' });
    }

    const token = generateToken(user);
    return res.json({
      message: `Signed in as ${user.name} (${user.role.toUpperCase()})`,
      token,
      user
    });
  } catch (err) {
    console.error('Demo login error:', err);
    return res.status(500).json({ error: 'Could not switch demo user.' });
  }
});

// Get current user profile and unread notifications count
router.get('/me', requireAuth, (req, res) => {
  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications 
    WHERE user_id = ? AND read_at IS NULL
  `).get(req.user.id);

  res.json({
    user: req.user,
    unreadNotifications: unreadCount.count
  });
});

// Update profile
router.put('/profile', requireAuth, (req, res) => {
  try {
    const { name, bio, avatar } = req.body;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          bio = COALESCE(?, bio),
          avatar = COALESCE(?, avatar),
          updated_at = ?
      WHERE id = ?
    `).run(name ? name.trim() : null, bio, avatar, now, req.user.id);

    const updated = db.prepare('SELECT id, name, email, role, avatar, bio FROM users WHERE id = ?').get(req.user.id);
    const token = generateToken(updated);

    res.json({
      message: 'Profile updated successfully.',
      user: updated,
      token
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Unable to update profile.' });
  }
});

// Simulated password reset
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please provide your email address.' });
  }

  // To prevent user enumeration, always respond politely
  return res.json({
    message: 'If an account exists with this email address, a password reset link has been sent.'
  });
});

module.exports = router;
