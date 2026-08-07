const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

// ========================================
// SESSION PROTECTION
// ========================================

const role = localStorage.getItem("userRole");

if (!role) {

    window.location.href = "login.html";

}

// ========================================
// DISPLAY USERNAME
// ========================================

const username = localStorage.getItem("username");

if (username) {

    document.getElementById("welcomeText").innerHTML =
        `Welcome Back, ${username} 👋`;

}

// ========================================
// LOGOUT FUNCTION
// ========================================

function logout() {

    localStorage.removeItem("userRole");
    localStorage.removeItem("username");

    window.location.href = "login.html";

}

// ========================================
// LOAD EVENTS FROM FLASK
// ========================================

async function loadEvents() {

    try {

        const response = await fetch(
            `${API_BASE}/events/${username}`
        );

        const events = await response.json();

        const eventGrid =
            document.querySelector(".event-grid");

        // Clear existing events
        eventGrid.innerHTML = "";

        // If no events found
        if (events.length === 0) {

            eventGrid.innerHTML = `

                <div class="empty-events">

                    <h3>No Upcoming Events</h3>

                    <p>
                        You have not created any events yet.
                    </p>

                </div>

            `;

            return;
        }        // Generate event cards
        events.forEach(event => {
            eventGrid.innerHTML += `
             <div class="event-card">
                 <img src="${event.banner_image || 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200'}" alt="Event Banner">
                 <div class="event-content">
                     <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: bold; color: #111827;">${event.title}</h3>
                     <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;"><strong>Category:</strong> ${event.category}</p>
                     <p style="margin: 0 0 4px 0; font-size: 13px; color: #6b7280;"><strong>Venue:</strong> ${event.venue}</p>
                     <p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280;"><strong>Attendees:</strong> ${event.attendee_count} Registered</p>
                     <span style="color: #c8a96b; font-weight: bold; font-size: 14px; display: block; margin-bottom: 8px;">${
                          (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null' && event.event_date_end !== event.event_date)
                              ? `${event.event_date} to ${event.event_date_end}`
                              : event.event_date
                      }</span>
                     <small style="color: #9ca3af; font-size: 11px; display: block;">Created By: ${event.created_by}</small>
                 </div>
             </div>
            `;
        });

    } catch (error) {
        console.log("Error loading events:", error);
    }
}

// ========================================
// LOAD NOTIFICATIONS FROM FLASK
// ========================================

async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE}/notifications/${username}`);
        const notifications = await response.json();
        const notificationList = document.querySelector(".notification-list");
        
        if (notificationList) {
            notificationList.innerHTML = "";
            if (notifications.length === 0) {
                notificationList.innerHTML = `
                    <div style="font-size: 14px; color: #9ca3af; text-align: center; padding: 20px 0;">
                        No recent notifications.
                    </div>`;
                return;
            }
            // Display top 3 notifications
            notifications.slice(0, 3).forEach(n => {
                notificationList.innerHTML += `
                    <div class="notification-item">
                        <div class="dot"></div>
                        <p>${n.message}</p>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error("Error loading notifications:", error);
    }
}

// ========================================
// LOAD RECOMMENDED VENUES (PERSONALIZED AI + OPTION A COLD-START FALLBACK)
// ========================================

let userEventsData = [];
let allApprovedVenuesData = [];

async function loadRecommendedVenues() {
    const venueGrid = document.getElementById("recommendedVenueGrid") || document.querySelector(".venue-grid");
    if (!venueGrid) return;

    try {
        // Fetch user events & approved venues concurrently
        const [eventsRes, venuesRes] = await Promise.all([
            fetch(`${API_BASE}/events/${username}`).catch(() => null),
            fetch(`${API_BASE}/venues/approved`).catch(() => null)
        ]);

        if (eventsRes && eventsRes.ok) {
            userEventsData = await eventsRes.json();
        }
        if (venuesRes && venuesRes.ok) {
            allApprovedVenuesData = await venuesRes.json();
        }

        renderRecommendedVenues();
    } catch (error) {
        console.error("Error loading recommended venues:", error);
    }
}

