const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

document.getElementById("registerForm").addEventListener("submit", async function(e){

    e.preventDefault();

    const fullname =
    document.getElementById("fullname").value.trim();

    const email =
    document.getElementById("email").value.trim();

    const password =
    document.getElementById("password").value.trim();

    const role =
    document.getElementById("role").value;

    if(
    fullname === "" ||
    email === "" ||
    password === ""
    ){

        Swal.fire({
            icon: "warning",
            title: "Incomplete Information",
            text: "Please fill in all required fields.",
            confirmButtonColor: "#c8a96b"
        });

        return;
    }

    const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!emailPattern.test(email)){

        Swal.fire({
            icon: "error",
            title: "Invalid Email",
            text: "Please enter a valid email address.",
            confirmButtonColor: "#d9534f"
        });

        return;
    }


    try{

        const response = await fetch(`${API_BASE}/register`, {

            method: "POST",

            headers:{
                "Content-Type":"application/json"
            },

            body: JSON.stringify({
                fullname,
                email,
                password,
                role
            })

        });

        const data = await response.json();

        if(data.success){

            Swal.fire({

                icon: "success",

                title: "Welcome to EventSync 🎉",

                html: `
                    Your account has been created
                    successfully.<br><br>

                    You may now login and start
                    planning your events.
                `,

                confirmButtonText: "Go to Login",

                confirmButtonColor: "#c8a96b",

                allowOutsideClick: false

            }).then(() => {

                window.location.href =
                "login.html";

            });

        }
        else{

            Swal.fire({

                icon: "error",

                title: "Registration Failed",

                text: data.message,

                confirmButtonColor: "#d9534f"

            });

        }

    }catch(error){

        console.log(error);

        Swal.fire({

            icon: "error",

            title: "Server Error",

            text: "Unable to connect to the server. Please try again later.",

            confirmButtonColor: "#d9534f"

        });

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