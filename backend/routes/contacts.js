const express = require('express');
const auth = require('../middleware/auth');
const Contact = require('../models/Contact');

const router = express.Router();

// GET /api/contacts
// Fetch all saved contacts for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts
// Save a contact with a user-defined customName (never auto-filled from real identity)
router.post('/', auth, async (req, res) => {
  try {
    const { customName, phoneNumber } = req.body;

    if (!customName || !phoneNumber) {
      return res.status(400).json({ error: 'customName and phoneNumber are required' });
    }

    // If same phoneNumber already saved by this user, update the customName only
    let existing = await Contact.findOne({ userId: req.userId, phoneNumber });
    if (existing) {
      existing.customName = customName;
      await existing.save();
      return res.json({ contact: existing });
    }

    const newContact = new Contact({
      userId: req.userId,
      customName,
      phoneNumber
    });

    await newContact.save();
    res.status(201).json({ contact: newContact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
