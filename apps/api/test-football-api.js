const footballApi = require('./src/services/footballApi');

async function testFootballApi() {
  console.log('🏈 Testing Football API Service...\n');

  try {
    // Test 1: Get German Bundesliga fixtures
    console.log('📊 Testing German Bundesliga (OpenLigaDB)...');
    const bundesligaFixtures = await footballApi.getOpenLigaFixtures('bl1');
    console.log(`✅ Found ${bundesligaFixtures.length} Bundesliga fixtures`);
    
    if (bundesligaFixtures.length > 0) {
      const upcoming = bundesligaFixtures.filter(f => !f.isFinished);
      const finished = bundesligaFixtures.filter(f => f.isFinished);
      console.log(`   📅 Upcoming: ${upcoming.length}, Finished: ${finished.length}`);
      
      // Show sample fixture
      const sample = bundesligaFixtures[0];
      console.log(`   🔍 Sample: ${sample.homeTeam.name} vs ${sample.awayTeam.name} (${new Date(sample.dateTime).toLocaleDateString()})`);
    }

    console.log('');

    // Test 2: Get Austrian Bundesliga fixtures  
    console.log('📊 Testing Austrian Bundesliga (OpenLigaDB)...');
    const austrianFixtures = await footballApi.getOpenLigaFixtures('öbl1');
    console.log(`✅ Found ${austrianFixtures.length} Austrian Bundesliga fixtures`);

    if (austrianFixtures.length > 0) {
      const sample = austrianFixtures[0];
      console.log(`   🔍 Sample: ${sample.homeTeam.name} vs ${sample.awayTeam.name} (${new Date(sample.dateTime).toLocaleDateString()})`);
    }

    console.log('');

    // Test 3: Get all fixtures
    console.log('📊 Testing getAllFixtures()...');
    const allFixtures = await footballApi.getAllFixtures();
    console.log(`✅ Total fixtures from all leagues: ${allFixtures.length}`);

    // Group by league
    const byLeague = allFixtures.reduce((acc, fixture) => {
      acc[fixture.league] = (acc[fixture.league] || 0) + 1;
      return acc;
    }, {});

    console.log('   📊 Fixtures by league:');
    Object.entries(byLeague).forEach(([league, count]) => {
      console.log(`      ${league}: ${count} fixtures`);
    });

    console.log('');

    // Test 4: Get upcoming fixtures
    console.log('📊 Testing getUpcomingFixtures()...');
    const upcomingFixtures = await footballApi.getUpcomingFixtures();
    console.log(`✅ Found ${upcomingFixtures.length} upcoming fixtures`);

    if (upcomingFixtures.length > 0) {
      console.log('   📅 Next 3 upcoming matches:');
      upcomingFixtures.slice(0, 3).forEach((fixture, i) => {
        const date = new Date(fixture.dateTime).toLocaleDateString('en-GB');
        const time = new Date(fixture.dateTime).toLocaleTimeString('en-GB', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        console.log(`      ${i + 1}. ${fixture.homeTeam.name} vs ${fixture.awayTeam.name} - ${date} ${time} (${fixture.league})`);
      });
    }

    console.log('');

    // Test 5: Get today's fixtures
    console.log('📊 Testing getTodayFixtures()...');
    const todayFixtures = await footballApi.getTodayFixtures();
    console.log(`✅ Found ${todayFixtures.length} fixtures today`);

    if (todayFixtures.length > 0) {
      console.log('   🗓️ Today\'s matches:');
      todayFixtures.forEach((fixture, i) => {
        const time = new Date(fixture.dateTime).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        });
        console.log(`      ${i + 1}. ${fixture.homeTeam.name} vs ${fixture.awayTeam.name} - ${time} (${fixture.league})`);
      });
    }

    console.log('\n🎉 Football API Service test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing Football API Service:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testFootballApi();
}

module.exports = testFootballApi;