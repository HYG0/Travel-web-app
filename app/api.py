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
            # Получение параметров
            origin = request.args.get('origin')
            destination = request.args.get('destination')
            departure_at = request.args.get('departure_at')
            one_way = request.args.get('one_way', 'true')

            # Преобразование названий городов в IATA коды
            origin_iata = get_city_iata(origin.split(',')[0].strip())
            destination_iata = get_city_iata(destination.split(',')[0].strip())

            if origin_iata is None or destination_iata is None:
                return jsonify([])

            # Параметры для запроса к Aviasales API
            token = 'e04ebfd8fc1d1ef9e07d285cc398788d'
            params = {
                'origin': origin_iata,
                'destination': destination_iata,
                'departure_at': departure_at,
                'currency': 'rub',
                'limit': 10,
                'token': token,
                'one_way': one_way,
                'sorting': 'price'
            }

            # Запрос к API Aviasales
            url = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
            response = requests.get(url, params=params)
            response.raise_for_status()

            data = response.json()

            # Форматирование ответа с расчетом времени прилета
            flights = []
            for item in data.get('data', []):
                # Парсинг времени вылета
                departure_time = datetime.datetime.fromisoformat(item['departure_at'].replace('Z', '+00:00'))

                # Расчет времени прилета (время вылета + продолжительность)
                duration = datetime.timedelta(minutes=item['duration'])
                arrival_time = departure_time + duration

                flights.append({
                    'origin': item.get('origin'),
                    'destination': item.get('destination'),
                    'price': item.get('price'),
                    'airline': item.get('airline'),
                    'flight_number': item.get('flight_number'),
                    'departure_at': item.get('departure_at'),
                    'arrival_at': arrival_time.isoformat(),  # Добавляем вычисленное время прилета
                    'duration': item.get('duration'),
                    'transfers': item.get('transfers'),
                    'link': f"https://www.aviasales.ru{item.get('link')}"
                })

            return jsonify({'data': flights})

        except Exception as e:
            return jsonify({'error': str(e)}), 500


    # Тестовый маршрут с жестко заданными параметрами (для отладки)
    @app.route('/api/test_search_flights')
    def test_search_flights():
        origin = 'MOW'
        destination = 'AER'
        departure_at = '2025-06-05'
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
            'one_way': 'true',
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
