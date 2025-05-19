from flask import render_template
from app import app

@app.route('/')
@app.route('/index')
def index():
  return render_template('main.html')

@app.route('/login')
def login():
  return render_template('login.html')


@app.route('/entry')
def city_form():
  return render_template('city_form.html')

@app.route('/routes')
def routes():
  return render_template('fly_routes.html')

@app.route('/about')
def about():
  return render_template('about.html')