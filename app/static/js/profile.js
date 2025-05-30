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
    const confirmDeleteModal = document.getElementById("confirm-delete-modal");
    const confirmYesBtn = document.getElementById("confirm-yes");
    const confirmNoBtn = document.getElementById("confirm-no");

    // Переменная для хранения индекса рейса, который нужно удалить
    let flightIdToDelete = null;

    // Данные пользователя
    const userData = JSON.parse(localStorage.getItem("userData")) || {};

    // Функция для отображения кастомного алерта
    function showCustomAlert(message) {
        let alertBox = document.getElementById("custom-alert");
        let messageBox = document.getElementById("custom-alert-message");

        if (!alertBox || !messageBox) {
            const alertContainer = document.createElement('div');
            alertContainer.id = "custom-alert";
            alertContainer.classList.add('hidden');
            alertContainer.innerHTML = `<span id="custom-alert-message"></span>`;
            document.body.appendChild(alertContainer);
            alertBox = document.getElementById("custom-alert");
            messageBox = document.getElementById("custom-alert-message");
        }

        messageBox.textContent = message;
        alertBox.classList.remove("hidden");
        setTimeout(() => alertBox.classList.add("show"), 10);
        setTimeout(() => {
            alertBox.classList.remove("show");
            setTimeout(() => alertBox.classList.add("hidden"), 300);
        }, 3000);
    }

    // Инициализация профиля
    async function initProfile() {
        try {
            // Получение данных с сервера
            const response = await fetch('/data/get_data');
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            const data = await response.json();

            // Обработка данных
            const flights = [];
            const flightsData = {};

            for (const routeKey in data) {
                const route = data[routeKey];
                const from = route.origin;
                const to = route.destination;
                const date = route.flightDate;
                const flight = {from, to, date, id: routeKey};
                flights.push(flight);

                const timesKey = `times_${from}-${to}-${date}`;
                const timeData = {
                    departure: route.departure_at,
                    arrival: route.return_at,
                    price: route.price,
                    currency: route.currency,   // Используем валюту из данных
                    number: route.flight_number,
                    duration: route.duration,
                    origin_airport: route.origin_airport,
                    destination_airport: route.destination_airport
                };
                flightsData[timesKey] = {
                    times: [timeData],
                    selectedIndex: 0,
                    hotelName: route.hotelName // Используем отель из данных
                };
            }

            // Сохранение в localStorage
            localStorage.setItem("flights", JSON.stringify(flights));
            localStorage.setItem("flightsData", JSON.stringify(flightsData));
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
            showCustomAlert('Не удалось загрузить данные с сервера');
        }

        // Инициализация аватара
        if (userData.avatar) {
            avatarLabel.textContent = "";
            avatarLabel.style.backgroundImage = `url(${userData.avatar})`;
        } else {
            avatarLabel.textContent = "Ава";
            avatarLabel.style.backgroundImage = "";
        }

        // Отображение рейсов
        renderSelectedFlights();
    }

    function renderSelectedFlights() {
        const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
        const flights = JSON.parse(localStorage.getItem("flights")) || [];
        routesContainer.innerHTML = '';
        console.log("Loaded flightsData in profile:", flightsData);
        console.log("Loaded flights in profile:", flights);

        const selectedFlights = flights
            .map((flight, index) => {
                const flightId = `${flight.from}-${flight.to}-${flight.date}`;
                const timesKey = `times_${flightId}`;
                if (flightsData[timesKey]?.selectedIndex !== undefined) {
                    const selectedIndex = flightsData[timesKey].selectedIndex;
                    const timeData = flightsData[timesKey]?.times?.[selectedIndex] || {};
                    return {
                        ...flight,
                        ...timeData,
                        price: timeData.price ? timeData.price : "Неизвестно",
                        originalIndex: index
                    };
                }
                return null;
            })
            .filter(flight => flight !== null);

        console.log("Selected flights in profile:", selectedFlights);

        if (selectedFlights.length === 0) {
            routesContainer.innerHTML = `<p class="empty-message">Здесь будут отображаться ваши сохранённые маршруты</p>`;
            return;
        }

        const flightsList = document.createElement('div');
        flightsList.className = 'flights-list';

        selectedFlights.forEach((flight, displayIndex) => {
            const flightCard = document.createElement('div');
            flightCard.className = 'flight-card';
            const flightId = `${flight.from}-${flight.to}-${flight.date}`;
            const timesKey = `times_${flightId}`;
            const hotelName = flightsData[timesKey]?.hotelName || "Не указан";
            flightCard.innerHTML = `
                <div class="flight-header">
                    <span class="flight-number">${flight.number || "Неизвестно"}</span>
                    <span class="flight-date">${flight.date}</span>
                    <button class="remove-flight-btn" data-id="${flight.id}">✖</button>
                </div>
                <div class="flight-route">
                    <span class="city">${flight.from} (${flight.origin_airport || '?'})</span>
                    <span class="arrow">→</span>
                    <span class="city">${flight.to} (${flight.destination_airport || '?'})</span>
                </div>
                <div class="flight-time">
                    <span>${flight.departure || "Не указано"} - ${flight.arrival || "Не указано"} (местное время)</span>
                    <span class="flight-price">${flight.price}${flight.currency || '₽'}</span>
                </div>
                <div class="flight-hotel">Отель: ${hotelName}</div>
            `;
            flightsList.appendChild(flightCard);
        });

        routesContainer.appendChild(flightsList);

        document.querySelectorAll('.remove-flight-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                flightIdToDelete = e.target.getAttribute('data-id');
                confirmDeleteModal.style.display = "flex";
            });
        });
    }

    async function removeFlight(routeId) {
        try {
            // Отправляем запрос на удаление маршрута на сервер
            const response = await fetch(`/remove_route/${routeId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Ошибка при удалении маршрута');
            }

            // Удаляем маршрут из localStorage
            const flights = JSON.parse(localStorage.getItem("flights")) || [];
            const updatedFlights = flights.filter(flight => flight.id !== routeId);
            localStorage.setItem("flights", JSON.stringify(updatedFlights));

            // Обновляем flightsData
            const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
            const flightToRemove = flights.find(flight => flight.id === routeId);
            if (flightToRemove) {
                const flightId = `${flightToRemove.from}-${flightToRemove.to}-${flightToRemove.date}`;
                const timesKey = `times_${flightId}`;
                delete flightsData[timesKey];
                localStorage.setItem("flightsData", JSON.stringify(flightsData));
            }

            renderSelectedFlights();
            showCustomAlert("Маршрут успешно удален");
        } catch (error) {
            console.error('Ошибка при удалении маршрута:', error);
            showCustomAlert("Не удалось удалить маршрут");
        }
    }

    function getAirline(flightNumber) {
        const airlineCode = flightNumber.slice(0, 2);
        const airlines = {
            "SU": "Aeroflot",
            "S7": "S7 Airlines",
            "U6": "Ural Airlines",
            "FV": "Rossiya Airlines",
            "DP": "Pobeda",
            "UT": "UTair Aviation",
            "WZ": "Red Wings Airlines",
            "N4": "Nordwind Airlines",
            "5N": "Smartavia",
            "D2": "Severstal Air Company",
            "I8": "Izhavia",
            "B2": "Belavia",
            "LH": "Lufthansa",
            "TK": "Turkish Airlines",
            "EK": "Emirates",
            "QR": "Qatar Airways",
            "EY": "Etihad Airways",
            "AF": "Air France",
            "KL": "KLM",
            "BA": "British Airways",
            "AA": "American Airlines",
            "DL": "Delta Air Lines",
            "UA": "United Airlines",
            "JL": "Japan Airlines",
            "NH": "ANA",
            "SQ": "Singapore Airlines",
            "CX": "Cathay Pacific",
            "CA": "Air China",
            "MU": "China Eastern",
            "CZ": "China Southern",
            "KE": "Korean Air",
            "OZ": "Asiana Airlines",
            "TG": "Thai Airways",
            "VN": "Vietnam Airlines",
            "GA": "Garuda Indonesia",
            "QF": "Qantas",
            "AC": "Air Canada",
            "AI": "Air India",
            "ET": "Ethiopian Airlines",
            "MS": "EgyptAir",
            "SV": "Saudia"
        };
        return airlines[airlineCode] || "Неизвестная авиакомпания";
    }

    document.querySelector(".download-btn").addEventListener("click", async () => {
        console.log("Download button clicked");
        const flightsData = JSON.parse(localStorage.getItem("flightsData")) || {};
        const flights = JSON.parse(localStorage.getItem("flights")) || [];

        const selectedFlights = flights
            .map(flight => {
                const flightId = `${flight.from}-${flight.to}-${flight.date}`;
                const timesKey = `times_${flightId}`;
                if (flightsData[timesKey]?.selectedIndex !== undefined) {
                    const selectedIndex = flightsData[timesKey].selectedIndex;
                    const timeData = flightsData[timesKey]?.times?.[selectedIndex] || {};
                    return {...flight, ...timeData, flightId};
                }
                return null;
            })
            .filter(flight => flight !== null);

        if (selectedFlights.length === 0) {
            showCustomAlert("Нет рейсов для скачивания");
            return;
        }

        const {jsPDF} = window.jspdf;
        if (!jsPDF) {
            console.error("jsPDF is not loaded");
            showCustomAlert("Ошибка: библиотека jsPDF не подключена");
            return;
        }

        const pdf = new jsPDF({orientation: "portrait", unit: "mm", format: "a4"});
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const imgWidth = pageWidth - 2 * margin;
        let currentY = margin;

        const addPageIfNeeded = (elementHeight) => {
            if (currentY + elementHeight > pageHeight - margin) {
                pdf.addPage();
                currentY = margin;
            }
        };

        const createTempContainer = () => {
            const tempContainer = document.createElement("div");
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.background = "#007bff";
            tempContainer.style.padding = "10px";
            tempContainer.style.width = "366px";
            tempContainer.style.borderRadius = "12px";
            document.body.appendChild(tempContainer);
            return tempContainer;
        };

        const renderToPDF = async (container) => {
            try {
                const canvas = await html2canvas(container, {scale: 2, useCORS: true, backgroundColor: "#007bff"});
                if (!canvas) throw new Error("Failed to render canvas");
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                addPageIfNeeded(imgHeight);
                pdf.addImage(canvas.toDataURL("image/jpeg", 1.0), "JPEG", margin, currentY, imgWidth, imgHeight);
                currentY += imgHeight + 5;
                document.body.removeChild(container);
            } catch (error) {
                console.error("Error in renderToPDF:", error);
                showCustomAlert("Ошибка при рендеринге PDF");
            }
        };

        const headerContainer = createTempContainer();
        const header = document.createElement("div");
        header.className = "pdf-header";
        header.innerHTML = `
            <div class="logo">FlyEasy ✈️</div>
            <h1>Ваши билеты</h1>
            <div class="issue-date">Дата выпуска: ${new Date().toLocaleDateString('ru-RU')}</div>
        `;
        headerContainer.appendChild(header);
        await renderToPDF(headerContainer);

        const flightsSectionContainer = createTempContainer();
        const flightsSection = document.createElement("div");
        flightsSection.className = "flights-section";
        flightsSection.innerHTML = `<h2>Все рейсы</h2>`;
        flightsSectionContainer.appendChild(flightsSection);
        await renderToPDF(flightsSectionContainer);

        for (const flight of selectedFlights) {
            const ticketContainer = createTempContainer();
            const ticket = document.createElement("div");
            ticket.className = "ticket";
            const airline = getAirline(flight.number || "SU000");
            const flightId = `${flight.from}-${flight.to}-${flight.date}`;
            const timesKey = `times_${flightId}`;
            const hotelName = flightsData[timesKey]?.hotelName || "Не указан";
            ticket.innerHTML = `
                <div class="ticket-header">
                    <span class="ticket-number">${flight.number || "Неизвестно"}</span>
                    <span class="ticket-date">${flight.date}</span>
                </div>
                <div class="ticket-airline">${airline}</div>
                <div class="ticket-route">
                    <span class="ticket-city">${flight.from} (${flight.origin_airport})</span>
                    <span class="ticket-arrow">→</span>
                    <span class="ticket-city">${flight.to} (${flight.destination_airport})</span>
                </div>
                <div class="ticket-time">${flight.departure || "Не указано"} - ${flight.arrival || "Не указано"} (местное время)</div>
                <div class="ticket-duration">Продолжительность: ${flight.duration || "Неизвестно"}</div>
                <div class="ticket-price">Стоимость: ${flight.price}${flight.currency || '₽'}</div>
                <div class="ticket-hotel">Отель: ${hotelName}</div>
                <div class="ticket-barcode">Рейс №: ${flight.number || "Неизвестно"}</div>
            `;
            ticketContainer.appendChild(ticket);
            await renderToPDF(ticketContainer);
        }

        const footerContainer = createTempContainer();
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
        footerContainer.appendChild(footer);
        await renderToPDF(footerContainer);

        console.log("Saving PDF");
        pdf.save(`my_tickets_${new Date().toISOString().split("T")[0]}.pdf`);
        console.log("PDF save attempted");
    });

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
    changeAvatarBtn.addEventListener("click", () => {
        avatarUpload.click();
        avatarOptionsModal.style.display = "none";
    });
    avatarUpload.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.match("image.*")) {
            showCustomAlert("Пожалуйста, выберите изображение");
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
    logoutBtn.addEventListener("click", () => {
        fetch('/logout', {method: 'GET', credentials: 'same-origin'})
            .then(response => {
                if (response.redirected) {
                    localStorage.clear();
                    window.location.href = response.url;
                }
            })
            .catch(error => console.error('Ошибка при выходе:', error));
    });
    homeBtn.addEventListener("click", () => {
        window.location.href = "/index";
    });
    confirmYesBtn.addEventListener("click", () => {
        if (flightIdToDelete !== null) {
            removeFlight(flightIdToDelete);
            flightIdToDelete = null;
        }
        confirmDeleteModal.style.display = "none";
    });
    confirmNoBtn.addEventListener("click", () => {
        flightIdToDelete = null;
        confirmDeleteModal.style.display = "none";
    });
    window.addEventListener("click", (e) => {
        if (e.target === avatarOptionsModal) avatarOptionsModal.style.display = "none";
        if (e.target === avatarViewModal) avatarViewModal.style.display = "none";
        if (e.target === confirmDeleteModal) confirmDeleteModal.style.display = "none";
    });

    initProfile();
});
