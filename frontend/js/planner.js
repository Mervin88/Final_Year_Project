const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

// ==========================
// GET EVENT DATA
// ==========================

// Intelligently check if the user is entering the planner from a demo session from outside pages.
// If they click the Planner navbar link directly from other pages, we reset the demo mode
// so they can see the onboarding/demo popup again.
const referrer = document.referrer || "";
const isDemoModeOnLoad = localStorage.getItem("isDemoMode") === "true";
const fromAllowedFlow = referrer.includes("vr-backdrop.html") || referrer.includes("planner.html");

if (isDemoModeOnLoad && !fromAllowedFlow) {
    localStorage.removeItem("eventDraft");
    localStorage.removeItem("selectedVenue");
    localStorage.removeItem("eventTimeline");
    localStorage.removeItem("eventLayout");
    localStorage.removeItem("eventBackdropSetup");
    localStorage.removeItem("isDemoMode");
}

let eventData = JSON.parse(localStorage.getItem("eventDraft"));
let selectedVenue = localStorage.getItem("selectedVenue");

document.addEventListener("DOMContentLoaded", () => {
    if (!eventData || !selectedVenue) {
        showOnboardingOverlay();
    } else {
        initializeWorkspace();
    }
});

function showOnboardingOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "planner-onboarding-overlay";
    overlay.innerHTML = `
        <div class="onboarding-card">
            <span class="onboarding-icon">📅</span>
            <h2>Interactive Event Planner</h2>
            <p>You haven't initiated an active event draft yet. Explore the layout designer and timeline manager using a mock event, or start drafting your own custom setup.</p>
            <div class="onboarding-buttons">
                <button class="onboarding-btn primary" onclick="loadDemoEvent()">Explore with Demo Event</button>
                <button class="onboarding-btn secondary" onclick="window.location.href='create-event.html'">Create Custom Event</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

window.loadDemoEvent = function () {
    const demoEvent = {
        title: "Annual Global Summit 2026",
        category: "Conference",
        description: "A premium annual corporate event gathering international delegates.",
        event_date: "2026-10-15",
        start_time: "09:00",
        end_time: "17:00",
        participants: 100,
        preferred_location: "Kuala Lumpur",
        budget: 15000,
        required_capacity: 100,
        venue_type: "Indoor",
        parking_required: 1,
        wifi_required: 1,
        projector_required: 1,
        catering_required: 1,
        sound_system_required: 1,
        stage_setup_required: 1,
        other_requirements: "Stage backdrop setup, registration tables.",
        selected_venue: "EQ Hotel Grand Ballroom"
    };

    const demoTimeline = [
        { time: "09:00", activity: "Guest Registration & Networking" },
        { time: "09:30", activity: "Opening Address by Keynote Speaker" },
        { time: "10:30", activity: "Panel Discussion: Future of AI in Enterprise" },
        { time: "12:30", activity: "Catered Executive Networking Lunch" },
        { time: "14:00", activity: "Interactive Product Showcase & Demo" },
        { time: "16:00", activity: "Closing Remarks & Evening Reception" }
    ];

    localStorage.setItem("eventDraft", JSON.stringify(demoEvent));
    localStorage.setItem("selectedVenue", "EQ Hotel Grand Ballroom");
    localStorage.setItem("eventTimeline", JSON.stringify(demoTimeline));
    localStorage.setItem("isDemoMode", "true");
    localStorage.removeItem("eventLayout");

    window.location.reload();
};

async function initializeWorkspace() {
    // If editEventId is set, fetch the event details from the server to ensure eventData is fully in sync
    const editEventId = localStorage.getItem("editEventId");
    if (editEventId) {
        try {
            const response = await fetch(`${API_BASE}/event/${editEventId}`);
            const dbEvent = await response.json();
            if (dbEvent && dbEvent.id) {
                eventData = {
                    title: dbEvent.title,
                    category: dbEvent.category,
                    description: dbEvent.description,
                    event_date: dbEvent.event_date,
                    event_date_end: dbEvent.event_date_end,
                    start_time: dbEvent.start_time,
                    end_time: dbEvent.end_time,
                    participants: dbEvent.participants,
                    preferred_location: dbEvent.preferred_location,
                    budget: dbEvent.budget,
                    required_capacity: dbEvent.required_capacity,
                    venue_type: dbEvent.venue_type,
                    parking_required: dbEvent.parking_required,
                    wifi_required: dbEvent.wifi_required,
                    projector_required: dbEvent.projector_required,
                    catering_required: dbEvent.catering_required,
                    sound_system_required: dbEvent.sound_system_required,
                    stage_setup_required: dbEvent.stage_setup_required,
                    other_requirements: dbEvent.other_requirements,
                    selected_venue: dbEvent.selected_venue,
                    privacy: dbEvent.privacy
                };
                localStorage.setItem("eventDraft", JSON.stringify(eventData));
                localStorage.setItem("selectedVenue", dbEvent.selected_venue);
                selectedVenue = dbEvent.selected_venue;
            }
        } catch (e) {
            console.error("Error syncing event details:", e);
        }
    }

    // ==========================
    // EVENT SUMMARY
    // ==========================
    document.getElementById("eventType").innerText = eventData.category;
    document.getElementById("venueName").innerText = selectedVenue;
    document.getElementById("capacity").innerText = eventData.required_capacity + " Attendees";
    document.getElementById("venueType").innerText = eventData.venue_type;

    // Show Demo badge if in Demo Mode
    if (localStorage.getItem("isDemoMode") === "true") {
        showDemoBadge();
    }

    // ==========================
    // VENUE LAYOUT DESIGN SPACE
    // ==========================
    await initializeLayout();

    initCapacityTargetSelector();

    // Start timeline initialization
    await initTimeline();

    // Update 3D Backdrop Preview Card Theme Badge & Thumbnail
    updateBackdropPreviewCard();
}

function updateBackdropPreviewCard() {
    const badge = document.getElementById("backdropThemeBadge");
    const thumbnail = document.querySelector(".backdrop-preview-thumbnail");
    if (!badge && !thumbnail) return;

    let themeName = "No Theme";
    const setupRaw = localStorage.getItem("eventBackdropSetup") || (eventData ? eventData.backdrop_setup : null);

    if (setupRaw && setupRaw !== "null" && setupRaw !== "None" && setupRaw !== "") {
        try {
            const parsed = JSON.parse(setupRaw);
            themeName = parsed.theme || "Custom Theme";
        } catch (e) {
            themeName = setupRaw.replace(/"/g, "") || "Custom Theme";
        }
    }

    if (badge) {
        badge.innerText = themeName;
    }

    if (thumbnail) {
        let coverImg = "https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=1200";
        const cleanTheme = themeName.toLowerCase();
        if (cleanTheme.includes("corporate") || cleanTheme.includes("elegance")) {
            coverImg = "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200";
        } else if (cleanTheme.includes("tech") || cleanTheme.includes("summit") || cleanTheme.includes("cyber") || cleanTheme.includes("ai")) {
            coverImg = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200";
        } else if (cleanTheme.includes("vintage") || cleanTheme.includes("celebration") || cleanTheme.includes("classic") || cleanTheme.includes("wedding")) {
            coverImg = "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1200";
        }
        thumbnail.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${coverImg}')`;
    }
}

