from flask import render_template, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import json
import re
from datetime import datetime
from app import app

# Простейшая БД в памяти — словарь пользователей
users_db = {}

def validate_password(password):
    if len(password) < 6:
        return 'Пароль должен быть минимум 6 символов'
    if not re.search(r'[A-Za-z]', password):
        return 'Пароль должен содержать минимум одну букву'
    if not re.search(r'\d', password):
        return 'Пароль должен содержать минимум одну цифру'
    if not re.search(r'[$!@#%^&*()_+\-=\[\]{};\'\\:"|,.<>\/?]', password):
        return 'Пароль должен содержать минимум один специальный символ (например, $, !, @)'
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

    email = data['email']

    if email in users_db:
        return jsonify({'errors': {'email': 'Пользователь с таким Email уже существует'}}), 400

    pw_hash = generate_password_hash(data['password'])
    registered_at = datetime.now().strftime('%d.%m.%Y %H:%M:%S')

    user = {
        'name': data['name'],
        'email': email,
        'password_hash': pw_hash,
        'registered_at': registered_at
    }

    users_db[email] = user

    print('Новый пользователь зарегистрирован:', json.dumps(user, ensure_ascii=False), flush=True)

    return jsonify({'message': 'Регистрация успешна', 'user': {'name': user['name'], 'email': user['email']}}), 201

@app.route('/signin', methods=['POST'])
def signin():
    data = request.get_json(silent=True) or {}

    email = data.get('email', '').strip()
    password = data.get('password', '').strip()

    if not email or '@' not in email:
        return jsonify({'error': 'Некорректный Email'}), 400
    if not password:
        return jsonify({'error': 'Пароль обязателен'}), 400

    user = users_db.get(email)
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404

    if not check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Неверный пароль'}), 401

    return jsonify({'message': f'Добро пожаловать, {user["name"]}!'}), 200


@app.route('/debug/users')
def debug_users():
    return jsonify(users_db)

@app.route('/entry')
def city_form():
  return render_template('city_form.html')

@app.route('/routes')
def routes():
  return render_template('fly_routes.html')