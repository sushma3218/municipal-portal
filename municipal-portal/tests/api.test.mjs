import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = 'http://localhost:3000';

test('Complaint Submission API Tests', async (t) => {
  let token = '';
  let categoryId = '';

  await t.test('1. Setup: Register a test citizen', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Citizen',
        email: `test_${Date.now()}@example.com`,
        password: 'password123',
        phone: '9999999999',
        role: 'CITIZEN'
      })
    });
    
    // Might be 201 Created or 409 Conflict if email exists, but we use Date.now() to ensure uniqueness
    assert.strictEqual(res.status, 201, 'Should register a new citizen');
    const data = await res.json();
    token = data.token;
    assert.ok(token, 'Should return a JWT token');
  });

  await t.test('2. Setup: Fetch categories', async () => {
    const res = await fetch(`${BASE_URL}/api/categories`);
    assert.strictEqual(res.status, 200, 'Should return categories');
    const data = await res.json();
    assert.ok(data.categories.length > 0, 'Should have at least one category');
    categoryId = data.categories[0].id;
  });

  await t.test('3. Edge Case (Invalid Input): Reject empty description', async () => {
    // Attempt to submit a complaint without a description
    const res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        category_id: categoryId,
        location_text: 'Test Location',
        description: '' // deliberately empty
      })
    });

    // The test EXPECTS a 400 Bad Request because empty descriptions should be invalid
    // If the defect is active, it will return 201, causing the test to fail.
    assert.strictEqual(res.status, 400, 'Expected 400 Bad Request for empty description');
  });

  await t.test('4. Normal Path: Accept valid complaint', async () => {
    const res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        category_id: categoryId,
        location_text: 'Test Location 2',
        description: 'This is a valid detailed description of the issue.'
      })
    });

    assert.strictEqual(res.status, 201, 'Expected 201 Created for valid description');
  });
});