function initCapacityTargetSelector() {
    const selector = document.getElementById("layoutTargetCapacity");
    if (!selector) return;

    selector.innerHTML = "";
    const cap = eventData ? (parseInt(eventData.required_capacity) || 100) : 100;

    // Full options range from 100 Pax to 1000 Pax in steps of 100
    let options = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

    // Ensure current capacity value is in options list
    if (!options.includes(cap)) {
        options.push(cap);
        options.sort((a, b) => a - b);
    }

    options.forEach(val => {
        const opt = document.createElement("option");
        opt.value = val;
        opt.innerText = val + " Pax";
        if (val === cap) {
            opt.selected = true;
        }
        selector.appendChild(opt);
    });

    selector.addEventListener("change", (e) => {
        const newCap = parseInt(e.target.value);
        eventData.required_capacity = newCap;
        localStorage.setItem("eventDraft", JSON.stringify(eventData));

        const capDisplay = document.getElementById("capacity");
        if (capDisplay) {
            capDisplay.innerText = newCap + " Attendees";
        }

        applyLayoutPreset(lastAppliedPreset || 'banquet');
    });
}

// ==========================
// TIMELINE TEMPLATES
// ==========================

const timelineTemplates = {

    "Conference": [
        "Registration",
        "Opening Ceremony",
        "Keynote Session",
        "Lunch Break",
        "Panel Discussion",
        "Closing Remarks"
    ],

    "Seminar": [
        "Registration",
        "Welcome Speech",
        "Main Presentation",
        "Q&A Session",
        "Networking",
        "Closing"
    ],

    "Workshop": [
        "Registration",
        "Introduction",
        "Hands-On Session",
        "Break",
        "Group Activity",
        "Wrap Up"
    ],

    "Networking": [
        "Guest Arrival",
        "Ice Breaking",
        "Networking Session",
        "Refreshments",
        "Business Matching",
        "Closing"
    ],

    "Corporate Dinner": [
        "Guest Arrival",
        "Welcome Speech",
        "Dinner Service",
        "Entertainment",
        "Award Ceremony",
        "Closing"
    ],

    "Training": [
        "Registration",
        "Training Session 1",
        "Break",
        "Training Session 2",
        "Assessment",
        "Closing"
    ],

    "Product Launch": [
        "Guest Registration",
        "Opening Speech",
        "Product Introduction",
        "Live Demonstration",
        "Media Session",
        "Networking"
    ]

};

// ==========================
// DYNAMIC TIMELINE
// ==========================

let timelineEvents = [];

async function initTimeline() {
    const cachedTimeline = localStorage.getItem("eventTimeline");
    if (cachedTimeline) {
        try {
            timelineEvents = JSON.parse(cachedTimeline);
        } catch (e) {
            console.error("Error parsing cached timeline:", e);
        }
    }

    if (timelineEvents.length === 0) {
        const editEventId = localStorage.getItem("editEventId");
        if (editEventId) {
            try {
                const response = await fetch(`${API_BASE}/event/${editEventId}`);
                const dbEvent = await response.json();
                if (dbEvent.timeline && dbEvent.timeline !== "[]" && dbEvent.timeline !== "") {
                    timelineEvents = JSON.parse(dbEvent.timeline);
                }
            } catch (e) {
                console.error("Error fetching db event timeline:", e);
            }
        }
    }

    if (timelineEvents.length === 0) {
        generateDefaultTimeline();
    }

    renderTimeline();
}

function generateDefaultTimeline() {
    const activities = timelineTemplates[eventData.category];
    timelineEvents = [];
    if (activities) {
        const start = eventData.start_time;
        const end = eventData.end_time;
        const startParts = start.split(":");
        const endParts = end.split(":");

        const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
        const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
        const totalMinutes = endMinutes - startMinutes;

        const interval = Math.floor(totalMinutes / activities.length);

        activities.forEach((activity, index) => {
            const currentMinutes = startMinutes + (interval * index);
            const hours = Math.floor(currentMinutes / 60).toString().padStart(2, "0");
            const minutes = (currentMinutes % 60).toString().padStart(2, "0");
            const displayTime = `${hours}:${minutes}`;

            timelineEvents.push({
                time: displayTime,
                activity: activity
            });
        });
    }
}

function renderTimeline() {
    const timelineContainer = document.getElementById("timelineContainer");
    if (!timelineContainer) return;

    timelineContainer.innerHTML = "";

    timelineEvents.forEach((item, index) => {
        timelineContainer.innerHTML += `
        <div class="timeline-item" data-index="${index}">
            <div class="timeline-time-col">
                <input type="time" class="timeline-time-input" value="${item.time}" onchange="updateTimelineItemTime(${index}, this.value)">
            </div>
            <div class="timeline-content-col" style="flex-grow: 1; margin-left: 10px;">
                <input type="text" class="timeline-content-input" value="${item.activity}" placeholder="Activity name..." onchange="updateTimelineItemActivity(${index}, this.value)">
            </div>
            <button type="button" class="timeline-delete-btn" onclick="deleteTimelineItem(${index})" title="Delete activity">&times;</button>
        </div>
        `;
    });

    // Add "+ Add Activity" button at the bottom
    timelineContainer.innerHTML += `
    <div style="text-align: center; margin-top: 25px; width: 100%;">
        <button id="addTimelineItemBtn" type="button" class="add-timeline-btn" onclick="addTimelineItem()">+ Add Activity</button>
    </div>
    `;

    localStorage.setItem("eventTimeline", JSON.stringify(timelineEvents));
}

window.updateTimelineItemTime = function (index, val) {
    if (timelineEvents[index]) {
        timelineEvents[index].time = val;
        localStorage.setItem("eventTimeline", JSON.stringify(timelineEvents));
    }
};

window.updateTimelineItemActivity = function (index, val) {
    if (timelineEvents[index]) {
        timelineEvents[index].activity = val;
        localStorage.setItem("eventTimeline", JSON.stringify(timelineEvents));
    }
};

window.deleteTimelineItem = function (index) {
    timelineEvents.splice(index, 1);
    renderTimeline();
};

window.addTimelineItem = function () {
    let defaultTime = eventData.start_time || "09:00";
    if (timelineEvents.length > 0) {
        const lastTime = timelineEvents[timelineEvents.length - 1].time;
        const parts = lastTime.split(":");
        let newMin = parseInt(parts[0]) * 60 + parseInt(parts[1]) + 30;
        const newHour = Math.floor(newMin / 60) % 24;
        const newMinPart = newMin % 60;
        defaultTime = `${newHour.toString().padStart(2, "0")}:${newMinPart.toString().padStart(2, "0")}`;
    }

    timelineEvents.push({
        time: defaultTime,
        activity: "New Activity"
    });
    renderTimeline();
};

