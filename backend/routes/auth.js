const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const { normalizePhone } = require('../lib/phone');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

function normalizePhoneInput(raw){
  if (!raw) return raw;
  let s = String(raw).trim();
  // remove common formatting
  s = s.replace(/[^0-9+]/g, '');
  // if starts with 0 and looks like local Pakistani number, prefix +92
  if (/^0[3-9][0-9]{8}$/.test(s)) return '+92' + s.slice(1);
  // if 10 digits without leading 0 (e.g. 3001234567) treat as +92
  if (/^[2-9][0-9]{9}$/.test(s)) return '+92' + s;
  // already in E.164 or has +
  if (/^\+\d{8,15}$/.test(s)) return s;
  return s;
}

function genCode(digits = 4){
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
}

// helper to send via Twilio if configured; when not configured, push to dev SMS store
const devSms = require('../lib/devSms');
async function sendOtp(to, text){
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN){
    // simulate send in dev: store message so dev UI can read it
    const rec = devSms.push({ to, text });
    return { sent: true, sid: `dev-${rec.id}`, dev: true };
  }
  const client = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  const from = TWILIO_PHONE_NUMBER || TWILIO_WHATSAPP_NUMBER;
  try{
    const msg = await client.messages.create({ body: text, from, to });
    return { sent: true, sid: msg.sid };
  }catch(err){ return { sent: false, error: err.message }; }
}

