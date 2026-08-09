const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

// ========================================
// SESSION CHECK
// ========================================
const role = localStorage.getItem("userRole");
const username = localStorage.getItem("username");

if (!role || role !== "Admin") {
    window.location.href = "login.html";
} else {
    const welcome = document.getElementById("welcomeText");
    if (welcome) {
        welcome.innerHTML = `Admin Control Panel 👨‍💼<br>
        <span style="font-size: 15px; font-weight: normal; opacity: 0.82; display: block; margin-top: 8px;">
            Active Session: ${username}
        </span>`;
    }
}

const eventLayouts = {};
const eventBackdrops = {};
const eventTimelines = {};

// ========================================
// INITIALIZE
// ========================================
document.addEventListener("DOMContentLoaded", () => {
    loadStatistics();
    loadEvents();
    loadUsers();
    loadReports();
    loadVenues();
    loadNotifications();
});

// ========================================
// LOAD STATISTICS
// ========================================
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE}/admin/stats`);
        const data = await response.json();

        if (data.success) {
            document.getElementById("totalUsers").innerText = data.total_users;
            document.getElementById("totalEvents").innerText = data.total_events;
            document.getElementById("totalVenues").innerText = data.total_venues;
            document.getElementById("pendingReviews").innerText = data.pending_reviews;
        }
    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// ========================================
// LOAD EVENTS list
// ========================================
async function loadEvents() {
    const grid = document.getElementById("adminEventGrid");
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE}/admin/events`);
        const events = await response.json();

        grid.innerHTML = "";

        if (events.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280; font-size: 16px;">No events in the database.</div>`;
            return;
        }

        events.forEach(event => {
            // Unsplash placeholder images based on categories
            let img = "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop";
            if (event.category === "Workshop") {
                img = "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop";
            } else if (event.category === "Seminar") {
                img = "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=1200&auto=format&fit=crop";
            }

            // Status badge coloring style
            let badgeBg = "#f59e0b"; // Pending default
            if (event.status === "Approved") badgeBg = "#10b981";
            if (event.status === "Rejected") badgeBg = "#ef4444";

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
                        <button onclick="showLayoutPreview(${event.id})" style="width: 100%; margin-top: 5px; margin-bottom: 5px; background: transparent; border: 1px solid #c8a96b; color: #c8a96b; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s;">Show Layout</button>
                    `;
                }
            } catch (layoutErr) {
                console.error("Error parsing layout for admin card:", layoutErr);
            }

            // Check for timeline setup
            let timelineHtml = "";
            try {
                let timelineData = event.timeline;
                let parsedTimeline = null;
                if (timelineData && typeof timelineData === 'string' && timelineData !== "None" && timelineData !== "null" && timelineData !== "[]" && timelineData !== "") {
                    try {
                        parsedTimeline = JSON.parse(timelineData);
                    } catch (err) {
                        parsedTimeline = null;
                    }
                }
                if (Array.isArray(parsedTimeline) && parsedTimeline.length > 0) {
                    eventTimelines[event.id] = parsedTimeline;
                    timelineHtml += `
                        <button onclick="showTimelinePreview(${event.id})" style="width: 100%; margin-top: 5px; margin-bottom: 5px; background: transparent; border: 1px solid #10b981; color: #10b981; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s;" onmouseover="this.style.background='#10b981';this.style.color='white';" onmouseout="this.style.background='transparent';this.style.color='#10b981';">Show Timeline</button>
                    `;
                }
            } catch (timelineErr) {
                console.error("Error parsing timeline setup:", timelineErr);
            }

            // Check for backdrop setup
            try {
                let backdropData = event.backdrop_setup;
                if (backdropData && typeof backdropData === 'string' && backdropData !== "None" && backdropData !== "null" && backdropData !== "") {
                    const parsedBackdrop = JSON.parse(backdropData);
                    if (parsedBackdrop && (parsedBackdrop.id || parsedBackdrop.elements)) {
                        eventBackdrops[event.id] = parsedBackdrop;
                        layoutHtml += `
                            <button class="show-3d-btn" onclick="show3DPreview(${event.id})" style="width: 100%; margin-top: 5px; margin-bottom: 12px; background: #c8a96b; border: 1px solid #c8a96b; color: #111827; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s;">Show 3D View</button>
                        `;
                    }
                }
            } catch (backdropErr) {
                console.error("Error parsing backdrop setup:", backdropErr);
            }

            grid.innerHTML += `
            <div class="event-card" style="box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 18px; overflow: hidden; background: white;">
                <img src="${img}" style="width: 100%; height: 160px; object-fit: cover;">
                <div class="event-content" style="padding: 20px;">
                    <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #111827;">${event.title}</h3>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Category:</strong> ${event.category}</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Venue:</strong> ${event.selected_venue}</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Date:</strong> ${
                        (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null' && event.event_date_end !== event.event_date)
                            ? `${event.event_date} to ${event.event_date_end}`
                            : event.event_date
                    }</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 12px;"><strong>Organizer:</strong> ${event.created_by}</p>
                    
                    <span style="background: ${badgeBg}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 15px;">
                        ${event.status}
                    </span>

                    ${timelineHtml}
                    ${layoutHtml}

                    <div style="display: flex; gap: 10px; border-top: 1px dashed #e5e7eb; padding-top: 15px;">
                        ${event.status === 'Pending Review' ? `
                            <button onclick="updateStatus(${event.id}, 'Approved')" style="flex: 1; background: #10b981; color: white; border: none; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s;">Approve</button>
                            <button onclick="updateStatus(${event.id}, 'Rejected')" style="flex: 1; background: #ef4444; color: white; border: none; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s;">Reject</button>
                        ` : ''}
                        <button onclick="deleteEvent(${event.id})" style="flex: 1; background: #6b7280; color: white; border: none; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s;">Delete</button>
                    </div>
                </div>
            </div>
            `;
        });
    } catch (error) {
        console.error("Error loading events:", error);
    }
}

// ========================================
// LOAD USERS list
// ========================================
let cachedUsers = [];

async function loadUsers() {
    const tableBody = document.getElementById("adminUserTableBody");
    if (!tableBody) return;

    try {
        const response = await fetch(`${API_BASE}/admin/users`);
        cachedUsers = await response.json();

        // Bind filter event listener if it exists and hasn't been bound yet
        const filterSelect = document.getElementById("userRoleFilter");
        if (filterSelect && !filterSelect.dataset.listenerAdded) {
            filterSelect.dataset.listenerAdded = "true";
            filterSelect.addEventListener("change", () => {
                filterAndDisplayUsers();
            });
        }

        filterAndDisplayUsers();
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

function filterAndDisplayUsers() {
    const tableBody = document.getElementById("adminUserTableBody");
    if (!tableBody) return;

    const filterSelect = document.getElementById("userRoleFilter");
    const selectedRole = filterSelect ? filterSelect.value : "All";

    const filteredUsers = selectedRole === "All"
        ? cachedUsers
        : cachedUsers.filter(user => user.role === selectedRole);

    tableBody.innerHTML = "";

    if (filteredUsers.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #6b7280;">No registered users found.</td></tr>`;
        return;
    }

    filteredUsers.forEach(user => {
        // Distinct styling for roles
        let roleBadgeBg = "#e5e7eb";
        let roleBadgeColor = "#374151";
        if (user.role === "Organizer") {
            roleBadgeBg = "rgba(200, 169, 107, 0.15)";
            roleBadgeColor = "#c8a96b";
        } else if (user.role === "Participant" || user.role === "User") {
            roleBadgeBg = "rgba(59, 130, 246, 0.15)";
            roleBadgeColor = "#3b82f6";
        } else if (user.role === "Vendor") {
            roleBadgeBg = "rgba(16, 185, 129, 0.15)";
            roleBadgeColor = "#10b981";
        }

        tableBody.innerHTML += `
        <tr style="border-bottom: 1px solid #f3f4f6; transition: 0.2s;">
            <td style="padding: 16px 20px; color: #6b7280; font-weight: 600;">#${user.id}</td>
            <td style="padding: 16px 20px; font-weight: 700; color: #111827;">${user.fullname}</td>
            <td style="padding: 16px 20px; color: #4b5563;">${user.email}</td>
            <td style="padding: 16px 20px;">
                <span style="background: ${roleBadgeBg}; color: ${roleBadgeColor}; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block;">
                    ${user.role}
                </span>
            </td>
            <td style="padding: 16px 20px; text-align: center;">
                <button onclick="deleteUser(${user.id}, '${user.fullname.replace(/'/g, "\\'")}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s; display: inline-flex; align-items: center; gap: 4px;">
                    Delete
                </button>
            </td>
        </tr>
        `;
    });
}

