// Очистка консоли (для отладки)
console.clear();

// Получаем кнопки "Войти" и "Зарегистрироваться" по их ID
const loginBtn = document.getElementById('login');
const signupBtn = document.getElementById('signup');

// Добавляем обработчик события для кнопки "Войти"
loginBtn.addEventListener('click', (e) => {
    // Получаем родительский элемент кнопки "Войти" (это блок формы входа)
    let parent = e.target.parentNode.parentNode;

    // Проверяем, есть ли у родительского элемента класс "slide-up"
    Array.from(parent.classList).find((element) => {
        if (element !== "slide-up") {
            // Если класс "slide-up" отсутствует, добавляем его
            parent.classList.add('slide-up');
        } else {
            // Если класс "slide-up" уже есть, добавляем его к форме регистрации
            signupBtn.parentNode.classList.add('slide-up');
            // И удаляем его у формы входа
            parent.classList.remove('slide-up');
        }
    });
});

// Добавляем обработчик события для кнопки "Зарегистрироваться"
signupBtn.addEventListener('click', (e) => {
    // Получаем родительский элемент кнопки "Зарегистрироваться" (это блок формы регистрации)
    let parent = e.target.parentNode;

    // Проверяем, есть ли у родительского элемент класс "slide-up"
    Array.from(parent.classList).find((element) => {
        if (element !== "slide-up") {
            // Если класс "slide-up" отсутствует, добавляем его
            parent.classList.add('slide-up');
        } else {
            // Если класс "slide-up" уже есть, добавляем его к форме входа
            loginBtn.parentNode.parentNode.classList.add('slide-up');
            // И удаляем его у формы регистрации
            parent.classList.remove('slide-up');
        }
    });
});

// Функция для показа уведомления
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;

    // Устанавливаем цвет уведомления
    if (isError) {
        notification.classList.add('error'); // Добавляем класс для ошибки (красный цвет)
    } else {
        notification.classList.remove('error'); // Убираем класс для ошибки
    }

    // Показываем уведомление
    notification.classList.add('show');

    // Через 2 секунды скрываем уведомление
    setTimeout(() => {
        notification.classList.remove('show');
    }, 1500);
}

// Обработчик кнопки "Зарегистрироваться"
const signupSubmitBtn = document.querySelector('.signup .submit-btn');
signupSubmitBtn.addEventListener('click', () => {
    // Получаем значения полей формы
    const nameInput = document.querySelector('.signup .form-holder input[type="text"]');
    const emailInput = document.querySelector('.signup .form-holder input[type="email"]');
    const passwordInput = document.querySelector('.signup .form-holder input[type="password"]');

    // Проверяем, заполнены ли все поля
    if (nameInput.value.trim() === '' || emailInput.value.trim() === '' || passwordInput.value.trim() === '') {
        // Если хотя бы одно поле не заполнено, показываем сообщение об ошибке
        showNotification('Пожалуйста, заполните все поля!', true); // isError = true
    } 
    // Проверка корректности Email
    else if (!emailInput.value.includes('@')) {
        // Если в Email нет символа @, показываем ошибку
        showNotification('Некорректный Email! Введите правильный адрес.', true);}
    else {
        // Если все поля заполнены, показываем сообщение об успешной регистрации
        showNotification('Вы успешно зарегистрированы!');

        // Переключаем пользователя на форму входа через 1.5 секунды
        setTimeout(() => {
            signupBtn.parentNode.classList.add('slide-up');
            loginBtn.parentNode.parentNode.classList.remove('slide-up');
        }, 1500);
    }
});

//обработчик кнопки "Войти"
const loginSubmitBtn = document.querySelector('.login .submit-btn');
loginSubmitBtn.addEventListener('click', () => {
    const emailInput = document.querySelector('.login .form-holder input[type="email"]');
    const passwordInput = document.querySelector('.login .form-holder input[type="password"]');

    if (emailInput.value.trim() === '' || passwordInput.value.trim() === '') {
        showNotification('Пожалуйста, заполните все поля для входа!', true);
    } else if (!emailInput.value.includes('@')) {
        showNotification('Некорректный Email для входа! Введите правильный адрес.', true);
    } else {
        showNotification('Успешный вход!');

        setTimeout(() => {
            window.location.href = '/index';  // <-- Переход на главную через 1.5 сек
        }, 1500);
    }
});