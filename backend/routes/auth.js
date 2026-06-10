const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim();

// Google login
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

// Local Development Bypass login (instant admin login)
router.get('/bypass', async (req, res) => {
  try {
    const User = require('../models/User');
    let user = await User.findOne({ email: 'admin@test.com' });
    if (!user) {
      user = await User.create({
        googleId: 'test-admin-id',
        name: 'Test Admin',
        email: 'admin@test.com',
        role: 'admin'
      });
    }
    const token = jwt.sign(
      { id: String(user._id), name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`${clientUrl}/auth/success?token=${token}`);
  } catch (err) {
    res.status(500).json({ error: 'Bypass login failed', details: err.message });
  }
});

// Local Development Bypass login (instant student login)
router.get('/bypass-student', async (req, res) => {
  try {
    const User = require('../models/User');
    let user = await User.findOne({ email: 'student@test.com' });
    if (!user) {
      user = await User.create({
        googleId: 'test-student-id',
        name: 'Test Student',
        email: 'student@test.com',
        role: 'student'
      });
    }
    const token = jwt.sign(
      { id: String(user._id), name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(`${clientUrl}/auth/success?token=${token}`);
  } catch (err) {
    res.status(500).json({ error: 'Bypass login failed', details: err.message });
  }
});

// Google callback — issue JWT
router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: `${clientUrl}/login`,
  session: false
}), (req, res) => {
  const token = jwt.sign(
    { id: String(req.user._id), name: req.user.name, email: req.user.email, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  // Send token to frontend via URL
  res.redirect(`${clientUrl}/auth/success?token=${token}`);
});

// Get current user from JWT
router.get('/current-user', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.json(null);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json(decoded);
  } catch (err) {
    res.json(null);
  }
});

// Logout — just tell frontend to delete token
router.get('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;