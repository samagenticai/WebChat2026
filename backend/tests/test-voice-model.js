require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

async function testVoiceEndpoint() {
  try {
    const uri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...\n');
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
    });
    
    console.log('✅ Connected!\n');

    // Get the first two users 
    const User = require('./models/User');
    const users = await User.find().limit(2);
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users for testing');
      await mongoose.disconnect();
      return;
    }

    const sender = users[0];
    const recipient = users[1];
    
    console.log(`Sender: ${sender.username} (${sender._id})`);
    console.log(`Recipient: ${recipient.username} (${recipient._id})\n`);

    // Create a test message with audio
    const Message = require('./models/Message');
    
    const testMessage = await Message.create({
      sender: sender._id,
      recipient: recipient._id,
      text: '[Test Voice Message]',
      audio: {
        path: '/uploads/voices/test-voice-12345.webm',
        mimeType: 'audio/webm',
        duration: 5
      },
      delivered: false,
      read: false
    });

    console.log('Created test message:', testMessage._id);
    console.log('Message data:', JSON.stringify(testMessage.toObject(), null, 2));

    // Now fetch it back to verify
    const fetched = await Message.findById(testMessage._id)
      .populate('sender recipient', 'username email phone avatar about displayName lastLogout');
    
    console.log('\n✅ Fetched message back:');
    console.log(JSON.stringify(fetched.toObject(), null, 2));

    // Check audio field specifically
    if (fetched.audio && fetched.audio.path) {
      console.log('\n✅ Audio field is present:', fetched.audio);
    } else {
      console.log('\n❌ Audio field is missing!');
    }

    // Clean up
    await Message.deleteOne({ _id: testMessage._id });
    console.log('\nCleaned up test message');

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testVoiceEndpoint();
