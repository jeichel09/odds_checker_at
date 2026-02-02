#!/usr/bin/env python3
"""
Austrian 2. Liga API Integration using Pinnacle Odds API
Author: Claude AI Assistant
Date: December 2024

This module provides comprehensive access to Austrian 2. Liga football data
including matches, odds, and betting markets via the Pinnacle Odds API.
"""

import requests
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone
from dataclasses import dataclass
import time

@dataclass
class Match:
    """Data structure for a football match"""
    event_id: int
    league_id: int
    league_name: str
    home_team: str
    away_team: str
    kickoff_time: str
    event_type: str
    live_status_id: int
    is_actual: bool
    has_odds: bool
    
    # Odds data
    home_win_odds: Optional[float] = None
    draw_odds: Optional[float] = None
    away_win_odds: Optional[float] = None
    over_2_5_odds: Optional[float] = None
    under_2_5_odds: Optional[float] = None

@dataclass
class OddsInfo:
    """Betting odds information"""
    money_line: Dict[str, float]
    spreads: Dict[str, Dict[str, float]]
    totals: Dict[str, Dict[str, float]]
    team_totals: Dict[str, Dict[str, float]]

class PinnacleAustrian2LigaAPI:
    """
    Austrian 2. Liga API client using Pinnacle Odds
    
    Provides access to:
    - Match fixtures and results
    - Live betting odds
    - Multiple betting markets (money line, spreads, totals)
    - First half and full match odds
    """
    
    def __init__(self, rapidapi_key: str):
        self.rapidapi_key = rapidapi_key
        self.base_url = "https://pinnacle-odds.p.rapidapi.com"
        self.league_id = 1773  # Austrian 2. Liga ID
        self.headers = {
            'x-rapidapi-host': 'pinnacle-odds.p.rapidapi.com',
            'x-rapidapi-key': rapidapi_key
        }
        
    def get_matches(self, event_type: str = "prematch", include_odds: bool = True) -> Dict[str, Any]:
        """
        Fetch Austrian 2. Liga matches
        
        Args:
            event_type: "prematch" or "live" (default: "prematch")
            include_odds: Include betting odds data (default: True)
            
        Returns:
            Dict containing full API response
        """
        endpoint = "/kit/v1/markets"
        
        params = {
            'league_ids': self.league_id,
            'event_type': event_type,
            'sport_id': 1,  # Soccer
            'is_have_odds': str(include_odds).lower()
        }
        
        try:
            response = requests.get(
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                params=params,
                timeout=15
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    "status": "error",
                    "status_code": response.status_code,
                    "message": f"API returned status {response.status_code}",
                    "response_text": response.text[:500]
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Request failed: {str(e)}"
            }
    
    def parse_matches(self, api_response: Dict) -> List[Match]:
        """
        Parse API response into Match objects
        
        Args:
            api_response: Raw API response dict
            
        Returns:
            List of Match objects
        """
        if "events" not in api_response:
            return []
            
        matches = []
        events = api_response["events"]
        
        for event in events:
            try:
                # Extract basic match info
                match = Match(
                    event_id=event.get("event_id"),
                    league_id=event.get("league_id"),
                    league_name=event.get("league_name"),
                    home_team=event.get("home"),
                    away_team=event.get("away"),
                    kickoff_time=event.get("starts"),
                    event_type=event.get("event_type"),
                    live_status_id=event.get("live_status_id"),
                    is_actual=event.get("is_actual"),
                    has_odds=event.get("is_have_odds")
                )
                
                # Extract odds if available
                periods = event.get("periods", {})
                if "num_0" in periods:  # Full match odds
                    full_match = periods["num_0"]
                    
                    # Money line odds (1X2)
                    money_line = full_match.get("money_line", {})
                    match.home_win_odds = money_line.get("home")
                    match.draw_odds = money_line.get("draw")
                    match.away_win_odds = money_line.get("away")
                    
                    # Over/Under 2.5 goals
                    totals = full_match.get("totals", {})
                    if "2.5" in totals:
                        match.over_2_5_odds = totals["2.5"].get("over")
                        match.under_2_5_odds = totals["2.5"].get("under")
                
                matches.append(match)
                
            except Exception as e:
                print(f"Error parsing event {event.get('event_id', 'unknown')}: {e}")
                continue
        
        return matches
    
    def get_upcoming_matches(self) -> List[Match]:
        """Get all upcoming Austrian 2. Liga matches"""
        response = self.get_matches(event_type="prematch")
        return self.parse_matches(response)
    
    def get_live_matches(self) -> List[Match]:
        """Get currently live Austrian 2. Liga matches"""
        response = self.get_matches(event_type="live")
        return self.parse_matches(response)
    
    def get_match_odds_detail(self, match: Match) -> Optional[OddsInfo]:
        """
        Get detailed odds information for a specific match
        
        Args:
            match: Match object to get odds for
            
        Returns:
            OddsInfo object with detailed odds data
        """
        response = self.get_matches()
        events = response.get("events", [])
        
        for event in events:
            if event.get("event_id") == match.event_id:
                periods = event.get("periods", {})
                if "num_0" in periods:
                    full_match = periods["num_0"]
                    
                    return OddsInfo(
                        money_line=full_match.get("money_line", {}),
                        spreads=full_match.get("spreads", {}),
                        totals=full_match.get("totals", {}),
                        team_totals=full_match.get("team_total", {})
                    )
        
        return None
    
    def get_teams(self) -> List[str]:
        """Get all teams currently in Austrian 2. Liga"""
        matches = self.get_upcoming_matches()
        teams = set()
        
        for match in matches:
            teams.add(match.home_team)
            teams.add(match.away_team)
            
        return sorted(list(teams))
    
    def find_matches_by_team(self, team_name: str) -> List[Match]:
        """
        Find all matches for a specific team
        
        Args:
            team_name: Name of the team to search for
            
        Returns:
            List of matches involving the team
        """
        matches = self.get_upcoming_matches()
        team_matches = []
        
        for match in matches:
            if (team_name.lower() in match.home_team.lower() or 
                team_name.lower() in match.away_team.lower()):
                team_matches.append(match)
                
        return team_matches
    
    def get_best_odds_comparison(self) -> List[Dict]:
        """
        Get odds comparison for all upcoming matches
        
        Returns:
            List of dicts with match and odds information
        """
        matches = self.get_upcoming_matches()
        comparison = []
        
        for match in matches:
            if match.has_odds and match.home_win_odds:
                comparison.append({
                    'match': f"{match.home_team} vs {match.away_team}",
                    'kickoff': match.kickoff_time,
                    'home_odds': match.home_win_odds,
                    'draw_odds': match.draw_odds,
                    'away_odds': match.away_win_odds,
                    'over_2_5': match.over_2_5_odds,
                    'under_2_5': match.under_2_5_odds,
                    'event_id': match.event_id
                })
        
        return comparison

