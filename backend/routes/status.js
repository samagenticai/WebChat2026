const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Status = require('../models/Status');
const Message = require('../models/Message');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer storage for status uploads
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const statusDir = path.join(uploadsDir, 'statuses');

// Create statuses directory if it doesn't exist
if (!fs.existsSync(statusDir)) {
  fs.mkdirSync(statusDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: statusDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${req.userId}-${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

const router = express.Router();

function toLegacyStatus(doc) {
  const s = doc && typeof doc.toObject === 'function' ? doc.toObject() : (doc || {});
  // Keep new shape (type/media/user) but also provide old keys used by frontend.
  const filePath = s?.media?.path || '';
  const fileType = s?.type === 'image' || s?.type === 'video' ? s.type : (s?.media?.mime?.startsWith('video') ? 'video' : 'image');
  return {
    ...s,
    userId: s.user,
    filePath,
    fileType,
    duration: s?.media?.duration ?? null,
  };
}

// POST /api/status/upload
// Supports:
// - multipart/form-data with `file` (image/video) + optional caption + optional duration for videos
// - application/json with `{ text }` for text status
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    const caption = (req.body.caption || '').toString().trim();
    const text = (req.body.text || '').toString().trim();

    // Text status (no file)
    if (!req.file) {
      if (!text) return res.status(400).json({ error: 'Provide a file or text' });
      const status = await Status.create({
        user: req.userId,
        type: 'text',
        text: text.slice(0, 2000),
        caption
      });
      return res.json({ status });
    }

    const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    const filePath = `/uploads/statuses/${req.file.filename}`;

    let duration = null;
    if (type === 'video') {
      duration = Number(req.body.duration);
      if (!duration || duration > 60) {
        try { if (req.file && req.file.path) fs.unlinkSync(req.file.path); } catch (e) {}
        return res.status(400).json({ error: 'Video must be 60 seconds or less' });
      }
    }

    const status = await Status.create({
      user: req.userId,
      type,
      caption,
      media: {
        path: filePath,
        mime: req.file.mimetype,
        duration
      }
    });

    return res.json({ status });
  } catch (err) {
    try { if (req.file && req.file.path) fs.unlinkSync(req.file.path); } catch (e) { console.warn('[status upload] cleanup unlink failed', e && e.message); }
    console.error('[status upload error]', err && (err.stack || err.message || err));
    // If multer fileFilter triggered an error, surface a friendly message
    if (err && err.message && err.message.includes('Only image and video files')) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Failed to upload status' });
  }
});

// GET /api/status/feed - Get statuses from users in your contacts
router.get('/feed', auth, async (req, res) => {
  try {
    // Get current user with their contacts
    const currentUser = await User.findById(req.userId).populate('contacts.user', '_id');
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get IDs of all users in current user's contacts
    const myContactIds = (currentUser.contacts || []).map(c => c.user?._id).filter(Boolean);

    // Also include users who have the current user in their contacts
    const usersWhoSavedMe = await User.find({ 'contacts.user': req.userId }).select('_id');
    const savedMeIds = (usersWhoSavedMe || []).map(u => u._id).filter(Boolean);

    // Union of both sets: users I saved and users who saved me
    const allowedIdsSet = new Set([...myContactIds.map(String), ...savedMeIds.map(String)]);
    const allowedIds = Array.from(allowedIdsSet);

    if (allowedIds.length === 0) {
      return res.json({ statuses: [] });
    }

    // Get statuses from allowed users (not yet expired)
    const statuses = await Status.find({
      user: { $in: allowedIds },
      expiresAt: { $gt: new Date() }
    })
      .populate('user', 'username email phone avatar about')
      .select('_id user type text media caption createdAt expiresAt viewers')
      .sort({ createdAt: -1 });

    console.log('[status feed] returning', statuses.length, 'statuses');
    res.json({ statuses: statuses.map(toLegacyStatus) });
  } catch (err) {
    console.error('[status feed error]', err);
    res.status(500).json({ error: err.message || 'Failed to fetch status feed' });
  }
});

// GET /api/status/my - Get current user's statuses
router.get('/my', auth, async (req, res) => {
  try {
    const statuses = await Status.find({
      user: req.userId,
      expiresAt: { $gt: new Date() }
    })
      .select('_id user type text media caption createdAt expiresAt viewers')
      .sort({ createdAt: -1 });

    res.json({ statuses: statuses.map(toLegacyStatus) });
  } catch (err) {
    console.error('[status my error]', err);
    res.status(500).json({ error: err.message || 'Failed to fetch your statuses' });
  }
});

// GET /api/status/:id - Get single status details with viewers
router.get('/:id', auth, async (req, res) => {
  try {
    const statusId = req.params.id;
    
    const status = await Status.findById(statusId)
      .populate('viewers.user', 'username avatar')
      .populate('user', 'username avatar email');

    if (!status) {
      return res.status(404).json({ error: 'Status not found' });
    }

    // Check if status has expired
    if (status.expiresAt && new Date() > status.expiresAt) {
      return res.status(404).json({ error: 'Status has expired' });
    }

    res.json({ status: toLegacyStatus(status) });
  } catch (err) {
    console.error('[status get error]', err);
    res.status(500).json({ error: err.message || 'Failed to fetch status' });
  }
});

// POST /api/status/:id/view - Mark status as viewed
router.post('/:id/view', auth, async (req, res) => {
  try {
    const statusId = req.params.id;
    const userId = req.userId;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: 'Status not found' });
    }

    // Check if user already viewed this status
    const alreadyViewed = status.viewers.some(v => String(v.user) === String(userId));
    
    if (!alreadyViewed) {
      // Add user to viewers list
      status.viewers.push({
        user: userId,
        viewedAt: new Date()
      });
      await status.save();
    }

    // Return status with viewer info
    const populatedStatus = await Status.findById(statusId)
      .populate('viewers.user', 'username avatar');

    res.json({
      success: true,
      status: toLegacyStatus(populatedStatus),
      viewerCount: populatedStatus.viewers.length
    });
  } catch (err) {
    console.error('[status view error]', err);
    res.status(500).json({ error: err.message || 'Failed to mark status as viewed' });
  }
});

// DELETE /api/status/:id - Delete a status (only by owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status) {
      return res.status(404).json({ error: 'Status not found' });
    }

    if (String(status.user) !== String(req.userId)) {
      return res.status(403).json({ error: 'Cannot delete other user\'s status' });
    }

    // Delete file from disk
    const rel = status?.media?.path;
    if (rel && rel.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', 'public', rel.substring(1));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Status.deleteOne({ _id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    console.error('[status delete error]', err);
    res.status(500).json({ error: err.message || 'Failed to delete status' });
  }
});

// GET /api/status/:id/replies - Get all replies to a specific status
router.get('/:id/replies', auth, async (req, res) => {
  try {
    const statusId = req.params.id;
    
    // Verify status exists and belongs to current user
    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ error: 'Status not found' });
    }

    if (String(status.user) !== String(req.userId)) {
      return res.status(403).json({ error: 'Can only view replies to your own status' });
    }

    // Find all messages that have a statusReply matching this status
    const replies = await Message.find({
      recipient: req.userId,
      statusReply: status._id
    })
      .populate('sender', 'username avatar displayName phone')
      .select('_id text sender statusReply createdAt')
      .sort({ createdAt: -1 });

    res.json({ 
      statusId,
      replyCount: replies.length,
      replies 
    });
  } catch (err) {
    console.error('[status replies error]', err);
    res.status(500).json({ error: err.message || 'Failed to fetch replies' });
  }
});

module.exports = router;
