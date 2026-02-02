"""
Test script for the fixed tipp3 scraper
"""
import asyncio
import sys
import os
from pathlib import Path
from loguru import logger

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from scrapers.tipp3_fixed_scraper import Tipp3FixedScraper


async def test_tipp3_fixed_scraper():
    """Test the fixed tipp3 scraper functionality"""
    logger.info("🔧 Testing Fixed Tipp3 Scraper...")
    
    scraper = Tipp3FixedScraper()
    
    try:
        # Initialize browser
        await scraper.start_browser()
        logger.info("✅ Browser initialized successfully")
        
        # Test with a single league first
        test_leagues = ["Austrian Bundesliga"]
        
        logger.info(f"📡 Scraping events from leagues: {test_leagues}")
        events = await scraper.get_football_events(leagues=test_leagues)
        
        logger.info(f"📊 Total events found: {len(events)}")
        
        if events:
            # Display first few events
            logger.info("\n🎯 Sample Events:")
            for i, event in enumerate(events[:5]):
                logger.info(f"{i+1}. {event.home_team} vs {event.away_team}")
                logger.info(f"   League: {event.league}")
                logger.info(f"   Event ID: {event.bookmaker_event_id}")
                logger.info(f"   URL: {event.event_url}")
                logger.info("")
            
            # Test odds extraction for the first event
            if len(events) > 0:
                test_event = events[0]
                logger.info(f"🎰 Testing odds extraction for: {test_event.home_team} vs {test_event.away_team}")
                
                odds = await scraper.get_event_odds(test_event)
                
                if odds:
                    logger.info("✅ Odds extracted successfully!")
                    logger.info(f"   Home: {odds.home_odds}")
                    logger.info(f"   Draw: {odds.draw_odds}")
                    logger.info(f"   Away: {odds.away_odds}")
                    
                    if hasattr(odds, 'btts_yes') and odds.btts_yes:
                        logger.info(f"   BTTS Yes: {odds.btts_yes}")
                    if hasattr(odds, 'over_25') and odds.over_25:
                        logger.info(f"   Over 2.5: {odds.over_25}")
                    if hasattr(odds, 'exact_scores') and odds.exact_scores:
                        logger.info(f"   Exact Scores: {len(odds.exact_scores)} found")
                else:
                    logger.warning("❌ No odds extracted")
        else:
            logger.warning("❌ No events found")
        
        # Test with multiple leagues
        logger.info("\n🌍 Testing with multiple leagues...")
        all_leagues = ["Austrian Bundesliga", "Premier League"]
        all_events = await scraper.get_football_events(leagues=all_leagues)
        
        logger.info(f"📊 Total events from all leagues: {len(all_events)}")
        
        # Group events by league
        events_by_league = {}
        for event in all_events:
            if event.league not in events_by_league:
                events_by_league[event.league] = []
            events_by_league[event.league].append(event)
        
        for league, league_events in events_by_league.items():
            logger.info(f"   {league}: {len(league_events)} events")
        
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        raise
    
    finally:
        await scraper.close_browser()
        logger.info("🧹 Cleanup completed")


async def test_structure_analysis():
    """Quick structure analysis of saved HTML files"""
    
    logger.info("🔍 Analyzing saved HTML structure...")
    
    # Check for saved HTML files
    html_files = [
        "tipp3_austrian_bundesliga.html",
        "tipp3_main_page.html"
    ]
    
    for html_file in html_files:
        if os.path.exists(html_file):
            logger.info(f"📄 Analyzing {html_file}...")
            
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Quick analysis
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')
            
            # Look for event links
            event_links = soup.find_all('a', href=lambda x: x and 'eventdetails' in x and 'eventID=' in x)
            logger.info(f"   Event detail links found: {len(event_links)}")
            
            # Look for team name links
            player_links = soup.find_all('a', class_=lambda x: x and 't3-list-entry__player' in ' '.join(x))
            logger.info(f"   Player/Team links found: {len(player_links)}")
            
            # Look for betting buttons
            bet_buttons = soup.find_all('button', class_=lambda x: x and 'bet' in ' '.join(x).lower())
            logger.info(f"   Betting buttons found: {len(bet_buttons)}")
            
            logger.info("")


if __name__ == "__main__":
    # Set up logging
    logger.remove()
    logger.add(sys.stderr, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
    
    try:
        # Run structure analysis first
        asyncio.run(test_structure_analysis())
        
        # Then test the scraper
        asyncio.run(test_tipp3_fixed_scraper())
        
        logger.info("🎉 All tests completed!")
        
    except KeyboardInterrupt:
        logger.info("❌ Tests interrupted by user")
    except Exception as e:
        logger.error(f"❌ Tests failed: {e}")
        sys.exit(1)
