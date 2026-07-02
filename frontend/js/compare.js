document.addEventListener("DOMContentLoaded", () => {
    loadComparisonTable();
    
    // Adjust back button link if there's an active draft to preserve recommendations
    const backBtn = document.querySelector(".compare-section button");
    if (backBtn && localStorage.getItem("eventDraft")) {
        backBtn.setAttribute("onclick", "window.location.href='venues.html?recommend=true'");
    }
});

async function loadComparisonTable() {
    const tableContainer = document.getElementById("compareTable");
    if (!tableContainer) return;

    const compareIds = JSON.parse(localStorage.getItem("compareVenues") || "[]");

    if (compareIds.length === 0) {
        const hasDraft = localStorage.getItem("eventDraft");
        tableContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 40px; background: white; border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                <h2 style="color: #111827; margin-bottom: 12px;">No Venues Selected</h2>
                <p style="color: #6b7280; margin-bottom: 24px; font-size: 16px;">You must select at least one venue from the catalog to compare.</p>
                <button onclick="window.location.href='venues.html${hasDraft ? "?recommend=true" : ""}'" style="padding: 14px 30px; border: none; border-radius: 16px; background: #0f172a; color: white; font-weight: 700; cursor: pointer; transition: 0.3s;" onmouseover="this.style.background='#c8a96b'; this.style.color='#111827';" onmouseout="this.style.background='#0f172a'; this.style.color='white';">
                    Browse Venues
                </button>
            </div>
        `;
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/venues/approved");
        const allApprovedVenues = await response.json();
        
        // Find match details
        const selectedVenues = allApprovedVenues.filter(v => compareIds.includes(v.id));

        const isParticipant = (localStorage.getItem("userRole") || localStorage.getItem("role")) === "Participant";

        // Generate rows HTML
        let tableHtml = "";
        tableHtml += generateHeaderRow(selectedVenues);
        tableHtml += generatePreviewRow(selectedVenues);
        tableHtml += generatePriceRow(selectedVenues);
        tableHtml += generateCapacityRow(selectedVenues);
        tableHtml += generateTypeRow(selectedVenues);
        tableHtml += generateLocationRow(selectedVenues);
        tableHtml += generateAvailabilityRow(selectedVenues);
        tableHtml += generateRatingRow(selectedVenues);
        tableHtml += generateFacilitiesRow(selectedVenues);
        if (!isParticipant) {
            tableHtml += generateActionRow(selectedVenues);
        }

        tableContainer.innerHTML = tableHtml;
    } catch (error) {
        console.error("Error loading approved venues for comparison:", error);
        tableContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444; font-weight: 600;">
                Unable to load venue data. Please ensure the backend server is running.
            </div>
        `;
    }
}

function generateHeaderRow(selectedVenues) {
    let html = `
        <div class="compare-row header-row">
            <div class="compare-feature">Features</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            html += `<div class="compare-card">${venue.name}</div>`;
        } else {
            html += `<div class="compare-card" style="color: #9ca3af; font-style: italic; font-weight: normal; font-size: 15px;">Empty Slot</div>`;
        }
    }
    html += `</div>`;
    return html;
}

function generatePreviewRow(selectedVenues) {
    let html = `
        <div class="compare-row">
            <div class="compare-feature">Venue Preview</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            let img = "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop";
            if (venue.type === "Indoor") {
                img = "https://images.unsplash.com/photo-1497366412874-3415097a27e7?q=80&w=1200&auto=format&fit=crop";
            } else if (venue.type === "Outdoor") {
                img = "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop";
            } else if (venue.type === "Hybrid") {
                img = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop";
            }
            html += `
                <div class="compare-card image-card">
                    <img src="${img}" alt="${venue.name}">
                </div>
            `;
        } else {
            html += `
                <div class="compare-card image-card" style="background: #f9fafb; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px;">
                    <div style="font-size: 32px; color: #d1d5db; line-height: 1;">+</div>
                    <span style="font-size: 13px; color: #9ca3af; font-weight: normal;">Select a Venue</span>
                </div>
            `;
        }
    }
    html += `</div>`;
    return html;
}

