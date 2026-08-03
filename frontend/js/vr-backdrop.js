// vr-backdrop.js

const API_BASE = "http://127.0.0.1:5000";
const editEventId = localStorage.getItem("editEventId");
const eventDraft = JSON.parse(localStorage.getItem("eventDraft") || "null");

let activeEvent = null;
let selectedBackdropId = null;
let placedElements = [];
let selectedElementIndex = null;
let currentBallroom = "eq_grand_ballroom.jpg";

// ALL AVAILABLE BACKDROPS
const backdropColors = ["beige", "white", "pink", "purple", "red"];
const backdropLetters = ["a", "b", "c", "d", "e"];
const allBackdrops = [];

backdropColors.forEach(color => {
    backdropLetters.forEach(letter => {
        const id = `${color}_${letter}`;
        allBackdrops.push({
            id: id,
            color: color,
            name: `${color.toUpperCase()} - Style ${letter.toUpperCase()}`,
            image: `images/backdrops/${color}_${letter}.png`
        });
    });
});

// Register custom backdrop/prop assets
const customProps = [
    {
        id: "custom_security_column",
        color: "custom",
        name: "Cloud Security Column",
        image: "images/backdrops/custom_security_column.png"
    },
    {
        id: "custom_belmont_stand",
        color: "custom",
        name: "Belmont Exhibition Stand",
        image: "images/backdrops/custom_belmont_stand.png"
    },
    {
        id: "custom_ligawa_stand",
        color: "custom",
        name: "Ligawa Poster Board",
        image: "images/backdrops/custom_ligawa_stand.png"
    },
    {
        id: "custom_dotank_stand",
        color: "custom",
        name: "Do Tank Cardboard Stand",
        image: "images/backdrops/custom_dotank_stand.png"
    },
    {
        id: "custom_like_frame",
        color: "custom",
        name: "Facebook Like Standee",
        image: "images/backdrops/custom_like_frame.png"
    }
];

allBackdrops.push(...customProps);

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Load Event Info
    await loadEventContext();

    // 2. Render Catalog
    renderCatalog("all");

    // 3. Setup Interactive Controllers
    setupControllers();

    // 4. Load existing setup (if exists)
    loadExistingSetup();
});

// Load event details to show title
async function loadEventContext() {
    const titleEl = document.getElementById("eventTitleDisplay");

    if (editEventId) {
        try {
            const response = await fetch(`${API_BASE}/event/${editEventId}`);
            activeEvent = await response.json();
            titleEl.innerText = `Event: "${activeEvent.title}" 3D Preview`;
        } catch (e) {
            console.error("Error loading event context:", e);
            titleEl.innerText = "3D Ballroom Visualizer";
        }
    } else if (eventDraft) {
        titleEl.innerText = `Draft Event: "${eventDraft.title || 'Untitled'}" 3D Preview`;
    } else {
        titleEl.innerText = "Ballroom Layout 3D Visualizer";
    }
}

