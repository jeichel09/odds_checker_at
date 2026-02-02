import re
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseBookmakerScraper, ScrapedEvent, ScrapedOdds
from loguru import logger


class Tipp3RealScraper(BaseBookmakerScraper):
    """Real tipp3 scraper targeting specific league URLs with actual odds extraction"""
    
    def __init__(self):
        super().__init__(
            bookmaker_name="tipp3", 
            base_url="https://www.tipp3.at",
            delay_range=(3, 6)  # Be respectful to tipp3
        )
        
        # Specific league URLs discovered
        self.league_urls = {
            "Austrian Bundesliga": "https://www.tipp3.at/sport/fussball/oesterreich-wetten",
            "Premier League": "https://www.tipp3.at/sport/fussball/england/premier-league-wetten",
            "German Bundesliga": "https://www.tipp3.at/sport/fussball/deutschland/bundesliga-wetten",
            "Serie A": "https://www.tipp3.at/sport/fussball/italien-wetten",
            "Ligue 1": "https://www.tipp3.at/sport/fussball/frankreich-wetten",
            "La Liga": "https://www.tipp3.at/sport/fussball/spanien-wetten"
        }
        
        # Team name normalizations
        self.team_name_mappings = {
            # Austrian teams
            "Austria Wien": "FK Austria Wien",
            "Rapid Wien": "SK Rapid Wien", 
            "Red Bull Salzburg": "FC Red Bull Salzburg",
            "LASK": "LASK Linz",
            "Sturm Graz": "SK Sturm Graz",
            # German teams
            "Bayern": "Bayern Munich",
            "BVB": "Borussia Dortmund",
            "RB Leipzig": "RB Leipzig",
            "Leverkusen": "Bayer Leverkusen",
            # English teams
            "Man City": "Manchester City",
            "Man United": "Manchester United",
            "Tottenham": "Tottenham Hotspur",
            # Add more as needed
        }
    
    def normalize_team_name(self, team_name: str) -> str:
        """Normalize team names for consistent matching"""
        if not team_name:
            return ""
        
        cleaned = team_name.strip()
        
        # Apply specific mappings
        if cleaned in self.team_name_mappings:
            return self.team_name_mappings[cleaned]
        
        # Remove common prefixes/suffixes for normalization
        prefixes_to_remove = ["FC", "FK", "SK", "SV", "1.", "TSV", "VfB", "VfL", "SSC", "AC", "AS"]
        suffixes_to_remove = ["e.V.", "1919", "1909", "1896"]
        
        words = cleaned.split()
        # Remove prefixes
        if words and words[0] in prefixes_to_remove:
            words = words[1:]
        # Remove suffixes  
        if words and words[-1] in suffixes_to_remove:
            words = words[:-1]
        
        return " ".join(words).strip()
    
    async def get_football_events(self, leagues: List[str] = None) -> List[ScrapedEvent]:
        """Scrape events from specific tipp3 league URLs"""
        all_events = []
        
        target_leagues = leagues if leagues else list(self.league_urls.keys())
        
        for league_name in target_leagues:
            if league_name not in self.league_urls:
                logger.warning(f"Unknown league: {league_name}")
                continue
                
            logger.info(f"Scraping {league_name}...")
            events = await self._scrape_league_events(league_name, self.league_urls[league_name])
            all_events.extend(events)
            
            # Small delay between leagues
            await self.random_delay()
        
        logger.info(f"Total events scraped from tipp3: {len(all_events)}")
        return all_events
    
    async def _scrape_league_events(self, league_name: str, league_url: str) -> List[ScrapedEvent]:
        """Scrape events from a specific league URL"""
        events = []
        
        try:
            if not await self.safe_navigate(league_url):
                logger.error(f"Failed to navigate to {league_url}")
                return events
            
            # Wait for dynamic content to load
            await self.page.wait_for_timeout(3000)
            
            # Get page content
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Look for match containers - tipp3 specific selectors
            # Based on typical betting site structures, matches are often in:
            # - Tables with rows for each match
            # - Divs with specific classes for match cards
            # - Lists with match items
            
            potential_selectors = [
                # Table-based layouts
                'tr[class*="match"]',
                'tr[class*="event"]', 
                'tr[class*="game"]',
                'tbody tr',
                # Card-based layouts
                'div[class*="match"]',
                'div[class*="event"]',
                'div[class*="game"]',
                'div[class*="fixture"]',
                # List-based layouts
                'li[class*="match"]',
                'li[class*="event"]',
                # Generic containers that might hold match data
                'div[data-event-id]',
                'div[data-match-id]',
                '[class*="odds-row"]',
                '[class*="betting-row"]'
            ]
            
            match_elements = []
            for selector in potential_selectors:
                elements = soup.select(selector)
                if elements:
                    logger.debug(f"Found {len(elements)} elements with selector: {selector}")
                    match_elements.extend(elements)
            
            # Remove duplicates while preserving order
            seen = set()
            unique_elements = []
            for elem in match_elements:
                elem_id = id(elem)
                if elem_id not in seen:
                    seen.add(elem_id)
                    unique_elements.append(elem)
            
            logger.info(f"Found {len(unique_elements)} potential match elements in {league_name}")
            
            # Parse each potential match element
            for element in unique_elements[:20]:  # Limit to first 20 to avoid overprocessing
                try:
                    event = await self._parse_match_element(element, league_name, league_url)
                    if event:
                        events.append(event)
                except Exception as e:
                    logger.debug(f"Error parsing match element: {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(events)} events from {league_name}")
            
        except Exception as e:
            logger.error(f"Error scraping {league_name}: {e}")
        
        return events
    
    async def _parse_match_element(self, element, league_name: str, league_url: str) -> Optional[ScrapedEvent]:
        """Parse a single match element to extract event information"""
        try:
            text_content = element.get_text().strip()
            
            # Skip elements that are too short or don't contain useful data
            if len(text_content) < 10:
                return None
            
            # Look for team names in various patterns
            home_team = ""
            away_team = ""
            event_url = ""
            match_date = datetime.now() + timedelta(days=1)  # Default
            
            # Strategy 1: Look for links to event details
            event_links = element.find_all('a', href=True)
            for link in event_links:
                href = link['href']
                if 'eventdetails' in href and 'eventID=' in href:
                    # Found event detail link
                    if href.startswith('/'):
                        event_url = self.base_url + href
                    else:
                        event_url = href
                    
                    # Try to extract team names from link text or nearby text
                    link_text = link.get_text().strip()
                    if ' - ' in link_text:
                        parts = link_text.split(' - ')
                        if len(parts) == 2:
                            home_team = self.normalize_team_name(parts[0].strip())
                            away_team = self.normalize_team_name(parts[1].strip())
                    elif ' vs ' in link_text:
                        parts = link_text.split(' vs ')
                        if len(parts) == 2:
                            home_team = self.normalize_team_name(parts[0].strip())
                            away_team = self.normalize_team_name(parts[1].strip())
                    break
            
            # Strategy 2: Look for team names in the element text
            if not home_team or not away_team:
                # Common patterns for team vs team
                vs_patterns = [
                    r'(.+?)\s*[-–]\s*(.+?)(?:\s|$)',
                    r'(.+?)\s*vs\s*(.+?)(?:\s|$)',
                    r'(.+?)\s*gegen\s*(.+?)(?:\s|$)',
                    r'(.+?)\s*:\s*(.+?)(?:\s|$)'
                ]
                
                for pattern in vs_patterns:
                    match = re.search(pattern, text_content, re.IGNORECASE)
                    if match:
                        potential_home = match.group(1).strip()
                        potential_away = match.group(2).strip()
                        
                        # Clean up team names (remove odds, dates, etc.)
                        potential_home = re.sub(r'\d+\.\d+|\d{1,2}[./]\d{1,2}|\d{1,2}:\d{2}', '', potential_home).strip()
                        potential_away = re.sub(r'\d+\.\d+|\d{1,2}[./]\d{1,2}|\d{1,2}:\d{2}', '', potential_away).strip()
                        
                        # Check if they look like team names
                        if (len(potential_home) >= 3 and len(potential_away) >= 3 and 
                            not potential_home.isdigit() and not potential_away.isdigit() and
                            not any(x in potential_home.lower() for x in ['quote', 'odds', 'wette']) and
                            not any(x in potential_away.lower() for x in ['quote', 'odds', 'wette'])):
                            home_team = self.normalize_team_name(potential_home)
                            away_team = self.normalize_team_name(potential_away)
                            break
            
            # Strategy 3: Look for date/time information
            # Look for date patterns
            date_patterns = [
                r'\b(\d{1,2})[./](\d{1,2})[./](\d{2,4})\b',  # DD/MM/YYYY
                r'\b(\d{1,2})\.(\d{1,2})\.\b',  # DD.MM.
                r'\b(\d{1,2}):(\d{2})\b'  # HH:MM (time)
            ]
            
            for pattern in date_patterns:
                date_match = re.search(pattern, text_content)
                if date_match:
                    try:
                        if len(date_match.groups()) >= 3:
                            # Full date
                            day = int(date_match.group(1))
                            month = int(date_match.group(2))
                            year = int(date_match.group(3))
                            if year < 100:
                                year += 2000
                            match_date = datetime(year, month, day)
                        elif len(date_match.groups()) == 2 and ':' in date_match.group(0):
                            # Just time - use today's date
                            hour = int(date_match.group(1))
                            minute = int(date_match.group(2))
                            match_date = datetime.now().replace(hour=hour, minute=minute, second=0, microsecond=0)
                            # If time has passed today, assume it's tomorrow
                            if match_date < datetime.now():
                                match_date += timedelta(days=1)
                        break
                    except (ValueError, IndexError):
                        continue
            
            # Only create event if we found both teams
            if home_team and away_team:
                return ScrapedEvent(
                    home_team=home_team,
                    away_team=away_team,
                    match_date=match_date,
                    league=league_name,
                    event_url=event_url or league_url,
                    bookmaker_event_id=self._extract_event_id(event_url) if event_url else None,
                    status="scheduled"
                )
            
        except Exception as e:
            logger.debug(f"Error parsing tipp3 match element: {e}")
        
        return None
    
    def _extract_event_id(self, event_url: str) -> Optional[str]:
        """Extract eventID from tipp3 event URL"""
        if not event_url:
            return None
        
        match = re.search(r'eventID=(\d+)', event_url)
        return match.group(1) if match else None
    
    async def get_event_odds(self, event: ScrapedEvent) -> Optional[ScrapedOdds]:
        """Get detailed odds for a specific event"""
        try:
            # If we have a specific event URL, navigate to it
            if event.event_url and 'eventdetails' in event.event_url:
                logger.info(f"Getting detailed odds for {event.home_team} vs {event.away_team}")
                
                if not await self.safe_navigate(event.event_url):
                    logger.warning(f"Could not navigate to event URL: {event.event_url}")
                    return None
                
                # Wait for page to load
                await self.page.wait_for_timeout(3000)
                
                return await self._extract_detailed_odds(event)
            else:
                # Try to extract odds from league page
                logger.info(f"Extracting basic odds for {event.home_team} vs {event.away_team}")
                return await self._extract_basic_odds(event)
                
        except Exception as e:
            logger.error(f"Error getting tipp3 odds for {event.home_team} vs {event.away_team}: {e}")
        
        return None
    
    async def _extract_detailed_odds(self, event: ScrapedEvent) -> Optional[ScrapedOdds]:
        """Extract detailed odds from event details page"""
        try:
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            odds_data = {
                'home_odds': None,
                'draw_odds': None,
                'away_odds': None,
                'btts_yes': None,
                'btts_no': None,
                'over_25': None,
                'under_25': None,
                'over_35': None,
                'under_35': None,
                'exact_scores': {}
            }
            
            # Look for 1X2 odds (Moneyline)
            moneyline_selectors = [
                '[class*="moneyline"]',
                '[class*="1x2"]',
                '[class*="three-way"]',
                'button[class*="odd"]',
                '.bet-button',
                '[data-bet-type*="1x2"]'
            ]
            
            for selector in moneyline_selectors:
                elements = soup.select(selector)
                if len(elements) >= 3:
                    try:
                        odds_texts = [elem.get_text().strip() for elem in elements[:3]]
                        odds_values = [self.normalize_odds_value(text) for text in odds_texts]
                        
                        if all(v is not None for v in odds_values):
                            odds_data['home_odds'] = odds_values[0]
                            odds_data['draw_odds'] = odds_values[1]
                            odds_data['away_odds'] = odds_values[2]
                            logger.debug(f"Found 1X2 odds: {odds_values}")
                            break
                    except:
                        continue
            
            # Look for BTTS (Both Teams to Score)
            btts_elements = soup.find_all(text=re.compile(r'beide.*tor|btts|both.*score', re.IGNORECASE))
            for btts_elem in btts_elements:
                parent = btts_elem.parent
                if parent:
                    # Look for odds near this element
                    odds_elements = parent.find_all_next(['button', 'span', 'div'], limit=5)
                    for odds_elem in odds_elements:
                        odds_text = odds_elem.get_text().strip()
                        if re.match(r'\d+\.\d{2}', odds_text):
                            odds_value = self.normalize_odds_value(odds_text)
                            if odds_value:
                                if 'ja' in odds_elem.get_text().lower() or 'yes' in odds_elem.get_text().lower():
                                    odds_data['btts_yes'] = odds_value
                                elif 'nein' in odds_elem.get_text().lower() or 'no' in odds_elem.get_text().lower():
                                    odds_data['btts_no'] = odds_value
            
            # Look for Over/Under 2.5 and 3.5
            ou_elements = soup.find_all(text=re.compile(r'über|under|over|2\.?5|3\.?5', re.IGNORECASE))
            for ou_elem in ou_elements:
                parent = ou_elem.parent
                if parent:
                    text = parent.get_text().lower()
                    if '2.5' in text or '2,5' in text:
                        # Look for odds near this element
                        odds_elements = parent.find_all_next(['button', 'span', 'div'], limit=3)
                        for odds_elem in odds_elements:
                            odds_text = odds_elem.get_text().strip()
                            odds_value = self.normalize_odds_value(odds_text)
                            if odds_value:
                                if 'über' in text or 'over' in text:
                                    odds_data['over_25'] = odds_value
                                elif 'unter' in text or 'under' in text:
                                    odds_data['under_25'] = odds_value
                    elif '3.5' in text or '3,5' in text:
                        # Similar for 3.5
                        odds_elements = parent.find_all_next(['button', 'span', 'div'], limit=3)
                        for odds_elem in odds_elements:
                            odds_text = odds_elem.get_text().strip()
                            odds_value = self.normalize_odds_value(odds_text)
                            if odds_value:
                                if 'über' in text or 'over' in text:
                                    odds_data['over_35'] = odds_value
                                elif 'unter' in text or 'under' in text:
                                    odds_data['under_35'] = odds_value
            
            # Look for exact scores (Resultatwette)
            exact_score_elements = soup.find_all(text=re.compile(r'resultat|exact.*score|endstand', re.IGNORECASE))
            for score_elem in exact_score_elements:
                parent = score_elem.parent
                if parent:
                    # Look for score patterns like "1:0", "2:1", etc.
                    score_buttons = parent.find_all_next(['button', 'span', 'div'], limit=20)
                    for button in score_buttons:
                        button_text = button.get_text().strip()
                        score_match = re.match(r'(\d+):(\d+)', button_text)
                        if score_match:
                            score = f"{score_match.group(1)}:{score_match.group(2)}"
                            # Look for odds near this score
                            odds_text = button.get('data-odds') or button.get_text()
                            if odds_text:
                                odds_match = re.search(r'(\d+\.\d{2})', odds_text)
                                if odds_match:
                                    odds_value = self.normalize_odds_value(odds_match.group(1))
                                    if odds_value:
                                        odds_data['exact_scores'][score] = odds_value
            
            # Create ScrapedOdds object if we found some odds
            if any(v is not None for v in [odds_data['home_odds'], odds_data['draw_odds'], odds_data['away_odds']]):
                scraped_odds = ScrapedOdds(
                    home_team=event.home_team,
                    away_team=event.away_team,
                    match_date=event.match_date,
                    home_odds=odds_data['home_odds'],
                    draw_odds=odds_data['draw_odds'],
                    away_odds=odds_data['away_odds'],
                    league=event.league,
                    match_url=event.event_url
                )
                
                # Add additional odds data as custom attributes
                scraped_odds.btts_yes = odds_data['btts_yes']
                scraped_odds.btts_no = odds_data['btts_no'] 
                scraped_odds.over_25 = odds_data['over_25']
                scraped_odds.under_25 = odds_data['under_25']
                scraped_odds.over_35 = odds_data['over_35']
                scraped_odds.under_35 = odds_data['under_35']
                scraped_odds.exact_scores = odds_data['exact_scores']
                
                logger.info(f"Extracted detailed odds for {event.home_team} vs {event.away_team}")
                logger.debug(f"1X2: {odds_data['home_odds']}-{odds_data['draw_odds']}-{odds_data['away_odds']}")
                
                return scraped_odds
            
        except Exception as e:
            logger.error(f"Error extracting detailed odds: {e}")
        
        return None
    
    async def _extract_basic_odds(self, event: ScrapedEvent) -> Optional[ScrapedOdds]:
        """Extract basic 1X2 odds from league page"""
        try:
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # This is a simplified version that looks for odds in the current page
            # In a real implementation, you'd need to find the specific row/element 
            # for this match and extract the odds from there
            
            # For now, return None and rely on detailed odds extraction
            return None
            
        except Exception as e:
            logger.error(f"Error extracting basic odds: {e}")
            return None
