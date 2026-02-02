"""
Comprehensive test script for BTTS, Over/Under, and Correct Score extraction
"""
import asyncio
import sys
import os
from pathlib import Path
from loguru import logger

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from scrapers.tipp3_enhanced_scraper import Tipp3EnhancedScraper


async def test_comprehensive_odds_extraction():
    """Test the comprehensive odds extraction including BTTS, O/U, and Correct Score"""
    logger.info("🔧 Testing Comprehensive Odds Extraction (BTTS + O/U + Correct Score)...")
    
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
            # Test comprehensive analysis on just the first 2 events to save time
            logger.info("\\n🔍 Testing Comprehensive Odds Extraction on First 2 Events:")
            
            for i, event in enumerate(events[:2]):
                logger.info(f"\\n{'='*60}")
                logger.info(f"EVENT {i+1}: {event.home_team} vs {event.away_team}")
                logger.info(f"Event ID: {event.bookmaker_event_id}")
                logger.info(f"{'='*60}")
                
                if hasattr(event, 'enhanced_odds_data'):
                    odds_data = event.enhanced_odds_data
                    
                    # Display 1X2 odds
                    logger.info(f"🎯 1X2 ODDS: {odds_data.get('home_odds')} - {odds_data.get('draw_odds')} - {odds_data.get('away_odds')}")
                    
                    # Check BTTS odds
                    btts_yes = odds_data.get('btts_yes')
                    btts_no = odds_data.get('btts_no')
                    
                    if btts_yes and btts_no:
                        logger.info(f"✅ BTTS: Yes {btts_yes}, No {btts_no}")
                    else:
                        logger.warning(f"❌ BTTS odds missing: Yes {btts_yes}, No {btts_no}")
                    
                    # Check O/U odds
                    over_under_pairs = [
                        ('over_15', 'under_15', 'O/U 1.5'),
                        ('over_25', 'under_25', 'O/U 2.5'),
                        ('over_35', 'under_35', 'O/U 3.5'),
                        ('over_45', 'under_45', 'O/U 4.5')
                    ]
                    
                    for over_key, under_key, label in over_under_pairs:
                        over_odds = odds_data.get(over_key)
                        under_odds = odds_data.get(under_key)
                        
                        if over_odds and under_odds:
                            logger.info(f"✅ {label}: Over {over_odds}, Under {under_odds}")
                        else:
                            if over_odds or under_odds:
                                logger.info(f"⚠️  {label}: Over {over_odds}, Under {under_odds} (partial)")
                    
                    # Check Correct Score odds
                    exact_scores = odds_data.get('exact_scores', {})
                    
                    if exact_scores:
                        score_count = len(exact_scores)
                        logger.info(f"✅ CORRECT SCORE: {score_count} different scores available")
                        
                        # Show some sample scores
                        sample_scores = list(exact_scores.items())[:5]
                        logger.info("📝 Sample correct scores:")
                        for score, odds in sample_scores:
                            logger.info(f"   {score}: {odds}")
                        
                        if score_count > 5:
                            logger.info(f"   ... and {score_count - 5} more scores")
                    else:
                        logger.warning(f"❌ Correct score odds missing")
        
        # Save comprehensive results
        logger.info("\\n💾 Saving comprehensive results to JSON...")
        json_filename = scraper.save_results_to_json("tipp3_comprehensive_results.json")
        
        if json_filename and os.path.exists(json_filename):
            logger.info(f"✅ JSON file created: {json_filename}")
            
            # Comprehensive analysis of results
            import json
            with open(json_filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if data:
                logger.info(f"\\n📋 JSON contains {len(data)} event entries")
                
                # Count how many have each type of odds
                btts_count = 0
                ou25_count = 0
                ou35_count = 0
                ou15_count = 0
                ou45_count = 0
                correct_score_count = 0
                
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
                    if odds.get('exact_scores') and len(odds.get('exact_scores', {})) > 0:
                        correct_score_count += 1
                
                logger.info(f"\\n📊 COMPREHENSIVE ODDS EXTRACTION SUCCESS RATES:")
                logger.info(f"   BTTS odds: {btts_count}/{len(data)} ({btts_count/len(data)*100:.1f}%)")
                logger.info(f"   O/U 1.5 odds: {ou15_count}/{len(data)} ({ou15_count/len(data)*100:.1f}%)")
                logger.info(f"   O/U 2.5 odds: {ou25_count}/{len(data)} ({ou25_count/len(data)*100:.1f}%)")
                logger.info(f"   O/U 3.5 odds: {ou35_count}/{len(data)} ({ou35_count/len(data)*100:.1f}%)")
                logger.info(f"   O/U 4.5 odds: {ou45_count}/{len(data)} ({ou45_count/len(data)*100:.1f}%)")
                logger.info(f"   Correct Score odds: {correct_score_count}/{len(data)} ({correct_score_count/len(data)*100:.1f}%)")
                
                # Show a comprehensive sample
                if data:
                    sample = data[0]
                    sample_odds = sample.get('odds', {})
                    logger.info("\\n🎯 COMPREHENSIVE SAMPLE ENTRY:")
                    logger.info(f"Event: {sample['home_team']} vs {sample['away_team']}")
                    logger.info(f"1X2: [{sample_odds.get('home_odds')}, {sample_odds.get('draw_odds')}, {sample_odds.get('away_odds')}]")
                    logger.info(f"BTTS: Yes {sample_odds.get('btts_yes')}, No {sample_odds.get('btts_no')}")
                    
                    if sample_odds.get('over_15'):
                        logger.info(f"O/U 1.5: Over {sample_odds.get('over_15')}, Under {sample_odds.get('under_15')}")
                    if sample_odds.get('over_25'):
                        logger.info(f"O/U 2.5: Over {sample_odds.get('over_25')}, Under {sample_odds.get('under_25')}")
                    if sample_odds.get('over_35'):
                        logger.info(f"O/U 3.5: Over {sample_odds.get('over_35')}, Under {sample_odds.get('under_35')}")
                    if sample_odds.get('over_45'):
                        logger.info(f"O/U 4.5: Over {sample_odds.get('over_45')}, Under {sample_odds.get('under_45')}")
                    
                    exact_scores = sample_odds.get('exact_scores', {})
                    if exact_scores:
                        logger.info(f"Correct Scores: {len(exact_scores)} scores available")
                        sample_cs = list(exact_scores.items())[:3]
                        cs_text = ", ".join([f"{score}: {odds}" for score, odds in sample_cs])
                        logger.info(f"Sample: {cs_text}")
        
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
        asyncio.run(test_comprehensive_odds_extraction())
        logger.info("🎉 Comprehensive odds extraction test completed!")
        
    except KeyboardInterrupt:
        logger.info("❌ Test interrupted by user")
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        sys.exit(1)
