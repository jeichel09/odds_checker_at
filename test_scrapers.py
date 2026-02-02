"""
Test script for Austrian bookmaker scrapers
This demonstrates the proof of concept by testing Lottoland and win2day scrapers
"""
import asyncio
import os
import sys
from datetime import datetime
from loguru import logger

# Add src to Python path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from scrapers.base_scraper import ScraperManager
from scrapers.lottoland_scraper import LottolandScraper
from scrapers.win2day_scraper import Win2DayScraper

# Configure logging
logger.add("logs/scraper_test.log", rotation="1 day", retention="1 week", level="INFO")


async def test_single_scraper(scraper_class, scraper_name):
    """Test a single scraper"""
    logger.info(f"\n{'='*50}")
    logger.info(f"Testing {scraper_name} Scraper")
    logger.info(f"{'='*50}")
    
    try:
        scraper = scraper_class()
        
        async with scraper:
            # Test getting events
            logger.info("1. Testing event scraping...")
            events = await scraper.get_football_events()
            
            logger.info(f"Found {len(events)} events from {scraper_name}")
            
            # Display first few events
            for i, event in enumerate(events[:3]):
                logger.info(f"Event {i+1}: {event.home_team} vs {event.away_team}")
                logger.info(f"  Date: {event.match_date}")
                logger.info(f"  League: {event.league}")
                logger.info(f"  URL: {event.event_url}")
                logger.info("")
            
            # Test getting odds for first event if available
            if events:
                logger.info("2. Testing odds scraping...")
                first_event = events[0]
                logger.info(f"Getting odds for: {first_event.home_team} vs {first_event.away_team}")
                
                odds = await scraper.get_event_odds(first_event)
                
                if odds:
                    logger.info("Odds found!")
                    logger.info(f"  Home: {odds.home_odds}")
                    logger.info(f"  Draw: {odds.draw_odds}")
                    logger.info(f"  Away: {odds.away_odds}")
                else:
                    logger.warning("No odds found for this event")
            else:
                logger.warning("No events found, skipping odds test")
                
    except Exception as e:
        logger.error(f"Error testing {scraper_name}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())


async def test_scraper_manager():
    """Test the scraper manager with multiple scrapers"""
    logger.info(f"\n{'='*50}")
    logger.info("Testing Scraper Manager")
    logger.info(f"{'='*50}")
    
    try:
        # Create scraper manager and register scrapers
        manager = ScraperManager()
        manager.register_scraper(LottolandScraper())
        manager.register_scraper(Win2DayScraper())
        
        # Test scraping events from all scrapers
        logger.info("Scraping events from all registered scrapers...")
        all_events = await manager.scrape_all_events()
        
        for bookmaker, events in all_events.items():
            logger.info(f"{bookmaker}: {len(events)} events")
        
        # Find common events (if any) for odds comparison
        if all(len(events) > 0 for events in all_events.values()):
            logger.info("Testing odds comparison...")
            
            # Take first event from first bookmaker
            first_bookmaker = list(all_events.keys())[0]
            test_event = all_events[first_bookmaker][0]
            
            logger.info(f"Comparing odds for: {test_event.home_team} vs {test_event.away_team}")
            
            # Get odds from all scrapers for this event
            all_odds = await manager.scrape_odds_for_event(test_event)
            
            logger.info("Odds comparison:")
            for bookmaker, odds in all_odds.items():
                if odds:
                    logger.info(f"  {bookmaker}: {odds.home_odds}-{odds.draw_odds}-{odds.away_odds}")
                else:
                    logger.info(f"  {bookmaker}: No odds found")
        
    except Exception as e:
        logger.error(f"Error testing scraper manager: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())


async def main():
    """Main test function"""
    logger.info("Starting Austrian Bookmaker Scraper Tests")
    logger.info(f"Test started at: {datetime.now()}")
    
    # Create logs directory if it doesn't exist
    os.makedirs("logs", exist_ok=True)
    
    # Test individual scrapers
    await test_single_scraper(Win2DayScraper, "win2day")
    await test_single_scraper(LottolandScraper, "Lottoland")
    
    # Test scraper manager
    await test_scraper_manager()
    
    logger.info(f"\nAll tests completed at: {datetime.now()}")


if __name__ == "__main__":
    # Install Playwright browsers if not already installed
    logger.info("Ensuring Playwright browsers are installed...")
    try:
        from playwright.async_api import async_playwright
        # This will ensure browsers are downloaded
        import subprocess
        result = subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], 
                              capture_output=True, text=True)
        if result.returncode != 0:
            logger.warning(f"Playwright install warning: {result.stderr}")
    except Exception as e:
        logger.warning(f"Could not check Playwright installation: {e}")
    
    # Run the tests
    asyncio.run(main())