function generatePriceRow(selectedVenues) {
    const isParticipant = (localStorage.getItem("userRole") || localStorage.getItem("role")) === "Participant";
    let html = `
        <div class="compare-row">
            <div class="compare-feature">${isParticipant ? '&nbsp;' : 'Price'}</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            if (isParticipant) {
                html += `<div class="compare-card">&nbsp;</div>`;
            } else {
                html += `<div class="compare-card">RM ${parseFloat(venue.price).toLocaleString(undefined, {minimumFractionDigits: 0})}/day</div>`;
            }
        } else {
            html += `<div class="compare-card" style="color: #d1d5db;">-</div>`;
        }
    }
    html += `</div>`;
    return html;
}

function generateCapacityRow(selectedVenues) {
    let html = `
        <div class="compare-row">
            <div class="compare-feature">Capacity</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            html += `<div class="compare-card">${venue.capacity} Pax</div>`;
        } else {
            html += `<div class="compare-card" style="color: #d1d5db;">-</div>`;
        }
    }
    html += `</div>`;
    return html;
}

function generateTypeRow(selectedVenues) {
    let html = `
        <div class="compare-row">
            <div class="compare-feature">Venue Type</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            html += `<div class="compare-card">${venue.type}</div>`;
        } else {
            html += `<div class="compare-card" style="color: #d1d5db;">-</div>`;
        }
    }
    html += `</div>`;
    return html;
}

function generateLocationRow(selectedVenues) {
    let html = `
        <div class="compare-row">
            <div class="compare-feature">Location</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            html += `<div class="compare-card">${venue.location}, Malaysia</div>`;
        } else {
            html += `<div class="compare-card" style="color: #d1d5db;">-</div>`;
        }
    }
    html += `</div>`;
    return html;
}

function generateAvailabilityRow(selectedVenues) {
    let html = `
        <div class="compare-row">
            <div class="compare-feature">Availability</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            html += `<div class="compare-card available">Available</div>`;
        } else {
            html += `<div class="compare-card" style="color: #d1d5db;">-</div>`;
        }
    }
    html += `</div>`;
    return html;
}

function generateRatingRow(selectedVenues) {
    let html = `
        <div class="compare-row">
            <div class="compare-feature">Rating</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            html += `<div class="compare-card">★ 4.8</div>`;
        } else {
            html += `<div class="compare-card" style="color: #d1d5db;">-</div>`;
        }
    }
    html += `</div>`;
    return html;
}

function generateFacilitiesRow(selectedVenues) {
    let html = `
        <div class="compare-row">
            <div class="compare-feature">Facilities</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            let facilities = [];
            if (venue.parking_available) facilities.push("Parking");
            if (venue.wifi_available) facilities.push("WiFi");
            if (venue.projector_available) facilities.push("Projector");
            if (venue.catering_available) facilities.push("Catering");
            if (venue.sound_system_available) facilities.push("Sound System");
            if (venue.stage_setup_available) facilities.push("Stage Setup");
            let facilitiesStr = facilities.length > 0 ? facilities.join(", ") : "Standard Amenities";
            html += `<div class="compare-card" style="font-size: 13px; font-weight: normal; color: #4b5563;">${facilitiesStr}</div>`;
        } else {
            html += `<div class="compare-card" style="color: #d1d5db;">-</div>`;
        }
    }
    html += `</div>`;
    return html;
}

function generateActionRow(selectedVenues) {
    let html = `
        <div class="compare-row">
            <div class="compare-feature">Action</div>
    `;
    for (let i = 0; i < 3; i++) {
        const venue = selectedVenues[i];
        if (venue) {
            html += `
                <div class="compare-card">
                    <button onclick="selectVenueForDraft('${venue.name}')">Select Venue</button>
                </div>
            `;
        } else {
            html += `<div class="compare-card" style="color: #d1d5db;">-</div>`;
        }
    }
    html += `</div>`;
    return html;
}

function selectVenueForDraft(venueName) {
    const eventData = JSON.parse(localStorage.getItem("eventDraft"));
    if (!eventData) {
        alert("Please create an event draft first before selecting a venue.");
        window.location.href = "create-event.html";
        return;
    }

    console.log("Selected Venue from Compare:", venueName);
    localStorage.setItem("selectedVenue", venueName);
    window.location.href = "planner.html";
}
