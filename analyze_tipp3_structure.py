"""
Analyze tipp3 HTML structure to identify correct selectors for matches
"""
import asyncio
import os
import sys
from datetime import datetime
from bs4 import BeautifulSoup
from loguru import logger

# Add src to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from scrapers.base_scraper import BaseBookmakerScraper

# Configure logging
logger.add("logs/tipp3_analysis.log", rotation="1 day", retention="1 week", level="DEBUG")


class Tipp3StructureAnalyzer(BaseBookmakerScraper):
    """Analyzer for tipp3 HTML structure"""
    
    def __init__(self):
        super().__init__(
            bookmaker_name="tipp3_analyzer",
            base_url="https://www.tipp3.at",
            delay_range=(2, 4)
        )
    
    async def get_football_events(self, leagues=None):
        return []  # Not used
    
    async def get_event_odds(self, event):
        return None  # Not used
    
    def normalize_team_name(self, team_name):
        return team_name  # Not used


async def analyze_league_structure(url, league_name):
    """Analyze the HTML structure of a specific league page"""
    
    logger.info(f"\n{'='*80}")
    logger.info(f"ANALYZING: {league_name}")
    logger.info(f"URL: {url}")
    logger.info(f"{'='*80}")
    
    analyzer = Tipp3StructureAnalyzer()
    
    try:
        async with analyzer:
            # Navigate to the page
            if not await analyzer.safe_navigate(url):
                logger.error(f"Failed to navigate to {url}")
                return
            
            # Wait for content to load
            await analyzer.page.wait_for_timeout(5000)
            
            # Get page content
            content = await analyzer.page.content()
            
            # Save full HTML for inspection
            debug_dir = "debug"
            os.makedirs(debug_dir, exist_ok=True)
            
            safe_name = league_name.replace(" ", "_").replace("/", "_")
            filename = f"{debug_dir}/{safe_name}_structure.html"
            
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(content)
            
            logger.info(f"💾 Full HTML saved to: {filename}")
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')
            
            # Remove script and style tags to focus on structural content
            for script in soup(["script", "style"]):
                script.decompose()
            
            # Analyze page structure
            logger.info(f"\n📊 PAGE STRUCTURE ANALYSIS")
            logger.info(f"-" * 50)
            
            # Page title
            title = soup.find('title')
            if title:
                logger.info(f"📋 Page Title: {title.get_text()}")
            
            # Look for main content areas
            main_content_selectors = [
                'main', '#main', '.main',
                '#content', '.content',
                '.container', '.wrapper',
                '[role="main"]'
            ]
            
            main_content = None
            for selector in main_content_selectors:
                element = soup.select_one(selector)
                if element:
                    logger.info(f"🎯 Found main content with selector: {selector}")
                    main_content = element
                    break
            
            if not main_content:
                main_content = soup.find('body')
                logger.info("🎯 Using body as main content")
            
            # Analyze potential match containers
            logger.info(f"\n🔍 SEARCHING FOR MATCH CONTAINERS")
            logger.info(f"-" * 50)
            
            # Test many different selectors
            test_selectors = [
                # Table-based
                'table', 'tbody', 'tr',
                'table[class*="match"]', 'table[class*="event"]', 'table[class*="odds"]',
                'tr[class*="match"]', 'tr[class*="event"]', 'tr[class*="odds"]',
                
                # Div-based
                'div[class*="match"]', 'div[class*="event"]', 'div[class*="game"]',
                'div[class*="fixture"]', 'div[class*="bet"]', 'div[class*="odds"]',
                'div[class*="sport"]', 'div[class*="football"]',
                
                # List-based
                'ul[class*="match"]', 'ul[class*="event"]', 'ul[class*="fixture"]',
                'li[class*="match"]', 'li[class*="event"]', 'li[class*="fixture"]',
                
                # Data attributes
                '[data-event-id]', '[data-match-id]', '[data-fixture-id]',
                '[data-sport]', '[data-league]',
                
                # Button/link patterns
                'a[href*="eventdetails"]', 'a[href*="eventID"]',
                'button[class*="bet"]', 'button[class*="odd"]',
                
                # Generic containers
                '.row', '.card', '.item',
                '[class*="row"]', '[class*="card"]', '[class*="item"]'
            ]
            
            found_elements = {}
            
            for selector in test_selectors:
                try:
                    elements = main_content.select(selector) if main_content else soup.select(selector)
                    if elements:
                        found_elements[selector] = len(elements)
                        logger.info(f"✅ {selector}: {len(elements)} elements")
                        
                        # Show sample content from first few elements
                        for i, elem in enumerate(elements[:3]):
                            text = elem.get_text().strip()
                            if text and len(text) > 10:
                                # Truncate long text
                                if len(text) > 100:
                                    text = text[:100] + "..."
                                logger.info(f"    [{i+1}] {text}")
                except Exception as e:
                    logger.debug(f"Error with selector {selector}: {e}")
            
            if not found_elements:
                logger.warning("❌ No potential match containers found with standard selectors")
                
                # Try to find any elements containing team names or odds
                logger.info(f"\n🔍 SEARCHING FOR FOOTBALL-RELATED CONTENT")
                logger.info(f"-" * 50)
                
                # Look for common team names
                team_patterns = ['Manchester', 'Liverpool', 'Chelsea', 'Arsenal', 'Bayern', 'Dortmund', 
                                'Real Madrid', 'Barcelona', 'Juventus', 'Milan', 'PSG', 'Austria', 'Rapid']
                
                for pattern in team_patterns:
                    elements = soup.find_all(text=lambda text: text and pattern in text)
                    if elements:
                        logger.info(f"🏈 Found '{pattern}' in {len(elements)} text elements")
                        for elem in elements[:2]:
                            parent = elem.parent
                            if parent:
                                logger.info(f"    Parent tag: {parent.name}, classes: {parent.get('class', [])}")
                                logger.info(f"    Text: {elem.strip()}")
                
                # Look for odds patterns (numbers like 1.50, 2.75, etc.)
                odds_elements = soup.find_all(text=lambda text: text and 
                                            any(char.isdigit() for char in text) and
                                            ('.' in text) and
                                            len(text) < 10)
                
                if odds_elements:
                    logger.info(f"💰 Found {len(odds_elements)} potential odds elements")
                    odds_parents = set()
                    for elem in odds_elements[:10]:  # Check first 10
                        parent = elem.parent
                        if parent:
                            parent_info = f"{parent.name}.{'.'.join(parent.get('class', []))}"
                            odds_parents.add(parent_info)
                    
                    logger.info(f"💰 Common parent patterns for odds:")
                    for parent in sorted(odds_parents):
                        logger.info(f"    {parent}")
            
            # Look for links to event details
            logger.info(f"\n🔗 SEARCHING FOR EVENT DETAIL LINKS")
            logger.info(f"-" * 50)
            
            event_links = soup.find_all('a', href=lambda x: x and 'eventdetails' in x)
            if event_links:
                logger.info(f"🎯 Found {len(event_links)} event detail links")
                for i, link in enumerate(event_links[:5]):
                    href = link['href']
                    text = link.get_text().strip()
                    logger.info(f"    [{i+1}] {href}")
                    logger.info(f"        Text: {text}")
                    logger.info(f"        Classes: {link.get('class', [])}")
            else:
                logger.info("❌ No event detail links found")
            
            # Save a cleaned version for manual inspection
            cleaned_filename = f"{debug_dir}/{safe_name}_cleaned.html"
            
            # Remove empty elements and compress whitespace
            cleaned_soup = BeautifulSoup(str(main_content), 'html.parser')
            
            with open(cleaned_filename, 'w', encoding='utf-8') as f:
                f.write(cleaned_soup.prettify())
            
            logger.info(f"💾 Cleaned HTML saved to: {cleaned_filename}")
            
    except Exception as e:
        logger.error(f"Error analyzing {league_name}: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())


async def main():
    """Analyze structure of key tipp3 league pages"""
    
    logger.info("Starting tipp3 HTML Structure Analysis")
    logger.info(f"Analysis started at: {datetime.now()}")
    
    # URLs to analyze
    test_urls = [
        ("Austrian Bundesliga", "https://www.tipp3.at/sport/fussball/oesterreich-wetten"),
        ("Premier League", "https://www.tipp3.at/sport/fussball/england/premier-league-wetten"),
        ("German Bundesliga", "https://www.tipp3.at/sport/fussball/deutschland/bundesliga-wetten"),
    ]
    
    for league_name, url in test_urls:
        await analyze_league_structure(url, league_name)
        await asyncio.sleep(3)  # Pause between analyses
    
    logger.info(f"\n{'='*80}")
    logger.info("STRUCTURE ANALYSIS COMPLETE!")
    logger.info(f"{'='*80}")
    logger.info("\nNext Steps:")
    logger.info("1. Check the debug/ folder for saved HTML files")
    logger.info("2. Review the logs/tipp3_analysis.log for detailed findings")
    logger.info("3. Use the identified selectors to update the scraper")
    logger.info(f"Analysis completed at: {datetime.now()}")


if __name__ == "__main__":
    asyncio.run(main())
