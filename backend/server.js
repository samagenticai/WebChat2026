const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const os = require('os');
const connectToMongo = require('./db');

const authRoutes = require('./routes/auth');
const devRoutes = require('./routes/dev');
const userRoutes = require('./routes/users2');
const messagesRoutes = require('./routes/messages');
const statusRoutes = require('./routes/status');
const contactsRoutes = require('./routes/contacts');

// In-memory online user tracker
const onlineUsers = new Set();

const app = express();

// Enhanced CORS for multi-device support
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Share online users tracker with routes
app.set('onlineUsers', onlineUsers);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/dev', devRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/contacts', contactsRoutes);

// Catch-all for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: 'Not found',
      path: req.originalUrl
    });
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

// Helper to get local IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push({
          interface: name,
          ip: addr.address
        });
      }
    }
  }

  return ips;
}

async function start() {
  try {
    await connectToMongo();

    // Ensure indexes
    try {
      const Message = require('./models/Message');
      await Message.syncIndexes();
      console.log('✅ Message indexes synced');
    } catch (e) {
      console.warn('⚠️ Could not ensure indexes:', e.message);
    }
  } catch (err) {
    console.error('\n❌ MongoDB Connection Failed\n');
    console.error(err.message || err);
    process.exit(1);
  }

  // Allow access from all devices on same network
  const BIND_HOST = process.env.BIND_HOST || '0.0.0.0';

  app.listen(PORT, BIND_HOST, () => {

    console.log('\n' + '='.repeat(70));

    console.log(`🚀 Server running on port ${PORT}`);

    console.log('='.repeat(70));

    console.log('\n📍 Local Access:');
    console.log(`   http://localhost:${PORT}`);

    console.log('\n📍 Network Access:');

    const localIPs = getLocalIPs();

    if (localIPs.length > 0) {

      localIPs.forEach(({ interface: iface, ip }) => {
        console.log(`   http://${ip}:${PORT} (${iface})`);
      });

    } else {

      console.log('   Run ipconfig to find your IP');

    }

    console.log('\n💡 Frontend Example:');
    console.log(`   http://localhost:5173`);

    console.log('\n' + '='.repeat(70) + '\n');

  });

}

start().catch((err) => {
  console.error('❌ Failed to start server');
  console.error(err);
  process.exit(1);
});