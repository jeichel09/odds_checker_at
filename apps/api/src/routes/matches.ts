import { Router } from 'express';
import { addDays, format } from 'date-fns';

const router = Router();

// Import Football API Service
const footballApi = require('../services/footballApi');

// Load environment variables
require('dotenv').config();

// Helper functions for league information
function getLeagueName(leagueCode: string): string {
  const leagueNames: { [key: string]: string } = {
    'BL1': 'Deutsche Bundesliga',
    'BL2': 'Deutsche 2. Bundesliga',
    'ÖBL1': 'Österreichische Bundesliga',
    'PL': 'Premier League',
    'PD': 'La Liga',
    'SA': 'Serie A',
    'FL1': 'Ligue 1'
  };
  return leagueNames[leagueCode] || leagueCode;
}

function getLeagueCountry(leagueCode: string): string {
  const leagueCountries: { [key: string]: string } = {
    'BL1': 'Germany',
    'BL2': 'Germany', 
    'ÖBL1': 'Austria',
    'PL': 'England',
    'PD': 'Spain',
    'SA': 'Italy',
    'FL1': 'France'
  };
  return leagueCountries[leagueCode] || 'Unknown';
}

// Mock data for Austrian football matches (only upcoming games)
const mockMatches = [
  {
    id: '1',
    homeTeam: { id: '1', name: 'RB Salzburg', shortName: 'Salzburg', logoUrl: null },
    awayTeam: { id: '2', name: 'Rapid Wien', shortName: 'Rapid', logoUrl: null },
    league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
    kickoffTime: addDays(new Date(), 1).toISOString(),
    status: 'UPCOMING',
    homeScore: null,
    awayScore: null,
    round: '9. Spieltag',
    season: '2024/25',
  },
  {
    id: '2',
    homeTeam: { id: '3', name: 'Austria Wien', shortName: 'Austria', logoUrl: null },
    awayTeam: { id: '4', name: 'Sturm Graz', shortName: 'Sturm', logoUrl: null },
    league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
    kickoffTime: addDays(new Date(), 2).toISOString(),
    status: 'UPCOMING',
    homeScore: null,
    awayScore: null,
    round: '9. Spieltag',
    season: '2024/25',
  },
  {
    id: '3',
    homeTeam: { id: '5', name: 'LASK', shortName: 'LASK', logoUrl: null },
    awayTeam: { id: '6', name: 'Wolfsberg', shortName: 'Wolfsberg', logoUrl: null },
    league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
    kickoffTime: addDays(new Date(), 3).toISOString(),
    status: 'UPCOMING',
    homeScore: null,
    awayScore: null,
    round: '9. Spieltag',
    season: '2024/25',
  },
  {
    id: '4',
    homeTeam: { id: '7', name: 'TSV Hartberg', shortName: 'Hartberg', logoUrl: null },
    awayTeam: { id: '8', name: 'WSG Tirol', shortName: 'Tirol', logoUrl: null },
    league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
    kickoffTime: addDays(new Date(), 4).toISOString(),
    status: 'UPCOMING',
    homeScore: null,
    awayScore: null,
    round: '9. Spieltag',
    season: '2024/25',
  },
  {
    id: '5',
    homeTeam: { id: '9', name: 'Austria Klagenfurt', shortName: 'Klagenfurt', logoUrl: null },
    awayTeam: { id: '10', name: 'SCR Altach', shortName: 'Altach', logoUrl: null },
    league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
    kickoffTime: addDays(new Date(), 5).toISOString(),
    status: 'UPCOMING',
    homeScore: null,
    awayScore: null,
    round: '9. Spieltag',
    season: '2024/25',
  },
  {
    id: '6',
    homeTeam: { id: '11', name: 'Grazer AK', shortName: 'GAK', logoUrl: null },
    awayTeam: { id: '12', name: 'BW Linz', shortName: 'BWL', logoUrl: null },
    league: { id: 'ÖBL1', name: 'Österreichische Bundesliga', country: 'Austria' },
    kickoffTime: addDays(new Date(), 6).toISOString(),
    status: 'UPCOMING',
    homeScore: null,
    awayScore: null,
    round: '9. Spieltag',
    season: '2024/25',
  },
];

