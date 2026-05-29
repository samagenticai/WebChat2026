#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

async function testLogin() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb+srv://syedahmadmohayyudin_db_user:Pl46MW7lEBXERdJ9@cluster0.3hjw9xz.mongodb.net/whatsapp?retryWrites=true&w=majority';
    console.log('Connecting to:', uri.substring(0, 50) + '...');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    
    console.log('\n=== DIRECT LOGIN TEST (Without HTTP) ===\n');
    
    const phone = '+923145665432';
    const password = 'fahad1234';
    
    // Simulate the exact logic from auth.js
    const normalizePhone = (raw) => {
      if (!raw) return '';
      let s = String(raw).trim();
      s = s.replace(/[^0-9+]/g,'');
      if (/^0[3-9][0-9]{8}$/.test(s)) return '+92' + s.slice(1);
      if (/^[2-9][0-9]{9}$/.test(s)) return '+92' + s;
      if (/^\+\d{8,15}$/.test(s)) return s;
      return s.replace(/[^0-9]/g,'');
    };
    
    const normalizedPhone = normalizePhone(phone);
    console.log('1. Searching for user with normalized phone:', normalizedPhone);
    
    let user = await User.findOne({ phone: normalizedPhone }).select('+password');
    
    if (!user) {
      console.log('2. ❌ User not found');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log('2. ✓ User found:', user.username);
    
    const ok = await bcrypt.compare(password, user.password || '');
    console.log('3. Password match test:', ok);
    
    if (!ok) {
      console.log('❌ Password does not match');
      await mongoose.disconnect();
      process.exit(1);
    }
    
    console.log('✓ Password matches!');
    
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
    const userJson = user.toJSON();
    
    console.log('\n✅ LOGIN WOULD SUCCEED!');
    console.log('User:', userJson.username);
    console.log('Token:', token.substring(0, 30) + '...');
    
    await mongoose.disconnect();
    
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

testLogin();
