let debounceTimer;

// Глобальные функции
function addFlight() {
    const flightContainer = document.getElementById('flights-container');
    const newFlight = document.createElement('div');
    newFlight.classList.add('flight-card');
    newFlight.innerHTML = `
        <button class="remove-btn">✖</button>
        <div class="mb-2">
            <input type="text" class="form-control city-input" placeholder="Откуда">
            <ul class="suggestions"></ul>
        </div>
        <div class="mb-2">
            <input type="text" class="form-control city-input" placeholder="Куда">
            <ul class="suggestions"></ul>
        </div>
        <div class="mb-2">
            <input type="date" class="form-control date-input" min="" max="2100-12-31">
        </div>
    `;
    flightContainer.appendChild(newFlight);

    // Подключение обработчиков для нового элемента
    setupFlightCard(newFlight);
    flightContainer.scrollTop = flightContainer.scrollHeight;
}

function removeFlight(button) {
    button.parentElement.remove();
}

function goNext() {
    const flightCards = document.querySelectorAll('.flight-card');
    const flights = [];

    flightCards.forEach(card => {
        const inputs = card.querySelectorAll('input');
        const from = inputs[0].value.trim();
        const to = inputs[1].value.trim();
        const date = inputs[2].value;

        if (from && to && date) {
            flights.push({ from, to, date });
        }
    });

    localStorage.setItem("flights", JSON.stringify(flights));
    window.location.href = "/routes";
}

// Вспомогательные функции
function setupFlightCard(card) {
    // Обработчик для кнопки удаления
    card.querySelector('.remove-btn').addEventListener('click', function() {
        removeFlight(this);
    });
    
    // Подключение автоподстановки городов
    attachCityAutocompleteEvents(card.querySelectorAll('.city-input'));
    
    // Установка ограничений даты
    const dateInputs = card.querySelectorAll('.date-input');
    const today = new Date();
    const todayFormatted = formatDateForInput(today);
    
    dateInputs.forEach(input => {
        input.min = todayFormatted;
        input.max = "2100-12-31";
        input.addEventListener('change', validateDateInput);
        input.addEventListener('input', handleManualDateInput);
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
        input.classList.remove('is-invalid');
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

    flights.forEach(({ from, to, date }) => {
        const card = document.createElement('div');
        card.classList.add('flight-card');
        card.innerHTML = `
            <button class="remove-btn">✖</button>
            <div class="mb-2">
                <input type="text" class="form-control city-input" placeholder="Откуда" value="${from}">
                <ul class="suggestions"></ul>
            </div>
            <div class="mb-2">
                <input type="text" class="form-control city-input" placeholder="Куда" value="${to}">
                <ul class="suggestions"></ul>
            </div>
            <div class="mb-2">
                <input type="date" class="form-control date-input" value="${date}" min="" max="2100-12-31">
            </div>
        `;
        container.appendChild(card);
        setupFlightCard(card);
    });
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", () => {
    // Восстановление сохраненных рейсов
    restoreSavedFlights();
    
    // Привязка обработчиков для кнопок добавления и перехода
    document.getElementById('add-flight-btn')?.addEventListener('click', addFlight);
    document.getElementById('next-btn')?.addEventListener('click', goNext);
});