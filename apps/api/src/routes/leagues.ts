import { Router } from 'express';

const router = Router();

// Mock leagues data
const mockLeagues = [
  {
    id: '1',
    name: 'Austrian Bundesliga',
    country: 'Austria',
    logoUrl: null,
    isActive: true,
  },
  {
    id: '2', 
    name: '2. Liga',
    country: 'Austria',
    logoUrl: null,
    isActive: true,
  },
  {
    id: '3',
    name: 'Premier League',
    country: 'England',
    logoUrl: null,
    isActive: true,
  },
  {
    id: '4',
    name: 'Bundesliga',
    country: 'Germany',
    logoUrl: null,
    isActive: true,
  },
  {
    id: '5',
    name: 'Serie A',
    country: 'Italy',
    logoUrl: null,
    isActive: true,
  },
  {
    id: '6',
    name: 'La Liga',
    country: 'Spain',
    logoUrl: null,
    isActive: true,
  },
];

// GET /api/leagues - Get all active leagues
router.get('/', (req, res) => {
  try {
    const activeLeagues = mockLeagues.filter(l => l.isActive);

    res.json({
      success: true,
      data: activeLeagues,
      meta: {
        total: activeLeagues.length,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch leagues' }
    });
  }
});

// GET /api/leagues/:id - Get specific league
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const league = mockLeagues.find(l => l.id === id);

    if (!league) {
      return res.status(404).json({
        success: false,
        error: { message: 'League not found' }
      });
    }

    res.json({
      success: true,
      data: league
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch league' }
    });
  }
});

export { router as leaguesRouter };