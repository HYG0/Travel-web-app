from flask import jsonify, request, app
import requests
import json
from datetime import datetime, timedelta
from .api import get_city_iata  # Импортируем функцию get_city_iata из api.py

def basic_search_hotels(app):
    # Настраиваем Flask для отключения не-ASCII символов
    app.config['JSON_AS_ASCII'] = False

    @app.route('/search_hotels')
    @app.route('/api/search_hotels', methods=['GET'])
    def search_hotels():
        city = request.args.get('city', '').strip()
        check_in_date = request.args.get('check_in_date', '')
        check_out_date = request.args.get('check_out_date', '')
        currency = request.args.get('currency', 'RUB')  # Валюта по умолчанию RUB

        if not city:
            return jsonify({'error': 'City parameter is required'}), 400

        # Преобразуем название города в IATA-код
        city_iata = get_city_iata(city)
        if not city_iata:
            print(f"Could not resolve IATA code for city: {city}")
            return jsonify({'error': f'Could not resolve IATA code for city: {city}'}), 400

        print(f"Resolved IATA code for {city}: {city_iata}")

        # Если check_out_date не указан, устанавливаем его как check_in_date + 1 день
        if not check_out_date:
            try:
                check_in = datetime.strptime(check_in_date, '%Y-%m-%d')
                check_out_date = (check_in + timedelta(days=1)).strftime('%Y-%m-%d')
            except ValueError:
                print(f"Invalid check_in_date format: {check_in_date}")
                return jsonify({'error': 'Invalid check_in_date format. Use YYYY-MM-DD'}), 400

        print(f"Parameters: city={city}, IATA={city_iata}, checkIn={check_in_date}, checkOut={check_out_date}, currency={currency}")

        api_token = 'e04ebfd8fc1d1ef9e07d285cc398788d'
        base_url = 'https://engine.hotellook.com/api/v2/cache.json'
        params = {
            'location': city_iata if isinstance(city_iata, str) else city_iata[0],  # Используем IATA-код
            'checkIn': check_in_date,
            'checkOut': check_out_date,
            'currency': currency,
            'token': api_token,
            'limit': 50,
            'lang': 'ru'
        }

        try:
            # Выполняем запрос к API
            print(f"Sending request to Hotellook API with params: {params}")
            response = requests.get(base_url, params=params)
            response.raise_for_status()  # Вызовет исключение для кодов 4xx/5xx
            hotels_data = response.json()
            print(f"Hotellook API response: {hotels_data}")

            # Преобразуем данные и фильтруем отели
            hotels = []
            for hotel in hotels_data:
                location = hotel.get('location', {})
                stars = int(hotel.get('stars', 0))  # Приводим к целому числу
                # Фильтруем только 5, 4 и 3-звездочные отели
                if stars in [3, 4, 5]:
                    hotel_info = {
                        'hotel_id': hotel.get('hotelId'),
                        'name': hotel.get('hotelName'),
                        'city': location.get('name', city),  # Город из API или переданный
                        'stars': stars,  # Звезды отеля
                        'rating': hotel.get('rating', 0.0),  # Рейтинг среди посетителей
                        'price_per_night': hotel.get('priceFrom', 0),  # Цена за ночь
                        'currency': currency  # Валюта
                    }
                    hotels.append(hotel_info)

            # Сортируем отели по звездам (по убыванию: 5, 4, 3)
            hotels.sort(key=lambda x: x['stars'], reverse=True)

            # Выбираем по одному отелю для каждой категории (5, 4, 3 звезды)
            selected_hotels = []
            stars_needed = [5, 4, 3]  # Нужные категории
            for star in stars_needed:
                # Ищем первый отель с нужным количеством звезд
                for hotel in hotels:
                    if hotel['stars'] == star and hotel not in selected_hotels:
                        selected_hotels.append(hotel)
                        break

            # Если не нашли отели для всех категорий, возвращаем ошибку
            if len(selected_hotels) < 3:
                missing_stars = [star for star in stars_needed if not any(hotel['stars'] == star for hotel in selected_hotels)]
                print(f"Missing hotels for stars: {missing_stars}")
                return jsonify({
                    'error': f'Could not find hotels for all required star ratings. Missing: {missing_stars}'
                }), 404

            print(f"Returning hotels: {selected_hotels}")
            # Возвращаем JSON с ensure_ascii=False
            return app.response_class(
                response=json.dumps(selected_hotels, ensure_ascii=False),
                mimetype='application/json'
            )

        except requests.exceptions.RequestException as e:
            print(f"Hotellook API error: {str(e)}")
            return jsonify({'error': f'Failed to fetch hotels: {str(e)}'}), 500

    @app.route('/api/test_search_hotels')
    def test_search_hotels():
        city = 'Minsk'  # Тестовый город
        check_in_date = '2025-05-30'  # Тестовая дата заезда
        check_out_date = '2025-05-31'  # Тестовая дата выезда
        currency = 'RUB'  # Тестовая валюта
        limit = 50

        api_token = 'e04ebfd8fc1d1ef9e07d285cc398788d'
        if not api_token:
            return jsonify({'error': 'Missing API token'}), 500

        # Преобразуем город в IATA-код
        city_iata = get_city_iata(city)
        if not city_iata:
            print(f"Could not resolve IATA code for city: {city}")
            return jsonify({'error': f'Could not resolve IATA code for city: {city}'}), 400

        print(f"Resolved IATA code for {city}: {city_iata}")

        base_url = 'https://engine.hotellook.com/api/v2/cache.json'
        params = {
            'location': city_iata if isinstance(city_iata, str) else city_iata[0],
            'checkIn': check_in_date,
            'checkOut': check_out_date,
            'currency': currency,
            'token': api_token,
            'limit': limit,
            'lang': 'ru'
        }

        try:
            # Выполняем запрос к API
            print(f"Sending test request to Hotellook API with params: {params}")
            response = requests.get(base_url, params=params)
            if response.status_code != 200:
                print(f"Hotellook API error: {response.status_code} - {response.text}")
                return jsonify({'error': 'Failed to fetch data from Hotellook API'}), response.status_code

            hotels_data = response.json()
            print(f"Hotellook API test response: {hotels_data}")

            # Проверяем, есть ли данные
            if not hotels_data:
                return jsonify({'error': 'Hotellook API returned empty data'}), 500

            # Преобразуем данные для тестового ответа
            hotels = []
            for hotel in hotels_data:
                location = hotel.get('location', {})
                stars = int(hotel.get('stars', 0))  # Приводим к целому числу
                # Фильтруем только 5, 4 и 3-звездочные отели
                if stars in [3, 4, 5]:
                    hotel_info = {
                        'hotel_id': hotel.get('hotelId'),
                        'name': hotel.get('hotelName'),
                        'city': location.get('name', city),  # Город из API или переданный
                        'stars': stars,  # Звезды отеля
                        'rating': hotel.get('rating', 0.0),  # Рейтинг среди посетителей
                        'price_per_night': hotel.get('priceFrom', 0),  # Цена за ночь
                        'currency': currency  # Валюта
                    }
                    hotels.append(hotel_info)

            # Сортируем отели по звездам (по убыванию: 5, 4, 3)
            hotels.sort(key=lambda x: x['stars'], reverse=True)

            # Выбираем по одному отелю для каждой категории (5, 4, 3 звезды)
            selected_hotels = []
            stars_needed = [5, 4, 3]  # Нужные категории
            for star in stars_needed:
                # Ищем первый отель с нужным количеством звезд
                for hotel in hotels:
                    if hotel['stars'] == star and hotel not in selected_hotels:
                        selected_hotels.append(hotel)
                        break

            # Если не нашли отели для всех категорий, возвращаем ошибку
            if len(selected_hotels) < 3:
                missing_stars = [star for star in stars_needed if not any(hotel['stars'] == star for hotel in selected_hotels)]
                print(f"Missing hotels for stars: {missing_stars}")
                return jsonify({
                    'error': f'Could not find hotels for all required star ratings. Missing: {missing_stars}'
                }), 404

            print(f"Returning test hotels: {selected_hotels}")
            # Возвращаем JSON с ensure_ascii=False
            return app.response_class(
                response=json.dumps(selected_hotels, ensure_ascii=False),
                mimetype='application/json'
            )

        except requests.exceptions.RequestException as e:
            print(f"Hotellook API test error: {str(e)}")
            return jsonify({'error': f'Failed to fetch hotels: {str(e)}'}), 500