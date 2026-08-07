const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

const username = localStorage.getItem("username");

if (!username) {
    window.location.href = "login.html";
}

// Set Welcome Heading
document.getElementById("welcomeTitle").innerText = `Welcome Back, ${username}! 👋`;

let registrationsList = [];
let notificationsList = [];

// ========================================
// FETCH PARTICIPANT DATA
// ========================================

async function fetchDashboardData() {
    try {
        // 1. Fetch Registrations
        const regResponse = await fetch(`${API_BASE}/registrations/${username}`);
        registrationsList = await regResponse.json();
        
        // 2. Fetch Notifications
        const notResponse = await fetch(`${API_BASE}/notifications/${username}`);
        notificationsList = await notResponse.json();
        
        // Populate stats & content
        populateMetrics();
        renderUpcomingSchedules();
        renderNotificationsFeed();
    } catch (error) {
        console.error("Error loading participant dashboard data:", error);
    }
}

// ========================================
// POPULATE METRICS
// ========================================

function populateMetrics() {
    document.getElementById("registeredCount").innerText = registrationsList.length;
    document.getElementById("notifyCount").innerText = notificationsList.length;
}

// ========================================
// RENDER UPCOMING SCHEDULES (WITH COUNTDOWNS)
// ========================================

function renderUpcomingSchedules() {
    const list = document.getElementById("upcomingEventsList");
    if (!list) return;

    list.innerHTML = "";

    if (registrationsList.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px 10px; color: #9ca3af; font-size: 15px;">
                You have no upcoming registered events. <br>
                <a href="events.html" style="color: #c8a96b; font-weight: bold; text-decoration: underline; margin-top: 10px; display: inline-block;">Find Events Now</a>
            </div>`;
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    registrationsList.forEach(event => {
        // Calculate countdown
        const eventDate = new Date(event.event_date);
        eventDate.setHours(0,0,0,0);
        
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let countdownText = "";
        let daysSubtext = "";
        let badgeStyle = "";

        if (diffDays === 0) {
            countdownText = "TODAY";
            daysSubtext = "Starts today!";
            badgeStyle = "background: #10b981; color: white;";
        } else if (diffDays === 1) {
            countdownText = "TOMORROW";
            daysSubtext = "In 1 day";
            badgeStyle = "background: #3b82f6; color: white;";
        } else if (diffDays > 1) {
            countdownText = `IN ${diffDays} DAYS`;
            daysSubtext = `Scheduled for ${event.event_date}`;
            badgeStyle = "background: #c8a96b; color: #111827;";
        } else {
            countdownText = "PAST EVENT";
            daysSubtext = `Took place on ${event.event_date}`;
            badgeStyle = "background: #6b7280; color: white;";
        }

        list.innerHTML += `
            <div class="schedule-card" onclick="viewEventDetails(${event.id})" style="cursor: pointer;">
                <div class="schedule-info">
                    <h4>${event.title}</h4>
                    <p>📍 ${event.selected_venue || "TBD Venue"} | 🏷️ ${event.category}</p>
                </div>
                <div class="schedule-countdown">
                    <span class="countdown-badge" style="${badgeStyle}">${countdownText}</span>
                    <div class="countdown-days">${daysSubtext}</div>
                </div>
            </div>
        `;
    });
}

// ========================================
// RENDER NOTIFICATIONS FEED
// ========================================

function renderNotificationsFeed() {
    const feed = document.getElementById("notificationsFeed");
    if (!feed) return;

    feed.innerHTML = "";

    if (notificationsList.length === 0) {
        feed.innerHTML = `
            <div style="text-align: center; padding: 30px 10px; color: #9ca3af; font-size: 14px;">
                No recent notifications.
            </div>`;
        return;
    }

    notificationsList.slice(0, 10).forEach(item => {
        let typeClass = "info";
        if (item.type) {
            typeClass = item.type.toLowerCase(); // success, warning, info
        }
        
        // Clean timestamp
        let displayTime = "Just now";
        if (item.created_at) {
            displayTime = item.created_at.split(' ')[0] || item.created_at;
        }

        feed.innerHTML += `
            <div class="notify-item ${typeClass}">
                <p>${item.message}</p>
                <span>📅 ${displayTime}</span>
            </div>
        `;
    });
}

// ========================================
// VIEW DETAILS SHORTCUT
// ========================================

window.viewEventDetails = function(eventId) {
    localStorage.setItem("viewingEventId", eventId);
    window.location.href = "event-details.html";
};

// ========================================
// INIT
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    fetchDashboardData();
});
