const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const devSms = require('../lib/devSms');
const { normalizePhone } = require('../lib/phone');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Helper to check if password is bcrypt hash
function isBcryptHash(s){
  if (!s) return false;
  return /^\$2[aby]\$/.test(String(s));
}


function genCode(digits = 4){
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
}

async function sendOtp(to, text){
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN){
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

async function signup(req, res){
  try{
    const body = req.body || {};
    const username = body.username;
    const email = body.email || body.identifier;
    const phone = body.phone || body.identifier;
    const passwordRaw = body.password;
    const password = passwordRaw === undefined || passwordRaw === null ? '' : String(passwordRaw).trim();

    if (!username || (!email && !phone) || !password)
      return res.status(400).json({ error: 'Missing fields' });

    const normalizedUsername = String(username).toLowerCase().trim();
    const normalizedEmail = email ? String(email).toLowerCase().trim() : undefined;
    const normalizedPhone = phone ? normalizePhone(phone) : undefined;

    if (await User.findOne({ username: normalizedUsername }).maxTimeMS(15000))
      return res.status(400).json({ error: 'Username already taken' });
    if (normalizedEmail && await User.findOne({ email: normalizedEmail }).maxTimeMS(15000))
      return res.status(400).json({ error: 'Email already registered' });
    if (normalizedPhone && await User.findOne({ phone: normalizedPhone }).maxTimeMS(15000))
      return res.status(400).json({ error: 'Phone already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const userData = { username: normalizedUsername, password: hashed, isVerified: true };
    if (normalizedEmail) userData.email = normalizedEmail;
    if (normalizedPhone) userData.phone = normalizedPhone;

    const user = await User.create(userData);
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ user: user.toJSON(), token });
  }catch(err){ res.status(500).json({ error: err.message }); }
}

async function login(req, res){
  try{
    const body = req.body || {};
    const passwordRaw = body.password;
    const password = passwordRaw === undefined || passwordRaw === null ? '' : String(passwordRaw).trim();
    const identifier = body.identifier || body.phone || body.email || body.username;

    if (!identifier || !password) return res.status(400).json({ error: 'Missing fields' });

    const q = String(identifier).trim();
    console.log('[login] Attempting login with identifier:', q);
    console.log('[login] password length:', password.length, 'type:', typeof password);
    let user = null;

    // Email login
    if (q.includes('@')) {
      user = await User.findOne({ email: q.toLowerCase().trim() }).select('+password').maxTimeMS(15000);
      console.log('[login] Email search result:', user ? 'Found' : 'Not found');
    } else {
      // Phone login - try multiple formats
      const normalizedPhone = normalizePhone(q);
      const digitsOnly = String(q).replace(/[^0-9]/g, '');
      const last9 = digitsOnly.slice(-9);
      const with0Prefix = '0' + last9;
      const with92Prefix = '92' + last9;
      
      console.log('[login] Phone formats:');
      console.log('  normalized:', normalizedPhone);
      console.log('  digitsOnly:', digitsOnly);
      console.log('  last9:', last9);
      console.log('  with0Prefix:', with0Prefix);
      console.log('  with92Prefix:', with92Prefix);
      
      // Try searching with multiple phone formats
      user = await User.findOne({ phone: normalizedPhone }).select('+password').maxTimeMS(15000);
      if (!user && digitsOnly && digitsOnly !== normalizedPhone.replace(/[^0-9]/g, '')) {
        console.log('[login] Search 2 (digitsOnly)...');
        user = await User.findOne({ phone: digitsOnly }).select('+password').maxTimeMS(15000);
      }
      if (!user && with0Prefix) {
        console.log('[login] Search 3 (with0Prefix)...');
        user = await User.findOne({ phone: with0Prefix }).select('+password').maxTimeMS(15000);
      }
      if (!user && with92Prefix) {
        console.log('[login] Search 4 (with92Prefix)...');
        user = await User.findOne({ phone: with92Prefix }).select('+password').maxTimeMS(15000);
      }
      if (!user && last9.length >= 9) {
        console.log('[login] Search 5 (regex last 9)...');
        user = await User.findOne({ phone: { $regex: new RegExp(last9 + '$') } }).select('+password').maxTimeMS(15000);
      }
      
      // Username login fallback
      if (!user) {
        console.log('[login] Search 6 (username)...');
        user = await User.findOne({ username: q.toLowerCase().trim() }).select('+password').maxTimeMS(15000);
      }
      
      console.log('[login] Phone search result:', user ? 'Found' : 'Not found');
    }

    if (!user) {
      console.log('[login] User not found');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('[login] User found:', user.username || user.phone);

    console.log('[login] Password hash check - stored format:', user.password?.substring(0, 10));
    const isHash = isBcryptHash(user.password);
    console.log('[login] Is bcrypt hash:', isHash);
    
    let ok = false;
    if (isHash) {
      ok = await bcrypt.compare(password, user.password);
      console.log('[login] Bcrypt comparison result:', ok);
    } else {
      // old plain text password
      ok = user.password === password;
      console.log('[login] Plain text comparison result:', ok);
      if (ok) {
        // convert old password to hash automatically
        console.log('[login] Converting password to hash...');
        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
        await user.save();
        console.log('[login] Password converted and saved');
      }
    }

    if (!ok) {
      console.log('[login] Password verification failed');
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    console.log('[login] Password verified successfully');

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    const userJson = user.toJSON();
    userJson.about = user.about || '';
    res.json({ user: userJson, token });
  }catch(err){ 
    console.error('[login] Error:', err.message);
    res.status(500).json({ error: err.message }); 
  }
}

module.exports = {
  signup,
  login
};