// Initialization called from initializeWorkspace()

// ==========================
// SAVE EVENT TO DATABASE
// ==========================

const saveButton =
    document.getElementById("saveEventBtn");

if (saveButton) {

    saveButton.addEventListener("click", saveEvent);

}

async function saveEvent() {
    if (localStorage.getItem("isDemoMode") === "true") {
        Swal.fire({
            icon: "warning",
            title: "Demo Mode Workspace",
            html: `
                You are currently exploring EventSync in <strong>Demo Mode</strong>.
                <br><br>
                To save and publish your own events, please start a new custom event draft.
            `,
            confirmButtonText: "Create Custom Event",
            showCancelButton: true,
            cancelButtonText: "Continue Exploring",
            confirmButtonColor: "#c8a96b",
            cancelButtonColor: "#6b7280"
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem("eventDraft");
                localStorage.removeItem("selectedVenue");
                localStorage.removeItem("eventTimeline");
                localStorage.removeItem("eventLayout");
                localStorage.removeItem("isDemoMode");
                window.location.href = "create-event.html";
            }
        });
        return;
    }

    try {

        const mainCanvasForWidth = document.querySelector(".planner-right > .planner-card > .layout-preview-container > .layout-preview");
        const currentBaseWidth = mainCanvasForWidth ? mainCanvasForWidth.clientWidth : 600;

        const storedLayout = localStorage.getItem("eventLayout") || "[]";
        let parsedLayoutElements = [];
        try {
            const parsed = JSON.parse(storedLayout);
            parsedLayoutElements = parsed && Array.isArray(parsed.elements) ? 
            parsed.elements : (Array.isArray(parsed) ? parsed : []);
        } catch (e) {
            parsedLayoutElements = [];
        }

        const layoutObj = {
            canvasWidth: currentBaseWidth,
            elements: parsedLayoutElements
        };

        const latestEventDraft = JSON.parse(localStorage.getItem("eventDraft")) || eventData || {};
        const bannerVal = latestEventDraft.banner_image || (eventData ? eventData.banner_image : null);

        const payload = {

            ...eventData,
            ...latestEventDraft,

            banner_image: (bannerVal && bannerVal !== "null" && bannerVal !== "None") ? bannerVal : null,

            selected_venue: selectedVenue,

            created_by:
                localStorage.getItem("username") || "Guest",

            timeline: JSON.stringify(timelineEvents),

            layout: JSON.stringify(layoutObj),

            backdrop_setup: localStorage.getItem("eventBackdropSetup") || "null"

        };

        const editEventId =
            localStorage.getItem("editEventId");

        const url = editEventId
            ? `${API_BASE}/update-event/${editEventId}`
            : `${API_BASE}/create-event`;

        const method = editEventId

            ? "PUT"

            : "POST";

        const response = await fetch(
            url,
            {
                method: method,

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(payload)
            }
        );

        const result =
            await response.json();

        if (result.success) {

            if (editEventId) {

                Swal.fire({

                    icon: "success",

                    title: "Event Updated",

                    html: `
                Your event has been updated successfully.
                <br><br>
                All changes have been saved.
            `,

                    confirmButtonText: "View My Events",

                    confirmButtonColor: "#c8a96b",

                    allowOutsideClick: false

                }).then(() => {

                    localStorage.removeItem("editEventId");
                    localStorage.removeItem("eventDraft");
                    localStorage.removeItem("selectedVenue");
                    localStorage.removeItem("eventTimeline");
                    localStorage.removeItem("eventLayout");
                    localStorage.removeItem("eventBackdropSetup");

                    window.location.href = "my-events.html";

                });

            }
            else {

                Swal.fire({

                    icon: "success",

                    title: "Event Created 🎉",

                    html: `
                Your event has been created successfully.
                <br><br>
                You can now manage it from My Events.
            `,

                    confirmButtonText: "Go to My Events",

                    confirmButtonColor: "#c8a96b",

                    allowOutsideClick: false

                }).then(() => {

                    localStorage.removeItem("eventDraft");
                    localStorage.removeItem("selectedVenue");
                    localStorage.removeItem("eventTimeline");
                    localStorage.removeItem("eventLayout");
                    localStorage.removeItem("eventBackdropSetup");

                    window.location.href = "my-events.html";

                });

            }

        }
        else {

            Swal.fire({

                icon: "error",

                title: "Operation Failed",

                text: result.message,

                confirmButtonColor: "#d9534f"

            });

        }

    }
    catch (error) {

        console.error(error);

        Swal.fire({

            icon: "error",

            title: "Server Error",

            text: "Unable to save event. Please try again later.",

            confirmButtonColor: "#d9534f"

        });

    }

}

// ==========================
// INTERACTIVE DRAG & DROP DESIGN WORKSPACE
// ==========================
let layoutElements = [];
let activeDragElement = null;
let activeCanvas = null;
let dragStartX = 0;
let dragStartY = 0;
let elementStartX = 0;
let elementStartY = 0;
let plannerZoom = 1.0;

