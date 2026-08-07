// ========================================
// SESSION PROTECTION & INITIALIZATION
// ========================================

const currentRole = localStorage.getItem("userRole") || localStorage.getItem("role");
const currentUsername = localStorage.getItem("username");

if (!currentRole || !currentUsername) {
    window.location.href = "login.html";
}

// Global variable to keep track of display name
let activeUsername = currentUsername;

// ========================================
// FETCH PROFILE DETAILS
// ========================================

async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/user/profile/${activeUsername}`);
        const data = await response.json();
        
        if (data.success) {
            document.getElementById("fullName").value = data.fullname;
            document.getElementById("email").value = data.email;
            document.getElementById("userRole").value = data.role;
        } else {
            Swal.fire({
                icon: "error",
                title: "Failed to load profile",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

// ========================================
// UPDATE PROFILE ACTION
// ========================================

document.getElementById("profileForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const fullname = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    
    if (!fullname || !email) {
        Swal.fire({
            icon: "warning",
            title: "Empty Fields",
            text: "Full Name and Email Address cannot be empty.",
            confirmButtonColor: "#c8a96b"
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/user/profile/update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                current_username: activeUsername,
                fullname: fullname,
                email: email
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Update local storage username to match new display name
            localStorage.setItem("username", fullname);
            activeUsername = fullname;
            
            Swal.fire({
                icon: "success",
                title: "Profile Updated",
                text: "Your personal details have been saved successfully.",
                confirmButtonColor: "#c8a96b"
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        Swal.fire({
            icon: "error",
            title: "Connection Error",
            text: "Could not connect to the server.",
            confirmButtonColor: "#d9534f"
        });
    }
});

// ========================================
// CHANGE PASSWORD ACTION
// ========================================

document.getElementById("passwordForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const fullname = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        Swal.fire({
            icon: "warning",
            title: "Empty Fields",
            text: "Please fill in all password fields.",
            confirmButtonColor: "#c8a96b"
        });
        return;
    }
    
    if (newPassword !== confirmPassword) {
        Swal.fire({
            icon: "error",
            title: "Passwords Mismatch",
            text: "New Password and Confirm New Password do not match.",
            confirmButtonColor: "#d9534f"
        });
        return;
    }
    
    if (newPassword.length < 6) {
        Swal.fire({
            icon: "warning",
            title: "Weak Password",
            text: "Your new password must be at least 6 characters long.",
            confirmButtonColor: "#c8a96b"
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/user/profile/update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                current_username: activeUsername,
                fullname: fullname,
                email: email,
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Clear password inputs on success
            document.getElementById("currentPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";
            
            Swal.fire({
                icon: "success",
                title: "Password Updated",
                text: "Your security credentials have been updated successfully.",
                confirmButtonColor: "#c8a96b"
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Security Update Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error updating password:", error);
        Swal.fire({
            icon: "error",
            title: "Connection Error",
            text: "Could not connect to the server.",
            confirmButtonColor: "#d9534f"
        });
    }
});

// ========================================
// LOGOUT ACTION
// ========================================

window.logout = function() {
    localStorage.removeItem("userRole");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    window.location.href = "login.html";
};

function setupRoleNavigation() {
    const role = (currentRole || "").toLowerCase();
    const menuContainer = document.querySelector(".sidebar .menu");
    if (!menuContainer) return;

    if (role === "vendor") {
        menuContainer.innerHTML = `
            <li onclick="window.location.href='vendor-dashboard.html'">
                Dashboard
            </li>
            <li onclick="window.location.href='vendor-dashboard.html#upload-section'">
                Upload Venue
            </li>
            <li onclick="window.location.href='vendor-dashboard.html#my-venues-section'">
                My Listings
            </li>
            <li class="active" onclick="window.location.href='settings.html'">
                Settings
            </li>
        `;
    } else if (role === "participant") {
        menuContainer.innerHTML = `
            <li onclick="window.location.href='participant-dashboard.html'">
                Dashboard
            </li>
            <li onclick="window.location.href='events.html'">
                Events
            </li>
            <li onclick="window.location.href='venues.html'">
                Venues
            </li>
            <li onclick="window.location.href='registrations.html'">
                My Registrations
            </li>
            <li class="active" onclick="window.location.href='settings.html'">
                Settings
            </li>
        `;
    } else if (role === "admin") {
        menuContainer.innerHTML = `
            <li onclick="window.location.href='admin-dashboard.html'">
                Dashboard
            </li>
            <li onclick="window.location.href='admin-dashboard.html'">
                Manage Events
            </li>
            <li onclick="window.location.href='admin-dashboard.html'">
                Manage Venues
            </li>
            <li class="active" onclick="window.location.href='settings.html'">
                Settings
            </li>
        `;
    }
}

// ========================================
// INITIALIZE PAGE & THEME PREFERENCE
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    setupRoleNavigation();

    // Check and set default theme toggler checkbox state
    const themeCheckbox = document.getElementById("themeCheckbox") || document.getElementById("darkModeToggle");
    if (themeCheckbox) {
        const currentTheme = localStorage.getItem("theme") || "light";
        themeCheckbox.checked = (currentTheme === "dark");
        
        themeCheckbox.addEventListener("change", (e) => {
            e.stopPropagation();
            if (themeCheckbox.checked) {
                document.documentElement.classList.add("dark-theme");
                localStorage.setItem("theme", "dark");
            } else {
                document.documentElement.classList.remove("dark-theme");
                localStorage.setItem("theme", "light");
            }
        });
    }
});
