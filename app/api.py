from flask import request, jsonify
import requests
import datetime
from .citys import city_to_iata
from .time_zones import calculate_flight_duration

def log(message):
    print(f"[1] {message}")

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
            origin = request.args.get('origin')     # Город, Страна
            destination = request.args.get('destination')
            departure_at = request.args.get('departure_at')
            currency = request.args.get('currency', 'RUB')
            cost_min = float(request.args.get('cost_min', 0))
            cost_max = float(request.args.get('cost_max', float('inf')))

            log(f"Received params: origin={origin}, destination={destination}, departure_at={departure_at}, currency={currency}, cost_min={cost_min}, cost_max={cost_max}")

            if not origin or not destination or not departure_at:
                return jsonify({'data': [], 'error': 'Missing required parameters'})

            origin_iata = city_to_iata(origin.split(',')[0].strip())
            destination_iata = city_to_iata(destination.split(',')[0].strip())
            log(f"Resolved IATA: origin={origin_iata}, destination={destination_iata}")

            if origin_iata is None or destination_iata is None:
                return jsonify({'data': [], 'error': 'Invalid city IATA code'})

            token = 'e04ebfd8fc1d1ef9e07d285cc398788d'
            all_flights = []
            url = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
            page = 1
            max_pages = 10

            while page <= max_pages:
                params = {
                    'origin': origin_iata,
                    'destination': destination_iata,
                    'departure_at': departure_at,
                    'currency': currency,
                    'limit': 100,
                    'page': page,
                    'one_way': 'false',
                    'token': token,
                }
                response = requests.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                raw_flights = data.get('data', [])
                if not raw_flights:
                    break
                all_flights.extend(raw_flights)
                page += 1

            log(f"Raw flights count: {len(all_flights)}")
            # log(f"Raw flights: {all_flights}")
            log(f"Raw prices: {[float(item.get('price', 0)) for item in all_flights]}")

            flights = []
            for item in all_flights:
                price = item.get('price')
                if price is None:
                    log(f"Skipping flight with missing price: {item}")
                    continue
                try:
                    price = float(price)
                except (TypeError, ValueError) as e:
                    log(f"Skipping flight with invalid price {price}: {e}")
                    continue

                if not (cost_min <= price <= cost_max):
                    log(f"Skipping flight with price {price} (outside range {cost_min}-{cost_max})")
                    continue

                try:
                    departure_time = datetime.datetime.fromisoformat(item['departure_at'].replace('Z', '+00:00'))
                    flight_date = departure_time.date().isoformat()
                    departure_time_str = departure_time.strftime('%H:%M')

                    duration_minutes = item.get('duration_to', 0)
                    duration_str, arrival_time = calculate_flight_duration(
                        origin=item.get('origin'),
                        destination=item.get('destination'),
                        departure_time=departure_time_str,
                        duration_minutes=duration_minutes,
                        flight_date=flight_date
                    )

                    flights.append({
                        'origin': origin,                           # Точка вылета в формате: Город, страна
                        'destination': destination,                 # Точка прилета в формате: Город, страна
                        'origin_airport': item.get('origin_airport'),           # IATA код аэропорта вылета
                        'destination_airport': item.get('destination_airport'), # IATA код аэропорта прилета
                        'price': price,
                        'currency': currency,
                        'airline': item.get('airline'),
                        'flight_number': item.get('flight_number'),
                        'departure_at': departure_time_str,
                        'return_at': arrival_time,  # Теперь в формате HH:MM
                        'duration': duration_str,  # В формате "Xч Yмин"
                        'transfers': item.get('transfers'),
                        'link': f"https://www.aviasales.ru{item.get('link')}",
                        'flightDate': flight_date
                    })
                except (KeyError, TypeError, ValueError) as e:
                    log(f"Skipping invalid flight data: {e}")
                    continue

            invalid_flights = [f for f in flights if not (cost_min <= f['price'] <= cost_max)]
            if invalid_flights:
                log(f"Error: Found flights with prices outside range after filtering: {[f['price'] for f in invalid_flights]}")
                return jsonify({'data': [], 'error': 'Internal filtering error'}), 500

            log(f"Filtered flights count: {len(flights)}")
            log(f"Filtered prices: {[flight['price'] for flight in flights]}")

            if not flights:
                return jsonify({'data': [], 'message': 'No flights found in the specified price range'})

            return jsonify({
                'data': flights,
                'currency': currency,
                'raw_count': len(all_flights),
                'filtered_count': len(flights)
            })

        except Exception as e:
            log(f"Error in search_flights: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/test_search_flights')
    def test_search_flights():
        origin = 'Москва, Россия'
        destination = 'Екатеринбург, Россия'
        origin_iata = city_to_iata(origin.split(',')[0].strip())
        destination_iata = city_to_iata(destination.split(',')[0].strip())
        departure_at = '2025-06-07'
        currency = 'RUB'
        limit = 100

        token = 'e04ebfd8fc1d1ef9e07d285cc398788d'
        if not token:
            return jsonify({'error': 'Missing API token'}), 500

        url = 'https://api.travelpayouts.com/aviasales/v3/prices_for_dates'
        params = {
            'origin': origin_iata,
            'destination': destination_iata,
            'departure_at': departure_at,
            'currency': currency,
            'limit': limit,
            'token': token,
            'one_way': 'false',  # Изменим на true, чтобы получить только прямой рейс
        }

        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            log(f"API response in test_search_flights: {data}")
            if not data.get('success'):
                return jsonify({'error': 'Aviasales API returned an error'}), 500

            flights = []
            for item in data.get('data', []):
                try:
                    departure_time = datetime.datetime.fromisoformat(item['departure_at'].replace('Z', '+00:00'))
                    flight_date = departure_time.date().isoformat()
                    departure_time_str = departure_time.strftime('%H:%M')

                    duration_minutes = item.get('duration_to', 0)
                    duration_str, arrival_time = calculate_flight_duration(
                        origin=item.get('origin'),
                        destination=item.get('destination'),
                        departure_time=departure_time_str,
                        duration_minutes=duration_minutes,
                        flight_date=flight_date
                    )

                    flights.append({
                        'origin': origin,
                        'destination': destination,
                        'origin_airport': item.get('origin_airport'),
                        'destination_airport': item.get('destination_airport'),
                        'price': item.get('price'),
                        'airline': item.get('airline'),
                        'flight_number': item.get('flight_number'),
                        'departure_at': departure_time_str,
                        'return_at': arrival_time,  # Теперь в формате HH:MM
                        'duration': duration_str,  # В формате "Xч Yмин"
                        'transfers': item.get('transfers'),
                        'link': f"https://www.aviasales.ru{item.get('link')}",
                        'flightDate': flight_date
                    })
                except (KeyError, TypeError, ValueError) as e:
                    log(f"Skipping invalid flight data in test_search_flights: {e}")
                    continue

            return jsonify({'data': flights})

        except requests.exceptions.RequestException as e:
            log(f"Error in test_search_flights API request: {str(e)}")
            return jsonify({'error': f'Failed to fetch data from Aviasales API: {str(e)}'}), 500
