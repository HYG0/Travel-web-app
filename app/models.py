from . import db
from sqlalchemy import JSON
from datetime import datetime




class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(128), nullable=False)
    routes = db.Column(JSON, default={})
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


#Структура данных о перелетах:
#[
#    {
#        'рейс1': {
#           'авиакомпания': ее название,
#           'рейс' : его номер,
#            'маршрут': {'откуда': 'город1', 'куда': 'город2'}, - куки
#            'аэропорты': {'вылет': 'код1', 'прилет': 'код2'},
#            'даты': {'вылет': '2024-05-20 08:00', 'прилет': '2024-05-20 10:00'},
#            'цена': 15000
#        }
#    },
#    {
#        'рейс2': {
#            ...
#        }
#    }
#]

    def __repr__(self):
        return f'<User {self.username}>'
