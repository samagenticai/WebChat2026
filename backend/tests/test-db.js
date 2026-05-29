const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
console.log('URI:', process.env.MONGO_URI ? 'Configured' : 'NOT configured');

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI not set in .env');
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('Connection state:', mongoose.connection.readyState);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection failed:');
  console.error('Error:', err.message);
  console.error('Code:', err.code);
  process.exit(1);
});

// Timeout fallback
setTimeout(() => {
  console.error('❌ Timeout: MongoDB did not respond');
  process.exit(1);
}, 10000);
