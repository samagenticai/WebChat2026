const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

(async function(){
  try{
    const uri = process.env.MONGO_URI || 'mongodb://223.123.8.130/chatapp';
    await mongoose.connect(uri);
    const u = await User.findOne().lean();
    if(!u) { console.error('No users found'); process.exit(1); }
    const token = jwt.sign({ id: String(u._id) }, process.env.JWT_SECRET || 'change_this_secret');
    console.log('USER_ID=' + u._id);
    console.log('TOKEN=' + token);
    process.exit(0);
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();