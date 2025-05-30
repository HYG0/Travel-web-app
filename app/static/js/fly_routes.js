document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("flight-summary");
    const loadingIndicator = container.querySelector(".loading");
    const flights = JSON.parse(localStorage.getItem("flights")) || [];

    // Функция для генерации ключа
    function generateFlightKey(flight) {
        return `${flight.from}-${flight.to}-${flight.date}`;
    }

    // Показываем индикатор загрузки
    loadingIndicator.classList.remove("hidden");

    // Инициализация и рендеринг без искусственной задержки
    await initFlightNumbers();
    localStorage.setItem("flightNumbersInit", "true");
    await renderFlights(flights);

    // Скрываем индикатор после рендеринга
    loadingIndicator.classList.add("hidden");

    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    const profileCircle = document.getElementById("profile-circle");
    if (userData.avatar) {
        profileCircle.style.backgroundImage = `url(${userData.avatar})`;
    } else {
        profileCircle.textContent = "Профиль";
    }

    const saveRouteButton = document.querySelector(".save-route-link");
    if (!saveRouteButton) {
        console.error("Ошибка: кнопка сохранения маршрута не найдена в DOM!");
        return;
    }

    // Обработчик кнопки сохранения маршрута
    saveRouteButton.addEventListener("click", async () => {
        const flights = JSON.parse(localStorage.getItem("flights")) || [];
        const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};

        const allTimesSelected = flights.every((flight) => {
            const flightId = generateFlightKey(flight);
            return flightsData[`times_${flightId}`]?.selectedIndex !== undefined;
        });

        if (allTimesSelected || flights.length === 0) {
            const allCards = document.querySelectorAll(".flight-block");
            const sendPromises = Array.from(allCards).map((card) => sendSingleRoute(card));
            await Promise.all(sendPromises);
            window.location.href = "/profile";
        } else {
            showCustomAlert("Пожалуйста, выберите время для всех рейсов перед сохранением маршрута.");
        }
    });

    // Обработчик кнопки "Выбрать отель" теперь в renderFlights
    // (оставляем пустым здесь, так как будет вызываться динамически)
    // Обработчик кнопки "Выбрать отель"
    const hotelButtons = document.querySelectorAll(".select-hotel-btn");
    hotelButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const city = button.getAttribute("data-city");
            const modalTitle = document.getElementById("modalCity");
            modalTitle.textContent = city;

            const hotelModal = new bootstrap.Modal(document.getElementById("hotelModal"));
            hotelModal.show();

            const selectHotelButtons = document.querySelectorAll(".select-hotel-option");
            selectHotelButtons.forEach((btn) => {
                btn.onclick = () => {
                    const hotelName = btn.parentElement.querySelector("h6").textContent;
                    showCustomAlert(`Выбран отель: ${hotelName}`);
                    hotelModal.hide();
                };
            });
        });
    });

    async function initFlightNumbers() {
        const currentFlightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
        const flights = JSON.parse(localStorage.getItem("flights")) || [];

        for (const flight of flights) {
            const flightId = generateFlightKey(flight);
            if (!currentFlightsData[`times_${flightId}`]) {
                const options = await fetchFlightOptions(flight.from, flight.to, flight.date);
                currentFlightsData[`times_${flightId}`] = { times: options, selectedIndex: undefined };
            }
        }

        localStorage.setItem("flightsData", JSON.stringify(currentFlightsData));
    }

    async function fetchFlightOptions(from, to, date) {
        try {
            const cleanCity = (city) => city.split(",")[0].trim();
            const params = new URLSearchParams({
                origin: cleanCity(from),
                destination: cleanCity(to),
                departure_at: date,
                one_way: "true",
            });

            const response = await fetch(`/api/search_flights?${params}`);
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Ошибка загрузки данных");
            }

            const { data } = await response.json();

            return data.map((flight) => {
                const departureTime = new Date(flight.departure_at);
                const arrivalTime = new Date(flight.arrival_at);

                return {
                    departure: departureTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
                    arrival: arrivalTime.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
                    number: `${flight.airline}${flight.flight_number}`,
                    price: flight.price,
                };
            });
        } catch (error) {
            console.error("Ошибка получения рейсов:", error);
            return [];
        }
    }

    async function renderFlights(flights) {
        const savedData = JSON.parse(localStorage.getItem("flightsData")) || {};
        container.innerHTML = ""; // Очищаем только после загрузки

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < flights.length; i++) {
            const flight = flights[i];
            const flightId = generateFlightKey(flight);

            if (!savedData[`times_${flightId}`]) {
                const times = await fetchFlightOptions(flight.from, flight.to, flight.date);
                savedData[`times_${flightId}`] = { times: times, selectedIndex: undefined };
                localStorage.setItem("flightsData", JSON.stringify(savedData));
            }

            const times = savedData[`times_${flightId}`].times;

            const flightBlock = document.createElement("div");
            flightBlock.className = "flight-block";
            flightBlock.dataset.flightId = flightId;

            flightBlock.innerHTML = `
                <div class="route-info">
                    <div class="city from-city">${flight.from}</div>
                    <div class="arrow">→</div>
                    <div class="city to-city">${flight.to}</div>
                </div>
                <div class="flight-date">${formatDate(flight.date)}</div>
                <div class="time-options">
                    <div class="time-slots"></div>
                </div>
                <button class="select-hotel-btn" data-city="${flight.to}">Выбрать отель</button>
            `;

            renderTimeSlots(flightBlock, flightId, times, savedData);
            fragment.appendChild(flightBlock);

            if (i < flights.length - 1) {
                fragment.appendChild(document.createElement("hr"));
            }
        }

        // Инициализация обработчиков для кнопок "Выбрать отель" после рендера
        const hotelButtons = container.querySelectorAll(".select-hotel-btn");
        hotelButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const city = button.getAttribute("data-city");
                const modalTitle = document.getElementById("modalCity");
                modalTitle.textContent = city;

                const hotelModal = new bootstrap.Modal(document.getElementById("hotelModal"));
                hotelModal.show();

                const selectHotelButtons = document.querySelectorAll(".select-hotel-option");
                selectHotelButtons.forEach((btn) => {
                    btn.onclick = () => {
                        const hotelName = btn.parentElement.querySelector("h6").textContent;
                        showCustomAlert(`Выбран отель: ${hotelName}`);
                        hotelModal.hide();
                    };
                });
            });
        });

        container.appendChild(fragment);
    }

    function renderTimeSlots(block, flightId, times, savedData) {
        const slotsContainer = block.querySelector(".time-slots");

        times.forEach((time, index) => {
            const slot = document.createElement("div");
            slot.className = "time-slot";
            if (savedData[`times_${flightId}`]?.selectedIndex === index) {
                slot.classList.add("selected", "centered");
            }
            slot.innerHTML = `
                <span class="time">${time.departure}-${time.arrival}</span>
                <span class="flight-num">${time.number}</span>
                <span class="price">${time.price}₽</span>
            `;
            slot.addEventListener("click", () => {
                if (!slot.classList.contains("selected")) {
                    selectTimeSlot(block, flightId, index);
                }
            });
            slotsContainer.appendChild(slot);
        });

        if (savedData[`times_${flightId}`]?.selectedIndex !== undefined) {
            selectTimeSlot(block, flightId, savedData[`times_${flightId}`].selectedIndex, true);
        }
    }

    function selectTimeSlot(block, flightId, index, silent = false) {
        const allSlots = block.querySelectorAll(".time-slot");

        allSlots.forEach((slot, i) => {
            slot.classList.toggle("hidden", i !== index);
            slot.classList.toggle("selected", i === index);
            slot.classList.toggle("centered", i === index);
        });

        if (!block.querySelector(".cancel-btn")) {
            const cancelBtn = document.createElement("div");
            cancelBtn.className = "cancel-btn";
            cancelBtn.textContent = "Отменить выбор";
            cancelBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                resetSelection(block, flightId);
            });
            block.querySelector(".time-options").appendChild(cancelBtn);
        }

        if (!silent) {
            const currentData = JSON.parse(localStorage.getItem("flightsData")) || {};
            if (!currentData[`times_${flightId}`]) {
                currentData[`times_${flightId}`] = { times: [], selectedIndex: undefined };
            }
            currentData[`times_${flightId}`].selectedIndex = index;
            localStorage.setItem("flightsData", JSON.stringify(currentData));
        }
    }

    function resetSelection(block, flightId) {
        const allSlots = block.querySelectorAll(".time-slot");

        allSlots.forEach((slot) => {
            slot.classList.remove("selected", "centered", "hidden");
        });

        const cancelBtn = block.querySelector(".cancel-btn");
        if (cancelBtn) cancelBtn.remove();

        const currentData = JSON.parse(localStorage.getItem("flightsData")) || {};
        if (currentData[`times_${flightId}`]) {
            currentData[`times_${flightId}`].selectedIndex = undefined;
            localStorage.setItem("flightsData", JSON.stringify(currentData));
        }
    }

    function formatDate(dateString) {
        const months = [
            "янв", "фев", "мар", "апр", "мая", "июн",
            "июл", "авг", "сен", "окт", "ноя", "дек",
        ];
        const date = new Date(dateString);
        return `${date.getDate()} ${months[date.getMonth()]}`;
    }

    function showCustomAlert(message) {
        const alertBox = document.getElementById("custom-alert");
        const messageBox = document.getElementById("custom-alert-message");

        if (!alertBox || !messageBox) {
            console.error("Custom alert elements not found!");
            return;
        }

        messageBox.textContent = message;
        alertBox.classList.remove("hidden");
        alertBox.classList.add("show");

        setTimeout(() => {
            alertBox.classList.remove("show");
            setTimeout(() => alertBox.classList.add("hidden"), 300);
        }, 2500);
    }
});