// ========================================
// LOAD VENUES list
// ========================================
let allVenues = [];

async function loadVenues() {
    const grid = document.getElementById("adminVenueGrid");
    const viewMoreBtn = document.getElementById("viewMoreVenuesBtn");
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE}/admin/venues`);
        allVenues = await response.json();

        grid.innerHTML = "";

        if (allVenues.length === 0) {
            grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6b7280; font-size: 16px;">No venues in the database.</div>`;
            if (viewMoreBtn) viewMoreBtn.style.display = "none";
            return;
        }

        // Display first 3 venues
        const firstThree = allVenues.slice(0, 3);
        renderVenueItems(firstThree);

        if (allVenues.length > 3) {
            if (viewMoreBtn) {
                viewMoreBtn.style.display = "block";
                viewMoreBtn.innerText = "View More Venues";
                // Prevent duplicate listeners
                if (!viewMoreBtn.dataset.listenerAdded) {
                    viewMoreBtn.dataset.listenerAdded = "true";
                    viewMoreBtn.addEventListener("click", () => {
                        if (viewMoreBtn.innerText === "View More Venues") {
                            // Render remaining venues
                            const remaining = allVenues.slice(3);
                            renderVenueItems(remaining);
                            viewMoreBtn.innerText = "Show Less Venues";
                        } else {
                            // Collapse back to first 3
                            grid.innerHTML = "";
                            const firstThree = allVenues.slice(0, 3);
                            renderVenueItems(firstThree);
                            viewMoreBtn.innerText = "View More Venues";
                        }
                    });
                }
            }
        } else {
            if (viewMoreBtn) viewMoreBtn.style.display = "none";
        }
    } catch (error) {
        console.error("Error loading venues:", error);
    }
}

