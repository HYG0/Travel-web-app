document.addEventListener("DOMContentLoaded", () => {
    // Элементы DOM
    const profileTitle = document.getElementById("profile-title");
    const avatarLabel = document.getElementById("avatar-label");
    const avatarUpload = document.getElementById("avatar-upload");
    const addFlightBtn = document.getElementById("add-flight-btn");
    const avatarOptionsModal = document.getElementById("avatar-options-modal");
    const avatarViewModal = document.getElementById("avatar-view-modal");
    const viewAvatarBtn = document.getElementById("view-avatar");
    const changeAvatarBtn = document.getElementById("change-avatar");
    const fullAvatarImg = document.getElementById("full-avatar");
    const routesContainer = document.getElementById("routes-container");
    const homeBtn = document.getElementById("home-btn");
    const logoutBtn = document.getElementById("logout-btn");

    // Данные пользователя
    const userData = JSON.parse(localStorage.getItem("userData")) || {};

    // Инициализация профиля
    function initProfile() {
    
    if (userData.avatar) {
        avatarLabel.textContent = "";
        avatarLabel.style.backgroundImage = `url(${userData.avatar})`;
    } else {
        avatarLabel.textContent = "Ава";
        avatarLabel.style.backgroundImage = "";
    }

    renderSelectedFlights();
}
    // Отображение выбранных рейсов
    function renderSelectedFlights() {
        const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
        const flights = JSON.parse(localStorage.getItem("flights")) || [];
        routesContainer.innerHTML = '';
        console.log("Loaded flightsData:", flightsData);
        console.log("Loaded flights:", flights);

        const selectedFlights = flights.filter(flight => {
            const flightId = `${flight.from}-${flight.to}-${flight.date}`.replace(/\s+/g, '-');
            return flightsData[flightId]?.selectedIndex !== undefined;
        }).map(flight => {
            const flightId = `${flight.from}-${flight.to}-${flight.date}`.replace(/\s+/g, '-');
            const selectedIndex = flightsData[flightId].selectedIndex;
            const timeData = flightsData[`times_${flightId}`] ? flightsData[`times_${flightId}`][selectedIndex] : null;
            if (timeData) {
                return { ...flight, ...timeData };
            }
            return { ...flight, departure: "Не указано", arrival: "Не указано", number: "Неизвестно" };
        });

        console.log("Selected flights:", selectedFlights);

        if (selectedFlights.length === 0) {
            routesContainer.innerHTML = `
                <p class="empty-message">
                    Здесь будут отображаться ваши сохранённые маршруты
                </p>
            `;
            return;
        }

        const flightsList = document.createElement('div');
        flightsList.className = 'flights-list';

        selectedFlights.forEach((flight, index) => {
            const flightCard = document.createElement('div');
            flightCard.className = 'flight-card';
            flightCard.innerHTML = `
                <div class="flight-header">
                    <span class="flight-number">${flight.number}</span>
                    <span class="flight-date">${formatDate(flight.date)}</span>
                </div>
                <div class="flight-route">
                    <span class="city">${flight.from}</span>
                    <span class="arrow">→</span>
                    <span class="city">${flight.to}</span>
                </div>
                <div class="flight-time">
                    ${flight.departure} - ${flight.arrival}
                </div>
            `;
            flightsList.appendChild(flightCard);
        });

        routesContainer.appendChild(flightsList);
    }

    // Форматирование даты
    function formatDate(dateStr) {
        const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        const date = new Date(dateStr);
        return `${date.getDate()} ${months[date.getMonth()]}`;
    }

    // Вычисление продолжительности полёта
    function calculateFlightDuration(departure, arrival) {
        const [depHours, depMinutes] = departure.split(":").map(Number);
        const [arrHours, arrMinutes] = arrival.split(":").map(Number);
        const depTotal = depHours * 60 + depMinutes;
        const arrTotal = arrHours * 60 + arrMinutes;
        const duration = arrTotal - depTotal;
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}ч ${minutes}мин`;
    }

    // Извлечение авиакомпании из номера рейса
    function getAirline(flightNumber) {
        const airlineCode = flightNumber.slice(0, 2);
        const airlines = {
            "SU": "Aeroflot",
            "S7": "S7 Airlines",
            "U6": "Ural Airlines"
        };
        return airlines[airlineCode] || "Неизвестная авиакомпания";
    }

    // Обработчик для кнопки "Скачать"
    document.querySelector(".download-btn").addEventListener("click", async () => {
        const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
        const flights = JSON.parse(localStorage.getItem("flights")) || [];

        // Фильтрация выбранных рейсов
        const selectedFlights = flights
            .filter(flight => {
                const flightId = `${flight.from}-${flight.to}-${flight.date}`.replace(/\s+/g, '-');
                return flightsData[flightId]?.selectedIndex !== undefined;
            })
            .map(flight => {
                const flightId = `${flight.from}-${flight.to}-${flight.date}`.replace(/\s+/g, '-');
                const selectedIndex = flightsData[flightId].selectedIndex;
                const timeData = flightsData[`times_${flightId}`] ? flightsData[`times_${flightId}`][selectedIndex] : null;
                return timeData ? { ...flight, ...timeData, flightId } : { ...flight, departure: "Не указано", arrival: "Не указано", number: "Неизвестно", flightId };
            });

        if (selectedFlights.length === 0) {
            alert("Нет рейсов для скачивания!");
            return;
        }

        // Сортировка по дате
        const sortedFlights = selectedFlights.sort((a, b) => new Date(a.date) - new Date(b.date));

        // Формирование всех возможных цепочек
        const chains = [];
        const usedFlights = new Set();

        sortedFlights.forEach((startFlight, startIndex) => {
            if (usedFlights.has(startIndex)) return;

            const chain = [startFlight];
            usedFlights.add(startIndex);

            for (let i = 0; i < sortedFlights.length; i++) {
                if (usedFlights.has(i)) continue;

                const lastFlightInChain = chain[chain.length - 1];
                const currentFlight = sortedFlights[i];

                if (lastFlightInChain.to === currentFlight.from && new Date(lastFlightInChain.date) <= new Date(currentFlight.date)) {
                    chain.push(currentFlight);
                    usedFlights.add(i);
                }
            }

            if (chain.length > 0) {
                chains.push(chain);
            }
        });

        // Добавим одиночные рейсы, которые не вошли в цепочки
        sortedFlights.forEach((flight, index) => {
            if (!usedFlights.has(index)) {
                chains.push([flight]);
            }
        });

        // Создание временного контейнера для рендеринга
        const tempContainer = document.createElement("div");
        tempContainer.className = "ticket-container";
        tempContainer.style.position = "absolute";
        tempContainer.style.left = "-9999px";
        tempContainer.style.background = "#007bff";
        tempContainer.style.padding = "10px";
        tempContainer.style.width = "366px";
        tempContainer.style.borderRadius = "12px";

        // Добавление логотипа и заголовка
        const header = document.createElement("div");
        header.className = "pdf-header";
        header.innerHTML = `
            <div class="logo">FlyEasy ✈️</div>
            <h1>Ваши билеты</h1>
            <div class="issue-date">Дата выпуска: ${new Date().toLocaleDateString('ru-RU')}</div>
        `;
        tempContainer.appendChild(header);

        // Добавление цепочек маршрутов
        if (chains.length > 0) {
            const routesSection = document.createElement("div");
            routesSection.className = "routes-section";
            routesSection.innerHTML = `<h2>Ваши маршруты</h2>`;
            
            chains.forEach((chain, index) => {
                const routeHeader = document.createElement("div");
                routeHeader.className = "route-header";
                routeHeader.innerHTML = `
                    <h3>Маршрут ${index + 1}</h3>
                    <div class="route-chain">
                        ${chain.map(flight => flight.from).join(" → ")} → ${chain[chain.length - 1].to}
                    </div>
                `;
                routesSection.appendChild(routeHeader);
            });

            tempContainer.appendChild(routesSection);
        }

        // Добавление всех рейсов
        const flightsSection = document.createElement("div");
        flightsSection.className = "flights-section";
        flightsSection.innerHTML = `<h2>Все рейсы</h2>`;

        selectedFlights.forEach(flight => {
            const ticket = document.createElement("div");
            ticket.className = "ticket";
            const duration = calculateFlightDuration(flight.departure, flight.arrival);
            const airline = getAirline(flight.number);
            ticket.innerHTML = `
                <div class="ticket-header">
                    <span class="ticket-number">${flight.number}</span>
                    <span class="ticket-date">${flight.date}</span>
                </div>
                <div class="ticket-airline">${airline}</div>
                <div class="ticket-route">
                    <span class="ticket-city">${flight.from}</span>
                    <span class="ticket-arrow">→</span>
                    <span class="ticket-city">${flight.to}</span>
                </div>
                <div class="ticket-time">${flight.departure} - ${flight.arrival}</div>
                <div class="ticket-duration">Продолжительность: ${duration}</div>
                <div class="ticket-barcode">[=== Рейс №: ${flight.number} ===]</div>
            `;
            flightsSection.appendChild(ticket);
        });

        tempContainer.appendChild(flightsSection);

        // Добавление информации о сервисе и пожелания
        const footer = document.createElement("div");
        footer.className = "pdf-footer";
        footer.innerHTML = `
            <div class="service-info">
                <h3>О нас</h3>
                <p>Мы — ваш надёжный помощник в планировании путешествий! Составляйте маршруты, сохраняйте билеты и наслаждайтесь поездкой.</p>
            </div>
            <div class="wishes">
                <p>Хорошего пути! ✈️</p>
            </div>
        `;
        tempContainer.appendChild(footer);

        document.body.appendChild(tempContainer);

        // Генерация PDF
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#007bff"
        });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const imgWidth = 190;
        const pageHeight = pdf.internal.pageSize.height;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 10;

        pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight + 10;
            pdf.addPage();
            pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight - 20;
        }

        pdf.save(`my_tickets_${new Date().toISOString().split("T")[0]}.pdf`);

        // Удаление временного контейнера
        document.body.removeChild(tempContainer);
    });

    // Обработчики событий

    avatarLabel.addEventListener("click", () => {
        avatarOptionsModal.style.display = "flex";
    });

    viewAvatarBtn.addEventListener("click", () => {
        if (userData.avatar) {
            fullAvatarImg.src = userData.avatar;
            avatarViewModal.style.display = "flex";
        }
        avatarOptionsModal.style.display = "none";
    });
    logoutBtn.addEventListener("click", () => {
    // Отправляем запрос на сервер для выхода
    fetch('/logout', {
        method: 'GET',
        credentials: 'same-origin' // Важно для передачи сессии
    })
    .then(response => {
        if (response.redirected) {
            // Очищаем локальные данные
            localStorage.clear();
            // Перенаправляем на страницу входа
            window.location.href = response.url;
        }
    })
    .catch(error => console.error('Ошибка при выходе:', error));
});
    changeAvatarBtn.addEventListener("click", () => {
        avatarUpload.click();
        avatarOptionsModal.style.display = "none";
    });

    avatarUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match("image.*")) {
            alert("Пожалуйста, выберите изображение");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            avatarLabel.textContent = "";
            avatarLabel.style.backgroundImage = `url(${event.target.result})`;

            userData.avatar = event.target.result;
            localStorage.setItem("userData", JSON.stringify(userData));
        };
        reader.readAsDataURL(file);
    });

    addFlightBtn.addEventListener("click", () => {
        window.location.href = "/entry";
    });

    window.addEventListener("click", (e) => {
        if (e.target === avatarOptionsModal) avatarOptionsModal.style.display = "none";
        if (e.target === avatarViewModal) avatarViewModal.style.display = "none";
    });
    homeBtn.addEventListener("click", () => {
    window.location.href = "/index"; // Или "/index.html" в зависимости от вашей структуры
});
    // Инициализация при загрузке
    initProfile();
});