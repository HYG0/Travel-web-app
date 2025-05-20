// document.addEventListener("DOMContentLoaded", () => {
//     updateDateLimits();
//     document.querySelectorAll('.city-input').forEach(input => {
//         input.addEventListener('input', () => fetchCitySuggestions(input));
//     });
// });

// function updateDateLimits() {
//     const today = new Date();
//     const todayFormatted = formatDateForInput(today);
//     const maxDate = "2100-12-31";

//     document.querySelectorAll('.date-input').forEach(input => {
//         // Устанавливаем атрибуты min/max
//         input.min = todayFormatted;
//         input.max = maxDate;

//         // Обработчики событий
//         input.addEventListener('change', validateDateInput);
//         input.addEventListener('input', handleManualDateInput);
//     });
// }

// function formatDateForInput(date) {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
// }

// function handleManualDateInput(e) {
//     const input = e.target;
//     // Разрешаем временно неполные даты при вводе
//     if (!input.value) return;

//     // Проверяем, что ввод соответствует формату даты
//     if (/^\d{4}-\d{2}-\d{2}$/.test(input.value)) {
//         validateDateInput(e);
//     }
// }

// function validateDateInput(e) {
//     const input = e.target;
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (!input.value) {
//         input.classList.remove('is-invalid');
//         return;
//     }

//     try {
//         const inputDate = new Date(input.value);
//         inputDate.setHours(0, 0, 0, 0);

//         if (inputDate < today) {
//             input.classList.add('is-invalid');
//             // Не сбрасываем значение сразу, даем закончить ввод
//         } else {
//             input.classList.remove('is-invalid');
//             // Форматируем дату правильно
//             input.value = formatDateForInput(inputDate);
//         }
//     } catch {
//         input.classList.add('is-invalid');
//     }
// }

// let debounceTimer;

// document.addEventListener('DOMContentLoaded', () => {
//     updateDateLimits();

//     document.querySelectorAll('.city-input').forEach(input => {
//         input.addEventListener('input', () => fetchCitySuggestions(input));
//         input.addEventListener('blur', () => {
//             setTimeout(() => {
//                 const suggestionsList = input.nextElementSibling;
//                 suggestionsList.innerHTML = '';
//             }, 200);
//         });
//     });

//     function fetchCitySuggestions(input) {
//     clearTimeout(debounceTimer);
//     const query = input.value.trim();
//     const suggestionsList = input.nextElementSibling;

//     if (!query) {
//         suggestionsList.innerHTML = '';
//         return;
//     }

//             debounceTimer = setTimeout(() => {
//                 fetch(`/search_cities?q=${encodeURIComponent(query)}`)
//                     .then(res => res.json())
//                     .then(data => {
//                         console.log(data);
//                         suggestionsList.innerHTML = '';

//                         data.forEach(item => {
//                             const li = document.createElement('li');
//                             li.classList.add('list-group-item', 'list-group-item-action');
//                             li.style.cursor = 'pointer';

//                             li.textContent = `${item.name || "???"} (${item.code || "???"}) ${item.country_name || ""}`;

//                             li.addEventListener('click', () => {
//                                 // Пример: "Москва, Россия"
//                                 input.value = `${item.name || ""}, ${item.country_name || ""}`;
//                                 suggestionsList.innerHTML = '';
//                             });

//                             suggestionsList.appendChild(li);
//                         });
//                     });
//             }, 300); // задержка для debounce
//         });
//     });
// });


// function addFlight() {
//     const flightContainer = document.getElementById('flights-container');
//     const newFlight = document.createElement('div');
//     newFlight.classList.add('flight-card');
//     newFlight.innerHTML = `
//         <button class="remove-btn" onclick="removeFlight(this)">✖</button>
//         <div class="mb-2">
//             <input type="text" class="form-control city-input" placeholder="Откуда" oninput="fetchCitySuggestions(this)">
//             <ul class="suggestions"></ul>
//         </div>
//         <div class="mb-2">
//             <input type="text" class="form-control city-input" placeholder="Куда" oninput="fetchCitySuggestions(this)">
//             <ul class="suggestions"></ul>
//         </div>
//         <div class="mb-2">
//             <input type="date" class="form-control date-input" min="" max="2100-12-31">
//         </div>
//     `;
//     flightContainer.appendChild(newFlight);
//     updateDateLimits();
//     flightContainer.scrollTop = flightContainer.scrollHeight;
// }

// function removeFlight(button) {
//     button.parentElement.remove();
// }

// // async function fetchCitySuggestions(input) {
// //     const query = input.value.trim();
// //     const suggestionsList = input.nextElementSibling;

// //     // Очищаем подсказки, если строка пустая или меньше 2 символов
// //     if (query.length < 2) {
// //         suggestionsList.innerHTML = "";
// //         return;
// //     }

// //     const API_KEY = 'd8e72d7f0bbc4c86b1f2d65d6be067c9';
// //     const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${API_KEY}&type=city&lang=ru`;

// //     try {
// //         const response = await fetch(url);
// //         const data = await response.json();
// //         showSuggestions(input, data.features);
// //     } catch (error) {
// //         console.error("Ошибка загрузки городов:", error);
// //         suggestionsList.innerHTML = ""; // Очищаем при ошибке
// //     }
// // }


// // function showSuggestions(input, cities) {
// //     const suggestionsList = input.nextElementSibling;
// //     suggestionsList.innerHTML = ""; // Очищаем старые подсказки

// //     cities.forEach(city => {
// //         const li = document.createElement("li");
// //         li.textContent = `${city.name}, ${city.countryName}`;  // Отображаем название города и страну
// //         li.addEventListener("click", () => {
// //             input.value = city.name; // Вставляем выбранный город в поле
// //             suggestionsList.innerHTML = ""; // Очищаем список подсказок
// //         });
// //         suggestionsList.appendChild(li); // Добавляем элемент в список подсказок
// //     });
// // }

// function goNext() {
//     const flightCards = document.querySelectorAll('.flight-card');
//     const flights = [];

//     flightCards.forEach(card => {
//         const inputs = card.querySelectorAll('input');
//         const from = inputs[0].value.trim();
//         const to = inputs[1].value.trim();
//         const date = inputs[2].value;

//         if (from && to && date) {
//             flights.push({ from, to, date });
//         }
//     });

//     localStorage.setItem("flights", JSON.stringify(flights));
//     window.location.href = "/routes";
// }




let debounceTimer;

document.addEventListener("DOMContentLoaded", () => {
    updateDateLimits();
    attachCityAutocompleteEvents(document.querySelectorAll('.city-input'));
});

function updateDateLimits() {
    const today = new Date();
    const todayFormatted = formatDateForInput(today);
    const maxDate = "2100-12-31";

    document.querySelectorAll('.date-input').forEach(input => {
        input.min = todayFormatted;
        input.max = maxDate;

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

    // Дебаунсинг: ждать 300мс после последнего ввода
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
    }, 300);
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

function addFlight() {
    const flightContainer = document.getElementById('flights-container');
    const newFlight = document.createElement('div');
    newFlight.classList.add('flight-card');
    newFlight.innerHTML = `
        <button class="remove-btn" onclick="removeFlight(this)">✖</button>
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

    // Подключение автоподстановки к новым полям
    attachCityAutocompleteEvents(newFlight.querySelectorAll('.city-input'));

    // Установка ограничений даты
    updateDateLimits();

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
