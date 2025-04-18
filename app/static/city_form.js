document.addEventListener("DOMContentLoaded", () => {
    updateDateLimits();
    document.querySelectorAll('.city-input').forEach(input => {
        input.addEventListener('input', () => fetchCitySuggestions(input));
    });
});

function updateDateLimits() {
    const today = new Date().toISOString().split("T")[0];
    document.querySelectorAll('.date-input').forEach(input => {
        input.min = today;
        input.max = "2100-12-31";
        input.addEventListener("change", () => validateDateInput(input));
    });
}

function validateDateInput(input) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(2100, 11, 31);
    let enteredDate = new Date(input.value);

    if (isNaN(enteredDate) || enteredDate < today) {
        input.value = today.toISOString().split("T")[0];
    } else if (enteredDate > maxDate) {
        input.value = maxDate.toISOString().split("T")[0];
    }
}

function addFlight() {
    const flightContainer = document.getElementById('flights-container');
    const newFlight = document.createElement('div');
    newFlight.classList.add('flight-card');
    newFlight.innerHTML = `
        <button class="remove-btn" onclick="removeFlight(this)">✖</button>
        <div class="mb-2">
            <input type="text" class="form-control city-input" placeholder="Откуда" oninput="fetchCitySuggestions(this)">
            <ul class="suggestions"></ul>
        </div>
        <div class="mb-2">
            <input type="text" class="form-control city-input" placeholder="Куда" oninput="fetchCitySuggestions(this)">
            <ul class="suggestions"></ul>
        </div>
        <div class="mb-2">
            <input type="date" class="form-control date-input" min="" max="2100-12-31">
        </div>
    `;
    flightContainer.appendChild(newFlight);
    updateDateLimits();
    flightContainer.scrollTop = flightContainer.scrollHeight;
}

function removeFlight(button) {
    button.parentElement.remove();
}

async function fetchCitySuggestions(input) {
    const query = input.value.trim();
    if (query.length < 2) return;

    const API_KEY = 'd8e72d7f0bbc4c86b1f2d65d6be067c9'; // Ваш ключ Geoapify
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${API_KEY}&type=city&lang=ru`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        showSuggestions(input, data.features);
    } catch (error) {
        console.error("Ошибка загрузки городов:", error);
    }
}

function showSuggestions(input, cities) {
    const suggestionsList = input.nextElementSibling;
    suggestionsList.innerHTML = "";

    cities.forEach(city => {
        const li = document.createElement("li");
        li.textContent = `${city.properties.city || city.properties.name}, ${city.properties.country}`;
        li.addEventListener("click", () => {
            input.value = city.properties.city || city.properties.name;
            suggestionsList.innerHTML = "";
        });
        suggestionsList.appendChild(li);
    });
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