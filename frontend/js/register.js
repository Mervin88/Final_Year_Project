const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

document.getElementById("registerForm").addEventListener("submit", async function(e){

    e.preventDefault();

    const fullname =
    document.getElementById("fullname").value.trim();

    const rawEmail = document.getElementById("email").value.trim();

    if (/^[A-Z]/.test(rawEmail)) {
        Swal.fire({
            icon: "error",
            title: "Invalid Email Format",
            text: "Email address cannot start with a capital letter. Please use lowercase (e.g. john@gmail.com).",
            confirmButtonColor: "#d9534f"
        });
        return;
    }

    const email = rawEmail.toLowerCase();

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

    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(email)) {
        Swal.fire({
            icon: "error",
            title: "Invalid Email Format",
            text: "Please enter a valid lowercase email address (e.g. user@example.com).",
            confirmButtonColor: "#d9534f"
        });
        return;
    }

    const domain = email.split("@")[1];
    const typoTlds = [".copm", ".cmo", ".con", ".cm", ".coom", ".gmai", ".hotmial", ".yaho", ".outlok", ".gmal", ".gmial"];
    for (const typo of typoTlds) {
        if (domain.endsWith(typo)) {
            Swal.fire({
                icon: "error",
                title: "Invalid Email Extension",
                text: `Invalid domain extension '${typo}'. Did you mean '.com'?`,
                confirmButtonColor: "#d9534f"
            });
            return;
        }
    }

    if (domain.includes("gmai.") || domain.includes("gmial.") || domain.includes("gmal.")) {
        Swal.fire({
            icon: "error",
            title: "Invalid Email Domain",
            text: "Invalid domain name. Did you mean 'gmail.com'?",
            confirmButtonColor: "#d9534f"
        });
        return;
    }

    // Password Strength Validation
    const hasMinLength = password.length >= 6;
    const hasCapital = /[A-Z]/.test(password);
    const hasSpecialSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasMinLength || !hasCapital || !hasSpecialSymbol) {
        let missingRules = [];
        if (!hasMinLength) missingRules.push("• Minimum 6 characters long");
        if (!hasCapital) missingRules.push("• At least 1 uppercase capital letter (A-Z)");
        if (!hasSpecialSymbol) missingRules.push("• At least 1 special symbol (e.g. @, #, ., !)");

        Swal.fire({
            icon: "warning",
            title: "Weak Password",
            html: `Your password must meet the following requirements:<br><br><div style="text-align: left; display: inline-block; color: #d9534f; font-weight: 500;">${missingRules.join("<br>")}</div>`,
            confirmButtonColor: "#c8a96b"
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