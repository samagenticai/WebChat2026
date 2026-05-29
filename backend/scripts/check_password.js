const bcrypt = require('bcrypt');

async function main(){
  const [,, hash, password] = process.argv;
  if (!hash || !password){
    console.error('Usage: node check_password.js <hash> <password>');
    process.exit(2);
  }
  try{
    const ok = await bcrypt.compare(String(password), String(hash));
    console.log('compare result:', ok);
    process.exit(ok ? 0 : 1);
  }catch(err){
    console.error('error:', err && err.message);
    process.exit(3);
  }
}

main();
