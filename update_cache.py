#!/usr/bin/env python3
"""
Automated cache updater for Austrian 2. Liga
This can be run periodically (e.g., every 10-15 minutes) to keep data fresh
"""
import subprocess
import sys
import time
from datetime import datetime

def run_cache_update():
    """Run the cache update script"""
    try:
        print(f"[{datetime.now()}] Starting cache update...")
        result = subprocess.run([sys.executable, 'fetch_austrian_2liga_cache.py'], 
                              capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            print(f"[{datetime.now()}] Cache update successful!")
            print(result.stdout)
        else:
            print(f"[{datetime.now()}] Cache update failed!")
            print(f"Error: {result.stderr}")
            
    except subprocess.TimeoutExpired:
        print(f"[{datetime.now()}] Cache update timed out!")
    except Exception as e:
        print(f"[{datetime.now()}] Cache update error: {e}")

if __name__ == '__main__':
    # For testing, run once
    if len(sys.argv) > 1 and sys.argv[1] == '--continuous':
        # Continuous mode - run every 10 minutes
        print("Starting continuous cache updater (every 10 minutes)")
        print("Press Ctrl+C to stop")
        
        try:
            while True:
                run_cache_update()
                print(f"[{datetime.now()}] Waiting 10 minutes before next update...")
                time.sleep(600)  # 10 minutes
        except KeyboardInterrupt:
            print(f"\n[{datetime.now()}] Cache updater stopped by user")
    else:
        # Single run
        run_cache_update()