const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5N2JiZTVmZTQwMDBmY2U0YTNkOWMxMSIsImlhdCI6MTc3MDI4MTY4MSwiZXhwIjoxNzcyODczNjgxfQ.lu235_utCRL0UDLiFi6jqOjgpHvuBr3yGdhjnQeZmWQ';

(async () => {
  console.log('\n=== Testing APIs with Fahad token ===\n');
  
  try {
    const r1 = await fetch('http://localhost:5000/api/messages/inbox', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d1 = await r1.json();
    console.log('✓ /api/messages/inbox:', r1.status);
    console.log('  Messages count:', d1.messages?.length || 0);
    if (d1.messages?.length > 0) {
      console.log('  Sample:', d1.messages[0]);
    }
  } catch(e) {
    console.error('✗ Error:', e.message);
  }
  
  try {
    const r2 = await fetch('http://localhost:5000/api/users/contacts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d2 = await r2.json();
    console.log('\n✓ /api/users/contacts:', r2.status);
    console.log('  Contacts:', JSON.stringify(d2.contacts, null, 2));
  } catch(e) {
    console.error('✗ Error:', e.message);
  }
  
  try {
    const r3 = await fetch('http://localhost:5000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d3 = await r3.json();
    console.log('\n✓ /api/users/profile:', r3.status);
    console.log('  User:', JSON.stringify(d3.user, null, 2));
  } catch(e) {
    console.error('✗ Error:', e.message);
  }
})();
