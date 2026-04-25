const express = require('express');
const router = express.Router();
const Charity = require('../models/Charity');

// Get all charities
router.get('/', async (req, res) => {
  try {
    const charities = await Charity.find({ verificationStatus: 'verified' });
    res.json(charities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get charity by ID
router.get('/:id', async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);
    if (!charity) {
      return res.status(404).json({ error: 'Charity not found' });
    }
    res.json(charity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create charity (admin only)
router.post('/', async (req, res) => {
  try {
    const charity = new Charity(req.body);
    await charity.save();
    res.status(201).json(charity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request to add charity (public)
router.post('/request', async (req, res) => {
  try {
    const { charityName, description, category, website, contactEmail, contactName, reason } = req.body;

    // Validation
    if (!charityName || !description || !category || !contactEmail || !contactName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (description.length < 50) {
      return res.status(400).json({ error: 'Description must be at least 50 characters' });
    }

    // Check if charity already exists
    const existing = await Charity.findOne({ name: charityName });
    if (existing) {
      return res.status(400).json({ error: 'A charity with this name already exists' });
    }

    // Create charity with pending status
    const newCharity = new Charity({
      name: charityName,
      description: description,
      category: category,
      website: website || '',
      verificationStatus: 'pending',
      totalDonations: 0,
      donationCount: 0,
      submittedBy: {
        name: contactName,
        email: contactEmail,
        submissionReason: reason,
        submittedAt: new Date()
      }
    });

    await newCharity.save();

    // Send success response
    res.status(201).json({
      message: 'Charity submission received successfully',
      charity: newCharity,
      status: 'pending_review'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;