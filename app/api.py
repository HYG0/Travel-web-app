from flask import request, jsonify
import requests
import datetime
from .citys import get_city_iata

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
        try:
            origin = request.args.get('origin')
            destination = request.args.get('destination')
            departure_at = request.args.get('departure_at')
            currency = request.args.get('currency', 'RUB')
            cost_min = float(request.args.get('cost_min', 0))
            cost_max = float(request.args.get('cost_max', float('inf')))

            origin_iata = get_city_iata(origin.split(',')[0].strip())
            destination_iata = get_city_iata(destination.split(',')[0].strip())

            if origin_iata is None or destination_iata is None:
                return jsonify([])

            token = 'e04ebfd8fc1d1ef9e07d285cc398788d'
            params = {
                'origin': origin_iata,
                'destination': destination_iata,
                'departure_at': departure_at,
                'currency': currency,
                'limit': 3,
                'one_way': 'false',
                'token': token,
            }
            
            url = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
            response = requests.get(url, params=params)
            response.raise_for_status()

            data = response.json()

            flights = []
            for item in data.get('data', []):
                price = item.get('price', 0)
                if cost_min <= price <= cost_max:
                    departure_time = datetime.datetime.fromisoformat(item['departure_at'].replace('Z', '+00:00'))
                    duration = datetime.timedelta(minutes=item['duration'])
                    arrival_time = departure_time + duration

                    flights.append({
                        'origin': item.get('origin'),
                        'destination': item.get('destination'),
                        'price': price,
                        'currency': currency,
                        'airline': item.get('airline'),
                        'flight_number': item.get('flight_number'),
                        'departure_at': item.get('departure_at'),
                        'arrival_at': arrival_time.isoformat(),
                        'duration': item.get('duration'),
                        'transfers': item.get('transfers'),
                        'link': f"https://www.aviasales.ru{item.get('link')}"
                    })

            print(flights)

            return jsonify({'data': flights, 'currency': currency})

        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/test_search_flights')
    def test_search_flights():
        origin = 'MOW'
        destination = 'SVX'
        departure_at = '2025-05-31'
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
            'currency': currency,
            'limit': limit,
            'token': token,
            'one_way': 'false',
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