function renderRecommendedVenues() {
    const venueGrid = document.getElementById("recommendedVenueGrid") || document.querySelector(".venue-grid");
    const subtitle = document.getElementById("venueRecommendSubtitle");
    if (!venueGrid) return;

    venueGrid.innerHTML = "";

    if (!allApprovedVenuesData || allApprovedVenuesData.length === 0) {
        venueGrid.innerHTML = `
            <div style="font-size: 14px; color: #9ca3af; text-align: center; padding: 30px 0; grid-column: 1/-1;">
                No recommended venues found. Ensure backend server is running.
            </div>`;
        return;
    }

    const hasEvents = userEventsData && userEventsData.length > 0;
    const latestEvent = hasEvents ? userEventsData[userEventsData.length - 1] : null;

    // Set contextual subtitle
    if (subtitle) {
        if (hasEvents) {
            subtitle.textContent = `AI Personalized matches based on your event "${latestEvent.title}"`;
        } else {
            // Option A Cold Start Subtitle for New Organizers
            subtitle.textContent = `Welcome! Explore top-rated corporate venues below or create an event to enable AI matching.`;
        }
    }

    // Compute Match Score / Badges for candidate venues
    const scoredVenues = allApprovedVenuesData.map((v, idx) => {
        let score = 0;
        let badge = "";
        let reason = "";

        if (hasEvents && latestEvent) {
            // Personalized Scoring Formula
            // 1. Location (25 pts)
            if (latestEvent.preferred_location && v.location.toLowerCase().includes(latestEvent.preferred_location.toLowerCase())) {
                score += 25;
            } else {
                score += 10;
            }

            // 2. Capacity (25 pts)
            const reqCap = latestEvent.required_capacity || latestEvent.participants || 0;
            if (reqCap > 0) {
                if (v.capacity >= reqCap && v.capacity <= reqCap * 1.6) score += 25;
                else if (v.capacity >= reqCap) score += 15;
                else score += 5;
            } else {
                score += 15;
            }

            // 3. Category & Type (25 pts)
            if (latestEvent.venue_type && v.type === latestEvent.venue_type) score += 15;
            const desc = (v.name + " " + (v.description || "")).toLowerCase();
            if (latestEvent.category && desc.includes(latestEvent.category.toLowerCase())) score += 10;
            else score += 5;

            // 4. Amenities (25 pts)
            let amenityScore = 0;
            if (latestEvent.wifi_required && v.wifi_available) amenityScore += 5;
            if (latestEvent.parking_required && v.parking_available) amenityScore += 5;
            if (latestEvent.projector_required && v.projector_available) amenityScore += 5;
            if (latestEvent.catering_required && v.catering_available) amenityScore += 5;
            if (latestEvent.stage_setup_required && v.stage_setup_available) amenityScore += 5;
            score += amenityScore > 0 ? amenityScore : 15;

            badge = `🎯 ${score}% Match`;
            reason = `Matched for your event "${latestEvent.title}" (${latestEvent.category})`;
        } else {
            // Option A Cold Start Badges for New Organizers
            const coldStartBadges = ["⭐ Featured Venue", "🔥 Popular Choice", "🏆 Top Rated"];
            const coldStartReasons = [
                `Popular corporate choice in ${v.location} for high-capacity events`,
                `High availability & full event amenity support in ${v.location}`,
                `Frequently selected for corporate dinners and summits`
            ];
            badge = coldStartBadges[idx % coldStartBadges.length];
            reason = coldStartReasons[idx % coldStartReasons.length];
            score = 85 - (idx * 3);
        }

        return {
            ...v,
            matchScore: score,
            badge: badge,
            reason: reason
        };
    });

    // Sort by match score descending
    scoredVenues.sort((a, b) => b.matchScore - a.matchScore);

    // Display top 3 venues
    scoredVenues.slice(0, 3).forEach(v => {
        // Image selection
        let img = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop";
        if (v.type === "Indoor") {
            img = "https://images.unsplash.com/photo-1497366412874-3415097a27e7?q=80&w=1200&auto=format&fit=crop";
        } else if (v.type === "Outdoor") {
            img = "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop";
        }

        // Amenities list
        let amenities = [];
        if (v.parking_available) amenities.push("🅿️ Parking");
        if (v.wifi_available) amenities.push("📶 WiFi");
        if (v.projector_available) amenities.push("🎥 Projector");
        if (v.catering_available) amenities.push("🍽️ Catering");
        if (v.stage_setup_available) amenities.push("🎤 Stage");
        if (amenities.length === 0) amenities.push("✨ Standard Amenities");

        const amenitiesHtml = amenities.slice(0, 3).map(a => `<span class="amenity-tag">${a}</span>`).join("");
        const priceFormatted = parseFloat(v.price).toLocaleString(undefined, { minimumFractionDigits: 0 });

        venueGrid.innerHTML += `
            <div class="venue-card">
                <img src="${img}" alt="${v.name}" class="venue-card-header-img">
                <div class="venue-card-badge">${v.badge}</div>
                <div class="venue-card-body">
                    <h3>${v.name}</h3>
                    <div class="venue-location-tag">📍 ${v.location}, Malaysia</div>
                    
                    <div class="venue-specs-row">
                        <span class="venue-spec-item">👥 ${v.capacity} Pax Capacity</span>
                        <span class="venue-price-tag">RM ${priceFormatted} / day</span>
                    </div>

                    <div class="venue-amenities-list">
                        ${amenitiesHtml}
                    </div>

                    <div class="venue-reason-note">💡 ${v.reason}</div>

                    <button class="venue-card-btn" onclick="window.location.href='venues.html'">
                        Explore Venue Details
                    </button>
                </div>
            </div>
        `;
    });
}

// ========================================
// INITIALIZE PAGE
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    loadNotifications();
    loadEvents();
    loadRecommendedVenues();
});