from flask import session, jsonify
from .models import Users

def basic_get_data(app):
    @app.route('/data/get_data', methods=['GET'])
    def get_data():
        user_id = session.get('user_id')
        if user_id is None:
            return jsonify({'error': 'Пользователь не авторизован'}), 401

        user = Users.query.get(user_id)
        if user is None:
            return jsonify({'error': 'Пользователь не найден'}), 404

        routes = user.routes
        # Убеждаемся, что все поля присутствуют, добавляем значения по умолчанию если их нет
        for route_id, route in routes.items():
            route['currency'] = route.get('currency', 'RUB')
            route['hotelName'] = route.get('hotelName', 'Не указан')
            route['flightDate'] = route.get('flightDate', 'Неизвестно')

        return jsonify(routes), 200
