const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI || 'mongodb://223.123.8.130/chatapp';

(async () => {
  try {
    await mongoose.connect(uri);
    console.log('\n=== DATABASE SUMMARY ===\n');
    
    const User = require('./models/User');
    const Message = require('./models/Message');
    
    const users = await User.find().lean();
    const messages = await Message.find().populate('sender recipient', 'username phone email').lean();
    
    console.log('TOTAL USERS:', users.length);
    users.forEach((u, i) => {
      console.log(`${i+1}. Username: ${u.username}, Phone: ${u.phone}, Email: ${u.email}, Verified: ${u.isVerified}`);
      if (u.contacts && u.contacts.length > 0) {
        console.log(`   Contacts: ${u.contacts.length}`);
      }
    });
    
    console.log('\nTOTAL MESSAGES:', messages.length);
    messages.slice(0, 20).forEach((m, i) => {
      const senderName = m.sender?.username || 'Unknown';
      const recipientName = m.recipient?.username || 'Unknown';
      const time = new Date(m.createdAt).toLocaleString();
      console.log(`${i+1}. ${senderName} → ${recipientName}: "${m.text.slice(0, 40)}..." (${time})`);
    });
    
    if (messages.length > 20) {
      console.log(`... and ${messages.length - 20} more messages`);
    }
    
    console.log('\n=== END ===\n');
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
