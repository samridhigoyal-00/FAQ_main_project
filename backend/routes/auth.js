const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();
const config = require('../config/env');
const User = require('../models/User');

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      password: hashedPassword,
      role: 'student'
    });
    
    const token = jwt.sign(
      { id: String(user._id), name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: String(user._id), name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

if (config.nodeEnv === 'development') {
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
}

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: `${clientUrl}/login`,
  session: false
}), (req, res) => {
  const token = jwt.sign(
    { id: String(req.user._id), name: req.user.name, email: req.user.email, role: req.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.redirect(`${clientUrl}/auth/success?token=${token}`);
});

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

router.get('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;