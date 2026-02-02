#!/usr/bin/env python3
"""
SofaScore API script for Austrian 2. Liga using proper endpoints
From URL: https://www.sofascore.com/tournament/football/austria/2-liga/135#id:77531
Tournament ID: 135, Season ID: 77531
"""

import json
import requests
from datetime import datetime, timedelta

def main():
    print("🏆 Fetching Austrian 2. Liga data from SofaScore...")
    
    # SofaScore API base URL
    base_url = "https://api.sofascore.com/api/v1"
    
    # Headers based on browser requests to SofaScore
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.sofascore.com/',
        'Origin': 'https://www.sofascore.com',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
    
    # Austrian 2. Liga IDs from the URL
    tournament_id = 135  # From URL path
    season_id = 77531    # From URL hash #id:77531
    
    try:
        print(f"\n📅 Using Tournament ID: {tournament_id}, Season ID: {season_id}")
        
        # Try different endpoints to get matches
        endpoints_to_try = [
            f"/tournament/{tournament_id}/season/{season_id}/events/last/0",
            f"/tournament/{tournament_id}/season/{season_id}/events/next/0", 
            f"/tournament/{tournament_id}/season/{season_id}/standings",
            f"/tournament/{tournament_id}/season/{season_id}/matches",
            f"/unique-tournament/{tournament_id}/season/{season_id}/events/last/0",
            f"/unique-tournament/{tournament_id}/season/{season_id}/events/next/0"
        ]
        
        for endpoint in endpoints_to_try:
            print(f"\n🔍 Trying endpoint: {endpoint}")
            url = base_url + endpoint
            
            try:
                response = requests.get(url, headers=headers, timeout=10)
                print(f"Status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ SUCCESS! Got data from {endpoint}")
                    print(f"Keys in response: {list(data.keys()) if isinstance(data, dict) else type(data)}")
                    
                    # Save the successful response
                    filename = f"austrian_2liga_sofascore_{endpoint.replace('/', '_').replace(':', '')}.json"
                    with open(filename, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2, ensure_ascii=False)
                    
                    print(f"💾 Saved to {filename}")
                    
                    # Show sample of the data
                    if isinstance(data, dict):
                        for key, value in list(data.items())[:3]:
                            if isinstance(value, (list, dict)):
                                print(f"  {key}: {type(value)} with {len(value) if hasattr(value, '__len__') else 'unknown'} items")
                            else:
                                print(f"  {key}: {value}")
                    
                    # If this contains events or matches, try to process it
                    if 'events' in data:
                        process_events(data['events'], tournament_id, season_id)
                        break
                    elif isinstance(data, list) and len(data) > 0:
                        print(f"Got list with {len(data)} items")
                        if 'homeTeam' in str(data[0]) or 'awayTeam' in str(data[0]):
                            process_events(data, tournament_id, season_id)
                            break
                            
                elif response.status_code == 403:
                    print("❌ 403 Forbidden - API blocking direct access")
                elif response.status_code == 404:
                    print("❌ 404 Not Found - Endpoint doesn't exist")
                else:
                    print(f"❌ HTTP {response.status_code}: {response.text[:200]}...")
                    
            except requests.exceptions.RequestException as e:
                print(f"❌ Request error: {e}")
                continue
                
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

def process_events(events, tournament_id, season_id):
    """Process events/matches data and convert to our format"""
    print(f"\n🎯 Processing {len(events)} events...")
    
    weekend_matches = []
    
    for event in events:
        try:
            # Extract match information
            match_info = {
                "id": str(event.get('id', '')),
                "homeTeam": {
                    "name": event.get('homeTeam', {}).get('name', 'Unknown'),
                    "id": str(event.get('homeTeam', {}).get('id', '')),
                    "score": event.get('homeScore', {}).get('current', 0) if event.get('homeScore') else 0
                },
                "awayTeam": {
                    "name": event.get('awayTeam', {}).get('name', 'Unknown'), 
                    "id": str(event.get('awayTeam', {}).get('id', '')),
                    "score": event.get('awayScore', {}).get('current', 0) if event.get('awayScore') else 0
                },
                "utcTime": event.get('startTimestamp', 0),
                "status": {
                    "finished": event.get('status', {}).get('type') == 'finished',
                    "started": event.get('status', {}).get('type') in ['inprogress', 'finished'],
                    "cancelled": event.get('status', {}).get('type') == 'cancelled'
                }
            }
            
            # Convert timestamp to readable format
            if isinstance(match_info['utcTime'], (int, float)) and match_info['utcTime'] > 0:
                dt = datetime.fromtimestamp(match_info['utcTime'])
                match_info['utcTime'] = dt.strftime('%Y-%m-%dT%H:%M:%SZ')
                match_info['localTime'] = dt.strftime('%Y-%m-%dT%H:%M:%S')
            
            weekend_matches.append(match_info)
            
        except Exception as e:
            print(f"⚠️ Error processing event: {e}")
            continue
    
    if weekend_matches:
        # Create the final data structure
        final_data = {
            "timestamp": datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'),
            "source": "SofaScore API",
            "leagueId": tournament_id,
            "leagueName": "Austrian 2. Liga",
            "weekendMatches": weekend_matches[:10]  # Limit to 10 matches
        }
        
        # Save in our format
        with open('austrian_2liga_weekend_matches.json', 'w', encoding='utf-8') as f:
            json.dump(final_data, f, indent=2, ensure_ascii=False)
        
        print(f"🏆 Successfully created Austrian 2. Liga weekend matches file!")
        print(f"✅ Found {len(weekend_matches)} matches")
        
        # Show sample matches
        for i, match in enumerate(weekend_matches[:3]):
            print(f"  {i+1}. {match['homeTeam']['name']} vs {match['awayTeam']['name']}")
        
        return True
    else:
        print("❌ No valid matches found in the events")
        return False

if __name__ == "__main__":
    main()