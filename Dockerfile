FROM python:3.12-alpine

WORKDIR /travel-app

RUN apk update && apk add --no-cache bash vim npm nodejs

RUN npm install -g sass

# Установка зависимостей
COPY package*.json ./
RUN npm install --include=dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем весь app
COPY . .

# Сборка CSS
RUN npm run build

# Точка входа в приложение
ENV FLASK_APP=run.py

CMD [ "npm", "run", "dev" ]
