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
            `http://127.0.0.1:5000/events/${username}`
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
        }

        // Generate event cards
        events.forEach(event => {
            let timelineHtml = '';
            try {
                let timelineData = event.timeline;
                if (timelineData && typeof timelineData === 'string' && timelineData !== "None" && timelineData !== "null") {
                    try {
                        timelineData = JSON.parse(timelineData);
                    } catch (err) {
                        console.error("JSON parse error:", err);
                        timelineData = null;
                    }
                }
                
                if (Array.isArray(timelineData) && timelineData.length > 0) {
                    timelineHtml = `
                        <div class="timeline-preview" style="display:none; margin-top: 15px; border-top: 1px solid #f3f4f6; padding-top: 12px;">
                            <h4 style="font-size: 14px; color: #111827; margin-bottom: 8px; font-weight: 600;">Event Timeline</h4>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${timelineData.map(item => `
                                    <div style="display: flex; gap: 10px; font-size: 13px;">
                                        <span style="font-weight: bold; color: #c8a96b; min-width: 50px;">${item.time}</span>
                                        <span style="color: #4b5563;">${item.activity}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <button class="toggle-timeline-btn" onclick="toggleTimeline(this)" style="margin-top: 15px; background: transparent; border: 1px solid #c8a96b; color: #c8a96b; padding: 8px 12px; border-radius: 10px; font-size: 12px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.3s;">Show Timeline</button>
                    `;
                } else {
                    timelineHtml = `
                        <div style="margin-top: 15px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">No timeline activities scheduled.</div>
                    `;
                }
            } catch (e) {
                console.error("Error parsing timeline for event card:", e);
                timelineHtml = `
                    <div style="margin-top: 15px; font-size: 12px; color: #ef4444; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">Failed to load timeline.</div>
                `;
            }

           eventGrid.innerHTML += `

            <div class="event-card">

                <div class="event-content">

                    <h3>${event.title}</h3>

                    <p>${event.category}</p>

                    <p>${event.venue}</p>

                    <p>${event.event_date}</p>

                    <small>
                        Created By: ${event.created_by}
                    </small>

                    ${timelineHtml}

                </div>
            
            </div>

            `;

        });

    } catch (error) {

        console.log("Error loading events:", error);

    }

}

// ========================================
// TOGGLE TIMELINE VIEW
// ========================================

window.toggleTimeline = function(btn) {
    const card = btn.closest('.event-card');
    const preview = card.querySelector('.timeline-preview');
    if (preview.style.display === 'none') {
        preview.style.display = 'block';
        btn.textContent = 'Hide Timeline';
        btn.style.background = '#c8a96b';
        btn.style.color = '#111827';
    } else {
        preview.style.display = 'none';
        btn.textContent = 'Show Timeline';
        btn.style.background = 'transparent';
        btn.style.color = '#c8a96b';
    }
};

// ========================================
// INITIALIZE PAGE
// ========================================

loadEvents();