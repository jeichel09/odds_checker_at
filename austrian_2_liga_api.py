import requests
import json
from typing import Dict, List, Optional
from datetime import datetime

class Austrian2LigaAPI:
    """
    Austrian 2. Liga football data integration using RapidAPI
    Based on successful German Bundesliga implementation
    """
    
    def __init__(self, rapidapi_key: str):
        self.rapidapi_key = rapidapi_key
        self.base_url = "https://sofascore8.p.rapidapi.com"
        self.league_id = 119  # Austrian 2. Liga ID
        self.headers = {
            "X-RapidAPI-Key": rapidapi_key,
            "X-RapidAPI-Host": "sofascore8.p.rapidapi.com"
        }
    
    def get_matches(self, season_id: Optional[int] = None) -> Dict:
        """
        Fetch Austrian 2. Liga matches
        
        Args:
            season_id: Optional season ID, if None uses current season
            
        Returns:
            Dict containing match data in same format as German Bundesliga
        """
        # Endpoint pattern based on working German Bundesliga
        endpoint = f"/api/v1/sport/football/league/{self.league_id}/matches"
        
        params = {}
        if season_id:
            params['season_id'] = season_id
            
        try:
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 403:
                return {
                    "status": "error",
                    "message": "Access denied - Austrian 2. Liga may not be available",
                    "suggested_alternatives": [
                        "German Bundesliga (ID: 54)",
                        "Swiss Super League (ID: 69)", 
                        "Czech First League (ID: 2)"
                    ]
                }
            else:
                return {
                    "status": "error",
                    "message": f"API returned status {response.status_code}",
                    "response": response.text[:500]
                }
                
        except Exception as e:
            return {
                "status": "error", 
                "message": f"Request failed: {str(e)}"
            }
    
    def parse_matches(self, api_response: Dict) -> List[Dict]:
        """
        Parse API response into standardized match format
        Based on German Bundesliga structure analysis
        """
        if api_response.get("status") != "success":
            return []
            
        matches = api_response.get("response", {}).get("matches", [])
        parsed_matches = []
        
        for match in matches:
            try:
                parsed_match = {
                    "id": match.get("id"),
                    "home_team": match.get("home", {}).get("name"),
                    "away_team": match.get("away", {}).get("name"),
                    "home_score": match.get("home", {}).get("score"),
                    "away_score": match.get("away", {}).get("score"),
                    "kickoff_time": match.get("status", {}).get("utcTime"),
                    "status": match.get("status", {}).get("reason", {}).get("short"),
                    "finished": match.get("status", {}).get("finished", False),
                    "started": match.get("status", {}).get("started", False),
                    "cancelled": match.get("status", {}).get("cancelled", False),
                    "page_url": match.get("pageUrl"),
                    "score_string": match.get("status", {}).get("scoreStr")
                }
                parsed_matches.append(parsed_match)
            except Exception as e:
                print(f"Error parsing match {match.get('id', 'unknown')}: {e}")
                continue
                
        return parsed_matches
    
    def get_upcoming_matches(self) -> List[Dict]:
        """Get only upcoming/scheduled matches"""
        response = self.get_matches()
        matches = self.parse_matches(response)
        return [m for m in matches if not m["started"]]
    
    def get_finished_matches(self) -> List[Dict]:
        """Get only finished matches with results"""
        response = self.get_matches()
        matches = self.parse_matches(response)
        return [m for m in matches if m["finished"]]

# Usage example:
if __name__ == "__main__":
    # Initialize API client
    api_key = "YOUR_RAPIDAPI_KEY_HERE"
    austrian_api = Austrian2LigaAPI(api_key)
    
    # Test the API
    print("Testing Austrian 2. Liga API...")
    response = austrian_api.get_matches()
    
    if response.get("status") == "success":
        matches = austrian_api.parse_matches(response)
        print(f"Successfully retrieved {len(matches)} matches")
        
        # Show sample matches
        for match in matches[:3]:
            score = f"{match['home_score']}-{match['away_score']}" if match['home_score'] is not None else "vs"
            print(f"  {match['home_team']} {score} {match['away_team']} ({match['status']})")
    else:
        print("Austrian 2. Liga API failed:")
        print(f"  Status: {response.get('status')}")
        print(f"  Message: {response.get('message')}")
        if 'suggested_alternatives' in response:
            print("  Try these alternatives:")
            for alt in response['suggested_alternatives']:
                print(f"    - {alt}")