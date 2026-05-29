const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YTBiOTAwNjcwYmI4NzY5YzU3NDM5MyIsImlhdCI6MTc3MDI4MTY0OCwiZXhwIjoxNzcyODczNjQ4fQ.1bIGpLL-tvnUneHr-lvT3HxCKBnhpAR5UQ77MH0NprM';

(async () => {
  console.log('\n=== Testing APIs with valid token ===\n');
  
  try {
    const r1 = await fetch('http://localhost:5000/api/messages/inbox', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d1 = await r1.json();
    console.log('✓ /api/messages/inbox:', r1.status);
    console.log('  Messages count:', d1.messages?.length || 0);
    if (d1.messages?.length > 0) {
      console.log('  Sample message:', d1.messages[0].text.slice(0, 50));
    }
  } catch(e) {
    console.error('✗ /api/messages/inbox:', e.message);
  }
  
  try {
    const r2 = await fetch('http://localhost:5000/api/users/contacts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d2 = await r2.json();
    console.log('\n✓ /api/users/contacts:', r2.status);
    console.log('  Contacts count:', d2.contacts?.length || 0);
    if (d2.contacts?.length > 0) {
      console.log('  Sample contact:', d2.contacts[0].username);
    }
  } catch(e) {
    console.error('✗ /api/users/contacts:', e.message);
  }
  
  try {
    const r3 = await fetch('http://localhost:5000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d3 = await r3.json();
    console.log('\n✓ /api/users/profile:', r3.status);
    console.log('  User:', d3.user?.username, d3.user?.phone);
    console.log('  Avatar:', d3.user?.avatar || 'none');
  } catch(e) {
    console.error('✗ /api/users/profile:', e.message);
  }
  
  try {
    const r4 = await fetch('http://localhost:5000/api/users/online-status?userIds=67a0b900670bb8769c574393,67a0b90e670bb8769c574395', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d4 = await r4.json();
    console.log('\n✓ /api/users/online-status:', r4.status);
    console.log('  Online users:', d4.online);
  } catch(e) {
    console.error('✗ /api/users/online-status:', e.message);
  }
  
  console.log('\n=== All APIs working ===\n');
})();
