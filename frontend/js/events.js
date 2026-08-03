let allEvents = [];
let selectedCategory = "All";
let searchQuery = "";

// ========================================
// FETCH PUBLIC EVENTS
// ========================================

async function loadPublicEvents() {
    try {
        const response = await fetch("http://127.0.0.1:5000/participant/events");
        const data = await response.json();
        if (Array.isArray(data)) {
            allEvents = data;
        } else {
            allEvents = [];
        }
    } catch (error) {
        console.error("Error fetching public events:", error);
        allEvents = [];
    }

    renderFilteredEvents();
}

// ========================================
// RENDER EVENTS
// ========================================

function renderFilteredEvents() {
    const grid = document.querySelector(".events-grid");
    if (!grid) return;

    grid.innerHTML = "";

    const todayStr = new Date().toISOString().split("T")[0];

    const filtered = allEvents.filter(event => {
        const matchesCategory = selectedCategory === "All" || 
            event.category.toLowerCase() === selectedCategory.toLowerCase();
            
        const matchesSearch = searchQuery === "" || 
            event.title.toLowerCase().includes(searchQuery) ||
            event.category.toLowerCase().includes(searchQuery) ||
            (event.selected_venue && event.selected_venue.toLowerCase().includes(searchQuery)) ||
            (event.description && event.description.toLowerCase().includes(searchQuery));

        // Filter out expired events (check end date if present, otherwise event date)
        const effectiveDate = (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null') 
            ? event.event_date_end 
            : event.event_date;
        const isNotExpired = !effectiveDate || effectiveDate >= todayStr;
            
        return matchesCategory && matchesSearch && isNotExpired;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 60px 20px; color: #9ca3af; font-size: 16px;">
                No public events found matching your criteria.
            </div>`;
        return;
    }

    filtered.forEach(event => {
        const bannerUrl = event.banner_image || "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200";
        grid.innerHTML += `
            <div class="event-card">
                <img src="${bannerUrl}" alt="Event Banner">
                <div class="event-content">
                    <div class="event-tag">${event.category}</div>
                    <h2>${event.title}</h2>
                    <p>${event.selected_venue || "TBD Venue"}</p>
                    <span>📅 ${
                        (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null' && event.event_date_end !== event.event_date)
                            ? `${event.event_date} to ${event.event_date_end}`
                            : event.event_date
                    }</span>
                    <button onclick="viewEventDetails(${event.id})">Register Now</button>
                </div>
            </div>
        `;
    });
}

// ========================================
// EVENT DETAILS NAVIGATION
// ========================================

window.viewEventDetails = function(eventId) {
    localStorage.setItem("viewingEventId", eventId);
    window.location.href = "event-details.html";
};

// ========================================
// FILTER & SEARCH LISTENERS
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initial Load
    loadPublicEvents();

    // 2. Search box binding
    const searchInput = document.querySelector(".search-box input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.trim().toLowerCase();
            renderFilteredEvents();
        });
    }

    // 3. Category filters binding
    const filterButtons = document.querySelectorAll(".filters button");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedCategory = btn.innerText.trim();
            renderFilteredEvents();
        });
    });
});
