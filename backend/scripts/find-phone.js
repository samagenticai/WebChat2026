require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function findPhoneUser() {
  try {
    const uri = process.env.MONGO_URI;
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
    });
    
    console.log('Looking for phone: +923137363725\n');
    
    // Update User model to use users collection
    const phoneToFind = '+923137363725';
    
    // Try different search formats
    const searches = [
      { phone: phoneToFind },
      { phone: '923137363725' },
      { phone: '03137363725' },
      { phone: { $regex: '3137363725' } },
      { phone: { $regex: '923137363725' } },
    ];
    
    for (const query of searches) {
      const result = await User.findOne(query).select('username phone email');
      if (result) {
        console.log('✅ FOUND with query:', JSON.stringify(query));
        console.log('User:', result.toObject());
        break;
      }
    }
    
    // Show all users and their phones
    console.log('\n=== All Users and Phones ===\n');
    const allUsers = await User.find().select('username phone email').limit(20);
    allUsers.forEach((u, idx) => {
      console.log(`${idx + 1}. ${u.username} | Phone: ${u.phone || 'N/A'} | Email: ${u.email || 'N/A'}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

findPhoneUser();