async function initializeLayout() {
    const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview-container > .layout-preview");
    if (!mainCanvas) return;

    // Load from cache if exists
    let cachedLayout = localStorage.getItem("eventLayout");
    if (!cachedLayout) {
        const editEventId = localStorage.getItem("editEventId");
        if (editEventId) {
            try {
                const response = await fetch(`${API_BASE}/event/${editEventId}`);
                const dbEvent = await response.json();
                if (dbEvent.layout && dbEvent.layout !== "[]" && dbEvent.layout !== "") {
                    try {
                        const parsed = JSON.parse(dbEvent.layout);
                        const elems = parsed && Array.isArray(parsed.elements) ? parsed.elements : (Array.isArray(parsed) ? parsed : []);
                        localStorage.setItem("eventLayout", JSON.stringify(elems));
                        cachedLayout = JSON.stringify(elems);
                    } catch (parseErr) {
                        localStorage.setItem("eventLayout", dbEvent.layout);
                        cachedLayout = dbEvent.layout;
                    }
                }
            } catch (e) {
                console.error("Error fetching db event layout:", e);
            }
        }
    }

    if (cachedLayout) {
        try {
            const parsed = JSON.parse(cachedLayout);
            if (parsed && Array.isArray(parsed.elements)) {
                layoutElements = parsed.elements;
            } else if (Array.isArray(parsed)) {
                layoutElements = parsed;
            } else {
                layoutElements = [];
            }

            // Verify if cached layout table count matches expected capacity table count
            const attendeeCount = eventData ? (parseInt(eventData.required_capacity) || 50) : 50;
            const tablesNeeded = Math.ceil(attendeeCount / 10);
            const cachedTablesCount = Array.isArray(layoutElements)
                ? layoutElements.filter(el => el.type === "table").length
                : 0;

            if (cachedTablesCount !== tablesNeeded) {
                console.log(`Table quantity mismatch (cached: ${cachedTablesCount}, needed: ${tablesNeeded}). Regenerating layout.`);
                layoutElements = [];
            }
        } catch (e) {
            console.error("Error parsing cached layout:", e);
            layoutElements = [];
        }
    }

    // Generate defaults if empty
    if (layoutElements.length === 0) {
        // Use the dynamic virtual canvas width based on capacity for layout coordinate math
        const canvasWidth = getWorkspaceWidth();
        const stageWidth = 300;
        layoutElements.push({
            id: "stage",
            type: "stage",
            label: "STAGE",
            x: Math.floor((canvasWidth - stageWidth) / 2),
            y: 20
        });

        // 2. Add Tables
        const attendeeCount = parseInt(eventData.required_capacity) || 50;
        const tablesNeeded = Math.ceil(attendeeCount / 10);

        const tableWidth = 120;
        let spacingX = 200;
        let spacingY = 130;
        let startTop = 150;

        // Use 2 columns by default (as in image 2), and wrap to 3 or 4 columns for larger events to avoid bottom overflow
        let cols = 2;
        if (tablesNeeded > 12) {
            cols = 3;
            spacingX = 180;
        }
        if (tablesNeeded > 18) {
            cols = 4;
            spacingX = 160;
        }

        for (let i = 1; i <= tablesNeeded; i++) {
            const index = i - 1;
            const row = Math.floor(index / cols);
            const col = index % cols;

            // Calculate coordinates to center tables grid row
            const totalColsThisRow = Math.min(cols, tablesNeeded - row * cols);
            const rowStartLeft = (canvasWidth - (totalColsThisRow - 1) * spacingX - tableWidth) / 2;

            const x = Math.floor(rowStartLeft + col * spacingX);
            const y = Math.floor(startTop + row * spacingY);

            layoutElements.push({
                id: "table-" + i,
                type: "table",
                label: "Table " + i,
                x: x,
                y: y
            });
        }
        localStorage.setItem("eventLayout", JSON.stringify(layoutElements));
    }

    // Render in main canvas
    renderLayout(mainCanvas, true);

    // Bind HTML5 Drop events to main canvas
    bindCanvasEvents(mainCanvas);

    // Initialize sidebar items dragging
    initSidebarComponents();
}

function getWorkspaceWidth() {
    const attendeeCount = eventData ? (parseInt(eventData.required_capacity) || 50) : 50;
    const tablesNeeded = Math.ceil(attendeeCount / 10);
    return Math.max(1200, Math.min(2600, 1200 + (tablesNeeded - 12) * 45));
}

function getWorkspaceHeight() {
    let maxY = 0;
    layoutElements.forEach(el => {
        const height = el.type === 'stage' ? 64 : (el.type === 'table' ? 120 : 48);
        if (el.y + height > maxY) {
            maxY = el.y + height;
        }
    });
    return Math.max(950, maxY + 100); // 100px bottom padding, minimum 950px
}

function renderLayout(canvas, isMinimized = false) {
    if (!canvas) return;

    const workspaceWidth = getWorkspaceWidth();
    const workspaceHeight = getWorkspaceHeight();
    const containerWidth = canvas.clientWidth || 500;

    // Add margin buffer to scale calculation when minimized to prevent component clipping at edges
    const scale = isMinimized ? (containerWidth / (workspaceWidth + 120)) : plannerZoom;

    canvas.innerHTML = "";

    const canvasDiv = document.createElement("div");
    canvasDiv.className = "layout-canvas";
    canvasDiv.style.width = workspaceWidth + "px";
    canvasDiv.style.height = workspaceHeight + "px";
    canvasDiv.style.position = "absolute";

    // Center it visually when minimized
    const leftMargin = isMinimized ? (60 * scale) : 0;
    const topMargin = isMinimized ? (40 * scale) : 0;
    canvasDiv.style.left = leftMargin + "px";
    canvasDiv.style.top = topMargin + "px";

    canvasDiv.style.transform = `scale(${scale})`;
    canvasDiv.style.transformOrigin = "top left";

    canvas.style.position = "relative";
    canvas.style.overflow = isMinimized ? "hidden" : "auto";
    canvas.style.height = (isMinimized ? (workspaceHeight + 80) : workspaceHeight) * scale + "px";

    if (isMinimized) {
        canvas.style.background = "transparent";
        canvas.style.border = "";
        canvas.style.width = "100%";
    } else {
        canvas.style.background = "#f9fafb";
        canvas.style.width = "100%";

        // Add a spacer to force natural scrollbar ranges for the scaled canvas size
        const spacer = document.createElement("div");
        spacer.style.width = (workspaceWidth * scale) + "px";
        spacer.style.height = (workspaceHeight * scale) + "px";
        spacer.style.pointerEvents = "none";
        canvas.appendChild(spacer);
    }

    canvas.appendChild(canvasDiv);

    layoutElements.forEach(el => {
        if (el.type === 'stage') {
            const stageDiv = document.createElement("div");
            stageDiv.className = "stage";
            stageDiv.setAttribute("data-layout-id", el.id);
            stageDiv.style.left = el.x + "px";
            stageDiv.style.top = el.y + "px";
            stageDiv.innerText = el.label;

            if (!isMinimized) {
                stageDiv.addEventListener("mousedown", (e) => startDragging(e, el.id));
                stageDiv.addEventListener("touchstart", (e) => startDragging(e, el.id), { passive: false });
            }

            canvasDiv.appendChild(stageDiv);
        } else if (el.type === 'table') {
            const tableDiv = document.createElement("div");
            tableDiv.className = "table-wrapper";
            tableDiv.setAttribute("data-layout-id", el.id);
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

            if (!isMinimized) {
                tableDiv.addEventListener("mousedown", (e) => startDragging(e, el.id));
                tableDiv.addEventListener("touchstart", (e) => startDragging(e, el.id), { passive: false });
            }

            canvasDiv.appendChild(tableDiv);
        } else if (el.type === 'component') {
            const compDiv = document.createElement("div");
            compDiv.className = "component-wrapper";
            compDiv.setAttribute("data-layout-id", el.id);
            compDiv.style.left = el.x + "px";
            compDiv.style.top = el.y + "px";

            if (el.rotation === 90 || el.rotation === 270) {
                compDiv.classList.add("rotated");
            }

            compDiv.innerHTML = `
                <span>${el.label}</span>
                ${!isMinimized ? `
                    <div class="comp-actions">
                        <span class="rotate-comp-btn" onclick="rotateComponent('${el.id}', event)">↻</span>
                        <span class="delete-comp-btn" onclick="deleteComponent('${el.id}', event)">&times;</span>
                    </div>
                ` : ''}
            `;

            if (!isMinimized) {
                compDiv.addEventListener("mousedown", (e) => {
                    if (e.target.classList.contains('delete-comp-btn') || e.target.classList.contains('rotate-comp-btn')) return;
                    startDragging(e, el.id);
                });
                compDiv.addEventListener("touchstart", (e) => {
                    if (e.target.classList.contains('delete-comp-btn') || e.target.classList.contains('rotate-comp-btn')) return;
                    startDragging(e, el.id);
                }, { passive: false });
            }

            canvasDiv.appendChild(compDiv);
        }
    });
}

