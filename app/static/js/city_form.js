let debounceTimer;

// Добавим стили для уведомления и подсветки ошибок
document.addEventListener("DOMContentLoaded", () => {
    const style = document.createElement('style');
    style.textContent = `
        #custom-alert {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #ff4d4f;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            display: none;
            font-family: Arial, sans-serif;
            max-width: 400px;
            width: 90%;
        }
        #custom-alert.show {
            display: flex;
            animation: fadeIn 0.3s ease-in;
        }
        #custom-alert.hidden {
            display: none;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        #custom-alert-message {
            flex-grow: 1;
            text-align: center;
        }
        #custom-alert-close {
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            cursor: pointer;
            margin-left: 10px;
        }
        .is-invalid {
            border: 1px solid #ff4d4f !important;
            background-color: #fff0f0;
        }
        .flight-results {
            margin-top: 20px;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        .flight-item {
            margin-bottom: 10px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
    `;
    document.head.appendChild(style);
});

// Глобальные функции
function addFlight() {
    const flightContainer = document.getElementById('flights-container');
    const newFlight = document.createElement('div');
    newFlight.classList.add('flight-card');
    newFlight.innerHTML = `
        <button class="remove-btn">✖</button>
        <div class="mb-2">
            <input type="text" class="form-control city-input from-city" placeholder="Откуда" required>
            <ul class="suggestions"></ul>
        </div>
        <div class="mb-2">
            <input type="text" class="form-control city-input to-city" placeholder="Куда" required>
            <ul class="suggestions"></ul>
        </div>
        <div class="mb-2">
            <input type="date" class="form-control date-input" min="" max="2100-12-31" required>
        </div>
        <div class="mb-2">
            <label>Диапазон стоимости билета</label>
            <div class="d-flex gap-2">
                <input type="number" class="form-control cost-min-input" placeholder="От" step="0.01" min="0">
                <input type="number" class="form-control cost-max-input" placeholder="До" step="0.01" min="0">
            </div>
        </div>
        <div class="mb-2">
            <label>Выбор валюты для оплаты</label>
            <select class="form-control currency-input">
                <option value="RUB">RUB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
            </select>
        </div>
    `;
    flightContainer.appendChild(newFlight);

    setupFlightCard(newFlight);
    updateRemoveButtons(); // Обновляем видимость кнопок после добавления
    flightContainer.scrollTop = flightContainer.scrollHeight;
}

function removeFlight(button) {
    button.parentElement.remove();
    updateRemoveButtons(); // Обновляем видимость кнопок после удаления
}

