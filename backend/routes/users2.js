const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const ContactOverride = require('../models/ContactOverride');
const multer = require('multer');
const path = require('path');
const { normalizePhone } = require('../lib/phone');

// Multer storage for avatar uploads
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${req.userId}-${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

const router = express.Router();

// Get current user's contacts (populate basic info)
router.get('/contacts', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).populate('contacts.user', 'username phone email avatar lastLogout');
    if (!me) return res.status(404).json({ error: 'User not found' });
    const contacts = (me.contacts || []).map(c => ({ _id: c.user?._id, username: c.user?.username, phone: c.user?.phone, email: c.user?.email, avatar: c.user?.avatar, displayName: c.displayName, lastLogout: c.user?.lastLogout }));
    res.json({ contacts });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add or update a contact by identifier (phone/username/email).
router.post('/contacts', auth, async (req, res) => {
  try {
    const identifier = req.body.identifier;
    const displayName = req.body.displayName;
    if (!identifier) return res.status(400).json({ error: 'Missing identifier' });

    let target = null;
    if (identifier.includes && identifier.includes('@')) target = await User.findOne({ email: identifier.toLowerCase().trim() });
    else {
      const norm = require('../lib/phone').normalizePhone(identifier);
      const digitsOnly = String(identifier).replace(/[^0-9]/g, '');
      target = await User.findOne({ phone: norm })
        || await User.findOne({ phone: digitsOnly })
        || await User.findOne({ phone: { $regex: new RegExp(digitsOnly.slice(-9) + '$') } })
        || await User.findOne({ username: identifier });
      if (!target) console.log('[users2] contact lookup failed for', identifier, 'norm:', norm, 'digits:', digitsOnly);
    }
    if (!target) return res.status(404).json({ error: 'User not found' });

    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: 'Current user not found' });

    // check if already present
    const existing = me.contacts.find(c => String(c.user) === String(target._id));
    if (existing) {
      if (displayName) existing.displayName = displayName;
    } else {
      me.contacts.unshift({ user: target._id, displayName });
    }

    await me.save();
    res.json({
      user: {
        _id: target._id,
        username: target.username,
        phone: target.phone,
        email: target.email,
        avatar: target.avatar || ''
      },
      displayName
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/users/contacts/:contactId
router.delete('/contacts/:contactId', auth, async (req, res) => {
  try {
    const contactId = req.params.contactId;
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: 'User not found' });
    me.contacts = (me.contacts || []).filter(c => String(c.user) !== String(contactId));
    await me.save();
    await ContactOverride.deleteOne({ owner: req.userId, target: contactId });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/user-details/:id
router.get('/user-details/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('_id username phone email about avatar lastLogout');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/contacts/override/:targetId
router.get('/contacts/override/:targetId', auth, async (req, res) => {
  try {
    const targetId = req.params.targetId;
    const override = await ContactOverride.findOne({ owner: req.userId, target: targetId });
    res.json({ override: override ? override.toObject() : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/contacts/override/:targetId
// Body: { displayName, phone }
router.put('/contacts/override/:targetId', auth, async (req, res) => {
  try {
    const targetId = req.params.targetId;
    const displayName = (req.body.displayName || '').toString().trim().slice(0, 80);
    const phone = req.body.phone ? normalizePhone(req.body.phone) : '';

    const override = await ContactOverride.findOneAndUpdate(
      { owner: req.userId, target: targetId },
      { $set: { displayName, phone } },
      { upsert: true, new: true }
    );

    res.json({ override: override.toObject() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark user as online
router.post('/online', auth, async (req, res) => {
  try {
    const onlineUsers = req.app.get('onlineUsers');
    if (!onlineUsers) return res.status(500).json({ error: 'Server not ready' });
    onlineUsers.add(String(req.userId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark user as offline
router.post('/offline', auth, async (req, res) => {
  try {
    const onlineUsers = req.app.get('onlineUsers');
    if (!onlineUsers) return res.status(500).json({ error: 'Server not ready' });
    onlineUsers.delete(String(req.userId));
    
    // Save lastLogout timestamp to database
    await User.findByIdAndUpdate(req.userId, { lastLogout: new Date() });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get online status of multiple users (comma-separated IDs)
router.get('/online-status', auth, async (req, res) => {
  try {
    const onlineUsers = req.app.get('onlineUsers');
    if (!onlineUsers) return res.json({ online: [], users: {} });

    const userIds = (req.query.userIds || '').split(',').filter(id => id.trim());
    const online = userIds.filter(id => onlineUsers.has(id.trim()));
    
    // Fetch lastLogout data for all users
    const users = {};
    const userDocs = await User.find({ _id: { $in: userIds } }, '_id lastLogout');
    for (const doc of userDocs) {
      users[String(doc._id)] = { lastLogout: doc.lastLogout };
    }

    res.json({ online, users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user's profile
router.get('/profile', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: 'User not found' });
    const user = {
      _id: me._id,
      username: me.username,
      phone: me.phone,
      email: me.email,
      about: me.about || '',
      avatar: me.avatar || ''
    };
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile (about + avatar upload)
router.put('/profile', auth, upload.single('avatar'), async (req, res) => {
  try {
    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: 'User not found' });

    if (req.body.about !== undefined) me.about = String(req.body.about).slice(0, 2000);
    if (req.file) {
      // store relative path to uploads
      me.avatar = `/uploads/${req.file.filename}`;
    }

    await me.save();
    res.json({ user: { _id: me._id, username: me.username, phone: me.phone, email: me.email, about: me.about, avatar: me.avatar } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

