from flask import render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import re
from . import db
from .fly_routes import configure_routes
from .models import Users
from . import api


def validate_password(password):
    if len(password) < 6:
        return 'Пароль должен быть минимум 6 символов'
    if not re.search(r'[A-Za-z]', password):
        return 'Пароль должен содержать минимум одну букву'
    if not re.search(r'\d', password):
        return 'Пароль должен содержать минимум одну цифру'
    if not re.search(r'[$!@#%^&*()_+\-=\[\]{};\'\\:"|,.<>\/?]', password):
        return 'Пароль должен содержать минимум один специальный символ'
    return ''


def validate_registration(data):
    errors = {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not name:
        errors['name'] = 'Имя обязательно'
    elif len(name) > 100:
        errors['name'] = 'Имя не должно превышать 100 символов'

    if not email:
        errors['email'] = 'Email обязателен'
    elif '@' not in email:
        errors['email'] = 'Некорректный Email'

    if not password:
        errors['password'] = 'Пароль обязателен'
    else:
        password_error = validate_password(password)
        if password_error:
            errors['password'] = password_error

    return errors


def register_routes(app):
    @app.route('/')
    @app.route('/index')
    def index():
        return render_template('main.html')

    @app.route('/login')
    def login():
        return render_template('login.html')

    @app.route('/signup', methods=['POST'])
    def signup():
        data = request.get_json(silent=True) or {}
        errors = validate_registration(data)

        if errors:
            return jsonify({'errors': errors}), 400

        if Users.query.filter_by(email=data['email']).first():
            return jsonify({'errors': {'email': 'Пользователь с таким Email уже существует'}}), 400

        try:
            new_user = Users(
                username=data['name'],
                email=data['email'],
                password=generate_password_hash(data['password'])
            )
            db.session.add(new_user)
            db.session.commit()

            session['user_id'] = new_user.id

            return jsonify({
                'message': 'Регистрация успешна',
                'user': {'name': new_user.username, 'email': new_user.email}
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    @app.route('/signin', methods=['POST'])
    def signin():
        data = request.get_json(silent=True) or {}
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()

        user = Users.query.filter_by(email=email).first()

        if not user or not check_password_hash(user.password, password):
            return jsonify({'error': 'Неверные учетные данные'}), 401
        
        session['user_id'] = user.id

        return jsonify({'message': f'Добро пожаловать, {user.username}!'}), 200

    @app.route('/debug/users')
    def debug_users():
        users = Users.query.all()
        return jsonify([{
            'id': u.id,
            'username': u.username,
            'email': u.email
        } for u in users])

    @app.route('/entry')
    def city_form():
        user_id = session.get('user_id')
        if not user_id:
            return redirect(url_for('login'))
        
        user = Users.query.get(user_id)
        if not user:
            return redirect(url_for('login'))
        
        return render_template('city_form.html')

    @app.route('/routes')
    def routes():
        return render_template('fly_routes.html')

    @app.route('/about')
    def about():
        return render_template('about.html')
    
    @app.route('/profile')
    def profile():
        user_id = session.get('user_id')
        if not user_id:
            return redirect(url_for('login'))
        
        user = Users.query.get(user_id)
        if not user:
            return redirect(url_for('login'))
        
        return render_template('profile.html', user=user)

    @app.route('/logout')
    def logout():
        # Очищаем сессию
        session.clear()
        # Можно также очистить куки, если нужно
        # session.pop('user_id', None)
        #Удаляем куку в браузере
        response = redirect(url_for('index'))
        response.delete_cookie('session')

        return redirect(url_for('index'))

    configure_routes(app)

    api.basic_search_flights(app)
