from flask import render_template, request, jsonify
import re
import requests
from . import db
from .models import Users


def basic_search_flights(app):
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
            return "Too many requests to API"

        data = response.json()

        results = []
        for item in data:
            if query.lower() in item.get('name', '').lower():
                results.append({
                    "name": item.get("name", ""),
                    "code": item.get("code", ""),
                    "country_name": item.get("country_name", "")
                })

        return jsonify(results)
    
    @app.route('/api/search_flights', methods=['GET'])
    def search_flights():
        origin = request.args.get('origin')
        destination = request.args.get('destination')
        departure_at = request.args.get('departure_at')  # формат YYYY-MM-DD
        return_at = request.args.get('return_at')        # формат YYYY-MM-DD
        currency = request.args.get('currency', 'rub')
        limit = request.args.get('limit', 10)

        token = 'e04ebfd8fc1d1ef9e07d285cc398788d'
        if not all([origin, destination, departure_at, return_at, token]):
            return jsonify({'error': 'Missing required parameters'}), 400

        url = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
        params = {
            'origin': origin,
            'destination': destination,
            'departure_at': departure_at,
            'return_at': return_at,
            'currency': currency,
            'limit': limit,
            'token': token,
            'one_way': 'false',
            'sorting': 'price'
        }

        response = requests.get(url, params=params)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch data from Aviasales API'}), response.status_code

        data = response.json()
        if not data.get('success'):
            return jsonify({'error': 'Aviasales API returned an error'}), 500

        flights = []
        for item in data.get('data', []):
            flights.append({
                'origin': item.get('origin'),
                'destination': item.get('destination'),
                'price': item.get('price'),
                'airline': item.get('airline'),
                'flight_number': item.get('flight_number'),
                'departure_at': item.get('departure_at'),
                'return_at': item.get('return_at'),
                'transfers': item.get('transfers'),
                'link': f"https://www.aviasales.ru{item.get('link')}"
            })

        return jsonify({'data': flights})

    # Тестовый маршрут с жестко заданными параметрами (для отладки)
    @app.route('/api/test_search_flights')
    def test_search_flights():
        origin = 'MOW'
        destination = 'LED'
        departure_at = '2025-07-01'
        return_at = '2025-07-10'
        currency = 'rub'
        limit = 6

        token = 'e04ebfd8fc1d1ef9e07d285cc398788d'
        if not token:
            return jsonify({'error': 'Missing API token'}), 500

        url = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
        params = {
            'origin': origin,
            'destination': destination,
            'departure_at': departure_at,
            'return_at': return_at,
            'currency': currency,
            'limit': limit,
            'token': token,
            'one_way': 'false',
            'sorting': 'price'
        }

        response = requests.get(url, params=params)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch data from Aviasales API'}), response.status_code

        data = response.json()
        if not data.get('success'):
            return jsonify({'error': 'Aviasales API returned an error'}), 500

        flights = []
        for item in data.get('data', []):
            flights.append({
                'origin': item.get('origin'),
                'destination': item.get('destination'),
                'price': item.get('price'),
                'airline': item.get('airline'),
                'flight_number': item.get('flight_number'),
                'departure_at': item.get('departure_at'),
                'return_at': item.get('return_at'),
                'transfers': item.get('transfers'),
                'link': f"https://www.aviasales.ru{item.get('link')}"
            })

        return jsonify({'data': flights})
