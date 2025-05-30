document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("flight-summary");
    const loadingIndicator = container.querySelector(".loading");
    let flights = JSON.parse(localStorage.getItem("flights")) || [];

    // Отладка: проверяем, что в localStorage есть данные
    console.log("Flights from localStorage:", flights);

    // Если рейсов нет, добавляем тестовый рейс для отладки
    if (!flights || flights.length === 0) {
        flights = [{
            from: "Москва, Россия",
            to: "Екатеринбург, Россия",
            date: "2025-05-30",
            costMin: 0,
            costMax: Infinity,
            currency: "RUB"
        }];
        localStorage.setItem("flights", JSON.stringify(flights));
        console.log("Added test flight:", flights);
    }

    // Показываем индикатор загрузки
    loadingIndicator.classList.remove("hidden");

    // Инициализация и рендеринг рейсов
    await initFlightNumbers();
    localStorage.setItem("flightNumbersInit", "true");
    await renderFlights(flights);

    // Скрываем индикатор после рендеринга
    loadingIndicator.classList.add("hidden");

    // Настраиваем профиль пользователя
    const userData = JSON.parse(localStorage.getItem("userData")) || {};
    const profileCircle = document.getElementById("profile-circle");
    if (userData.avatar) {
        profileCircle.style.backgroundImage = `url(${userData.avatar})`;
    } else {
        profileCircle.textContent = "Профиль";
    }

    // Обработчик кнопки сохранения маршрута
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

    // Делегирование событий для кнопки "Выбрать отель"
    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("select-hotel-btn")) {
            console.log("Hotel button clicked!");
            const city = e.target.getAttribute("data-city");
            const checkInDate = e.target.getAttribute("data-check-in-date");
            const currency = e.target.getAttribute("data-currency");

            // Устанавливаем заголовок модального окна
            const modalTitle = document.getElementById("modalCity");
            if (!modalTitle) {
                console.error("Modal title element not found!");
                return;
            }
            modalTitle.textContent = city;

            // Показываем модальное окно
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

            // Запрашиваем отели
            const hotels = await fetchHotels(city, checkInDate, '', currency);
            console.log("Hotels fetched:", hotels);

            if (hotels.error || !Array.isArray(hotels)) {
                hotelOptions.innerHTML = `<p class="text-danger text-center">${hotels.error || 'Не удалось загрузить отели'}</p>`;
                return;
            }

            // Проверяем наличие отелей с рейтингами 3, 4, 5 звёзд
            const requiredRatings = [3, 4, 5];
            const availableRatings = [...new Set(hotels.map(hotel => hotel.stars))];
            const missingRatings = requiredRatings.filter(rating => !availableRatings.includes(rating));

            if (missingRatings.length > 0) {
                showCustomAlert(`Не удалось найти отели для всех запрошенных рейтингов. Отсутствуют: [${missingRatings.join(', ')}]`);
            }

            // Отображаем отели в модальном окне
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

            // Обработчик выбора отеля
            const selectHotelButtons = hotelOptions.querySelectorAll(".select-hotel-option");
            selectHotelButtons.forEach((btn) => {
                btn.addEventListener("click", () => {
                    const flightBlock = e.target.closest(".flight-block");
                    const existingHotelSlot = flightBlock.querySelector(".hotel-slot");

                    // Проверяем, выбран ли уже отель
                    if (existingHotelSlot) {
                        showCustomAlert("Отель уже выбран.", "danger");
                        hotelModal.hide();
                        return;
                    }

                    const hotelName = btn.parentElement.querySelector("h6").textContent.replace(/<i[^>]*>.*<\/i>/g, '').trim();
                    const hotelStars = btn.parentElement.querySelector(".hotel-rating").textContent;
                    const hotelPrice = btn.parentElement.querySelector("p strong").textContent;

                    showCustomAlert(`Выбран отель: ${hotelName}`);

                    // Создаём контейнер для отеля и кнопки отмены
                    const hotelSection = document.createElement("div");
                    hotelSection.className = "hotel-section";

                    // Добавляем отель в блок рейса
                    const hotelSlot = document.createElement("div");
                    hotelSlot.className = "hotel-slot selected centered";
                    hotelSlot.style.backgroundColor = "#1E90FF";
                    hotelSlot.innerHTML = `
                        <span class="hotel-name">${hotelName}</span>
                        <span class="hotel-rating">${hotelStars}</span>
                        <span class="hotel-price">${hotelPrice}</span>
                    `;

                    // Удаляем предыдущий отель, если он был
                    if (existingHotelSlot) {
                        existingHotelSlot.closest(".hotel-section")?.remove();
                    }

                    // Добавляем кнопку "Отменить выбор отеля"
                    const cancelHotelBtn = document.createElement("div");
                    cancelHotelBtn.className = "cancel-hotel-btn";
                    cancelHotelBtn.textContent = "Отменить выбор отеля";
                    cancelHotelBtn.style.color = "#1E90FF";
                    cancelHotelBtn.addEventListener("click", () => {
                        hotelSection.remove();
                        const selectHotelBtn = flightBlock.querySelector(".select-hotel-btn");
                        if (selectHotelBtn) selectHotelBtn.style.display = "block";
                    });

                    // Добавляем элементы в контейнер hotel-section
                    hotelSection.appendChild(hotelSlot);
                    hotelSection.appendChild(cancelHotelBtn);

                    // Добавляем контейнер в flightBlock
                    flightBlock.appendChild(hotelSection);

                    // Убираем кнопку "Выбрать отель"
                    const selectHotelBtn = flightBlock.querySelector(".select-hotel-btn");
                    if (selectHotelBtn) selectHotelBtn.style.display = "none";

                    // Снимаем фокус с текущего элемента перед закрытием модального окна
                    if (document.activeElement) {
                        document.activeElement.blur();
                    }

                    // Закрываем модальное окно
                    hotelModal.hide();

                    // Переносим фокус на кнопку "Отменить выбор отеля"
                    cancelHotelBtn.focus();
                });
            });
        }
    });

    // Функция для генерации ключа рейса
    function generateFlightKey(flight) {
        return `${flight.from}-${flight.to}-${flight.date}`;
    }

    // Инициализация данных рейсов
    async function initFlightNumbers() {
        const currentFlightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
        const flights = JSON.parse(localStorage.getItem("flights")) || [];

        for (const flight of flights) {
            const flightId = generateFlightKey(flight);
            const options = await fetchFlightOptions(flight.from, flight.to, flight.date, flight.costMin, flight.costMax, flight.currency);
            currentFlightsData[`times_${flightId}`] = { times: options, selectedIndex: undefined };
        }

        localStorage.setItem("flightsData", JSON.stringify(currentFlightsData));
    }

    // Запрос рейсов с API
    async function fetchFlightOptions(from, to, date, costMin, costMax, currency) {
        try {
            const cleanCity = (city) => city.split(",")[0].trim();
            const params = new URLSearchParams({
                origin: cleanCity(from),
                destination: cleanCity(to),
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

            const { data } = await response.json();

            return data
                .filter(flight => {
                    const price = parseFloat(flight.price) || 0;
                    return costMin <= price && price <= costMax;
                })
                .map(flight => {
                    const departureTime = new Date(flight.departure_at);
                    const arrivalTime = new Date(flight.arrival_at);

                    return {
                        departure: departureTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                        arrival: arrivalTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                        number: `${flight.airline}${flight.flight_number}`,
                        price: flight.price,
                        currency: flight.currency
                    };
                });
        } catch (error) {
            console.error("Ошибка получения рейсов:", error);
            return [];
        }
    }

    // Запрос отелей с API
    async function fetchHotels(city, checkInDate, checkOutDate, currency) {
        try {
            const cleanCity = (city) => city.split(",")[0].trim();
            const params = new URLSearchParams({
                city: cleanCity(city),
                check_in_date: checkInDate,
                check_out_date: checkOutDate || '',
                currency: currency
            });

            const response = await fetch(`/api/search_hotels?${params}`, { timeout: 10000 });
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
            return { error: error.message };
        }
    }

    // Рендеринг рейсов
    async function renderFlights(flights) {
        const savedData = JSON.parse(localStorage.getItem("flightsData")) || {};
        container.innerHTML = "";

        const fragment = document.createDocumentFragment();

        for (let i = 0; i < flights.length; i++) {
            const flight = flights[i];
            const flightId = generateFlightKey(flight);

            const times = await fetchFlightOptions(flight.from, flight.to, flight.date, flight.costMin, flight.costMax, flight.currency);
            savedData[`times_${flightId}`] = { times: times, selectedIndex: undefined };
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

    // Рендеринг временных слотов
    function renderTimeSlots(block, flightId, times, savedData, currency) {
        const slotsContainer = block.querySelector(".time-slots");

        const currencySymbols = {
            'RUB': '₽',
            'USD': '$',
            'EUR': '€'
        };

        const currencySymbol = currencySymbols[currency] || '₽';

        times.forEach((time, index) => {
            const slot = document.createElement("div");
            slot.className = "time-slot";
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

    // Выбор временного слота
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

    // Сброс выбора времени
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

    // Форматирование даты
    function formatDate(dateString) {
        const months = [
            "янв", "фев", "мар", "апр", "мая", "июн",
            "июл", "авг", "сен", "окт", "ноя", "дек",
        ];
        const date = new Date(dateString);
        return `${date.getDate()} ${months[date.getMonth()]}`;
    }

    // Показ уведомления
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

// Отправка маршрута на сервер
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