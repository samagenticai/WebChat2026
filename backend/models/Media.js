const mongoose = require('mongoose');

const MediaSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null
  },
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Status',
    default: null
  },
  type: {
    type: String,
    enum: ['image', 'video', 'audio', 'file'],
    required: true
  },
  path: {
    type: String,
    required: true
  },
  mime: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    default: ''
  },
  size: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

MediaSchema.index({ owner: 1, type: 1 });

module.exports = mongoose.model('Media', MediaSchema);
