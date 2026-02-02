import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { normalizeMatches, LEAGUE_CONFIGS } from '@/lib/match-normalizer';

export async function GET() {
  console.log('English Premier League API route called');
  
  try {
    // Path to cache file
    const cacheFilePath = path.join(process.cwd(), 'english_premier_league_cache.json');
    console.log('Cache file path:', cacheFilePath);
    console.log('Cache file exists:', fs.existsSync(cacheFilePath));
    
    if (!fs.existsSync(cacheFilePath)) {
      console.log('Cache file not found, returning fallback data');
      return NextResponse.json({
        matches: [
          {
            id: "fallback",
            home: { name: "Team A", score: 0 },
            away: { name: "Team B", score: 0 },
            status: { utcTime: new Date().toISOString(), finished: false, started: false },
            displayStatus: "SCHEDULED"
          }
        ],
        message: "Cache file not found"
      });
    }
    
    // Read and parse cache file
    let cacheContent = fs.readFileSync(cacheFilePath, 'utf8');
    
    // Remove BOM if present
    if (cacheContent.charCodeAt(0) === 0xFEFF) {
      cacheContent = cacheContent.slice(1);
      console.log('Removed BOM from cache file');
    }
    
    console.log('Cache file content length:', cacheContent.length);
    
    const cacheData = JSON.parse(cacheContent);
    const allMatches = cacheData.response.matches;
    console.log('Total matches in cache:', allMatches.length);
    
    // Current time for filtering
    const now = new Date();
    console.log('Current time:', now.toISOString());
    
    // SIMPLE ROUND LOGIC for English Premier League
    // "Two hours after the kick-off of the last game of the current round has gone, change to next round"
    
    let currentRound = 7; // Starting round for Premier League
    const matchesPerRound = 10; // Premier League has 20 teams, so 10 matches per round
    
    // Helper function to get matches for a specific round
    function getMatchesForRound(roundNumber: number) {
      // Based on actual data analysis:
      // Round 7 spans indices 60-69 (10 matches)
      const startIndex = (roundNumber - 7) * matchesPerRound + 60;
      const endIndex = startIndex + matchesPerRound;
      return allMatches.slice(startIndex, endIndex);
    }
    
    // Find the correct current round using the simple rule
    while (currentRound <= 38) { // Premier League has 38 rounds
      const roundMatches = getMatchesForRound(currentRound);
      
      if (roundMatches.length === 0) break;
      
      // Find the LAST game (latest kickoff) in this round
      let lastGameTime = null;
      for (const match of roundMatches) {
        const matchTime = new Date(match.status.utcTime);
        if (!lastGameTime || matchTime > lastGameTime) {
          lastGameTime = matchTime;
        }
      }
      
      if (lastGameTime) {
        const timeSinceLastKickoff = (now.getTime() - lastGameTime.getTime()) / (1000 * 60); // minutes
        console.log(`Premier League Round ${currentRound}: Last game kicked off at ${lastGameTime.toISOString()}, ${timeSinceLastKickoff.toFixed(2)} minutes ago`);
        
        // If less than 120 minutes (2 hours) since last game kickoff, this is current round
        if (timeSinceLastKickoff < 120) {
          console.log(`  -> Current round is ${currentRound} (last game kicked off ${timeSinceLastKickoff.toFixed(2)} minutes ago, < 120 min)`);
          break;
        } else {
          console.log(`  -> Round ${currentRound} finished (last game kicked off ${timeSinceLastKickoff.toFixed(2)} minutes ago, >= 120 min)`);
          currentRound++;
        }
      } else {
        break;
      }
    }
    
    console.log(`Using round ${currentRound}`);
    let roundMatches = getMatchesForRound(currentRound);
    
    // Simple filtering: show relevant matches from current round
    const filteredMatches = [];
    
    for (const match of roundMatches) {
      const matchTime = new Date(match.status.utcTime);
      const timeDiff = (now.getTime() - matchTime.getTime()) / (1000 * 60); // minutes
      
      let displayStatus = 'SCHEDULED';
      let includeMatch = false;
      
      if (matchTime > now) {
        // Future match - always include
        displayStatus = 'SCHEDULED';
        includeMatch = true;
        console.log(`  Including future match: ${match.home.name} vs ${match.away.name} (in ${Math.abs(timeDiff).toFixed(0)} minutes)`);
      } else if (timeDiff > 0 && timeDiff <= 120) {
        // Match started within last 120 minutes - could be LIVE or recently FINISHED
        // Override cache status with time-based logic since cache can be stale
        if (timeDiff <= 105) { // Within 105 minutes = likely still live (90min + 15min extra time)
          displayStatus = 'LIVE';
          includeMatch = true;
          console.log(`  Including LIVE match: ${match.home.name} vs ${match.away.name} (started ${timeDiff.toFixed(0)} minutes ago - assuming live)`);
        } else {
          displayStatus = 'FINISHED';
          includeMatch = true;
          console.log(`  Including recent FINISHED match: ${match.home.name} vs ${match.away.name} (started ${timeDiff.toFixed(0)} minutes ago - assuming finished)`);
        }
      } else if (timeDiff > 120) {
        // Started more than 120 minutes ago - old finished match, skip
        console.log(`  Skipping old match: ${match.home.name} vs ${match.away.name} (started ${timeDiff.toFixed(0)} minutes ago - too old)`);
      } else {
        console.log(`  Skipping match with invalid timing: ${match.home.name} vs ${match.away.name} (timeDiff: ${timeDiff.toFixed(0)})`);
      }
      
      if (includeMatch) {
        filteredMatches.push({
          ...match,
          displayStatus // Keep the displayStatus for backwards compatibility
        });
      }
    }
    
    // Normalize the filtered matches
    const normalizedMatches = normalizeMatches(
      filteredMatches,
      'premier-league',
      LEAGUE_CONFIGS.PREMIER_LEAGUE,
      `Matchday ${currentRound}`
    );
    
    // Add mock best odds
    const bookmakers = ['win2day', 'tipp3', 'bet365', 'bwin', 'interwetten', 'tipico', 'betway', 'admiral', 'neo_bet', 'tipwin', 'mozzart', 'merkur_bets', 'rabona', 'bet_at_home', 'lottoland'];
    normalizedMatches.forEach(match => {
      if (!match.bestOdds) {
        match.bestOdds = {
          home: { odd: 1.85 + Math.random() * 1.5, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
          draw: { odd: 3.10 + Math.random() * 0.8, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] },
          away: { odd: 2.75 + Math.random() * 1.2, bookmaker: bookmakers[Math.floor(Math.random() * bookmakers.length)] }
        };
      }
    });
    
    console.log(`Returning ${normalizedMatches.length} normalized matches from round ${currentRound}`);
    
    return NextResponse.json({
      success: true,
      matches: normalizedMatches,
      meta: {
        total: normalizedMatches.length,
        league: 'Premier League',
        source: 'Real Data from Cache - Normalized Format',
        currentRound,
        liveMatches: normalizedMatches.filter(m => m.status === 'LIVE').length
      }
    });
    
  } catch (error) {
    console.error('Error in English Premier League API:', error);
    
    return NextResponse.json({
      matches: [
        {
          id: "error",
          home: { name: "Error", score: 0 },
          away: { name: "Loading failed", score: 0 },
          status: { utcTime: new Date().toISOString(), finished: false, started: false },
          displayStatus: "ERROR"
        }
      ],
      message: "Error loading matches",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}