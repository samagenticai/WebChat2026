#!/usr/bin/env node
(async () => {
  console.log('\n=== Testing /api/status ===\n');
  
  try {
    const res = await fetch('http://localhost:5000/api/status');
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch (err) {
    console.error('ERROR:', err.message);
  }
  
  process.exit(0);
})();
