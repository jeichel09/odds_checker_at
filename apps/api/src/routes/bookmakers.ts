import { Router } from 'express';

const router = Router();

// Mock Austrian bookmakers data - Complete list of Austrian-licensed bookmakers
const mockBookmakers = [
  // Austrian State Operators
  {
    id: '1',
    name: 'win2day',
    displayName: 'win2day',
    logoUrl: null,
    websiteUrl: 'https://www.win2day.at',
    isActive: true,
    country: 'AT',
  },
  {
    id: '2',
    name: 'tipp3',
    displayName: 'tipp3',
    logoUrl: null,
    websiteUrl: 'https://www.tipp3.at',
    isActive: true,
    country: 'AT',
  },
  // International Operators with Austrian License
  {
    id: '3',
    name: 'bet365',
    displayName: 'bet365',
    logoUrl: null,
    websiteUrl: 'https://www.bet365.com',
    isActive: true,
    country: 'AT',
  },
  {
    id: '4',
    name: 'bwin',
    displayName: 'bwin',
    logoUrl: null,
    websiteUrl: 'https://www.bwin.com',
    isActive: true,
    country: 'AT',
  },
  {
    id: '5',
    name: 'interwetten',
    displayName: 'Interwetten',
    logoUrl: null,
    websiteUrl: 'https://www.interwetten.com',
    isActive: true,
    country: 'AT',
  },
  {
    id: '6',
    name: 'tipico',
    displayName: 'Tipico',
    logoUrl: null,
    websiteUrl: 'https://www.tipico.at',
    isActive: true,
    country: 'AT',
  },
  {
    id: '7',
    name: 'betway',
    displayName: 'Betway',
    logoUrl: null,
    websiteUrl: 'https://www.betway.com',
    isActive: true,
    country: 'AT',
  },
  // Austrian/European Specialists
  {
    id: '8',
    name: 'admiral',
    displayName: 'Admiral',
    logoUrl: null,
    websiteUrl: 'https://www.admiral.at',
    isActive: true,
    country: 'AT',
  },
  {
    id: '9',
    name: 'neo_bet',
    displayName: 'NEO.bet',
    logoUrl: null,
    websiteUrl: 'https://www.neo.bet',
    isActive: true,
    country: 'AT',
  },
  {
    id: '10',
    name: 'tipwin',
    displayName: 'Tipwin',
    logoUrl: null,
    websiteUrl: 'https://www.tipwin.com',
    isActive: true,
    country: 'AT',
  },
  {
    id: '11',
    name: 'mozzart',
    displayName: 'Mozzart',
    logoUrl: null,
    websiteUrl: 'https://www.mozzartbet.com',
    isActive: true,
    country: 'AT',
  },
  {
    id: '12',
    name: 'merkur_bets',
    displayName: 'Merkur Bets',
    logoUrl: null,
    websiteUrl: 'https://www.merkurbets.at',
    isActive: true,
    country: 'AT',
  },
  {
    id: '13',
    name: 'rabona',
    displayName: 'Rabona',
    logoUrl: null,
    websiteUrl: 'https://www.rabona.com',
    isActive: true,
    country: 'AT',
  },
  {
    id: '14',
    name: 'bet_at_home',
    displayName: 'bet-at-home',
    logoUrl: null,
    websiteUrl: 'https://www.bet-at-home.com',
    isActive: true,
    country: 'AT',
  },
  {
    id: '15',
    name: 'lottoland',
    displayName: 'Lottoland',
    logoUrl: null,
    websiteUrl: 'https://www.lottoland.at',
    isActive: true,
    country: 'AT',
  },
];

// GET /api/bookmakers - Get all active bookmakers
router.get('/', (req, res) => {
  try {
    const activeBookmakers = mockBookmakers.filter(b => b.isActive);

    res.json({
      success: true,
      data: activeBookmakers,
      meta: {
        total: activeBookmakers.length,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch bookmakers' }
    });
  }
});

// GET /api/bookmakers/:id - Get specific bookmaker
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const bookmaker = mockBookmakers.find(b => b.id === id);

    if (!bookmaker) {
      return res.status(404).json({
        success: false,
        error: { message: 'Bookmaker not found' }
      });
    }

    res.json({
      success: true,
      data: bookmaker
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch bookmaker' }
    });
  }
});

export { router as bookmakerRouter };