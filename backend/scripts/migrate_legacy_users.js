#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { normalizePhone } = require('../lib/phone');

function isBcryptHash(s){
  if (!s) return false;
  return /^\$2[aby]\$/.test(String(s));
}

async function connect(){
  const uri = process.env.MONGO_URI || 'mongodb://223.123.8.130/cloud0';
  await mongoose.connect(uri, { autoIndex: true });
}

async function findUsersByIdentifier(identifier){
  if (!identifier) return await User.find();
  const q = String(identifier).trim();
  if (q.includes('@')) return await User.find({ email: q.toLowerCase().trim() });
  const norm = normalizePhone(q);
  const digitsOnly = q.replace(/[^0-9]/g,'');
  const users = await User.find({
    $or: [
      { phone: norm },
      { phone: digitsOnly },
      { phone: { $regex: new RegExp(digitsOnly.slice(-9) + '$') } },
      { username: q.toLowerCase().trim() }
    ]
  });
  return users;
}

async function migrate(identifier){
  await connect();
  const users = await findUsersByIdentifier(identifier);
  console.log('Found users:', users.length);
  for (const u of users){
    let changed = false;

    // normalize username
    if (u.username){
      const normalized = String(u.username).toLowerCase().trim();
      if (u.username !== normalized){ u.username = normalized; changed = true; }
    }

    // normalize email
    if (u.email){
      const normalized = String(u.email).toLowerCase().trim();
      if (u.email !== normalized){ u.email = normalized; changed = true; }
    }

    // normalize phone
    if (u.phone){
      const normalized = normalizePhone(u.phone);
      if (u.phone !== normalized){ u.phone = normalized; changed = true; }
    }

    // migrate plaintext password to bcrypt
    if (u.password && !isBcryptHash(u.password)){
      try{
        const hashed = await bcrypt.hash(String(u.password), 10);
        u.password = hashed;
        changed = true;
        console.log('[migrate] hashed password for user', u._id.toString());
      }catch(e){ console.warn('[migrate] hashing failed for', u._id, e && e.message); }
    }

    if (changed){
      try{ await u.save(); console.log('[migrate] updated user', u._id.toString()); }
      catch(e){ console.error('[migrate] failed saving', u._id.toString(), e && e.message); }
    } else {
      console.log('[migrate] no changes for', u._id.toString());
    }
  }
  await mongoose.disconnect();
}

// CLI
const args = process.argv.slice(2);
let identifier = null;
for (let i=0;i<args.length;i++){
  if (args[i] === '--identifier' || args[i] === '-i') identifier = args[i+1], i++;
}

(async ()=>{
  try{
    await migrate(identifier);
    console.log('Migration complete');
  }catch(err){
    console.error('Migration failed', err && err.message);
    process.exit(1);
  }
})();
