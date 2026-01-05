#!/usr/bin/env node
/**
 * Test script to verify feature request endpoints
 * Run with: node scripts/test-requests.mjs
 */

const BASE_URL = 'http://localhost:3001';

async function testEndpoint(name, method, path, body = null, headers = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   ${method} ${path}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${path}`, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200));
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`   ❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Starting Feature Request API Tests\n');
  console.log('=' .repeat(50));
  
  // Test 1: GET all requests (public endpoint)
  await testEndpoint(
    'Fetch all requests',
    'GET',
    '/api/requests'
  );
  
  // Test 2: GET current user
  await testEndpoint(
    'Get current user',
    'GET',
    '/api/me'
  );
  
  // Test 3: Try to create request without auth (should fail)
  await testEndpoint(
    'Create request without auth',
    'POST',
    '/api/requests',
    {
      title: 'Test Feature Request',
      description: 'This is a test',
      type: 'feature',
      board: 'Web App'
    }
  );
  
  // Test 4: Search requests
  await testEndpoint(
    'Search requests',
    'GET',
    '/api/requests?q=test'
  );
  
  // Test 5: Sort by votes
  await testEndpoint(
    'Sort requests by votes',
    'GET',
    '/api/requests?sort=votes'
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests completed!\n');
  console.log('Note: Auth-required endpoints will return 401 without login.');
  console.log('To fully test, login at http://localhost:3001/login first.\n');
}

runTests().catch(console.error);
