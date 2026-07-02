document.getElementById("loginForm").addEventListener("submit", async function(e){

    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try{

        const response = await fetch("http://127.0.0.1:5000/login", {

            method: "POST",

            headers:{
                "Content-Type":"application/json"
            },

            body: JSON.stringify({
                email,
                password
            })

        });

        const data = await response.json();

        if(data.success){

            // SAVE LOGIN SESSION
            localStorage.setItem("userRole", data.role);
            localStorage.setItem("role", data.role);
            localStorage.setItem("username", data.fullname);

            // Check if there is a pending quick search query from landing page
            const pendingQuery = localStorage.getItem("pendingSearchQuery");
            if (pendingQuery !== null) {
                localStorage.removeItem("pendingSearchQuery");
                if (pendingQuery) {
                    window.location.href = `venues.html?query=${encodeURIComponent(pendingQuery)}`;
                } else {
                    window.location.href = "venues.html";
                }
            } else {
                // DIRECT REDIRECT
                if(data.role === "Admin"){
                    window.location.href = "admin-dashboard.html";
                }else if(data.role === "Vendor"){
                    window.location.href = "vendor-dashboard.html";
                }else if(data.role === "Organizer"){
                    window.location.href = "user-dashboard.html";
                }else{
                    window.location.href = "events.html";
                }
            }

        }else{

            // SHOW ERROR POPUP ONLY
            const popup = document.getElementById("popup");

            document.getElementById("popup-title").innerText = "Login Failed";

            document.getElementById("popup-message").innerText = data.message;

            document.querySelector(".popup-icon").innerText = "✕";

            document.querySelector(".popup-icon").style.background = "#ef4444";

            popup.classList.add("show");

            setTimeout(() => {

                popup.classList.remove("show");

            }, 3000);

        }

    }catch(error){

        const popup = document.getElementById("popup");

        document.getElementById("popup-title").innerText = "Connection Error";

        document.getElementById("popup-message").innerText =
        "Unable to connect to server.";

        document.querySelector(".popup-icon").innerText = "!";

        document.querySelector(".popup-icon").style.background = "#f59e0b";

        popup.classList.add("show");

        setTimeout(() => {

            popup.classList.remove("show");

        }, 3000);

        console.log(error);

    }

});

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