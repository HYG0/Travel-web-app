document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("flight-summary");
    const flights = JSON.parse(localStorage.getItem("flights")) || [];

    flights.forEach((flight, index) => {
        const block = document.createElement("div");
        block.className = "flight-block";

        block.innerHTML = `
            <div class="flight-route">${flight.from} – ${flight.to}</div>
            <div class="flight-date">${formatDate(flight.date)}</div>
            <button class="select-hotel-btn" data-city="${flight.to}">Выбрать отель</button>
        `;

        container.appendChild(block);

        if (index < flights.length - 1) {
            const divider = document.createElement("div");
            divider.className = "divider";
            container.appendChild(divider);
        }
    });

    const savedSelections = JSON.parse(localStorage.getItem("flightsData")) || {};
    const flightsList = JSON.parse(localStorage.getItem("flights")) || [];

    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    const profileCircle = document.getElementById("profile-circle");
    if (userData.avatar) {
        profileCircle.style.backgroundImage = `url(${userData.avatar})`;
    } else {
        profileCircle.textContent = "Профиль";
    }

    initFlightNumbers();
    localStorage.setItem("flightNumbersInit", "true");
    renderFlights(flightsList, savedSelections);

    const saveRouteButton = document.querySelector(".save-route-link");
    if (!saveRouteButton) {
        console.error("Ошибка: кнопка сохранения маршрута не найдена в DOM!");
        return;
    }

    // Обработчик кнопки сохранения маршрута
    saveRouteButton.addEventListener("click", () => {
        const flights = JSON.parse(localStorage.getItem("flights")) || [];
        const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};

        const allTimesSelected = flights.every(flight => {
            const flightId = `${flight.from}-${flight.to}-${flight.date}`.replace(/\s+/g, '-');
            return flightsData[flightId]?.selectedIndex !== undefined;
        });

        if (allTimesSelected || flights.length === 0) {
            window.location.href = "/profile";
        } else {
            showCustomAlert("Пожалуйста, выберите время для всех рейсов перед сохранением маршрута.");
        }
    });

    // Обработчик кнопки "Выбрать отель"
    const hotelButtons = document.querySelectorAll(".select-hotel-btn");
    hotelButtons.forEach(button => {
        button.addEventListener("click", () => {
            const city = button.getAttribute("data-city");
            const modalTitle = document.getElementById("modalCity");
            modalTitle.textContent = city;

            const hotelModal = new bootstrap.Modal(document.getElementById("hotelModal"));
            hotelModal.show();

            // Обработчики для кнопок выбора отеля в модальном окне
            const selectHotelButtons = document.querySelectorAll(".select-hotel");
            selectHotelButtons.forEach(btn => {
                btn.onclick = () => {
                    const hotelName = btn.parentElement.querySelector("h6").textContent;
                    showCustomAlert(`Выбран отель: ${hotelName}`);
                    hotelModal.hide();
                };
            });
        });
    });

    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

    function initFlightNumbers() {
        const currentFlightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
        const flights = JSON.parse(localStorage.getItem("flights")) || [];

        flights.forEach(flight => {
            const flightKey = `${flight.from}-${flight.to}-${flight.date}`.replace(/\s+/g, '-');
            if (!currentFlightsData[`times_${flightKey}`]) {
                currentFlightsData[`times_${flightKey}`] = generateFlightTimes(flightKey);
            }
        });

        localStorage.setItem("flightsData", JSON.stringify(currentFlightsData));
    }

    function generateFlightTimes(flightId) {
        const airline = ['SU', 'S7', 'U6'][Math.floor(Math.random() * 3)];
        const baseNum = Math.floor(Math.random() * 900) + 100;
        return [
            { departure: "08:00", arrival: "10:00", number: `${airline}${baseNum}A` },
            { departure: "12:00", arrival: "14:00", number: `${airline}${baseNum}B` },
            { departure: "16:00", arrival: "18:00", number: `${airline}${baseNum}C` }
        ];
    }

    function renderFlights(flights, savedData) {
        container.innerHTML = '';

        flights.forEach((flight, i) => {
            const flightId = `${flight.from}-${flight.to}-${flight.date}`.replace(/\s+/g, '-');

            if (!savedData[`times_${flightId}`]) {
                savedData[`times_${flightId}`] = generateFlightTimes(flightId);
                localStorage.setItem("flightsData", JSON.stringify(savedData));
            }

            const times = savedData[`times_${flightId}`];

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
            container.appendChild(flightBlock);

            if (i < flights.length - 1) {
                container.appendChild(document.createElement("hr"));
            }
        });
    }

    function renderTimeSlots(block, flightId, times, savedData) {
        const slotsContainer = block.querySelector(".time-slots");

        times.forEach((time, index) => {
            const slot = document.createElement("div");
            slot.className = "time-slot";
            if (savedData[flightId]?.selectedIndex === index) {
                slot.classList.add("selected", "centered");
            }
            slot.innerHTML = `
                <span class="time">${time.departure}-${time.arrival}</span>
                <span class="flight-num">${time.number}</span>
                <span class="price">15000₽</span>
            `;
            slot.addEventListener("click", () => {
                if (!slot.classList.contains("selected")) {
                    selectTimeSlot(block, flightId, index);
                }
            });
            slotsContainer.appendChild(slot);
        });

        if (savedData[flightId]?.selectedIndex !== undefined) {
            selectTimeSlot(block, flightId, savedData[flightId].selectedIndex, true);
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
            currentData[flightId] = { selectedIndex: index };
            if (!currentData[`times_${flightId}`]) {
                currentData[`times_${flightId}`] = generateFlightTimes(flightId);
            }
            localStorage.setItem("flightsData", JSON.stringify(currentData));
        }
    }

    function resetSelection(block, flightId) {
        const allSlots = block.querySelectorAll(".time-slot");

        allSlots.forEach(slot => {
            slot.classList.remove("selected", "centered", "hidden");
        });

        const cancelBtn = block.querySelector(".cancel-btn");
        if (cancelBtn) cancelBtn.remove();

        const currentData = JSON.parse(localStorage.getItem("flightsData")) || {};
        delete currentData[flightId]?.selectedIndex;
        localStorage.setItem("flightsData", JSON.stringify(currentData));
    }

    function formatDate(dateString) {
        const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
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
        }, 2500); // Уведомление исчезает через 2.5 секунды
    }
});