const mongoose = require('mongoose');

const StatusSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video'],
    required: true,
    index: true
  },
  text: { type: String, default: '' }, // for text status
  media: {
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    path: { type: String, default: '' },
    mime: { type: String, default: '' },
    duration: { type: Number, default: null }
  },
  caption: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, index: true },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
    index: true
  },
  viewers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      viewedAt: { type: Date, default: Date.now }
    }
  ]
});

// TTL index: automatically delete status documents after expiresAt
StatusSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Status', StatusSchema);