async function goNext() {
    const flightCards = document.querySelectorAll('.flight-card');
    const flights = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let hasInvalidFields = false;
    let hasInvalidDate = false;
    let hasInvalidCost = false;

    // Очистка устаревших данных в flightsData для всех рейсов
    const currentFlightsData = JSON.parse(localStorage.getItem("flightsData")) || {};

    for (const card of flightCards) {
        // Используем селекторы по классам вместо индексов
        const fromInput = card.querySelector('.from-city');
        const toInput = card.querySelector('.to-city');
        const dateInput = card.querySelector('.date-input');
        const costMinInput = card.querySelector('.cost-min-input');
        const costMaxInput = card.querySelector('.cost-max-input');
        const currencyInput = card.querySelector('.currency-input');

        const from = fromInput.value.trim();
        const to = toInput.value.trim();
        const date = dateInput.value;
        const costMin = parseFloat(costMinInput.value) || 0;
        const costMax = parseFloat(costMaxInput.value) || Infinity;
        const currency = currencyInput.value;

        // Валидация полей
        if (!from || !to) {
            hasInvalidFields = true;
            if (!from) fromInput.classList.add('is-invalid');
            if (!to) toInput.classList.add('is-invalid');}
        if (!date) {
            hasInvalidDate = true;
            dateInput.classList.add('is-invalid');
        } else {
            const inputDate = new Date(date);
            inputDate.setHours(0, 0, 0, 0);

            if (inputDate < today) {
                hasInvalidDate = true;
                dateInput.classList.add('is-invalid');
            } else if (costMin > costMax) {
                hasInvalidCost = true;
                costMinInput.classList.add('is-invalid');
                costMaxInput.classList.add('is-invalid');
            } else {
                // Запрос к API для получения реальных данных
                const response = await fetch(`/api/search_flights?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&departure_at=${date}&currency=${currency}&cost_min=${costMin}&cost_max=${costMax}`);
                const searchResults = await response.json();

                if (!response.ok) {
                    showCustomAlert('Ошибка поиска рейсов');
                    return;
                }

                if (!searchResults.data || searchResults.data.length === 0) {
                    showCustomAlert('Рейсы в заданном диапазоне цен не найдены');
                    return;
                }

                // Очистка устаревших данных для текущего flightId
                const flightId = `${from}-${to}-${date}`;
                if (currentFlightsData[`times_${flightId}`]) {
                    delete currentFlightsData[`times_${flightId}`];
                }

                // Используем данные из API для формирования объекта flight
                // const firstFlight = searchResults.data[0]; // Берем первый рейс для получения origin и destination
                flights.push({
                    from: `${fromInput.value}`, // Сохраняем пользовательский ввод для отображения
                    to: `${toInput.value}`,     // Сохраняем пользовательский ввод для отображения
                    date,
                    costMin,
                    costMax,
                    currency,
                    available_flights: searchResults.data // Сохраняем все рейсы
                });
            }
        }
    }

    if (hasInvalidFields) {
        showCustomAlert("Заполните поля 'Откуда' и 'Куда'");
        return;
    }

    if (hasInvalidDate) {
        showCustomAlert("Введите дату или выберите корректную дату");
        return;
    }

    if (hasInvalidCost) {
        showCustomAlert("Минимальная стоимость не может превышать максимальную");
        return;
    }

    // Сохраняем обновленные данные flightsData
    localStorage.setItem("flightsData", JSON.stringify(currentFlightsData));
    localStorage.setItem("flights", JSON.stringify(flights));
    window.location.href = "/routes";
}

// Новая функция для управления видимостью кнопок удаления
function updateRemoveButtons() {
    const flightCards = document.querySelectorAll('.flight-card');
    if (flightCards.length === 0) return;

    flightCards.forEach((card, index) => {
        const removeBtn = card.querySelector('.remove-btn');
        if (removeBtn) {
            // Скрываем крестик у первого перелёта, если он единственный
            removeBtn.style.display = (flightCards.length === 1 && index === 0) ? 'none' : 'flex';
        }
    });
}

// Вспомогательные функции
function showCustomAlert(message) {
    let alertBox = document.getElementById("custom-alert");
    let messageBox = document.getElementById("custom-alert-message");
    let closeBtn = document.getElementById("custom-alert-close");

    if (!alertBox || !messageBox || !closeBtn) {
        const alertContainer = document.createElement('div');
        alertContainer.id = "custom-alert";
        alertContainer.classList.add('hidden');
        alertContainer.innerHTML = `
            <span id="custom-alert-message"></span>
            <button id="custom-alert-close">✖</button>
        `;
        document.body.appendChild(alertContainer);

        alertBox = document.getElementById("custom-alert");
        messageBox = document.getElementById("custom-alert-message");
        closeBtn = document.getElementById("custom-alert-close");

        closeBtn.addEventListener("click", () => {
            alertBox.classList.remove("show");
            setTimeout(() => alertBox.classList.add("hidden"), 300);
        });
    }

    messageBox.textContent = message;
    alertBox.classList.remove("hidden");
    alertBox.classList.add("show");

    setTimeout(() => {
        alertBox.classList.remove("show");
        setTimeout(() => alertBox.classList.add("hidden"), 300);
    }, 2500);
}

function setupFlightCard(card) {
    card.querySelector('.remove-btn').addEventListener('click', function() {
        removeFlight(this);
    });
    
    attachCityAutocompleteEvents(card.querySelectorAll('.city-input'));
    
    const dateInputs = card.querySelectorAll('.date-input');
    const today = new Date();
    const todayFormatted = formatDateForInput(today);
    
    dateInputs.forEach(input => {
        input.min = todayFormatted;
        input.max = "2100-12-31";
        input.addEventListener('change', validateDateInput);
        input.addEventListener('input', handleManualDateInput);
    });

    const cityInputs = card.querySelectorAll('.city-input');
    cityInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.classList.remove('is-invalid');
            }
        });
    });

    const costInputs = card.querySelectorAll('.cost-min-input, .cost-max-input');
    costInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.value.trim()) {
                input.classList.remove('is-invalid');
            }
        });
    });
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function handleManualDateInput(e) {
    const input = e.target;
    if (!input.value) return;
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
        validateDateInput(e);
    }
}

