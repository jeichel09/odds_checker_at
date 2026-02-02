"""
Debug script to analyze tipp3 odds extraction from event containers
"""
import asyncio
import sys
import re
from pathlib import Path
from bs4 import BeautifulSoup
from loguru import logger

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from scrapers.tipp3_fixed_scraper import Tipp3FixedScraper


async def debug_tipp3_odds_extraction():
    """Debug the odds extraction from tipp3 event containers"""
    
    logger.info("🔍 Debug Analysis of Tipp3 Odds Extraction...")
    
    scraper = Tipp3FixedScraper()
    
    try:
        await scraper.start_browser()
        
        # Navigate to Austrian Bundesliga page
        url = "https://www.tipp3.at/sport/fussball/oesterreich-wetten"
        
        if not await scraper.safe_navigate(url):
            logger.error("Failed to navigate to Austrian Bundesliga page")
            return
        
        await scraper.page.wait_for_timeout(5000)
        content = await scraper.page.content()
        
        # Save the HTML for analysis
        with open("tipp3_odds_debug.html", "w", encoding="utf-8") as f:
            f.write(content)
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Find event containers
        event_divs = soup.find_all('div', id=re.compile(r'^event_\d+$'))
        logger.info(f"Found {len(event_divs)} event containers")
        
        # Analyze the first few event containers in detail
        for i, event_div in enumerate(event_divs[:3]):
            event_id = event_div['id'].replace('event_', '')
            logger.info(f"\\n🎯 Analyzing Event Container {i+1}: {event_id}")
            
            # Find team links
            team_links = event_div.find_all('a', class_='t3-list-entry__player')
            logger.info(f"Team links found: {len(team_links)}")
            
            for j, team_link in enumerate(team_links):
                team_text = team_link.get_text().strip().split('\\n')[0]
                logger.info(f"  Team {j+1}: {team_text}")
            
            # Look for all span elements with class containing 'bet'
            logger.info("\\n📊 Looking for betting-related spans:")
            bet_spans = event_div.find_all('span', class_=lambda x: x and 'bet' in ' '.join(x).lower())
            logger.info(f"Found {len(bet_spans)} spans with 'bet' in class")
            
            for span in bet_spans[:10]:  # First 10 spans
                span_classes = span.get('class', [])
                span_text = span.get_text().strip()
                logger.info(f"  Span: classes={span_classes}, text='{span_text}'")
            
            # Look specifically for t3-bet-button__text
            specific_spans = event_div.find_all('span', class_='t3-bet-button__text')
            logger.info(f"\\n🎰 t3-bet-button__text spans: {len(specific_spans)}")
            
            for span in specific_spans:
                span_text = span.get_text().strip()
                logger.info(f"  Text: '{span_text}'")
                
                # Try to extract odds
                odds_match = re.search(r'\\b(\\d{1,2}\\.\\d{2})\\b', span_text)
                if odds_match:
                    logger.info(f"    → Found odds: {odds_match.group(1)}")
                else:
                    logger.info(f"    → No odds pattern found")
            
            # Look for alternative odds selectors
            logger.info("\\n🔍 Looking for alternative odds selectors:")
            
            # Common odds patterns
            odds_selectors = [
                'span[class*=\"button\"]',
                'button span',
                '.odds',
                '[class*=\"odds\"]',
                'span[class*=\"price\"]',
                'span[class*=\"value\"]'
            ]
            
            for selector in odds_selectors:
                try:
                    elements = event_div.select(selector)
                    logger.info(f"  '{selector}': {len(elements)} elements")
                    
                    for elem in elements[:3]:  # First 3 elements
                        elem_text = elem.get_text().strip()
                        elem_classes = elem.get('class', [])
                        if elem_text and len(elem_text) < 20:  # Short text likely to be odds
                            logger.info(f"    Text: '{elem_text}' | Classes: {elem_classes}")
                            
                            # Check for odds pattern
                            odds_match = re.search(r'\\b(\\d{1,2}\\.\\d{2})\\b', elem_text)
                            if odds_match:
                                logger.info(f"      → ODDS FOUND: {odds_match.group(1)}")
                
                except Exception as e:
                    logger.debug(f"    Error with selector '{selector}': {e}")
            
            # Look at the full HTML structure of the event div
            logger.info(f"\\n📋 Event div structure (first 500 chars):")
            event_html = str(event_div)[:500]
            logger.info(f"{event_html}...")
            
            logger.info("\\n" + "="*80)
    
    except Exception as e:
        logger.error(f"Debug analysis failed: {e}")
    
    finally:
        await scraper.close_browser()


if __name__ == "__main__":
    logger.remove()
    logger.add(sys.stderr, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
    
    try:
        asyncio.run(debug_tipp3_odds_extraction())
        logger.info("🎉 Debug analysis completed!")
        
    except KeyboardInterrupt:
        logger.info("❌ Analysis interrupted by user")
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        sys.exit(1)
