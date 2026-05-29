#!/usr/bin/env node

// Simulate a browser making a login request to the frontend (which proxies to backend)
(async () => {
  console.log('\n=== Simulating Browser Login Request ===\n');
  
  // This is what the browser would do
  const loginData = {
    phone: '+923145665432',
    password: 'fahad1234'
  };

  console.log('Sending POST /api/auth/login');
  console.log('Payload:', JSON.stringify(loginData, null, 2));
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: loginData.phone,
        password: loginData.password
      })
    });

    console.log('\n Status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('\nResponse:', JSON.stringify(data, null, 2));

    if (response.ok && data.token) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('Token:', data.token.substring(0, 20) + '...');
      console.log('User:', data.user.username);
    } else {
      console.log('\n❌ LOGIN FAILED');
      if (data.error) {
        console.log('Error:', data.error);
      }
    }
  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
  }
  
  process.exit(0);
})();
