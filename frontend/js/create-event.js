const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

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

function compressBannerFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement("canvas");
                    const MAX_WIDTH = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_WIDTH) {
                        height = Math.round((height * MAX_WIDTH) / width);
                        width = MAX_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressed = canvas.toDataURL("image/jpeg", 0.7);
                    resolve(compressed);
                } catch (e) {
                    resolve(evt.target.result);
                }
            };
            img.onerror = () => resolve(evt.target.result);
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function loadEventData(editEventId) {
    try {
        const response = await fetch(`${API_BASE}/event/${editEventId}`);
        const event = await response.json();

        console.log("Loaded Event Data for Edit:", event);

        const setTitle = document.getElementById("title");
        if (setTitle) setTitle.value = event.title || "";

        const setCategory = document.getElementById("category");
        if (setCategory) setCategory.value = event.category || "Corporate Event";

        const setDesc = document.getElementById("description");
        if (setDesc) setDesc.value = event.description || "";

        const setEventDate = document.getElementById("eventDate");
        if (setEventDate) setEventDate.value = event.event_date || "";

        const setEventDateEnd = document.getElementById("eventDateEnd");
        if (setEventDateEnd) {
            if (event.event_date_end && event.event_date_end !== 'None' && event.event_date_end !== 'null') {
                setEventDateEnd.value = event.event_date_end;
            } else {
                setEventDateEnd.value = event.event_date || "";
            }
        }

        const formatTimeHHMM = (timeStr, defaultTime) => {
            if (!timeStr || timeStr === 'None' || timeStr === 'null') return defaultTime;
            const parts = String(timeStr).trim().split(":");
            if (parts.length >= 2) {
                const hh = parts[0].padStart(2, "0");
                const mm = parts[1].padStart(2, "0");
                return `${hh}:${mm}`;
            }
            return timeStr;
        };

        const setStartTime = document.getElementById("startTime");
        if (setStartTime) setStartTime.value = formatTimeHHMM(event.start_time, "09:00");

        const setEndTime = document.getElementById("endTime");
        if (setEndTime) setEndTime.value = formatTimeHHMM(event.endTime || event.end_time, "17:00");

        const parseCapacityRange = (val) => {
            const num = parseInt(val);
            if (isNaN(num)) return "100";
            if (num >= 1000) return "1000";
            if (num >= 500) return "500";
            return "100";
        };

        const setParticipants = document.getElementById("participants");
        if (setParticipants) setParticipants.value = parseCapacityRange(event.participants);

        const setCapacity = document.getElementById("capacity");
        if (setCapacity) setCapacity.value = parseCapacityRange(event.required_capacity || event.participants);

        const setLocation = document.getElementById("location");
        if (setLocation) setLocation.value = event.preferred_location || "Kuala Lumpur";

        const setBudget = document.getElementById("budget");
        if (setBudget) setBudget.value = event.budget || 5000;

        const setVenueType = document.getElementById("venueType");
        if (setVenueType) setVenueType.value = event.venue_type || "Indoor";

        const setParking = document.getElementById("parking");
        if (setParking) setParking.checked = Boolean(event.parking_required);

        const setWifi = document.getElementById("wifi");
        if (setWifi) setWifi.checked = Boolean(event.wifi_required);

        const setProjector = document.getElementById("projector");
        if (setProjector) setProjector.checked = Boolean(event.projector_required);

        const setCatering = document.getElementById("catering");
        if (setCatering) setCatering.checked = Boolean(event.catering_required);

        const setSoundSystem = document.getElementById("soundSystem");
        if (setSoundSystem) setSoundSystem.checked = Boolean(event.sound_system_required);

        const setStageSetup = document.getElementById("stageSetup");
        if (setStageSetup) setStageSetup.checked = Boolean(event.stage_setup_required);

        const setPrivacy = document.getElementById("privacy");
        if (setPrivacy) setPrivacy.value = event.privacy || "Public";

        const setOtherReqs = document.getElementById("otherRequirements");
        if (setOtherReqs) setOtherReqs.value = event.other_requirements || "";

        if (event.banner_image && event.banner_image !== "None" && event.banner_image !== "null") {
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

    } catch (error) {
        console.error("Error loading event data:", error);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const editEventId = localStorage.getItem("editEventId");

    if (editEventId) {
        const pageTitle = document.getElementById("pageTitle");
        if (pageTitle) pageTitle.textContent = "Edit Event";

        loadEventData(editEventId);
    } else {
        const pageTitle = document.getElementById("pageTitle");
        if (pageTitle) pageTitle.textContent = "Create New Event";

        localStorage.removeItem("eventDraft");
        localStorage.removeItem("isDemoMode");
        localStorage.removeItem("eventLayout");
        localStorage.removeItem("eventBackdropSetup");
        localStorage.removeItem("selectedVenue");
        const dateInput = document.getElementById("eventDate");
        const dateEndInput = document.getElementById("eventDateEnd");
        const today = new Date().toISOString().split("T")[0];
        if (dateInput) {
            dateInput.setAttribute("min", today);
        }
        if (dateEndInput) {
            dateEndInput.setAttribute("min", today);
        }

        // Real-time schedule time check
        const validateTimeInputs = () => {
            const sTime = document.getElementById("startTime")?.value;
            const eTime = document.getElementById("endTime")?.value;
            if (sTime && eTime && sTime >= eTime) {
                showErrorAlert("Invalid Time Range", "Event end time must be strictly after the start time (e.g. Start: 09:00 AM, End: 05:00 PM).");
            }
        };

        document.getElementById("startTime")?.addEventListener("change", validateTimeInputs);
        document.getElementById("endTime")?.addEventListener("change", validateTimeInputs);
    }

    const bannerUpload = document.getElementById("bannerUpload");
    if (bannerUpload) {
        bannerUpload.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const fileName = file.name.toLowerCase();
                const validTypes = ["image/png", "image/jpeg", "image/jpg"];
                const validExts = [".png", ".jpg", ".jpeg"];
                const hasValidExt = validExts.some(ext => fileName.endsWith(ext));
                const hasValidType = validTypes.includes(file.type);

                if (!hasValidType || !hasValidExt) {
                    if (typeof showErrorAlert === "function") {
                        showErrorAlert("Invalid File Type", "Only PNG and JPG/JPEG image files are allowed for event banners.");
                    } else if (typeof Swal !== "undefined") {
                        Swal.fire({
                            icon: "error",
                            title: "Invalid File Type",
                            text: "Only PNG and JPG/JPEG image files are allowed for event banners.",
                            confirmButtonColor: "#c8a96b"
                        });
                    } else {
                        alert("Only PNG and JPG/JPEG image files are allowed for event banners.");
                    }
                    bannerUpload.value = "";
                    return;
                }

                // Read and set image Base64 immediately, then compress via canvas in background
                const reader = new FileReader();
                reader.onload = function (evt) {
                    base64BannerImage = evt.target.result;

                    const preview = document.getElementById("bannerPreview");
                    if (preview) {
                        preview.src = base64BannerImage;
                        preview.style.display = "block";
                        const prompt = document.getElementById("uploadPrompt");
                        if (prompt) prompt.style.display = "none";
                    }

                    const img = new Image();
                    img.onload = function () {
                        try {
                            const canvas = document.createElement("canvas");
                            const MAX_WIDTH = 800;
                            let width = img.width;
                            let height = img.height;

                            if (width > MAX_WIDTH) {
                                height = Math.round((height * MAX_WIDTH) / width);
                                width = MAX_WIDTH;
                            }

                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext("2d");
                            ctx.drawImage(img, 0, 0, width, height);

                            base64BannerImage = canvas.toDataURL("image/jpeg", 0.7);
                            if (preview) preview.src = base64BannerImage;
                        } catch (err) {
                            console.error("Canvas resize error:", err);
                        }
                    };
                    img.src = evt.target.result;
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
    .addEventListener("click", async () => {

        const bannerUploadInput = document.getElementById("bannerUpload");
        if (bannerUploadInput && bannerUploadInput.files && bannerUploadInput.files[0]) {
            try {
                base64BannerImage = await compressBannerFile(bannerUploadInput.files[0]);
            } catch (err) {
                console.error("Error compressing banner on continue:", err);
            }
        }

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

        // 3. Date check (not in past, end date >= start date)
        const todayStr = new Date().toISOString().split("T")[0];
        if (event_date < todayStr) {
            showErrorAlert("Invalid Date", "Event start date cannot be in the past.");
            return;
        }

        if (event_date_end < event_date) {
            showErrorAlert("Invalid Date Range", "Event end date cannot be before the start date.");
            return;
        }

        // 4. Operating Hours Time check (End time must be after Start time)
        if (start_time >= end_time) {
            showErrorAlert("Invalid Time Range", "Event end time must be strictly after the start time (e.g. Start: 09:00 AM, End: 05:00 PM).");
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