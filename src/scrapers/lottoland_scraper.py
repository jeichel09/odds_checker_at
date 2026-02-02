import re
from typing import List, Optional
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseBookmakerScraper, ScrapedEvent, ScrapedOdds
from loguru import logger


class LottolandScraper(BaseBookmakerScraper):
    """Scraper for Lottoland Austria sports betting"""
    
    def __init__(self):
        super().__init__(
            bookmaker_name="Lottoland", 
            base_url="https://www.lottoland.at",
            delay_range=(3, 6)  # Be conservative with delays
        )
        self.sports_url = f"{self.base_url}/sportwetten"
        
        # Common team name normalizations for Austrian context
        self.team_name_mappings = {
            # Austrian teams
            "FK Austria Wien": "Austria Wien", 
            "FK Austria Vienna": "Austria Wien",
            "SK Rapid Wien": "Rapid Wien",
            "RB Salzburg": "Red Bull Salzburg",
            "FC Red Bull Salzburg": "Red Bull Salzburg",
            # German teams (commonly bet on in Austria)
            "Bayern München": "Bayern Munich",
            "FC Bayern München": "Bayern Munich",
            "Borussia Dortmund": "BVB Dortmund",
            "BV Borussia Dortmund": "BVB Dortmund",
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
        prefixes_to_remove = ["FC", "FK", "SK", "SV", "1.", "TSV", "VfB", "VfL"]
        suffixes_to_remove = ["e.V.", "1919", "1909", "1896"]
        
        words = cleaned.split()
        words = [word for word in words if word not in prefixes_to_remove + suffixes_to_remove]
        
        return " ".join(words).strip()
    
    async def get_football_events(self, leagues: List[str] = None) -> List[ScrapedEvent]:
        """Scrape upcoming football events from Lottoland"""
        events = []
        
        try:
            # Navigate to sports betting page
            if not await self.safe_navigate(self.sports_url):
                logger.error(f"Failed to navigate to {self.sports_url}")
                return events
            
            # Wait for content to load
            await self.page.wait_for_timeout(3000)
            
            # Look for football/soccer section
            football_links = await self.page.query_selector_all('a[href*="fussball"], a[href*="football"], a[href*="soccer"]')
            
            if football_links:
                # Click on football section
                await football_links[0].click()
                await self.page.wait_for_timeout(2000)
            
            # Get page content and parse with BeautifulSoup
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Look for match containers (this will need to be adapted based on actual HTML structure)
            match_containers = soup.find_all(['div', 'tr', 'li'], class_=lambda x: x and any(keyword in x.lower() for keyword in ['match', 'event', 'game', 'fixture']))
            
            for container in match_containers:
                try:
                    event = await self._parse_event_container(container)
                    if event:
                        events.append(event)
                except Exception as e:
                    logger.debug(f"Error parsing event container: {e}")
                    continue
            
            logger.info(f"Found {len(events)} events from Lottoland")
            
        except Exception as e:
            logger.error(f"Error scraping Lottoland events: {e}")
        
        return events
    
    async def _parse_event_container(self, container) -> Optional[ScrapedEvent]:
        """Parse individual event container"""
        try:
            # Look for team names (this is a generic approach, will need refinement)
            team_elements = container.find_all(['span', 'div', 'td'], string=re.compile(r'[A-Za-z]{3,}'))
            
            if len(team_elements) < 2:
                return None
            
            # Extract team names (this logic will need to be adapted to actual HTML structure)
            home_team = ""
            away_team = ""
            
            # Look for patterns like "Team A vs Team B" or "Team A - Team B"
            text_content = container.get_text().strip()
            vs_patterns = [' vs ', ' - ', ' gegen ', ' : ']
            
            for pattern in vs_patterns:
                if pattern in text_content:
                    parts = text_content.split(pattern)
                    if len(parts) == 2:
                        home_team = self.normalize_team_name(parts[0].strip())
                        away_team = self.normalize_team_name(parts[1].strip())
                        break
            
            if not home_team or not away_team:
                return None
            
            # Try to extract date (placeholder logic)
            match_date = datetime.now() + timedelta(days=1)  # Default to tomorrow
            
            # Try to find date elements
            date_elements = container.find_all(string=re.compile(r'\\d{1,2}\\.\\d{1,2}|\\d{1,2}/\\d{1,2}'))
            if date_elements:
                # Parse date (simplified)
                try:
                    date_text = date_elements[0].strip()
                    # This would need proper date parsing logic
                    pass
                except:
                    pass
            
            # Extract event URL if available
            event_url = ""
            link_element = container.find('a', href=True)
            if link_element:
                href = link_element['href']
                if href.startswith('/'):
                    event_url = self.base_url + href
                else:
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
            logger.debug(f"Error parsing Lottoland event: {e}")
            return None
    
    async def get_event_odds(self, event: ScrapedEvent) -> Optional[ScrapedOdds]:
        """Get odds for a specific event"""
        try:
            # Navigate to event-specific page if available
            if event.event_url and event.event_url != self.sports_url:
                if not await self.safe_navigate(event.event_url):
                    logger.warning(f"Could not navigate to event URL: {event.event_url}")
                    return None
            
            # Get page content
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Look for odds containers (generic approach)
            odds_containers = soup.find_all(['div', 'span', 'td'], class_=lambda x: x and 'odd' in x.lower())
            
            if not odds_containers:
                # Try alternative selectors
                odds_containers = soup.find_all(string=re.compile(r'\\d+\\.\\d{2}'))
            
            home_odds = None
            draw_odds = None 
            away_odds = None
            
            # Extract odds (this is very simplified and will need refinement)
            odds_values = []
            for container in odds_containers[:10]:  # Check first 10 potential odds
                if hasattr(container, 'get_text'):
                    text = container.get_text().strip()
                else:
                    text = str(container).strip()
                
                odds_value = self.normalize_odds_value(text)
                if odds_value and 1.01 <= odds_value <= 50.0:  # Reasonable odds range
                    odds_values.append(odds_value)
            
            # Assign odds (assuming 1X2 format: Home, Draw, Away)
            if len(odds_values) >= 3:
                home_odds = odds_values[0]
                draw_odds = odds_values[1] 
                away_odds = odds_values[2]
            elif len(odds_values) == 2:  # Maybe no draw odds
                home_odds = odds_values[0]
                away_odds = odds_values[1]
            
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
            logger.error(f"Error getting Lottoland odds: {e}")
        
        return None
