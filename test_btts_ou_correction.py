"""
Test script for corrected BTTS and Over/Under extraction from event detail pages
"""
import asyncio
import sys
import os
from pathlib import Path
from loguru import logger

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from scrapers.tipp3_enhanced_scraper import Tipp3EnhancedScraper


async def test_btts_ou_correction():
    """Test the corrected BTTS and O/U extraction from event detail pages"""
    logger.info("🔧 Testing BTTS and O/U Odds Correction...")
    
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
            logger.info("\\n🔍 Testing BTTS and O/U Correction on First 3 Events:")
            
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
                        logger.info(f"✅ BTTS: Yes {btts_yes}, No {btts_no}")
                    else:
                        logger.warning(f"❌ BTTS odds missing: Yes {btts_yes}, No {btts_no}")
                    
                    # Check O/U 2.5 odds
                    over_25 = odds_data.get('over_25')
                    under_25 = odds_data.get('under_25')
                    
                    if over_25 and under_25:
                        logger.info(f"✅ O/U 2.5: Over {over_25}, Under {under_25}")
                    else:
                        logger.warning(f"❌ O/U 2.5 odds missing: Over {over_25}, Under {under_25}")
                    
                    # Check O/U 3.5 odds
                    over_35 = odds_data.get('over_35')
                    under_35 = odds_data.get('under_35')
                    
                    if over_35 and under_35:
                        logger.info(f"✅ O/U 3.5: Over {over_35}, Under {under_35}")
                    else:
                        logger.info(f"ℹ️  O/U 3.5 odds: Over {over_35}, Under {under_35}")
                    
                    # Check for additional O/U thresholds
                    over_15 = odds_data.get('over_15')
                    under_15 = odds_data.get('under_15')
                    if over_15 and under_15:
                        logger.info(f"✅ O/U 1.5: Over {over_15}, Under {under_15}")
                    
                    over_45 = odds_data.get('over_45')
                    under_45 = odds_data.get('under_45')
                    if over_45 and under_45:
                        logger.info(f"✅ O/U 4.5: Over {over_45}, Under {under_45}")
        
        # Save corrected results
        logger.info("\\n💾 Saving corrected results to JSON...")
        json_filename = scraper.save_results_to_json("tipp3_btts_ou_corrected_results.json")
        
        if json_filename and os.path.exists(json_filename):
            logger.info(f"✅ JSON file created: {json_filename}")
            
            # Quick analysis of results
            import json
            with open(json_filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if data:
                logger.info(f"📋 JSON contains {len(data)} event entries")
                
                # Count how many have correct odds
                btts_count = 0
                ou25_count = 0
                ou35_count = 0
                ou15_count = 0
                ou45_count = 0
                
                for entry in data:
                    odds = entry.get('odds', {})
                    if odds.get('btts_yes') and odds.get('btts_no'):
                        btts_count += 1
                    if odds.get('over_25') and odds.get('under_25'):
                        ou25_count += 1
                    if odds.get('over_35') and odds.get('under_35'):
                        ou35_count += 1
                    if odds.get('over_15') and odds.get('under_15'):
                        ou15_count += 1
                    if odds.get('over_45') and odds.get('under_45'):
                        ou45_count += 1
                
                logger.info(f"\\n📊 Odds Extraction Success Rates:")
                logger.info(f"   BTTS odds: {btts_count}/{len(data)} ({btts_count/len(data)*100:.1f}%)")
                logger.info(f"   O/U 2.5 odds: {ou25_count}/{len(data)} ({ou25_count/len(data)*100:.1f}%)")
                logger.info(f"   O/U 3.5 odds: {ou35_count}/{len(data)} ({ou35_count/len(data)*100:.1f}%)")
                logger.info(f"   O/U 1.5 odds: {ou15_count}/{len(data)} ({ou15_count/len(data)*100:.1f}%)")
                logger.info(f"   O/U 4.5 odds: {ou45_count}/{len(data)} ({ou45_count/len(data)*100:.1f}%)")
                
                # Show a comprehensive sample
                if data:
                    sample = data[0]
                    sample_odds = sample.get('odds', {})
                    logger.info("\\n📝 Sample comprehensive entry:")
                    logger.info(f"Event: {sample['home_team']} vs {sample['away_team']}")
                    logger.info(f"1X2: [{sample_odds.get('home_odds')}, {sample_odds.get('draw_odds')}, {sample_odds.get('away_odds')}]")
                    logger.info(f"BTTS: Yes {sample_odds.get('btts_yes')}, No {sample_odds.get('btts_no')}")
                    logger.info(f"O/U 2.5: Over {sample_odds.get('over_25')}, Under {sample_odds.get('under_25')}")
                    logger.info(f"O/U 3.5: Over {sample_odds.get('over_35')}, Under {sample_odds.get('under_35')}")
                    if sample_odds.get('over_15'):
                        logger.info(f"O/U 1.5: Over {sample_odds.get('over_15')}, Under {sample_odds.get('under_15')}")
                    if sample_odds.get('over_45'):
                        logger.info(f"O/U 4.5: Over {sample_odds.get('over_45')}, Under {sample_odds.get('under_45')}")
        
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
        asyncio.run(test_btts_ou_correction())
        logger.info("🎉 BTTS and O/U correction test completed!")
        
    except KeyboardInterrupt:
        logger.info("❌ Test interrupted by user")
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        sys.exit(1)
