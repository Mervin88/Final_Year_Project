// ==========================
// GET EVENT DATA
// ==========================

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
        participants: 120,
        preferred_location: "Kuala Lumpur",
        budget: 15000,
        required_capacity: 120,
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

function initializeWorkspace() {
    // ==========================
    // EVENT SUMMARY
    // ==========================
    document.getElementById("eventType").innerText = eventData.category;
    document.getElementById("venueName").innerText = selectedVenue;
    document.getElementById("capacity").innerText = eventData.required_capacity + " Attendees";
    document.getElementById("venueType").innerText = eventData.venue_type;

    // ==========================
    // VENUE LAYOUT DESIGN SPACE
    // ==========================
    initializeLayout();

    // Start timeline initialization
    initTimeline();
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
                const response = await fetch(`http://127.0.0.1:5000/event/${editEventId}`);
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

        const payload = {

            ...eventData,

            selected_venue: selectedVenue,

            created_by:
                localStorage.getItem("username") || "Guest",

            timeline: JSON.stringify(timelineEvents)

        };

        const editEventId =
            localStorage.getItem("editEventId");

        const url = editEventId

            ? `http://127.0.0.1:5000/update-event/${editEventId}`

            : "http://127.0.0.1:5000/create-event";

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

function initializeLayout() {
    const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview");
    if (!mainCanvas) return;

    // Load from cache if exists
    const cachedLayout = localStorage.getItem("eventLayout");
    if (cachedLayout) {
        try {
            layoutElements = JSON.parse(cachedLayout);

            // Verify if cached layout table count matches expected capacity table count
            const attendeeCount = eventData ? (parseInt(eventData.required_capacity) || 50) : 50;
            const tablesNeeded = Math.ceil(attendeeCount / 10);
            const cachedTablesCount = layoutElements.filter(el => el.type === "table").length;

            if (cachedTablesCount !== tablesNeeded) {
                console.log(`Table quantity mismatch (cached: ${cachedTablesCount}, needed: ${tablesNeeded}). Regenerating layout.`);
                layoutElements = [];
            }
        } catch (e) {
            console.error("Error parsing cached layout:", e);
        }
    }

    // Generate defaults if empty
    if (layoutElements.length === 0) {
        // 1. Add Stage at top center
        const canvasWidth = mainCanvas.clientWidth || 600;
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
        const spacingX = 150;
        const spacingY = 150;
        const startTop = 150;
        const cols = Math.floor((canvasWidth - 40) / spacingX) || 3;

        for (let i = 1; i <= tablesNeeded; i++) {
            const index = i - 1;
            const row = Math.floor(index / cols);
            const col = index % cols;

            // Calculate coordinates to center tables grid row
            const totalColsThisRow = Math.min(cols, tablesNeeded - row * cols);
            const rowWidth = totalColsThisRow * spacingX;
            const rowStartLeft = (canvasWidth - rowWidth) / 2 + 15;

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
    renderLayout(mainCanvas);

    // Bind HTML5 Drop events to main canvas
    bindCanvasEvents(mainCanvas);

    // Initialize sidebar items dragging
    initSidebarComponents();
}

function renderLayout(canvas) {
    if (!canvas) return;
    canvas.innerHTML = "";

    layoutElements.forEach(el => {
        if (el.type === 'stage') {
            const stageDiv = document.createElement("div");
            stageDiv.className = "stage";
            stageDiv.setAttribute("data-layout-id", el.id);
            stageDiv.style.left = el.x + "px";
            stageDiv.style.top = el.y + "px";
            stageDiv.innerText = el.label;

            stageDiv.addEventListener("mousedown", (e) => startDragging(e, el.id));
            stageDiv.addEventListener("touchstart", (e) => startDragging(e, el.id), { passive: false });

            canvas.appendChild(stageDiv);
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

            tableDiv.addEventListener("mousedown", (e) => startDragging(e, el.id));
            tableDiv.addEventListener("touchstart", (e) => startDragging(e, el.id), { passive: false });

            canvas.appendChild(tableDiv);
        } else if (el.type === 'component') {
            const compDiv = document.createElement("div");
            compDiv.className = "component-wrapper";
            compDiv.setAttribute("data-layout-id", el.id);
            compDiv.style.left = el.x + "px";
            compDiv.style.top = el.y + "px";

            compDiv.innerHTML = `
                <span>${el.label}</span>
                <span class="delete-comp-btn" onclick="deleteComponent('${el.id}', event)">&times;</span>
            `;

            compDiv.addEventListener("mousedown", (e) => {
                if (e.target.classList.contains('delete-comp-btn')) return;
                startDragging(e, el.id);
            });
            compDiv.addEventListener("touchstart", (e) => {
                if (e.target.classList.contains('delete-comp-btn')) return;
                startDragging(e, el.id);
            }, { passive: false });

            canvas.appendChild(compDiv);
        }
    });
}

function startDragging(e, elementId) {
    e.preventDefault();
    activeDragElement = layoutElements.find(el => el.id === elementId);
    if (!activeDragElement) return;

    activeCanvas = e.currentTarget.closest(".layout-preview");

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

    const dx = clientX - dragStartX;
    const dy = clientY - dragStartY;

    let newX = elementStartX + dx;
    let newY = elementStartY + dy;

    // Boundary check relative to parent canvas
    const canvas = activeCanvas || document.querySelector(".layout-preview");
    if (!canvas) return;

    let elWidth = 120;
    let elHeight = 120;
    if (activeDragElement.type === 'stage') {
        elWidth = 300;
        elHeight = 64;
    } else if (activeDragElement.type === 'component') {
        elWidth = 150;
        elHeight = 48;
    }

    newX = Math.max(0, Math.min(newX, canvas.clientWidth - elWidth));
    newY = Math.max(0, Math.min(newY, canvas.scrollHeight - elHeight));

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

    const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview");
    if (mainCanvas) renderLayout(mainCanvas);

    syncModalPreview();
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

    canvas.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    canvas.addEventListener("drop", (e) => {
        e.preventDefault();
        const componentName = e.dataTransfer.getData("text/plain");
        if (!componentName) return;

        const rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left + canvas.scrollLeft - 75;
        let y = e.clientY - rect.top + canvas.scrollTop - 24;

        x = Math.max(0, Math.min(x, canvas.clientWidth - 150));
        y = Math.max(0, Math.min(y, canvas.scrollHeight - 48));

        const newId = "comp-" + Date.now();
        layoutElements.push({
            id: newId,
            type: "component",
            label: componentName,
            x: x,
            y: y
        });

        localStorage.setItem("eventLayout", JSON.stringify(layoutElements));

        const mainCanvas = document.querySelector(".planner-right > .planner-card > .layout-preview");
        if (mainCanvas) renderLayout(mainCanvas);

        syncModalPreview();
    });
}

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

            renderLayout(modalCanvas);
            bindCanvasEvents(modalCanvas);

            layoutModal.style.display = "flex";
            document.body.style.overflow = "hidden";
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