const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

(async () => {
  try {
    await mongoose.connect(uri);
    const User = require('./models/User');
    const users = await User.find().select('_id username phone').lean();
    
    console.log('\nActual User IDs in Database:\n');
    users.slice(0, 3).forEach(u => {
      const token = jwt.sign({ id: u._id }, JWT_SECRET, { expiresIn: '30d' });
      console.log(`Username: ${u.username}, Phone: ${u.phone}`);
      console.log(`User ID: ${u._id}`);
      console.log(`Token: ${token}\n`);
    });
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
