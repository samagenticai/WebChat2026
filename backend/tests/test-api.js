const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YTBiOTAwNjcwYmI4NzY5YzU3NDM5MyIsImlhdCI6MTczODc0NjE1MCwiZXhwIjoyMDQ4NTA2MTUwfQ.zxZ-W0FX-pJpH6TiKtakVxQ3v3AYT45l8n0I8cWKQQE';

(async () => {
  console.log('Testing backend APIs...\n');
  
  // Test locally
  try {
    const r1 = await fetch('http://localhost:5000/api/messages/inbox', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d1 = await r1.json();
    console.log('✓ /api/messages/inbox:', r1.status, 'Messages:', d1.messages?.length || 0);
  } catch(e) {
    console.error('✗ /api/messages/inbox:', e.message);
  }
  
  try {
    const r2 = await fetch('http://localhost:5000/api/users/contacts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d2 = await r2.json();
    console.log('✓ /api/users/contacts:', r2.status, 'Contacts:', d2.contacts?.length || 0);
  } catch(e) {
    console.error('✗ /api/users/contacts:', e.message);
  }
  
  try {
    const r3 = await fetch('http://localhost:5000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d3 = await r3.json();
    console.log('✓ /api/users/profile:', r3.status, 'Username:', d3.user?.username);
  } catch(e) {
    console.error('✗ /api/users/profile:', e.message);
  }
  
  try {
    const r4 = await fetch('http://localhost:5000/api/users/online-status?userIds=67a0b900670bb8769c574393', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d4 = await r4.json();
    console.log('✓ /api/users/online-status:', r4.status, 'Online count:', d4.online?.length || 0);
  } catch(e) {
    console.error('✗ /api/users/online-status:', e.message);
  }
})();
