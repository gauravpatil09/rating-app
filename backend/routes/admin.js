
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Store = require('../models/Store');
const Rating = require('../models/Rating');
const bcrypt = require('bcryptjs');
const { Op, fn, col } = require('sequelize');

// Middleware: only admin
router.use(auth);
router.use((req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
});

// Dashboard summary
router.get('/dashboard', async (req, res) => {
  try {
    const users = await User.count();
    const stores = await Store.count();
    const ratings = await Rating.count();
    return res.json({ users, stores, ratings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List users with optional search
router.get('/users', async (req, res) => {
  try {
    const { q } = req.query;
    const where = {};
    if (q) where[Op.or] = [{ name: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }];
    const users = await User.findAll({ where, attributes: ['id','name','email','address','role'] });

    // for owners calculate average rating across their stores
    const out = await Promise.all(users.map(async u => {
      let ownerRating = 0;
      if (u.role === 'owner') {
        const stores = await Store.findAll({ where: { ownerId: u.id } });
        if (stores.length) {
          const storeIds = stores.map(s=>s.id);
          const avgObj = await Rating.findAll({ where: { storeId: storeIds }, attributes: [[fn('AVG', col('rating')),'avgRating']] });
          ownerRating = parseFloat(avgObj[0].get('avgRating')) || 0;
        }
      }
      return { id: u.id, name: u.name, email: u.email, address: u.address, role: u.role, rating: ownerRating };
    }));

    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create user (admin)
router.post('/users', async (req, res) => {
  try {
    const { name, email, address, password, role='user' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email and password required' });
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, address, password: hashed, role });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await User.findOne({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // delete ratings
    await Rating.destroy({ where: { userId: id } });
    // if owner, detach from stores
    await Store.update({ ownerId: null }, { where: { ownerId: id } });
    await user.destroy();
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List stores
router.get('/stores', async (req, res) => {
  try {
    const stores = await Store.findAll();
    const out = await Promise.all(stores.map(async s => {
      const avgObj = await Rating.findAll({ where: { storeId: s.id }, attributes: [[fn('AVG', col('rating')),'avgRating']] });
      const avg = parseFloat(avgObj[0].get('avgRating')) || 0;
      return { id: s.id, name: s.name, email: s.email, address: s.address, ownerId: s.ownerId, rating: Number(avg.toFixed(2)) };
    }));
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create store
router.post('/stores', async (req, res) => {
  try {
    const { name, email, address, ownerId } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    if (ownerId) {
      const owner = await User.findOne({ where: { id: ownerId } });
      if (!owner) return res.status(400).json({ message: 'Owner not found' });
    }
    const store = await Store.create({ name, email, address, ownerId: ownerId || null });
    res.json({ id: store.id, name: store.name, email: store.email, address: store.address, ownerId: store.ownerId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete store
router.delete('/stores/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const store = await Store.findOne({ where: { id } });
    if (!store) return res.status(404).json({ message: 'Store not found' });
    // delete ratings for store
    await Rating.destroy({ where: { storeId: id } });
    await store.destroy();
    res.json({ message: 'Store deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin can set/reset a user's password directly
router.post('/users/:id/reset-by-admin', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'password required' });
    const user = await User.findOne({ where: { id } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Password updated by admin' });
  } catch(err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
