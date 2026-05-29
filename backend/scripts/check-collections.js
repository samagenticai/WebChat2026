require('dotenv').config();
const mongoose = require('mongoose');

async function listCollections() {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...\n');
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
    });
    
    console.log('✅ Connected!\n');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('=== Collections in Database ===\n');
    if (collections.length === 0) {
      console.log('No collections found');
    } else {
      collections.forEach((col, idx) => {
        console.log(`${idx + 1}. ${col.name}`);
      });
    }
    
    // Try to find user data in each collection
    console.log('\n=== Searching for User Data ===\n');
    
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      if (count > 0) {
        console.log(`${col.name}: ${count} documents`);
        
        // Show first document to see structure
        const sample = await mongoose.connection.db.collection(col.name).findOne();
        console.log('Sample:', JSON.stringify(sample, null, 2).slice(0, 300) + '...');
        console.log('');
      }
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listCollections();
