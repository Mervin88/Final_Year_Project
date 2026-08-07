const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

let viewingEventId = localStorage.getItem("viewingEventId");
const username = localStorage.getItem("username") || "Guest";

// Fallback to event ID 1 if viewingEventId is not set
if (!viewingEventId) {
    viewingEventId = "1";
    localStorage.setItem("viewingEventId", viewingEventId);
}

let eventDetails = null;

// Mock catalog for events 1, 2, 3, 4 fallback lookup
const mockEventsCatalog = {
    "1": {
        id: 1,
        title: "Business Leadership Summit 2026",
        category: "Conference",
        selected_venue: "Kuala Lumpur Convention Centre",
        event_date: "2026-05-15",
        event_date_end: null,
        participants: 1250,
        preferred_location: "Kuala Lumpur",
        venue_type: "Indoor",
        description: "The Business Leadership Summit 2026 gathers corporate leaders, entrepreneurs, and innovators from across the region to discuss strategies, technologies, and future opportunities in business.",
        banner_image: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600",
        timeline: JSON.stringify([
            { time: "9:00 AM", activity: "Opening Keynote & Executive Welcome" },
            { time: "11:00 AM", activity: "Corporate Innovation & AI Leadership Panel" },
            { time: "2:00 PM", activity: "Strategic Partnership & Expo Networking" }
        ])
    },
    "2": {
        id: 2,
        title: "Corporate Networking Night",
        category: "Networking",
        selected_venue: "EQ Hotel Kuala Lumpur",
        event_date: "2026-05-20",
        event_date_end: null,
        participants: 350,
        preferred_location: "Kuala Lumpur",
        venue_type: "Indoor",
        description: "An exclusive high-level evening for business executives, founders, and industry leaders to connect, share insights, and foster strategic corporate partnerships in a luxury setting.",
        banner_image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600",
        timeline: JSON.stringify([
            { time: "6:30 PM", activity: "VIP Reception & Welcome Cocktails" },
            { time: "7:30 PM", activity: "Executive Fireside Discussion" },
            { time: "8:30 PM", activity: "Interactive Business Networking & Buffet" }
        ])
    },
    "3": {
        id: 3,
        title: "Tech Innovation Workshop",
        category: "Workshop",
        selected_venue: "MITEC Kuala Lumpur",
        event_date: "2026-05-28",
        event_date_end: null,
        participants: 250,
        preferred_location: "Kuala Lumpur",
        venue_type: "Indoor",
        description: "Hands-on tech workshop focusing on artificial intelligence, cloud architecture, agile design thinking, and practical software engineering for modern enterprise teams.",
        banner_image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1600",
        timeline: JSON.stringify([
            { time: "9:30 AM", activity: "Enterprise AI & Cloud Infrastructure Sprint" },
            { time: "11:30 AM", activity: "Hands-on Prototyping & UX System Design" },
            { time: "2:30 PM", activity: "Interactive Code Showcase & Feedback Session" }
        ])
    },
    "4": {
        id: 4,
        title: "Executive Growth Seminar",
        category: "Seminar",
        selected_venue: "Sunway Resort Hotel",
        event_date: "2026-05-30",
        event_date_end: null,
        participants: 500,
        preferred_location: "Selangor",
        venue_type: "Indoor",
        description: "Transformational seminar for senior managers and directors looking to scale organizational culture, optimize operations, and master strategic brand leadership.",
        banner_image: "https://images.unsplash.com/photo-1515169067868-5387ec356754?q=80&w=1600",
        timeline: JSON.stringify([
            { time: "9:00 AM", activity: "Organizational Scaling & Culture Keynote" },
            { time: "11:00 AM", activity: "Operational Leadership & Brand Mastery" },
            { time: "2:00 PM", activity: "Strategic Executive Q&A & Wrap-Up" }
        ])
    }
};