function renderVenueItems(venues) {
    const grid = document.getElementById("adminVenueGrid");
    if (!grid) return;

    grid.innerHTML = "";

    venues.forEach(venue => {
        // Status badge coloring style
        let badgeBg = "#f59e0b"; // Pending default
        if (venue.status === "Approved") badgeBg = "#10b981";
        if (venue.status === "Rejected") badgeBg = "#ef4444";

        // Facilities list rendering
        let facilities = [];
        if (venue.parking_available) facilities.push("Parking");
        if (venue.wifi_available) facilities.push("WiFi");
        if (venue.projector_available) facilities.push("Projector");
        if (venue.catering_available) facilities.push("Catering");
        if (venue.sound_system_available) facilities.push("Sound");
        if (venue.stage_setup_available) facilities.push("Stage");
        let facilitiesStr = facilities.length > 0 ? facilities.join(", ") : "None";

        let docHtml = "";
        if (venue.document_url) {
            docHtml = `<p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Documents:</strong> <a href="${venue.document_url}" target="_blank" style="color: #c8a96b; text-decoration: underline; font-weight: 600;">View File</a></p>`;
        }

        let feedbackHtml = "";
        if (venue.status === "Rejected" && venue.rejection_feedback) {
            feedbackHtml = `<p style="font-size: 13px; color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 8px; margin-bottom: 12px; line-height: 1.4;"><strong>Reason:</strong> ${venue.rejection_feedback}</p>`;
        }

        grid.innerHTML += `
        <div class="venue-card" style="box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 18px; overflow: hidden; background: white; padding: 20px; transition: 0.3s; margin-bottom: 20px;">
            <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #111827;">${venue.name}</h3>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Location:</strong> ${venue.location}</p>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Capacity:</strong> ${venue.capacity} Pax</p>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Price:</strong> RM ${parseFloat(venue.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}/day</p>
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Type:</strong> ${venue.type}</p>
            ${docHtml}
            <p style="font-size: 13px; color: #6b7280; margin-bottom: 12px; line-height: 1.4;"><strong>Facilities:</strong> ${facilitiesStr}</p>
            
            <span style="background: ${badgeBg}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 15px;">
                ${venue.status}
            </span>

            ${feedbackHtml}

            <div style="display: flex; gap: 10px; border-top: 1px dashed #e5e7eb; padding-top: 15px;">
                ${venue.status === 'Pending Review' ? `
                    <button onclick="updateVenueStatus(${venue.id}, 'Approved')" style="flex: 1; background: #10b981; color: white; border: none; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s; text-align: center;">Approve</button>
                    <button onclick="updateVenueStatus(${venue.id}, 'Rejected')" style="flex: 1; background: #ef4444; color: white; border: none; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s; text-align: center;">Reject</button>
                ` : ''}
                <button onclick="deleteVenueListing(${venue.id})" style="flex: 1; background: #6b7280; color: white; border: none; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; transition: 0.3s; text-align: center;">Delete</button>
            </div>
        </div>
        `;
    });
}


