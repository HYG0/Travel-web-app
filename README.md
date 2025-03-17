# It-проект: Веб-сервис планирования путешествий

## Для работы локально вам надо:
1. git clone https://github.com/HYG0/Travel-web-app
2. git remote add origin https://github.com/HYG0/Travel-web-app
3. git branch -M main
После этих действий у вас должны появиться все файлы с github и ваша main ветка станет связана с удалённой main веткой 
## Как работаем совместно:
1. Создаёте себе ветку на которой вы будете работаете - git checkout -b feature-{название фичи}
2. Выполняете git push -u origin feture-{название фичи}
3. После этой команды другой разработчик сможет работать с вашей веткой, сделав git pull
3. Пишите код на этой ветке
4. Если всё работает (это ключевое условие), то переходим в ветку main и из неё делаем git merge feature-{название фичи}
5. После этого выполняем git push из main, тем самым отправив изменения в main ветку на github
## Структура
- /app - директория проекта
- /app/static - здесь хранятся статические файлы: css, js, картинки. Всё, что нужно для работы сайта.
- /app/templates - директория шаблонов html страниц: основная страница (main.html), а также другие, по типу: страница авторизации, страница личного кабинета и т.п.
- /app/routes.py - маршруты backand'a для перенаправления адресов
- create_travel.py - файл запуска