function startDragging(e, elementId) {
    e.preventDefault();
    activeDragElement = layoutElements.find(el => el.id === elementId);
    if (!activeDragElement) return;

    activeCanvas = e.currentTarget.closest(".layout-preview");

    // Dynamic width & height calculation from DOM
    const domEl = document.querySelector(`[data-layout-id="${elementId}"]`);
    if (domEl) {
        activeDragElement.width = domEl.offsetWidth;
        activeDragElement.height = domEl.offsetHeight;
    } else {
        activeDragElement.width = activeDragElement.type === 'stage' ? 300 : (activeDragElement.type === 'component' ? 150 : 120);
        activeDragElement.height = activeDragElement.type === 'stage' ? 64 : (activeDragElement.type === 'component' ? 48 : 120);
    }

    const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    dragStartX = clientX;
    dragStartY = clientY;
    elementStartX = activeDragElement.x;
    elementStartY = activeDragElement.y;

    document.addEventListener("mousemove", dragMove);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("touchmove", dragMove, { passive: false });
    document.addEventListener("touchend", dragEnd);
}

function dragMove(e) {
    if (!activeDragElement) return;
    e.preventDefault();

    const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
    if (clientX === undefined || clientY === undefined) return;

    const isModal = activeCanvas && !!activeCanvas.closest("#modalLayoutPreview");
    const currentScale = isModal ? plannerZoom : 1.0;
    const dx = (clientX - dragStartX) / currentScale;
    const dy = (clientY - dragStartY) / currentScale;

    let newX = elementStartX + dx;
    let newY = elementStartY + dy;

    // Use dynamic width/height read during startDragging
    let elWidth = activeDragElement.width || 120;
    let elHeight = activeDragElement.height || 120;

    const maxW = getWorkspaceWidth();
    const maxH = 3000;
    newX = Math.max(20, Math.min(newX, maxW - elWidth - 20));
    newY = Math.max(20, Math.min(newY, maxH - elHeight - 20));

    activeDragElement.x = newX;
    activeDragElement.y = newY;

    // Update position instantly on all matching elements on screen
    const DOMels = document.querySelectorAll(`[data-layout-id="${activeDragElement.id}"]`);
    DOMels.forEach(dom => {
        if (dom) {
            dom.style.left = newX + "px";
            dom.style.top = newY + "px";
        }
    });
}

function dragEnd() {
    activeDragElement = null;
    activeCanvas = null;
    document.removeEventListener("mousemove", dragMove);
    document.removeEventListener("mouseup", dragEnd);
    document.removeEventListener("touchmove", dragMove);
    document.removeEventListener("touchend", dragEnd);

    localStorage.setItem("eventLayout", JSON.stringify(layoutElements));
    syncModalPreview();
}

function syncModalPreview() {
    const modalCanvas = document.querySelector("#modalLayoutPreview > .layout-preview");
    if (modalCanvas) {
        renderLayout(modalCanvas);
    }
}

window.deleteComponent = function (id, event) {
    if (event) event.stopPropagation();
    layoutElements = layoutElements.filter(el => el.id !== id);
    localStorage.setItem("eventLayout", JSON.stringify(layoutElements));

    const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview-container > .layout-preview");
    if (mainCanvas) renderLayout(mainCanvas, true);

    syncModalPreview();
};

window.rotateComponent = function (id, event) {
    if (event) event.stopPropagation();
    const el = layoutElements.find(item => item.id === id);
    if (el) {
        // Toggle rotation
        const prevRotation = el.rotation || 0;
        const nextRotation = (prevRotation + 90) % 360;
        el.rotation = nextRotation;

        // Find DOM element to get current size before rendering
        const domEl = document.querySelector(`[data-layout-id="${id}"]`);
        if (domEl) {
            const currentW = domEl.offsetWidth;
            const currentH = domEl.offsetHeight;

            // Swap size dimensions because rotation toggles orientation
            const newW = currentH;
            const newH = currentW;

            const maxW = getWorkspaceWidth();
            const maxH = 3000;

            // Clamp within layout bounds
            if (el.x + newW > maxW) {
                el.x = maxW - newW;
            }
            if (el.y + newH > maxH) {
                el.y = maxH - newH;
            }
            if (el.x < 0) el.x = 0;
            if (el.y < 0) el.y = 0;
        }

        localStorage.setItem("eventLayout", JSON.stringify(layoutElements));

        const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview-container > .layout-preview");
        if (mainCanvas) renderLayout(mainCanvas, true);

        syncModalPreview();
    }
};

function initSidebarComponents() {
    const dragBoxes = document.querySelectorAll(".drag-items .drag-box");
    dragBoxes.forEach(box => {
        box.setAttribute("draggable", "true");
        box.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", box.innerText.trim());
        });
    });
}

function bindCanvasEvents(canvas) {
    if (!canvas) return;

    let lastDragX = 0;
    let lastDragY = 0;

    canvas.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.clientX || e.clientY) {
            lastDragX = e.clientX;
            lastDragY = e.clientY;
        }
    });

    canvas.addEventListener("drop", (e) => {
        e.preventDefault();
        const componentName = e.dataTransfer.getData("text/plain");
        if (!componentName) return;

        const rect = canvas.getBoundingClientRect();
        const workspaceWidth = getWorkspaceWidth();

        // Modal canvas is displayed at custom scale, dashboard is scaled
        const isModal = !!canvas.closest("#modalLayoutPreview");
        const scale = isModal ? plannerZoom : (rect.width / workspaceWidth);

        const scrollLeft = canvas.scrollLeft || 0;
        const scrollTop = canvas.scrollTop || 0;

        let x = (lastDragX - rect.left + scrollLeft) / scale - 75;
        let y = (lastDragY - rect.top + scrollTop) / scale - 24;

        const maxW = getWorkspaceWidth();
        const maxH = 3000;
        x = Math.max(20, Math.min(x, maxW - 150 - 20));
        y = Math.max(20, Math.min(y, maxH - 48 - 20));

        const newId = "comp-" + Date.now();
        layoutElements.push({
            id: newId,
            type: "component",
            label: componentName,
            x: x,
            y: y
        });

        localStorage.setItem("eventLayout", JSON.stringify(layoutElements));

        // Render both minimized and maximized workspaces
        const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview-container > .layout-preview");
        if (mainCanvas) renderLayout(mainCanvas, true);

        syncModalPreview();
    });
}

