const axios = require('axios');

const API_KEY = '2922133b84mshaab3a1385f58f43p1b285djsn36032987880b';

async function testAustrianFootballAPI() {
  console.log('=== Testing Austrian Bundesliga API (League ID 38) ===\n');

  const headers = {
    'x-rapidapi-key': API_KEY,
    'x-rapidapi-host': 'free-api-live-football-data.p.rapidapi.com'
  };

  try {
    // Test 1: Get Austrian Bundesliga logo (we know this works)
    console.log('1. Testing Austrian Bundesliga league logo...');
    const logoResponse = await axios.get('https://free-api-live-football-data.p.rapidapi.com/football-get-league-logo?leagueid=38', { headers });
    console.log('Logo API Status:', logoResponse.data.status);
    console.log('Logo URL:', logoResponse.data.response?.url);
    console.log('');

    // Test 2: Try different endpoints to get match data
    console.log('2. Testing different match endpoints...');
    const possibleEndpoints = [
      'https://free-api-live-football-data.p.rapidapi.com/football-matches-by-league?leagueid=38',
      'https://free-api-live-football-data.p.rapidapi.com/football-league-matches?leagueid=38',
      'https://free-api-live-football-data.p.rapidapi.com/matches?league=38',
      'https://free-api-live-football-data.p.rapidapi.com/fixtures?league=38',
      'https://free-api-live-football-data.p.rapidapi.com/football-get-matches?leagueid=38',
      'https://free-api-live-football-data.p.rapidapi.com/league-matches?id=38'
    ];

    let foundData = false;

    for (const endpoint of possibleEndpoints) {
      console.log(`  Testing: ${endpoint}`);
      try {
        const response = await axios.get(endpoint, { headers });
        
        if (response.data && response.data.status === 'success' && response.data.response) {
          console.log(`  ✅ SUCCESS! Found data at: ${endpoint}`);
          console.log(`  Response type:`, typeof response.data.response);
          console.log(`  Response length:`, Array.isArray(response.data.response) ? response.data.response.length : 'Not an array');
          
          if (Array.isArray(response.data.response) && response.data.response.length > 0) {
            console.log(`  Sample match data:`);
            const sampleMatch = response.data.response[0];
            console.log(`    ID: ${sampleMatch.id}`);
            console.log(`    Home: ${sampleMatch.homeTeam?.name || sampleMatch.home?.name || 'Unknown'}`);
            console.log(`    Away: ${sampleMatch.awayTeam?.name || sampleMatch.away?.name || 'Unknown'}`);
            console.log(`    Date: ${sampleMatch.utcTime || sampleMatch.date || sampleMatch.kickoff}`);
            console.log(`    Status: ${sampleMatch.status?.description || sampleMatch.status || 'Unknown'}`);
            
            // Look for upcoming matches (game-id 47+)
            const upcomingMatches = response.data.response.filter(match => match.id >= 47);
            console.log(`  Matches with ID >= 47: ${upcomingMatches.length}`);
            
            if (upcomingMatches.length > 0) {
              console.log(`  First upcoming match:`);
              const firstUpcoming = upcomingMatches[0];
              console.log(`    ${firstUpcoming.homeTeam?.name || firstUpcoming.home?.name} vs ${firstUpcoming.awayTeam?.name || firstUpcoming.away?.name}`);
            }
          }
          foundData = true;
          console.log('');
          break;
        } else {
          console.log(`  ❌ No valid response structure`);
        }
      } catch (error) {
        console.log(`  ❌ Failed: ${error.response?.status || error.message}`);
      }
    }

    if (!foundData) {
      console.log('\n3. No working endpoints found. Let\'s try a generic approach...');
      // Try to find what endpoints are available by testing base paths
      const basePaths = [
        'https://free-api-live-football-data.p.rapidapi.com/football',
        'https://free-api-live-football-data.p.rapidapi.com/matches',
        'https://free-api-live-football-data.p.rapidapi.com/fixtures'
      ];
      
      for (const basePath of basePaths) {
        try {
          console.log(`  Testing base path: ${basePath}`);
          const response = await axios.get(basePath, { headers });
          console.log(`  ✅ Base path works: ${basePath}`);
          console.log(`  Response:`, response.data);
        } catch (error) {
          console.log(`  ❌ Base path failed: ${basePath} - ${error.response?.status}`);
        }
      }
    }

  } catch (error) {
    console.error('API Test Failed:', error.response?.data || error.message);
  }
}

testAustrianFootballAPI();