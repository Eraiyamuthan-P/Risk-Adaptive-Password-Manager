// Quick test script to verify location detection
// Run with: node test-location.js

const axios = require('axios');

async function testLocationDetection(ip) {
  console.log('═══════════════════════════════════════════════');
  console.log('🧪 TESTING LOCATION DETECTION');
  console.log(`Testing IP: ${ip}`);
  console.log('═══════════════════════════════════════════════\n');

  // Test Primary API (ipapi.co)
  console.log('📡 Testing Primary API: ipapi.co');
  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 5000,
      headers: { 'User-Agent': 'Password-Manager-Node' }
    });
    
    if (response.data && !response.data.error && response.data.city) {
      console.log('✅ Primary API Success:');
      console.log(`   City: ${response.data.city}`);
      console.log(`   Country: ${response.data.country_name}`);
      console.log(`   Region: ${response.data.region}`);
      console.log(`   Timezone: ${response.data.timezone}`);
    } else {
      console.log('❌ Primary API returned invalid data');
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Primary API Failed:', error.message);
  }

  console.log('\n───────────────────────────────────────────────\n');

  // Test Fallback API (ip-api.com)
  console.log('📡 Testing Fallback API: ip-api.com');
  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}`, {
      timeout: 5000
    });
    
    if (response.data && response.data.status === 'success') {
      console.log('✅ Fallback API Success:');
      console.log(`   City: ${response.data.city}`);
      console.log(`   Country: ${response.data.country}`);
      console.log(`   Region: ${response.data.regionName}`);
      console.log(`   ISP: ${response.data.isp}`);
      console.log(`   Timezone: ${response.data.timezone}`);
    } else {
      console.log('❌ Fallback API returned error');
      console.log('   Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Fallback API Failed:', error.message);
  }

  console.log('\n═══════════════════════════════════════════════');
}

// Get IP from command line argument or use the one from the email
const testIP = process.argv[2] || '106.192.169.197'; // IP from user's email

testLocationDetection(testIP)
  .then(() => {
    console.log('\n✅ Test completed!');
    console.log('\n💡 If both APIs work here but fail in your app:');
    console.log('   1. Check server logs for detailed error messages');
    console.log('   2. Verify axios is installed: npm install axios');
    console.log('   3. Check if your server has internet access');
    console.log('   4. Restart your Node.js server\n');
  })
  .catch(err => {
    console.error('Test error:', err);
  });
