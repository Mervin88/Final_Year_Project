// ========================================
// SESSION CHECK
// ========================================
const role = localStorage.getItem("userRole");
const username = localStorage.getItem("username");

if (!role || role !== "Vendor") {
    window.location.href = "login.html";
} else {
    const welcome = document.getElementById("welcomeText");
    if (welcome) {
        welcome.innerHTML = `Vendor Dashboard 🏢<br>
        <span style="font-size: 15px; font-weight: normal; opacity: 0.82; display: block; margin-top: 8px;">
            Active Session: ${username}
        </span>`;
    }
}

// ========================================
// INITIALIZE
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    loadMyVenues();

    const form = document.getElementById("uploadVenueForm");
    if (form) {
        form.addEventListener("submit", uploadVenue);
    }
});

// ========================================
// LOAD MY UPLOADED VENUES
// ========================================
async function loadMyVenues() {
    const tableBody = document.getElementById("myVenuesTableBody");
    if (!tableBody) return;

    try {
        const response = await fetch(`http://127.0.0.1:5000/venues/my-uploaded/${encodeURIComponent(username)}`);
        const venues = await response.json();

        tableBody.innerHTML = "";

        if (venues.length === 0) {
            tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280; font-weight: 500;">
                    No venue listings uploaded yet. Show off your venues using the form above!
                </td>
            </tr>`;
            return;
        }

        venues.forEach(venue => {
            // Setup status badge classes
            let badgeClass = "badge-pending";
            if (venue.status === "Approved") badgeClass = "badge-approved";
            if (venue.status === "Rejected") badgeClass = "badge-rejected";

            // Generate facilities badges
            let facilitiesHtml = "";
            if (venue.parking_available) facilitiesHtml += `<span class="facility-tag">Parking</span>`;
            if (venue.wifi_available) facilitiesHtml += `<span class="facility-tag">WiFi</span>`;
            if (venue.projector_available) facilitiesHtml += `<span class="facility-tag">Projector</span>`;
            if (venue.catering_available) facilitiesHtml += `<span class="facility-tag">Catering</span>`;
            if (venue.sound_system_available) facilitiesHtml += `<span class="facility-tag">Sound</span>`;
            if (venue.stage_setup_available) facilitiesHtml += `<span class="facility-tag">Stage</span>`;

            if (!facilitiesHtml) {
                facilitiesHtml = `<span style="color: #9ca3af; font-size: 12px; font-style: italic;">None</span>`;
            }

            tableBody.innerHTML += `
            <tr>
                <td style="font-weight: 700; color: #111827;">
                    ${venue.name}
                    ${venue.document_url ? `<br><a href="${venue.document_url}" target="_blank" style="font-size: 11px; color: #c8a96b; text-decoration: underline; font-weight: 600;">View Documents</a>` : ''}
                </td>
                <td>${venue.location}</td>
                <td><strong>${venue.capacity}</strong> Pax</td>
                <td style="font-weight: 600; color: #b5955c;">RM ${parseFloat(venue.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td>${venue.type}</td>
                <td style="max-width: 250px;">${facilitiesHtml}</td>
                <td>
                    <span class="badge ${badgeClass}">${venue.status}</span>
                    ${venue.status === "Rejected" && venue.rejection_feedback ? `<div style="color: #ef4444; font-size: 11px; font-weight: 600; margin-top: 4px; max-width: 150px; line-height: 1.3;">Reason: ${venue.rejection_feedback}</div>` : ''}
                </td>
            </tr>
            `;
        });
    } catch (error) {
        console.error("Error loading vendor venues:", error);
        tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; padding: 30px; color: #ef4444; font-weight: 600;">
                Unable to retrieve listings from server.
            </td>
        </tr>`;
    }
}

// ========================================
// UPLOAD VENUE SUBMIT
// ========================================
async function uploadVenue(e) {
    e.preventDefault();

    const name = document.getElementById("venueName").value.trim();
    const location = document.getElementById("venueLocation").value.trim();
    const capacityVal = document.getElementById("venueCapacity").value;
    const venueType = document.getElementById("venueType").value;
    const priceVal = document.getElementById("venuePrice").value;
    const description = document.getElementById("venueDescription").value.trim();
    const documentUrl = document.getElementById("venueDocument").value.trim();

    function showError(text) {
        Swal.fire({
            icon: "warning",
            title: "Validation Check",
            text: text,
            confirmButtonColor: "#c8a96b"
        });
    }

    if (!name || !location || !capacityVal || !venueType || !priceVal || !description || !documentUrl) {
        showError("Please fill in all fields including the document verification link.");
        return;
    }

    if (name.length < 3 || name.length > 100) {
        showError("Venue name must be between 3 and 100 characters.");
        return;
    }

    if (location.length < 2 || location.length > 100) {
        showError("Location/City must be between 2 and 100 characters.");
        return;
    }

    const parsedCapacity = parseInt(capacityVal);
    if (isNaN(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 10000) {
        showError("Capacity must be between 1 and 10,000 pax.");
        return;
    }

    const parsedPrice = parseFloat(priceVal);
    if (isNaN(parsedPrice) || parsedPrice < 0 || parsedPrice > 1000000) {
        showError("Price must be between RM 0 and RM 1,000,000.");
        return;
    }

    if (description.length < 10 || description.length > 1000) {
        showError("Description must be between 10 and 1,000 characters.");
        return;
    }

    try {
        new URL(documentUrl);
    } catch (_) {
        showError("Please enter a valid document verification URL (e.g. http://... or https://...).");
        return;
    }

    if (documentUrl.length > 555) {
        showError("Document verification URL cannot exceed 555 characters.");
        return;
    }

    const payload = {
        name,
        location,
        capacity: parsedCapacity,
        type: venueType,
        price: parsedPrice,
        description,
        document_url: documentUrl,
        parking_available: document.getElementById("facilityParking").checked ? 1 : 0,
        wifi_available: document.getElementById("facilityWifi").checked ? 1 : 0,
        projector_available: document.getElementById("facilityProjector").checked ? 1 : 0,
        catering_available: document.getElementById("facilityCatering").checked ? 1 : 0,
        sound_system_available: document.getElementById("facilitySound").checked ? 1 : 0,
        stage_setup_available: document.getElementById("facilityStage").checked ? 1 : 0,
        uploaded_by: username
    };

    try {
        const response = await fetch("http://127.0.0.1:5000/venues/upload", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                icon: "success",
                title: "Venue Uploaded! 🎉",
                text: "Your venue has been submitted and is currently pending review by administrators.",
                confirmButtonColor: "#c8a96b"
            });
            document.getElementById("uploadVenueForm").reset();
            loadMyVenues();
        } else {
            Swal.fire({
                icon: "error",
                title: "Upload Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error uploading venue:", error);
        Swal.fire({
            icon: "error",
            title: "Server Error",
            text: "Could not connect to the backend server. Please try again later.",
            confirmButtonColor: "#d9534f"
        });
    }
}

// ========================================
// LOGOUT
// ========================================
async function logout() {
    const result = await Swal.fire({
        title: "Logout?",
        text: "Are you sure you want to log out of the vendor control panel?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#c8a96b",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Logout",
        cancelButtonText: "Cancel"
    });

    if (!result.isConfirmed) return;

    localStorage.removeItem("userRole");
    localStorage.removeItem("username");
    localStorage.removeItem("editEventId");
    localStorage.removeItem("eventDraft");
    localStorage.removeItem("selectedVenue");

    window.location.href = "login.html";
}

// ========================================
// SCROLLSPY NAVIGATION
// ========================================
window.addEventListener("scroll", () => {
    const sections = [
        { id: "upload-section", menuIndex: 2 },
        { id: "my-venues-section", menuIndex: 3 }
    ];

    let currentSectionId = null;

    sections.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) {
            const rect = el.getBoundingClientRect();
            // Trigger when section takes up the top part of the viewport
            if (rect.top <= 250 && rect.bottom >= 150) {
                currentSectionId = sec.id;
            }
        }
    });

    const menuItems = document.querySelectorAll(".menu li");

    // Clear active states
    menuItems.forEach(item => item.classList.remove("active"));

    if (currentSectionId) {
        const targetSec = sections.find(s => s.id === currentSectionId);
        const activeItem = document.querySelector(`.menu li:nth-child(${targetSec.menuIndex})`);
        if (activeItem) {
            activeItem.classList.add("active");
        }
    } else {
        // Default to Dashboard (1st item)
        const dashboardItem = document.querySelector(".menu li:nth-child(1)");
        if (dashboardItem) {
            dashboardItem.classList.add("active");
        }
    }
});
