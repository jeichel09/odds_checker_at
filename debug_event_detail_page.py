"""
Debug script to examine the HTML structure of tipp3 event detail pages
"""
import asyncio
import sys
import re
from pathlib import Path
from bs4 import BeautifulSoup
from loguru import logger

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from scrapers.tipp3_enhanced_scraper import Tipp3EnhancedScraper


async def debug_event_detail_page():
    """Debug the HTML structure of tipp3 event detail pages"""
    
    logger.info("🔍 Debug Analysis of Event Detail Page Structure...")
    
    scraper = Tipp3EnhancedScraper()
    
    try:
        await scraper.start_browser()
        
        # Use a specific event ID
        event_id = "6018513"  # Wolfsberger AC vs RB Salzburg
        event_url = f"{scraper.base_url}/sportwetten/eventdetails?eventID={event_id}&caller=PRO"
        
        logger.info(f"Navigating to: {event_url}")
        
        if not await scraper.safe_navigate(event_url):
            logger.error("Failed to navigate to event detail page")
            return
        
        await scraper.page.wait_for_timeout(5000)
        content = await scraper.page.content()
        
        # Save the full HTML for analysis
        with open(f"event_detail_{event_id}.html", "w", encoding="utf-8") as f:
            f.write(content)
        logger.info(f"Saved full HTML to event_detail_{event_id}.html")
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Look for all divs with t3-match-details__entry-header
        headers = soup.find_all('div', class_='t3-match-details__entry-header')
        logger.info(f"Found {len(headers)} match detail entry headers")
        
        for i, header in enumerate(headers[:10]):  # First 10
            header_text = header.get_text().strip()
            logger.info(f"Header {i+1}: '{header_text}'")
        
        # Look specifically for BTTS text patterns
        logger.info("\\n🎯 Looking for BTTS-related text patterns...")
        
        btts_patterns = [
            'Fällt für beide Teams mindestens je ein Tor?',
            'beide Teams',
            'mindestens je ein Tor',
            'Teams mindestens',
            'beiden Teams'
        ]
        
        for pattern in btts_patterns:
            elements = soup.find_all(text=re.compile(pattern, re.IGNORECASE))
            logger.info(f"Pattern '{pattern}': {len(elements)} matches")
            for elem in elements[:3]:  # First 3 matches
                logger.info(f"  Text: '{elem.strip()}'")
        
        # Look for all t3-match-details sections
        logger.info("\\n📊 Looking for all match details sections...")
        detail_entries = soup.find_all('div', class_='t3-match-details__entry')
        logger.info(f"Found {len(detail_entries)} match detail entries")
        
        for i, entry in enumerate(detail_entries[:5]):  # First 5 entries
            header = entry.find('div', class_='t3-match-details__entry-header')
            if header:
                header_text = header.get_text().strip()
                logger.info(f"Entry {i+1}: '{header_text}'")
                
                # Check if this entry has bet elements
                bet_elements = entry.find_all('div', class_='t3-bet-element')
                logger.info(f"  Bet elements: {len(bet_elements)}")
                
                if bet_elements:
                    for j, bet_elem in enumerate(bet_elements[:3]):
                        label = bet_elem.find('div', class_='t3-bet-element__label')
                        if label:
                            label_text = label.get_text().strip()
                            logger.info(f"    Bet {j+1}: '{label_text}'")
        
        # Look for any text containing "ja" and "nein"
        logger.info("\\n🔍 Looking for 'Ja' and 'Nein' labels...")
        ja_elements = soup.find_all(text=re.compile(r'\\bja\\b', re.IGNORECASE))
        nein_elements = soup.find_all(text=re.compile(r'\\bnein\\b', re.IGNORECASE))
        
        logger.info(f"Found {len(ja_elements)} 'Ja' elements")
        logger.info(f"Found {len(nein_elements)} 'Nein' elements")
        
        # Examine the structure around Ja/Nein elements
        for i, ja_elem in enumerate(ja_elements[:3]):
            logger.info(f"Ja element {i+1}:")
            parent = ja_elem.parent
            if parent:
                logger.info(f"  Parent tag: {parent.name}")
                logger.info(f"  Parent classes: {parent.get('class', [])}")
                
                # Look for nearby betting buttons
                bet_buttons = parent.find_all('button', class_='t3-bet-button')
                for btn in bet_buttons:
                    odds_span = btn.find('span', class_='t3-bet-button__text')
                    if odds_span:
                        odds_text = odds_span.get_text().strip()
                        logger.info(f"    Nearby odds: {odds_text}")
        
        logger.info("\\n📋 Searching for alternative structures...")
        
        # Alternative search patterns
        alt_selectors = [
            'div[class*="details"]',
            'div[class*="entry"]', 
            'div[class*="bet"]',
            '[data-js="accordion"]',
            '.t3-bet-element'
        ]
        
        for selector in alt_selectors:
            try:
                elements = soup.select(selector)
                logger.info(f"Selector '{selector}': {len(elements)} elements")
            except Exception as e:
                logger.debug(f"Error with selector '{selector}': {e}")
    
    except Exception as e:
        logger.error(f"Debug analysis failed: {e}")
    
    finally:
        await scraper.close_browser()


if __name__ == "__main__":
    logger.remove()
    logger.add(sys.stderr, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
    
    try:
        asyncio.run(debug_event_detail_page())
        logger.info("🎉 Debug analysis completed!")
        
    except KeyboardInterrupt:
        logger.info("❌ Analysis interrupted by user")
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        sys.exit(1)