def format_match_display(match: Match) -> str:
    """Format match for display"""
    kickoff = datetime.fromisoformat(match.kickoff_time.replace('Z', '+00:00'))
    kickoff_local = kickoff.strftime("%Y-%m-%d %H:%M")
    
    odds_str = ""
    if match.home_win_odds:
        odds_str = f" (1:{match.home_win_odds:.2f} X:{match.draw_odds:.2f} 2:{match.away_win_odds:.2f})"
    
    return f"{kickoff_local} | {match.home_team} vs {match.away_team}{odds_str}"

def main():
    """Demo usage of the Austrian 2. Liga API"""
    print("🇦🇹 AUSTRIAN 2. LIGA API DEMO")
    print("=" * 50)
    
    # Initialize API (replace with your key)
    api_key = "2922133b84mshaab3a1385f58f43p1b285djsn36032987880b"
    api = PinnacleAustrian2LigaAPI(api_key)
    
    # Get upcoming matches
    print("\n⚽ UPCOMING MATCHES:")
    matches = api.get_upcoming_matches()
    
    if not matches:
        print("No matches found")
        return
        
    print(f"Found {len(matches)} upcoming matches")
    
    for i, match in enumerate(matches[:10], 1):  # Show first 10
        print(f"{i:2d}. {format_match_display(match)}")
    
    # Show teams
    print(f"\n🏟️  TEAMS IN AUSTRIAN 2. LIGA:")
    teams = api.get_teams()
    for i, team in enumerate(teams, 1):
        print(f"{i:2d}. {team}")
    
    # Best odds comparison
    print(f"\n💰 ODDS COMPARISON:")
    odds_comparison = api.get_best_odds_comparison()
    
    for match_odds in odds_comparison[:5]:  # Show first 5
        print(f"{match_odds['match']}")
        print(f"   1X2: {match_odds['home_odds']:.2f} | {match_odds['draw_odds']:.2f} | {match_odds['away_odds']:.2f}")
        if match_odds['over_2_5']:
            print(f"   O/U 2.5: {match_odds['over_2_5']:.2f} | {match_odds['under_2_5']:.2f}")
        print()
    
    # API status
    print(f"\n✅ API STATUS:")
    print(f"League ID: {api.league_id}")
    print(f"League Name: {matches[0].league_name if matches else 'Unknown'}")
    print(f"Total matches available: {len(matches)}")
    print(f"Matches with odds: {len([m for m in matches if m.has_odds])}")

if __name__ == "__main__":
    main()