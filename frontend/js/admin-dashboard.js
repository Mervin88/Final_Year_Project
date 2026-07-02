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
        const response = await fetch("http://127.0.0.1:5000/admin/stats");
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
        const response = await fetch("http://127.0.0.1:5000/admin/events");
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

            grid.innerHTML += `
            <div class="event-card" style="box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-radius: 18px; overflow: hidden; background: white;">
                <img src="${img}" style="width: 100%; height: 160px; object-fit: cover;">
                <div class="event-content" style="padding: 20px;">
                    <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #111827;">${event.title}</h3>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Category:</strong> ${event.category}</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Venue:</strong> ${event.selected_venue}</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Date:</strong> ${event.event_date}</p>
                    <p style="font-size: 14px; color: #4b5563; margin-bottom: 12px;"><strong>Organizer:</strong> ${event.created_by}</p>
                    
                    <span style="background: ${badgeBg}; color: white; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; margin-bottom: 15px;">
                        ${event.status}
                    </span>

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
        const response = await fetch("http://127.0.0.1:5000/admin/users");
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
        const response = await fetch("http://127.0.0.1:5000/admin/venues");
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
            <p style="font-size: 14px; color: #4b5563; margin-bottom: 4px;"><strong>Price:</strong> RM ${parseFloat(venue.price).toLocaleString(undefined, {minimumFractionDigits: 2})}/day</p>
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
        const response = await fetch(`http://127.0.0.1:5000/admin/update-status/${eventId}`, {
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
        const response = await fetch(`http://127.0.0.1:5000/delete-event/${eventId}`, {
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
        const response = await fetch(`http://127.0.0.1:5000/admin/delete-user/${userId}`, {
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
        const response = await fetch(`http://127.0.0.1:5000/admin/venues/update-status/${venueId}`, {
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
        const response = await fetch(`http://127.0.0.1:5000/admin/venues/delete/${venueId}`, {
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
        const response = await fetch("http://127.0.0.1:5000/admin/reports/data");
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
        const response = await fetch("http://127.0.0.1:5000/admin/events");
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
            const date = `"${(event.event_date || '').replace(/"/g, '""')}"`;
            const organizer = `"${(event.created_by || '').replace(/"/g, '""')}"`;
            const status = `"${(event.status || '').replace(/"/g, '""')}"`;

            csvContent += `${event.id},${title},${category},${venue},${date},${organizer},${status}\n`;
        });

        // Trigger Download in Browser
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `EventSync_System_Report_${new Date().toISOString().slice(0,10)}.csv`);
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
        { id: "notifications-section", menuIndex: 6 }  // Notifications
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
        const response = await fetch("http://127.0.0.1:5000/admin/notifications");
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
