from flask import Flask

app = Flask(__name__)

app.config['SECRET_KEY'] = 'supersecretkey'

from app import routes
