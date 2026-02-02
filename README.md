# Austrian Odds Checker

A lite clone of odds comparison websites like oddschecker.com, specifically targeting Austrian customers with football betting quotes from local bookmakers.

## Features

- **Multi-bookmaker odds comparison** from 15 Austrian-licensed bookmakers
- **Real-time odds scraping** using modern web automation
- **Intelligent event matching** using free sports APIs and fuzzy matching
- **Modular scraper architecture** for easy addition of new bookmakers
- **Database-backed storage** for historical odds and analysis
- **Austrian-focused** team name normalization and league coverage

## Supported Bookmakers

The system currently supports these Austrian-licensed bookmakers:

**Currently Implemented (Proof of Concept):**
- ✅ win2day (Austrian state operator)
- ✅ Lottoland Austria

**Planned for Implementation:**
- tipp3, NEO.bet, tipwin, mozzart, betway
- Merkur Bets, Rabona, interwetten, Admiral
- tipico, bet-at-home, bwin, bet365

## Architecture

### Core Components

1. **Scrapers** (`src/scrapers/`):
   - `base_scraper.py` - Abstract base class for all scrapers
   - Individual scraper implementations for each bookmaker
   - Built-in rate limiting and anti-detection measures

2. **Database Models** (`src/models/`):
   - PostgreSQL schema for events, bookmakers, odds, and teams
   - Optimized indexes for fast odds comparison queries

3. **Sports API Integration** (`src/services/`):
   - Free tier integration with football-data.org
   - Fuzzy matching for consistent event identification
   - Team name normalization for Austrian context

4. **API** (planned):
   - FastAPI-based REST API for odds comparison
   - Real-time WebSocket updates for live odds

## Requirements

- Python 3.8+
- PostgreSQL (for production) or SQLite (for development)
- Redis (for caching)
- Austrian IP address (or VPN) for accessing geo-blocked bookmakers

## Installation

### 1. Clone and Setup Environment

```bash
git clone <repository-url>
cd odds_checker_at

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\\Scripts\\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browsers
playwright install chromium
```

### 2. Database Setup

```bash
# Install PostgreSQL (or use Docker)
# Create database
createdb odds_checker_at

# Copy environment configuration
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Initialize Database

```python
# Run this in Python shell or create a setup script
from src.models.database import DatabaseManager

db = DatabaseManager("postgresql://username:password@localhost:5432/odds_checker_at")
db.create_tables()
```

## Quick Start / Testing

### Test the Scrapers

```bash
# Run the test script to verify scrapers work
python test_scrapers.py
```

This will:
1. Test individual scrapers (win2day, Lottoland)
2. Demonstrate the scraper manager
3. Show event matching and odds comparison
4. Create logs in `logs/scraper_test.log`

### Test Sports API Integration

```bash
# Test the free sports API
python src/services/sports_api.py
```

This will fetch upcoming matches from major European leagues and demonstrate team name matching.

## Development Approach

### Phase 1: Foundation ✅ (Completed)
- ✅ Project structure and base scraper framework
- ✅ Database schema for events, odds, and bookmakers
- ✅ Free sports API integration for event normalization
- ✅ Proof-of-concept scrapers for 2 bookmakers

### Phase 2: Expansion (Next Steps)
- Add scrapers for 3-5 more accessible bookmakers
- Implement database operations and caching
- Create basic web API for odds comparison
- Add scheduling for automated scraping

### Phase 3: Production (Future)
- Complete all 15 bookmaker integrations
- Advanced anti-detection measures
- Real-time odds updates via WebSocket
- Frontend web application
- Performance optimization and monitoring

## Technical Challenges Solved

### 1. **Consistent Event Matching**
- Each bookmaker displays team names differently
- Solution: Fuzzy string matching with normalized team names
- Free sports API provides authoritative event data

### 2. **Anti-Scraping Measures**
- Bookmakers actively prevent automated access
- Solution: Playwright with rotating user agents, delays, and human-like behavior
- Modular architecture allows different approaches per site

### 3. **Geo-blocking**
- Many sites restrict access to Austrian IPs only
- Solution: Built for Austrian development environment
- Production would need Austrian proxy/VPN services

### 4. **Rate Limiting and Politeness**
- Avoid overwhelming bookmaker websites
- Solution: Built-in delays, request throttling, and respectful scraping practices

## Configuration

### Environment Variables (.env)

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/odds_checker_at

# Redis
REDIS_URL=redis://localhost:6379/0

# Sports API (optional, uses free tier by default)
FOOTBALL_DATA_API_KEY=your-api-key

# Scraping settings
SCRAPING_DELAY_MIN=2
SCRAPING_DELAY_MAX=5
```

### Bookmaker Configuration

Each bookmaker scraper can be configured with:
- Custom delay ranges
- Specific CSS selectors
- Team name mappings
- Rate limiting settings

## Usage Examples

### Basic Scraping

```python
from src.scrapers.win2day_scraper import Win2DayScraper
from src.scrapers.lottoland_scraper import LottolandScraper

# Single scraper usage
async with Win2DayScraper() as scraper:
    events = await scraper.get_football_events()
    for event in events:
        odds = await scraper.get_event_odds(event)
        print(f"{event.home_team} vs {event.away_team}: {odds.home_odds}-{odds.draw_odds}-{odds.away_odds}")
```

### Multi-bookmaker Comparison

```python
from src.scrapers.base_scraper import ScraperManager

manager = ScraperManager()
manager.register_scraper(Win2DayScraper())
manager.register_scraper(LottolandScraper())

# Get events from all scrapers
all_events = await manager.scrape_all_events()

# Compare odds for a specific match
event = all_events['win2day'][0]  # First event from win2day
all_odds = await manager.scrape_odds_for_event(event)
```

## Legal and Ethical Considerations

- **Respects robots.txt** and website terms of service
- **Rate limiting** to avoid overwhelming servers  
- **For personal/educational use** - commercial use requires proper licensing
- **Complies with Austrian gambling regulations**
- **No direct links to betting** - information only

## Contributing

This is a proof-of-concept project. To contribute:

1. Fork the repository
2. Add scrapers for new bookmakers in `src/scrapers/`
3. Follow the `BaseBookmakerScraper` interface
4. Add comprehensive error handling
5. Test thoroughly with `test_scrapers.py`

## License

Educational/Personal Use License - See LICENSE file for details.

## Troubleshooting

### Common Issues

1. **"Playwright browsers not installed"**
   ```bash
   playwright install chromium
   ```

2. **"Navigation failed" errors**
   - Check internet connection
   - Verify Austrian IP access
   - Some sites may have temporary blocking

3. **"No events found"**
   - Sites may have changed their HTML structure
   - Check logs for specific error messages
   - Scrapers may need updates for new site layouts

4. **Database connection errors**
   - Verify PostgreSQL is running
   - Check DATABASE_URL in .env file
   - Ensure database exists and user has permissions

### Debug Mode

Enable detailed logging:

```python
from loguru import logger
logger.add("debug.log", level="DEBUG")
```

## Roadmap

- [ ] Complete all 15 bookmaker scrapers
- [ ] Add Austrian Bundesliga specific features
- [ ] Implement caching layer with Redis
- [ ] Create REST API with FastAPI
- [ ] Add automated scheduling with Celery
- [ ] Build simple web frontend
- [ ] Add email/SMS alerts for odds changes
- [ ] Performance monitoring and alerting
