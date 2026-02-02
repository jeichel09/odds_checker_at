"""
Free sports data API integration
Using football-data.org free tier (10 requests per minute, no API key required)
"""
import aiohttp
import asyncio
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from loguru import logger
from fuzzywuzzy import fuzz


class FreeSportsAPI:
    """Free sports data API client using football-data.org"""
    
    def __init__(self):
        self.base_url = "https://api.football-data.org/v4"
        self.session: Optional[aiohttp.ClientSession] = None
        self.request_count = 0
        self.last_request_time = datetime.now()
        
        # Austrian-relevant competition IDs (free tier)
        self.competition_ids = {
            "premier_league": "PL",      # Premier League
            "bundesliga": "BL1",         # German Bundesliga  
            "serie_a": "SA",             # Serie A
            "ligue_1": "FL1",            # Ligue 1
            "primera_division": "PD",    # La Liga
            "champions_league": "CL",    # Champions League
            "europa_league": "EL",       # Europa League
        }
        
        # Team name normalization cache
        self.team_cache = {}
        self.match_cache = {}
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            headers={
                "User-Agent": "OddsChecker Austria/1.0",
                "Accept": "application/json"
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def _rate_limit(self):
        """Simple rate limiting for free tier (10 requests per minute)"""
        now = datetime.now()
        time_since_last = (now - self.last_request_time).total_seconds()
        
        if self.request_count >= 10:
            if time_since_last < 60:  # Less than 1 minute since we hit the limit
                sleep_time = 60 - time_since_last + 1
                logger.info(f"Rate limiting: sleeping for {sleep_time:.1f} seconds")
                await asyncio.sleep(sleep_time)
            self.request_count = 0
        
        self.last_request_time = now
        self.request_count += 1
    
    async def _make_request(self, endpoint: str) -> Optional[Dict]:
        """Make rate-limited API request"""
        await self._rate_limit()
        
        url = f"{self.base_url}/{endpoint}"
        
        try:
            logger.debug(f"Making API request to: {url}")
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                elif response.status == 429:  # Rate limited
                    logger.warning("API rate limit exceeded, waiting...")
                    await asyncio.sleep(60)
                    return await self._make_request(endpoint)  # Retry
                else:
                    logger.warning(f"API request failed with status {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error making API request to {url}: {e}")
            return None
    
    async def get_upcoming_matches(self, days_ahead: int = 7) -> List[Dict]:
        """Get upcoming matches from multiple leagues"""
        all_matches = []
        
        # Calculate date range
        today = datetime.now().date()
        end_date = today + timedelta(days=days_ahead)
        
        date_from = today.isoformat()
        date_to = end_date.isoformat()
        
        # Get matches from multiple competitions
        for comp_name, comp_id in self.competition_ids.items():
            try:
                endpoint = f"competitions/{comp_id}/matches?dateFrom={date_from}&dateTo={date_to}"
                data = await self._make_request(endpoint)
                
                if data and 'matches' in data:
                    matches = data['matches']
                    logger.info(f"Found {len(matches)} matches in {comp_name}")
                    
                    for match in matches:
                        # Normalize match data
                        normalized_match = {
                            'id': match.get('id'),
                            'home_team': match['homeTeam']['name'],
                            'away_team': match['awayTeam']['name'],
                            'home_team_normalized': self.normalize_team_name(match['homeTeam']['name']),
                            'away_team_normalized': self.normalize_team_name(match['awayTeam']['name']),
                            'match_date': datetime.fromisoformat(match['utcDate'].replace('Z', '+00:00')),
                            'competition': comp_name,
                            'competition_id': comp_id,
                            'status': match.get('status', 'SCHEDULED').lower()
                        }
                        all_matches.append(normalized_match)
                        
                        # Cache for later matching
                        match_key = f"{normalized_match['home_team_normalized']}_{normalized_match['away_team_normalized']}"
                        self.match_cache[match_key] = normalized_match
                
                # Small delay between competitions to be nice to the API
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error getting matches for {comp_name}: {e}")
                continue
        
        logger.info(f"Total matches found: {len(all_matches)}")
        return all_matches
    
    def normalize_team_name(self, team_name: str) -> str:
        """Normalize team name for matching"""
        if not team_name:
            return ""
        
        # Check cache first
        if team_name in self.team_cache:
            return self.team_cache[team_name]
        
        # Basic normalization
        normalized = team_name.strip()
        
        # Remove common prefixes and suffixes
        prefixes = ["FC", "AC", "AS", "SK", "FK", "SV", "1.", "TSV", "VfB", "VfL", "SSC", "CF"]
        suffixes = ["FC", "e.V.", "1919", "1909", "1896", "Wien", "Vienna", "Munich", "München"]
        
        words = normalized.split()
        
        # Remove prefixes
        if words and words[0] in prefixes:
            words = words[1:]
        
        # Remove suffixes
        if words and words[-1] in suffixes:
            words = words[:-1]
        
        normalized = " ".join(words).strip()
        
        # Cache the result
        self.team_cache[team_name] = normalized
        return normalized
    
    def find_best_match(self, scraped_home: str, scraped_away: str, 
                       threshold: int = 80) -> Optional[Dict]:
        """Find best matching event from API data using fuzzy matching"""
        scraped_home_norm = self.normalize_team_name(scraped_home)
        scraped_away_norm = self.normalize_team_name(scraped_away)
        
        best_match = None
        best_score = 0
        
        for match_key, api_match in self.match_cache.items():
            # Calculate similarity scores
            home_score = fuzz.ratio(scraped_home_norm, api_match['home_team_normalized'])
            away_score = fuzz.ratio(scraped_away_norm, api_match['away_team_normalized'])
            
            # Try both directions (home/away might be swapped)
            home_away_score = (home_score + away_score) / 2
            
            away_home_score = (
                fuzz.ratio(scraped_home_norm, api_match['away_team_normalized']) +
                fuzz.ratio(scraped_away_norm, api_match['home_team_normalized'])
            ) / 2
            
            total_score = max(home_away_score, away_home_score)
            
            if total_score > best_score and total_score >= threshold:
                best_score = total_score
                best_match = {
                    **api_match,
                    'match_score': total_score,
                    'swapped': away_home_score > home_away_score
                }
        
        if best_match:
            logger.debug(f"Found match for {scraped_home} vs {scraped_away}: "
                        f"{best_match['home_team']} vs {best_match['away_team']} "
                        f"(score: {best_match['match_score']:.1f})")
        
        return best_match
    
    async def get_team_suggestions(self, partial_name: str, limit: int = 5) -> List[str]:
        """Get team name suggestions for a partial match"""
        suggestions = []
        
        for team_name in self.team_cache.keys():
            if partial_name.lower() in team_name.lower():
                suggestions.append(team_name)
                if len(suggestions) >= limit:
                    break
        
        return suggestions


# Utility functions for easier integration
async def initialize_sports_api() -> FreeSportsAPI:
    """Initialize and populate the sports API with current data"""
    api = FreeSportsAPI()
    async with api:
        # Pre-load upcoming matches for faster matching
        await api.get_upcoming_matches(days_ahead=14)  # 2 weeks ahead
    return api


async def match_scraped_event_to_api(scraped_home: str, scraped_away: str, 
                                   sports_api: FreeSportsAPI) -> Optional[Dict]:
    """Match scraped event data to API data"""
    return sports_api.find_best_match(scraped_home, scraped_away)


# Example usage and testing
if __name__ == "__main__":
    async def test_api():
        async with FreeSportsAPI() as api:
            matches = await api.get_upcoming_matches(days_ahead=3)
            
            print(f"Found {len(matches)} upcoming matches:")
            for match in matches[:5]:  # Show first 5
                print(f"  {match['home_team']} vs {match['away_team']} "
                      f"({match['competition']}) - {match['match_date']}")
            
            # Test team matching
            if matches:
                first_match = matches[0]
                test_match = api.find_best_match(
                    first_match['home_team'], 
                    first_match['away_team']
                )
                print(f"\nTest match result: {test_match}")
    
    asyncio.run(test_api())
