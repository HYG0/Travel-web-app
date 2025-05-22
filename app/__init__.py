from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
import os

# Инициализация расширений
db = SQLAlchemy()
migrate = Migrate()


def create_app():
    app = Flask(__name__)

    # Конфигурация
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or \
                                            'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)),
                                                                        'app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    # app.config['SQLALCHEMY_ECHO'] = True

    # Инициализация расширений
    db.init_app(app)
    migrate.init_app(app, db)

    # Импорт и регистрация маршрутов происходит после создания app
    from .routes import register_routes
    register_routes(app)

    # Создание таблиц в контексте приложения
    with app.app_context():
        db_path = os.path.join(app.root_path, 'app.db')
        if not os.path.exists(db_path):
            db.create_all()

    return app
