import { Router } from 'express';

const router = Router();

// GET /api/odds/compare/:matchId - Get odds comparison for a specific match
router.get('/compare/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const { market = 'ONE_X_TWO' } = req.query;

    // Mock odds comparison data with all 15 Austrian bookmakers
    const mockOddsComparison = {
      matchId,
      market,
      bookmakers: [
        // Austrian State Operators
        {
          id: '1',
          name: 'win2day',
          displayName: 'win2day',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.0, draw: 3.5, away: 3.3 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.75, no: 2.0 } :
            { over: 1.95, under: 1.8 }
        },
        {
          id: '2',
          name: 'tipp3',
          displayName: 'tipp3',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.1, draw: 3.4, away: 3.2 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.7, no: 2.1 } :
            { over: 1.9, under: 1.85 }
        },
        // International with Austrian License
        {
          id: '3',
          name: 'bet365',
          displayName: 'bet365',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.15, draw: 3.3, away: 3.1 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.72, no: 2.05 } :
            { over: 1.92, under: 1.83 }
        },
        {
          id: '4',
          name: 'bwin',
          displayName: 'bwin',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.08, draw: 3.45, away: 3.15 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.73, no: 2.03 } :
            { over: 1.91, under: 1.84 }
        },
        {
          id: '5',
          name: 'interwetten',
          displayName: 'Interwetten',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.05, draw: 3.6, away: 3.25 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.8, no: 1.95 } :
            { over: 1.88, under: 1.87 }
        },
        {
          id: '6',
          name: 'tipico',
          displayName: 'Tipico',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.12, draw: 3.35, away: 3.05 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.74, no: 2.02 } :
            { over: 1.89, under: 1.86 }
        },
        {
          id: '7',
          name: 'betway',
          displayName: 'Betway',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.18, draw: 3.25, away: 3.08 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.71, no: 2.07 } :
            { over: 1.94, under: 1.81 }
        },
        // Austrian/European Specialists
        {
          id: '8',
          name: 'admiral',
          displayName: 'Admiral',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.02, draw: 3.55, away: 3.35 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.78, no: 1.97 } :
            { over: 1.87, under: 1.88 }
        },
        {
          id: '9',
          name: 'neo_bet',
          displayName: 'NEO.bet',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.09, draw: 3.42, away: 3.18 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.76, no: 1.99 } :
            { over: 1.93, under: 1.82 }
        },
        {
          id: '10',
          name: 'tipwin',
          displayName: 'Tipwin',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.07, draw: 3.48, away: 3.22 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.77, no: 1.98 } :
            { over: 1.90, under: 1.85 }
        },
        {
          id: '11',
          name: 'mozzart',
          displayName: 'Mozzart',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.14, draw: 3.38, away: 3.12 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.75, no: 2.01 } :
            { over: 1.96, under: 1.79 }
        },
        {
          id: '12',
          name: 'merkur_bets',
          displayName: 'Merkur Bets',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.06, draw: 3.52, away: 3.28 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.79, no: 1.96 } :
            { over: 1.85, under: 1.90 }
        },
        {
          id: '13',
          name: 'rabona',
          displayName: 'Rabona',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.11, draw: 3.41, away: 3.19 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.73, no: 2.04 } :
            { over: 1.92, under: 1.83 }
        },
        {
          id: '14',
          name: 'bet_at_home',
          displayName: 'bet-at-home',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.13, draw: 3.36, away: 3.14 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.74, no: 2.02 } :
            { over: 1.91, under: 1.84 }
        },
        {
          id: '15',
          name: 'lottoland',
          displayName: 'Lottoland',
          odds: market === 'ONE_X_TWO' ? 
            { home: 2.04, draw: 3.58, away: 3.31 } :
            market === 'BOTH_TEAMS_SCORE' ?
            { yes: 1.81, no: 1.94 } :
            { over: 1.88, under: 1.87 }
        },
      ],
      bestOdds: market === 'ONE_X_TWO' ? 
        { home: { value: 2.18, bookmaker: 'betway' }, 
          draw: { value: 3.6, bookmaker: 'interwetten' }, 
          away: { value: 3.35, bookmaker: 'admiral' } } :
        market === 'BOTH_TEAMS_SCORE' ?
        { yes: { value: 1.81, bookmaker: 'lottoland' }, 
          no: { value: 2.1, bookmaker: 'tipp3' } } :
        { over: { value: 1.96, bookmaker: 'mozzart' }, 
          under: { value: 1.90, bookmaker: 'merkur_bets' } }
    };

    res.json({
      success: true,
      data: mockOddsComparison
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch odds comparison' }
    });
  }
});

// GET /api/odds/best - Get best odds across all matches
router.get('/best', (req, res) => {
  try {
    const { market = 'ONE_X_TWO', limit = 10 } = req.query;

    const mockBestOdds = [
      {
        matchId: '1',
        homeTeam: 'RB Salzburg',
        awayTeam: 'Rapid Wien',
        market,
        bestOdds: { 
          home: { value: 2.15, bookmaker: 'bet365' },
          draw: { value: 3.6, bookmaker: 'interwetten' },
          away: { value: 3.3, bookmaker: 'win2day' }
        }
      },
      // More matches...
    ];

    res.json({
      success: true,
      data: mockBestOdds.slice(0, Number(limit))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch best odds' }
    });
  }
});

export { router as oddsRouter };