// GET /api/matches - Get all matches with optional filters
router.get('/', async (req, res) => {
  try {
    const { league, date, status } = req.query;
    
    // Get real fixtures from APIs
    let fixtures = [];
    
    if (league) {
      // Get specific league - map frontend league codes to API codes
      let apiLeagueCode = league as string;
      if (league === 'ÖBL1') {
        apiLeagueCode = 'öbl1'; // Map uppercase to lowercase for OpenLiga API
      }
      fixtures = await footballApi.getLeagueFixtures(apiLeagueCode);
    } else if (date === 'today') {
      // Get today's fixtures
      fixtures = await footballApi.getTodayFixtures();
    } else {
      // Get filtered fixtures for homepage: today's games or next upcoming from major leagues
      const todayFixtures = await footballApi.getTodayFixtures();
      
      if (todayFixtures.length > 0) {
        // Filter out finished games and show only upcoming/live games today
        const upcomingTodayFixtures = todayFixtures.filter(fixture => !fixture.isFinished);
        
        if (upcomingTodayFixtures.length > 0) {
          // If there are upcoming games today, show them (prioritize Austrian leagues)
          fixtures = upcomingTodayFixtures.sort((a, b) => {
            const austrianLeagues = ['ÖBL1'];
            const majorLeagues = ['BL1', 'PL', 'PD', 'SA', 'FL1'];
            
            if (austrianLeagues.includes(a.league) && !austrianLeagues.includes(b.league)) return -1;
            if (!austrianLeagues.includes(a.league) && austrianLeagues.includes(b.league)) return 1;
            if (majorLeagues.includes(a.league) && !majorLeagues.includes(b.league)) return -1;
            if (!majorLeagues.includes(a.league) && majorLeagues.includes(b.league)) return 1;
            return 0;
          }).slice(0, 8);
        } else {
          // No upcoming games today, fall through to get next upcoming games
          fixtures = [];
        }
      }
      
      // If no upcoming games found (either no games today or no upcoming today), get next upcoming games from major leagues
      if (fixtures.length === 0) {
        const allFixtures = await footballApi.getUpcomingFixtures();
        const majorLeagueFixtures = allFixtures.filter(fixture => 
          ['ÖBL1', 'BL1', 'PL', 'PD', 'SA'].includes(fixture.league) && !fixture.isFinished
        );
        
        // Group by league and take next game from each major league
        const leagueGroups: { [key: string]: any[] } = {};
        majorLeagueFixtures.forEach(fixture => {
          if (!leagueGroups[fixture.league]) {
            leagueGroups[fixture.league] = [];
          }
          leagueGroups[fixture.league].push(fixture);
        });
        
        // Take the next 1-2 games from each league, prioritizing Austrian leagues
        const selectedFixtures = [];
        const priorityOrder = ['ÖBL1', 'BL1', 'PL', 'PD', 'SA'];
        
        for (const league of priorityOrder) {
          if (leagueGroups[league]) {
            selectedFixtures.push(...leagueGroups[league].slice(0, 2));
          }
          if (selectedFixtures.length >= 8) break;
        }
        
        fixtures = selectedFixtures.slice(0, 8);
      }
    }

    // Helper function to determine real-time game status based on current time
    const determineGameStatus = (kickoffTime: string, currentStatus: string) => {
      const now = new Date();
      const kickoff = new Date(kickoffTime);
      const timeDiffMinutes = (now.getTime() - kickoff.getTime()) / (1000 * 60);
      
      // If game hasn't started yet (kickoff is in future)
      if (timeDiffMinutes < 0) {
        return 'UPCOMING';
      }
      
      // If game started within last 110 minutes (90 min + 20 min extra time/halftime)
      // and status is not explicitly finished
      if (timeDiffMinutes >= 0 && timeDiffMinutes <= 110 && currentStatus !== 'FINISHED') {
        return 'LIVE';
      }
      
      // Otherwise game is finished
      return 'FINISHED';
    };
    
    // Helper function to generate best odds for a match
    const generateBestOdds = (matchId: string) => {
      // Mock odds data - in real implementation, this would query odds from database
      const bookmakers = ['win2day', 'tipp3', 'bet365', 'bwin', 'interwetten', 'tipico', 'betway', 'admiral'];
      const homeOdds = bookmakers.map(bm => ({ bookmaker: bm, odd: +(1.8 + Math.random() * 0.8).toFixed(2) }));
      const drawOdds = bookmakers.map(bm => ({ bookmaker: bm, odd: +(3.0 + Math.random() * 1.0).toFixed(2) }));
      const awayOdds = bookmakers.map(bm => ({ bookmaker: bm, odd: +(2.0 + Math.random() * 1.5).toFixed(2) }));
      
      return {
        home: homeOdds.reduce((best, current) => current.odd > best.odd ? current : best),
        draw: drawOdds.reduce((best, current) => current.odd > best.odd ? current : best),
        away: awayOdds.reduce((best, current) => current.odd > best.odd ? current : best)
      };
    };

    // Convert API format to frontend expected format with real-time status checking
    const formattedMatches = fixtures
      .map(fixture => {
        const realTimeStatus = determineGameStatus(fixture.dateTime, fixture.isFinished ? 'FINISHED' : 'UPCOMING');
        return {
          id: fixture.id,
          homeTeam: {
            id: fixture.homeTeam.id,
            name: fixture.homeTeam.name,
            shortName: fixture.homeTeam.shortName || fixture.homeTeam.name,
            logoUrl: fixture.homeTeam.logo
          },
          awayTeam: {
            id: fixture.awayTeam.id,
            name: fixture.awayTeam.name,
            shortName: fixture.awayTeam.shortName || fixture.awayTeam.name,
            logoUrl: fixture.awayTeam.logo
          },
          league: {
            id: fixture.league === 'öbl1' ? 'ÖBL1' : fixture.league,
            name: getLeagueName(fixture.league === 'öbl1' ? 'ÖBL1' : fixture.league),
            country: getLeagueCountry(fixture.league === 'öbl1' ? 'ÖBL1' : fixture.league)
          },
          kickoffTime: fixture.dateTime,
          status: realTimeStatus,
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
          round: fixture.round && fixture.round !== 'Regular Season' ? fixture.round : '9. Spieltag',
          season: '2024/25',
          bestOdds: generateBestOdds(fixture.id)
        };
      })
      .filter(match => match.status !== 'FINISHED'); // Only show upcoming/live games

    // Apply additional filters
    let filteredMatches = formattedMatches;
    
    if (date && date !== 'today') {
      const targetDate = format(new Date(date as string), 'yyyy-MM-dd');
      filteredMatches = filteredMatches.filter(match => 
        format(new Date(match.kickoffTime), 'yyyy-MM-dd') === targetDate
      );
    }

    if (status) {
      filteredMatches = filteredMatches.filter(match => 
        match.status === status
      );
    }

    // TEMPORARY: If no matches found, use mock data
    if (filteredMatches.length === 0) {
      const mockDataWithOdds = mockMatches.slice(0, 6)
        .map(match => {
          const realTimeStatus = determineGameStatus(match.kickoffTime, match.status);
          return {
            ...match,
            status: realTimeStatus,
            bestOdds: generateBestOdds(match.id)
          };
        })
        .filter(match => match.status !== 'FINISHED'); // Only show upcoming/live games
      
      return res.json({
        success: true,
        data: mockDataWithOdds,
        meta: {
          total: mockMatches.length,
          page: 1,
          limit: 6,
          source: 'Mock Data (Temporary - Real API returned no matches)'
        }
      });
    }

    res.json({
      success: true,
      data: filteredMatches,
      meta: {
        total: filteredMatches.length,
        page: 1,
        limit: filteredMatches.length,
        source: 'Live API Data'
      }
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    
    // Helper function to generate best odds for a match (duplicate for error scope)
    const generateBestOdds = (matchId: string) => {
      const bookmakers = ['win2day', 'tipp3', 'bet365', 'bwin', 'interwetten', 'tipico', 'betway', 'admiral'];
      const homeOdds = bookmakers.map(bm => ({ bookmaker: bm, odd: +(1.8 + Math.random() * 0.8).toFixed(2) }));
      const drawOdds = bookmakers.map(bm => ({ bookmaker: bm, odd: +(3.0 + Math.random() * 1.0).toFixed(2) }));
      const awayOdds = bookmakers.map(bm => ({ bookmaker: bm, odd: +(2.0 + Math.random() * 1.5).toFixed(2) }));
      
      return {
        home: homeOdds.reduce((best, current) => current.odd > best.odd ? current : best),
        draw: drawOdds.reduce((best, current) => current.odd > best.odd ? current : best),
        away: awayOdds.reduce((best, current) => current.odd > best.odd ? current : best)
      };
    };
    
    // Fallback to mock data if API fails
    const fallbackDataWithOdds = mockMatches.slice(0, 6)
      .map(match => {
        const realTimeStatus = determineGameStatus(match.kickoffTime, match.status);
        return {
          ...match,
          league: {
            ...match.league,
            id: match.league.id === 'ÖBL1' ? 'ÖBL1' : match.league.id
          },
          status: realTimeStatus,
          bestOdds: generateBestOdds(match.id)
        };
      })
      .filter(match => match.status !== 'FINISHED'); // Only show upcoming/live games
    
    res.json({
      success: true,
      data: fallbackDataWithOdds,
      meta: {
        total: mockMatches.length,
        page: 1,
        limit: 6,
        source: 'Fallback Data',
        error: 'API temporarily unavailable'
      }
    });
  }
});

// GET /api/matches/:id - Get specific match with detailed odds
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const match = mockMatches.find(m => m.id === id);

    if (!match) {
      return res.status(404).json({
        success: false,
        error: { message: 'Match not found' }
      });
    }

    // Add odds data to the match with all 15 Austrian bookmakers
    const matchWithOdds = {
      ...match,
      odds: {
        oneXTwo: [
          { bookmaker: 'win2day', home: 2.0, draw: 3.5, away: 3.3 },
          { bookmaker: 'tipp3', home: 2.1, draw: 3.4, away: 3.2 },
          { bookmaker: 'bet365', home: 2.15, draw: 3.3, away: 3.1 },
          { bookmaker: 'bwin', home: 2.08, draw: 3.45, away: 3.15 },
          { bookmaker: 'interwetten', home: 2.05, draw: 3.6, away: 3.25 },
          { bookmaker: 'tipico', home: 2.12, draw: 3.35, away: 3.05 },
          { bookmaker: 'betway', home: 2.18, draw: 3.25, away: 3.08 },
          { bookmaker: 'admiral', home: 2.02, draw: 3.55, away: 3.35 },
          { bookmaker: 'neo_bet', home: 2.09, draw: 3.42, away: 3.18 },
          { bookmaker: 'tipwin', home: 2.07, draw: 3.48, away: 3.22 },
          { bookmaker: 'mozzart', home: 2.14, draw: 3.38, away: 3.12 },
          { bookmaker: 'merkur_bets', home: 2.06, draw: 3.52, away: 3.28 },
          { bookmaker: 'rabona', home: 2.11, draw: 3.41, away: 3.19 },
          { bookmaker: 'bet_at_home', home: 2.13, draw: 3.36, away: 3.14 },
          { bookmaker: 'lottoland', home: 2.04, draw: 3.58, away: 3.31 },
        ],
        bothTeamsScore: [
          { bookmaker: 'win2day', yes: 1.75, no: 2.0 },
          { bookmaker: 'tipp3', yes: 1.7, no: 2.1 },
          { bookmaker: 'bet365', yes: 1.72, no: 2.05 },
          { bookmaker: 'bwin', yes: 1.73, no: 2.03 },
          { bookmaker: 'interwetten', yes: 1.8, no: 1.95 },
          { bookmaker: 'tipico', yes: 1.74, no: 2.02 },
          { bookmaker: 'betway', yes: 1.71, no: 2.07 },
          { bookmaker: 'admiral', yes: 1.78, no: 1.97 },
          { bookmaker: 'neo_bet', yes: 1.76, no: 1.99 },
          { bookmaker: 'tipwin', yes: 1.77, no: 1.98 },
          { bookmaker: 'mozzart', yes: 1.75, no: 2.01 },
          { bookmaker: 'merkur_bets', yes: 1.79, no: 1.96 },
          { bookmaker: 'rabona', yes: 1.73, no: 2.04 },
          { bookmaker: 'bet_at_home', yes: 1.74, no: 2.02 },
          { bookmaker: 'lottoland', yes: 1.81, no: 1.94 },
        ],
        overUnder25: [
          { bookmaker: 'win2day', over: 1.95, under: 1.8 },
          { bookmaker: 'tipp3', over: 1.9, under: 1.85 },
          { bookmaker: 'bet365', over: 1.92, under: 1.83 },
          { bookmaker: 'bwin', over: 1.91, under: 1.84 },
          { bookmaker: 'interwetten', over: 1.88, under: 1.87 },
          { bookmaker: 'tipico', over: 1.89, under: 1.86 },
          { bookmaker: 'betway', over: 1.94, under: 1.81 },
          { bookmaker: 'admiral', over: 1.87, under: 1.88 },
          { bookmaker: 'neo_bet', over: 1.93, under: 1.82 },
          { bookmaker: 'tipwin', over: 1.90, under: 1.85 },
          { bookmaker: 'mozzart', over: 1.96, under: 1.79 },
          { bookmaker: 'merkur_bets', over: 1.85, under: 1.90 },
          { bookmaker: 'rabona', over: 1.92, under: 1.83 },
          { bookmaker: 'bet_at_home', over: 1.91, under: 1.84 },
          { bookmaker: 'lottoland', over: 1.88, under: 1.87 },
        ]
      }
    };

    res.json({
      success: true,
      data: matchWithOdds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch match' }
    });
  }
});

export { router as matchesRouter };