// ========================================
// ACTION HANDLERS
// ========================================
async function updateStatus(eventId, newStatus) {
    let feedback = null;
    if (newStatus === "Rejected") {
        const { value: text, isConfirmed } = await Swal.fire({
            title: 'Enter Rejection Feedback',
            input: 'textarea',
            inputPlaceholder: 'Explain the reason for rejection here...',
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Submit Rejection",
            inputValidator: (value) => {
                if (!value.trim()) {
                    return 'You must enter a reason for rejection!';
                }
            }
        });

        if (!isConfirmed) return; // User cancelled
        feedback = text.trim();
    }

    try {
        const response = await fetch(`${API_BASE}/admin/update-status/${eventId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus, feedback: feedback })
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                icon: "success",
                title: "Status Updated",
                text: data.message,
                confirmButtonColor: "#c8a96b",
                timer: 1500
            });
            loadStatistics();
            loadEvents();
        } else {
            Swal.fire({
                icon: "error",
                title: "Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error updating status:", error);
    }
}

async function deleteEvent(eventId) {
    const confirm = await Swal.fire({
        title: "Delete Event?",
        text: "This action will permanently delete this event listing.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel"
    });

    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`${API_BASE}/delete-event/${eventId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                icon: "success",
                title: "Deleted",
                text: "The event has been successfully removed.",
                confirmButtonColor: "#c8a96b",
                timer: 1500
            });
            loadStatistics();
            loadEvents();
        } else {
            Swal.fire({
                icon: "error",
                title: "Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error deleting event:", error);
    }
}

async function deleteUser(userId, fullname) {
    const confirm = await Swal.fire({
        title: "Delete User?",
        text: `Are you sure you want to permanently delete user account "${fullname}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel"
    });

    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`${API_BASE}/admin/delete-user/${userId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                icon: "success",
                title: "Deleted",
                text: "The user account has been successfully deleted.",
                confirmButtonColor: "#c8a96b",
                timer: 1500
            });
            loadStatistics();
            loadUsers();
        } else {
            Swal.fire({
                icon: "error",
                title: "Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error deleting user:", error);
    }
}

async function updateVenueStatus(venueId, newStatus) {
    let feedback = null;
    if (newStatus === "Rejected") {
        const { value: text, isConfirmed } = await Swal.fire({
            title: 'Enter Rejection Feedback',
            input: 'textarea',
            inputPlaceholder: 'Explain the reason for rejection here...',
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Submit Rejection",
            inputValidator: (value) => {
                if (!value.trim()) {
                    return 'You must enter a reason for rejection!';
                }
            }
        });

        if (!isConfirmed) return; // User cancelled
        feedback = text.trim();
    }

    try {
        const response = await fetch(`${API_BASE}/admin/venues/update-status/${venueId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ status: newStatus, feedback: feedback })
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                icon: "success",
                title: "Venue Updated",
                text: data.message,
                confirmButtonColor: "#c8a96b",
                timer: 1500
            });
            loadStatistics();
            loadVenues();
        } else {
            Swal.fire({
                icon: "error",
                title: "Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error updating venue status:", error);
    }
}

async function deleteVenueListing(venueId) {
    const confirm = await Swal.fire({
        title: "Delete Venue?",
        text: "This action will permanently delete this venue listing.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel"
    });

    if (!confirm.isConfirmed) return;

    try {
        const response = await fetch(`${API_BASE}/admin/venues/delete/${venueId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                icon: "success",
                title: "Deleted",
                text: "The venue has been successfully removed.",
                confirmButtonColor: "#c8a96b",
                timer: 1500
            });
            loadStatistics();
            loadVenues();
        } else {
            Swal.fire({
                icon: "error",
                title: "Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error deleting venue:", error);
    }
}


// ========================================
// REPORTS & ANALYTICS
// ========================================
let categoryChartInstance = null;
let statusChartInstance = null;

async function loadReports() {
    try {
        const response = await fetch(`${API_BASE}/admin/reports/data`);
        const data = await response.json();

        if (!data.success) {
            console.error("Failed to load reports data:", data.message);
            return;
        }

        // Add event listener to timeframe dropdown to simulate timeframe filter if needed
        const timeframeSelect = document.getElementById("reportTimeframe");
        if (timeframeSelect && !timeframeSelect.dataset.listenerAdded) {
            timeframeSelect.dataset.listenerAdded = "true";
            timeframeSelect.addEventListener("change", () => {
                loadReports();
            });
        }

        renderCategoryChart(data.categories);
        renderStatusChart(data.statuses);

    } catch (error) {
        console.error("Error loading reports:", error);
    }
}

function renderCategoryChart(categoryData) {
    const ctx = document.getElementById("categoryChart");
    if (!ctx) return;

    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    const labels = Object.keys(categoryData);
    const values = Object.values(categoryData);

    // If no data
    if (labels.length === 0) {
        labels.push("No Events");
        values.push(0);
    }

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#c8a96b', // EventSync Gold
                    '#1e3a8a', // Dark Blue
                    '#10b981', // Emerald Teal
                    '#3b82f6', // Bright Blue
                    '#8b5cf6', // Violet Purple
                    '#f59e0b'  // Amber Orange
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#4b5563',
                        font: {
                            weight: '600'
                        }
                    }
                }
            },
            cutout: '70%'
        }
    });
}

