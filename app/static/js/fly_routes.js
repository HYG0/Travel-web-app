document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("flight-summary");
    const flights = JSON.parse(localStorage.getItem("flights")) || [];

    flights.forEach((flight, index) => {
        const block = document.createElement("div");
        block.className = "flight-block";

        block.innerHTML = `
            <div class="flight-route">${flight.from} – ${flight.to}</div>
            <div class="flight-date">${formatDate(flight.date)}</div>
        `;

        container.appendChild(block);

        if (index < flights.length - 1) {
            const divider = document.createElement("div");
            divider.className = "divider";
            container.appendChild(divider);
        }
    });
});

function formatDate(dateStr) {
    const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${day} ${month}`;
}
