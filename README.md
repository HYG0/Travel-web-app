# ✈️ Create & Travel — планировщик путешествий

> Веб-приложение для удобного планирования поездок: ищите авиабилеты и отели, составляйте маршрут и сохраняйте всё в личном кабинете.

---

## 🌟 Возможности

| Функция | Описание |
|---|---|
| 🔐 **Регистрация и вход** | Создайте аккаунт по email и паролю — все ваши маршруты сохраняются |
| ✈️ **Поиск авиабилетов** | Находите рейсы по направлению, дате и бюджету; фильтр по цене; поддержка RUB / USD / EUR |
| 🏨 **Поиск отелей** | Подбор отелей категорий ★★★, ★★★★ и ★★★★★ в пункте назначения |
| 🗺️ **Составление маршрута** | Добавляйте несколько перелётов в один план поездки |
| 👤 **Личный кабинет** | Просматривайте и удаляйте сохранённые маршруты, загружайте аватар |
| 📄 **Экспорт в PDF** | Скачайте свой маршрут одним кликом |
| 📰 **Полезные статьи** | Подборка советов по путешествиям прямо на главной странице |

---

## 🛠️ Технологии

**Бэкенд**
- [Python 3](https://www.python.org/) + [Flask](https://flask.palletsprojects.com/) — основной веб-фреймворк
- [SQLAlchemy](https://www.sqlalchemy.org/) + [Flask-Migrate](https://flask-migrate.readthedocs.io/) — база данных (SQLite)
- [geopy](https://geopy.readthedocs.io/), [airportsdata](https://github.com/mborsetti/airportsdata), [timezonefinder](https://github.com/jannikmi/timezonefinder) — геолокация и часовые пояса

**Фронтенд**
- HTML, SCSS/CSS, JavaScript
- [Bootstrap 5](https://getbootstrap.com/) — адаптивная вёрстка
- [Sass](https://sass-lang.com/) + [Node.js / npm](https://nodejs.org/) — сборка стилей

**Внешние сервисы**
- [Aviasales / Travelpayouts API](https://www.travelpayouts.com/) — данные об авиабилетах
- [Hotellook API](https://hotellook.com/) — данные об отелях

---

## 💻 Как запустить на своём компьютере

### Что нужно установить заранее

1. **Python 3.10+** — [python.org/downloads](https://www.python.org/downloads/)
2. **Node.js 18+ (включает npm)** — [nodejs.org](https://nodejs.org/)
3. **Git** — [git-scm.com](https://git-scm.com/)

---

### Пошаговая инструкция

**Шаг 1 — Скачайте проект**

```bash
git clone https://github.com/HYG0/Travel-web-app.git
cd Travel-web-app
```

**Шаг 2 — Создайте виртуальное окружение и установите Python-зависимости**

```bash
# Создать окружение
python3 -m venv .venv

# Активировать окружение
# macOS / Linux:
source .venv/bin/activate
# Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Установить зависимости
pip install -r requirements.txt
```

**Шаг 3 — Установите Node.js-зависимости и соберите стили**

```bash
npm install
npm run build
```

**Шаг 4 — Инициализируйте базу данных**

```bash
flask db upgrade
```

> Если команда `flask` не найдена, убедитесь, что виртуальное окружение активировано (шаг 2).

**Шаг 5 — Запустите приложение**

```bash
flask run
```

Откройте браузер и перейдите по адресу: **http://localhost:5000**

---

### Удобный режим разработки (авто-пересборка стилей)

```bash
npm run dev
```

Приложение запустится на **http://localhost:5000**, а стили будут пересобираться автоматически при каждом изменении.

---

## ❓ Вопросы и обратная связь

Нашли ошибку или хотите предложить улучшение? Создайте Issue:
👉 [github.com/HYG0/Travel-web-app/issues](https://github.com/HYG0/Travel-web-app/issues)


