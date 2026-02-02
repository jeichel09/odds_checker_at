# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Austrian Odds Checker is a hybrid Python/TypeScript monorepo that compares football betting odds from Austrian-licensed bookmakers. The system uses web scraping (Python) for data collection and a modern web stack (Next.js/Express) for the user interface and API.

## Architecture

### Dual Language Stack
- **Python Backend** (`src/`): Web scraping infrastructure using Playwright, SQLAlchemy database models, and FastAPI services
- **TypeScript Frontend/API** (`apps/`, `packages/`): Turborepo monorepo with Next.js web app, Express API, and shared database/UI packages

### Key Components
1. **Scrapers** (`src/scrapers/`): All scrapers inherit from `BaseBookmakerScraper` which provides:
   - Playwright browser automation with anti-detection (user agent rotation, random delays)
   - `ScrapedEvent` and `ScrapedOdds` data structures for standardization
   - `ScraperManager` for orchestrating multiple bookmakers
   
2. **Database Layer**: Dual ORM approach
   - Python: SQLAlchemy models in `src/models/database.py` (League, Team, Bookmaker, Event, Odds, BookmakerEvent)
   - TypeScript: Prisma in `packages/database/` (used by Express API)
   
3. **Event Matching**: Fuzzy matching system to normalize team names across bookmakers (fuzzywuzzy + python-levenshtein)

4. **Monorepo Apps**:
   - `apps/web`: Next.js 14 frontend with React Query, Zustand, Tailwind
   - `apps/api`: Express API with routes for matches, odds, bookmakers, leagues

## Development Commands

### Python Environment
```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # Unix

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers (required for scrapers)
playwright install chromium

# Run scraper tests
python test_scrapers.py

# Test sports API integration
python src/services/sports_api.py

# Code formatting
black src/
isort src/

# Run tests
pytest
```

### TypeScript/Node Environment
```bash
# Install dependencies (from root)
npm install

# Development mode (all apps)
npm run dev

# Build all packages/apps
npm run build

# Lint all packages/apps
npm run lint

# Format code
npm run format

# Database operations (uses Prisma)
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database

# Individual app development
cd apps/web && npm run dev         # Next.js dev server (port 3000)
cd apps/api && npm run dev         # Express API dev server (port 3001)
cd packages/database && npm run db:studio  # Prisma Studio UI
```

### Python Database Setup
```python
# Initialize PostgreSQL database (one-time setup)
from src.models.database import DatabaseManager

db = DatabaseManager("postgresql://username:password@localhost:5432/odds_checker_at")
db.create_tables()
```

## Testing

### Python
- Single test: `pytest path/to/test_file.py::test_function_name`
- All tests: `pytest`
- Verbose: `pytest -v`
- Async tests use `pytest-asyncio`

### TypeScript
- Run from app directory: `cd apps/web && npm test` (if configured)
- Type checking: `npm run type-check` (in web app)
- Lint: `npm run lint`

## Project-Specific Conventions

### Scraper Development
When adding new bookmakers:
1. Create scraper in `src/scrapers/` inheriting from `BaseBookmakerScraper`
2. Implement required methods: `get_football_events()`, `get_event_odds()`, `normalize_team_name()`
3. Use `await self.random_delay()` between requests for politeness
4. Handle geo-blocking: Austrian bookmakers require Austrian IP or VPN
5. Register in `ScraperManager` for orchestration
6. Test with `test_scrapers.py` before integration

### Database Schema
- Central `Event` table linked to canonical teams via foreign keys
- `BookmakerEvent` junction table maps bookmaker-specific names/URLs to canonical events
- `Odds` table stores time-series odds with `is_current` flag for latest values
- Use `name_normalized` field on teams for fuzzy matching

### Environment Variables
Required in `.env`:
- `DATABASE_URL`: PostgreSQL connection string (used by both Python SQLAlchemy and Prisma)
- `REDIS_URL`: For caching (planned)
- `FOOTBALL_DATA_API_KEY`: Optional, defaults to free tier
- `FRONTEND_URL`: CORS origin for API (default: http://localhost:3000)
- `SCRAPING_DELAY_MIN`, `SCRAPING_DELAY_MAX`: Rate limiting (default: 2-5 seconds)

### Austrian Context
- Team name normalization handles Austrian naming conventions (e.g., "SK Rapid Wien" vs "Rapid Vienna")
- Focus on Austrian Bundesliga and 2. Liga
- All 15 target bookmakers are Austrian-licensed operators

## Debugging

### Scraper Issues
- Enable Playwright headed mode: Change `headless=True` to `headless=False` in `base_scraper.py`
- Check logs in `logs/scraper_test.log`
- Use loguru: `from loguru import logger` then `logger.add("debug.log", level="DEBUG")`
- Verify selectors haven't changed (bookmakers update HTML frequently)

### API Issues
- Health check: `http://localhost:3001/health`
- Check Express logs for route errors
- Verify Prisma schema sync: `npm run db:generate`

## Monorepo Structure
```
apps/
  api/          # Express API server (TypeScript)
  web/          # Next.js frontend (TypeScript)
packages/
  database/     # Prisma schema & client
  ui/           # Shared React components
src/            # Python scraping infrastructure
  scrapers/     # Bookmaker-specific scrapers
  models/       # SQLAlchemy database models
  services/     # Sports API integration
```

## Important Notes
- Scrapers use Playwright (not Selenium) for better anti-detection
- Always respect rate limits and robots.txt
- The system blocks images/fonts during scraping for performance (`page.route()` in base scraper)
- Database uses composite indexes for fast odds comparison queries (see `__table_args__` in models)
- Turbo handles monorepo task orchestration (see `turbo.json` for pipeline)