// Layout preset arrangements
let lastAppliedPreset = null;
window.applyLayoutPreset = function (presetType) {
    lastAppliedPreset = presetType;
    const attendeeCount = eventData ? (parseInt(eventData.required_capacity) || 50) : 50;
    const tablesNeeded = Math.ceil(attendeeCount / 10);
    const canvasWidth = getWorkspaceWidth();

    layoutElements = [];

    // 1. Stage always top center
    layoutElements.push({
        id: "stage",
        type: "stage",
        label: "STAGE",
        x: Math.floor((canvasWidth - 300) / 2),
        y: 20
    });

    if (presetType === 'banquet') {
        const maxLeftToLeftSpan = canvasWidth - 180;

        let cols = 4;
        if (tablesNeeded > 16) cols = 6;
        else if (tablesNeeded > 8) cols = 5;
        if (canvasWidth > 1500) cols = 8;
        if (canvasWidth > 2000) cols = 10;

        // Clamp column count to prevent horizontal overlapping
        const maxCols = Math.max(2, Math.floor(maxLeftToLeftSpan / 140) + 1);
        cols = Math.min(maxCols, cols);

        const rows = Math.ceil(tablesNeeded / cols);
        const spacingX = cols > 1 ? Math.min(220, maxLeftToLeftSpan / (cols - 1)) : 220;

        // Use a fixed spacingY of 135px to prevent vertical table overlapping
        const spacingY = 135;
        const startTop = 140;

        for (let i = 1; i <= tablesNeeded; i++) {
            const index = i - 1;
            const row = Math.floor(index / cols);
            const col = index % cols;

            const totalColsThisRow = Math.min(cols, tablesNeeded - row * cols);
            const rowWidth = (totalColsThisRow - 1) * spacingX;
            const rowStartLeft = (canvasWidth - 120 - rowWidth) / 2; // centers the table wrappers exactly

            const x = Math.floor(rowStartLeft + col * spacingX);
            const y = Math.floor(startTop + row * spacingY);

            layoutElements.push({
                id: "table-" + i,
                type: "table",
                label: "Table " + i,
                x: x,
                y: y
            });
        }
    } else if (presetType === 'classroom') {
        const startTop = 130;

        let colsCount = 2;
        if (tablesNeeded > 6) colsCount = 4;
        if (canvasWidth > 1500) colsCount = 6;
        if (canvasWidth > 2000) colsCount = 8;

        // Clamp column count to prevent horizontal overlapping
        const maxColsCount = Math.max(1, Math.floor((canvasWidth - 280) / 140) + 1);
        colsCount = Math.min(maxColsCount, colsCount);

        const colSpacing = colsCount > 1 ? (canvasWidth - 280) / (colsCount - 1) : 0;
        let xCoords = [];
        for (let i = 0; i < colsCount; i++) {
            xCoords.push(80 + i * colSpacing);
        }

        const rowsNeeded = Math.ceil(tablesNeeded / colsCount);
        // Use a fixed rowSpacing of 130px to prevent vertical table overlapping
        const rowSpacing = 130;

        for (let i = 1; i <= tablesNeeded; i++) {
            const index = i - 1;
            const colIndex = index % colsCount;
            const rowIndex = Math.floor(index / colsCount);

            const x = xCoords[colIndex];
            const y = Math.floor(startTop + rowIndex * rowSpacing);

            layoutElements.push({
                id: "table-" + i,
                type: "table",
                label: "Table " + i,
                x: x,
                y: y
            });
        }
    } else if (presetType === 'ushape') {
        const leftColX = 80;
        const rightColX = canvasWidth - 200;

        let tempTables = tablesNeeded;
        let layerConfigs = [];
        let L = 0;

        // Calculate maxVerticalCount dynamically to prevent overlaps and leftovers
        let maxVerticalCount = 8;
        while (true) {
            let tempCapacity = 0;
            let innerL = 0;
            const bottomRowY_temp = 160 + (maxVerticalCount - 1) * 135;
            
            while (true) {
                const leftX = leftColX + innerL * 200;
                const rightX = rightColX - innerL * 200;
                const widthSpan = rightX - leftX;
                const maxBottom = Math.max(0, Math.floor(widthSpan / 165) - 1);
                
                const startY = 160;
                const endY = bottomRowY_temp - innerL * 180;
                const layerMaxRows = Math.floor((endY - startY) / 135);
                
                if (maxBottom <= 0 || layerMaxRows <= 0) {
                    break;
                }
                
                tempCapacity += 2 * layerMaxRows + maxBottom;
                innerL++;
            }
            
            if (tempCapacity >= tablesNeeded || maxVerticalCount >= 25) {
                break;
            }
            maxVerticalCount++;
        }

        const spacingY = 135;
        const bottomRowY = 160 + (maxVerticalCount - 1) * spacingY;

        // Distribute tables into nested, concentric layers using solved geometry
        while (tempTables > 0) {
            const leftX = leftColX + L * 200;
            const rightX = rightColX - L * 200;
            const widthSpan = rightX - leftX;
            const maxBottom = Math.max(0, Math.floor(widthSpan / 165) - 1);
            
            const startY = 160;
            const endY = bottomRowY - L * 180;
            const layerMaxRows = Math.max(2, Math.floor((endY - startY) / 135));

            if (maxBottom <= 0 && L > 0) {
                break;
            }
            
            // Prevent standalone floating inner U-shape tables
            if (L > 0 && tempTables < 8) {
                break;
            }
            
            const layerCapacity = 2 * layerMaxRows + maxBottom;
            const numOnLayer = Math.min(tempTables, layerCapacity);
            
            let bCount = 0;
            let leftCount = 0;
            let rightCount = 0;
            
            if (numOnLayer <= 3) {
                if (numOnLayer === 3) {
                    leftCount = 1;
                    rightCount = 1;
                    bCount = 1;
                } else if (numOnLayer === 2) {
                    leftCount = 1;
                    rightCount = 1;
                    bCount = 0;
                } else {
                    leftCount = 0;
                    rightCount = 0;
                    bCount = 1;
                }
            } else {
                bCount = Math.min(maxBottom, Math.floor(numOnLayer / 3));
                leftCount = Math.min(layerMaxRows, Math.ceil((numOnLayer - bCount) / 2));
                rightCount = numOnLayer - bCount - leftCount;
                if (rightCount > layerMaxRows) {
                    const diff = rightCount - layerMaxRows;
                    rightCount = layerMaxRows;
                    bCount = Math.min(maxBottom, bCount + diff);
                }
            }
            
            layerConfigs.push({
                L: L,
                leftX: leftX,
                rightX: rightX,
                bCount: bCount,
                leftCount: leftCount,
                rightCount: rightCount
            });
            
            tempTables -= numOnLayer;
            L++;
            if (tempTables <= 0) break;
        }
        
        // Handle leftovers safely if any remain
        if (tempTables > 0 && layerConfigs.length > 0) {
            const extraLeft = Math.ceil(tempTables / 2);
            const extraRight = tempTables - extraLeft;
            layerConfigs[0].leftCount += extraLeft;
            layerConfigs[0].rightCount += extraRight;
        }
        
        let tId = 1;
        layerConfigs.forEach(conf => {
            const startY = 160;
            const endY = bottomRowY - conf.L * 180;
            
            // Left Column
            if (conf.leftCount > 0) {
                for (let i = 0; i < conf.leftCount; i++) {
                    const y = startY + i * 135;
                    layoutElements.push({
                        id: "table-" + tId,
                        type: "table",
                        label: "Table " + tId,
                        x: conf.leftX,
                        y: Math.floor(y)
                    });
                    tId++;
                }
            }
            
            // Right Column
            if (conf.rightCount > 0) {
                for (let i = 0; i < conf.rightCount; i++) {
                    const y = startY + i * 135;
                    layoutElements.push({
                        id: "table-" + tId,
                        type: "table",
                        label: "Table " + tId,
                        x: conf.rightX,
                        y: Math.floor(y)
                    });
                    tId++;
                }
            }
            
            // Bottom Row
            if (conf.bCount > 0) {
                const startX = conf.leftX;
                const endX = conf.rightX;
                const spanX = endX - startX;
                const stepX = spanX / (conf.bCount + 1);
                for (let i = 0; i < conf.bCount; i++) {
                    const x = startX + (i + 1) * stepX;
                    layoutElements.push({
                        id: "table-" + tId,
                        type: "table",
                        label: "Table " + tId,
                        x: Math.floor(x),
                        y: Math.floor(endY)
                    });
                    tId++;
                }
            }
        });
    } else if (presetType === 'boardroom') {
        let tempTables = tablesNeeded;
        let layerConfigs = [];
        let L = 0;
        
        // Solve for maxVerticalCount dynamically to prevent overlapping concentric rows
        let maxVerticalCount = 8;
        while (true) {
            let tempCapacity = 0;
            let innerL = 0;
            const bottomRowY_temp = 160 + (maxVerticalCount + 1) * 135;
            
            while (true) {
                const leftX = 80 + innerL * 200;
                const rightX = canvasWidth - 200 - innerL * 200;
                const widthSpan = rightX - leftX;
                const maxTop = Math.max(0, Math.floor(widthSpan / 165) - 1);
                
                const startY = 160 + innerL * 180;
                const endY = bottomRowY_temp - innerL * 180;
                const layerMaxRows = Math.floor((endY - startY) / 135) - 1;
                
                if (maxTop <= 0 || layerMaxRows <= 0) {
                    break;
                }
                
                tempCapacity += 2 * layerMaxRows + 2 * maxTop;
                innerL++;
            }
            
            if (tempCapacity >= tablesNeeded || maxVerticalCount >= 25) {
                break;
            }
            maxVerticalCount++;
        }

        const spacingY = 135;
        const bottomRowY = 160 + (maxVerticalCount + 1) * spacingY;
        
        // Distribute tables into nested Boardroom loops
        while (tempTables > 0) {
            const leftX = 80 + L * 200;
            const rightX = canvasWidth - 200 - L * 200;
            const widthSpan = rightX - leftX;
            const maxTop = Math.max(0, Math.floor(widthSpan / 165) - 1);
            
            const startY = 160 + L * 180;
            const endY = bottomRowY - L * 180;
            const layerMaxRows = Math.max(2, Math.floor((endY - startY) / 135) - 1);

            if (maxTop <= 0 && L > 0) {
                break;
            }
            
            // Prevent standalone floating inner boardroom tables
            if (L > 0 && tempTables < 12) {
                break;
            }
            
            const layerCapacity = 2 * layerMaxRows + 2 * maxTop;
            const numOnLayer = Math.min(tempTables, layerCapacity);
            
            let topCount = 0;
            let bottomCount = 0;
            let leftCount = 0;
            let rightCount = 0;
            
            if (numOnLayer <= 4) {
                if (numOnLayer === 4) {
                    topCount = 1;
                    bottomCount = 1;
                    leftCount = 1;
                    rightCount = 1;
                } else if (numOnLayer === 3) {
                    topCount = 1;
                    bottomCount = 1;
                    leftCount = 1;
                    rightCount = 0;
                } else if (numOnLayer === 2) {
                    topCount = 1;
                    bottomCount = 1;
                    leftCount = 0;
                    rightCount = 0;
                } else {
                    topCount = 1;
                    bottomCount = 0;
                    leftCount = 0;
                    rightCount = 0;
                }
            } else {
                topCount = Math.min(maxTop, Math.floor(numOnLayer / 4));
                bottomCount = topCount;
                leftCount = Math.min(layerMaxRows, Math.ceil((numOnLayer - topCount - bottomCount) / 2));
                rightCount = numOnLayer - topCount - bottomCount - leftCount;
                if (rightCount > layerMaxRows) {
                    const diff = rightCount - layerMaxRows;
                    rightCount = layerMaxRows;
                    topCount = Math.min(maxTop, topCount + Math.floor(diff / 2));
                    bottomCount = topCount;
                }
            }
            
            layerConfigs.push({
                L: L,
                leftX: leftX,
                rightX: rightX,
                topCount: topCount,
                bottomCount: bottomCount,
                leftCount: leftCount,
                rightCount: rightCount
            });
            
            tempTables -= numOnLayer;
            L++;
            if (tempTables <= 0) break;
        }
        
        // Handle leftovers safely if any remain
        if (tempTables > 0 && layerConfigs.length > 0) {
            const extraLeft = Math.ceil(tempTables / 2);
            const extraRight = tempTables - extraLeft;
            layerConfigs[0].leftCount += extraLeft;
            layerConfigs[0].rightCount += extraRight;
        }
        
        let tId = 1;
        layerConfigs.forEach(conf => {
            const startY = 160 + conf.L * 180;
            const endY = bottomRowY - conf.L * 180;
            
            // Top Row
            if (conf.topCount > 0) {
                const stepX = (conf.rightX - conf.leftX) / (conf.topCount + 1);
                for (let i = 0; i < conf.topCount; i++) {
                    const x = conf.leftX + (i + 1) * stepX;
                    layoutElements.push({
                        id: "table-" + tId,
                        type: "table",
                        label: "Table " + tId,
                        x: Math.floor(x),
                        y: Math.floor(startY)
                    });
                    tId++;
                }
            }
            
            // Bottom Row
            if (conf.bottomCount > 0) {
                const stepX = (conf.rightX - conf.leftX) / (conf.bottomCount + 1);
                for (let i = 0; i < conf.bottomCount; i++) {
                    const x = conf.rightX - (i + 1) * stepX;
                    layoutElements.push({
                        id: "table-" + tId,
                        type: "table",
                        label: "Table " + tId,
                        x: Math.floor(x),
                        y: Math.floor(endY)
                    });
                    tId++;
                }
            }
            
            // Left Column
            if (conf.leftCount > 0) {
                for (let i = 0; i < conf.leftCount; i++) {
                    const y = startY + (i + 1) * 135;
                    layoutElements.push({
                        id: "table-" + tId,
                        type: "table",
                        label: "Table " + tId,
                        x: conf.leftX,
                        y: Math.floor(y)
                    });
                    tId++;
                }
            }
            
            // Right Column
            if (conf.rightCount > 0) {
                for (let i = 0; i < conf.rightCount; i++) {
                    const y = startY + (i + 1) * 135;
                    layoutElements.push({
                        id: "table-" + tId,
                        type: "table",
                        label: "Table " + tId,
                        x: conf.rightX,
                        y: Math.floor(y)
                    });
                    tId++;
                }
            }
        });
    } else if (presetType === 'cabaret') {
        const originX = canvasWidth / 2;
        const originY = 60;

        let tempTables = tablesNeeded;
        let rings = [];
        let ringIndex = 0;
        const radStart = 260;
        const radStep = 145;

        // Maximum allowed distance from originX to canvas side edges (with 80px margin buffer)
        const maxAllowedXSpan = Math.max(300, (canvasWidth / 2) - 100);

        // Dynamically compute optimal ring capacities and add concentric arcs outward
        while (tempTables > 0) {
            const radius = radStart + ringIndex * radStep;

            // Calculate start angle such that radius * cos(startAngle) never exceeds maxAllowedXSpan
            let startRad = Math.PI / 12; // default ~15 deg
            if (radius * Math.cos(startRad) > maxAllowedXSpan) {
                const ratio = Math.min(0.96, maxAllowedXSpan / radius);
                startRad = Math.acos(ratio);
            }
            const endRad = Math.PI - startRad;
            const spanRad = endRad - startRad;

            // Max capacity of this ring with at least 145px spacing
            const ringCapacity = Math.max(2, Math.floor((radius * spanRad) / 145) + 1);
            const tablesOnRing = Math.min(tempTables, ringCapacity);

            rings.push({
                radius: radius,
                tables: tablesOnRing,
                startRad: startRad,
                endRad: endRad
            });

            tempTables -= tablesOnRing;
            ringIndex++;
            if (ringIndex > 25) break;
        }

        if (tempTables > 0 && rings.length > 0) {
            rings[rings.length - 1].tables += tempTables;
        }

        let tInserted = 0;
        rings.forEach(ring => {
            const span = ring.endRad - ring.startRad;
            const step = ring.tables > 1 ? (span / (ring.tables - 1)) : span;

            for (let i = 0; i < ring.tables; i++) {
                const angle = ring.startRad + i * step;
                let x = originX + ring.radius * Math.cos(angle) - 60;
                let y = originY + ring.radius * Math.sin(angle) - 60;

                // Clamp within canvas safety bounds (padding of 30px left and right)
                x = Math.max(30, Math.min(x, canvasWidth - 150));
                y = Math.max(30, y);

                layoutElements.push({
                    id: "table-" + (tInserted + i + 1),
                    type: "table",
                    label: "Table " + (tInserted + i + 1),
                    x: Math.floor(x),
                    y: Math.floor(y)
                });
            }
            tInserted += ring.tables;
        });
    }

    localStorage.setItem("eventLayout", JSON.stringify(layoutElements));

    const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview-container > .layout-preview");
    if (mainCanvas) renderLayout(mainCanvas, true);

    const modalCanvas = document.querySelector("#modalLayoutPreview > .layout-preview");
    if (modalCanvas) renderLayout(modalCanvas, false);

    Swal.fire({
        icon: 'success',
        title: 'Layout Preset Applied',
        text: `Applied the ${presetType} layout configuration successfully!`,
        timer: 1500,
        showConfirmButton: false
    });
};

