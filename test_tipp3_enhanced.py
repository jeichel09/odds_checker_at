"""
Test script for the enhanced tipp3 scraper that identifies bet types and saves to JSON
"""
import asyncio
import sys
import os
from pathlib import Path
from loguru import logger

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from scrapers.tipp3_enhanced_scraper import Tipp3EnhancedScraper


async def test_tipp3_enhanced_scraper():
    """Test the enhanced tipp3 scraper with bet type identification and JSON export"""
    logger.info("🚀 Testing Enhanced Tipp3 Scraper with Bet Type Identification...")
    
    scraper = Tipp3EnhancedScraper()
    
    try:
        # Initialize browser
        await scraper.start_browser()
        logger.info("✅ Browser initialized successfully")
        
        # Test with Austrian Bundesliga first to see specific odds
        test_leagues = ["Austrian Bundesliga"]
        
        logger.info(f"📡 Scraping events from leagues: {test_leagues}")
        events = await scraper.get_football_events(leagues=test_leagues)
        
        logger.info(f"📊 Total events found: {len(events)}")
        
        if events:
            # Display detailed analysis of first few events
            logger.info("\n🔍 Detailed Odds Analysis:")
            for i, event in enumerate(events[:5]):
                logger.info(f"\n--- Event {i+1}: {event.home_team} vs {event.away_team} ---")
                
                if hasattr(event, 'enhanced_odds_data'):
                    odds_data = event.enhanced_odds_data
                    
                    # Display raw odds for debugging
                    logger.info(f"Raw odds count: {odds_data.get('raw_odds_count', 0)}")
                    logger.info(f"Raw odds sample: {odds_data.get('raw_odds_sample', [])}")
                    
                    # Display identified bet types
                    logger.info(f"🎯 1X2 Odds: {odds_data.get('home_odds')} - {odds_data.get('draw_odds')} - {odds_data.get('away_odds')}")
                    
                    if odds_data.get('btts_yes'):
                        logger.info(f"⚽ BTTS: Yes {odds_data.get('btts_yes')}, No {odds_data.get('btts_no')}")
                    
                    if odds_data.get('over_25'):
                        logger.info(f"📈 O/U 2.5: Over {odds_data.get('over_25')}, Under {odds_data.get('under_25')}")
                    
                    if odds_data.get('over_35'):
                        logger.info(f"📊 O/U 3.5: Over {odds_data.get('over_35')}, Under {odds_data.get('under_35')}")
                    
                    if odds_data.get('exact_scores'):
                        logger.info(f"🎲 Exact Scores: {len(odds_data.get('exact_scores', {}))} found")
                        # Show first few exact scores
                        for score, odds in list(odds_data.get('exact_scores', {}).items())[:3]:
                            logger.info(f"   {score}: {odds}")
                
                # Test odds extraction
                odds = await scraper.get_event_odds(event)
                if odds:
                    logger.info(f"✅ ScrapedOdds created successfully")
                    logger.info(f"   Enhanced attributes available: BTTS={bool(odds.btts_yes)}, O/U 2.5={bool(odds.over_25)}, Exact={len(getattr(odds, 'exact_scores', {}))}")
                else:
                    logger.warning(f"❌ Could not create ScrapedOdds")
        
        # Save results to JSON
        logger.info("\n💾 Saving results to JSON...")
        json_filename = scraper.save_results_to_json()
        
        if json_filename and os.path.exists(json_filename):
            logger.info(f"✅ JSON file created: {json_filename}")
            
            # Show file size and first entry preview
            file_size = os.path.getsize(json_filename)
            logger.info(f"📁 File size: {file_size:,} bytes")
            
            # Quick preview of JSON content
            import json
            with open(json_filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if data:
                logger.info(f"📋 JSON contains {len(data)} event entries")
                logger.info("\n📝 Sample JSON entry:")
                sample_entry = data[0]
                logger.info(f"Event: {sample_entry['home_team']} vs {sample_entry['away_team']}")
                logger.info(f"League: {sample_entry['league']}")
                
                sample_odds = sample_entry.get('odds', {})
                logger.info(f"1X2: [{sample_odds.get('home_odds')}, {sample_odds.get('draw_odds')}, {sample_odds.get('away_odds')}]")
                logger.info(f"BTTS: Yes {sample_odds.get('btts_yes')}, No {sample_odds.get('btts_no')}")
                logger.info(f"O/U 2.5: Over {sample_odds.get('over_25')}, Under {sample_odds.get('under_25')}")
                logger.info(f"Exact scores: {len(sample_odds.get('exact_scores', {}))}")
        
        # Test with multiple leagues
        logger.info("\n🌍 Testing with Premier League as well...")
        all_leagues = ["Austrian Bundesliga", "Premier League"]  
        
        # Reset results for multi-league test
        scraper.scraped_results = []
        
        all_events = await scraper.get_football_events(leagues=all_leagues)
        logger.info(f"📊 Total events from both leagues: {len(all_events)}")
        
        # Save combined results
        combined_json = scraper.save_results_to_json("tipp3_combined_results.json")
        if combined_json:
            logger.info(f"✅ Combined results saved to: {combined_json}")
            
            # Final summary
            with open(combined_json, 'r', encoding='utf-8') as f:
                combined_data = json.load(f)
            
            logger.info(f"\n📈 Final Summary:")
            logger.info(f"   Total events: {len(combined_data)}")
            
            leagues_count = {}
            for entry in combined_data:
                league = entry['league']
                leagues_count[league] = leagues_count.get(league, 0) + 1
            
            for league, count in leagues_count.items():
                logger.info(f"   {league}: {count} events")
            
            # Count how many have each bet type
            btts_count = sum(1 for entry in combined_data if entry['odds'].get('btts_yes'))
            ou25_count = sum(1 for entry in combined_data if entry['odds'].get('over_25'))
            exact_count = sum(1 for entry in combined_data if entry['odds'].get('exact_scores'))
            
            logger.info(f"   Events with BTTS odds: {btts_count}")
            logger.info(f"   Events with O/U 2.5 odds: {ou25_count}")
            logger.info(f"   Events with exact score odds: {exact_count}")
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        raise
    
    finally:
        await scraper.close_browser()
        logger.info("🧹 Cleanup completed")


if __name__ == "__main__":
    # Set up logging
    logger.remove()
    logger.add(sys.stderr, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
    
    try:
        asyncio.run(test_tipp3_enhanced_scraper())
        logger.info("🎉 Enhanced scraper test completed!")
        
    except KeyboardInterrupt:
        logger.info("❌ Test interrupted by user")
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        sys.exit(1)
