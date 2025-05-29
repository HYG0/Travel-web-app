from flask import request, jsonify, session
from datetime import datetime
from . import db
from .models import Users


def configure_routes(app):
    @app.route('/add_route', methods=['POST'])
    def add_route():
        # Проверка аутентификации
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'message': 'Требуется авторизация'}), 401

        # Получение данных из JSON
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Нет данных о рейсе'}), 400

        try:
            # Получаем пользователя
            user = Users.query.get(user_id)
            if not user:
                return jsonify({'message': 'Пользователь не найден'}), 404

            # Создаем структуру для сохранения
            route_entry = {
                'airline': data.get('airline'),
                'flight_number': data.get('flight_number', 'N/A'),
                'origin': data.get('origin'),
                'destination': data.get('destination'),
                'origin_iata': data.get('origin_iata'),  # Сохраняем IATA
                'destination_iata': data.get('destination_iata'),  # Сохраняем IATA
                'departure_at': data.get('departure_at'),
                'return_at': data.get('return_at'),
                'price': data.get('price'),
                'datetime': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            # Генерируем ID рейса
            if route_entry['flight_number'] != 'N/A' and route_entry['airline'] == None:
                route_entry['airline'] = route_entry['flight_number'][:2]
            route_number = len(user.routes) + 1 if user.routes else 1
            route_id = f'route_{route_number}'
            user.routes = {**user.routes, route_id: route_entry}

            db.session.commit()

            return jsonify({
                'message': 'Маршрут сохранен',
                'route_id': route_id
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({'message': str(e)}), 500


    @app.route('/get_routes', methods=['GET'])
    def get_routes():
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'message': 'Требуется авторизация'}), 401

        user = Users.query.get(user_id)
        if not user:
            return jsonify({'message': 'Пользователь не найден'}), 404

        return jsonify({
            'routes': user.routes if user.routes else {}
        }), 200


    @app.route('/remove_route/<string:route_id>', methods=['DELETE'])
    def remove_route(route_id):
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'message': 'Требуется авторизация'}), 401

        user = Users.query.get(user_id)
        if not user:
            return jsonify({'message': 'Пользователь не найден'}), 404

        if user.routes and route_id in user.routes:
            deleted = user.routes.pop(route_id)
            db.session.commit()
            return jsonify({
                'message': 'Маршрут удален',
                'deleted_route': deleted
            }), 200

        return jsonify({'message': 'Маршрут не найден'}), 404
