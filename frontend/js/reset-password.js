// Get token from URL query parameters
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');

if (!token) {
    Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "Invalid or missing reset token. Please request a new link.",
        confirmButtonColor: "#d9534f",
        allowOutsideClick: false
    }).then(() => {
        window.location.href = "login.html";
    });
}

// Handle Form Submission
document.getElementById("resetForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        Swal.fire({
            icon: "warning",
            title: "Mismatch",
            text: "Passwords do not match. Please verify your entry.",
            confirmButtonColor: "#c8a96b"
        });
        return;
    }

    Swal.fire({
        title: "Resetting Password...",
        text: "Please wait.",
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch("http://127.0.0.1:5000/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                token: token,
                password: password
            })
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                icon: "success",
                title: "Password Reset!",
                text: "Your password has been updated successfully. You can now login.",
                confirmButtonColor: "#c8a96b",
                allowOutsideClick: false
            }).then(() => {
                window.location.href = "login.html";
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Reset Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });
        }
    } catch (error) {
        console.error("Error in reset password request:", error);
        Swal.fire({
            icon: "error",
            title: "Server Error",
            text: "Unable to connect to the server. Please try again later.",
            confirmButtonColor: "#d9534f"
        });
    }
});

// PASSWORD EYE TOGGLE LOGIC
const togglePasswordBtn = document.getElementById("togglePassword");
if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", function() {
        const passwordInput = document.getElementById("password");
        const eyeOpen = this.querySelector(".eye-open");
        const eyeClosed = this.querySelector(".eye-closed");
        
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            eyeOpen.style.display = "none";
            eyeClosed.style.display = "block";
        } else {
            passwordInput.type = "password";
            eyeOpen.style.display = "block";
            eyeClosed.style.display = "none";
        }
    });
}

const toggleConfirmPasswordBtn = document.getElementById("toggleConfirmPassword");
if (toggleConfirmPasswordBtn) {
    toggleConfirmPasswordBtn.addEventListener("click", function() {
        const confirmPasswordInput = document.getElementById("confirmPassword");
        const eyeOpen = this.querySelector(".eye-open");
        const eyeClosed = this.querySelector(".eye-closed");
        
        if (confirmPasswordInput.type === "password") {
            confirmPasswordInput.type = "text";
            eyeOpen.style.display = "none";
            eyeClosed.style.display = "block";
        } else {
            confirmPasswordInput.type = "password";
            eyeOpen.style.display = "block";
            eyeClosed.style.display = "none";
        }
    });
}