// Set up Maximize Modal Trigger Listeners
document.addEventListener("DOMContentLoaded", () => {
    const maximizeBtn = document.getElementById("maximizeLayoutBtn");
    const layoutModal = document.getElementById("layoutModal");
    const closeBtn = document.getElementById("closeLayoutModalBtn");
    const modalLayoutPreview = document.getElementById("modalLayoutPreview");

    if (maximizeBtn && layoutModal && closeBtn && modalLayoutPreview) {
        maximizeBtn.addEventListener("click", () => {
            modalLayoutPreview.innerHTML = `<div class="layout-preview"></div>`;
            const modalCanvas = modalLayoutPreview.querySelector(".layout-preview");

            renderLayout(modalCanvas, false);
            bindCanvasEvents(modalCanvas);
            initSidebarComponents(); // Initialize draggable components inside modal sidebar

            layoutModal.style.display = "flex";
            document.body.style.overflow = "hidden";

            // Reset modal sidebar scroll to top
            const sidebar = document.querySelector(".modal-sidebar");
            if (sidebar) sidebar.scrollTop = 0;
        });

        closeBtn.addEventListener("click", () => {
            layoutModal.style.display = "none";
            document.body.style.overflow = "";
            modalLayoutPreview.innerHTML = "";
        });

        layoutModal.addEventListener("click", (e) => {
            if (e.target === layoutModal) {
                layoutModal.style.display = "none";
                document.body.style.overflow = "";
                modalLayoutPreview.innerHTML = "";
            }
        });
    }
});

