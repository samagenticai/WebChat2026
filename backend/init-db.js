require('dotenv').config();
const mongoose = require('mongoose');

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      throw new Error('MONGO_URI not defined in .env');
    }

    await mongoose.connect(uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ Connected to MongoDB');

    // Import all models to ensure they're registered
    const User = require('./models/User');
    const Message = require('./models/Message');
    const Otp = require('./models/Otp');
    const Status = require('./models/Status');
    const ContactOverride = require('./models/ContactOverride');

    console.log('📦 Registering models...');

    // Create collections if they don't exist
    const collections = [
      { name: 'users', model: User },
      { name: 'messages', model: Message },
      { name: 'otps', model: Otp },
      { name: 'statuses', model: Status },
      { name: 'contactoverrides', model: ContactOverride }
    ];

    for (const { name, model } of collections) {
      try {
        // Create collection
        await model.collection.insertOne({ __init: true }).catch(() => {});
        await model.collection.deleteOne({ __init: true }).catch(() => {});
        console.log(`✅ Collection '${name}' ready`);
      } catch (e) {
        console.log(`⚠️  Could not fully initialize '${name}':`, e.message);
      }
    }

    // Create indexes
    console.log('📌 Creating indexes...');
    await User.createIndexes();
    await Message.createIndexes();
    await Otp.createIndexes();
    await Status.createIndexes();
    await ContactOverride.createIndexes();
    console.log('✅ All indexes created');

    // Test read from users collection
    console.log('🧪 Testing users.findOne()...');
    const testUser = await User.findOne({}).exec();
    console.log('✅ users.findOne() working!');

    console.log('\n✨ Database initialized successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error initializing database:');
    console.error(error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('1. Verify MONGO_URI in .env is correct');
    console.error('2. Add your IP to MongoDB Network Access whitelist');
    console.error('3. Ensure MongoDB Atlas cluster is running');
    process.exit(1);
  }
}

initializeDatabase();
