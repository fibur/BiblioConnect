import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_marshmallow import Marshmallow
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

app.config['SECRET_KEY'] = os.environ.get('SERVER_SECRET', 'aaba450fa7f04e3b40ffc930e496251f')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///default.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET', '86b2404d72bd20505ddc7de01ab3ffdb')

jwt = JWTManager(app)

db = SQLAlchemy(app)

bcrypt = Bcrypt(app)

migrate = Migrate(app, db)

login_manager = LoginManager(app)
login_manager.login_view = 'login'
ma = Marshmallow(app)
database_initialized = False

from app import models, schemas, utils, constants, routes