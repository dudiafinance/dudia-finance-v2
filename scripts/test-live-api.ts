const API_BASE = 'http://localhost:3000';
const DEBUG_HEADER = {
  'x-debug-bypass': 'debug-token-default',
  'Content-Type': 'application/json'
};

async function testInsightsAPI() {
  console.log('=== Testing AI Insights API ===\n');
  
  try {
    console.log('1. Testing without auth (should return 401)...');
    const noAuthResponse = await fetch(`${API_BASE}/api/ai/insights`, {
      method: 'GET'
    });
    console.log(`   Status: ${noAuthResponse.status} (expected: 401)`);
    
    console.log('\n2. Testing with debug auth...');
    const response = await fetch(`${API_BASE}/api/ai/insights`, {
      method: 'GET',
      headers: {
        'x-debug-bypass': 'debug-token-default'
      }
    });
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('\n   Response data:');
      console.log(JSON.stringify(data, null, 2));
    } else if (response.status === 401) {
      console.log('   User not found in database or auth bypass failed');
      const text = await response.text();
      console.log('   Response:', text);
    } else {
      console.log('   Response:', await response.text());
    }
  } catch (error) {
    console.error('Error:', error);
    if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
      console.log('\n⚠️  Server not running on localhost:3000');
      console.log('   Please start the server with: npm run dev');
    }
  }
}

async function testChatAPI() {
  console.log('\n\n=== Testing Chat API ===\n');
  
  try {
    console.log('1. Testing without auth (should return 401)...');
    const noAuthResponse = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
    });
    console.log(`   Status: ${noAuthResponse.status} (expected: 401)`);
    
    console.log('\n2. Testing with debug auth...');
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: {
        'x-debug-bypass': 'debug-token-default',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        messages: [{ role: 'user', content: 'Qual é o meu saldo?' }] 
      })
    });
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('   ✓ Chat API is working (streaming response)');
      const text = await response.text();
      console.log('   Response preview:', text.substring(0, 200) + '...');
    } else if (response.status === 401) {
      console.log('   User not found in database or auth bypass failed');
    } else if (response.status === 400) {
      const text = await response.text();
      console.log('   API Key missing:', text);
    } else {
      console.log('   Response:', await response.text());
    }
  } catch (error) {
    console.error('Error:', error);
    if ((error as NodeJS.ErrnoException).code === 'ECONNREFUSED') {
      console.log('\n⚠️  Server not running on localhost:3000');
      console.log('   Please start the server with: npm run dev');
    }
  }
}

async function runTests() {
  await testInsightsAPI();
  await testChatAPI();
}

runTests();