// Generate catalog cards
function renderCatalog(filter) {
    const slider = document.getElementById("backdropSlider");
    slider.innerHTML = "";

    const filtered = filter === "all"
        ? allBackdrops
        : allBackdrops.filter(b => b.color === filter);

    filtered.forEach(item => {
        const card = document.createElement("div");
        card.className = "slider-card";
        if (selectedBackdropId === item.id) {
            card.classList.add("active");
        }
        card.onclick = () => selectBackdrop(item.id);

        const labelText = item.color === 'custom'
            ? item.name
            : `${item.color.toUpperCase()} ${item.id.split('_')[1].toUpperCase()}`;

        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <span>${labelText}</span>
        `;
        slider.appendChild(card);
    });
}

// Filter colors
window.filterCatalog = function (colorTheme) {
    // Toggle active chip
    const chips = document.querySelectorAll(".filter-chip");
    chips.forEach(chip => chip.classList.remove("active"));

    const clicked = Array.from(chips).find(c => c.innerText.toLowerCase().includes(colorTheme.toLowerCase()) || (colorTheme === 'all' && c.innerText.includes('All')));
    if (clicked) clicked.classList.add("active");

    renderCatalog(colorTheme);
};

// Select backdrop card from catalog -> Add as new element (replaces standard backdrop if already placed, otherwise appends)
function selectBackdrop(id) {
    const backdropInfo = allBackdrops.find(b => b.id === id);
    if (!backdropInfo) return;

    const isCustomProp = backdropInfo.color === "custom";

    if (!isCustomProp) {
        // Look for any existing standard backdrop (color != "custom") in placedElements
        const existingBackdropIndex = placedElements.findIndex(el => {
            const elInfo = allBackdrops.find(b => b.id === el.id);
            return elInfo && elInfo.color !== "custom";
        });

        if (existingBackdropIndex !== -1) {
            // Replace the standard backdrop in place
            placedElements[existingBackdropIndex].id = id;
            placedElements[existingBackdropIndex].name = backdropInfo.name;
            placedElements[existingBackdropIndex].width = 500;
            placedElements[existingBackdropIndex].height = 220;

            const div = document.getElementById(`placed_element_${existingBackdropIndex}`);
            if (div) {
                div.style.backgroundImage = `url('images/backdrops/${id}.png')`;
            }
            updateElementDOMStyles(existingBackdropIndex);
            selectElement(existingBackdropIndex);
            return;
        }
    }

    // Otherwise, append as a new dynamic prop element
    const newElement = {
        id: id,
        name: backdropInfo.name,
        width: id.includes("column") ? 150 : (id.includes("stand") ? 300 : 500),
        height: id.includes("column") ? 450 : (id.includes("stand") ? 300 : 220),
        scale: 1.0,
        opacity: 1.0,
        left: 200 + (placedElements.length * 20) % 200,
        top: 200 + (placedElements.length * 15) % 150
    };

    placedElements.push(newElement);
    selectedElementIndex = placedElements.length - 1;

    createDOMElementForProp(newElement, selectedElementIndex);
    updateActiveElementSelection();
}

// Create draggable DOM element on canvas
function createDOMElementForProp(element, index) {
    const canvas = document.getElementById("venueCanvas");
    if (!canvas) return;

    const div = document.createElement("div");
    div.className = "stage-backdrop";
    div.id = `placed_element_${index}`;
    div.style.backgroundImage = `url('images/backdrops/${element.id}.png')`;
    div.style.display = "block";

    // Select on click
    div.addEventListener("mousedown", (e) => {
        selectElement(index);
    });

    div.addEventListener("touchstart", (e) => {
        selectElement(index);
    }, { passive: true });

    // Attach dragging listeners
    bindDragToDOMElement(div, index);

    canvas.appendChild(div);
    updateElementDOMStyles(index);
}

// Apply object parameters to DOM styles
function updateElementDOMStyles(index) {
    const element = placedElements[index];
    const div = document.getElementById(`placed_element_${index}`);
    if (!element || !div) return;

    div.style.width = element.width + "px";
    div.style.height = element.height + "px";
    div.style.left = element.left + "px";
    div.style.top = element.top + "px";
    div.style.opacity = element.opacity;
    div.style.transform = `scale(${element.scale})`;
}

// Attach isolated drag handlers to element
function bindDragToDOMElement(div, index) {
    let elementIsDragging = false;
    let localStartX = 0;
    let localStartY = 0;
    let localInitialLeft = 0;
    let localInitialTop = 0;

    div.addEventListener("mousedown", startLocalDrag);
    div.addEventListener("touchstart", startLocalDrag, { passive: false });

    function startLocalDrag(e) {
        e.preventDefault();
        e.stopPropagation();

        selectElement(index);

        elementIsDragging = true;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        localStartX = clientX;
        localStartY = clientY;

        const el = placedElements[index];
        localInitialLeft = el.left;
        localInitialTop = el.top;

        document.addEventListener("mousemove", performLocalDrag);
        document.addEventListener("mouseup", stopLocalDrag);
        document.addEventListener("touchmove", performLocalDrag, { passive: false });
        document.addEventListener("touchend", stopLocalDrag);
    }

    function performLocalDrag(e) {
        if (!elementIsDragging) return;
        e.preventDefault();

        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);

        const dx = clientX - localStartX;
        const dy = clientY - localStartY;

        let newLeft = localInitialLeft + dx;
        let newTop = localInitialTop + dy;

        const canvas = document.getElementById("venueCanvas");
        const el = placedElements[index];
        const limitX = canvas.clientWidth - el.width;
        const limitY = canvas.clientHeight - el.height;

        newLeft = Math.max(-100, Math.min(newLeft, limitX + 100));
        newTop = Math.max(0, Math.min(newTop, limitY + 100));

        el.left = newLeft;
        el.top = newTop;
        updateElementDOMStyles(index);
    }

    function stopLocalDrag() {
        elementIsDragging = false;
        document.removeEventListener("mousemove", performLocalDrag);
        document.removeEventListener("mouseup", stopLocalDrag);
        document.removeEventListener("touchmove", performLocalDrag);
        document.removeEventListener("touchend", stopLocalDrag);
    }
}

// Select active element index
function selectElement(index) {
    selectedElementIndex = index;
    updateActiveElementSelection();
}

// // Sync highlight and update sidebar sliders to match selected prop
function updateActiveElementSelection() {
    const domElements = document.querySelectorAll(".stage-backdrop");
    domElements.forEach(div => div.classList.remove("selected"));

    // Sync active class on catalog cards
    const cards = document.querySelectorAll(".slider-card");
    cards.forEach(c => c.classList.remove("active"));

    if (selectedElementIndex !== null && placedElements[selectedElementIndex]) {
        const activeDiv = document.getElementById(`placed_element_${selectedElementIndex}`);
        if (activeDiv) {
            activeDiv.classList.add("selected");
        }

        const el = placedElements[selectedElementIndex];
        
        // Find and highlight active card in slider catalog
        const matchingCard = Array.from(cards).find(c => {
            const img = c.querySelector("img");
            return img && img.src.includes(`${el.id}.png`);
        });
        if (matchingCard) {
            matchingCard.classList.add("active");
        }

        document.getElementById("selectedPropControlGroup").style.display = "block";
        document.getElementById("selectedPropName").innerText = el.name || el.id;

        document.getElementById("widthSlider").value = el.width;
        document.getElementById("widthVal").innerText = el.width + "px";
        document.getElementById("heightSlider").value = el.height;
        document.getElementById("heightVal").innerText = el.height + "px";
        document.getElementById("scaleSlider").value = Math.floor(el.scale * 100);
        document.getElementById("scaleVal").innerText = el.scale.toFixed(1) + "x";
        document.getElementById("opacitySlider").value = Math.floor(el.opacity * 100);
        document.getElementById("opacityVal").innerText = Math.floor(el.opacity * 100) + "%";
    } else {
        document.getElementById("selectedPropControlGroup").style.display = "none";
    }
}

// Set up UI sliders controls
function setupControllers() {
    const widthSlider = document.getElementById("widthSlider");
    const heightSlider = document.getElementById("heightSlider");
    const scaleSlider = document.getElementById("scaleSlider");
    const opacitySlider = document.getElementById("opacitySlider");
    const guidelineToggle = document.getElementById("guidelineToggle");
    const canvas = document.getElementById("venueCanvas");

    widthSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        document.getElementById("widthVal").innerText = val + "px";
        updateSelectedElementProperty("width", val);
    });

    heightSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value);
        document.getElementById("heightVal").innerText = val + "px";
        updateSelectedElementProperty("height", val);
    });

    scaleSlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value) / 100;
        document.getElementById("scaleVal").innerText = val.toFixed(1) + "x";
        updateSelectedElementProperty("scale", val);
    });

    opacitySlider.addEventListener("input", (e) => {
        const val = parseFloat(e.target.value) / 100;
        document.getElementById("opacityVal").innerText = e.target.value + "%";
        updateSelectedElementProperty("opacity", val);
    });

    const ballroomSelect = document.getElementById("ballroomSelect");
    if (ballroomSelect) {
        ballroomSelect.addEventListener("change", (e) => {
            const val = e.target.value;
            currentBallroom = val;
            canvas.style.backgroundImage = `url('images/ballrooms/${val}')`;
        });
    }

    guidelineToggle.addEventListener("change", (e) => {
        document.getElementById("stageGuideline").style.display = e.target.checked ? "flex" : "none";
    });
}

function updateSelectedElementProperty(prop, value) {
    if (selectedElementIndex === null || !placedElements[selectedElementIndex]) return;
    placedElements[selectedElementIndex][prop] = value;
    updateElementDOMStyles(selectedElementIndex);
}

// Delete currently focused prop/backdrop
window.deleteSelectedProp = function () {
    console.log("deleteSelectedProp called. selectedElementIndex:", selectedElementIndex);
    if (selectedElementIndex === null || !placedElements[selectedElementIndex]) {
        console.warn("Delete aborted: no active selection.");
        return;
    }

    placedElements.splice(selectedElementIndex, 1);
    selectedElementIndex = null;

    rebuildAllDOMElements();
};

function rebuildAllDOMElements() {
    const canvas = document.getElementById("venueCanvas");
    if (!canvas) return;

    const existing = canvas.querySelectorAll(".stage-backdrop");
    existing.forEach(div => div.remove());

    placedElements.forEach((el, index) => {
        createDOMElementForProp(el, index);
    });

    updateActiveElementSelection();
}

// Load backdrop and custom props setups with backwards compatibility
function loadExistingSetup() {
    let saved = null;
    if (editEventId && activeEvent && activeEvent.backdrop_setup) {
        try {
            saved = JSON.parse(activeEvent.backdrop_setup);
        } catch (e) { }
    } else {
        const local = localStorage.getItem("eventBackdropSetup");
        if (local) {
            try {
                saved = JSON.parse(local);
            } catch (e) { }
        }
    }

    if (saved) {
        if (saved.id) {
            // Old single backdrop format migration
            currentBallroom = saved.ballroom || "eq_grand_ballroom.jpg";
            const backdropInfo = allBackdrops.find(b => b.id === saved.id);
            placedElements = [{
                id: saved.id,
                name: backdropInfo ? backdropInfo.name : saved.id,
                width: saved.width,
                height: saved.height,
                scale: saved.scale,
                opacity: saved.opacity,
                left: saved.left,
                top: saved.top
            }];
        } else {
            // New multi-prop format
            currentBallroom = saved.ballroom || "eq_grand_ballroom.jpg";
            placedElements = saved.elements || [];
        }

        const ballroomSelect = document.getElementById("ballroomSelect");
        if (ballroomSelect) {
            ballroomSelect.value = currentBallroom;
        }
        document.getElementById("venueCanvas").style.backgroundImage = `url('images/ballrooms/${currentBallroom}')`;

        rebuildAllDOMElements();
        if (placedElements.length > 0) {
            selectElement(0);
        }
    } else {
        currentBallroom = "eq_grand_ballroom.jpg";
        document.getElementById("venueCanvas").style.backgroundImage = `url('images/ballrooms/eq_grand_ballroom.jpg')`;
    }
}

// Redirect back to designer
window.backToPlanner = function () {
    window.location.href = "planner.html";
};

// Save visualizer stage layout elements
window.saveBackdropSetup = async function () {
    if (placedElements.length === 0) {
        Swal.fire({
            icon: "warning",
            title: "No Elements Placed",
            text: "Please select at least one backdrop or prop from the catalog before saving.",
            confirmButtonColor: "#c8a96b"
        });
        return;
    }

    const backdropSetupObject = {
        ballroom: currentBallroom,
        elements: placedElements
    };

    localStorage.setItem("eventBackdropSetup", JSON.stringify(backdropSetupObject));

    if (editEventId) {
        try {
            const response = await fetch(`${API_BASE}/event/${editEventId}`);
            const eventDetails = await response.json();

            const payload = {
                ...eventDetails,
                backdrop_setup: JSON.stringify(backdropSetupObject)
            };

            const saveRes = await fetch(`${API_BASE}/update-event/${editEventId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await saveRes.json();
            if (result.success) {
                Swal.fire({
                    icon: "success",
                    title: "Design Saved 🎉",
                    text: "Your 3D layout visualizer designs have been saved successfully.",
                    confirmButtonText: "Return to My Events",
                    confirmButtonColor: "#c8a96b"
                }).then(() => {
                    window.location.href = "my-events.html";
                });
            } else {
                throw new Error(result.message);
            }
        } catch (e) {
            console.error("Save failed:", e);
            Swal.fire({
                icon: "error",
                title: "Save Failed",
                text: "Unable to save backdrop setup. Please try again.",
                confirmButtonColor: "#d9534f"
            });
        }
    } else {
        Swal.fire({
            icon: "success",
            title: "Design Saved (Draft) 💾",
            text: "Backdrop setup saved to your event draft! Please click 'Save Event' in the planner page to commit all event settings.",
            confirmButtonText: "Return to Planner",
            confirmButtonColor: "#c8a96b"
        }).then(() => {
            window.location.href = "planner.html";
        });
    }
};

// KEYBOARD SHORTCUTS FOR DELETION (DELETE / BACKSPACE)
document.addEventListener("keydown", (e) => {
    // If typing in any input field or editable area, ignore keybinds
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
        return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementIndex !== null) {
            e.preventDefault();
            console.log(`Keyboard shortcut '${e.key}' triggered deletion of index:`, selectedElementIndex);
            window.deleteSelectedProp();
        }
    }
});