function sendSingleRoute(card) {
    const fromCity = card.querySelector(".city.from-city")?.textContent.trim();
    const toCity = card.querySelector(".city.to-city")?.textContent.trim();
    const flightDate = card.querySelector(".flight-date")?.textContent.trim();
    const time = card.querySelector(".time-slot.selected .time")?.textContent.trim();
    const flightNumber = card.querySelector(".time-slot.selected .flight-num")?.textContent.trim();
    const priceStr = card.querySelector(".time-slot.selected .price")?.textContent.trim();

    console.log("DEBUG: ", { fromCity, toCity, flightDate, time, flightNumber, priceStr });

    if (!fromCity || !toCity || !flightDate || !time || !flightNumber || !priceStr) {
        console.warn("Недостаточно данных для маршрута.");
        return Promise.resolve();
    }

    const price = parseInt(priceStr.replace(/[^\d]/g, ""), 10);
    const [departureAt, arrivalAt] = time.split("-");

    const payload = {
        origin: fromCity,
        destination: toCity,
        departure_at: departureAt,
        arrival_at: arrivalAt,
        flight_number: flightNumber,
        price: price,
    };

    return fetch("/add_route", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
        .then((response) => {
            if (!response.ok) throw new Error("Ошибка при отправке");
            return response.json();
        })
        .then((data) => {
            console.log("Ответ сервера:", data);
        })
        .catch((error) => {
            console.error("Ошибка:", error);
        });
}