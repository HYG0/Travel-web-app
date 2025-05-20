from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField
from wtforms.validators import DataRequired, Email, Length

class RegistrationForm(FlaskForm):
    name = StringField('Имя', validators=[DataRequired(message="Имя обязательно"), Length(max=100)])
    email = StringField('Email', validators=[DataRequired(message="Email обязателен"), Email(message="Некорректный Email")])
    password = PasswordField('Пароль', validators=[DataRequired(message="Пароль обязателен"), Length(min=6, message="Пароль минимум 6 символов")])
    