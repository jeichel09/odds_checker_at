from abc import ABC, abstractmethod
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import asyncio
import time
import random
from playwright.async_api import async_playwright, Browser, Page
from loguru import logger
import os


@dataclass
class ScrapedOdds:
    """Standardized odds data structure"""
    home_team: str
    away_team: str
    match_date: datetime
    home_odds: Optional[float] = None
    draw_odds: Optional[float] = None  
    away_odds: Optional[float] = None
    league: Optional[str] = None
    match_url: Optional[str] = None
    bookmaker_event_id: Optional[str] = None


@dataclass
class ScrapedEvent:
    """Standardized event data structure"""
    home_team: str
    away_team: str
    match_date: datetime
    league: str
    event_url: str
    bookmaker_event_id: Optional[str] = None
    status: str = "scheduled"


class BaseBookmakerScraper(ABC):
    """Base class for all bookmaker scrapers"""
    
    def __init__(self, bookmaker_name: str, base_url: str, delay_range: Tuple[int, int] = (2, 5)):
        self.bookmaker_name = bookmaker_name
        self.base_url = base_url
        self.delay_min, self.delay_max = delay_range
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        
        # User agent rotation
        self.user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ]
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self.start_browser()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.close_browser()
    
    async def start_browser(self):
        """Initialize browser and page"""
        playwright = await async_playwright().start()
        self.browser = await playwright.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        )
        
        # Create new page with random user agent
        user_agent = random.choice(self.user_agents)
        self.page = await self.browser.new_page(user_agent=user_agent)
        
        # Set viewport to common desktop size
        await self.page.set_viewport_size({"width": 1920, "height": 1080})
        
        # Block images and fonts to speed up loading (optional)
        await self.page.route("**/*.{png,jpg,jpeg,gif,svg,woff,woff2}", lambda route: route.abort())
        
        logger.info(f"Started browser for {self.bookmaker_name}")
    
    async def close_browser(self):
        """Close browser and cleanup"""
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
        logger.info(f"Closed browser for {self.bookmaker_name}")
    
    async def random_delay(self):
        """Add random delay between requests"""
        delay = random.uniform(self.delay_min, self.delay_max)
        logger.debug(f"Waiting {delay:.2f} seconds...")
        await asyncio.sleep(delay)
    
    async def safe_navigate(self, url: str, wait_for_selector: Optional[str] = None) -> bool:
        """Safely navigate to URL with error handling"""
        try:
            logger.info(f"Navigating to: {url}")
            await self.page.goto(url, wait_until="networkidle", timeout=30000)
            
            if wait_for_selector:
                await self.page.wait_for_selector(wait_for_selector, timeout=10000)
            
            await self.random_delay()
            return True
            
        except Exception as e:
            logger.error(f"Failed to navigate to {url}: {str(e)}")
            return False
    
    @abstractmethod
    async def get_football_events(self, leagues: List[str] = None) -> List[ScrapedEvent]:
        """Get list of upcoming football events"""
        pass
    
    @abstractmethod 
    async def get_event_odds(self, event: ScrapedEvent) -> Optional[ScrapedOdds]:
        """Get odds for a specific event"""
        pass
    
    @abstractmethod
    def normalize_team_name(self, team_name: str) -> str:
        """Normalize team name for consistent matching"""
        pass
    
    def normalize_odds_value(self, odds_str: str) -> Optional[float]:
        """Convert odds string to float, handling different formats"""
        if not odds_str or odds_str.strip() == '':
            return None
            
        try:
            # Remove common non-numeric characters
            cleaned = odds_str.replace(',', '.').strip()
            
            # Handle different odds formats
            if '/' in cleaned:  # Fractional odds like "5/1"
                parts = cleaned.split('/')
                if len(parts) == 2:
                    return (float(parts[0]) / float(parts[1])) + 1
            else:  # Decimal odds
                return float(cleaned)
                
        except (ValueError, ZeroDivisionError):
            logger.warning(f"Could not parse odds value: {odds_str}")
            return None
    
    async def get_page_content(self, url: str) -> Optional[str]:
        """Get page content as HTML string"""
        try:
            if await self.safe_navigate(url):
                return await self.page.content()
        except Exception as e:
            logger.error(f"Error getting page content from {url}: {str(e)}")
        return None


class ScraperManager:
    """Manages multiple bookmaker scrapers"""
    
    def __init__(self):
        self.scrapers: Dict[str, BaseBookmakerScraper] = {}
    
    def register_scraper(self, scraper: BaseBookmakerScraper):
        """Register a new scraper"""
        self.scrapers[scraper.bookmaker_name] = scraper
        logger.info(f"Registered scraper for {scraper.bookmaker_name}")
    
    async def scrape_all_events(self, leagues: List[str] = None) -> Dict[str, List[ScrapedEvent]]:
        """Scrape events from all registered scrapers"""
        results = {}
        
        for name, scraper in self.scrapers.items():
            try:
                logger.info(f"Scraping events from {name}...")
                async with scraper:
                    events = await scraper.get_football_events(leagues)
                    results[name] = events
                    logger.info(f"Scraped {len(events)} events from {name}")
                    
            except Exception as e:
                logger.error(f"Error scraping {name}: {str(e)}")
                results[name] = []
        
        return results
    
    async def scrape_odds_for_event(self, event: ScrapedEvent, bookmaker_names: List[str] = None) -> Dict[str, Optional[ScrapedOdds]]:
        """Scrape odds for a specific event from selected bookmakers"""
        results = {}
        target_scrapers = bookmaker_names or list(self.scrapers.keys())
        
        for name in target_scrapers:
            if name not in self.scrapers:
                continue
                
            try:
                scraper = self.scrapers[name]
                logger.info(f"Scraping odds from {name} for {event.home_team} vs {event.away_team}")
                
                async with scraper:
                    odds = await scraper.get_event_odds(event)
                    results[name] = odds
                    
                    if odds:
                        logger.info(f"Got odds from {name}: {odds.home_odds}-{odds.draw_odds}-{odds.away_odds}")
                    else:
                        logger.warning(f"No odds found from {name}")
                        
            except Exception as e:
                logger.error(f"Error getting odds from {name}: {str(e)}")
                results[name] = None
        
        return results
