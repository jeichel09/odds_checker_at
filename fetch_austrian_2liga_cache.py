#!/usr/bin/env python3
"""
Fetch Austrian 2. Liga data from Pinnacle API and cache it
"""
import requests
import json
from datetime import datetime

def fetch_austrian_2liga_data():
    api_key = '2922133b84mshaab3a1385f58f43p1b285djsn36032987880b'
    headers = {
        'x-rapidapi-host': 'pinnacle-odds.p.rapidapi.com',
        'x-rapidapi-key': api_key
    }
    
    all_matches = []
    
    # Get live matches
    print('Fetching live matches...')
    try:
        response = requests.get('https://pinnacle-odds.p.rapidapi.com/kit/v1/markets', 
                               headers=headers, 
                               params={'league_ids': 1773, 'event_type': 'live', 'sport_id': 1}, 
                               timeout=15)
        if response.status_code == 200:
            live_data = response.json()
            live_events = live_data.get('events', [])
            print(f'Live matches found: {len(live_events)}')
            all_matches.extend(live_events)
        else:
            print(f'Live matches request failed: {response.status_code}')
    except Exception as e:
        print(f'Error fetching live matches: {e}')
    
    # Get upcoming matches  
    print('Fetching upcoming matches...')
    try:
        response = requests.get('https://pinnacle-odds.p.rapidapi.com/kit/v1/markets',
                               headers=headers,
                               params={'league_ids': 1773, 'event_type': 'prematch', 'sport_id': 1},
                               timeout=15)
        if response.status_code == 200:
            upcoming_data = response.json()
            upcoming_events = upcoming_data.get('events', [])
            print(f'Upcoming matches found: {len(upcoming_events)}')
            all_matches.extend(upcoming_events)
        else:
            print(f'Upcoming matches request failed: {response.status_code}')
    except Exception as e:
        print(f'Error fetching upcoming matches: {e}')
    
    # Create cache data structure
    cache_data = {
        'timestamp': datetime.now().isoformat(),
        'source': 'Pinnacle API',
        'league_id': 1773,
        'league_name': 'Austria - 2. Liga',
        'total_matches': len(all_matches),
        'matches': all_matches
    }
    
    # Save to cache file
    cache_filename = 'austrian_2liga_cache.json'
    try:
        with open(cache_filename, 'w', encoding='utf-8') as f:
            json.dump(cache_data, f, indent=2, ensure_ascii=False)
        print(f'Cache saved to {cache_filename} with {len(all_matches)} total matches')
    except Exception as e:
        print(f'Error saving cache: {e}')
        return
    
    # Show sample matches
    print('\nSample matches:')
    for i, match in enumerate(all_matches[:8]):
        home = match.get('home', 'Unknown')
        away = match.get('away', 'Unknown')
        starts = match.get('starts', '')
        event_type = match.get('event_type', '')
        status_id = match.get('live_status_id', 0)
        
        # Determine status
        if event_type == 'live':
            status = 'LIVE'
        elif status_id == 1:
            status = 'LIVE' 
        else:
            status = 'SCHEDULED'
            
        print(f'{i+1}. {home} vs {away} ({status}, starts: {starts})')

if __name__ == '__main__':
    fetch_austrian_2liga_data()