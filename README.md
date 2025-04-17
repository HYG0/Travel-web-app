# It-проект: Веб-сервис планирования путешествий

## Для работы локально вам надо:
1. `git clone https://github.com/HYG0/Travel-web-app`
2. `cd Travel-web-app`
3. `git branch -M main`
4. `git pull`
После этих действий у вас должны появиться все файлы с github и ваша main ветка станет связана с удалённой main веткой
## Я сказал стартуем
**После подтягивания репозитория для запуска проекта вам нужно будет сделать это:**
1. Устанавливаем и активируем рабочее окружение venv:
    - `python3 -m venv .venv`
    - `source .venv/bin/activate`
2. Устанавливаем необходимые нам зависимости из корневой директории:
    `pip install -r requirements.txt`
3. Запускаем скрипт `./script.sh`, выдав перед этим ему права для выполнения `chmod +x ./script.sh`
3. Устанавливаем зависимости npm:
    - `npm install`
4. Зависимости установлены, можно собирать и запускать контейнер:
    - `make build` - сборка образа проекта
    - `make run-dev` - запуск контейнера с нашим приложением

Теперь все изменения, которые вы делаете локально отражаются как в докере, так и на `localhost:8080` в вашем браузере

Основные команды для работы с контейнером:
 - `make start` - запустить работу контейнера
 - `make stop` - остановить работу контейнера(пауза)
 - `make rm` - удалить контейнер
## Структура
![Снимок экрана 2025-03-18 000221 (1)](https://github.com/user-attachments/assets/292810ba-d9fe-4045-919c-0c8ddfd7eb4a)
- /app - директория проекта
- /app/static - здесь хранятся статические файлы: css, js, картинки. Всё, что нужно для работы сайта.
- /app/templates - директория шаблонов html страниц: основная страница (main.html), а также другие, по типу: страница авторизации, страница личного кабинета и т.п.
- /app/routes.py - маршруты backand'a для перенаправления адресов
- create_travel.py - файл запуска
## Как работаем совместно:
1. Переходите на рабочую ветку
`git switch branch-name`
*feature-styling-page* - если работаете с frontend'ом или *feature-backend* - если с backend'ом
2. Пишите код на своей ветке
3. Делаете commit:
- `git add modified-files` - добавляем изменённые вами файлы, они отображаются в `git status`
- `git commit -m "commit-name"`- создаём коммит
- `git push origin branch-name` - отправляем коммит
4. Проверяете черзе Github, что всё отправилось в удалённый репозиторий


