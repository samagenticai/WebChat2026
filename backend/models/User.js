const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  displayName: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  // Display name (NOT unique). Phone number is the unique identifier.
  username: { type: String, required: true, trim: true },
  email: { type: String, required: false, unique: true, sparse: true, trim: true, lowercase: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: false },
  isVerified: { type: Boolean, default: false },
  about: { type: String, default: '' },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastLogout: { type: Date, default: null },
  contacts: [ContactSchema]
});

UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ phone: 1 }, { unique: true });

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', UserSchema);
