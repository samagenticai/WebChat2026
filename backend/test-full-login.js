const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./models/User');

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://223.123.8.130/chatapp';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('\n✓ Connected to MongoDB\n');

    // Step 1: Check user in database
    console.log('=== STEP 1: Check User in Database ===');
    const user = await User.findOne({ phone: '+923145665432' }).select('+password');
    
    if (!user) {
      console.log('❌ User NOT found');
      process.exit(1);
    }

    console.log('✓ User found:', user.username);
    console.log('  Phone:', user.phone);
    console.log('  Email:', user.email);
    console.log('  Verified:', user.isVerified);
    console.log('  Has password:', !!user.password);

    // Step 2: Test password
    console.log('\n=== STEP 2: Test Password ===');
    const testPass = 'fahad1234';
    const isMatch = await bcrypt.compare(testPass, user.password);
    console.log(`Password "${testPass}" matches:`, isMatch);

    if (!isMatch) {
      console.log('❌ Password does NOT match!');
      process.exit(1);
    }

    // Step 3: Test login via simulated API
    console.log('\n=== STEP 3: Simulate Login Logic ===');
    
    const identifier = '+923145665432';
    const password = 'fahad1234';
    
    // This is the exact logic from the auth route
    const q = String(identifier).trim();
    let foundUser = null;
    
    if (q.includes('@')) {
      foundUser = await User.findOne({ email: q.toLowerCase().trim() }).select('+password').maxTimeMS(15000);
    } else {
      // Normalize phone (from auth.js)
      const normalizePhone = (raw) => {
        if (!raw) return '';
        let s = String(raw).trim();
        s = s.replace(/[^0-9+]/g,'');
        if (/^0[3-9][0-9]{8}$/.test(s)) return '+92' + s.slice(1);
        if (/^[2-9][0-9]{9}$/.test(s)) return '+92' + s;
        if (/^\+\d{8,15}$/.test(s)) return s;
        return s.replace(/[^0-9]/g,'');
      };
      
      const normalizedPhone = normalizePhone(q);
      console.log('Searching for phone (normalized):', normalizedPhone);
      
      foundUser = await User.findOne({ phone: normalizedPhone }).select('+password').maxTimeMS(15000);
      
      if (!foundUser) {
        console.log('Not found by phone, trying username...');
        foundUser = await User.findOne({ username: q }).select('+password').maxTimeMS(15000);
      }
    }
    
    if (!foundUser) {
      console.log('❌ User not found in login query!');
      process.exit(1);
    }
    
    console.log('✓ User found:', foundUser.username);
    
    const ok = await bcrypt.compare(password, foundUser.password || '');
    if (!ok) {
      console.log('❌ Password check failed!');
      process.exit(1);
    }
    
    console.log('✓ Password matches!');
    console.log('\n✅ LOGIN SHOULD WORK!');
    
    await mongoose.disconnect();
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    process.exit(1);
  }
})();
