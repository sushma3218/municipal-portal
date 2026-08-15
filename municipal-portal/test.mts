import 'dotenv/config';

async function runTest() {
  console.log('--- Starting API E2E Test ---');

  const BASE_URL = 'http://localhost:3000/api';

  // 1. Register a user
  console.log('Registering test user...');
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      phone: '1234567890'
    })
  });
  const regData = await regRes.json();
  if (!regRes.ok) throw new Error('Registration failed: ' + regData.error);
  const token = regData.token;
  console.log('Registered user token:', token.substring(0, 10) + '...');

  // 2. Fetch categories
  const catRes = await fetch(`${BASE_URL}/categories`);
  const catData = await catRes.json();
  const category_id = catData.categories[0].id;

  // 3. Attempt to submit with empty description (SHOULD FAIL, BUT BUG ALLOWS IT)
  console.log('Attempting to submit complaint with empty description...');
  const submitRes = await fetch(`${BASE_URL}/complaints`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({
      category_id,
      description: '', // Empty description
      location_text: 'Test location'
    })
  });
  
  const submitData = await submitRes.json();

  if (submitRes.ok) {
    console.error('TEST FAILED: API allowed empty description!');
    process.exit(1); // Fail the test
  } else {
    console.log('TEST PASSED: API rejected empty description successfully.');
    console.log('Response:', submitData);
    process.exit(0); // Pass the test
  }
}

runTest().catch(e => {
  console.error('Test script crashed:', e);
  process.exit(1);
});
