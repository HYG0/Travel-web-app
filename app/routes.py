from flask import render_template, redirect, url_for, flash
from app import app, db
from app.models import User
from app.forms import RegistrationForm
@app.route('/')
@app.route('/index')
def index():
  return render_template('main.html')

@app.route('/register', methods = ['GET', 'POST']) # связывает адрес с функцией

def register():
  form = RegistrationForm() # экземпляр формы регистрации
  if form.validate_on_submit():
    # проверка на уже существуюшего пользователя
    user = User.query.filter_by(username=form.username.data).first() # поиск пользователя с таким же именем в БД
    if user:
      flash("Это имя пользователя уже занято.", "danger")
      return redirect(url_for("register"))
    user = User.query.filter_by(email=form.email.data).first()

    if user:
      flash("Этот email уже используется.", "danger")
      return redirect(url_for("register"))
    

    # создание нового пользователя
    new_user = User(username=form.username.data, email=form.email.data)
    new_user.set_password(form.password.data)


    # сохранение в БД
    db.session.add(new_user)
    db.session.commit()

    flash("Аккаунт успешно создан! Теперь можно войти.", "success")
    return redirect(url_for("index")) # перенаправляет юзера на главную страницу
  return render_template("register.html", form=form)