"""
Debug script to analyze what HTML content we're actually getting from bookmaker sites
"""
import asyncio
import sys
import os
from pathlib import Path

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from scrapers.base_scraper import BaseBookmakerScraper
from playwright.async_api import async_playwright


class DebugScraper(BaseBookmakerScraper):
    """Simple scraper for debugging purposes"""
    
    async def get_football_events(self, leagues=None):
        return []
    
    async def get_event_odds(self, event):
        return None
    
    def normalize_team_name(self, team_name):
        return team_name.strip()


async def debug_single_site(site_name, url):
    """Debug what content we can actually extract from a site"""
    print(f"\n{'='*60}")
    print(f"DEBUGGING: {site_name}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    try:
        # Use the debug scraper
        scraper = DebugScraper(site_name, url)
        
        async with scraper:
            print("✅ Browser started successfully")
            
            # Navigate to the site
            if await scraper.safe_navigate(url):
                print("✅ Navigation successful")
                
                # Get the page content
                content = await scraper.page.content()
                
                # Save content to file for inspection
                debug_dir = Path("debug")
                debug_dir.mkdir(exist_ok=True)
                
                filename = debug_dir / f"{site_name.lower()}_content.html"
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                print(f"📄 Full HTML saved to: {filename}")
                
                # Print page title
                title = await scraper.page.title()
                print(f"📋 Page Title: {title}")
                
                # Look for key football/betting related terms
                keywords = ['fußball', 'football', 'soccer', 'wette', 'quote', 'odd', 'match', 'spiel']
                found_keywords = []
                content_lower = content.lower()
                
                for keyword in keywords:
                    if keyword in content_lower:
                        count = content_lower.count(keyword)
                        found_keywords.append(f"{keyword} ({count}x)")
                
                if found_keywords:
                    print(f"🔍 Found keywords: {', '.join(found_keywords)}")
                else:
                    print("❌ No football/betting keywords found")
                
                # Try to find any divs that might contain sports content
                potential_containers = await scraper.page.query_selector_all('div[class*="sport"], div[class*="football"], div[class*="fußball"], div[class*="match"], div[class*="event"], div[class*="game"]')
                print(f"🎯 Found {len(potential_containers)} potential sports containers")
                
                # Check if we need to click anything to reveal content
                buttons_links = await scraper.page.query_selector_all('button, a[href*="sport"], a[href*="football"], a[href*="fußball"]')
                print(f"🔗 Found {len(buttons_links)} potential navigation elements")
                
                # Look for any JavaScript errors or loading states
                try:
                    loading_elements = await scraper.page.query_selector_all('[class*="loading"], [class*="spinner"]')
                    print(f"⏳ Found {len(loading_elements)} loading indicators")
                except:
                    pass
                
                print(f"📏 Total page content length: {len(content)} characters")
                
                # Print first 500 characters of visible text
                try:
                    visible_text = await scraper.page.inner_text('body')
                    print(f"👁️  First 500 chars of visible text:")
                    print("-" * 50)
                    print(visible_text[:500])
                    print("-" * 50)
                except:
                    print("❌ Could not extract visible text")
                    
            else:
                print("❌ Navigation failed")
                
    except Exception as e:
        print(f"💥 Error debugging {site_name}: {str(e)}")
        import traceback
        traceback.print_exc()


async def main():
    """Debug multiple sites"""
    print("Austrian Odds Checker - Site Content Debugger")
    print("=" * 60)
    
    sites_to_debug = [
        ("win2day", "https://www.win2day.at/sportwetten"),
        ("Lottoland", "https://www.lottoland.at/sportwetten"),
        ("tipp3", "https://www.tipp3.at/sportwetten/"),  # Let's try another one
    ]
    
    for site_name, url in sites_to_debug:
        await debug_single_site(site_name, url)
        await asyncio.sleep(2)  # Brief pause between sites
    
    print(f"\n{'='*60}")
    print("DEBUGGING COMPLETE")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Check the saved HTML files in debug/ folder")
    print("2. Look for the actual HTML structure containing matches/odds")
    print("3. Update scraper selectors based on real HTML")
    print("4. Some sites might need JavaScript interaction to load content")


if __name__ == "__main__":
    asyncio.run(main())
