"""
Test script for corrected BTTS extraction from event detail pages
"""
import asyncio
import sys
import os
from pathlib import Path
from loguru import logger

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from scrapers.tipp3_enhanced_scraper import Tipp3EnhancedScraper


async def test_btts_correction():
    """Test the corrected BTTS extraction from event detail pages"""
    logger.info("🔧 Testing BTTS Odds Correction...")
    
    scraper = Tipp3EnhancedScraper()
    
    try:
        # Initialize browser
        await scraper.start_browser()
        logger.info("✅ Browser initialized successfully")
        
        # Test with just a few events from Austrian Bundesliga
        test_leagues = ["Austrian Bundesliga"]
        
        logger.info(f"📡 Scraping events from leagues: {test_leagues}")
        events = await scraper.get_football_events(leagues=test_leagues)
        
        logger.info(f"📊 Total events found: {len(events)}")
        
        if events:
            # Test detailed analysis on just the first 3 events to save time
            logger.info("\\n🔍 Testing BTTS Correction on First 3 Events:")
            
            for i, event in enumerate(events[:3]):
                logger.info(f"\\n--- Event {i+1}: {event.home_team} vs {event.away_team} ---")
                logger.info(f"Event ID: {event.bookmaker_event_id}")
                
                if hasattr(event, 'enhanced_odds_data'):
                    odds_data = event.enhanced_odds_data
                    
                    # Display 1X2 odds
                    logger.info(f"🎯 1X2 Odds: {odds_data.get('home_odds')} - {odds_data.get('draw_odds')} - {odds_data.get('away_odds')}")
                    
                    # Check BTTS odds
                    btts_yes = odds_data.get('btts_yes')
                    btts_no = odds_data.get('btts_no')
                    
                    if btts_yes and btts_no:
                        logger.info(f"✅ BTTS Corrected: Yes {btts_yes}, No {btts_no}")
                        
                        # Validate BTTS odds make sense
                        if 1.3 <= btts_yes <= 3.5 and 1.3 <= btts_no <= 3.5:
                            logger.info("✅ BTTS odds are in reasonable range")
                        else:
                            logger.warning(f"⚠️  BTTS odds seem unusual: Yes {btts_yes}, No {btts_no}")
                    else:
                        logger.warning(f"❌ BTTS odds not found: Yes {btts_yes}, No {btts_no}")
                        
                        # Show what we have for debugging
                        if 'btts_yes' in odds_data or 'btts_no' in odds_data:
                            logger.info(f"Debug: btts_yes={odds_data.get('btts_yes')}, btts_no={odds_data.get('btts_no')}")
        
        # Save corrected results
        logger.info("\\n💾 Saving corrected results to JSON...")
        json_filename = scraper.save_results_to_json("tipp3_btts_corrected_results.json")
        
        if json_filename and os.path.exists(json_filename):
            logger.info(f"✅ JSON file created: {json_filename}")
            
            # Quick analysis of results
            import json
            with open(json_filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if data:
                logger.info(f"📋 JSON contains {len(data)} event entries")
                
                # Count how many have correct BTTS odds
                btts_count = 0
                for entry in data:
                    odds = entry.get('odds', {})
                    if odds.get('btts_yes') and odds.get('btts_no'):
                        btts_count += 1
                
                logger.info(f"📊 Events with BTTS odds: {btts_count}/{len(data)}")
                logger.info(f"📈 Success rate: {btts_count/len(data)*100:.1f}%")
                
                # Show a sample
                if data and data[0].get('odds', {}).get('btts_yes'):
                    sample = data[0]
                    sample_odds = sample.get('odds', {})
                    logger.info("\\n📝 Sample corrected entry:")
                    logger.info(f"Event: {sample['home_team']} vs {sample['away_team']}")
                    logger.info(f"1X2: [{sample_odds.get('home_odds')}, {sample_odds.get('draw_odds')}, {sample_odds.get('away_odds')}]")
                    logger.info(f"BTTS: Yes {sample_odds.get('btts_yes')}, No {sample_odds.get('btts_no')}")
        
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
        asyncio.run(test_btts_correction())
        logger.info("🎉 BTTS correction test completed!")
        
    except KeyboardInterrupt:
        logger.info("❌ Test interrupted by user")
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        sys.exit(1)
