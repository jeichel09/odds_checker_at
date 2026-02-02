from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, Boolean, ForeignKey, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

Base = declarative_base()


class League(Base):
    __tablename__ = "leagues"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    country = Column(String(50), nullable=False)
    external_api_id = Column(String(50), unique=True, index=True)  # From sports API
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    events = relationship("Event", back_populates="league")


class Team(Base):
    __tablename__ = "teams"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    name_normalized = Column(String(100), nullable=False, index=True)  # For matching
    country = Column(String(50))
    external_api_id = Column(String(50), unique=True, index=True)  # From sports API
    logo_url = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    home_events = relationship("Event", foreign_keys="Event.home_team_id", back_populates="home_team")
    away_events = relationship("Event", foreign_keys="Event.away_team_id", back_populates="away_team")


class Bookmaker(Base):
    __tablename__ = "bookmakers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, unique=True, index=True)
    display_name = Column(String(100), nullable=False)
    website_url = Column(String(255), nullable=False)
    base_odds_url = Column(String(255))  # Base URL for odds pages
    country = Column(String(50), default="AT")  # Austria
    is_active = Column(Boolean, default=True)
    scraper_class = Column(String(100))  # Python class name for scraper
    last_scraped = Column(DateTime)
    scraping_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Technical scraping info
    requires_javascript = Column(Boolean, default=True)
    has_rate_limiting = Column(Boolean, default=True)
    scraping_difficulty = Column(String(20), default="medium")  # easy, medium, hard
    
    # Relationships
    odds = relationship("Odds", back_populates="bookmaker")
    bookmaker_events = relationship("BookmakerEvent", back_populates="bookmaker")


class Event(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    external_api_id = Column(String(50), unique=True, index=True)  # From sports API
    league_id = Column(Integer, ForeignKey("leagues.id"), nullable=False, index=True)
    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False, index=True)
    
    match_date = Column(DateTime, nullable=False, index=True)
    status = Column(String(20), default="scheduled")  # scheduled, live, finished, cancelled
    home_score = Column(Integer)
    away_score = Column(Integer)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    league = relationship("League", back_populates="events")
    home_team = relationship("Team", foreign_keys=[home_team_id], back_populates="home_events")
    away_team = relationship("Team", foreign_keys=[away_team_id], back_populates="away_events")
    odds = relationship("Odds", back_populates="event")
    bookmaker_events = relationship("BookmakerEvent", back_populates="event")
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_event_date_league', 'match_date', 'league_id'),
        Index('idx_event_teams', 'home_team_id', 'away_team_id'),
    )


class BookmakerEvent(Base):
    """Mapping table to handle different team names and URLs per bookmaker"""
    __tablename__ = "bookmaker_events"
    
    id = Column(Integer, primary_key=True, index=True)
    bookmaker_id = Column(Integer, ForeignKey("bookmakers.id"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    
    # Bookmaker-specific team names (for scraping)
    home_team_name = Column(String(100))  # How bookmaker displays home team
    away_team_name = Column(String(100))  # How bookmaker displays away team
    
    # Bookmaker-specific URLs and IDs
    bookmaker_event_url = Column(String(500))
    bookmaker_event_id = Column(String(100))  # Bookmaker's internal ID
    
    # Scraping metadata
    last_scraped = Column(DateTime)
    scraping_enabled = Column(Boolean, default=True)
    scraping_errors = Column(Integer, default=0)
    last_error = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bookmaker = relationship("Bookmaker", back_populates="bookmaker_events")
    event = relationship("Event", back_populates="bookmaker_events")
    
    # Unique constraint
    __table_args__ = (
        Index('idx_bookmaker_event_unique', 'bookmaker_id', 'event_id', unique=True),
    )


class Odds(Base):
    __tablename__ = "odds"
    
    id = Column(Integer, primary_key=True, index=True)
    bookmaker_id = Column(Integer, ForeignKey("bookmakers.id"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    
    # Odds types
    bet_type = Column(String(50), nullable=False, index=True)  # "1X2", "over_under", "both_teams_score"
    market = Column(String(100))  # "full_time_result", "total_goals_2.5", etc.
    
    # Odds values
    home_odds = Column(Float)  # 1 (home win)
    draw_odds = Column(Float)  # X (draw)
    away_odds = Column(Float)  # 2 (away win)
    
    # For over/under bets
    line = Column(Float)  # 2.5 goals, etc.
    over_odds = Column(Float)
    under_odds = Column(Float)
    
    # For yes/no bets (both teams score, etc.)
    yes_odds = Column(Float)
    no_odds = Column(Float)
    
    # Metadata
    scraped_at = Column(DateTime, default=datetime.utcnow, index=True)
    is_live = Column(Boolean, default=False)  # Live vs pre-match odds
    is_current = Column(Boolean, default=True, index=True)  # Latest odds for this market
    
    # Relationships
    bookmaker = relationship("Bookmaker", back_populates="odds")
    event = relationship("Event", back_populates="odds")
    
    # Indexes for fast queries
    __table_args__ = (
        Index('idx_odds_current', 'event_id', 'bookmaker_id', 'bet_type', 'is_current'),
        Index('idx_odds_scraped', 'scraped_at'),
        Index('idx_odds_live', 'is_live', 'scraped_at'),
    )


# Database connection and session management
class DatabaseManager:
    def __init__(self, database_url: str):
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
    def create_tables(self):
        """Create all tables"""
        Base.metadata.create_all(bind=self.engine)
        
    def get_session(self):
        """Get database session"""
        db = self.SessionLocal()
        try:
            return db
        finally:
            pass  # Session will be closed by the caller
            
    def close_session(self, db):
        """Close database session"""
        db.close()
