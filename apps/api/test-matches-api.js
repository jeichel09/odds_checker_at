const axios = require('axios');

async function testMatchesAPI() {
  console.log('🏈 Testing updated matches API with real data...\n');

  const baseURL = 'http://localhost:3001/api';
  
  try {
    // Test 1: Get upcoming matches (default)
    console.log('📊 Testing GET /api/matches (upcoming)...');
    const upcomingResponse = await axios.get(`${baseURL}/matches`);
    console.log(`✅ Found ${upcomingResponse.data.data.length} upcoming matches`);
    console.log(`   📡 Source: ${upcomingResponse.data.meta.source}`);
    
    if (upcomingResponse.data.data.length > 0) {
      const sample = upcomingResponse.data.data[0];
      console.log(`   🔍 Sample: ${sample.homeTeam.name} vs ${sample.awayTeam.name}`);
      console.log(`   📅 Date: ${new Date(sample.kickoffTime).toLocaleDateString('en-GB')}`);
      console.log(`   🏆 League: ${sample.league.name} (${sample.league.country})`);
    }
    console.log('');

    // Test 2: Get today's matches
    console.log('📊 Testing GET /api/matches?date=today...');
    const todayResponse = await axios.get(`${baseURL}/matches?date=today`);
    console.log(`✅ Found ${todayResponse.data.data.length} matches today`);
    
    if (todayResponse.data.data.length > 0) {
      console.log('   🗓️  Today\'s matches:');
      todayResponse.data.data.slice(0, 3).forEach((match, i) => {
        const time = new Date(match.kickoffTime).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`      ${i + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name} - ${time} (${match.league.name})`);
      });
    }
    console.log('');

    // Test 3: Get German Bundesliga matches
    console.log('📊 Testing GET /api/matches?league=bl1...');
    const bundesligaResponse = await axios.get(`${baseURL}/matches?league=bl1`);
    console.log(`✅ Found ${bundesligaResponse.data.data.length} German Bundesliga matches`);
    
    if (bundesligaResponse.data.data.length > 0) {
      console.log('   🇩🇪 Bundesliga fixtures:');
      bundesligaResponse.data.data.slice(0, 3).forEach((match, i) => {
        const date = new Date(match.kickoffTime).toLocaleDateString('en-GB');
        console.log(`      ${i + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name} - ${date}`);
      });
    }
    console.log('');

    // Test 4: Test caching by making the same request again
    console.log('📊 Testing caching (same request again)...');
    const startTime = Date.now();
    const cachedResponse = await axios.get(`${baseURL}/matches?league=bl1`);
    const endTime = Date.now();
    
    console.log(`✅ Cached response received in ${endTime - startTime}ms`);
    console.log(`   📡 Source: ${cachedResponse.data.meta.source || 'Not specified'}`);
    
    console.log('\n🎉 Matches API test completed successfully!');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Could not connect to API server. Make sure it\'s running on port 3001.');
      console.log('   To start the server, run: npm run dev in the apps/api directory');
    } else {
      console.error('❌ Error testing matches API:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
    }
  }
}

// Run the test
if (require.main === module) {
  testMatchesAPI();
}

module.exports = testMatchesAPI;