function validateDateInput(e) {
    const input = e.target;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!input.value) {
        input.classList.add('is-invalid');
        return;
    }

    try {
        const inputDate = new Date(input.value);
        inputDate.setHours(0, 0, 0, 0);

        if (inputDate < today) {
            input.classList.add('is-invalid');
        } else {
            input.classList.remove('is-invalid');
            input.value = formatDateForInput(inputDate);
        }
    } catch {
        input.classList.add('is-invalid');
    }
}

function fetchCitySuggestions(input) {
    clearTimeout(debounceTimer);
    const query = input.value.trim();
    const suggestionsList = input.nextElementSibling;

    if (!query) {
        suggestionsList.innerHTML = '';
        return;
    }

    debounceTimer = setTimeout(() => {
        fetch(`/search_cities?q=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                suggestionsList.innerHTML = '';
                data.forEach(item => {
                    const li = document.createElement('li');
                    li.classList.add('list-group-item', 'list-group-item-action');
                    li.style.cursor = 'pointer';
                    li.textContent = `${item.name || "???"} (${item.code || "???"}) ${item.country_name || ""}`;
                    li.addEventListener('click', () => {
                        input.value = `${item.name || ""}, ${item.country_name || ""}`;
                        suggestionsList.innerHTML = '';
                    });
                    suggestionsList.appendChild(li);
                });
            });
    }, 200);
}

function attachCityAutocompleteEvents(inputs) {
    inputs.forEach(input => {
        input.addEventListener('input', () => fetchCitySuggestions(input));
        input.addEventListener('blur', () => {
            setTimeout(() => {
                const suggestionsList = input.nextElementSibling;
                if (suggestionsList) suggestionsList.innerHTML = '';
            }, 200);
        });
    });
}

function restoreSavedFlights() {
    const saved = localStorage.getItem("flights");
    if (!saved) return;

    const flights = JSON.parse(saved);
    const container = document.getElementById('flights-container');
    container.innerHTML = '';

    flights.forEach(({ from, to, date, costMin, costMax, currency }) => {
        const card = document.createElement('div');
        card.classList.add('flight-card');
        card.innerHTML = `
            <button class="remove-btn">✖</button>
            <div class="mb-2">
                <input type="text" class="form-control city-input from-city" placeholder="Откуда" value="${from}" required>
                <ul class="suggestions"></ul>
            </div>
            <div class="mb-2">
                <input type="text" class="form-control city-input to-city" placeholder="Куда" value="${to}" required>
                <ul class="suggestions"></ul>
            </div>
            <div class="mb-2">
                <input type="date" class="form-control date-input" value="${date || ''}" min="" max="2100-12-31" required>
            </div>
            <div class="mb-2">
                <label>Диапазон стоимости билета</label>
                <div class="d-flex gap-2">
                    <input type="number" class="form-control cost-min-input" placeholder="От" step="0.01" min="0" value="${costMin || ''}">
                    <input type="number" class="form-control cost-max-input" placeholder="До" step="0.01" min="0" value="${costMax || ''}">
                </div>
            </div>
            <div class="mb-2">
                <label>Выбор валюты для оплаты</label>
                <select class="form-control currency-input">
                    <option value="RUB" ${currency === 'RUB' ? 'selected' : ''}>RUB</option>
                    <option value="USD" ${currency === 'USD' ? 'selected' : ''}>USD</option>
                    <option value="EUR" ${currency === 'EUR' ? 'selected' : ''}>EUR</option>
                </select>
            </div>
        `;
        container.appendChild(card);
        setupFlightCard(card);
    });
    updateRemoveButtons(); // Обновляем видимость кнопок после восстановления
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    restoreSavedFlights();
    document.getElementById('add-flight-btn')?.addEventListener('click', addFlight);
    document.getElementById('next-btn')?.addEventListener('click', goNext);
    updateRemoveButtons(); // Инициализация видимости кнопок при загрузке
});
