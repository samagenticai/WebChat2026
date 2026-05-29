const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customName: { type: String, required: true },   // user-defined label, never auto-filled
  phoneNumber: { type: String, required: true },  // real phone number (immutable identity)
}, { timestamps: true });

module.exports = mongoose.model('Contact', ContactSchema);