function renderStatusChart(statusData) {
    const ctx = document.getElementById("statusChart");
    if (!ctx) return;

    if (statusChartInstance) {
        statusChartInstance.destroy();
    }

    const labels = Object.keys(statusData);
    const values = Object.values(statusData);

    // Color mapping for statuses
    const backgroundColors = labels.map(status => {
        if (status === 'Approved') return '#10b981';
        if (status === 'Rejected') return '#ef4444';
        return '#f59e0b'; // Pending Review
    });

    if (labels.length === 0) {
        labels.push("No Events");
        values.push(0);
        backgroundColors.push('#e5e7eb');
    }

    statusChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: backgroundColors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#4b5563',
                        font: {
                            weight: '600'
                        }
                    }
                }
            }
        }
    });
}

// ========================================
// CSV REPORT EXPORTER
// ========================================
async function exportCSV() {
    try {
        const response = await fetch(`${API_BASE}/admin/events`);
        const events = await response.json();

        if (!events || events.length === 0) {
            Swal.fire({
                icon: "info",
                title: "No Data",
                text: "There are no events in the database to export.",
                confirmButtonColor: "#c8a96b"
            });
            return;
        }

        // Build CSV Content
        let csvContent = "data:text/csv;charset=utf-8,";

        // Header Row
        csvContent += "Event ID,Title,Category,Venue,Date,Organizer,Status\n";

        // Data Rows
        events.forEach(event => {
            const title = `"${(event.title || '').replace(/"/g, '""')}"`;
            const category = `"${(event.category || '').replace(/"/g, '""')}"`;
            const venue = `"${(event.selected_venue || '').replace(/"/g, '""')}"`;
            const dateStr = (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null' && event.event_date_end !== event.event_date)
                ? `${event.event_date} to ${event.event_date_end}`
                : event.event_date;
            const date = `"${(dateStr || '').replace(/"/g, '""')}"`;
            const organizer = `"${(event.created_by || '').replace(/"/g, '""')}"`;
            const status = `"${(event.status || '').replace(/"/g, '""')}"`;

            csvContent += `${event.id},${title},${category},${venue},${date},${organizer},${status}\n`;
        });

        // Trigger Download in Browser
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `EventSync_System_Report_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Swal.fire({
            icon: "success",
            title: "Report Exported",
            text: "Your CSV data report has been generated and downloaded successfully.",
            confirmButtonColor: "#c8a96b",
            timer: 2000
        });

    } catch (error) {
        console.error("Error exporting CSV:", error);
        Swal.fire({
            icon: "error",
            title: "Export Failed",
            text: "An error occurred while generating the CSV report.",
            confirmButtonColor: "#d9534f"
        });
    }
}

// ========================================
// PDF PRINT REPORT
// ========================================
function printReport() {
    window.print();
}

// ========================================
// LOGOUT CONTROL
// ========================================
async function logout() {
    const result = await Swal.fire({
        title: "Logout",
        text: "Are you sure you want to logout from the admin control panel?",
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
        { id: "recent-events-section", menuIndex: 2 }, // Manage Events
        { id: "manage-venues-section", menuIndex: 3 }, // Manage Venues
        { id: "user-management-section", menuIndex: 4 }, // User Management
        { id: "reports-section", menuIndex: 5 },        // Reports
        { id: "notifications-section", menuIndex: 6 },  // Notifications
        { id: "admin-settings-section", menuIndex: 7 }  // Settings
    ];

    let currentSectionId = null;

    sections.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 200 && rect.bottom >= 150) {
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
        // Default to Dashboard (1st item) if we scroll back to the top
        const dashboardItem = document.querySelector(".menu li:nth-child(1)");
        if (dashboardItem) {
            dashboardItem.classList.add("active");
        }
    }
});

// ========================================
// LOAD SYSTEM NOTIFICATIONS
// ========================================
let allNotifications = [];

async function loadNotifications() {
    const list = document.getElementById("adminNotificationList");
    const viewMoreBtn = document.getElementById("viewMoreNotificationsBtn");
    if (!list) return;

    try {
        const response = await fetch(`${API_BASE}/admin/notifications`);
        allNotifications = await response.json();

        list.innerHTML = "";

        if (allNotifications.length === 0) {
            list.innerHTML = `
            <div class="notification-item" style="justify-content: center; color: #6b7280; font-style: italic;">
                No system notifications.
            </div>`;
            if (viewMoreBtn) viewMoreBtn.style.display = "none";
            return;
        }

        // Display first 5 notifications
        const firstFive = allNotifications.slice(0, 5);
        renderNotificationItems(firstFive);

        if (allNotifications.length > 5) {
            if (viewMoreBtn) {
                viewMoreBtn.style.display = "block";
                viewMoreBtn.innerText = "View More Notifications";
                // Prevent duplicate listeners
                if (!viewMoreBtn.dataset.listenerAdded) {
                    viewMoreBtn.dataset.listenerAdded = "true";
                    viewMoreBtn.addEventListener("click", () => {
                        if (viewMoreBtn.innerText === "View More Notifications") {
                            // Render remaining notifications
                            const remaining = allNotifications.slice(5);
                            renderNotificationItems(remaining);
                            viewMoreBtn.innerText = "Show Less Notifications";
                        } else {
                            // Collapse back to first 5
                            list.innerHTML = "";
                            const firstFive = allNotifications.slice(0, 5);
                            renderNotificationItems(firstFive);
                            viewMoreBtn.innerText = "View More Notifications";
                        }
                    });
                }
            }
        } else {
            if (viewMoreBtn) viewMoreBtn.style.display = "none";
        }

    } catch (error) {
        console.error("Error loading notifications:", error);
        list.innerHTML = `
        <div class="notification-item" style="justify-content: center; color: #ef4444; font-weight: 600;">
            Unable to connect to notifications server.
        </div>`;
    }
}

function renderNotificationItems(items) {
    const list = document.getElementById("adminNotificationList");
    if (!list) return;

    items.forEach(notify => {
        list.innerHTML += `
        <div class="notification-item" style="display: flex; align-items: center; gap: 15px; padding: 18px 0; border-bottom: 1px solid #f1f1f1;">
            <div class="dot" style="width: 12px; height: 12px; background: #c8a96b; border-radius: 50%; flex-shrink: 0;"></div>
            <div style="flex-grow: 1;">
                <p style="margin: 0; font-size: 14px; color: #1f2937;">${notify.message}</p>
                <span style="font-size: 11px; color: #9ca3af; margin-top: 4px; display: inline-block;">${notify.created_at}</span>
            </div>
        </div>
        `;
    });
}

// ========================================
// VENUE LAYOUT PREVIEW MODAL LOGIC (ADMIN)
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

    const timelineModal = document.getElementById("timelineModal");
    const closeTimelineBtn = document.getElementById("closeTimelineModalBtn");

    if (closeTimelineBtn && timelineModal) {
        closeTimelineBtn.addEventListener("click", () => {
            timelineModal.style.display = "none";
            document.body.style.overflow = "";
        });

        timelineModal.addEventListener("click", (e) => {
            if (e.target === timelineModal) {
                timelineModal.style.display = "none";
                document.body.style.overflow = "";
            }
        });
    }

    // ========================================
    // ADMIN SETTINGS LOAD & PERSISTENCE
    // ========================================
    async function loadAdminSettings() {
        try {
            const response = await fetch(`${API_BASE}/admin/settings`);
            const data = await response.json();
            
            const mmInput = document.getElementById("settingMaintenanceMode");
            const aaInput = document.getElementById("settingAutoApproveVenues");
            const modelSelect = document.getElementById("settingGeminiModel");
            const promptArea = document.getElementById("settingSystemInstruction");

            if (mmInput) mmInput.checked = data.maintenance_mode;
            if (aaInput) aaInput.checked = data.auto_approve_venues;
            if (modelSelect) modelSelect.value = data.gemini_model;
            if (promptArea) promptArea.value = data.gemini_system_instruction;
        } catch (error) {
            console.error("Error loading admin settings:", error);
        }
    }
    loadAdminSettings();

    const settingsForm = document.getElementById("adminSettingsForm");
    if (settingsForm) {
        settingsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const maintenance = document.getElementById("settingMaintenanceMode").checked;
            const autoApprove = document.getElementById("settingAutoApproveVenues").checked;
            const model = document.getElementById("settingGeminiModel").value;
            const instruction = document.getElementById("settingSystemInstruction").value;
            
            try {
                const response = await fetch(`${API_BASE}/admin/settings`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        maintenance_mode: maintenance,
                        auto_approve_venues: autoApprove,
                        gemini_model: model,
                        gemini_system_instruction: instruction
                    })
                });
                const result = await response.json();
                
                if (result.success) {
                    Swal.fire({
                        icon: "success",
                        title: "Settings Saved",
                        text: "Configuration changes have been successfully persisted.",
                        confirmButtonColor: "#c8a96b"
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Failed to Save Settings",
                        text: result.message,
                        confirmButtonColor: "#d9534f"
                    });
                }
            } catch (err) {
                console.error("Error saving settings:", err);
                Swal.fire({
                    icon: "error",
                    title: "Network Error",
                    text: "Could not connect to the server.",
                    confirmButtonColor: "#d9534f"
                });
            }
        });
    }

    const backupBtn = document.getElementById("triggerBackupBtn");
    if (backupBtn) {
        backupBtn.addEventListener("click", async () => {
            const confirmBackup = await Swal.fire({
                title: "Run Platform Auto-Backup?",
                text: "This will run git processes to stage, commit, and push the active repository changes directly to remote main.",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#c8a96b",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "Yes, trigger backup"
            });
            
            if (!confirmBackup.isConfirmed) return;
            
            Swal.fire({
                title: "Processing Backup...",
                text: "Syncing changes to GitHub. Please wait...",
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            try {
                const response = await fetch(`${API_BASE}/admin/trigger-backup`, {
                    method: "POST"
                });
                const result = await response.json();
                
                if (result.success) {
                    Swal.fire({
                        icon: "success",
                        title: "Backup Complete",
                        text: result.message,
                        confirmButtonColor: "#c8a96b"
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Backup Failed",
                        text: result.message,
                        confirmButtonColor: "#d9534f"
                    });
                }
            } catch (err) {
                console.error("Error triggering backup:", err);
                Swal.fire({
                    icon: "error",
                    title: "Network Error",
                    text: "Failed to reach the backup API endpoint.",
                    confirmButtonColor: "#d9534f"
                });
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

window.showTimelinePreview = function (eventId) {
    const timelineData = eventTimelines[eventId];
    if (!timelineData) return;

    const timelineModal = document.getElementById("timelineModal");
    const modalTimelinePreview = document.getElementById("modalTimelinePreview");
    if (!timelineModal || !modalTimelinePreview) return;

    modalTimelinePreview.innerHTML = "";

    timelineData.forEach((item, idx) => {
        modalTimelinePreview.innerHTML += `
            <div style="display: flex; gap: 15px; align-items: center; padding: 12px 15px; border-radius: 10px; background: #f9fafb; border: 1px solid #e5e7eb; font-family: 'Inter', sans-serif; margin-bottom: 8px;">
                <div style="font-weight: 700; color: #c8a96b; font-size: 14px; min-width: 60px;">${item.time}</div>
                <div style="width: 2px; height: 20px; background: #e5e7eb;"></div>
                <div style="color: #374151; font-size: 13.5px; font-weight: 500;">${item.activity}</div>
            </div>
        `;
    });

    timelineModal.style.display = "flex";
    document.body.style.overflow = "hidden";
};
