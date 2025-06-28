const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const API_KEY = 'demo-key-123'; // Sample API key

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check Response:', data);
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
  }
}

async function testGetTransactions() {
  console.log('\n🔍 Testing Get Transactions...');
  try {
    const response = await fetch(`${BASE_URL}/transactions`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Get Transactions Failed:', error);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Get Transactions Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Get Transactions Failed:', error.message);
  }
}

async function testGetTransactionById() {
  console.log('\n🔍 Testing Get Transaction by ID...');
  try {
    const response = await fetch(`${BASE_URL}/transactions/1`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Get Transaction by ID Failed:', error);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Get Transaction by ID Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Get Transaction by ID Failed:', error.message);
  }
}

async function testInvalidApiKey() {
  console.log('\n🔍 Testing Invalid API Key...');
  try {
    const response = await fetch(`${BASE_URL}/transactions`, {
      headers: {
        'X-API-Key': 'invalid-key'
      }
    });
    
    const data = await response.json();
    console.log('✅ Invalid API Key Response (Expected Error):');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Invalid API Key Test Failed:', error.message);
  }
}

async function testMissingApiKey() {
  console.log('\n🔍 Testing Missing API Key...');
  try {
    const response = await fetch(`${BASE_URL}/transactions`);
    
    const data = await response.json();
    console.log('✅ Missing API Key Response (Expected Error):');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Missing API Key Test Failed:', error.message);
  }
}

async function testApiDocs() {
  console.log('\n🔍 Testing API Documentation...');
  try {
    const response = await fetch(`${BASE_URL}/docs`);
    const data = await response.json();
    console.log('✅ API Documentation Response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ API Documentation Test Failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API Tests...\n');
  
  await testHealthCheck();
  await testGetTransactions();
  await testGetTransactionById();
  await testInvalidApiKey();
  await testMissingApiKey();
  await testApiDocs();
  
  console.log('\n✨ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testGetTransactions,
  testGetTransactionById,
  testInvalidApiKey,
  testMissingApiKey,
  testApiDocs,
  runAllTests
}; 