const username = localStorage.getItem("username");

if (!username) {
    window.location.href = "login.html";
}

let registeredEvents = [];
let activeFilter = "All";

// ========================================
// FILTER SELECTION
// ========================================

window.filterRegistrations = function(filterName, btnElement) {
    activeFilter = filterName;
    const filterBtns = document.querySelectorAll(".filters button");
    filterBtns.forEach(btn => btn.classList.remove("active"));
    if (btnElement) {
        btnElement.classList.add("active");
    }
    renderRegistrations();
};

// ========================================
// LOAD REGISTRATIONS
// ========================================

async function loadRegistrations() {
    try {
        const response = await fetch(`http://127.0.0.1:5000/registrations/${username}`);
        registeredEvents = await response.json();
        renderRegistrations();
    } catch (error) {
        console.error("Error fetching registrations:", error);
        document.querySelector(".events-grid").innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 40px; color: #ef4444; font-weight: bold;">
                Failed to load registrations. Please try again later.
            </div>`;
    }
}

// ========================================
// RENDER REGISTRATIONS
// ========================================

function renderRegistrations() {
    const grid = document.querySelector(".events-grid");
    if (!grid) return;

    grid.innerHTML = "";

    if (!registeredEvents || registeredEvents.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 80px 20px;">
                <p style="color: #9ca3af; font-size: 16px; margin-bottom: 20px;">You haven't registered for any events yet.</p>
                <button onclick="window.location.href='events.html'" style="background: #c8a96b; border: none; color: #111827; padding: 12px 28px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: 0.3s;">Explore Events</button>
            </div>`;
        return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Filter events by tab selection
    const filtered = registeredEvents.filter(event => {
        const effectiveDate = (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null')
            ? event.event_date_end
            : event.event_date;
        const isExpired = effectiveDate && effectiveDate < todayStr;

        if (activeFilter === "Upcoming") return !isExpired;
        if (activeFilter === "Completed") return isExpired;
        return true;
    });

    // Sort events by date
    filtered.sort((a, b) => {
        const dateA = new Date(a.event_date || 0);
        const dateB = new Date(b.event_date || 0);

        if (activeFilter === "Upcoming") {
            return dateA - dateB;
        }
        if (activeFilter === "Completed") {
            return dateB - dateA;
        }

        const effA = (a.event_date_end && a.event_date_end !== 'None' && a.event_date_end !== 'null') ? a.event_date_end : a.event_date;
        const effB = (b.event_date_end && b.event_date_end !== 'None' && b.event_date_end !== 'null') ? b.event_date_end : b.event_date;

        const isExpA = effA && effA < todayStr;
        const isExpB = effB && effB < todayStr;

        if (!isExpA && isExpB) return -1;
        if (isExpA && !isExpB) return 1;
        if (!isExpA && !isExpB) return dateA - dateB;
        return dateB - dateA;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="text-align: center; grid-column: 1/-1; padding: 60px 20px; color: #9ca3af; font-size: 15px;">
                No ${activeFilter.toLowerCase()} registrations found.
            </div>`;
        return;
    }

    filtered.forEach(event => {
        const bannerUrl = event.banner_image || "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200";
        
        const effectiveDate = (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null')
            ? event.event_date_end
            : event.event_date;
        const isExpired = effectiveDate && effectiveDate < todayStr;

        const dateRangeStr = (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null' && event.event_date_end !== event.event_date)
            ? `${event.event_date} to ${event.event_date_end}`
            : event.event_date;

        const statusBadge = isExpired
            ? `<span style="background: rgba(156, 163, 175, 0.15); color: #6b7280; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;">🏁 Event Ended</span>`
            : `<span style="background: rgba(34, 197, 94, 0.15); color: #15803d; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-flex; align-items: center; gap: 4px;">🟢 Upcoming</span>`;

        const actionButtons = isExpired
            ? `
                <div style="display: flex; gap: 10px;">
                    <button onclick="viewEventDetails(${event.id})" style="flex: 1; padding: 12px; background: transparent; border: 2px solid #c8a96b; color: #c8a96b; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.3s;">Details</button>
                    <button disabled style="flex: 1; padding: 12px; background: #e5e7eb; border: none; color: #9ca3af; border-radius: 12px; font-weight: bold; cursor: not-allowed;">Completed</button>
                </div>
            `
            : `
                <div style="display: flex; gap: 10px;">
                    <button onclick="viewEventDetails(${event.id})" style="flex: 1; padding: 12px; background: transparent; border: 2px solid #c8a96b; color: #c8a96b; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.3s;">Details</button>
                    <button onclick="cancelRegistration(${event.id}, '${event.title.replace(/'/g, "\\'")}')" style="flex: 1; padding: 12px; background: #ef4444; border: none; color: white; border-radius: 12px; font-weight: bold; cursor: pointer; transition: 0.3s;">Cancel</button>
                </div>
            `;

        const cardStyle = isExpired ? "opacity: 0.88; filter: grayscale(0.08);" : "";

        grid.innerHTML += `
            <div class="event-card" style="${cardStyle}">
                <img src="${bannerUrl}" alt="Event Banner">
                <div class="event-content">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div class="event-tag">${event.category}</div>
                        ${statusBadge}
                    </div>
                    <h2>${event.title}</h2>
                    <p>${event.selected_venue || "TBD Venue"}</p>
                    <span style="display: block; margin-bottom: 15px; color: ${isExpired ? '#6b7280' : '#c8a96b'}; font-weight: ${isExpired ? 'normal' : '600'};">📅 ${dateRangeStr} ${isExpired ? '<small style="color:#9ca3af;">(Past)</small>' : ''}</span>
                    ${actionButtons}
                </div>
            </div>
        `;
    });
}

// ========================================
// REDIRECT TO DETAILS
// ========================================

window.viewEventDetails = function(eventId) {
    localStorage.setItem("viewingEventId", eventId);
    window.location.href = "event-details.html";
};

// ========================================
// CANCEL REGISTRATION
// ========================================

window.cancelRegistration = function(eventId, title) {
    Swal.fire({
        title: "Cancel Registration?",
        text: `Are you sure you want to cancel your registration for '${title}'?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Cancel It"
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch("http://127.0.0.1:5000/unregister-event", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username,
                        event_id: eventId
                    })
                });
                
                const resData = await response.json();
                
                if (resData.success) {
                    Swal.fire({
                        title: "Cancelled!",
                        text: resData.message,
                        icon: "success",
                        confirmButtonColor: "#c8a96b"
                    });
                    loadRegistrations();
                } else {
                    Swal.fire({
                        title: "Error",
                        text: resData.message,
                        icon: "error",
                        confirmButtonColor: "#c8a96b"
                    });
                }
            } catch (error) {
                console.error("Error cancelling registration:", error);
                Swal.fire({
                    title: "Error",
                    text: "Could not cancel registration. Please try again.",
                    icon: "error",
                    confirmButtonColor: "#c8a96b"
                });
            }
        }
    });
};

// ========================================
// INIT
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    loadRegistrations();
});
