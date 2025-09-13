
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Op, fn, col } = require('sequelize');
const Store = require('../models/Store');
const Rating = require('../models/Rating');
const User = require('../models/User');

// List stores (auth optional)
router.get('/', auth, async (req, res) => {
  const { name, address, sortBy = 'name', order = 'ASC' } = req.query;
  const where = {};
  if (name) where.name = { [Op.like]: `%${name}%` };
  if (address) where.address = { [Op.like]: `%${address}%` };

  try {
    const stores = await Store.findAll({ where, order: [[sortBy, order.toUpperCase()]] });
    const result = await Promise.all(stores.map(async s => {
      const avgRow = await Rating.findAll({ where: { storeId: s.id }, attributes: [[fn('AVG', col('rating')),'avgRating']] });
      const avg = parseFloat(avgRow[0].get('avgRating')) || 0;
      let userRating = null;
      if (req.user) {
        const my = await Rating.findOne({ where: { storeId: s.id, userId: req.user.id }});
        if (my) userRating = my.rating;
      }
      return { id: s.id, name: s.name, email: s.email, address: s.address, ownerId: s.ownerId, average: Number(avg.toFixed(2)), myRating: userRating };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get store details
router.get('/:id', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ where: { id: req.params.id }});
    if (!store) return res.status(404).json({ message: 'Store not found' });
    const ratings = await Rating.findAll({ where: { storeId: store.id }, include: [{ model: User, attributes: ['id','name','email'] }] });
    const avgRow = await Rating.findAll({ where: { storeId: store.id }, attributes: [[fn('AVG', col('rating')),'avgRating']] });
    const avg = parseFloat(avgRow[0].get('avgRating')) || 0;
    const my = req.user ? await Rating.findOne({ where: { storeId: store.id, userId: req.user.id }}) : null;
    res.json({ store, average: Number(avg.toFixed(2)), ratings, myRating: my ? my.rating : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Owner or admin can create store
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, address } = req.body;
    if (!name) return res.status(400).json({ message: 'name required' });
    let ownerId = null;
    if (req.user.role === 'owner' || req.user.role === 'admin') ownerId = req.user.id;
    const store = await Store.create({ name, email, address, ownerId });
    res.json({ id: store.id, name: store.name, email: store.email, address: store.address, ownerId: store.ownerId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate a store (user)
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const store = await Store.findOne({ where: { id: req.params.id }});
    if (!store) return res.status(404).json({ message: 'Store not found' });
    const { rating } = req.body;
    const r = parseInt(rating);
    if (!r || r < 1 || r > 5) return res.status(400).json({ message: 'Rating must be 1-5' });

    // upsert rating
    const existing = await Rating.findOne({ where: { storeId: store.id, userId: req.user.id }});
    if (existing) {
      existing.rating = r;
      await existing.save();
      return res.json({ message: 'Rating updated' });
    } else {
      await Rating.create({ storeId: store.id, userId: req.user.id, rating: r });
      return res.json({ message: 'Rating created' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
