import re
from typing import List, Optional
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseBookmakerScraper, ScrapedEvent, ScrapedOdds
from loguru import logger


class Win2DayScraper(BaseBookmakerScraper):
    """Scraper for win2day Austria sports betting"""
    
    def __init__(self):
        super().__init__(
            bookmaker_name="win2day", 
            base_url="https://www.win2day.at",
            delay_range=(2, 4)  # win2day seems more accessible
        )
        self.sports_url = f"{self.base_url}/sportwetten"
        
        # Common team name normalizations for Austrian context
        self.team_name_mappings = {
            # Austrian teams
            "FK Austria Wien": "Austria Wien", 
            "FK Austria Vienna": "Austria Wien",
            "SK Rapid Wien": "Rapid Wien",
            "Rapid Vienna": "Rapid Wien",
            "RB Salzburg": "Red Bull Salzburg",
            "FC Red Bull Salzburg": "Red Bull Salzburg",
            "Salzburg": "Red Bull Salzburg",
            # Common abbreviations
            "Austria W.": "Austria Wien",
            "Rapid W.": "Rapid Wien",
        }
    
    def normalize_team_name(self, team_name: str) -> str:
        """Normalize team names for consistent matching"""
        if not team_name:
            return ""
        
        # Clean up the name
        cleaned = team_name.strip()
        
        # Apply specific mappings
        if cleaned in self.team_name_mappings:
            cleaned = self.team_name_mappings[cleaned]
        
        # Remove common prefixes/suffixes
        prefixes_to_remove = ["FC", "FK", "SK", "SV", "1.", "TSV", "VfB", "VfL", "SSC", "AC", "AS"]
        suffixes_to_remove = ["e.V.", "1919", "1909", "1896", "Wien", "Vienna"]
        
        words = cleaned.split()
        # Remove prefixes
        if words and words[0] in prefixes_to_remove:
            words = words[1:]
        # Remove suffixes
        if words and words[-1] in suffixes_to_remove:
            words = words[:-1]
        
        return " ".join(words).strip()
    
    async def get_football_events(self, leagues: List[str] = None) -> List[ScrapedEvent]:
        """Scrape upcoming football events from win2day"""
        events = []
        
        try:
            # Navigate to sports betting page
            if not await self.safe_navigate(self.sports_url):
                logger.error(f"Failed to navigate to {self.sports_url}")
                return events
            
            # Wait for content to load
            await self.page.wait_for_timeout(3000)
            
            # Try to find and click on football section
            try:
                # Look for football/soccer links or buttons
                football_selectors = [
                    'a[href*="fussball"]',
                    'a[href*="football"]', 
                    'button:has-text("Fußball")',
                    'button:has-text("Football")',
                    '[data-sport="football"]',
                    '[data-sport="soccer"]'
                ]
                
                for selector in football_selectors:
                    try:
                        element = await self.page.wait_for_selector(selector, timeout=2000)
                        if element:
                            await element.click()
                            await self.page.wait_for_timeout(2000)
                            break
                    except:
                        continue
                        
            except Exception as e:
                logger.debug(f"Could not find football section button: {e}")
            
            # Get page content and parse with BeautifulSoup
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Look for match/event containers with various possible structures
            potential_containers = []
            
            # Try different selectors that might contain match information
            container_selectors = [
                {'tag': 'div', 'class_contains': ['match', 'event', 'game', 'fixture', 'wette']},
                {'tag': 'tr', 'class_contains': ['match', 'event', 'game', 'fixture', 'odd']},
                {'tag': 'li', 'class_contains': ['match', 'event', 'game', 'fixture']},
                {'tag': 'article', 'class_contains': ['match', 'event', 'game']},
            ]
            
            for selector in container_selectors:
                elements = soup.find_all(
                    selector['tag'], 
                    class_=lambda x: x and any(keyword in x.lower() for keyword in selector['class_contains'])
                )
                potential_containers.extend(elements)
            
            # If no specific containers found, look for elements containing team names
            if not potential_containers:
                # Look for elements containing typical football team patterns
                team_pattern = re.compile(r'(Real|Barcelona|Bayern|Dortmund|Chelsea|Arsenal|Liverpool|Manchester|Juventus|Milan|Inter|Austria|Rapid|Salzburg)', re.IGNORECASE)
                potential_containers = soup.find_all(text=team_pattern)
                potential_containers = [elem.parent for elem in potential_containers if elem.parent]
            
            logger.info(f"Found {len(potential_containers)} potential match containers on win2day")
            
            for container in potential_containers[:20]:  # Limit to first 20 to avoid overprocessing
                try:
                    event = await self._parse_event_container(container)
                    if event:
                        events.append(event)
                except Exception as e:
                    logger.debug(f"Error parsing event container: {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(events)} events from win2day")
            
        except Exception as e:
            logger.error(f"Error scraping win2day events: {e}")
        
        return events
    
    async def _parse_event_container(self, container) -> Optional[ScrapedEvent]:
        """Parse individual event container"""
        try:
            # Get all text content
            text_content = container.get_text().strip()
            
            if len(text_content) < 10:  # Too short to contain meaningful match info
                return None
            
            # Look for team vs team patterns
            vs_patterns = [
                r'(.+?)\s+vs\s+(.+?)(?:\s|$)',
                r'(.+?)\s+-\s+(.+?)(?:\s|$)', 
                r'(.+?)\s+gegen\s+(.+?)(?:\s|$)',
                r'(.+?)\s+:\s+(.+?)(?:\s|$)',
                r'(.+?)\s+@\s+(.+?)(?:\s|$)'
            ]
            
            home_team = ""
            away_team = ""
            
            for pattern in vs_patterns:
                match = re.search(pattern, text_content, re.IGNORECASE)
                if match:
                    potential_home = match.group(1).strip()
                    potential_away = match.group(2).strip()
                    
                    # Clean up team names (remove odds, dates, etc.)
                    potential_home = re.sub(r'\\d+\\.\\d+|\\d{1,2}[./]\\d{1,2}|\\d{1,2}:\\d{2}', '', potential_home).strip()
                    potential_away = re.sub(r'\\d+\\.\\d+|\\d{1,2}[./]\\d{1,2}|\\d{1,2}:\\d{2}', '', potential_away).strip()
                    
                    # Check if they look like team names (at least 3 characters, not just numbers)
                    if (len(potential_home) >= 3 and len(potential_away) >= 3 and 
                        not potential_home.isdigit() and not potential_away.isdigit()):
                        home_team = self.normalize_team_name(potential_home)
                        away_team = self.normalize_team_name(potential_away)
                        break
            
            if not home_team or not away_team:
                return None
            
            # Try to extract date information
            match_date = datetime.now() + timedelta(days=1)  # Default to tomorrow
            
            # Look for date patterns in the container
            date_patterns = [
                r'\\b(\\d{1,2})[./](\\d{1,2})[./](\\d{2,4})\\b',  # DD/MM/YYYY or DD.MM.YYYY
                r'\\b(\\d{1,2})[./](\\d{1,2})\\b',  # DD/MM (current year)
                r'\\b(\\d{1,2})\\.(\\d{1,2})\\.\\b'  # DD.MM.
            ]
            
            for pattern in date_patterns:
                date_match = re.search(pattern, text_content)
                if date_match:
                    try:
                        day = int(date_match.group(1))
                        month = int(date_match.group(2))
                        year = datetime.now().year
                        
                        if len(date_match.groups()) > 2 and date_match.group(3):
                            year = int(date_match.group(3))
                            if year < 100:  # 2-digit year
                                year += 2000
                        
                        match_date = datetime(year, month, day)
                        break
                    except (ValueError, IndexError):
                        continue
            
            # Extract event URL if available
            event_url = ""
            link_element = container.find('a', href=True)
            if link_element:
                href = link_element['href']
                if href.startswith('/'):
                    event_url = self.base_url + href
                elif href.startswith('http'):
                    event_url = href
            
            return ScrapedEvent(
                home_team=home_team,
                away_team=away_team,
                match_date=match_date,
                league="Unknown",  # Will be determined later through API matching
                event_url=event_url or self.sports_url,
                bookmaker_event_id=None,
                status="scheduled"
            )
            
        except Exception as e:
            logger.debug(f"Error parsing win2day event: {e}")
            return None
    
    async def get_event_odds(self, event: ScrapedEvent) -> Optional[ScrapedOdds]:
        """Get odds for a specific event from win2day"""
        try:
            # Navigate to event-specific page if available
            if event.event_url and event.event_url != self.sports_url:
                if not await self.safe_navigate(event.event_url):
                    logger.warning(f"Could not navigate to event URL: {event.event_url}")
                    return None
            
            # Get page content
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Look for odds with various strategies
            odds_values = []
            
            # Strategy 1: Look for elements with odds-like classes
            odds_containers = soup.find_all(['div', 'span', 'td', 'button'], 
                                         class_=lambda x: x and any(keyword in x.lower() for keyword in ['odd', 'quote', 'coefficient', 'bet']))
            
            for container in odds_containers:
                text = container.get_text().strip()
                odds_value = self.normalize_odds_value(text)
                if odds_value and 1.01 <= odds_value <= 50.0:
                    odds_values.append(odds_value)
            
            # Strategy 2: Look for numeric patterns that could be odds
            if len(odds_values) < 3:
                # Find all text that looks like odds (format: X.XX)
                odds_pattern = re.compile(r'\\b(\\d{1,2}\\.\\d{2})\\b')
                all_text = soup.get_text()
                potential_odds = odds_pattern.findall(all_text)
                
                for odds_str in potential_odds:
                    odds_value = self.normalize_odds_value(odds_str)
                    if odds_value and 1.01 <= odds_value <= 50.0:
                        odds_values.append(odds_value)
            
            # Remove duplicates while preserving order
            seen = set()
            unique_odds = []
            for odds in odds_values:
                if odds not in seen:
                    seen.add(odds)
                    unique_odds.append(odds)
            
            odds_values = unique_odds[:3]  # Take first 3 unique odds
            
            # Assign odds (assuming 1X2 format: Home, Draw, Away)
            home_odds = None
            draw_odds = None 
            away_odds = None
            
            if len(odds_values) >= 3:
                home_odds = odds_values[0]
                draw_odds = odds_values[1]
                away_odds = odds_values[2]
            elif len(odds_values) == 2:
                # Might be a market without draw (like Over/Under)
                home_odds = odds_values[0]
                away_odds = odds_values[1]
            elif len(odds_values) == 1:
                # Single odds - might be for a specific outcome
                home_odds = odds_values[0]
            
            if home_odds or draw_odds or away_odds:
                return ScrapedOdds(
                    home_team=event.home_team,
                    away_team=event.away_team,
                    match_date=event.match_date,
                    home_odds=home_odds,
                    draw_odds=draw_odds,
                    away_odds=away_odds,
                    league=event.league,
                    match_url=event.event_url
                )
            
        except Exception as e:
            logger.error(f"Error getting win2day odds: {e}")
        
        return None
