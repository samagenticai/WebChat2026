const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || 'mongodb://223.123.8.130/chatapp';
const User = require('./models/User');
const bcrypt = require('bcrypt');

(async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to database');

    const user = await User.findOne({ phone: '+923145665432' }).select('+password');
    if (!user) {
      console.error('❌ User not found!');
      process.exit(1);
    }

    console.log('\n=== USER DATA ===');
    console.log('Username:', user.username);
    console.log('Phone:', user.phone);
    console.log('Has password hash:', !!user.password);
    console.log('Password hash length:', user.password?.length || 0);

    // Test password comparison
    const testPassword = 'fahad1234';
    console.log('\n=== PASSWORD TEST ===');
    console.log('Testing password: "' + testPassword + '"');
    
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('✓ Password matches:', isMatch);

    if (!isMatch) {
      console.log('\n❌ Password does NOT match! The password needs to be reset again.');
      console.log('Resetting password...');
      
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      user.password = hashedPassword;
      await user.save();
      
      console.log('✓ Password reset complete');
    } else {
      console.log('✓ Login should work now!');
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
