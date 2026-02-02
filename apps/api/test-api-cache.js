const footballApi = require('./src/services/footballApi');

async function testAPICache() {
  console.log('🔄 Testing Football API caching system...\n');

  try {
    // Test 1: First request (should fetch from API)
    console.log('📊 Making first request to German Bundesliga...');
    const start1 = Date.now();
    const fixtures1 = await footballApi.getOpenLigaFixtures('bl1');
    const end1 = Date.now();
    
    console.log(`✅ First request: ${fixtures1.length} fixtures in ${end1 - start1}ms`);

    // Test 2: Second request (should use cache)
    console.log('\n📊 Making second request (should be cached)...');
    const start2 = Date.now();
    const fixtures2 = await footballApi.getOpenLigaFixtures('bl1');
    const end2 = Date.now();
    
    console.log(`✅ Second request: ${fixtures2.length} fixtures in ${end2 - start2}ms`);
    
    if (end2 - start2 < end1 - start1) {
      console.log('🚀 Cache is working! Second request was faster.');
    }

    // Test 3: Check cache stats
    const cache = require('./src/services/cache');
    const stats = cache.getStats();
    
    console.log('\n📈 Cache Statistics:');
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Cache size: ${cache.size()}`);

    // Test 4: Today's fixtures (multiple league calls)
    console.log('\n📊 Testing getAllFixtures with caching...');
    const start3 = Date.now();
    const allFixtures = await footballApi.getAllFixtures();
    const end3 = Date.now();
    
    console.log(`✅ All fixtures: ${allFixtures.length} matches in ${end3 - start3}ms`);
    
    const finalStats = cache.getStats();
    console.log(`   Cache now has ${finalStats.totalEntries} entries`);

    console.log('\n🎉 API caching test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing API cache:', error.message);
  }
}

testAPICache();