// Signup with password (classic)
router.post('/signup', async (req, res) => {
  try{
    const body = req.body || {};
    const username = body.username;
    const email = body.email || body.identifier;
    const phone = body.phone || body.identifier;
    const password = body.password;
    if (!username || !phone || !password) return res.status(400).json({ error: 'Missing fields' });
    const normalizedUsername = String(username).trim();
    const normalizedEmail = email ? String(email).toLowerCase().trim() : undefined;
    const normalizedPhone = phone ? normalizePhone(phone) : undefined;
    
    console.log('[signup] Raw phone:', phone, 'Normalized:', normalizedPhone);
    
    // check duplicates and provide friendly errors
    if (normalizedEmail && await User.findOne({ email: normalizedEmail })) return res.status(400).json({ error: 'Email already registered' });
    if (normalizedPhone && await User.findOne({ phone: normalizedPhone })) return res.status(400).json({ error: 'Phone already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const userData = { username: normalizedUsername, password: hashed, isVerified: true };
    if (normalizedEmail) userData.email = normalizedEmail;
    if (normalizedPhone) userData.phone = normalizedPhone;
    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: user.toJSON(), token });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Login with password (accepts `identifier` or legacy `phone`/`email`/`username`)
router.post('/login', async (req, res) => {
  try{
    const body = req.body || {};
    const password = body.password;
    const identifier = body.identifier || body.phone || body.email || body.username;
    if (!identifier || !password) return res.status(400).json({ error: 'Missing fields' });
    const q = String(identifier).trim();
    let user = null;
    
    // Try email first
    if (q.includes('@')) {
      user = await User.findOne({ email: q.toLowerCase().trim() });
    } else {
      // Try normalized phone
      const normalizedPhone = normalizePhone(q);
      console.log('[login] Raw identifier:', q, 'Normalized phone:', normalizedPhone);
      user = await User.findOne({ phone: normalizedPhone });
      
      // Also try searching with any phone format for compatibility
      if (!user && /^\d+/.test(q)) {
        const digitsOnly = q.replace(/[^\d]/g, '');
        user = await User.findOne({ 
          $or: [
            { phone: { $regex: new RegExp(digitsOnly.slice(-9) + '$') } },
            { phone: digitsOnly },
            { phone: normalizePhone(digitsOnly) }
          ]
        });
      }
    }
    
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: user.toJSON(), token });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Register and send OTP
router.post('/register-otp', async (req, res) => {
  try{
    const body = req.body || {};
    const username = body.username;
    const email = body.email || body.identifier;
    const phone = body.phone || body.identifier;
    const password = body.password;
    if (!username || !phone || !password) return res.status(400).json({ error: 'Missing fields' });
    const normalizedUsername = String(username).trim();
    const normalizedEmail = email ? String(email).toLowerCase().trim() : undefined;
    const normalizedPhone = phone ? normalizePhone(phone) : undefined;
    
    // prevent duplicates
    if (normalizedEmail && await User.findOne({ email: normalizedEmail })) return res.status(400).json({ error: 'Email already registered' });
    if (normalizedPhone && await User.findOne({ phone: normalizedPhone })) return res.status(400).json({ error: 'Phone already registered' });
    // create user as unverified
    const hashed = await bcrypt.hash(password, 10);
    const userData = { username: normalizedUsername, password: hashed, isVerified: false };
    if (normalizedEmail) userData.email = normalizedEmail;
    if (normalizedPhone) userData.phone = normalizedPhone;
    const user = await User.create(userData);
    const code = genCode(4);
    const expiresAt = new Date(Date.now() + 5*60*1000);
    const codeHash = await bcrypt.hash(code, 10);
    await Otp.create({ user: user._id, codeHash, expiresAt });
    const dest = normalizedPhone ? normalizePhoneInput(normalizedPhone) : normalizedEmail;
    const text = `Your verification code is ${code}`;
    const sent = await sendOtp(dest, text);
    // If dev-mode send (no Twilio), return OTP in response for easy testing and expose dev flag
    if (sent && sent.dev) return res.json({ success: true, otp: code, dev: true });
    if (sent && sent.sent) return res.json({ success: true, message: 'OTP sent' });
    return res.json({ success: true, otp: code, warning: sent.warning || sent.error });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Verify OTP for registration
router.post('/verify-otp', async (req, res) => {
  try{
    const { identifier, otp } = req.body || {};
    if (!identifier || !otp) return res.status(400).json({ error: 'Missing fields' });
    const q = String(identifier).trim();
    let user = null;
    if (q.includes('@')) {
      user = await User.findOne({ email: q.toLowerCase().trim() });
    } else {
      const normalizedPhone = normalizePhone(q);
      user = await User.findOne({ phone: normalizedPhone });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    const record = await Otp.findOne({ user: user._id, used: false, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ error: 'Invalid or expired OTP' });
    const match = await bcrypt.compare(String(otp), record.codeHash);
    if (!match){
      record.attempts = (record.attempts || 0) + 1;
      const MAX_ATTEMPTS = 5;
      if (record.attempts >= MAX_ATTEMPTS) record.used = true;
      await record.save();
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    record.used = true; await record.save();
    user.isVerified = true; await user.save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: user.toJSON(), token });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Send login OTP
router.post('/login-otp', async (req, res) => {
  try{
    const { identifier } = req.body || {};
    if (!identifier) return res.status(400).json({ error: 'Missing identifier' });
    const q = String(identifier).trim();
    let user = null;
    if (q.includes('@')) {
      user = await User.findOne({ email: q.toLowerCase().trim() });
    } else {
      const normalizedPhone = normalizePhone(q);
      user = await User.findOne({ phone: normalizedPhone });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    const code = genCode(4);
    const expiresAt = new Date(Date.now() + 5*60*1000);
    const codeHash = await bcrypt.hash(code, 10);
    await Otp.create({ user: user._id, codeHash, expiresAt });
    const dest = user.phone ? normalizePhoneInput(user.phone) : user.email;
    const text = `Your login code is ${code}`;
    const sent = await sendOtp(dest, text);
    if (sent && sent.dev) return res.json({ success: true, otp: code, dev: true });
    if (sent && sent.sent) return res.json({ success: true, message: 'OTP sent' });
    return res.json({ success: true, otp: code, warning: sent.warning || sent.error });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Verify login OTP
router.post('/login-otp-verify', async (req, res) => {
  try{
    const { identifier, otp } = req.body || {};
    if (!identifier || !otp) return res.status(400).json({ error: 'Missing fields' });
    const q = String(identifier).trim();
    let user = null;
    if (q.includes('@')) {
      user = await User.findOne({ email: q.toLowerCase().trim() });
    } else {
      const normalizedPhone = normalizePhone(q);
      user = await User.findOne({ phone: normalizedPhone });
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    const record = await Otp.findOne({ user: user._id, used: false, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ error: 'Invalid or expired OTP' });
    const match = await bcrypt.compare(String(otp), record.codeHash);
    if (!match){
      record.attempts = (record.attempts || 0) + 1;
      const MAX_ATTEMPTS = 5;
      if (record.attempts >= MAX_ATTEMPTS) record.used = true;
      await record.save();
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    record.used = true; await record.save();
    user.isVerified = true; await user.save();
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ user: user.toJSON(), token });
  }catch(err){ res.status(500).json({ error: err.message }); }
});

// Validate token (stateless JWT check)
router.post('/validate', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ valid: false, error: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ valid: false, error: 'User not found' });
    res.json({ valid: true, user: user.toJSON() });
  } catch (err) {
    res.status(401).json({ valid: false, error: err.message });
  }
});

module.exports = router;
