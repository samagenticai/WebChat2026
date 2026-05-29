const mongoose = require('mongoose');

const ContactOverrideSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  displayName: { type: String, default: '' },
  phone: { type: String, default: '' },
}, { timestamps: true });

// One override per owner-target
ContactOverrideSchema.index({ owner: 1, target: 1 }, { unique: true });

module.exports = mongoose.model('ContactOverride', ContactOverrideSchema);