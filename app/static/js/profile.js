document.addEventListener("DOMContentLoaded", () => {
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

    const userData = JSON.parse(localStorage.getItem("userData")) || {};

    function showCustomAlert(message) {
        let alertBox = document.getElementById("custom-alert");
        let messageBox = document.getElementById("custom-alert-message");

        if (!alertBox || !messageBox) {
            const alertContainer = document.createElement('div');
            alertContainer.id = "custom-alert";
            alertContainer.classList.add('hidden');
            alertContainer.innerHTML = `
                <span id="custom-alert-message"></span>
            `;
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

    function initProfile() {
        if (userData.avatar) {
            avatarLabel.textContent = "";
            avatarLabel.style.backgroundImage = `url(${userData.avatar})`;
        } else {
            avatarLabel.textContent = "Ава";
            avatarLabel.style.backgroundImage = "";
        }

        loadAndRenderRoutes();
    }

    async function loadAndRenderRoutes() {
        try {
            const response = await fetch('/data/get_data', {
                method: 'GET',
                credentials: 'same-origin'
            });

            routesContainer.innerHTML = '';

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
            }

            const data = await response.json();

            if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
                routesContainer.innerHTML = `
                    <p class="empty-message">
                        Нет сохранённых маршрутов
                    </p>
                `;
                return;
            }

            const routesArray = Object.values(data);

            const flightsList = document.createElement('div');
            flightsList.className = 'flights-list';

            routesArray.forEach((route, index) => {
                const flightCard = document.createElement('div');
                flightCard.className = 'flight-card';

                const departureDate = route.departure_at
                    ? new Date(route.departure_at).toLocaleDateString('ru-RU')
                    : 'Не указана';

                const departureTime = route.departure_at
                    ? new Date(route.departure_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                    : 'Не указано';

                const arrivalTime = route.return_at
                    ? new Date(route.return_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                    : 'Не указано';

                const formatCity = (city, iata) => {
                    if (!city) return 'Не указано';
                    return iata ? `${city} (${iata})` : city;
                };

                flightCard.innerHTML = `
                    <div class="flight-header">
                        <span class="flight-number">${route.flight_number || "Неизвестно"}</span>
                        <span class="flight-date">${departureDate}</span>
                        <button class="remove-flight-btn" data-id="${route.id || index}">✖</button>
                    </div>
                    <div class="flight-route">
                        <span class="city">${formatCity(route.origin, route.origin_iata)}</span>
                        <span class="arrow">→</span>
                        <span class="city">${formatCity(route.destination, route.destination_iata)}</span>
                    </div>
                    <div class="flight-time">
                        <span>${departureTime} - ${arrivalTime}</span>
                        <span class="flight-price">${route.price ? route.price + ' ₽' : 'Не указана'}</span>
                    </div>
                `;
                flightsList.appendChild(flightCard);
            });

            routesContainer.appendChild(flightsList);

            document.querySelectorAll('.remove-flight-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const routeId = e.target.getAttribute('data-id');
                    if (confirm(`Вы уверены, что хотите удалить этот маршрут?`)) {
                        await deleteRoute(routeId);
                    }
                });
            });

        } catch (error) {
            console.error('Ошибка при загрузке рейсов:', error);
            routesContainer.innerHTML = `
                <p class="error-message">
                    Ошибка загрузки данных: ${error.message}
                </p>
            `;
        }
    }

    async function deleteRoute(routeId) {
        try {
            const response = await fetch(`/delete_route/${routeId}`, {
                method: 'DELETE',
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('Ошибка удаления маршрута');
            }

            showCustomAlert("Маршрут успешно удалён");
            await loadAndRenderRoutes();

        } catch (error) {
            console.error('Ошибка при удалении маршрута:', error);
            showCustomAlert(`Ошибка удаления: ${error.message}`);
        }
    }

    function formatDate(dateStr) {
        const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
        const date = new Date(dateStr);
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    function calculateFlightDuration(departureAt, returnAt) {
        if (!departureAt || !returnAt) return "Не указана";

        try {
            const depTime = new Date(departureAt);
            const arrTime = new Date(returnAt);

            if (isNaN(depTime) || isNaN(arrTime)) return "Не указана";

            const durationMs = arrTime - depTime;
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            return `${hours}ч ${minutes}мин`;
        } catch (e) {
            console.error("Ошибка расчета продолжительности:", e);
            return "Ошибка расчета";
        }
    }

    function getAirline(flightNumber) {
        if (!flightNumber) return "Неизвестная авиакомпания";
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
        try {
            const response = await fetch('/data/get_data', {
                method: 'GET',
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('Ошибка загрузки данных');
            }

            const data = await response.json();

            if (!data || Object.keys(data).length === 0) {
                showCustomAlert("Нет рейсов для скачивания");
                return;
            }

            const routesArray = Object.values(data);

            const tempContainer = document.createElement("div");
            tempContainer.className = "ticket-container";
            tempContainer.style.position = "absolute";
            tempContainer.style.left = "-9999px";
            tempContainer.style.background = "#007bff";
            tempContainer.style.padding = "10px";
            tempContainer.style.width = "366px";
            tempContainer.style.borderRadius = "12px";

            const header = document.createElement("div");
            header.className = "pdf-header";
            header.innerHTML = `
                <div class="logo">FlyEasy ✈️</div>
                <h1>Ваши билеты</h1>
                <div class="issue-date">Дата выпуска: ${new Date().toLocaleDateString('ru-RU')}</div>
            `;
            tempContainer.appendChild(header);

            const routesSection = document.createElement("div");
            routesSection.className = "routes-section";
            routesSection.innerHTML = `<h2>Ваши маршруты</h2>`;

            const formatCity = (city, iata) => {
                if (!city) return 'Не указано';
                return iata ? `${city} (${iata})` : city;
            };

            routesArray.forEach((route, index) => {
                const routeHeader = document.createElement("div");
                routeHeader.className = "route-header";
                routeHeader.innerHTML = `
                    <h3>Маршрут ${index + 1}</h3>
                    <div class="route-chain">
                        ${formatCity(route.origin, route.origin_iata)} → ${formatCity(route.destination, route.destination_iata)}
                    </div>
                `;
                routesSection.appendChild(routeHeader);
            });

            tempContainer.appendChild(routesSection);

            const flightsSection = document.createElement("div");
            flightsSection.className = "flights-section";
            flightsSection.innerHTML = `<h2>Все рейсы</h2>`;

            routesArray.forEach(route => {
                const ticket = document.createElement("div");
                ticket.className = "ticket";

                const departureTime = route.departure_at
                    ? new Date(route.departure_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                    : 'Не указано';

                const arrivalTime = route.return_at
                    ? new Date(route.return_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                    : 'Не указано';

                const duration = calculateFlightDuration(route.departure_at, route.return_at);
                const airline = getAirline(route.flight_number);

                ticket.innerHTML = `
                    <div class="ticket-header">
                        <span class="ticket-number">${route.flight_number || "Неизвестно"}</span>
                        <span class="ticket-date">${route.departure_at ? formatDate(route.departure_at) : 'Не указана'}</span>
                    </div>
                    <div class="ticket-airline">${airline}</div>
                    <div class="ticket-route">
                        <span class="ticket-city">${formatCity(route.origin, route.origin_iata)}</span>
                        <span class="ticket-arrow">→</span>
                        <span class="ticket-city">${formatCity(route.destination, route.destination_iata)}</span>
                    </div>
                    <div class="ticket-time">${departureTime} - ${arrivalTime}</div>
                    <div class="ticket-duration">Продолжительность: ${duration}</div>
                    <div class="ticket-price">Цена: ${route.price ? route.price + ' ₽' : 'Не указана'}</div>
                    <div class="ticket-barcode">[=== Рейс №: ${route.flight_number || "Неизвестно"} ===]</div>
                `;
                flightsSection.appendChild(ticket);
            });

            tempContainer.appendChild(flightsSection);

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

            const canvas = await html2canvas(tempContainer, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#007bff"
            });

            const {jsPDF} = window.jspdf;
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

            document.body.removeChild(tempContainer);

        } catch (error) {
            console.error('Ошибка при создании PDF:', error);
            showCustomAlert(`Ошибка создания PDF: ${error.message}`);
        }
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
        fetch('/logout', {
            method: 'GET',
            credentials: 'same-origin'
        })
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
        if (flightIndexToDelete !== null) {
            removeFlight(flightIndexToDelete);
            flightIndexToDelete = null;
        }
        confirmDeleteModal.style.display = "none";
    });

    confirmNoBtn.addEventListener("click", () => {
        flightIndexToDelete = null;
        confirmDeleteModal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === avatarOptionsModal) avatarOptionsModal.style.display = "none";
        if (e.target === avatarViewModal) avatarViewModal.style.display = "none";
        if (e.target === confirmDeleteModal) confirmDeleteModal.style.display = "none";
    });

    initProfile();
});
