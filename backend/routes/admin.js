const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const User = require('../models/User');
const Donation = require('../models/Donation');
const Charity = require('../models/Charity');

// All admin routes require authentication and admin role
router.use(auth);

router.use((req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

// Dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const charitiesCount = await Charity.countDocuments();
    const donationsCount = await Donation.countDocuments();
    const totalDonations = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      usersCount,
      charitiesCount,
      donationsCount,
      totalDonated: totalDonations[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load summary' });
  }
});

// List users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// List donations
router.get('/donations', async (req, res) => {
  try {
    const donations = await Donation.find().populate('charity');
    res.json(donations);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch donations' });
  }
});

// List charities
// List charities with optional search, status filter and pagination
router.get('/charities', async (req, res) => {
  try {
    const { q, status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status && ['pending', 'verified', 'rejected'].includes(status)) {
      filter.verificationStatus = status;
    }

    if (q) {
      const re = new RegExp(q, 'i');
      filter.$or = [
        { name: re },
        { description: re },
        { 'submittedBy.name': re },
        { 'submittedBy.email': re }
      ];
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const perPage = Math.min(parseInt(limit, 10) || 10, 100);

    const total = await Charity.countDocuments(filter);
    const charities = await Charity.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage);

    res.json({ data: charities, total, page: pageNum, limit: perPage });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch charities' });
  }
});

// Verify or update charity status
router.put('/charities/:id/verify', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const charity = await Charity.findByIdAndUpdate(req.params.id, { verificationStatus: status }, { new: true });
    res.json(charity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update charity' });
  }
});

module.exports = router;
