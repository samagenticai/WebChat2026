const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('./models/User');

const PHONE = '+923236177455'; // Mohayyudin
const NEW_PASSWORD = 'mohayyudin1234';

(async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb+srv://syedahmadmohayyudin_db_user:Pl46MW7lEBXERdJ9@cluster0.3hjw9xz.mongodb.net/whatsapp?retryWrites=true&w=majority';
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to database');

    const user = await User.findOne({ phone: PHONE });
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
    console.log('\nYou can now login with these credentials.\n');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
