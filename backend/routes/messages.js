const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const auth = require('../middleware/auth');
const { normalizePhone } = require('../lib/phone');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Simple in-memory typing tracker (no websockets).
// key: `${senderId}->${recipientId}` value: lastTypedAt (ms)
const typingMap = new Map();
const TYPING_TTL_MS = 1500;

async function findOrCreateDirectChat(userA, userB) {
  let chat = await Chat.findOne({
    type: 'direct',
    participants: { $all: [userA, userB], $size: 2 }
  });
  if (!chat) {
    chat = await Chat.create({
      type: 'direct',
      participants: [userA, userB],
      lastActivityAt: new Date()
    });
  }
  return chat;
}

async function findGroupForUser(groupId, userId) {
  return Chat.findOne({ _id: groupId, type: 'group', participants: userId });
}

// Setup upload directories
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const videosDir = path.join(uploadsDir, 'videos');
const voicesDir = path.join(uploadsDir, 'voices');
const wallpapersDir = path.join(uploadsDir, 'wallpapers');

[imagesDir, videosDir, voicesDir, wallpapersDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storageFor = (dest) => multer.diskStorage({
  destination: dest,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${req.userId}-${Date.now()}${ext}`);
  }
});

const uploadImage = multer({
  storage: storageFor(imagesDir),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file format for image'));
  }
});

// POST /api/messages/group-avatar-upload (for uploading group avatars during creation)
const uploadGroupAvatar = multer({
  storage: storageFor(imagesDir),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file format for group avatar'));
  }
});

const uploadVideo = multer({
  storage: storageFor(videosDir),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file format for video'));
  }
});

const uploadVoice = multer({
  storage: storageFor(voicesDir),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Mobile browsers can send different but valid audio mimetypes.
    // We accept common types + a safe audio/* fallback.
    const allowed = new Set([
      'audio/webm',
      'audio/mpeg', // mp3
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/ogg',
      'audio/webm;codecs=opus',
    ]);
    if (allowed.has(file.mimetype) || String(file.mimetype || '').startsWith('audio/')) return cb(null, true);
    return cb(new Error('Invalid file format for audio'));
  }
});

const uploadWallpaper = multer({
  storage: storageFor(wallpapersDir),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid wallpaper format'));
  }
});

// GET /api/messages/wallpaper/:contactId
router.get('/wallpaper/:contactId', auth, async (req, res) => {
  try {
    const contactId = req.params.contactId;
    if (!contactId) return res.status(400).json({ error: 'Missing contactId' });
    let chat;
    if (String(contactId).startsWith('group-')) {
      const groupId = String(contactId).replace('group-', '');
      chat = await Chat.findOne({ _id: groupId, type: 'group', participants: req.userId });
      if (!chat) return res.status(404).json({ error: 'Group not found' });
    } else {
      chat = await findOrCreateDirectChat(req.userId, contactId);
    }
    const wallpapers = (chat.metadata && chat.metadata.wallpapers) || {};
    const wallpaper = wallpapers[String(req.userId)] || '';
    return res.json({ chatId: chat._id, wallpaper });
  } catch (err) {
    console.error('[wallpaper get] error', err);
    return res.status(500).json({ error: 'Failed to fetch wallpaper' });
  }
});

// POST /api/messages/wallpaper { recipientId, wallpaper }
router.post('/wallpaper', auth, async (req, res) => {
  try {
    const { recipientId, chatId, wallpaper } = req.body || {};
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, participants: req.userId });
      if (!chat) return res.status(404).json({ error: 'Chat not found' });
    } else {
      if (!recipientId) return res.status(400).json({ error: 'Missing recipientId' });
      chat = await findOrCreateDirectChat(req.userId, recipientId);
    }

    const next = (chat.metadata && typeof chat.metadata === 'object') ? { ...chat.metadata } : {};
    const wallpapers = (next.wallpapers && typeof next.wallpapers === 'object') ? { ...next.wallpapers } : {};
    wallpapers[String(req.userId)] = (wallpaper || '').toString().slice(0, 2048);
    next.wallpapers = wallpapers;

    chat.metadata = next;
    await chat.save();
    return res.json({ ok: true, chatId: chat._id, wallpaper: wallpapers[String(req.userId)] });
  } catch (err) {
    console.error('[wallpaper set] error', err);
    return res.status(500).json({ error: 'Failed to save wallpaper' });
  }
});

// POST /api/messages/wallpaper-upload { recipientId, wallpaper(file) }
router.post('/wallpaper-upload', auth, uploadWallpaper.single('wallpaper'), async (req, res) => {
  try {
    const recipientId = req.body.recipientId;
    const chatId = req.body.chatId;
    if ((!recipientId && !chatId) || !req.file) return res.status(400).json({ error: 'Missing target chat or wallpaper' });
    let chat;
    if (chatId) {
      chat = await Chat.findOne({ _id: chatId, participants: req.userId });
      if (!chat) return res.status(404).json({ error: 'Chat not found' });
    } else {
      chat = await findOrCreateDirectChat(req.userId, recipientId);
    }

    const next = (chat.metadata && typeof chat.metadata === 'object') ? { ...chat.metadata } : {};
    const wallpapers = (next.wallpapers && typeof next.wallpapers === 'object') ? { ...next.wallpapers } : {};
    wallpapers[String(req.userId)] = `/uploads/wallpapers/${req.file.filename}`;
    next.wallpapers = wallpapers;
    chat.metadata = next;
    await chat.save();

    res.json({ ok: true, wallpaper: wallpapers[String(req.userId)] });
  } catch (err) {
    console.error('[wallpaper-upload] error', err);
    if (req.file && req.file.path) try { fs.unlinkSync(req.file.path); } catch (e) { }
    res.status(500).json({ error: err.message || 'Failed to upload wallpaper' });
  }
});

// POST /api/messages/group-avatar-upload { avatar(file) }
router.post('/group-avatar-upload', auth, uploadGroupAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing avatar file' });
    const pathUrl = `/uploads/images/${req.file.filename}`;
    return res.json({ ok: true, avatar: pathUrl });
  } catch (err) {
    console.error('[group-avatar-upload] error', err);
    if (req.file && req.file.path) try { fs.unlinkSync(req.file.path); } catch (e) { }
    return res.status(500).json({ error: err.message || 'Failed to upload group avatar' });
  }
});

// POST /api/messages/typing { recipientId }
router.post('/typing', auth, async (req, res) => {
  try {
    const { recipientId } = req.body || {};
    if (!recipientId) return res.status(400).json({ error: 'Missing recipientId' });
    const key = `${String(req.userId)}->${String(recipientId)}`;
    typingMap.set(key, Date.now());
    return res.json({ ok: true });
  } catch (err) {
    console.error('[typing] error', err);
    return res.status(500).json({ error: 'Failed to set typing' });
  }
});

// POST /api/messages/stop-typing { recipientId }
router.post('/stop-typing', auth, async (req, res) => {
  try {
    const { recipientId } = req.body || {};
    if (!recipientId) return res.status(400).json({ error: 'Missing recipientId' });
    const key = `${String(req.userId)}->${String(recipientId)}`;
    typingMap.delete(key);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[stop-typing] error', err);
    return res.status(500).json({ error: 'Failed to stop typing' });
  }
});

// send message: { identifier, text }
router.post('/send', auth, async (req, res) => {
  try {
    const { identifier, recipientId, text, statusReply } = req.body || {};
    const msgText = (text || '').toString();
    if ((!identifier && !recipientId) || !msgText.trim()) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // find recipient by email / phone / username
    let recipient = null;
    if (recipientId) {
      recipient = await User.findById(recipientId);
    } else {
      const q = String(identifier).trim();
      if (q.includes('@')) {
        recipient = await User.findOne({ email: q.toLowerCase().trim() });
      } else {
        const normalizedPhone = normalizePhone(q);
        recipient = await User.findOne({ phone: normalizedPhone }) || await User.findOne({ username: q });
      }
    }

    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    const chat = await findOrCreateDirectChat(req.userId, recipient._id);
    const msgCreate = {
      sender: req.userId,
      recipient: recipient._id,
      chat: chat._id,
      text: msgText
    };
    // statusReply: accept either status id string or object with _id
    const statusId = (typeof statusReply === 'string') ? statusReply : (statusReply && statusReply._id);
    if (statusId) {
      msgCreate.type = 'statusReply';
      msgCreate.statusReply = statusId;
    }
    const msg = await Message.create(msgCreate);

    chat.lastMessage = msg._id;
    chat.lastActivityAt = new Date();
    await chat.save();

    // Auto-add recipient to sender's contacts if not already present
    const sender = await User.findById(req.userId);
    if (sender) {
      const alreadyExists = sender.contacts.some(c => String(c.user) === String(recipient._id));
      if (!alreadyExists) {
        // Prefer phone number for identification; username is fallback.
        sender.contacts.unshift({ user: recipient._id, displayName: recipient.phone || recipient.username || '' });
        await sender.save();
        console.log('[msg send] auto-added contact:', recipient._id, 'to sender:', req.userId);
      }
    }

    // Log successful send
    console.log('[msg send] from:', req.userId, 'to:', recipient._id, 'identifier:', identifier, 'chat:', chat._id);

    // populate both sides so clients can filter/display reliably
    const populated = await msg.populate('sender recipient', 'username email phone avatar');

    // Note: Messages are now fetched via polling from /inbox endpoint
    // No real-time socket emission needed

    res.json({ message: populated, recipient });
  } catch (err) {
    console.error('[msg send error]', err);
    res.status(500).json({ error: err.message || 'Failed to send message' });
  }
});

// POST /api/messages/groups
// body: { name, memberIds: string[], avatar? }
router.post('/groups', auth, async (req, res) => {
  try {
    const name = (req.body.name || '').toString().trim();
    const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds.map(String) : [];
    if (!name || memberIds.length === 0) return res.status(400).json({ error: 'Missing group data' });

    const participantsSet = new Set([String(req.userId), ...memberIds]);
    const participants = Array.from(participantsSet);
    const chat = await Chat.create({
      type: 'group',
      title: name.slice(0, 80),
      participants,
      avatar: (req.body.avatar || '').toString().slice(0, 2048),
      metadata: {
        groupName: name.slice(0, 80),
        createdBy: req.userId,
      },
      lastActivityAt: new Date()
    });
    return res.json({ group: chat });
  } catch (err) {
    console.error('[groups create] error', err);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// GET /api/messages/groups
router.get('/groups', auth, async (req, res) => {
  try {
    const groups = await Chat.find({ type: 'group', participants: req.userId })
      .sort({ lastActivityAt: -1 })
      .populate('participants', 'username phone avatar')
      .limit(100);
    res.json({ groups });
  } catch (err) {
    console.error('[groups list] error', err);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// POST /api/messages/send-group
// body: { groupId, text }
router.post('/send-group', auth, async (req, res) => {
  try {
    const groupId = req.body.groupId;
    const text = (req.body.text || '').toString();
    if (!groupId || !text.trim()) return res.status(400).json({ error: 'Missing fields' });

    const group = await findGroupForUser(groupId, req.userId);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const msg = await Message.create({
      sender: req.userId,
      recipient: req.userId, // required in schema; group rendering is chat-based.
      chat: group._id,
      text
    });

    group.lastMessage = msg._id;
    group.lastActivityAt = new Date();
    await group.save();
    const populated = await msg.populate('sender recipient', 'username email phone avatar');
    res.json({ message: populated, group });
  } catch (err) {
    console.error('[send-group] error', err);
    res.status(500).json({ error: 'Failed to send group message' });
  }
});

// POST /api/messages/send-image
router.post('/send-image', auth, uploadImage.single('image'), async (req, res) => {
  try {
    const recipientId = req.body.recipientId;
    if (!recipientId || !req.file) return res.status(400).json({ error: 'Missing recipient or file' });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const filePath = `/uploads/images/${req.file.filename}`;
    const chat = await findOrCreateDirectChat(req.userId, recipient._id);
    const msgData = {
      sender: req.userId,
      recipient: recipient._id,
      chat: chat._id,
      type: 'image',
      text: req.body.text || '',
      image: { path: filePath, mime: req.file.mimetype }
    };
    const msg = await Message.create(msgData);
    chat.lastMessage = msg._id;
    chat.lastActivityAt = new Date();
    await chat.save();
    const populated = await msg.populate('sender recipient', 'username email phone avatar');
    console.log('[send-image] Created message:', { _id: msg._id, type: msg.type, hasImage: !!msg.image?.path, path: msg.image?.path });
    res.json({ message: populated });
  } catch (err) {
    console.error('[send-image] error', err && (err.stack || err.message || err));
    if (req.file && req.file.path) try { fs.unlinkSync(req.file.path); } catch (e) { }
    res.status(500).json({ error: err.message || 'Failed to send image' });
  }
});

// POST /api/messages/send-video
router.post('/send-video', auth, uploadVideo.single('video'), async (req, res) => {
  try {
    const recipientId = req.body.recipientId;
    if (!recipientId || !req.file) return res.status(400).json({ error: 'Missing recipient or file' });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const filePath = `/uploads/videos/${req.file.filename}`;
    const chat = await findOrCreateDirectChat(req.userId, recipient._id);
    const msgData = {
      sender: req.userId,
      recipient: recipient._id,
      chat: chat._id,
      type: 'video',
      text: req.body.text || '',
      video: { path: filePath, mime: req.file.mimetype }
    };
    const msg = await Message.create(msgData);
    chat.lastMessage = msg._id;
    chat.lastActivityAt = new Date();
    await chat.save();
    const populated = await msg.populate('sender recipient', 'username email phone avatar');
    console.log('[send-video] Created message:', { _id: msg._id, type: msg.type, hasVideo: !!msg.video?.path, path: msg.video?.path });
    res.json({ message: populated });
  } catch (err) {
    console.error('[send-video] error', err && (err.stack || err.message || err));
    if (req.file && req.file.path) try { fs.unlinkSync(req.file.path); } catch (e) { }
    res.status(500).json({ error: err.message || 'Failed to send video' });
  }
});

// POST /api/messages/send-voice
router.post('/send-voice', auth, uploadVoice.single('voice'), async (req, res) => {
  try {
    const recipientId = req.body.recipientId;
    if (!recipientId || !req.file) return res.status(400).json({ error: 'Missing recipient or file' });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });

    const filePath = `/uploads/voices/${req.file.filename}`;
    const chat = await findOrCreateDirectChat(req.userId, recipient._id);
    const msgData = {
      sender: req.userId,
      recipient: recipient._id,
      chat: chat._id,
      type: 'audio',
      text: req.body.text || '',
      audio: { path: filePath, mime: req.file.mimetype }
    };
    const msg = await Message.create(msgData);
    chat.lastMessage = msg._id;
    chat.lastActivityAt = new Date();
    await chat.save();
    const populated = await msg.populate('sender recipient', 'username email phone avatar');
    console.log('[send-voice] Created message:', { _id: msg._id, type: msg.type, hasAudio: !!msg.audio?.path, path: msg.audio?.path });
    res.json({ message: populated });
  } catch (err) {
    console.error('[send-voice] error', err && (err.stack || err.message || err));
    if (req.file && req.file.path) try { fs.unlinkSync(req.file.path); } catch (e) { }
    res.status(500).json({ error: err.message || 'Failed to send voice' });
  }
});

// GET /api/messages/debug/:messageId - debug endpoint to check message structure
router.get('/debug/:messageId', auth, async (req, res) => {
  try {
    const msg = await Message.findById(req.params.messageId).populate('sender recipient', 'username email phone avatar');
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json({
      _id: msg._id,
      type: msg.type,
      text: msg.text,
      sender: msg.sender?._id,
      recipient: msg.recipient?._id,
      image: msg.image,
      video: msg.video,
      audio: msg.audio,
      createdAt: msg.createdAt,
      rawDoc: msg.toObject()
    });
  } catch (err) {
    console.error('[debug] error', err);
    res.status(500).json({ error: err.message });
  }
});

// get conversations/messages for authenticated user
router.get('/inbox', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const groups = await Chat.find({ type: 'group', participants: userId }).select('_id');
    const groupIds = groups.map(g => g._id);
    const msgs = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }, { chat: { $in: groupIds } }],
      deletedFor: { $ne: userId }
    })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('sender recipient', 'username email phone avatar')
      .populate('statusReply', 'type text media caption createdAt');

    res.json({ messages: msgs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/delete
// body: { messageIds: string[], forEveryone?: boolean }
router.post('/delete', auth, async (req, res) => {
  try {
    const { messageIds, forEveryone } = req.body || {};
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'messageIds required' });
    }

    const ids = messageIds.map(String);
    const me = String(req.userId);

    if (forEveryone) {
      // Only sender can delete for everyone.
      const result = await Message.updateMany(
        { _id: { $in: ids }, sender: me },
        {
          $set: {
            deletedForEveryone: true,
            text: '',
            type: 'text',
            image: { path: '', mime: '' },
            video: { path: '', mime: '' },
            audio: { path: '', mime: '' },
            media: { mediaId: null, url: '', mime: '', filename: '', size: 0 }
          }
        }
      );
      return res.json({ ok: true, mode: 'everyone', modified: result.modifiedCount || 0 });
    }

    const result = await Message.updateMany(
      { _id: { $in: ids } },
      { $addToSet: { deletedFor: req.userId } }
    );
    return res.json({ ok: true, mode: 'me', modified: result.modifiedCount || 0 });
  } catch (err) {
    console.error('[delete] error', err);
    res.status(500).json({ error: 'Failed to delete messages' });
  }
});

// GET /api/messages/typing-status/:id - simple polling endpoint
router.get('/typing-status/:id', auth, async (req, res) => {
  try {
    const contactId = req.params.id;
    if (!contactId) return res.status(400).json({ error: 'Missing contact id' });
    const key = `${String(contactId)}->${String(req.userId)}`;
    const last = typingMap.get(key);
    const isTyping = typeof last === 'number' && (Date.now() - last) <= TYPING_TTL_MS;
    // cleanup stale
    if (!isTyping && last) typingMap.delete(key);
    res.json({ isTyping });
  } catch (err) {
    console.error('[typing-status] error', err);
    res.status(500).json({ error: 'Failed to fetch typing status' });
  }
});

// POST /api/messages/read-bulk - mark all messages from contact as read
router.post('/read-bulk', auth, async (req, res) => {
  try {
    const contactId = req.body.contactId;
    if (!contactId) return res.status(400).json({ error: 'Missing contactId' });

    await Message.updateMany({ sender: contactId, recipient: req.userId, read: { $ne: true } }, { $set: { read: true } });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[read-bulk] error', err && (err.stack || err.message || err));
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = router;
