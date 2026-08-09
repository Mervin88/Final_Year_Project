// ========================================
// SESSION CHECK & INITIALIZATION
// ========================================

const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

const username = localStorage.getItem("username");
const eventLayouts = {};
const eventBackdrops = {};
let allMyEvents = [];
let activeMyEventsFilter = "All";

function initMyEvents() {
    if (!username) {
        window.location.href = "login.html";
        return;
    }
    const welcomeTextEl = document.getElementById("welcomeText");
    if (welcomeTextEl) {
        welcomeTextEl.innerHTML = `Welcome Back, ${username} 👋`;
    }
    loadMyEvents();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMyEvents);
} else {
    initMyEvents();
}

// ========================================
// FILTER SELECTION
// ========================================

window.filterMyEvents = function(filterName, btnElement) {
    activeMyEventsFilter = filterName;
    const filterBtns = document.querySelectorAll(".filters button");
    filterBtns.forEach(btn => {
        btn.style.background = "white";
        btn.style.color = "#374151";
        btn.style.border = "1px solid #e5e7eb";
        btn.classList.remove("active");
    });
    if (btnElement) {
        btnElement.style.background = "#c8a96b";
        btnElement.style.color = "#111827";
        btnElement.style.border = "none";
        btnElement.classList.add("active");
    }
    renderMyEventsGrid();
};

async function loadMyEvents() {
    if (!username) return;
    try {
        const response = await fetch(
            `${API_BASE}/my-events/${encodeURIComponent(username)}`
        );
        allMyEvents = await response.json();
        renderMyEventsGrid();
    } catch (error) {
        console.error("Error loading my events:", error);
    }
}

