function newEvent() {
    localStorage.removeItem("editEventId");
    localStorage.removeItem("eventDraft");
    localStorage.removeItem("isDemoMode");
    localStorage.removeItem("eventLayout");
    localStorage.removeItem("eventBackdropSetup");
    localStorage.removeItem("selectedVenue");
    localStorage.removeItem("eventTimeline");

    window.location.href = "create-event.html";
}

let base64BannerImage = null;
const editEventId = localStorage.getItem("editEventId");

if (editEventId) {
    document.getElementById("pageTitle").textContent = "Edit Event";

    loadEventData();

}
else {
    document.getElementById("pageTitle").textContent = "Create New Event";
    localStorage.removeItem("eventDraft");
    localStorage.removeItem("isDemoMode");
    localStorage.removeItem("eventLayout");
    localStorage.removeItem("eventBackdropSetup");
    localStorage.removeItem("selectedVenue");
    localStorage.removeItem("eventTimeline");
}

async function loadEventData() {

    try {

        const response = await fetch(
            `http://127.0.0.1:5000/event/${editEventId}`
        );

        const event =
            await response.json();

        console.log(event);

        document.getElementById("title").value =
            event.title;

        document.getElementById("category").value =
            event.category;

        document.getElementById("description").value =
            event.description;

        document.getElementById("eventDate").value =
            event.event_date;

        if (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null') {
            document.getElementById("eventDateEnd").value = event.event_date_end;
        } else {
            document.getElementById("eventDateEnd").value = event.event_date;
        }

        document.getElementById("startTime").value =
            event.start_time;

        document.getElementById("endTime").value =
            event.endTime || event.end_time;

        const parseCapacityRange = (val) => {
            const num = parseInt(val);
            if (isNaN(num)) return "";
            if (num >= 100 && num <= 500) return "100";
            if (num > 500 && num <= 1000) return "500";
            if (num > 1000) return "1000";
            return "100";
        };

        document.getElementById("participants").value = parseCapacityRange(event.participants);

        document.getElementById("location").value =
            event.preferred_location;

        document.getElementById("budget").value =
            event.budget;

        document.getElementById("capacity").value = parseCapacityRange(event.required_capacity);

        document.getElementById("venueType").value =
            event.venue_type;

        document.getElementById("parking").checked =

            Boolean(event.parking_required);

        document.getElementById("wifi").checked =
            Boolean(event.wifi_required);

        document.getElementById("projector").checked =
            Boolean(event.projector_required);

        document.getElementById("catering").checked =
            Boolean(event.catering_required);

        document.getElementById("soundSystem").checked =
            Boolean(event.sound_system_required);

        document.getElementById("stageSetup").checked =
            Boolean(event.stage_setup_required);

        document.getElementById("privacy").value = event.privacy || "Public";

        document.getElementById("otherRequirements").value =
            event.other_requirements || "";

        if (event.banner_image) {
            base64BannerImage = event.banner_image;
            const preview = document.getElementById("bannerPreview");
            if (preview) {
                preview.src = event.banner_image;
                preview.style.display = "block";
                const prompt = document.getElementById("uploadPrompt");
                if (prompt) prompt.style.display = "none";
            }
        }

        // Cache previous design components to LocalStorage so they are preserved during the Edit flow
        if (event.selected_venue) {
            localStorage.setItem("selectedVenue", event.selected_venue);
        }
        if (event.timeline && event.timeline !== "None" && event.timeline !== "null") {
            localStorage.setItem("eventTimeline", event.timeline);
        }
        if (event.layout && event.layout !== "None" && event.layout !== "null") {
            localStorage.setItem("eventLayout", event.layout);
        }
        if (event.backdrop_setup && event.backdrop_setup !== "None" && event.backdrop_setup !== "null") {
            localStorage.setItem("eventBackdropSetup", event.backdrop_setup);
        }

    }

    catch (error) {

        console.log(error);

    }

}

