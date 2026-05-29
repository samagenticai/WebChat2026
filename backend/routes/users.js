const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get current user's contacts (populate basic info)
router.get('/contacts', auth, async (req, res) => {
  try{
    const me = await User.findById(req.userId).populate('contacts.user', 'username phone email');
    if (!me) return res.status(404).json({ error: 'User not found' });
    const contacts = (me.contacts || []).map(c => ({ _id: c.user?._id, username: c.user?.username, phone: c.user?.phone, email: c.user?.email, displayName: c.displayName }));
    res.json({ contacts });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Add or update a contact by identifier (phone/username/email).
router.post('/contacts', auth, async (req, res) => {
  try{
    const identifier = req.body.identifier;
    const displayName = req.body.displayName;
    if (!identifier) return res.status(400).json({ error: 'Missing identifier' });

    let target = null;
\d+]/g,'') }) || await User.findOne({ username: identifier });
      if (identifier.includes && identifier.includes('@')) target = await User.findOne({ email: identifier.toLowerCase().trim() });
      else target = await User.findOne({ phone: identifier.replace(/[^\d+]/g,'') }) || await User.findOne({ username: identifier });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ error: 'Current user not found' });

    // check if already present
    const existing = me.contacts.find(c => String(c.user) === String(target._id));
    if (existing){
      if (displayName) existing.displayName = displayName;
    } else {
      me.contacts.unshift({ user: target._id, displayName });
    }

    await me.save();
    res.json({ user: target, displayName });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;
