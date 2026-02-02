"""
Test script for tipp3 real scraper targeting specific league URLs
"""
import asyncio
import os
import sys
from datetime import datetime
from loguru import logger

# Add src to Python path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from scrapers.tipp3_real_scraper import Tipp3RealScraper

# Configure logging
logger.add("logs/tipp3_test.log", rotation="1 day", retention="1 week", level="DEBUG")


async def test_specific_league(scraper, league_name):
    """Test scraping a specific league"""
    logger.info(f"\n{'='*60}")
    logger.info(f"Testing {league_name}")
    logger.info(f"{'='*60}")
    
    try:
        async with scraper:
            # Get events from specific league
            events = await scraper.get_football_events([league_name])
            
            logger.info(f"Found {len(events)} events in {league_name}")
            
            if events:
                # Display first few events
                for i, event in enumerate(events[:3]):
                    logger.info(f"\nEvent {i+1}: {event.home_team} vs {event.away_team}")
                    logger.info(f"  Date: {event.match_date}")
                    logger.info(f"  League: {event.league}")
                    logger.info(f"  Event URL: {event.event_url}")
                    logger.info(f"  Event ID: {event.bookmaker_event_id}")
                
                # Try to get detailed odds for first event
                if events[0].event_url and 'eventdetails' in events[0].event_url:
                    logger.info(f"\n{'*'*40}")
                    logger.info("Testing detailed odds extraction")
                    logger.info(f"{'*'*40}")
                    
                    first_event = events[0]
                    logger.info(f"Getting odds for: {first_event.home_team} vs {first_event.away_team}")
                    logger.info(f"Event URL: {first_event.event_url}")
                    
                    odds = await scraper.get_event_odds(first_event)
                    
                    if odds:
                        logger.info("✅ Successfully extracted odds!")
                        logger.info(f"1X2 Odds: {odds.home_odds} - {odds.draw_odds} - {odds.away_odds}")
                        
                        # Check for additional odds
                        if hasattr(odds, 'btts_yes') and odds.btts_yes:
                            logger.info(f"BTTS: Yes {odds.btts_yes}, No {getattr(odds, 'btts_no', 'N/A')}")
                        
                        if hasattr(odds, 'over_25') and odds.over_25:
                            logger.info(f"O/U 2.5: Over {odds.over_25}, Under {getattr(odds, 'under_25', 'N/A')}")
                        
                        if hasattr(odds, 'over_35') and odds.over_35:
                            logger.info(f"O/U 3.5: Over {odds.over_35}, Under {getattr(odds, 'under_35', 'N/A')}")
                        
                        if hasattr(odds, 'exact_scores') and odds.exact_scores:
                            logger.info(f"Exact scores found: {len(odds.exact_scores)} different scores")
                            for score, score_odds in list(odds.exact_scores.items())[:5]:  # Show first 5
                                logger.info(f"  {score}: {score_odds}")
                    else:
                        logger.warning("❌ No odds extracted")
                else:
                    logger.warning("No event detail URL found for odds extraction")
            else:
                logger.warning("No events found in this league")
                
    except Exception as e:
        logger.error(f"Error testing {league_name}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())


async def test_all_leagues():
    """Test all available leagues"""
    logger.info(f"\n{'='*60}")
    logger.info("Testing ALL leagues")
    logger.info(f"{'='*60}")
    
    scraper = Tipp3RealScraper()
    
    try:
        async with scraper:
            # Get events from all leagues
            all_events = await scraper.get_football_events()
            
            logger.info(f"Total events found across all leagues: {len(all_events)}")
            
            # Group events by league
            leagues = {}
            for event in all_events:
                if event.league not in leagues:
                    leagues[event.league] = []
                leagues[event.league].append(event)
            
            # Show summary by league
            for league, events in leagues.items():
                logger.info(f"{league}: {len(events)} events")
                
                # Show first event from each league
                if events:
                    first_event = events[0]
                    logger.info(f"  Example: {first_event.home_team} vs {first_event.away_team}")
            
            # Test odds extraction on first available event with detail URL
            detail_events = [e for e in all_events if e.event_url and 'eventdetails' in e.event_url]
            
            if detail_events:
                logger.info(f"\nTesting odds extraction on {len(detail_events)} events with detail URLs")
                
                # Test first event with detail URL
                test_event = detail_events[0]
                logger.info(f"Testing odds for: {test_event.home_team} vs {test_event.away_team}")
                
                odds = await scraper.get_event_odds(test_event)
                if odds:
                    logger.info("✅ Odds extraction successful!")
                    logger.info(f"Basic odds: {odds.home_odds} - {odds.draw_odds} - {odds.away_odds}")
                else:
                    logger.warning("❌ Odds extraction failed")
                    
    except Exception as e:
        logger.error(f"Error in comprehensive test: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())


async def main():
    """Main test function"""
    logger.info("Starting tipp3 Real Scraper Tests")
    logger.info(f"Test started at: {datetime.now()}")
    
    # Create logs directory
    os.makedirs("logs", exist_ok=True)
    
    # Test priority leagues first
    priority_leagues = [
        "Austrian Bundesliga",  # Most important for Austrian customers
        "Premier League",       # Most popular international
        "German Bundesliga"     # Close to Austria, popular
    ]
    
    logger.info("Testing priority leagues individually...")
    
    for league in priority_leagues:
        scraper = Tipp3RealScraper()
        await test_specific_league(scraper, league)
        await asyncio.sleep(2)  # Brief pause between tests
    
    # Test all leagues together
    logger.info("\nTesting comprehensive scraping...")
    await test_all_leagues()
    
    logger.info(f"\n{'='*60}")
    logger.info("All tipp3 tests completed!")
    logger.info(f"Test completed at: {datetime.now()}")
    logger.info("Check logs/tipp3_test.log for detailed results")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())
