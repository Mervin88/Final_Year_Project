// ========================================
// SESSION CHECK
// ========================================

const username = localStorage.getItem("username");

if (username) {

    document.getElementById("welcomeText").innerHTML =
    `Welcome Back, ${username} 👋`;

}

// ========================================
// LOAD MY EVENTS
// ========================================

async function loadMyEvents() {

    try {

        const response = await fetch(
            `http://127.0.0.1:5000/my-events/${username}`
        );

        const events = await response.json();

        console.log(events);

        const container =
        document.querySelector(".my-events-grid");

        container.innerHTML = "";

        if (events.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <h3>No Events Yet</h3>

                <p>
                    You haven't created any events.
                    Click Create Event to get started.
                </p>

            </div>

        `;

            return;

        }

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
                        <button class="toggle-timeline-btn" onclick="toggleTimeline(this)" style="margin-top: 15px; margin-bottom: 10px; background: transparent; border: 1px solid #c8a96b; color: #c8a96b; padding: 8px 12px; border-radius: 10px; font-size: 12px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.3s;">Show Timeline</button>
                    `;
                } else {
                    timelineHtml = `
                        <div style="margin-top: 15px; margin-bottom: 10px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">No timeline activities scheduled.</div>
                    `;
                }
            } catch (e) {
                console.error("Error parsing timeline for event card:", e);
                timelineHtml = `
                    <div style="margin-top: 15px; margin-bottom: 10px; font-size: 12px; color: #ef4444; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 12px;">Failed to load timeline.</div>
                `;
            }

            // Setup status badge coloring and styling
            let statusBadgeColor = "#f59e0b"; // default Pending Review
            if (event.status === "Approved") statusBadgeColor = "#10b981";
            if (event.status === "Rejected") statusBadgeColor = "#ef4444";

            let feedbackHtml = "";
            if (event.status === "Rejected" && event.rejection_feedback) {
                feedbackHtml = `
                    <div class="rejection-reason" style="margin-top: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; color: #ef4444; font-size: 13px; line-height: 1.45; text-align: left;">
                        <strong style="display: block; font-weight: 700; margin-bottom: 4px;">Rejection Reason:</strong>
                        ${event.rejection_feedback}
                    </div>
                `;
            }

            container.innerHTML += `

            <div class="event-card">

                <div class="event-content">

                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                        <h3 style="margin: 0; font-size: 20px;">${event.title}</h3>
                        <span style="background: ${statusBadgeColor}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block;">
                            ${event.status || 'Pending Review'}
                        </span>
                    </div>

                    <p style="margin-bottom: 6px;"><strong>Category:</strong> ${event.category}</p>

                    <p style="margin-bottom: 6px;"><strong>Venue:</strong> ${event.selected_venue}</p>

                    <p style="margin-bottom: 12px;"><strong>Date:</strong> ${event.event_date}</p>

                    <small style="display: block; margin-bottom: 10px; color: #6b7280;">
                        Created By: ${event.created_by}
                    </small>

                    ${timelineHtml}

                    ${feedbackHtml}

                     <div class="action-buttons" style="margin-top: 15px;">

                        <button
                        class="edit-btn"
                        onclick="editEvent(${event.id})">

                            Edit

                        </button>

                        <button
                        class="delete-btn"
                        onclick="deleteEvent(${event.id})">

                            Delete

                        </button>

                </div>

            </div>

            `;

        });

    }

    catch(error){

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

loadMyEvents();

// Delete Event Function
async function deleteEvent(eventId){

const result = await Swal.fire({

    title: "Delete Event?",

    text: "This action cannot be undone.",

    icon: "warning",

    showCancelButton: true,

    confirmButtonColor: "#d9534f",

    cancelButtonColor: "#6c757d",

    confirmButtonText: "Yes, Delete",

    cancelButtonText: "Cancel"

});

if(!result.isConfirmed){
    return;
}

    try{

        await fetch(

            `http://127.0.0.1:5000/delete-event/${eventId}`,

            {
                method:"DELETE"
            }

        );

        Swal.fire({

            icon: "success",

            title: "Event Deleted",

            text: "The event has been removed successfully.",

            confirmButtonColor: "#c8a96b"

});

        loadMyEvents();

    }

catch(error){

    console.log(error);

    Swal.fire({

        icon: "error",

        title: "Delete Failed",

        text: "Unable to delete the event. Please try again later.",

        confirmButtonColor: "#d9534f"

    });

}

}

// Edit Event Function
function editEvent(eventId){

    localStorage.setItem(
        "editEventId",
        eventId
    );

    Swal.fire({

        title: "Loading Event...",

        text: "Preparing event information.",

        allowOutsideClick: false,

        didOpen: () => {

            Swal.showLoading();

        }

    });

    setTimeout(() => {

        window.location.href =
        "create-event.html";

    }, 500);

}

function newEvent(){

    localStorage.removeItem("editEventId");

    localStorage.removeItem("eventDraft");

    window.location.href =
    "create-event.html";

}

// Log Out Function
async function logout(){

    const result = await Swal.fire({

        title: "Logout",

        text: "Are you sure you want to logout?",

        icon: "question",

        showCancelButton: true,

        confirmButtonText: "Logout",

        cancelButtonText: "Cancel",

        confirmButtonColor: "#c8a96b"

    });

    if(!result.isConfirmed){
        return;
    }

    localStorage.removeItem("userRole");

    localStorage.removeItem("username");

    localStorage.removeItem("editEventId");

    localStorage.removeItem("eventDraft");

    localStorage.removeItem("selectedVenue");

    window.location.href = "login.html";

}

