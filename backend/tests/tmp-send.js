const fetch = require('node-fetch');
(async () => {
  try {
    let r = await fetch('http://localhost:5000/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username:'user1', phone: '1234567890', password: 'pass123' }) });
    console.log('signup1', r.status, await r.text());
    r = await fetch('http://localhost:5000/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username:'user2', phone: '1234567891', password: 'pass123' }) });
    console.log('signup2', r.status, await r.text());
    // login user1
    r = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: '1234567890', password: 'pass123' }) });
    const d1 = await r.json();
    console.log('login1', r.status, d1);
    r = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: '1234567891', password: 'pass123' }) });
    const d2 = await r.json();
    console.log('login2', r.status, d2);
    // send message from 1 to 2
    if (d1.token) {
      r = await fetch('http://localhost:5000/api/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + d1.token }, body: JSON.stringify({ identifier: '1234567891', text: 'hello from 1' }) });
      console.log('send1->2', r.status, await r.text());
    }
  } catch (e) {
    console.error(e);
  }
})();
