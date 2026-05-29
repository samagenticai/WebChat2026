// Test login API directly
(async () => {
  console.log('\n=== Testing Login API ===\n');
  
  const testCases = [
    { phone: '+923145665432', password: 'fahad1234', desc: 'Correct credentials' },
    { phone: '+923145665432', password: 'wrong', desc: 'Wrong password' },
  ];

  for (const test of testCases) {
    try {
      console.log(`\nTest: ${test.desc}`);
      console.log(`Phone: ${test.phone}`);
      console.log(`Password: ${test.password}`);
      
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: test.phone, password: test.password })
      });

      const data = await res.json();
      
      console.log(`Status: ${res.status}`);
      console.log('Response:', data);
      
      if (res.ok && data.token) {
        console.log('✓ LOGIN SUCCESSFUL');
      } else {
        console.log('✗ LOGIN FAILED');
      }
    } catch (err) {
      console.error('Network error:', err.message);
    }
  }

  console.log('\n=== Test Complete ===\n');
  process.exit(0);
})();
