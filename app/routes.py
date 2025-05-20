from flask import render_template, jsonify, request
from app import app
import requests

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

@app.route('/search_cities')
def search_cities():
    query = request.args.get('q')
    if not query:
        return jsonify([])

    response = requests.get(
        'https://places.aviasales.ru/v2/places.json',
        params={
            'term': query,
            'locale': 'ru',
            'types[]': 'city'
        }
    )

    if response.status_code != 200:
        return jsonify([])
    if response.status_code == 429:
        return "Too mucn requests to API"

    data = response.json()
    for item in data:
       print(item['name'])

    results = []
    for item in data:
        if query.lower() in item.get('name', '').lower():
            results.append({
                "name": item.get("name", ""),
                "code": item.get("code", ""),
                "country_name": item.get("country_name", "")
            })

    return jsonify(results)