// Test new user profile edit and contact add
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5N2JiZmUxZTQwMDBmY2U0YTNkOWMxYiIsImlhdCI6MTc3MDI4MjA0MCwiZXhwIjoxNzcyODc0MDQwfQ.EnBxeMMtHPFep3EcQnABL3butKN-WViT6aiGllHF0Ms';
const userId = '697bbfe1e4000fce4a3d9c1b'; // Mohayyudin

(async () => {
  console.log('\n=== Testing New User (Mohayyudin) ===\n');
  
  // Test 1: Get current profile
  try {
    const r1 = await fetch('http://localhost:5000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d1 = await r1.json();
    console.log('✓ GET /api/users/profile:', r1.status);
    console.log('  User:', d1.user?.username, '| Phone:', d1.user?.phone);
    console.log('  About:', d1.user?.about || '(empty)');
    console.log('  Avatar:', d1.user?.avatar || '(none)');
  } catch(e) {
    console.error('✗ Error:', e.message);
  }
  
  // Test 2: Update profile  
  try {
    // Create minimal FormData with just about
    const fm = new FormData();
    fm.append('about', 'I am Mohayyudin, testing profile update');
    
    const r2 = await fetch('http://localhost:5000/api/users/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: fm
    });
    const d2 = await r2.json();
    console.log('\n✓ PUT /api/users/profile (update about):', r2.status);
    if (r2.ok) {
      console.log('  Updated about:', d2.user?.about);
    } else {
      console.log('  Error:', d2.error);
    }
  } catch(e) {
    console.error('✗ Error:', e.message);
  }
  
  // Test 3: Add a contact
  try {
    const r3 = await fetch('http://localhost:5000/api/users/contacts', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        identifier: '+923145665432',  // Fahad
        displayName: 'Fahad Khan'
      })
    });
    const d3 = await r3.json();
    console.log('\n✓ POST /api/users/contacts:', r3.status);
    if (r3.ok) {
      console.log('  Added contact:', d3.user?.username);
    } else {
      console.log('  Error:', d3.error);
    }
  } catch(e) {
    console.error('✗ Error:', e.message);
  }
  
  // Test 4: Get contacts list
  try {
    const r4 = await fetch('http://localhost:5000/api/users/contacts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const d4 = await r4.json();
    console.log('\n✓ GET /api/users/contacts:', r4.status);
    console.log('  Total contacts:', d4.contacts?.length || 0);
    if (d4.contacts?.length > 0) {
      d4.contacts.forEach((c, i) => {
        console.log(`  ${i+1}. ${c.displayName} (${c.phone})`);
      });
    }
  } catch(e) {
    console.error('✗ Error:', e.message);
  }
  
  console.log('\n=== Test Complete ===\n');
})();
