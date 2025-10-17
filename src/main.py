import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, jsonify
from flask_cors import CORS
from src.models.user import db
from src.routes.user import user_bp
from src.routes.reservation import reservation_bp
from src.routes.borrow import borrow_bp
from src.routes.reservation_status import reservation_status_bp
from src.routes.borrow_status import borrow_status_bp
from src.routes.reservation_reminder import reservation_reminder_bp
from src.routes.borrow_reminder import borrow_reminder_bp
from src.routes.api import api_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(reservation_bp, url_prefix='/api')
app.register_blueprint(borrow_bp, url_prefix='/api')
app.register_blueprint(reservation_status_bp, url_prefix='/api')
app.register_blueprint(borrow_status_bp, url_prefix='/api')
app.register_blueprint(reservation_reminder_bp, url_prefix='/api')
app.register_blueprint(borrow_reminder_bp, url_prefix='/api')
app.register_blueprint(api_bp)

# uncomment if you need to use database
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://neondb_owner:npg_4c7zqFAwjNRg@ep-delicate-glitter-adqzwgrq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300,
    'connect_args': {'connect_timeout': 10}
}
try:
    db.init_app(app)
    
    @app.before_request
    def create_tables():
        """Create tables on first request"""
        if not hasattr(app, '_tables_created'):
            try:
                with app.app_context():
                    db.create_all()
                app._tables_created = True
            except Exception as e:
                print(f"Database initialization error: {e}")
except Exception as e:
    print(f"Database setup error: {e}")

@app.route('/')
def index():
    """Simple API status endpoint"""
    return jsonify({
        'status': 'online',
        'message': 'UAEU Media Studio Booking API',
        'version': '1.0.0',
        'endpoints': {
            'reservations': '/api/reservations',
            'borrows': '/api/borrows',
            'classes': '/api/classes'
        }
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
