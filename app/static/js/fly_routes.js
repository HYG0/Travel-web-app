document.addEventListener("DOMContentLoaded", () => {
    // Загрузка сохраненных данных
    const savedSelections = JSON.parse(localStorage.getItem("flightsData")) || {};
    const flightsList = JSON.parse(localStorage.getItem("flights")) || [];

    // Загрузка аватара в кружок профиля
    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    const profileCircle = document.getElementById("profile-circle");
    if (userData.avatar) {
        profileCircle.style.backgroundImage = `url(${userData.avatar})`;
    } else {
        profileCircle.textContent = "Профиль";
    }

    // Инициализация номеров рейсов
    initFlightNumbers();
    localStorage.setItem("flightNumbersInit", "true");

    // Обработчик кнопки "Назад"
    document.querySelector(".back-button").addEventListener("click", (e) => {
        e.preventDefault();
        saveCurrentSelection();
        window.location.href = "/entry"; // Исправлено с /profile на /entry
    });

    // Отрисовка всех рейсов
    renderFlights(flightsList, savedSelections);

    // Основные функции
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
        const container = document.getElementById("flight-summary");
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
        const slotsContainer = block.querySelector(".time-slots");
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
            console.log("Updated flightData:", currentData);
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

    function saveCurrentSelection() {
        const currentData = JSON.parse(localStorage.getItem("flightsData")) || {};
        
        document.querySelectorAll(".flight-block").forEach(block => {
            const flightId = block.dataset.flightId;
            const selectedIndex = [...block.querySelectorAll(".time-slot")].findIndex(
                slot => slot.classList.contains("selected")
            );
            
            if (selectedIndex > -1) {
                currentData[flightId] = { selectedIndex };
                if (!currentData[`times_${flightId}`]) {
                    currentData[`times_${flightId}`] = generateFlightTimes(flightId);
                }
            } else {
                delete currentData[flightId]?.selectedIndex;
            }
        });
        
        localStorage.setItem("flightsData", JSON.stringify(currentData));
        console.log("Saved flightData:", currentData);
    }

    function formatDate(dateString) {
        const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        const date = new Date(dateString);
        return `${date.getDate()} ${months[date.getMonth()]}`;
    }
});