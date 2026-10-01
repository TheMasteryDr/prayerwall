const jwt = require('jsonwebtoken');
const { db } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'flaming-prayer-wall-holy-secret-key-2026';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role, avatar, bio FROM users WHERE id = ?').get(decoded.id);
    req.user = user || null;
  } catch (err) {
    req.user = null;
  }
  next();
}

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role, avatar, bio FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User account not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}

function requirePastor(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'pastor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access restricted. Pastoral or administrative role required.' });
    }
    next();
  });
}

module.exports = {
  JWT_SECRET,
  generateToken,
  optionalAuth,
  requireAuth,
  requirePastor
};
