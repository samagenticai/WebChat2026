const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'statusReply'],
    default: 'text'
  },
  text: { type: String, default: '' },
  image: {
    path: { type: String, default: '' },
    mime: { type: String, default: '' }
  },
  video: {
    path: { type: String, default: '' },
    mime: { type: String, default: '' }
  },
  audio: {
    path: { type: String, default: '' },
    mime: { type: String, default: '' }
  },
  media: {
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    url: { type: String, default: '' },
    mime: { type: String, default: '' },
    filename: { type: String, default: '' },
    size: { type: Number, default: 0 }
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  statusReply: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status',
    default: null
  },
  deletedForEveryone: { type: Boolean, default: false, index: true },
  deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, index: true },
  // NOTE: Messages must NOT auto-expire. (Statuses have 24h TTL, not chats.)
});

// (Intentionally no TTL index for chat messages.)

module.exports = mongoose.model('Message', MessageSchema);
