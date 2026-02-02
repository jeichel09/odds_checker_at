"""
Debug script to analyze tipp3 HTML structure in detail
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


async def debug_tipp3_structure():
    """Debug the tipp3 HTML structure to understand why events are not being parsed"""
    
    logger.info("🔍 Debug Analysis of Tipp3 Structure...")
    
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
        with open("tipp3_debug_analysis.html", "w", encoding="utf-8") as f:
            f.write(content)
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Find all links containing 'eventdetails' and 'eventID='
        event_links = soup.find_all('a', href=lambda x: x and 'eventdetails' in x and 'eventID=' in x)
        logger.info(f"Found {len(event_links)} event detail links")
        
        # Analyze the first few event links in detail
        logger.info("\\n📋 Detailed Analysis of Event Links:")
        for i, link in enumerate(event_links[:10]):
            logger.info(f"\\n--- Link {i+1} ---")
            href = link['href']
            logger.info(f"URL: {href}")
            
            # Extract event ID
            event_id_match = re.search(r'eventID=(\\d+)', href)
            if event_id_match:
                event_id = event_id_match.group(1)
                logger.info(f"Event ID: {event_id}")
            
            # Get link classes
            link_classes = link.get('class', [])
            logger.info(f"Classes: {link_classes}")
            
            # Get link text
            link_text = link.get_text().strip()
            logger.info(f"Text: '{link_text}'")
            
            # Check for team name patterns
            if 't3-list-entry__player' in link_classes:
                logger.info("✅ This is a player/team link!")
                team_name = link_text.split('\\n')[0] if link_text else ""
                logger.info(f"Extracted team name: '{team_name}'")
            else:
                logger.info("❌ Not a player/team link")
        
        # Look for all elements with t3-list-entry__player class
        player_links = soup.find_all('a', class_=lambda x: x and 't3-list-entry__player' in ' '.join(x))
        logger.info(f"\\n🎯 Found {len(player_links)} links with 't3-list-entry__player' class")
        
        for i, link in enumerate(player_links[:5]):
            logger.info(f"\\nPlayer Link {i+1}:")
            logger.info(f"Text: '{link.get_text().strip()}'")
            logger.info(f"Classes: {link.get('class', [])}")
            href = link.get('href', '')
            logger.info(f"Href: {href}")
            
            if 'eventdetails' in href:
                logger.info("✅ Contains eventdetails")
            else:
                logger.info("❌ Does not contain eventdetails")
        
        # Look for alternative selectors
        logger.info("\\n🔍 Looking for alternative team name selectors...")
        
        # Check for common team name patterns
        possible_team_selectors = [
            '.t3-list-entry__player',
            '[class*=\"player\"]',
            '[class*=\"team\"]',
            '[class*=\"opponent\"]',
            '.event-team',
            '.match-team',
            '.participant'
        ]
        
        for selector in possible_team_selectors:
            try:
                elements = soup.select(selector)
                logger.info(f"Selector '{selector}': {len(elements)} elements found")
                
                if elements and len(elements) > 0:
                    sample_text = elements[0].get_text().strip()[:50]
                    logger.info(f"  Sample text: '{sample_text}'")
            except Exception as e:
                logger.debug(f"  Error with selector '{selector}': {e}")
        
        # Look for match containers
        logger.info("\\n🏟️ Looking for match containers...")
        
        # Common match container patterns
        match_container_selectors = [
            '.match',
            '.game',
            '.event',
            '[class*=\"match\"]',
            '[class*=\"game\"]', 
            '[class*=\"event\"]',
            '.t3-list-entry'
        ]
        
        for selector in match_container_selectors:
            try:
                containers = soup.select(selector)
                logger.info(f"Container '{selector}': {len(containers)} found")
                
                if containers and len(containers) > 0:
                    # Analyze first container
                    first_container = containers[0]
                    inner_links = first_container.find_all('a')
                    logger.info(f"  Links inside first container: {len(inner_links)}")
                    
                    for link in inner_links[:3]:  # First 3 links
                        link_text = link.get_text().strip()[:50]
                        link_classes = link.get('class', [])
                        logger.info(f"    Link: '{link_text}' | Classes: {link_classes}")
                        
            except Exception as e:
                logger.debug(f"  Error with container selector '{selector}': {e}")
        
    except Exception as e:
        logger.error(f"Debug analysis failed: {e}")
    
    finally:
        await scraper.close_browser()


async def analyze_saved_html():
    """Analyze previously saved HTML files"""
    
    logger.info("📁 Analyzing saved HTML files...")
    
    html_files = [
        "tipp3_austrian_bundesliga.html",
        "tipp3_debug_analysis.html"
    ]
    
    for html_file in html_files:
        if Path(html_file).exists():
            logger.info(f"\\n📄 Analyzing {html_file}...")
            
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            soup = BeautifulSoup(content, 'html.parser')
            
            # Event detail links
            event_links = soup.find_all('a', href=lambda x: x and 'eventdetails' in x and 'eventID=' in x)
            logger.info(f"Event detail links: {len(event_links)}")
            
            # Player links
            player_links = soup.find_all('a', class_=lambda x: x and 't3-list-entry__player' in ' '.join(x))
            logger.info(f"Player links: {len(player_links)}")
            
            # Check if player links contain eventdetails
            player_with_event_links = [link for link in player_links if 'eventdetails' in link.get('href', '')]
            logger.info(f"Player links with eventdetails: {len(player_with_event_links)}")
            
            # Sample some player links
            logger.info("\\nSample Player Links:")
            for i, link in enumerate(player_links[:5]):
                logger.info(f"{i+1}. Text: '{link.get_text().strip()}'")
                logger.info(f"   Href: {link.get('href', '')}")
                logger.info(f"   Has eventdetails: {'eventdetails' in link.get('href', '')}")


if __name__ == "__main__":
    logger.remove()
    logger.add(sys.stderr, level="INFO", format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}")
    
    try:
        # Analyze saved files first
        asyncio.run(analyze_saved_html())
        
        # Then do live analysis
        asyncio.run(debug_tipp3_structure())
        
        logger.info("🎉 Debug analysis completed!")
        
    except KeyboardInterrupt:
        logger.info("❌ Analysis interrupted by user")
    except Exception as e:
        logger.error(f"❌ Analysis failed: {e}")
        sys.exit(1)
