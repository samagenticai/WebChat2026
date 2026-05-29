const mongoose = require('mongoose');
const User = require('../models/User');
const { normalizePhone } = require('../lib/phone');

// Usage: node normalize_phones.js [--dry-run]
const dryRun = process.argv.includes('--dry-run');

async function main(){
  const uri = process.env.MONGO_URI || 'mongodb://localhost/chatapp';
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to DB');

  const users = await User.find({}).select('phone username email');
  console.log('Found', users.length, 'users');

  for (const u of users){
    const orig = u.phone || '';
    const norm = normalizePhone(orig);
    if (!norm || norm === orig) continue;

    // check conflicts
    const conflict = await User.findOne({ phone: norm, _id: { $ne: u._id } });
    if (conflict){
      console.warn(`Skipping ${u.username || u._id}: normalized phone ${norm} conflicts with ${conflict.username || conflict._id}`);
      continue;
    }

    console.log(`${dryRun ? '[DRY]' : '[UPDATE]'} ${u.username || u._id}: ${orig} -> ${norm}`);
    if (!dryRun){
      u.phone = norm;
      try{ await u.save(); }catch(e){ console.error('Save error', e && e.message); }
    }
  }

  console.log('Done');
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(2); });
