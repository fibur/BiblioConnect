import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS

PUBLIC_HOSTNAME = os.environ.get('PUBLIC_HOSTNAME', 'localhost:8080')
PAYMENT_SERVICE_SECRET = os.environ.get('PAYMENT_SERVICE_SECRET', '09acfc5f3afe754c536a82f3ad8bbfd4')

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///default.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    CORS(app)
    db.init_app(app)
    Migrate(app, db)

    from .routes import main
    app.register_blueprint(main)

    return app
