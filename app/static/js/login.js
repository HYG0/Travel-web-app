console.clear();

const loginBtn = document.getElementById('login');
const signupBtn = document.getElementById('signup');

loginBtn.addEventListener('click', (e) => {
    let parent = e.target.parentNode.parentNode;

    Array.from(parent.classList).find((element) => {
        if (element !== "slide-up") {
            parent.classList.add('slide-up');
        } else {
            signupBtn.parentNode.classList.add('slide-up');
            parent.classList.remove('slide-up');
        }
    });
});

signupBtn.addEventListener('click', (e) => {
    let parent = e.target.parentNode;

    Array.from(parent.classList).find((element) => {
        if (element !== "slide-up") {
            parent.classList.add('slide-up');
        } else {
            loginBtn.parentNode.parentNode.classList.add('slide-up');
            parent.classList.remove('slide-up');
        }
    });
});

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;

    if (isError) {
        notification.classList.add('error');
    } else {
        notification.classList.remove('error');
    }

    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 1500);
}

const signupSubmitBtn = document.querySelector('.signup .submit-btn');
signupSubmitBtn.addEventListener('click', () => {
    const nameInput = document.querySelector('.signup .form-holder input[type="text"]');
    const emailInput = document.querySelector('.signup .form-holder input[type="email"]');
    const passwordInput = document.querySelector('.signup .form-holder input[type="password"]');

    if (nameInput.value.trim() === '' || emailInput.value.trim() === '' || passwordInput.value.trim() === '') {
        showNotification('Пожалуйста, заполните все поля!', true);
        return;
    }
    if (!emailInput.value.includes('@')) {
        showNotification('Некорректный Email! Введите правильный адрес.', true);
        return;
    }

    // Отправляем данные регистрации на сервер
    fetch('/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            password: passwordInput.value.trim()
        })
    })
    .then(response => response.json().then(data => ({status: response.status, body: data})))
    .then(({status, body}) => {
        if (status === 201) {
            showNotification('Вы успешно зарегистрированы!');
            setTimeout(() => {
                signupBtn.parentNode.classList.add('slide-up');
                loginBtn.parentNode.parentNode.classList.remove('slide-up');
            }, 1500);
        } else {
            // Если ошибка - выводим первое сообщение из errors
            const errorMsg = body.errors ? Object.values(body.errors)[0] : 'Ошибка регистрации';
            showNotification(errorMsg, true);
        }
    })
    .catch(() => {
        showNotification('Ошибка сети. Попробуйте позже.', true);
    });
});

const loginSubmitBtn = document.querySelector('.login button.submit-btn');
if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', () => {
        const emailInput = document.querySelector('.login input[type="email"]');
        const passwordInput = document.querySelector('.login input[type="password"]');

        if (!emailInput || !passwordInput) {
            showNotification('Ошибка формы. Пожалуйста, обновите страницу.', true);
            return;
        }

        if (emailInput.value.trim() === '' || passwordInput.value.trim() === '') {
            showNotification('Пожалуйста, заполните все поля для входа!', true);
            return;
        }
        if (!emailInput.value.includes('@')) {
            showNotification('Некорректный Email для входа! Введите правильный адрес.', true);
            return;
        }

        fetch('/signin', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: emailInput.value.trim(),
                password: passwordInput.value.trim()
            })
        })
        .then(response => response.json().then(data => ({status: response.status, body: data})))
        .then(({status, body}) => {
            if (status === 200) {
                showNotification('Успешный вход!');
                setTimeout(() => {
                    window.location.href = '/profile';
                }, 1500);
            } else {
                const errorMsg = body.error || 'Ошибка входа';
                showNotification(errorMsg, true);
            }
        })
        .catch(() => {
            showNotification('Ошибка сети. Попробуйте позже.', true);
        });
    });
} else {
    console.error('Кнопка входа не найдена!');
}

// Функция для переключения видимости пароля
function setupPasswordToggle() {
    const passwordToggles = document.querySelectorAll('.password-toggle');
    
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const passwordInput = this.previousElementSibling;
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
}

// Вызываем функцию после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggle();
    
    // Остальной существующий код...
});