function renderMyEventsGrid() {
    const container = document.querySelector(".my-events-grid");
    if (!container) return;

    container.innerHTML = "";

    if (!allMyEvents || allMyEvents.length === 0) {
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

    const todayStr = new Date().toISOString().split("T")[0];

    // Filter events by tab selection
    const filteredEvents = allMyEvents.filter(event => {
        const effectiveDate = (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null')
            ? event.event_date_end
            : event.event_date;
        const isExpired = effectiveDate && effectiveDate < todayStr;

        if (activeMyEventsFilter === "Upcoming") return !isExpired;
        if (activeMyEventsFilter === "Completed") return isExpired;
        return true;
    });

    // Sort events by date:
    // 1. Upcoming: Nearest event date first (ascending)
    // 2. Completed: Most recently ended event first (descending)
    // 3. All: Upcoming events first (ascending), followed by Completed events (descending)
    filteredEvents.sort((a, b) => {
        const dateA = new Date(a.event_date || 0);
        const dateB = new Date(b.event_date || 0);

        if (activeMyEventsFilter === "Upcoming") {
            return dateA - dateB;
        }
        if (activeMyEventsFilter === "Completed") {
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

    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; padding: 60px 20px; text-align: center;">
                <h3>No ${activeMyEventsFilter.toLowerCase()} events found</h3>
                <p style="color: #9ca3af; font-size: 14px;">There are no events matching this category.</p>
            </div>
        `;
        return;
    }

    filteredEvents.forEach(event => {
        const effectiveDate = (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null')
            ? event.event_date_end
            : event.event_date;
        const isExpired = effectiveDate && effectiveDate < todayStr;

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

        // Setup layout HTML and cache layouts
        let layoutHtml = "";
        try {
            let layoutData = event.layout;
            let parsedLayout = null;
            if (layoutData && typeof layoutData === 'string' && layoutData !== "None" && layoutData !== "null") {
                try {
                    const parsedObj = JSON.parse(layoutData);
                    if (parsedObj && Array.isArray(parsedObj.elements)) {
                        parsedLayout = parsedObj.elements;
                    } else if (Array.isArray(parsedObj)) {
                        parsedLayout = parsedObj;
                    }
                } catch (err) {
                    parsedLayout = null;
                }
            }
            if (Array.isArray(parsedLayout) && parsedLayout.length > 0) {
                eventLayouts[event.id] = parsedLayout;
                layoutHtml += `
                    <button class="show-layout-btn" onclick="showLayoutPreview(${event.id})" style="margin-top: 5px; margin-bottom: 5px; background: transparent; border: 1px solid #c8a96b; color: #c8a96b; padding: 8px 12px; border-radius: 10px; font-size: 12px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.3s; margin-left: 0;">Show Layout</button>
                `;
            }
        } catch (layoutErr) {
            console.error("Error parsing layout for card:", layoutErr);
        }

        // Check for backdrop setup (handles both single id and elements array format)
        try {
            let backdropData = event.backdrop_setup;
            if (backdropData && typeof backdropData === 'string' && backdropData !== "None" && backdropData !== "null" && backdropData !== "") {
                const parsedBackdrop = JSON.parse(backdropData);
                if (parsedBackdrop && (parsedBackdrop.id || parsedBackdrop.elements)) {
                    eventBackdrops[event.id] = parsedBackdrop;
                    layoutHtml += `
                        <button class="show-3d-btn" onclick="show3DPreview(${event.id})" style="margin-top: 5px; margin-bottom: 10px; background: #c8a96b; border: 1px solid #c8a96b; color: #111827; padding: 8px 12px; border-radius: 10px; font-size: 12px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.3s; margin-left: 0;">Show 3D View</button>
                    `;
                }
            }
        } catch (backdropErr) {
            console.error("Error parsing backdrop setup:", backdropErr);
        }

        // Setup status badge text & coloring
        let statusBadgeText = event.status || 'Pending Review';
        let statusBadgeColor = "#f59e0b"; // default Pending Review

        if (isExpired) {
            if (event.status === "Approved") {
                statusBadgeText = "COMPLETED";
                statusBadgeColor = "#64748b"; // Slate/Purple badge for finished events
            } else if (event.status === "Rejected") {
                statusBadgeText = "REJECTED";
                statusBadgeColor = "#ef4444";
            } else {
                statusBadgeText = "EXPIRED";
                statusBadgeColor = "#9ca3af";
            }
        } else {
            if (event.status === "Approved") statusBadgeColor = "#10b981";
            if (event.status === "Rejected") statusBadgeColor = "#ef4444";
        }

        let feedbackHtml = "";
        if (event.status === "Rejected" && event.rejection_feedback) {
            feedbackHtml = `
                <div class="rejection-reason" style="margin-top: 15px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 12px 16px; color: #ef4444; font-size: 13px; line-height: 1.45; text-align: left;">
                    <strong style="display: block; font-weight: 700; margin-bottom: 4px;">Rejection Reason:</strong>
                    ${event.rejection_feedback}
                </div>
            `;
        }

        // Actions & Buttons logic
        let calendarBtnHtml = "";
        let actionButtonsHtml = "";

        if (isExpired) {
            calendarBtnHtml = ""; // Hide Google Calendar for past events
            actionButtonsHtml = `
                <div class="action-buttons" style="margin-top: 15px;">
                    <button class="edit-btn" disabled style="background: #e5e7eb; color: #9ca3af; border: none; cursor: not-allowed;">
                        Archived
                    </button>
                    <button class="delete-btn" onclick="deleteEvent(${event.id})">
                        Delete
                    </button>
                </div>
            `;
        } else {
            calendarBtnHtml = `
                <button onclick="addToGoogleCalendar('${event.title.replace(/'/g, "\\'")}', '${event.event_date}', '${event.event_date_end || ''}', '${event.selected_venue.replace(/'/g, "\\'")}', '${event.category}', 'EventSync Management event details')" style="width: 100%; margin-top: 10px; margin-bottom: 5px; padding: 10px; border-radius: 8px; border: 1px dashed #4285f4; color: #4285f4; background: transparent; font-weight: bold; cursor: pointer; transition: 0.3s; font-family: 'Inter', sans-serif; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 6px;" onmouseover="this.style.background='#4285f4';this.style.color='white';" onmouseout="this.style.background='transparent';this.style.color='#4285f4';">📅 Add to Google Calendar</button>
            `;
            actionButtonsHtml = `
                <div class="action-buttons" style="margin-top: 15px;">
                    <button class="edit-btn" onclick="editEvent(${event.id})">
                        Edit
                    </button>
                    <button class="delete-btn" onclick="deleteEvent(${event.id})">
                        Delete
                    </button>
                </div>
            `;
        }

        const dateRangeStr = (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null' && event.event_date_end !== event.event_date)
            ? `${event.event_date} to ${event.event_date_end}`
            : event.event_date;

        const cardStyle = isExpired ? "opacity: 0.90;" : "";

        container.innerHTML += `
            <div class="event-card" style="${cardStyle}">
                <div class="event-banner-container" style="position: relative; width: 100%; height: 180px; overflow: hidden; border-bottom: 1px solid #f1f5f9;">
                    <img class="event-banner-img" src="${(event.banner_image && event.banner_image !== 'None' && event.banner_image !== 'null' && event.banner_image.trim() !== '') ? event.banner_image : 'https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200'}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" alt="Event Banner">
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%); pointer-events: none;"></div>
                    <span style="position: absolute; top: 12px; right: 12px; background: ${statusBadgeColor}; color: white; padding: 5px 12px; border-radius: 30px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 8px rgba(0,0,0,0.12);">
                        ${statusBadgeText}
                    </span>
                    <span style="position: absolute; bottom: 12px; left: 12px; background: rgba(17, 24, 39, 0.65); border: 1px solid rgba(255, 255, 255, 0.2); color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; backdrop-filter: blur(4px);">
                        ${event.category}
                    </span>
                </div>

                <div class="event-content" style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 20px; color: #111827; font-weight: 700;">${event.title}</h3>
                    <p style="margin-bottom: 8px; font-size: 14px; color: #4b5563;"><strong style="color: #1f2937;">Venue:</strong> ${event.selected_venue}</p>
                    <p style="margin-bottom: 8px; font-size: 14px; color: #4b5563;"><strong style="color: #1f2937;">Date:</strong> ${dateRangeStr} ${isExpired ? '<small style="color:#9ca3af;">(Past Event)</small>' : ''}</p>
                    <p style="margin-bottom: 12px; font-size: 14px; color: #4b5563;"><strong style="color: #1f2937;">Attendees:</strong> ${event.attendee_count} Registered (<a href="#" onclick="viewAttendees(${event.id}, '${event.title.replace(/'/g, "\\'")}', event)" style="color: #c8a96b; font-weight: bold; text-decoration: underline;">View List</a>)</p>
                    <small style="display: block; margin-bottom: 12px; color: #9ca3af; font-size: 12px;">
                        Created By: ${event.created_by}
                    </small>

                    ${timelineHtml}
                    ${layoutHtml}
                    ${feedbackHtml}
                    ${calendarBtnHtml}
                    ${actionButtonsHtml}
                </div>
            </div>
        `;
    });
}

// ========================================
// TOGGLE TIMELINE VIEW
// ========================================

window.toggleTimeline = function (btn) {
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

window.downloadCalendarICS = function(title, date, venue, category, description) {
    const cleanDate = date.replace(/-/g, '');
    const startTime = "090000";
    const endTime = "170000";
    
    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//EventSync//Corporate Event Management//EN",
        "BEGIN:VEVENT",
        `SUMMARY:${title} (${category})`,
        `DTSTART:${cleanDate}T${startTime}`,
        `DTEND:${cleanDate}T${endTime}`,
        `LOCATION:${venue}`,
        `DESCRIPTION:${description}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_event.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.addToGoogleCalendar = function(title, date, endDate, venue, category, description) {
    const startClean = date.replace(/-/g, '');
    const endClean = (endDate && endDate !== 'None' && endDate !== 'null' && endDate !== '') ? endDate.replace(/-/g, '') : startClean;
    const startTime = "090000";
    const endTime = "170000";
    const startDateTime = `${startClean}T${startTime}`;
    const endDateTime = `${endClean}T${endTime}`;
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${encodeURIComponent(`${title} (${category})`)}` +
        `&dates=${startDateTime}/${endDateTime}` +
        `&details=${encodeURIComponent(description)}` +
        `&location=${encodeURIComponent(venue)}`;
        
    window.open(googleCalendarUrl, '_blank');
};

loadMyEvents();

// Delete Event Function
async function deleteEvent(eventId) {

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

    if (!result.isConfirmed) {
        return;
    }

    try {

        await fetch(

            `${API_BASE}/delete-event/${eventId}`,

            {
                method: "DELETE"
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

    catch (error) {

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
function editEvent(eventId) {

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

function newEvent() {

    localStorage.removeItem("editEventId");

    localStorage.removeItem("eventDraft");

    window.location.href =
        "create-event.html";

}

// Log Out Function
async function logout() {

    const result = await Swal.fire({

        title: "Logout",

        text: "Are you sure you want to logout?",

        icon: "question",

        showCancelButton: true,

        confirmButtonText: "Logout",

        cancelButtonText: "Cancel",

        confirmButtonColor: "#c8a96b"

    });

    if (!result.isConfirmed) {
        return;
    }

    localStorage.removeItem("userRole");

    localStorage.removeItem("username");

    localStorage.removeItem("editEventId");

    localStorage.removeItem("eventDraft");

    localStorage.removeItem("selectedVenue");

    window.location.href = "login.html";

}

// ========================================
// VENUE LAYOUT PREVIEW MODAL LOGIC
// ========================================
const baseWidth = 600;
let modalZoom = 1.0;
let currentPreviewElements = null;
let currentPreviewCanvas = null;
let defaultFitScale = 1.0;

window.showLayoutPreview = function (eventId) {
    const layoutData = eventLayouts[eventId];
    if (!layoutData) return;

    const layoutModal = document.getElementById("layoutModal");
    const modalLayoutPreview = document.getElementById("modalLayoutPreview");

    // Show modal first to ensure clientWidth is calculated correctly
    layoutModal.style.display = "flex";
    document.body.style.overflow = "hidden";

    // Cache current preview state
    currentPreviewElements = layoutData;
    currentPreviewCanvas = modalLayoutPreview;

    modalLayoutPreview.innerHTML = `<div class="layout-preview"></div>`;
    const modalCanvas = modalLayoutPreview.querySelector(".layout-preview");

    requestAnimationFrame(() => {
        renderLayoutPreview(modalCanvas, layoutData, null); // Pass null to trigger auto-fit
    });
};

function renderLayoutPreview(canvas, elements, zoomVal = null) {
    if (!canvas || !elements) return;
    canvas.innerHTML = "";

    // Calculate bounding box of layout elements to determine dimensions
    let maxX = 0;
    let maxY = 0;
    elements.forEach(el => {
        let w = 120; // default for table
        let h = 120;
        if (el.type === 'stage') {
            w = 300;
            h = 64;
        } else if (el.type === 'component') {
            const rot = parseInt(el.rotation) || 0;
            const isRotated = (rot === 90 || rot === 270);
            w = isRotated ? 80 : 200;
            h = isRotated ? 200 : 80;
        }
        if (el.x + w > maxX) maxX = el.x + w;
        if (el.y + h > maxY) maxY = el.y + h;
    });

    const workspaceWidth = Math.max(1200, maxX + 150);
    const workspaceHeight = Math.max(900, maxY + 150);

    const containerWidth = canvas.clientWidth || 800;
    const containerHeight = canvas.clientHeight || 500;
    const scaleX = (containerWidth - 40) / workspaceWidth;
    const scaleY = (containerHeight - 40) / workspaceHeight;
    defaultFitScale = Math.min(scaleX, scaleY, 1.0);

    if (zoomVal === null) {
        modalZoom = defaultFitScale;
    } else {
        modalZoom = zoomVal;
    }
    const scale = modalZoom;

    const scaledW = workspaceWidth * scale;
    const scaledH = workspaceHeight * scale;

    const leftOffset = containerWidth > scaledW ? (containerWidth - scaledW) / 2 : 20;
    const topOffset = containerHeight > scaledH ? (containerHeight - scaledH) / 2 : 20;

    // Configure parent canvas to fill 100% with seamless white grid
    canvas.style.display = "block";
    canvas.style.position = "relative";
    canvas.style.overflow = "auto";
    canvas.style.backgroundColor = "#ffffff";
    canvas.style.backgroundImage = "linear-gradient(rgba(200, 169, 107, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 169, 107, 0.05) 1px, transparent 1px)";
    canvas.style.backgroundSize = "20px 20px";

    // Create a layout-canvas inner container
    const canvasDiv = document.createElement("div");
    canvasDiv.className = "layout-canvas";
    canvasDiv.style.width = workspaceWidth + "px";
    canvasDiv.style.height = workspaceHeight + "px";
    canvasDiv.style.position = "absolute";
    canvasDiv.style.transformOrigin = "top left";
    canvasDiv.style.transform = `scale(${scale})`;
    canvasDiv.style.left = leftOffset + "px";
    canvasDiv.style.top = topOffset + "px";
    canvasDiv.style.boxShadow = "none";
    canvasDiv.style.border = "none";

    canvas.appendChild(canvasDiv);

    // Add a spacer to define scroll boundaries
    const spacer = document.createElement("div");
    spacer.className = "layout-spacer";
    spacer.style.width = (leftOffset + scaledW + 20) + "px";
    spacer.style.height = (topOffset + scaledH + 20) + "px";
    spacer.style.pointerEvents = "none";
    spacer.style.position = "absolute";
    spacer.style.left = "0";
    spacer.style.top = "0";
    canvas.appendChild(spacer);

    // Update zoom percentage text
    const percentSpan = document.getElementById("modalZoomPercent");
    if (percentSpan) {
        percentSpan.innerText = Math.round(scale * 100) + "%";
    }

    elements.forEach(el => {
        if (el.type === 'stage') {
            const stageDiv = document.createElement("div");
            stageDiv.className = "stage";
            stageDiv.style.left = el.x + "px";
            stageDiv.style.top = el.y + "px";
            stageDiv.innerText = el.label;
            canvasDiv.appendChild(stageDiv);
        } else if (el.type === 'table') {
            const tableDiv = document.createElement("div");
            tableDiv.className = "table-wrapper";
            tableDiv.style.left = el.x + "px";
            tableDiv.style.top = el.y + "px";
            tableDiv.innerHTML = `
                <div class="chair top"></div>
                <div class="chair bottom"></div>
                <div class="chair left"></div>
                <div class="chair right"></div>
                <div class="table-box">
                    ${el.label}
                </div>
            `;
            canvasDiv.appendChild(tableDiv);
        } else if (el.type === 'component') {
            const compDiv = document.createElement("div");
            compDiv.className = "component-wrapper";
            compDiv.style.left = el.x + "px";
            compDiv.style.top = el.y + "px";
            
            if (el.rotation === 90 || el.rotation === 270) {
                compDiv.classList.add("rotated");
            }
            
            compDiv.innerHTML = `<span>${el.label}</span>`;
            canvasDiv.appendChild(compDiv);
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    const layoutModal = document.getElementById("layoutModal");
    const closeBtn = document.getElementById("closeLayoutModalBtn");
    const modalLayoutPreview = document.getElementById("modalLayoutPreview");

    if (closeBtn && layoutModal && modalLayoutPreview) {
        closeBtn.addEventListener("click", () => {
            layoutModal.style.display = "none";
            document.body.style.overflow = "";
            modalLayoutPreview.innerHTML = "";
            currentPreviewElements = null;
            currentPreviewCanvas = null;
        });

        layoutModal.addEventListener("click", (e) => {
            if (e.target === layoutModal) {
                layoutModal.style.display = "none";
                document.body.style.overflow = "";
                modalLayoutPreview.innerHTML = "";
                currentPreviewElements = null;
                currentPreviewCanvas = null;
            }
        });
    }

    // Zoom control click listeners
    const zoomInBtn = document.getElementById("modalZoomInBtn");
    const zoomOutBtn = document.getElementById("modalZoomOutBtn");
    const zoomResetBtn = document.getElementById("modalZoomResetBtn");

    if (zoomInBtn && zoomOutBtn && zoomResetBtn) {
        zoomInBtn.addEventListener("click", () => {
            if (currentPreviewElements && currentPreviewCanvas) {
                modalZoom = Math.min(2.0, modalZoom + 0.1);
                const modalCanvas = currentPreviewCanvas.querySelector(".layout-preview");
                renderLayoutPreview(modalCanvas, currentPreviewElements, modalZoom);
            }
        });

        zoomOutBtn.addEventListener("click", () => {
            if (currentPreviewElements && currentPreviewCanvas) {
                modalZoom = Math.max(0.2, modalZoom - 0.1);
                const modalCanvas = currentPreviewCanvas.querySelector(".layout-preview");
                renderLayoutPreview(modalCanvas, currentPreviewElements, modalZoom);
            }
        });

        zoomResetBtn.addEventListener("click", () => {
            if (currentPreviewElements && currentPreviewCanvas) {
                const modalCanvas = currentPreviewCanvas.querySelector(".layout-preview");
                renderLayoutPreview(modalCanvas, currentPreviewElements, null);
            }
        });
    }

    const backdropModal = document.getElementById("backdropModal");
    const closeBackdropBtn = document.getElementById("closeBackdropModalBtn");

    if (closeBackdropBtn && backdropModal) {
        closeBackdropBtn.addEventListener("click", () => {
            backdropModal.style.display = "none";
            document.body.style.overflow = "";
        });

        backdropModal.addEventListener("click", (e) => {
            if (e.target === backdropModal) {
                backdropModal.style.display = "none";
                document.body.style.overflow = "";
            }
        });
    }
});

window.scaleBackdropCanvas = function() {
    const modalBody = document.querySelector("#backdropModal .layout-modal-body");
    const canvas = document.getElementById("modalBackdropPreview");
    if (!modalBody || !canvas) return;

    const bodyWidth = modalBody.clientWidth;
    const bodyHeight = modalBody.clientHeight;

    const canvasWidth = 900;
    const canvasHeight = 550;

    const padding = 40;
    const scaleX = (bodyWidth - padding) / canvasWidth;
    const scaleY = (bodyHeight - padding) / canvasHeight;
    const scaleFactor = Math.min(scaleX, scaleY, 2.5);

    canvas.style.transform = `scale(${scaleFactor})`;
};

window.addEventListener("resize", () => {
    const backdropModal = document.getElementById("backdropModal");
    if (backdropModal && backdropModal.style.display === "flex") {
        window.scaleBackdropCanvas();
    }
});

window.show3DPreview = function(eventId) {
    const backdropSetup = eventBackdrops[eventId];
    if (!backdropSetup) return;

    const backdropModal = document.getElementById("backdropModal");
    const modalBackdropPreview = document.getElementById("modalBackdropPreview");

    if (backdropModal && modalBackdropPreview) {
        // Clear previous dynamically created elements
        const oldDynamic = modalBackdropPreview.querySelectorAll(".stage-backdrop");
        oldDynamic.forEach(el => el.remove());

        // Set dynamic ballroom background
        const ballroomFile = backdropSetup.ballroom || "eq_grand_ballroom.jpg";
        modalBackdropPreview.style.backgroundImage = `url('images/ballrooms/${ballroomFile}')`;

        // Migrate old format to array list if needed
        let elements = [];
        if (backdropSetup.id) {
            elements = [{
                id: backdropSetup.id,
                width: backdropSetup.width,
                height: backdropSetup.height,
                left: backdropSetup.left,
                top: backdropSetup.top,
                opacity: backdropSetup.opacity,
                scale: backdropSetup.scale
            }];
        } else {
            elements = backdropSetup.elements || [];
        }

        // Render each saved element
        elements.forEach(el => {
            const div = document.createElement("div");
            div.className = "stage-backdrop";
            div.style.backgroundImage = `url('images/backdrops/${el.id}.png')`;
            div.style.width = el.width + "px";
            div.style.height = el.height + "px";
            div.style.left = el.left + "px";
            div.style.top = el.top + "px";
            div.style.opacity = el.opacity;
            div.style.transform = `scale(${el.scale})`;
            div.style.display = "block";
            div.style.position = "absolute";
            div.style.backgroundSize = "contain";
            div.style.backgroundRepeat = "no-repeat";
            div.style.backgroundPosition = "bottom center";
            
            modalBackdropPreview.appendChild(div);
        });

        backdropModal.style.display = "flex";
        document.body.style.overflow = "hidden";

        // Trigger scale on next layout cycle
        setTimeout(window.scaleBackdropCanvas, 50);
    }
};

window.viewAttendees = async function(eventId, eventTitle, e) {
    if (e) e.preventDefault();
    try {
        const response = await fetch(`${API_BASE}/event/${eventId}/attendees`);
        const attendees = await response.json();
        
        if (attendees.length === 0) {
            Swal.fire({
                title: "No Attendees Yet",
                text: "No participants have registered for this event yet.",
                icon: "info",
                confirmButtonColor: "#c8a96b"
            });
            return;
        }
        
        const isDark = document.documentElement.classList.contains("dark-theme");
        const bgColor = isDark ? "#1f2937" : "#f9fafb";
        const textColor = isDark ? "#f9fafb" : "#111827";
        const borderColor = isDark ? "#374151" : "#e5e7eb";
        const titleColor = isDark ? "#f9fafb" : "#111827";
        
        let htmlList = `<div style="text-align: left; max-height: 250px; overflow-y: auto; padding: 12px; background: ${bgColor}; border-radius: 12px; border: 1px solid ${borderColor}; color: ${textColor};">`;
        attendees.forEach((att, idx) => {
            const dateOnly = att.registration_date.split(' ')[0] || att.registration_date;
            htmlList += `<div style="padding: 8px 0; border-bottom: ${idx < attendees.length - 1 ? '1px solid ' + borderColor : 'none'}; font-size: 14px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600;">${idx + 1}. ${att.username}</span> 
                <span style="color: #9ca3af; font-size: 12px;">Registered: ${dateOnly}</span>
            </div>`;
        });
        htmlList += `</div>`;
        
        Swal.fire({
            title: `Attendees for '${eventTitle}'`,
            html: htmlList,
            confirmButtonColor: "#c8a96b",
            background: isDark ? "#111827" : "#ffffff",
            color: titleColor
        });
    } catch (err) {
        console.error("Error loading attendees list:", err);
        Swal.fire({
            title: "Error",
            text: "Failed to load attendees list.",
            icon: "error",
            confirmButtonColor: "#c8a96b"
        });
    }
};

