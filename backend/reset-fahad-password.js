const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const uri = process.env.MONGO_URI || 'mongodb://223.123.8.130/chatapp';
const User = require('./models/User');

const NEW_PASSWORD = 'fahad1234'; // Change this to your desired password

(async () => {
  try {
    await mongoose.connect(uri);
    console.log('Connected to database');

    const user = await User.findOne({ phone: '+923145665432' });
    if (!user) {
      console.error('User not found!');
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    user.password = hashedPassword;
    await user.save();

    console.log(`\n✓ Password reset successfully for ${user.username}`);
    console.log(`  Phone: ${user.phone}`);
    console.log(`  New password: ${NEW_PASSWORD}`);
    console.log('\nYou can now login with this password.\n');
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
