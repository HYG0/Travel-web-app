from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo, Length

# создание формы регистрации с полями для ввода имени пользователя, пароля, подтверждения пароля, кнопкой отправки формы
class RegistrationForm(FlaskForm):
    username = StringField('Имя пользователя', 
                         validators=[DataRequired(), Length(min=3, max=20)])
    email = StringField('Email',
                      validators=[DataRequired(), Email()])
    password = PasswordField('Пароль',
                           validators=[DataRequired()])
    confirm_password = PasswordField('Подтвердите пароль',
                                   validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Зарегистрироваться')