// Dynamically set date min to today's date and attach banner upload preview listener
document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("eventDate");
    const dateEndInput = document.getElementById("eventDateEnd");
    const today = new Date().toISOString().split("T")[0];
    if (dateInput) {
        dateInput.setAttribute("min", today);
    }
    if (dateEndInput) {
        dateEndInput.setAttribute("min", today);
    }

    const bannerUpload = document.getElementById("bannerUpload");
    if (bannerUpload) {
        bannerUpload.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                // Verify file is an image
                if (!file.type.startsWith("image/")) {
                    showErrorAlert("Invalid File", "Please select an image file.");
                    bannerUpload.value = "";
                    return;
                }
                // Limit file size to 2MB (Base64 adds overhead, 2MB is a safe DB size)
                if (file.size > 2 * 1024 * 1024) {
                    showErrorAlert("File Too Large", "Event banner image cannot exceed 2MB.");
                    bannerUpload.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    base64BannerImage = evt.target.result;
                    const preview = document.getElementById("bannerPreview");
                    if (preview) {
                        preview.src = base64BannerImage;
                        preview.style.display = "block";
                        const prompt = document.getElementById("uploadPrompt");
                        if (prompt) prompt.style.display = "none";
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

function showErrorAlert(title, text) {
    if (window.Swal) {
        Swal.fire({
            icon: "warning",
            title: title,
            text: text,
            confirmButtonColor: "#c8a96b"
        });
    } else {
        alert(`${title}: ${text}`);
    }
}

document.getElementById("continueBtn")
    .addEventListener("click", () => {

        const title = document.getElementById("title").value.trim();
        const category = document.getElementById("category").value;
        const event_date = document.getElementById("eventDate").value;
        const event_date_end = document.getElementById("eventDateEnd").value;
        const start_time = document.getElementById("startTime").value;
        const end_time = document.getElementById("endTime").value;
        const participants = document.getElementById("participants").value;
        const preferred_location = document.getElementById("location").value.trim();
        const budget = document.getElementById("budget").value;
        const required_capacity = document.getElementById("capacity").value;
        const venue_type = document.getElementById("venueType").value;
        const other_requirements = document.getElementById("otherRequirements").value.trim();
        const description = document.getElementById("description").value.trim();

        // 1. Basic required checks
        if (!title) { showErrorAlert("Missing Field", "Please enter an event title."); return; }
        if (!category) { showErrorAlert("Missing Field", "Please select an event category."); return; }
        if (!event_date) { showErrorAlert("Missing Field", "Please select an event start date."); return; }
        if (!event_date_end) { showErrorAlert("Missing Field", "Please select an event end date."); return; }
        if (!start_time) { showErrorAlert("Missing Field", "Please enter a start time."); return; }
        if (!end_time) { showErrorAlert("Missing Field", "Please enter an end time."); return; }
        if (!participants) { showErrorAlert("Missing Field", "Please select expected participants."); return; }
        if (!preferred_location) { showErrorAlert("Missing Field", "Please enter preferred location."); return; }
        if (!budget) { showErrorAlert("Missing Field", "Please enter budget."); return; }
        if (!required_capacity) { showErrorAlert("Missing Field", "Please select required capacity."); return; }
        if (!venue_type) { showErrorAlert("Missing Field", "Please select a venue type."); return; }
        if (!description) { showErrorAlert("Missing Field", "Please enter event description."); return; }

        // 2. Length limits
        if (title.length > 100) { showErrorAlert("Limit Exceeded", "Event title cannot exceed 100 characters."); return; }
        if (description.length > 1000) { showErrorAlert("Limit Exceeded", "Event description cannot exceed 1000 characters."); return; }
        if (other_requirements.length > 300) { showErrorAlert("Limit Exceeded", "Other requirements cannot exceed 300 characters."); return; }
        if (preferred_location.length > 100) { showErrorAlert("Limit Exceeded", "Preferred location cannot exceed 100 characters."); return; }

        // 3. Date check (not in past, end >= start)
        const todayStr = new Date().toISOString().split("T")[0];
        if (event_date < todayStr) {
            showErrorAlert("Invalid Date", "Event start date cannot be in the past.");
            return;
        }
        if (event_date_end < event_date) {
            showErrorAlert("Invalid Date Range", "Event end date cannot be before the start date.");
            return;
        }

        // 4. Time check (End > Start if same day)
        if (event_date === event_date_end && start_time >= end_time) {
            showErrorAlert("Invalid Time Range", "Event end time must be strictly after the start time on single-day events.");
            return;
        }

        // 5. Numeric boundary validation
        const parsedParticipants = parseInt(participants);
        if (isNaN(parsedParticipants)) {
            showErrorAlert("Invalid Value", "Please select expected participants.");
            return;
        }

        const parsedCapacity = parseInt(required_capacity);
        if (isNaN(parsedCapacity)) {
            showErrorAlert("Invalid Value", "Please select required capacity.");
            return;
        }

        if (parsedParticipants > parsedCapacity) {
            showErrorAlert("Invalid Range", "Expected participants range cannot exceed the required venue capacity.");
            return;
        }

        const parsedBudget = parseFloat(budget);
        if (isNaN(parsedBudget) || parsedBudget < 0 || parsedBudget > 1000000) {
            showErrorAlert("Invalid Value", "Budget must be between RM 0 and RM 1,000,000.");
            return;
        }

        const eventData = {
            title,
            category,
            event_date,
            event_date_end,
            start_time,
            end_time,
            participants: parsedParticipants,
            preferred_location,
            budget: parsedBudget,
            required_capacity: parsedCapacity,
            venue_type,
            parking_required: document.getElementById("parking").checked,
            wifi_required: document.getElementById("wifi").checked,
            projector_required: document.getElementById("projector").checked,
            catering_required: document.getElementById("catering").checked,
            sound_system_required: document.getElementById("soundSystem").checked,
            stage_setup_required: document.getElementById("stageSetup").checked,
            other_requirements,
            description,
            banner_image: base64BannerImage,
            privacy: document.getElementById("privacy").value
        };

        localStorage.setItem(
            "eventDraft",
            JSON.stringify(eventData)
        );
        localStorage.removeItem("isDemoMode");

        console.log(eventData);

        window.location.href = "venues.html?recommend=true";

    });