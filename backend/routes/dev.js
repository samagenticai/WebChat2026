const express = require('express');
const devSms = require('../lib/devSms');
const Otp = require('../models/Otp');
const User = require('../models/User');
const Message = require('../models/Message');
const mongoose = require('mongoose');
const router = express.Router();

// simple ping to verify server reachable
router.get('/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// list recent simulated messages
router.get('/messages', (req, res) => {
  const to = req.query.to;
  const msgs = devSms.list({ to });
  res.json({ messages: msgs });
});

// list recent OTP records (dev only)
router.get('/otps', async (req, res) => {
  try{
    const q = {};
    if (req.query.userId) q.user = req.query.userId;
    const docs = await Otp.find(q).sort({ createdAt: -1 }).limit(50).populate('user', 'username email phone');
    res.json({ otps: docs });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// optionally look up user by identifier
router.get('/user-by-identifier', async (req, res) => {
  try{
    const id = req.query.identifier;
    if (!id) return res.status(400).json({ error: 'Missing identifier' });
    let user = null;
    if (id.includes('@')) user = await User.findOne({ email: id.toLowerCase().trim() });
    else user = await User.findOne({ phone: id.replace(/[^\d+]/g,'') });
    if (!user) return res.status(404).json({ error: 'not found' });
    res.json({ user });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Dev: report DB connection state and collection counts
router.get('/db-status', async (req, res) => {
  try{
    const state = mongoose.connection.readyState; // 0 disconnected, 1 connected
    const out = { readyState: state };
    if (state === 1){
      out.userCount = await User.countDocuments();
      out.messageCount = await Message.countDocuments();
    }
    res.json(out);
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Dev: list undelivered messages for a user id (admin/dev use)
router.get('/undelivered', async (req, res) => {
  try{
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId query param' });
    const docs = await Message.find({ recipient: userId, delivered: false }).sort({ createdAt: 1 }).populate('sender', 'username phone email');
    res.json({ undelivered: docs });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Dev: list currently connected socket rooms and sizes (helpful to see who's online)
router.get('/sockets', (req, res) => {
  try{
    const io = req.app.get('io');
    if (!io) return res.status(500).json({ error: 'io not initialized' });
    const rooms = [];
    for (const [roomName, s] of io.sockets.adapter.rooms){
      rooms.push({ room: roomName, size: s.size });
    }
    res.json({ rooms });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

module.exports = router;
