document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("flight-summary");
    const loadingIndicator = container.querySelector(".loading");
    let flights = JSON.parse(localStorage.getItem("flights")) || [];

    console.log("Flights from localStorage:", flights);

    if (!flights || flights.length === 0) {
        flights = [{
            from: "Москва, Россия",
            to: "Екатеринбург, Россия",
            from_airport: "SVO",
            to_airport: "SVX",
            date: "2025-05-30",
            costMin: 0,
            costMax: Infinity,
            currency: "RUB"
        }];
        localStorage.setItem("flights", JSON.stringify(flights));
        console.log("Added test flight:", flights);
    }

    loadingIndicator.classList.remove("hidden");

    await initFlightNumbers();
    localStorage.setItem("flightNumbersInit", "true");
    await renderFlights(flights);

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

    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("select-hotel-btn")) {
            console.log("Hotel button clicked!");
            const city = e.target.getAttribute("data-city");
            const checkInDate = e.target.getAttribute("data-check-in-date");
            const currency = e.target.getAttribute("data-currency");

            const modalTitle = document.getElementById("modalCity");
            if (!modalTitle) {
                console.error("Modal title element not found!");
                return;
            }
            modalTitle.textContent = city;

            const hotelModalElement = document.getElementById("hotelModal");
            if (!hotelModalElement) {
                console.error("Hotel modal element not found!");
                return;
            }
            const hotelModal = new bootstrap.Modal(hotelModalElement);
            const hotelOptions = document.getElementById("hotelOptions");
            if (!hotelOptions) {
                console.error("Hotel options element not found!");
                return;
            }
            hotelOptions.innerHTML = '<p class="text-center">Загрузка отелей...</p>';

            hotelModal.show();

            const hotels = await fetchHotels(city, checkInDate, '', currency);
            console.log("Hotels fetched:", hotels);

            if (hotels.error || !Array.isArray(hotels)) {
                hotelOptions.innerHTML = `<p class="text-danger text-center">${hotels.error || 'Не удалось загрузить отели'}</p>`;
                return;
            }

            const requiredRatings = [3, 4, 5];
            const availableRatings = [...new Set(hotels.map(hotel => hotel.stars))];
            const missingRatings = requiredRatings.filter(rating => !availableRatings.includes(rating));

            if (missingRatings.length > 0) {
                showCustomAlert(`Не удалось найти отели для всех запрошенных рейтингов. Отсутствуют: [${missingRatings.join(', ')}]`);
            }

            hotelOptions.innerHTML = '';
            hotels.forEach((hotel) => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `
                    <div class="hotel-rating">${'★'.repeat(hotel.stars)}${'☆'.repeat(5 - hotel.stars)}</div>
                    <h6><i class="fas fa-hotel hotel-icon"></i> ${hotel.name}</h6>
                    <p>Цена: <strong>${Math.ceil(hotel.price_per_night)} ${hotel.currency}/ночь</strong></p>
                    <button class="btn btn-primary btn-sm select-hotel-option" data-hotel-id="${hotel.hotel_id}">Выбрать этот отель</button>
                `;
                hotelOptions.appendChild(li);
            });

            const selectHotelButtons = hotelOptions.querySelectorAll(".select-hotel-option");
            selectHotelButtons.forEach((btn) => {
                btn.addEventListener("click", () => {
                    const flightBlock = e.target.closest(".flight-block");
                    const existingHotelSlot = flightBlock.querySelector(".hotel-slot");

                    if (existingHotelSlot) {
                        showCustomAlert("Отель уже выбран.", "danger");
                        hotelModal.hide();
                        return;
                    }

                    const hotelName = btn.parentElement.querySelector("h6").textContent.replace(/<i[^>]*>.*<\/i>/g, '').trim();
                    const hotelStars = btn.parentElement.querySelector(".hotel-rating").textContent;
                    const hotelPrice = btn.parentElement.querySelector("p strong").textContent;

                    const flightId = flightBlock.dataset.flightId;
                    const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
                    if (!flightsData[`times_${flightId}`]) {
                        flightsData[`times_${flightId}`] = {times: [], selectedIndex: undefined};
                    }
                    flightsData[`times_${flightId}`].hotelName = hotelName;
                    localStorage.setItem("flightsData", JSON.stringify(flightsData));
                    console.log("Saved flightsData with hotelName:", flightsData[`times_${flightId}`]);

                    showCustomAlert(`Выбран отель: ${hotelName}`);

                    const hotelSection = document.createElement("div");
                    hotelSection.className = "hotel-section";

                    const hotelSlot = document.createElement("div");
                    hotelSlot.className = "hotel-slot selected centered";
                    hotelSlot.style.backgroundColor = "#1E90FF";
                    hotelSlot.innerHTML = `
                        <span class="hotel-name">${hotelName}</span>
                        <span class="hotel-rating">${hotelStars}</span>
                        <span class="hotel-price">${hotelPrice}</span>
                    `;

                    if (existingHotelSlot) {
                        existingHotelSlot.closest(".hotel-section")?.remove();
                    }

                    const cancelHotelBtn = document.createElement("div");
                    cancelHotelBtn.className = "cancel-hotel-btn";
                    cancelHotelBtn.textContent = "Отменить выбор отеля";
                    cancelHotelBtn.style.color = "#1E90FF";
                    cancelHotelBtn.addEventListener("click", () => {
                        hotelSection.remove();
                        const selectHotelBtn = flightBlock.querySelector(".select-hotel-btn");
                        if (selectHotelBtn) selectHotelBtn.style.display = "block";
                        const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
                        if (flightsData[`times_${flightId}`]) {
                            delete flightsData[`times_${flightId}`].hotelName;
                            localStorage.setItem("flightsData", JSON.stringify(flightsData));
                            console.log("Removed hotelName from flightsData:", flightId);
                        }
                    });

                    hotelSection.appendChild(hotelSlot);
                    hotelSection.appendChild(cancelHotelBtn);

                    flightBlock.appendChild(hotelSection);

                    const selectHotelBtn = flightBlock.querySelector(".select-hotel-btn");
                    if (selectHotelBtn) selectHotelBtn.style.display = "none";

                    if (document.activeElement) {
                        document.activeElement.blur();
                    }

                    hotelModal.hide();

                    cancelHotelBtn.focus();
                });
            });
        }
    });

    function generateFlightKey(flight) {
        return `${flight.from}-${flight.to}-${flight.date}`;
    }

    async function initFlightNumbers() {
        const currentFlightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
        const flights = JSON.parse(localStorage.getItem("flights")) || [];

        for (const flight of flights) {
            const flightId = generateFlightKey(flight);
            const options = await fetchFlightOptions(flight.from, flight.to, flight.from_airport, flight.to_airport, flight.date, flight.costMin, flight.costMax, flight.currency);
            currentFlightsData[`times_${flightId}`] = {times: options, selectedIndex: undefined};
        }

        localStorage.setItem("flightsData", JSON.stringify(currentFlightsData));
    }

    async function fetchFlightOptions(from, to, from_airport, to_airport, date, costMin, costMax, currency) {
        try {
            const params = new URLSearchParams({
                origin: from,
                destination: to,
                departure_at: date,
                currency: currency,
                cost_min: costMin,
                cost_max: costMax,
                one_way: 'false'
            });

            const response = await fetch(`/api/search_flights?${params}`);
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.error || "Ошибка загрузки данных");
            }

            const {data} = await response.json();

            return data
                .filter(flight => {
                    const price = parseFloat(flight.price) || 0;
                    return costMin <= price && price <= costMax;
                })
                .map(flight => {

                    return {
                        airline: flight.airline,
                        departure: flight.departure_at,
                        arrival: flight.return_at,
                        duration: flight.duration,
                        number: `${flight.airline}${flight.flight_number}`,
                        price: flight.price,
                        currency: flight.currency,
                        origin_airport: flight.origin_airport,
                        destination_airport: flight.destination_airport
                    };
                });
        } catch (error) {
            console.error("Ошибка получения рейсов:", error);
            return [];
        }
    }

    async function fetchHotels(city, checkInDate, checkOutDate, currency) {
        try {
            const cleanCity = (city) => city.split(",")[0].trim();
            const params = new URLSearchParams({
                city: cleanCity(city),
                check_in_date: checkInDate,
                check_out_date: checkOutDate || '',
                currency: currency
            });

            const response = await fetch(`/api/search_hotels?${params}`, {timeout: 10000});
            if (!response.ok) {
                throw new Error("Не удалось установить соединение с сервером. Проверьте интернет и попробуйте снова.");
            }

            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error("Не удалось найти отели для данного запроса.");
            }
            return data;
        } catch (error) {
            console.error("Fetch Hotels Error:", error);
            return {error: error.message};
        }
    }

    async function renderFlights(flights) {
        const savedData = JSON.parse(localStorage.getItem("flightsData")) || {};
        container.innerHTML = "";

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < flights.length; i++) {
            const flight = flights[i];
            const flightId = generateFlightKey(flight);

            const times = await fetchFlightOptions(flight.from, flight.to, flight.from_airport, flight.to_airport, flight.date, flight.costMin, flight.costMax, flight.currency);
            savedData[`times_${flightId}`] = {times: times, selectedIndex: undefined};
            localStorage.setItem("flightsData", JSON.stringify(savedData));

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
                <button class="select-hotel-btn" 
                        data-city="${flight.to}" 
                        data-check-in-date="${flight.date}" 
                        data-currency="${flight.currency}">Выбрать отель</button>
            `;

            renderTimeSlots(flightBlock, flightId, times, savedData, flight.currency);
            fragment.appendChild(flightBlock);

            if (i < flights.length - 1) {
                fragment.appendChild(document.createElement("hr"));
            }
        }

        container.appendChild(fragment);
    }

    function renderTimeSlots(block, flightId, times, savedData, currency) {
        const slotsContainer = block.querySelector(".time-slots");

        const currencySymbols = {
            'RUB': '₽',
            'USD': '$',
            'EUR': '€'
        };

        const currencySymbol = currencySymbols[currency] || '₽';

        times.slice(0, 6).forEach((time, index) => {
            const slot = document.createElement("div");
            slot.className = "time-slot";
            // Сохраняем IATA-коды в data-атрибуты
            slot.dataset.originIata = time.origin_airport || '';
            slot.dataset.destinationIata = time.destination_airport || '';
            if (savedData[`times_${flightId}`]?.selectedIndex === index) {
                slot.classList.add("selected", "centered");
            }
            slot.innerHTML = `
                <span class="time">${time.departure}-${time.arrival}</span>
                <span class="flight-num">${time.number}</span>
                <span class="price">${time.price}${currencySymbol}</span>
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
                currentData[`times_${flightId}`] = {times: [], selectedIndex: undefined};
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

    // Заменяем существующую функцию formatDate
    function formatDate(dateString) {
        const months = [
            "янв", "фев", "мар", "апр", "мая", "июн",
            "июл", "авг", "сен", "окт", "ноя", "дек",
        ];
        const date = new Date(dateString);
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear(); // Добавляем год
        return `${day} ${month} ${year}`; // Возвращаем дату с годом
    }

    function showCustomAlert(message, type = "success") {
        const alertBox = document.getElementById("custom-alert");
        const messageBox = document.getElementById("custom-alert-message");

        if (!alertBox || !messageBox) {
            console.error("Custom alert elements not found!");
            return;
        }

        messageBox.textContent = message;
        alertBox.classList.remove("hidden", "alert-success", "alert-danger");
        alertBox.classList.add("show", `alert-${type}`);

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
    const currency = card.querySelector(".time-slot.selected .price")?.textContent.trim().replace(/\d+/, '').trim();

    // Получаем дополнительные данные из сохраненных данных
    const flightId = card.dataset.flightId;
    const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
    const timeData = flightsData[`times_${flightId}`]?.times?.[flightsData[`times_${flightId}`]?.selectedIndex];
    const hotelName = flightsData[`times_${flightId}`]?.hotelName || "Не указан";

    // Получаем IATA-коды из data-атрибутов
    const selectedSlot = card.querySelector(".time-slot.selected");
    const originIATA = selectedSlot?.dataset.originIata || '';
    const destinationIATA = selectedSlot?.dataset.destinationIata || '';

    console.log("DEBUG: ", {
        fromCity,
        toCity,
        flightDate,
        time,
        flightNumber,
        priceStr,
        currency,
        hotelName,
        airline: timeData?.airline,
        duration: timeData?.duration,
        originIATA,
        destinationIATA
    });

    if (!fromCity || !toCity || !flightDate || !time || !flightNumber || !priceStr) {
        console.warn("Недостаточно данных для маршрута.");
        return Promise.resolve();
    }

    const price = parseInt(priceStr.replace(/[^\d]/g, ""), 10);

    // Разбиваем время на departure и arrival
    const [departureTime, arrivalTime] = time.split("-");

    const payload = {
        airline: timeData?.airline || flightNumber.slice(0, 2),
        origin: fromCity,
        destination: toCity,
        origin_airport: originIATA,
        destination_airport: destinationIATA,
        departure_at: departureTime.trim(),
        return_at: arrivalTime.trim(),
        flight_number: flightNumber,
        duration: timeData?.duration || "Неизвестно",
        price: price,
        currency: currency,
        hotelName: hotelName,
        flightDate: flightDate
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
