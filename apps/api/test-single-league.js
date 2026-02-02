const axios = require('axios');

async function testSingleLeague() {
  console.log('⚽ Testing single Premier League request...\n');
  
  const apiKey = '21c245fe93f74cd0ac4ff821f3e1c26b';
  
  try {
    console.log('🔄 Making request to Football-Data.org...');
    
    const response = await axios.get(
      'https://api.football-data.org/v4/competitions/PL/matches',
      {
        headers: {
          'X-Auth-Token': apiKey
        },
        params: {
          status: 'SCHEDULED'
        }
      }
    );

    console.log(`✅ SUCCESS! Found ${response.data.matches.length} scheduled Premier League matches`);
    
    if (response.data.matches.length > 0) {
      console.log('\n📋 First 3 upcoming matches:');
      console.log('════════════════════════════════════════');
      
      response.data.matches.slice(0, 3).forEach((match, i) => {
        const date = new Date(match.utcDate);
        console.log(`${i + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name}`);
        console.log(`   📅 ${date.toLocaleDateString('en-GB')} at ${date.toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}`);
        console.log(`   🏟️  ${match.venue || 'TBD'}`);
        console.log(`   🆔 Match ID: ${match.id}`);
        console.log('');
      });
    }

    // Check rate limit headers
    console.log('\n📊 API Usage Info:');
    console.log(`   Rate Limit: ${response.headers['x-requests-available-minute']} requests remaining this minute`);
    console.log(`   Daily Limit: ${response.headers['x-requestcounter-reset']} seconds until reset`);

  } catch (error) {
    if (error.response?.status === 429) {
      console.log('⏱️  Rate limit exceeded. Free tier allows 10 requests per minute.');
      console.log('   Waiting is required between requests.');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

testSingleLeague();