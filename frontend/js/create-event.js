function newEvent() {

    localStorage.removeItem("editEventId");

    localStorage.removeItem("eventDraft");
    localStorage.removeItem("isDemoMode");

    window.location.href =
        "create-event.html";

}

const editEventId =
    localStorage.getItem("editEventId");

if (editEventId) {

    document.getElementById("pageTitle")
        .textContent = "Edit Event";

    loadEventData();

}
else {

    document.getElementById("pageTitle")
        .textContent = "Create New Event";

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

        document.getElementById("startTime").value =
            event.start_time;

        document.getElementById("endTime").value =
            event.end_time;

        document.getElementById("participants").value =
            event.participants;

        document.getElementById("location").value =
            event.preferred_location;

        document.getElementById("budget").value =
            event.budget;

        document.getElementById("capacity").value =
            event.required_capacity;

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

        document.getElementById("otherRequirements").value =
            event.other_requirements || "";

    }

    catch (error) {

        console.log(error);

    }

}

// Dynamically set date min to today's date
document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("eventDate");
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.setAttribute("min", today);
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
        if (!event_date) { showErrorAlert("Missing Field", "Please select an event date."); return; }
        if (!start_time) { showErrorAlert("Missing Field", "Please enter a start time."); return; }
        if (!end_time) { showErrorAlert("Missing Field", "Please enter an end time."); return; }
        if (!participants) { showErrorAlert("Missing Field", "Please enter expected participants."); return; }
        if (!preferred_location) { showErrorAlert("Missing Field", "Please enter preferred location."); return; }
        if (!budget) { showErrorAlert("Missing Field", "Please enter budget."); return; }
        if (!required_capacity) { showErrorAlert("Missing Field", "Please enter required capacity."); return; }
        if (!venue_type) { showErrorAlert("Missing Field", "Please select a venue type."); return; }
        if (!description) { showErrorAlert("Missing Field", "Please enter event description."); return; }

        // 2. Length limits
        if (title.length > 100) { showErrorAlert("Limit Exceeded", "Event title cannot exceed 100 characters."); return; }
        if (description.length > 1000) { showErrorAlert("Limit Exceeded", "Event description cannot exceed 1000 characters."); return; }
        if (other_requirements.length > 300) { showErrorAlert("Limit Exceeded", "Other requirements cannot exceed 300 characters."); return; }
        if (preferred_location.length > 100) { showErrorAlert("Limit Exceeded", "Preferred location cannot exceed 100 characters."); return; }

        // 3. Date check (not in past)
        const todayStr = new Date().toISOString().split("T")[0];
        if (event_date < todayStr) {
            showErrorAlert("Invalid Date", "Event date cannot be in the past.");
            return;
        }

        // 4. Time check (End > Start)
        if (start_time >= end_time) {
            showErrorAlert("Invalid Time Range", "Event end time must be strictly after the start time.");
            return;
        }

        // 5. Numeric boundary validation
        const parsedParticipants = parseInt(participants);
        if (isNaN(parsedParticipants) || parsedParticipants < 1 || parsedParticipants > 10000) {
            showErrorAlert("Invalid Value", "Expected participants must be between 1 and 10,000 pax.");
            return;
        }

        const parsedCapacity = parseInt(required_capacity);
        if (isNaN(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 10000) {
            showErrorAlert("Invalid Value", "Required capacity must be between 1 and 10,000 pax.");
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
            description
        };

        localStorage.setItem(
            "eventDraft",
            JSON.stringify(eventData)
        );
        localStorage.removeItem("isDemoMode");

        console.log(eventData);

        window.location.href = "venues.html?recommend=true";

    });