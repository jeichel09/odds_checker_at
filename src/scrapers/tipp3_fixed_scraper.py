import re
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseBookmakerScraper, ScrapedEvent, ScrapedOdds
from loguru import logger


class Tipp3FixedScraper(BaseBookmakerScraper):
    """Fixed tipp3 scraper using correct selectors identified from structure analysis"""
    
    def __init__(self):
        super().__init__(
            bookmaker_name="tipp3_fixed", 
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
            "SK Rapid Wien II": "SK Rapid Wien II",
            "Red Bull Salzburg": "FC Red Bull Salzburg",
            "LASK": "LASK Linz",
            "Sturm Graz": "SK Sturm Graz",
            # English teams
            "FC Arsenal": "Arsenal",
            "Nottingham Forest": "Nottingham Forest",
            "Man City": "Manchester City",
            "Man United": "Manchester United",
            "Tottenham": "Tottenham Hotspur",
            # German teams
            "Bayern": "Bayern Munich",
            "BVB": "Borussia Dortmund",
            "RB Leipzig": "RB Leipzig",
            "Leverkusen": "Bayer Leverkusen",
        }
    
    def normalize_team_name(self, team_name: str) -> str:
        """Normalize team names for consistent matching"""
        if not team_name:
            return ""
        
        cleaned = team_name.strip()
        
        # Apply specific mappings
        if cleaned in self.team_name_mappings:
            return self.team_name_mappings[cleaned]
        
        # Don't normalize by removing prefixes/suffixes for Austrian sites
        # Keep original team names as they appear
        return cleaned
    
    async def get_football_events(self, leagues: List[str] = None) -> List[ScrapedEvent]:
        """Scrape events from specific tipp3 league URLs using correct selectors"""
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
        """Scrape events from a specific league URL using correct HTML structure"""
        events = []
        
        try:
            if not await self.safe_navigate(league_url):
                logger.error(f"Failed to navigate to {league_url}")
                return events
            
            # Wait for dynamic content to load
            await self.page.wait_for_timeout(5000)
            
            # Get page content
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Find event containers using the pattern id="event_123456"
            event_divs = soup.find_all('div', id=re.compile(r'^event_\d+$'))
            logger.info(f"Found {len(event_divs)} event containers in {league_name}")
            
            if not event_divs:
                logger.warning(f"No event containers found for {league_name}")
                return events
            
            for event_div in event_divs:
                try:
                    # Extract event ID from div id (e.g., "event_6018513" -> "6018513")
                    event_id = event_div['id'].replace('event_', '')
                    logger.debug(f"Processing event container {event_id}")
                    
                    # Find the two team name links within this event div
                    team_links = event_div.find_all('a', class_='t3-list-entry__player')
                    logger.debug(f"Found {len(team_links)} team links in event {event_id}")
                    
                    if len(team_links) != 2:
                        logger.warning(f"Event {event_id} has {len(team_links)} team links, expected 2")
                        continue
                    
                    # Extract team names
                    teams = []
                    event_url = None
                    
                    for team_link in team_links:
                        # Get team name (first line before any league info)
                        link_text = team_link.get_text().strip()
                        lines = link_text.split('\n')
                        team_name_raw = lines[0].strip() if lines else link_text.strip()
                        team_name = self.normalize_team_name(team_name_raw)
                        
                        if team_name:
                            teams.append(team_name)
                        
                        # Get event URL (should be same for both team links)
                        if not event_url:
                            href = team_link.get('href', '')
                            if href and 'eventdetails' in href:
                                if href.startswith('/'):
                                    event_url = self.base_url + href
                                else:
                                    event_url = href
                    
                    # Check if we have exactly 2 teams
                    if len(teams) != 2:
                        logger.warning(f"Event {event_id} has {len(teams)} valid teams, expected 2: {teams}")
                        continue
                    
                    home_team, away_team = teams[0], teams[1]
                    
                    # Find odds within this event div - look for spans with t3-bet-button__text class
                    odds_spans = event_div.find_all('span', class_='t3-bet-button__text')
                    logger.debug(f"Found {len(odds_spans)} odds spans in event {event_id}")
                    
                    # Extract odds values
                    odds_values = []
                    for odds_span in odds_spans:
                        odds_text = odds_span.get_text().strip()
                        # Look for decimal odds pattern (handle both comma and dot separators)
                        odds_match = re.search(r'\b(\d{1,2}[,.]\d{1,2})\b', odds_text)
                        if odds_match:
                            odds_value = self.normalize_odds_value(odds_match.group(1))
                            if odds_value and 1.01 <= odds_value <= 50.0:
                                odds_values.append(odds_value)
                                logger.debug(f"Found odds: {odds_value} from text: '{odds_text}'")
                    
                    logger.info(f"Event {event_id}: {home_team} vs {away_team} - {len(odds_values)} odds found")
                    
                    # Create event
                    event = ScrapedEvent(
                        home_team=home_team,
                        away_team=away_team,
                        match_date=datetime.now() + timedelta(days=1),  # Default date
                        league=league_name,
                        event_url=event_url or f"{self.base_url}/sportwetten/eventdetails?eventID={event_id}&caller=PRO",
                        bookmaker_event_id=event_id,
                        status="scheduled"
                    )
                    
                    # Store odds data in event for later use
                    event.odds_data = {
                        'raw_odds': odds_values,
                        'odds_count': len(odds_values)
                    }
                    
                    events.append(event)
                    logger.info(f"✅ Created event: {home_team} vs {away_team} (ID: {event_id}, Odds: {len(odds_values)})")
                
                except Exception as e:
                    logger.error(f"Error processing event div: {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(events)} events from {league_name}")
            
        except Exception as e:
            logger.error(f"Error scraping {league_name}: {e}")
        
        return events
    
    async def get_event_odds(self, event: ScrapedEvent) -> Optional[ScrapedOdds]:
        """Get odds for a specific event (uses odds already scraped from league page)"""
        try:
            logger.info(f"Getting odds for {event.home_team} vs {event.away_team}")
            
            # Check if we already have odds data from the league page scraping
            if hasattr(event, 'odds_data') and event.odds_data:
                raw_odds = event.odds_data.get('raw_odds', [])
                logger.info(f"Using pre-scraped odds: {len(raw_odds)} values found")
                
                if len(raw_odds) >= 3:
                    # Assume first 3 odds are 1X2 (Home, Draw, Away)
                    home_odds = raw_odds[0]
                    draw_odds = raw_odds[1] 
                    away_odds = raw_odds[2]
                    
                    scraped_odds = ScrapedOdds(
                        home_team=event.home_team,
                        away_team=event.away_team,
                        match_date=event.match_date,
                        home_odds=home_odds,
                        draw_odds=draw_odds,
                        away_odds=away_odds,
                        league=event.league,
                        match_url=event.event_url
                    )
                    
                    logger.info(f"✅ Created odds: {home_odds}-{draw_odds}-{away_odds}")
                    return scraped_odds
                else:
                    logger.warning(f"Not enough pre-scraped odds: {len(raw_odds)} found, need at least 3")
            
            # Fallback: Navigate to event details page for more detailed odds extraction
            logger.info("Falling back to event details page for odds extraction")
            
            if not event.event_url or 'eventdetails' not in event.event_url:
                logger.warning(f"No valid event URL for {event.home_team} vs {event.away_team}")
                return None
            
            if not await self.safe_navigate(event.event_url):
                logger.warning(f"Could not navigate to event URL: {event.event_url}")
                return None
            
            # Wait for page to load
            await self.page.wait_for_timeout(5000)
            
            return await self._extract_detailed_odds(event)
                
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
            
            # Look for betting buttons - tipp3 uses buttons with odds
            bet_buttons = soup.find_all('button', class_=lambda x: x and 'bet' in ' '.join(x).lower())
            
            logger.debug(f"Found {len(bet_buttons)} betting buttons")
            
            # Extract odds from buttons
            odds_found = []
            for button in bet_buttons[:20]:  # Check first 20 buttons
                button_text = button.get_text().strip()
                
                # Look for decimal odds pattern (e.g., "1.85", "2.20")
                odds_match = re.search(r'\b(\d{1,2}\.\d{2})\b', button_text)
                if odds_match:
                    odds_value = self.normalize_odds_value(odds_match.group(1))
                    if odds_value and 1.01 <= odds_value <= 50.0:
                        odds_found.append(odds_value)
                        logger.debug(f"Found odds: {odds_value} in button: {button_text[:50]}")
            
            # Look for 1X2 odds (first 3 valid odds usually)
            if len(odds_found) >= 3:
                odds_data['home_odds'] = odds_found[0]
                odds_data['draw_odds'] = odds_found[1] 
                odds_data['away_odds'] = odds_found[2]
                logger.info(f"Extracted 1X2 odds: {odds_found[0]}-{odds_found[1]}-{odds_found[2]}")
            
            # Look for BTTS (Both Teams to Score) - German: "Scoren beide"
            btts_elements = soup.find_all(text=re.compile(r'scoren beide|both.*score|btts', re.IGNORECASE))
            for btts_elem in btts_elements:
                parent = btts_elem.parent
                if parent:
                    # Look for nearby buttons with odds
                    nearby_buttons = parent.find_all_next(['button'], limit=5)
                    for button in nearby_buttons:
                        button_text = button.get_text().strip()
                        odds_match = re.search(r'(\d{1,2}\.\d{2})', button_text)
                        if odds_match:
                            odds_value = self.normalize_odds_value(odds_match.group(1))
                            if odds_value:
                                if 'ja' in button_text.lower() or 'yes' in button_text.lower():
                                    odds_data['btts_yes'] = odds_value
                                elif 'nein' in button_text.lower() or 'no' in button_text.lower():
                                    odds_data['btts_no'] = odds_value
            
            # Look for Over/Under 2.5 goals - German: "Toranzahl"
            ou_elements = soup.find_all(text=re.compile(r'toranzahl|über.*2\.?5|unter.*2\.?5|over.*2\.?5|under.*2\.?5', re.IGNORECASE))
            for ou_elem in ou_elements:
                parent = ou_elem.parent
                if parent:
                    nearby_buttons = parent.find_all_next(['button'], limit=10)
                    for button in nearby_buttons:
                        button_text = button.get_text().strip()
                        if '2.5' in button_text or '2,5' in button_text:
                            odds_match = re.search(r'(\d{1,2}\.\d{2})', button_text)
                            if odds_match:
                                odds_value = self.normalize_odds_value(odds_match.group(1))
                                if odds_value:
                                    if 'über' in button_text.lower() or 'over' in button_text.lower():
                                        odds_data['over_25'] = odds_value
                                    elif 'unter' in button_text.lower() or 'under' in button_text.lower():
                                        odds_data['under_25'] = odds_value
            
            # Look for Over/Under 3.5 goals
            for ou_elem in ou_elements:
                parent = ou_elem.parent
                if parent:
                    nearby_buttons = parent.find_all_next(['button'], limit=10)
                    for button in nearby_buttons:
                        button_text = button.get_text().strip()
                        if '3.5' in button_text or '3,5' in button_text:
                            odds_match = re.search(r'(\d{1,2}\.\d{2})', button_text)
                            if odds_match:
                                odds_value = self.normalize_odds_value(odds_match.group(1))
                                if odds_value:
                                    if 'über' in button_text.lower() or 'over' in button_text.lower():
                                        odds_data['over_35'] = odds_value
                                    elif 'unter' in button_text.lower() or 'under' in button_text.lower():
                                        odds_data['under_35'] = odds_value
            
            # Look for exact scores - often in sections with score patterns
            score_buttons = soup.find_all('button', text=re.compile(r'\d+:\d+'))
            for button in score_buttons:
                button_text = button.get_text().strip()
                score_match = re.match(r'(\d+):(\d+)', button_text)
                if score_match:
                    score = f"{score_match.group(1)}:{score_match.group(2)}"
                    
                    # Look for odds in the button or nearby elements
                    odds_match = re.search(r'(\d{1,2}\.\d{2})', button_text)
                    if not odds_match:
                        # Check data attributes
                        odds_attr = button.get('data-odds')
                        if odds_attr:
                            odds_match = re.search(r'(\d{1,2}\.\d{2})', odds_attr)
                    
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
                
                logger.info(f"✅ Extracted odds for {event.home_team} vs {event.away_team}")
                logger.info(f"1X2: {odds_data['home_odds']}-{odds_data['draw_odds']}-{odds_data['away_odds']}")
                
                if odds_data['btts_yes']:
                    logger.info(f"BTTS: Yes {odds_data['btts_yes']}, No {odds_data['btts_no']}")
                if odds_data['over_25']:
                    logger.info(f"O/U 2.5: Over {odds_data['over_25']}, Under {odds_data['under_25']}")
                if odds_data['exact_scores']:
                    logger.info(f"Exact scores: {len(odds_data['exact_scores'])} found")
                
                return scraped_odds
            else:
                logger.warning(f"No basic odds found for {event.home_team} vs {event.away_team}")
            
        except Exception as e:
            logger.error(f"Error extracting detailed odds: {e}")
        
        return None
