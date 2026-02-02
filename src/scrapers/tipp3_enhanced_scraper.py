import re
import json
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from bs4 import BeautifulSoup
from scrapers.base_scraper import BaseBookmakerScraper, ScrapedEvent, ScrapedOdds
from loguru import logger


class Tipp3EnhancedScraper(BaseBookmakerScraper):
    """Enhanced tipp3 scraper that identifies specific bet types and saves results to JSON"""
    
    def __init__(self):
        super().__init__(
            bookmaker_name="tipp3_enhanced", 
            base_url="https://www.tipp3.at",
            delay_range=(3, 6)
        )
        
        self.league_urls = {
            "Austrian Bundesliga": "https://www.tipp3.at/sport/fussball/oesterreich-wetten",
            "Premier League": "https://www.tipp3.at/sport/fussball/england/premier-league-wetten",
            "German Bundesliga": "https://www.tipp3.at/sport/fussball/deutschland/bundesliga-wetten",
            "Serie A": "https://www.tipp3.at/sport/fussball/italien-wetten",
            "Ligue 1": "https://www.tipp3.at/sport/fussball/frankreich-wetten",
            "La Liga": "https://www.tipp3.at/sport/fussball/spanien-wetten"
        }
        
        # Store all results for JSON export
        self.scraped_results = []
    
    def normalize_team_name(self, team_name: str) -> str:
        """Normalize team names for consistent matching"""
        if not team_name:
            return ""
        
        cleaned = team_name.strip()
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
            
            await self.random_delay()
        
        logger.info(f"Total events scraped from tipp3: {len(all_events)}")
        return all_events
    
    async def _scrape_league_events(self, league_name: str, league_url: str) -> List[ScrapedEvent]:
        """Scrape events from a specific league URL with enhanced odds analysis"""
        events = []
        
        try:
            if not await self.safe_navigate(league_url):
                logger.error(f"Failed to navigate to {league_url}")
                return events
            
            await self.page.wait_for_timeout(5000)
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Find event containers
            event_divs = soup.find_all('div', id=re.compile(r'^event_\d+$'))
            logger.info(f"Found {len(event_divs)} event containers in {league_name}")
            
            if not event_divs:
                logger.warning(f"No event containers found for {league_name}")
                return events
            
            for event_div in event_divs:
                try:
                    event_id = event_div['id'].replace('event_', '')
                    
                    # Extract team names
                    team_links = event_div.find_all('a', class_='t3-list-entry__player')
                    if len(team_links) != 2:
                        logger.warning(f"Event {event_id} has {len(team_links)} team links, expected 2")
                        continue
                    
                    teams = []
                    event_url = None
                    
                    for team_link in team_links:
                        link_text = team_link.get_text().strip()
                        lines = link_text.split('\n')
                        team_name_raw = lines[0].strip() if lines else link_text.strip()
                        team_name = self.normalize_team_name(team_name_raw)
                        
                        if team_name:
                            teams.append(team_name)
                        
                        if not event_url:
                            href = team_link.get('href', '')
                            if href and 'eventdetails' in href:
                                event_url = self.base_url + href if href.startswith('/') else href
                    
                    if len(teams) != 2:
                        logger.warning(f"Event {event_id} has {len(teams)} valid teams, expected 2: {teams}")
                        continue
                    
                    home_team, away_team = teams[0], teams[1]
                    
                    # Enhanced odds analysis
                    odds_data = await self._analyze_event_odds(event_div, event_id, home_team, away_team)
                    
                    # Create event
                    event = ScrapedEvent(
                        home_team=home_team,
                        away_team=away_team,
                        match_date=datetime.now() + timedelta(days=1),
                        league=league_name,
                        event_url=event_url or f"{self.base_url}/sportwetten/eventdetails?eventID={event_id}&caller=PRO",
                        bookmaker_event_id=event_id,
                        status="scheduled"
                    )
                    
                    event.enhanced_odds_data = odds_data
                    events.append(event)
                    
                    # Store result for JSON export
                    result_entry = {
                        "event_id": event_id,
                        "home_team": home_team,
                        "away_team": away_team,
                        "league": league_name,
                        "match_date": event.match_date.isoformat(),
                        "event_url": event.event_url,
                        "odds": odds_data
                    }
                    self.scraped_results.append(result_entry)
                    
                    logger.info(f"✅ {home_team} vs {away_team}: 1X2=[{odds_data.get('home_odds')}, {odds_data.get('draw_odds')}, {odds_data.get('away_odds')}]")
                
                except Exception as e:
                    logger.error(f"Error processing event div: {e}")
                    continue
            
            logger.info(f"Successfully parsed {len(events)} events from {league_name}")
            
        except Exception as e:
            logger.error(f"Error scraping {league_name}: {e}")
        
        return events
    
    async def _analyze_event_odds(self, event_div, event_id: str, home_team: str, away_team: str) -> Dict[str, Any]:
        """Analyze odds structure to identify specific bet types"""
        
        # Find all odds spans from league page for 1X2
        odds_spans = event_div.find_all('span', class_='t3-bet-button__text')
        raw_odds_values = []
        
        for odds_span in odds_spans:
            odds_text = odds_span.get_text().strip()
            odds_match = re.search(r'\b(\d{1,2}[,.]\d{1,2})\b', odds_text)
            if odds_match:
                odds_value = self.normalize_odds_value(odds_match.group(1))
                if odds_value and 1.01 <= odds_value <= 50.0:
                    raw_odds_values.append(odds_value)
        
        logger.info(f"Event {event_id}: Found {len(raw_odds_values)} raw odds: {raw_odds_values[:10]}...")
        
        # Initialize odds structure
        odds_data = {
            'raw_odds_count': len(raw_odds_values),
            'raw_odds_sample': raw_odds_values[:10],  # First 10 for debugging
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
        
        if len(raw_odds_values) < 3:
            logger.warning(f"Event {event_id}: Not enough odds found ({len(raw_odds_values)})")
            return odds_data
        
        # Strategy 1: Look for 1X2 pattern (Home win, Draw, Away win)
        # Typical 1X2 odds: Home around 1.5-4.0, Draw around 2.5-4.5, Away around 1.5-6.0
        potential_1x2_groups = []
        
        for i in range(len(raw_odds_values) - 2):
            home_candidate = raw_odds_values[i]
            draw_candidate = raw_odds_values[i + 1]
            away_candidate = raw_odds_values[i + 2]
            
            # Check if this looks like a 1X2 pattern
            if (1.2 <= home_candidate <= 6.0 and 
                2.8 <= draw_candidate <= 5.5 and  # Draw odds typically higher
                1.2 <= away_candidate <= 8.0):
                
                # Additional validation: draw should typically be higher than both teams
                if draw_candidate >= max(home_candidate, away_candidate) * 0.9:
                    confidence_score = self._calculate_1x2_confidence(home_candidate, draw_candidate, away_candidate)
                    potential_1x2_groups.append({
                        'home': home_candidate,
                        'draw': draw_candidate, 
                        'away': away_candidate,
                        'position': i,
                        'confidence': confidence_score
                    })
        
        # Select best 1X2 candidate
        if potential_1x2_groups:
            best_1x2 = max(potential_1x2_groups, key=lambda x: x['confidence'])
            odds_data['home_odds'] = best_1x2['home']
            odds_data['draw_odds'] = best_1x2['draw']
            odds_data['away_odds'] = best_1x2['away']
            logger.info(f"Event {event_id}: Selected 1X2 odds: {best_1x2['home']}-{best_1x2['draw']}-{best_1x2['away']} (confidence: {best_1x2['confidence']:.2f})")
        else:
            # Fallback: Use first 3 odds but log warning
            odds_data['home_odds'] = raw_odds_values[0]
            odds_data['draw_odds'] = raw_odds_values[1] 
            odds_data['away_odds'] = raw_odds_values[2]
            logger.warning(f"Event {event_id}: No clear 1X2 pattern found, using first 3 odds as fallback")
        
        # BTTS odds will be extracted from event detail page
        
        # O/U and exact score odds will be extracted from event detail page later
        
        # Extract detailed odds from event detail page
        detailed_odds = await self._extract_detailed_odds_from_event_page(event_id)
        if detailed_odds:
            odds_data.update(detailed_odds)
        
        return odds_data
    
    async def _extract_detailed_odds_from_event_page(self, event_id: str) -> Dict[str, Any]:
        """Extract detailed odds (BTTS, O/U, exact scores) from event detail page"""
        detailed_odds = {}
        
        try:
            # Navigate to event detail page
            event_url = f"{self.base_url}/sportwetten/eventdetails?eventID={event_id}&caller=PRO"
            logger.info(f"Navigating to event detail page for {event_id}...")
            
            if not await self.safe_navigate(event_url):
                logger.warning(f"Could not navigate to event detail page: {event_url}")
                return detailed_odds
            
            await self.page.wait_for_timeout(3000)
            content = await self.page.content()
            soup = BeautifulSoup(content, 'html.parser')
            
            # Extract BTTS odds using the exact structure you provided
            btts_odds = self._extract_btts_odds(soup, event_id)
            if btts_odds:
                detailed_odds.update(btts_odds)
            
            # Extract Over/Under odds using the exact structure provided
            ou_odds = self._extract_ou_odds(soup, event_id)
            if ou_odds:
                detailed_odds.update(ou_odds)
            
            # Extract correct score odds using the exact structure provided
            correct_score_odds = self._extract_correct_score_odds(soup, event_id)
            if correct_score_odds:
                detailed_odds.update(correct_score_odds)
            
        except Exception as e:
            logger.error(f"Error extracting detailed odds for event {event_id}: {e}")
        
        return detailed_odds
    
    def _extract_btts_odds(self, soup: BeautifulSoup, event_id: str) -> Dict[str, Any]:
        """Extract BTTS odds using the exact HTML structure provided"""
        btts_data = {}
        
        try:
            # Find the BTTS section header with the specific German text
            btts_header = None
            headers = soup.find_all('div', class_='t3-match-details__entry-header')
            
            for header in headers:
                header_text = header.get_text().strip()
                if 'Fällt für beide Teams mindestens je ein Tor?' in header_text:
                    btts_header = header
                    break
            
            if not btts_header:
                logger.debug(f"Event {event_id}: BTTS header not found")
                return btts_data
            
            logger.debug(f"Event {event_id}: Found BTTS header: {btts_header.get_text().strip()}")
            
            # Find the parent container
            btts_container = btts_header.find_parent('div', class_='t3-match-details__entry')
            if not btts_container:
                logger.debug(f"Event {event_id}: BTTS container not found")
                return btts_data
            
            # Find the content div
            content_div = btts_container.find('div', class_='t3-match-details__entry-content')
            if not content_div:
                logger.debug(f"Event {event_id}: BTTS content div not found")
                return btts_data
            
            # Find all bet elements within the content
            bet_elements = content_div.find_all('div', class_='t3-bet-element')
            logger.debug(f"Event {event_id}: Found {len(bet_elements)} BTTS bet elements")
            
            for bet_element in bet_elements:
                # Get the label (Ja/Nein)
                label_div = bet_element.find('div', class_='t3-bet-element__label')
                if not label_div:
                    continue
                
                label = label_div.get_text().strip().lower()
                logger.debug(f"Event {event_id}: Processing label: '{label}'")
                
                # Get the odds from the button span
                field_div = bet_element.find('div', class_='t3-bet-element__field')
                if not field_div:
                    logger.debug(f"Event {event_id}: No field div found")
                    continue
                
                button = field_div.find('button', class_='t3-bet-button')
                if not button:
                    logger.debug(f"Event {event_id}: No bet button found")
                    continue
                
                odds_span = button.find('span', class_='t3-bet-button__text')
                if not odds_span:
                    logger.debug(f"Event {event_id}: No odds span found")
                    continue
                
                odds_text = odds_span.get_text().strip()
                odds_value = self.normalize_odds_value(odds_text)
                logger.debug(f"Event {event_id}: Odds text '{odds_text}' -> value {odds_value}")
                
                if odds_value:
                    if label == 'ja':
                        btts_data['btts_yes'] = odds_value
                        logger.info(f"Event {event_id}: Found BTTS Yes: {odds_value}")
                    elif label == 'nein':
                        btts_data['btts_no'] = odds_value
                        logger.info(f"Event {event_id}: Found BTTS No: {odds_value}")
                    else:
                        logger.debug(f"Event {event_id}: Unknown label '{label}' with odds {odds_value}")
                else:
                    logger.debug(f"Event {event_id}: Could not parse odds from '{odds_text}'")
            
            if btts_data:
                logger.info(f"Event {event_id}: Successfully extracted BTTS odds: Yes {btts_data.get('btts_yes')}, No {btts_data.get('btts_no')}")
            else:
                logger.warning(f"Event {event_id}: No BTTS odds found")
                
        except Exception as e:
            logger.error(f"Error extracting BTTS odds for event {event_id}: {e}")
        
        return btts_data
    
    def _extract_ou_odds(self, soup: BeautifulSoup, event_id: str) -> Dict[str, Any]:
        """Extract Over/Under odds using the exact HTML structure provided"""
        ou_data = {}
        
        try:
            # Find the O/U section header with the specific German text
            ou_header = None
            headers = soup.find_all('div', class_='t3-match-details__entry-header')
            
            for header in headers:
                header_text = header.get_text().strip()
                if 'Wie viele Tore werden erzielt?' in header_text:
                    ou_header = header
                    break
            
            if not ou_header:
                logger.debug(f"Event {event_id}: O/U header not found")
                return ou_data
            
            logger.debug(f"Event {event_id}: Found O/U header: {ou_header.get_text().strip()}")
            
            # Find the parent container
            ou_container = ou_header.find_parent('div', class_='t3-match-details__entry')
            if not ou_container:
                logger.debug(f"Event {event_id}: O/U container not found")
                return ou_data
            
            # Find the content div
            content_div = ou_container.find('div', class_='t3-match-details__entry-content')
            if not content_div:
                logger.debug(f"Event {event_id}: O/U content div not found")
                return ou_data
            
            # Find all list entries within the content
            list_entries = content_div.find_all('div', class_='t3-list-entry')
            logger.debug(f"Event {event_id}: Found {len(list_entries)} O/U list entries")
            
            for entry in list_entries:
                # Get the goal threshold from t3-list-entry__info-muted
                info_div = entry.find('div', class_='t3-list-entry__info-muted')
                if not info_div:
                    continue
                
                # Extract the goal threshold (e.g., "2,5")
                info_text = info_div.get_text().strip().replace('\n', ' ')
                threshold_match = re.search(r'(\d+[,.]\d+)', info_text)
                
                if not threshold_match:
                    continue
                
                threshold_str = threshold_match.group(1).replace(',', '.')
                try:
                    threshold = float(threshold_str)
                except ValueError:
                    continue
                
                logger.debug(f"Event {event_id}: Processing O/U {threshold} goals")
                
                # Find the two betting buttons (Over and Under)
                bet_divs = entry.find_all('div', class_='t3-list-entry__bet')
                
                if len(bet_divs) != 2:
                    logger.debug(f"Event {event_id}: Expected 2 bet divs for O/U {threshold}, found {len(bet_divs)}")
                    continue
                
                # First bet div is "mehr" (over), second is "weniger" (under)
                over_div = bet_divs[0]
                under_div = bet_divs[1]
                
                # Extract Over odds
                over_button = over_div.find('button', class_='t3-bet-button')
                over_odds = None
                if over_button:
                    over_span = over_button.find('span', class_='t3-bet-button__text')
                    if over_span:
                        over_text = over_span.get_text().strip()
                        over_odds = self.normalize_odds_value(over_text)
                        logger.debug(f"Event {event_id}: Over {threshold} odds: {over_text} -> {over_odds}")
                
                # Extract Under odds
                under_button = under_div.find('button', class_='t3-bet-button')
                under_odds = None
                if under_button:
                    under_span = under_button.find('span', class_='t3-bet-button__text')
                    if under_span:
                        under_text = under_span.get_text().strip()
                        under_odds = self.normalize_odds_value(under_text)
                        logger.debug(f"Event {event_id}: Under {threshold} odds: {under_text} -> {under_odds}")
                
                # Store the odds based on threshold
                if over_odds and under_odds:
                    if threshold == 2.5:
                        ou_data['over_25'] = over_odds
                        ou_data['under_25'] = under_odds
                        logger.info(f"Event {event_id}: Found O/U 2.5: Over {over_odds}, Under {under_odds}")
                    elif threshold == 3.5:
                        ou_data['over_35'] = over_odds
                        ou_data['under_35'] = under_odds
                        logger.info(f"Event {event_id}: Found O/U 3.5: Over {over_odds}, Under {under_odds}")
                    elif threshold == 1.5:
                        ou_data['over_15'] = over_odds
                        ou_data['under_15'] = under_odds
                        logger.info(f"Event {event_id}: Found O/U 1.5: Over {over_odds}, Under {under_odds}")
                    elif threshold == 4.5:
                        ou_data['over_45'] = over_odds
                        ou_data['under_45'] = under_odds
                        logger.info(f"Event {event_id}: Found O/U 4.5: Over {over_odds}, Under {under_odds}")
                    else:
                        logger.debug(f"Event {event_id}: O/U {threshold} not stored (not a target threshold)")
                else:
                    logger.debug(f"Event {event_id}: Could not extract both odds for O/U {threshold}")
            
            if ou_data:
                ou_count = len([k for k in ou_data.keys() if 'over' in k])
                logger.info(f"Event {event_id}: Successfully extracted {ou_count} O/U thresholds")
            else:
                logger.warning(f"Event {event_id}: No O/U odds found")
                
        except Exception as e:
            logger.error(f"Error extracting O/U odds for event {event_id}: {e}")
        
        return ou_data
    
    def _extract_correct_score_odds(self, soup: BeautifulSoup, event_id: str) -> Dict[str, Any]:
        """Extract correct score odds using the exact HTML structure provided"""
        correct_score_data = {}
        
        try:
            # Find the correct score section header with "Resultatwette"
            correct_score_header = None
            headers = soup.find_all('div', class_='t3-match-details__entry-header')
            
            for header in headers:
                header_text = header.get_text().strip()
                if 'Resultatwette' in header_text:
                    correct_score_header = header
                    break
            
            if not correct_score_header:
                logger.debug(f"Event {event_id}: Correct score header not found")
                return correct_score_data
            
            logger.debug(f"Event {event_id}: Found correct score header: {correct_score_header.get_text().strip()}")
            
            # Find the parent container
            correct_score_container = correct_score_header.find_parent('div', class_='t3-match-details__entry')
            if not correct_score_container:
                logger.debug(f"Event {event_id}: Correct score container not found")
                return correct_score_data
            
            # Find the content div
            content_div = correct_score_container.find('div', class_='t3-match-details__entry-content')
            if not content_div:
                logger.debug(f"Event {event_id}: Correct score content div not found")
                return correct_score_data
            
            # Find all entry rows
            entry_rows = content_div.find_all('div', class_='t3-match-details__entry-row')
            logger.debug(f"Event {event_id}: Found {len(entry_rows)} correct score entry rows")
            
            exact_scores = {}
            
            for row in entry_rows:
                # Find all bet elements in this row
                bet_elements = row.find_all('div', class_='t3-bet-element')
                
                for bet_element in bet_elements:
                    # Get the score label (e.g., "1:0", "2:2", etc.)
                    label_div = bet_element.find('div', class_='t3-bet-element__label')
                    if not label_div:
                        continue
                    
                    score_label = label_div.get_text().strip()
                    
                    # Skip empty elements and spacers
                    if not score_label or 'spacer' in bet_element.get('class', []):
                        continue
                    
                    logger.debug(f"Event {event_id}: Processing correct score: '{score_label}'")
                    
                    # Get the odds from the button span
                    field_div = bet_element.find('div', class_='t3-bet-element__field')
                    if not field_div:
                        logger.debug(f"Event {event_id}: No field div found for score {score_label}")
                        continue
                    
                    button = field_div.find('button', class_='t3-bet-button')
                    if not button:
                        logger.debug(f"Event {event_id}: No bet button found for score {score_label}")
                        continue
                    
                    odds_span = button.find('span', class_='t3-bet-button__text')
                    if not odds_span:
                        logger.debug(f"Event {event_id}: No odds span found for score {score_label}")
                        continue
                    
                    odds_text = odds_span.get_text().strip()
                    odds_value = self.normalize_odds_value(odds_text)
                    
                    if odds_value:
                        exact_scores[score_label] = odds_value
                        logger.debug(f"Event {event_id}: Found correct score {score_label}: {odds_value}")
                    else:
                        logger.debug(f"Event {event_id}: Could not parse odds from '{odds_text}' for score {score_label}")
            
            if exact_scores:
                correct_score_data['exact_scores'] = exact_scores
                score_count = len(exact_scores)
                logger.info(f"Event {event_id}: Successfully extracted {score_count} correct score odds")
                
                # Show a sample of extracted scores for debugging
                sample_scores = list(exact_scores.items())[:3]
                sample_text = ", ".join([f"{score}: {odds}" for score, odds in sample_scores])
                logger.debug(f"Event {event_id}: Sample correct scores: {sample_text}")
            else:
                logger.warning(f"Event {event_id}: No correct score odds found")
                
        except Exception as e:
            logger.error(f"Error extracting correct score odds for event {event_id}: {e}")
        
        return correct_score_data
    
    def _calculate_1x2_confidence(self, home_odds: float, draw_odds: float, away_odds: float) -> float:
        """Calculate confidence score for 1X2 odds identification"""
        score = 0.0
        
        # Draw should be higher than both team odds (typical pattern)
        if draw_odds > home_odds and draw_odds > away_odds:
            score += 3.0
        elif draw_odds >= max(home_odds, away_odds) * 0.9:
            score += 1.5
        
        # Reasonable odds ranges
        if 1.2 <= home_odds <= 5.0:
            score += 1.0
        if 2.8 <= draw_odds <= 4.8:
            score += 2.0
        if 1.2 <= away_odds <= 6.0:
            score += 1.0
        
        # Check implied probability sum (should be close to 1.0 after bookmaker margin)
        implied_sum = (1/home_odds) + (1/draw_odds) + (1/away_odds)
        if 1.05 <= implied_sum <= 1.15:  # Typical bookmaker margin
            score += 2.0
        elif 1.00 <= implied_sum <= 1.20:
            score += 1.0
        
        return score
    
    async def get_event_odds(self, event: ScrapedEvent) -> Optional[ScrapedOdds]:
        """Get odds for a specific event (uses pre-analyzed enhanced odds)"""
        try:
            if hasattr(event, 'enhanced_odds_data') and event.enhanced_odds_data:
                odds_data = event.enhanced_odds_data
                
                if all(odds_data.get(key) is not None for key in ['home_odds', 'draw_odds', 'away_odds']):
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
                    
                    # Add extended odds
                    scraped_odds.btts_yes = odds_data.get('btts_yes')
                    scraped_odds.btts_no = odds_data.get('btts_no')
                    scraped_odds.over_25 = odds_data.get('over_25')
                    scraped_odds.under_25 = odds_data.get('under_25')
                    scraped_odds.over_35 = odds_data.get('over_35')
                    scraped_odds.under_35 = odds_data.get('under_35')
                    scraped_odds.exact_scores = odds_data.get('exact_scores', {})
                    
                    return scraped_odds
                else:
                    logger.warning(f"Incomplete 1X2 odds for {event.home_team} vs {event.away_team}")
            
        except Exception as e:
            logger.error(f"Error getting enhanced odds for {event.home_team} vs {event.away_team}: {e}")
        
        return None
    
    def save_results_to_json(self, filename: str = None) -> str:
        """Save all scraped results to JSON file"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"tipp3_enhanced_results_{timestamp}.json"
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(self.scraped_results, f, indent=2, ensure_ascii=False)
            
            logger.info(f"✅ Saved {len(self.scraped_results)} results to {filename}")
            return filename
        
        except Exception as e:
            logger.error(f"Error saving results to JSON: {e}")
            return None
