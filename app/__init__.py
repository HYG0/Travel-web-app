from flask import Flask
from flask_sqlalchemy import SQLAlchemy
app = Flask(__name__)

app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLACLHEMY_DATABASE_URI'] = 'sqlite:///travel.db'
db = SQLAlchemy(app)

from app import routes

