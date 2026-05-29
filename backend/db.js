const path = require('path');
const dns = require('dns');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI || !MONGO_URI.trim()) {
  throw new Error('Missing required environment variable MONGO_URI in backend/.env');
}

function configureDnsServers() {
  const publicDnsServers = ['1.1.1.1', '8.8.8.8'];
  try {
    dns.setServers(publicDnsServers);
    console.log('[db] DNS servers configured:', dns.getServers());
  } catch (error) {
    console.warn('[db] Could not configure custom DNS servers:', error.message);
  }
}

let hasConnectedOnce = false;

async function connectToMongo() {
  configureDnsServers();

  const options = {
    autoIndex: process.env.NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4
  };

  try {
    await mongoose.connect(MONGO_URI, options);
    console.log('[db] MongoDB connected successfully');
  } catch (error) {
    console.error('[db] MongoDB connection failed:', error.message);
    if (error.name) console.error('[db] Error name:', error.name);
    if (error.code) console.error('[db] Error code:', error.code);
    console.error('[db] Check MONGO_URI, Atlas credentials, and DNS/SRV settings');
    throw error;
  }
}

mongoose.connection.on('connected', () => {
  hasConnectedOnce = true;
});

mongoose.connection.on('disconnected', () => {
  if (!hasConnectedOnce) return;
  console.error('[db] MongoDB disconnected unexpectedly');
  process.exit(1);
});

mongoose.connection.on('error', (error) => {
  console.error('[db] MongoDB connection error:', error.message || error);
});

module.exports = connectToMongo;
