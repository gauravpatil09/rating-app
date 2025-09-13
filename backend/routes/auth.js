
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { nameRules, addressRules, passwordRules, emailRule } = require('../utils/validators');
const User = require('../models/User');
const Store = require('../models/Store');
require('dotenv').config();

// Register (Normal user)
router.post('/register', [nameRules, emailRule, addressRules, passwordRules], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, address, password } = req.body;
  try {
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, address, password: hashed, role: 'user' });
    return res.json({ message: 'Registered', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Request password reset (for user email or store owner)
router.post('/reset-request', async (req, res) => {
  try {
    const { email, storeId } = req.body;
    let user = null;
    if (email) {
      user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: 'No user with that email' });
    } else if (storeId) {
      const store = await Store.findOne({ where: { id: storeId } });
      if (!store) return res.status(404).json({ message: 'Store not found' });
      if (!store.ownerId) return res.status(400).json({ message: 'Store has no owner to reset password for' });
      user = await User.findOne({ where: { id: store.ownerId } });
      if (!user) return res.status(404).json({ message: 'Owner user not found' });
    } else {
      return res.status(400).json({ message: 'Provide email or storeId' });
    }

    // create a short-lived reset token (in production send this by email)
    const token = jwt.sign({ id: user.id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    // NOTE: here we return the token in response for testing/dev. In production, email the token link instead.
    return res.json({ message: 'Reset token created (use it to call /auth/reset)', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Perform password reset using token
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'token and password required' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    if (!payload || payload.type !== 'reset' || !payload.id) return res.status(400).json({ message: 'Invalid token payload' });

    const user = await User.findOne({ where: { id: payload.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    await user.save();

    return res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
