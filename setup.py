"""
Setup script for Austrian Odds Checker
Run this to initialize the project environment
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path


def run_command(cmd, description=""):
    """Run a command and print its status"""
    print(f"\n{'='*50}")
    print(f"Running: {description or cmd}")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        if e.stderr:
            print(f"Error details: {e.stderr}")
        return False


def check_python_version():
    """Ensure Python 3.8+ is being used"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8+ is required")
        print(f"Current version: {version.major}.{version.minor}.{version.micro}")
        return False
    
    print(f"✅ Python version: {version.major}.{version.minor}.{version.micro}")
    return True


def create_directories():
    """Create necessary directories"""
    directories = [
        "logs",
        "data", 
        "src/scrapers/__pycache__",
        "src/models/__pycache__",
        "src/services/__pycache__"
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")


def setup_virtual_environment():
    """Set up Python virtual environment if not already in one"""
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ Already in a virtual environment")
        return True
    
    print("Setting up virtual environment...")
    
    # Create venv if it doesn't exist
    if not os.path.exists("venv"):
        if not run_command(f"{sys.executable} -m venv venv", "Creating virtual environment"):
            return False
    
    print("✅ Virtual environment created")
    print("\n⚠️  IMPORTANT: Activate the virtual environment with:")
    
    if sys.platform.startswith('win'):
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    
    print("\nThen run this setup script again from within the virtual environment.")
    return False  # Stop here, user needs to activate venv


def install_dependencies():
    """Install Python dependencies"""
    print("Installing Python dependencies...")
    
    if not run_command(f"{sys.executable} -m pip install --upgrade pip", "Upgrading pip"):
        print("⚠️  Pip upgrade failed, continuing anyway...")
    
    if not run_command(f"{sys.executable} -m pip install -r requirements.txt", "Installing requirements"):
        return False
    
    print("✅ Python dependencies installed")
    return True


def install_playwright():
    """Install Playwright browsers"""
    print("Installing Playwright browsers...")
    
    if not run_command(f"{sys.executable} -m playwright install chromium", "Installing Chromium browser"):
        print("⚠️  Playwright install failed - you may need to install manually")
        print("Run: playwright install chromium")
        return False
    
    print("✅ Playwright browsers installed")
    return True


def setup_environment_file():
    """Set up .env file from template"""
    if os.path.exists(".env"):
        print("✅ .env file already exists")
        return True
    
    if os.path.exists(".env.example"):
        shutil.copy(".env.example", ".env")
        print("✅ Created .env file from template")
        print("⚠️  Please edit .env file with your database credentials")
        return True
    else:
        print("❌ .env.example not found")
        return False


def check_database_connectivity():
    """Check if database is accessible (optional)"""
    try:
        import psycopg2
        print("✅ PostgreSQL driver available")
        
        # Try to read database URL from env
        if os.path.exists(".env"):
            with open(".env", "r") as f:
                content = f.read()
                if "DATABASE_URL=" in content:
                    print("✅ Database URL configured in .env")
                else:
                    print("⚠️  Please configure DATABASE_URL in .env file")
        
        return True
    except ImportError:
        print("⚠️  PostgreSQL driver not available - database operations will fail")
        print("Install with: pip install psycopg2-binary")
        return False


def run_basic_tests():
    """Run basic import tests"""
    print("Running basic import tests...")
    
    try:
        # Test core imports
        sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))
        
        print("Testing base scraper import...")
        from scrapers.base_scraper import BaseBookmakerScraper
        print("✅ Base scraper imported successfully")
        
        print("Testing individual scrapers...")
        from scrapers.win2day_scraper import Win2DayScraper
        from scrapers.lottoland_scraper import LottolandScraper
        print("✅ Individual scrapers imported successfully")
        
        print("Testing sports API...")
        from services.sports_api import FreeSportsAPI
        print("✅ Sports API imported successfully")
        
        print("Testing database models...")
        from models.database import DatabaseManager
        print("✅ Database models imported successfully")
        
        return True
        
    except Exception as e:
        print(f"❌ Import test failed: {e}")
        return False


def display_next_steps():
    """Display what to do next"""
    print(f"\n{'='*50}")
    print("SETUP COMPLETE!")
    print(f"{'='*50}")
    
    print("\nNext steps:")
    print("1. Edit .env file with your database credentials")
    print("2. Set up PostgreSQL database (or use SQLite for testing)")
    print("3. Run the test script: python test_scrapers.py")
    print("4. Check the logs in logs/scraper_test.log")
    
    print("\nQuick test command:")
    print("  python test_scrapers.py")
    
    print("\nFor more information, see README.md")


def main():
    """Main setup function"""
    print("Austrian Odds Checker - Setup Script")
    print("====================================")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Set up virtual environment
    if not setup_virtual_environment():
        sys.exit(0)  # User needs to activate venv
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        sys.exit(1)
    
    # Install Playwright
    install_playwright()  # Continue even if this fails
    
    # Set up environment file
    setup_environment_file()
    
    # Check database
    check_database_connectivity()
    
    # Run tests
    if run_basic_tests():
        print("✅ All import tests passed")
    else:
        print("⚠️  Some import tests failed - check your installation")
    
    # Show next steps
    display_next_steps()


if __name__ == "__main__":
    main()