window.goToVRVisualizer = function () {
    localStorage.setItem("eventLayout", JSON.stringify(layoutElements));
    localStorage.setItem("eventTimeline", JSON.stringify(timelineEvents));
    window.location.href = "vr-backdrop.html";
};

// Add listeners to ensure the minimized layout preview resizes dynamically and measures correctly on load
window.addEventListener("load", () => {
    const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview-container > .layout-preview");
    if (mainCanvas) {
        renderLayout(mainCanvas, true);
    }
});

window.addEventListener("resize", () => {
    const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview-container > .layout-preview");
    if (mainCanvas) {
        renderLayout(mainCanvas, true);
    }
});

function showDemoBadge() {
    // Add badge to card title
    const cardTitle = document.querySelector(".planner-left > .planner-card > .card-title");
    if (cardTitle && !document.getElementById("demoBadge")) {
        const badge = document.createElement("span");
        badge.id = "demoBadge";
        badge.style.background = "#c8a96b";
        badge.style.color = "#111827";
        badge.style.fontSize = "14px";
        badge.style.padding = "6px 12px";
        badge.style.borderRadius = "12px";
        badge.style.marginLeft = "15px";
        badge.style.fontWeight = "bold";
        badge.style.verticalAlign = "middle";
        badge.innerText = "DEMO MODE";
        cardTitle.appendChild(badge);
    }
}

window.setPlannerZoom = function (zoomValue) {
    plannerZoom = zoomValue;

    // Update zoom buttons style
    const zoomButtons = document.querySelectorAll(".zoom-controls button");
    zoomButtons.forEach(btn => {
        const val = parseFloat(btn.getAttribute("data-zoom"));
        if (val === zoomValue) {
            btn.style.background = "#c8a96b";
            btn.style.color = "#111827";
            btn.style.fontWeight = "bold";
        } else {
            btn.style.background = "transparent";
            btn.style.color = "white";
            btn.style.fontWeight = "normal";
        }
    });

    const modalCanvas = document.querySelector("#modalLayoutPreview > .layout-preview");
    if (modalCanvas) {
        renderLayout(modalCanvas, false);
    }
};