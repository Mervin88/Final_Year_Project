document.getElementById("forgotForm").addEventListener("submit", async function(e){

    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    // Show loading indicator
    Swal.fire({
        title: "Generating Link...",
        text: "Please wait while we verify your account.",
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {

        const response = await fetch("http://127.0.0.1:5000/forgot-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {

            if (data.console_fallback) {
                // Determine the correct reset password page URL matching the user's active host/port dynamically
                const resetUrl = window.location.href.replace("forgot-password.html", "reset-password.html") + `?token=${data.token}`;
                
                // Developer environment fallback
                Swal.fire({
                    icon: "info",
                    title: "Link Generated (Local Dev Mode)",
                    html: `
                        Password reset link has been printed to the Flask terminal console.
                        <br><br>
                        <strong>Direct Test URL:</strong><br>
                        <a href="${resetUrl}" target="_blank" style="color:#c8a96b; word-break:break-all;">
                            ${resetUrl}
                        </a>
                    `,
                    confirmButtonColor: "#c8a96b",
                    confirmButtonText: "Close"
                });
            } else {
                // Email sent successfully via SMTP
                Swal.fire({
                    icon: "success",
                    title: "Link Sent!",
                    text: data.message,
                    confirmButtonColor: "#c8a96b",
                    confirmButtonText: "OK"
                });
            }

        } else {

            Swal.fire({
                icon: "error",
                title: "Request Failed",
                text: data.message,
                confirmButtonColor: "#d9534f"
            });

        }

    } catch (error) {

        console.error("Error in forgot password request:", error);

        Swal.fire({
            icon: "error",
            title: "Server Connection Error",
            text: "Could not connect to the EventSync server. Make sure the backend is running.",
            confirmButtonColor: "#d9534f"
        });

    }

});
