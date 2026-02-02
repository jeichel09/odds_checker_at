const footballApi = require('./src/services/footballApi');

async function testPremierLeague() {
  console.log('⚽ Testing Premier League fixtures in detail...\n');

  try {
    // Set API key
    process.env.FOOTBALL_DATA_API_KEY = '21c245fe93f74cd0ac4ff821f3e1c26b';

    // Get Premier League fixtures
    const plFixtures = await footballApi.getFootballDataFixtures('PL', 'SCHEDULED');
    
    console.log(`✅ Found ${plFixtures.length} scheduled Premier League fixtures`);
    
    if (plFixtures.length > 0) {
      console.log('\n🔍 First 5 upcoming Premier League matches:');
      console.log('═══════════════════════════════════════════════════════════════');
      
      plFixtures.slice(0, 5).forEach((fixture, i) => {
        const date = new Date(fixture.dateTime);
        const dateStr = date.toLocaleDateString('en-GB');
        const timeStr = date.toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        console.log(`${i + 1}. ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
        console.log(`   📅 Date: ${dateStr} at ${timeStr}`);
        console.log(`   🏟️  Venue: ${fixture.venue || 'TBD'}`);
        console.log(`   🆔 Match ID: ${fixture.id}`);
        console.log(`   📊 Status: ${fixture.status}`);
        if (fixture.homeTeam.logo) {
          console.log(`   🏠 Home Logo: ${fixture.homeTeam.logo}`);
        }
        if (fixture.awayTeam.logo) {
          console.log(`   ✈️  Away Logo: ${fixture.awayTeam.logo}`);
        }
        console.log('');
      });

      // Show today's Premier League matches
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayMatches = plFixtures.filter(fixture => {
        const fixtureDate = new Date(fixture.dateTime);
        return fixtureDate >= today && fixtureDate < tomorrow;
      });

      if (todayMatches.length > 0) {
        console.log(`🗓️  TODAY'S PREMIER LEAGUE MATCHES (${todayMatches.length}):`);
        console.log('═══════════════════════════════════════════════');
        todayMatches.forEach((match, i) => {
          const time = new Date(match.dateTime).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          });
          console.log(`${i + 1}. ${match.homeTeam.name} vs ${match.awayTeam.name} - ${time}`);
        });
      } else {
        console.log('📭 No Premier League matches today');
      }

      // Show this weekend's matches
      const weekend = new Date();
      const daysUntilSaturday = (6 - weekend.getDay() + 7) % 7;
      weekend.setDate(weekend.getDate() + daysUntilSaturday);
      weekend.setHours(0, 0, 0, 0);
      
      const weekendEnd = new Date(weekend);
      weekendEnd.setDate(weekendEnd.getDate() + 2); // Sat + Sun

      const weekendMatches = plFixtures.filter(fixture => {
        const fixtureDate = new Date(fixture.dateTime);
        return fixtureDate >= weekend && fixtureDate < weekendEnd;
      });

      if (weekendMatches.length > 0) {
        console.log(`\n🎉 THIS WEEKEND'S PREMIER LEAGUE MATCHES (${weekendMatches.length}):`);
        console.log('═══════════════════════════════════════════════════════════');
        weekendMatches.forEach((match, i) => {
          const date = new Date(match.dateTime);
          const day = date.toLocaleDateString('en-GB', { weekday: 'long' });
          const time = date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          });
          console.log(`${i + 1}. ${day} ${time}: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
        });
      }
    }

    console.log('\n🎯 Premier League API test completed!');

  } catch (error) {
    console.error('❌ Error testing Premier League API:', error.message);
  }
}

testPremierLeague();