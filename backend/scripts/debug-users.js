require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to:', uri.replace(/:[^@]+@/, ':****@'));
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
    });
    
    console.log('Connected to MongoDB!');
    console.log('\n=== Checking Users in Collection ===\n');
    
    const users = await User.find().select('username phone email').limit(10);
    
    if (users.length === 0) {
      console.log('❌ No users found in collection!');
    } else {
      console.log(`✅ Found ${users.length} users:\n`);
      users.forEach((user, idx) => {
        console.log(`${idx + 1}. Username: ${user.username || 'N/A'}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log('');
      });
    }
    
    // Also check for phone number 923137363725 or similar
    console.log('\n=== Searching for phone containing 3137363725 ===\n');
    const found = await User.find({ 
      phone: { $regex: '3137363725' } 
    }).select('username phone');
    
    if (found.length > 0) {
      console.log(`✅ Found ${found.length} users with that phone\n`);
      found.forEach(u => {
        console.log(`Username: ${u.username}, Phone: ${u.phone}`);
      });
    } else {
      console.log('❌ Phone number not found with regex search');
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkUsers();
