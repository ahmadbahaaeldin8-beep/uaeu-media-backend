"""
Database initialization script for UAEU Media Studio Backend
This script creates all necessary database tables
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from src.models.user import db
from src.models.reservation import Reservation
from src.models.borrow import Borrow
from flask import Flask

def init_database():
    """Initialize the database with all required tables"""
    app = Flask(__name__)
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set!")
        return False
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'connect_args': {'connect_timeout': 10}
    }
    
    db.init_app(app)
    
    with app.app_context():
        try:
            # Create all tables (won't drop existing ones)
            print("Creating database tables...")
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Show what tables were created
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"\nTables in database: {', '.join(tables)}")
            
            return True
        except Exception as e:
            print(f"❌ Error creating database tables: {e}")
            return False

if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1)