// Speaker database keyed by event ID
const speakerLibrary = {
    "1": [
        { name: "Dr. Alex Morgan", role: "Chief Innovation Officer", company: "TechCorp Global", topic: "AI Transformation in Enterprise", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600", bio: "Over 15 years leading enterprise AI transformation initiatives across Fortune 500 companies." },
        { name: "Sarah Jenkins", role: "VP of Strategy", company: "GlobalVentures", topic: "Agile Leadership & Organizational Culture", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600", bio: "Expert in organizational scaling, agile team dynamics, and strategic growth frameworks." },
        { name: "Michael Chen", role: "Founder & CEO", company: "NexaGroup", topic: "Scaling Startups in Emerging Markets", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600", bio: "Serial tech entrepreneur having scaled 3 tech companies across Southeast Asia." }
    ],
    "2": [
        { name: "David Vance", role: "Managing Partner", company: "Horizon Capital", topic: "Strategic Alliances & Venture Capital", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600", bio: "Managing partner overseeing $250M tech & enterprise growth fund." },
        { name: "Elena Rostova", role: "Director of Networking", company: "Global Connect", topic: "High-Impact Executive Relationships", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=600", bio: "Leading global executive networking circles and cross-border partnerships." },
        { name: "Marcus Sterling", role: "Managing Director", company: "Premier Luxe", topic: "Luxury Brand Positioning & Partnerships", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=600", bio: "Pioneering brand strategy and corporate partnerships across luxury markets." }
    ],
    "3": [
        { name: "Dr. Aris Thorne", role: "Head of AI Engineering", company: "DeepCloud Systems", topic: "Building Resilient Neural Pipelines", img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=600", bio: "PhD in Machine Learning leading deep learning infrastructure and cloud AI sprints." },
        { name: "Jessica Lin", role: "Lead Cloud Architect", company: "SystemX Solutions", topic: "Microservices & Serverless Scaling", img: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=600", bio: "Specialized in microservice resilience, Kubernetes orchestration, and serverless backends." },
        { name: "Robert Vance", role: "Staff DevOps Engineer", company: "CyberNode", topic: "Automated CI/CD & Security Sprints", img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=600", bio: "DevOps security leader implementing automated deployment pipelines and zero-trust security." }
    ],
    "4": [
        { name: "Amanda Sterling", role: "Executive Leadership Coach", company: "Leadership Institute", topic: "Mastering High-Stakes Negotiations", img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600", bio: "Advisor to C-suite executives on strategic negotiation, communication, and decision making." },
        { name: "Raymond Choi", role: "Chief Operating Officer", company: "Zenith Global", topic: "Operational Efficiency & Organizational Resilience", img: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=600", bio: "Operations expert optimizing cross-departmental productivity and enterprise resilience." },
        { name: "Rachel Vance", role: "Senior Marketing Director", company: "Apex Brand Strategy", topic: "Digital Brand Presence & Customer Engagement", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600", bio: "Directing multi-channel digital brand growth strategies across Asia-Pacific." }
    ]
};

// ========================================
// FETCH EVENT DETAILS
// ========================================

async function loadEventDetails() {
    try {
        const response = await fetch(`${API_BASE}/event/${viewingEventId}`);
        const data = await response.json();
        if (data && data.title) {
            eventDetails = data;
        }
    } catch (error) {
        console.error("Error fetching event details from backend API:", error);
    }

    // Fallback to local mock catalog if backend didn't return event data
    if (!eventDetails || !eventDetails.title) {
        eventDetails = mockEventsCatalog[viewingEventId] || mockEventsCatalog["1"];
    }

    if (eventDetails) {
        renderEventDetails();
    }
}

// ========================================
// RENDER EVENT DETAILS
// ========================================

function renderEventDetails() {
    // 1. Populate header & text fields
    document.getElementById("eventCategory").innerText = eventDetails.category || "Corporate Event";
    document.getElementById("eventTitle").innerText = eventDetails.title;
    
    const summaryText = eventDetails.description && eventDetails.description.length > 150
        ? eventDetails.description.substring(0, 150) + "..."
        : eventDetails.description || "No summary available.";
    document.getElementById("eventSummary").innerText = summaryText;
    
    document.getElementById("eventDescription").innerText = eventDetails.description || "No description available.";
    
    // Right panel info list
    document.getElementById("infoDate").innerText = (eventDetails.event_date_end && eventDetails.event_date_end !== 'None' && eventDetails.event_date_end !== 'null' && eventDetails.event_date_end !== eventDetails.event_date)
        ? `${eventDetails.event_date} to ${eventDetails.event_date_end}`
        : eventDetails.event_date;
    document.getElementById("infoVenue").innerText = eventDetails.selected_venue || "TBD Venue";
    document.getElementById("infoAttendees").innerText = `${eventDetails.participants} Pax Capacity`;
    document.getElementById("infoCategory").innerText = eventDetails.category;

    // 2. Set Hero background image banner if present
    if (eventDetails.banner_image) {
        const heroSection = document.querySelector(".hero");
        if (heroSection) {
            heroSection.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.7)), url(${eventDetails.banner_image})`;
            heroSection.style.backgroundSize = "cover";
            heroSection.style.backgroundPosition = "center";
        }
    }

    // 3. Render Featured Speakers
    renderFeaturedSpeakers();

    // 4. Render Schedule Timeline
    renderScheduleTimeline();

    // 5. Render Venue & Layout Preview
    renderVenuePreview();

    // 6. Render Seat Capacity Status Progress Bar
    renderCapacityProgress();
}

// ========================================
// FEATURED SPEAKERS
// ========================================

function renderFeaturedSpeakers() {
    const speakerGrid = document.getElementById("speakerGrid");
    if (!speakerGrid) return;

    let speakers = speakerLibrary[viewingEventId] || speakerLibrary["1"];

    speakerGrid.innerHTML = speakers.map((s, idx) => `
        <div class="speaker-card" onclick="showSpeakerModal('${viewingEventId}', ${idx})">
            <img src="${s.img}" alt="${s.name}">
            <h3>${s.name}</h3>
            <div class="speaker-role">${s.role} • ${s.company}</div>
            <div class="speaker-topic">"${s.topic}"</div>
        </div>
    `).join("");
}

window.showSpeakerModal = function(eventId, speakerIndex) {
    const speakers = speakerLibrary[eventId] || speakerLibrary["1"];
    const speaker = speakers[speakerIndex];
    if (!speaker) return;

    Swal.fire({
        title: speaker.name,
        html: `
            <div style="text-align: center; padding: 10px;">
                <img src="${speaker.img}" style="width: 110px; height: 110px; border-radius: 50%; object-fit: cover; border: 4px solid #c8a96b; margin-bottom: 15px;">
                <div style="font-weight: 700; color: #c8a96b; font-size: 15px; margin-bottom: 5px;">${speaker.role}</div>
                <div style="font-weight: 600; color: #4b5563; font-size: 14px; margin-bottom: 15px;">${speaker.company}</div>
                <div style="background: #f8fafc; padding: 14px; border-radius: 12px; border-left: 4px solid #c8a96b; margin-bottom: 15px; text-align: left; font-size: 13px; color: #1e293b;">
                    <strong>Topic:</strong> "${speaker.topic}"
                </div>
                <p style="color: #64748b; font-size: 13px; line-height: 1.6; text-align: left;">${speaker.bio}</p>
            </div>
        `,
        confirmButtonColor: "#c8a96b",
        confirmButtonText: "Close"
    });
};

// ========================================
// SCHEDULE TIMELINE
// ========================================

function renderScheduleTimeline() {
    const scheduleContainer = document.getElementById("scheduleContainer");
    if (!scheduleContainer) return;
    
    scheduleContainer.innerHTML = "";
    
    let timelineData = eventDetails.timeline;
    if (timelineData && typeof timelineData === "string" && timelineData !== "None" && timelineData !== "null") {
        try {
            timelineData = JSON.parse(timelineData);
        } catch (e) {
            console.error("Error parsing timeline JSON:", e);
            timelineData = null;
        }
    }
    
    if (Array.isArray(timelineData) && timelineData.length > 0) {
        timelineData.forEach(item => {
            scheduleContainer.innerHTML += `
                <div class="schedule-item">
                    <h3>${item.time} - ${item.activity}</h3>
                    <p>${item.description || getCategoryActivityDescription(eventDetails.category, item.activity)}</p>
                </div>
            `;
        });
    } else {
        const defaultAgendas = getCategoryDefaultAgenda(eventDetails.category, eventDetails.title);
        defaultAgendas.forEach(item => {
            scheduleContainer.innerHTML += `
                <div class="schedule-item">
                    <h3>${item.time} - ${item.activity}</h3>
                    <p>${item.description}</p>
                </div>
            `;
        });
    }
}

function getCategoryActivityDescription(category, activityTitle) {
    const act = (activityTitle || "").toLowerCase();
    if (act.includes("opening") || act.includes("keynote")) {
        return "Executive introduction, program outline, and opening address.";
    } else if (act.includes("panel") || act.includes("discussion")) {
        return "Industry leaders and domain experts share strategic insights and take live Q&A.";
    } else if (act.includes("workshop") || act.includes("lab") || act.includes("sprint")) {
        return "Interactive hands-on technical exercise and practical sprint session.";
    } else if (act.includes("networking") || act.includes("reception") || act.includes("cocktail")) {
        return "Structured attendee contact exchange, networking lounge, and refreshments.";
    }
    return "Scheduled interactive program session.";
}

function getCategoryDefaultAgenda(category, title) {
    const cat = (category || "").toLowerCase();
    if (cat.includes("workshop")) {
        return [
            { time: "9:30 AM", activity: "Technical Architecture Overview", description: "Introduction to core tools, environment setup, and technical sprint goals." },
            { time: "11:30 AM", activity: "Hands-on Interactive Sprint", description: "Step-by-step practical workshop, design thinking, and technical exercise." },
            { time: "2:30 PM", activity: "Project Showcase & Feedback", description: "Team presentations, expert reviews, and certificate presentation." }
        ];
    } else if (cat.includes("networking")) {
        return [
            { time: "6:30 PM", activity: "VIP Reception & Welcome Cocktails", description: "Guest registration, name badge collection, and welcome drinks." },
            { time: "7:30 PM", activity: "Executive Fireside Discussion", description: "Brief panel with industry founders and corporate leaders." },
            { time: "8:30 PM", activity: "Open Business Networking & Buffet", description: "Structured contact exchange and gourmet buffet dinner." }
        ];
    } else if (cat.includes("seminar")) {
        return [
            { time: "9:00 AM", activity: "Leadership Strategy Keynote", description: "Operational scaling, brand mastery, and corporate growth." },
            { time: "11:00 AM", activity: "Interactive Executive Q&A", description: "Deep-dive case studies and domain expert discussion." },
            { time: "2:00 PM", activity: "Strategic Action Plan Wrap-Up", description: "Executive summary, takeaway manual, and wrap-up." }
        ];
    }
    return [
        { time: "9:00 AM", activity: "Opening Keynote Address", description: "Welcome speech, industry trends, and keynote presentation." },
        { time: "11:00 AM", activity: "Corporate Innovation Panel", description: "Panelists discuss enterprise transformation with audience Q&A." },
        { time: "2:00 PM", activity: "Networking Expo & Partnership Session", description: "Exhibition booth walk-through and business networking." }
    ];
}

// ========================================
// VENUE & LAYOUT PREVIEW
// ========================================

// ========================================
// VENUE & LAYOUT PREVIEW (MATCHING MY-EVENTS.JS)
// ========================================

let modalZoom = 1.0;
let defaultFitScale = 1.0;
let currentPreviewElements = null;
let currentPreviewCanvas = null;

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
        if ((el.x || 0) + w > maxX) maxX = (el.x || 0) + w;
        if ((el.y || 0) + h > maxY) maxY = (el.y || 0) + h;
    });

    const workspaceWidth = Math.max(1200, maxX + 150);
    const workspaceHeight = Math.max(900, maxY + 150);

    // Calculate scale factor to fit layout in the modal body
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
    
    // Configure parent canvas
    canvas.style.display = "block";
    canvas.style.position = "relative";
    canvas.style.overflow = "auto";

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
            stageDiv.style.left = (el.x || 300) + "px";
            stageDiv.style.top = (el.y || 20) + "px";
            stageDiv.innerText = el.label || "STAGE";
            canvasDiv.appendChild(stageDiv);
        } else if (el.type === 'table') {
            const tableDiv = document.createElement("div");
            tableDiv.className = "table-wrapper";
            tableDiv.style.left = (el.x || 100) + "px";
            tableDiv.style.top = (el.y || 100) + "px";
            tableDiv.innerHTML = `
                <div class="chair top"></div>
                <div class="chair bottom"></div>
                <div class="chair left"></div>
                <div class="chair right"></div>
                <div class="table-box">
                    ${el.label || 'Table'}
                </div>
            `;
            canvasDiv.appendChild(tableDiv);
        } else if (el.type === 'component') {
            const compDiv = document.createElement("div");
            compDiv.className = "component-wrapper";
            compDiv.style.left = (el.x || 100) + "px";
            compDiv.style.top = (el.y || 100) + "px";
            
            if (el.rotation === 90 || el.rotation === 270) {
                compDiv.classList.add("rotated");
            }
            
            compDiv.innerHTML = `<span>${el.label || 'Component'}</span>`;
            canvasDiv.appendChild(compDiv);
        }
    });
}

function openVenueLayoutModal(layoutData) {
    if (!layoutData || layoutData.length === 0) {
        // Fallback default layout elements matching planner canvas
        layoutData = [
            { id: "stage", type: "stage", label: "STAGE", x: 450, y: 20 }
        ];
        const capacity = parseInt(eventDetails ? eventDetails.participants : 200) || 200;
        const tablesNeeded = Math.min(24, Math.max(6, Math.ceil(capacity / 10)));
        const rows = Math.ceil(tablesNeeded / 2);
        for (let r = 0; r < rows; r++) {
            const yPos = 140 + (r * 120);
            layoutData.push({ id: `t_${r*2+1}`, type: "table", label: r === 0 ? "VIP 1" : `Table ${r*2+1}`, x: 380, y: yPos });
            layoutData.push({ id: `t_${r*2+2}`, type: "table", label: r === 0 ? "VIP 2" : `Table ${r*2+2}`, x: 580, y: yPos });
        }
    }

    const layoutModal = document.getElementById("layoutModal");
    const modalLayoutPreview = document.getElementById("modalLayoutPreview");

    if (!layoutModal || !modalLayoutPreview) return;

    layoutModal.style.display = "flex";
    document.body.style.overflow = "hidden";

    currentPreviewElements = layoutData;
    currentPreviewCanvas = modalLayoutPreview;

    modalLayoutPreview.innerHTML = `<div class="layout-preview"></div>`;
    const modalCanvas = modalLayoutPreview.querySelector(".layout-preview");

    requestAnimationFrame(() => {
        renderLayoutPreview(modalCanvas, layoutData, null);
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
});

async function renderVenuePreview() {
    const imgEl = document.getElementById("venuePreviewImg");
    const nameEl = document.getElementById("venuePreviewName");
    const descEl = document.getElementById("venuePreviewDesc");
    const tagsEl = document.getElementById("venueAmenitiesTags");
    const inspectBtn = document.getElementById("inspectVenueBtn");

    if (!nameEl) return;

    let venueName = eventDetails.selected_venue || "Selected Event Venue";
    nameEl.innerText = venueName;

    let defaultImg = "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1400&auto=format&fit=crop";
    if (eventDetails.venue_type === "Outdoor") {
        defaultImg = "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1400&auto=format&fit=crop";
    }

    if (imgEl) imgEl.src = defaultImg;

    if (descEl) {
        descEl.innerText = `${venueName} features complete spatial venue configurations, stage alignment, seating maps, and technical amenities tailored for ${eventDetails.title}. Click the button below to view the organizer's 2D layout.`;
    }

    if (tagsEl) {
        tagsEl.innerHTML = `
            <span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600;">🪑 Table Seating Layout</span>
            <span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600;">🎭 Stage Setup</span>
            <span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600;">🍽️ Catering Area</span>
            <span style="background: #f3f4f6; color: #374151; padding: 6px 12px; border-radius: 10px; font-size: 12px; font-weight: 600;">📶 High-Speed WiFi</span>
        `;
    }

    if (inspectBtn) {
        inspectBtn.onclick = () => {
            let layoutData = [];
            if (eventDetails && eventDetails.layout) {
                try {
                    let rawLayout = eventDetails.layout;
                    if (typeof rawLayout === "string" && rawLayout !== "None" && rawLayout !== "null" && rawLayout !== "[]") {
                        const parsed = JSON.parse(rawLayout);
                        if (parsed && Array.isArray(parsed.elements)) {
                            layoutData = parsed.elements;
                        } else if (Array.isArray(parsed)) {
                            layoutData = parsed;
                        }
                    } else if (Array.isArray(eventDetails.layout)) {
                        layoutData = eventDetails.layout;
                    }
                } catch (e) {
                    console.error("Error parsing layout data:", e);
                }
            }
            openVenueLayoutModal(layoutData);
        };
    }
}

// ========================================
// CAPACITY & SEAT PROGRESS BAR
// ========================================

async function renderCapacityProgress() {
    const bar = document.getElementById("capacityProgressBar");
    const text = document.getElementById("capacityStatusText");
    const badge = document.getElementById("capacityBadge");

    if (!bar || !eventDetails) return;

    const capacity = parseInt(eventDetails.participants) || parseInt(eventDetails.required_capacity) || 100;
    let registeredCount = typeof eventDetails.attendees_registered === 'number' ? eventDetails.attendees_registered : 0;

    try {
        const response = await fetch(`${API_BASE}/event/${eventDetails.id}/attendees`);
        if (response.ok) {
            const attendees = await response.json();
            if (Array.isArray(attendees)) {
                registeredCount = attendees.length;
            }
        }
    } catch (e) {
        console.error("Error fetching attendees count:", e);
    }

    const percent = capacity > 0 ? Math.min(100, Math.round((registeredCount / capacity) * 100)) : 0;

    bar.style.width = `${percent}%`;
    
    if (text) {
        text.innerText = `${registeredCount} / ${capacity} Pax Registered (${percent}% Filled)`;
    }

    if (badge) {
        if (percent >= 100) {
            badge.innerText = "Full";
            badge.style.background = "#fee2e2";
            badge.style.color = "#dc2626";
        } else if (percent >= 85) {
            badge.innerText = "Almost Full";
            badge.style.background = "#fef3c7";
            badge.style.color = "#d97706";
        } else {
            badge.innerText = "Open";
            badge.style.background = "#dcfce7";
            badge.style.color = "#16a34a";
        }
    }
}

// ========================================
// REGISTER NOW HANDLER
// ========================================

const registerBtn = document.getElementById("registerBtn");
if (registerBtn) {
    registerBtn.addEventListener("click", async () => {
        if (!eventDetails) return;
        
        try {
            const response = await fetch(`${API_BASE}/register-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    event_id: eventDetails.id
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                Swal.fire({
                    icon: "success",
                    title: "Registration Successful!",
                    text: result.message,
                    confirmButtonColor: "#c8a96b"
                }).then(() => {
                    window.location.href = "registrations.html";
                });
            } else {
                Swal.fire({
                    icon: "warning",
                    title: "Registration Failed",
                    text: result.message,
                    confirmButtonColor: "#c8a96b"
                });
            }
        } catch (error) {
            console.error("Error registering for event:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "An error occurred while registering. Please try again.",
                confirmButtonColor: "#c8a96b"
            });
        }
    });
}

// ========================================
// INITIALIZE PAGE
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    loadEventDetails();
});
