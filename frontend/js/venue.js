const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://127.0.0.1:5000' : '';

const urlParams = new URLSearchParams(window.location.search);
const isRecommendFlow = urlParams.get("recommend") === "true";

const eventData = isRecommendFlow ? JSON.parse(localStorage.getItem("eventDraft")) : null;
console.log("Event Draft (Recommendation Flow):", eventData);

// Dynamically update and show/hide the recommendation summary section
const recommendationSummary = document.querySelector(".recommendation-summary");
const summaryTitle = document.getElementById("summaryTitle");
const summaryTags = document.getElementById("summaryTags");

function renderSummaryTags() {
    if (!eventData || !summaryTags) return;
    
    if (summaryTitle) {
        summaryTitle.innerText = "Venue Requirements Checklist";
    }

    // Format budget
    let formattedBudget = "No Budget Limit";
    if (eventData.budget) {
        const bVal = parseFloat(eventData.budget);
        formattedBudget = isNaN(bVal) ? eventData.budget : `RM ${bVal.toLocaleString(undefined, {minimumFractionDigits: 0})}`;
    }

    let tagsHtml = `
        <span>📁 Category: ${eventData.category || "Corporate Event"}</span>
        <span class="interactive-tag" id="capacityTag" onclick="enableCapacityEdit(this)" style="position: relative; cursor: pointer;">
            👥 Capacity: <span id="capacityText">${eventData.required_capacity || "0"} Pax</span>
            <input type="number" id="capacityEditInput" style="display:none; width: 85px; border: 1px solid #c8a96b; border-radius: 6px; padding: 2px 6px; font-size: 14px; outline: none; background: white; color: #111827; font-weight: bold;" value="${eventData.required_capacity || 500}" step="50" min="10" max="10000">
        </span>
        <span>📍 Location: ${eventData.preferred_location || "Anywhere"}</span>
        <span class="interactive-tag" id="budgetTag" onclick="enableBudgetEdit(this)" style="position: relative; cursor: pointer;">
            💰 Budget: <span id="budgetText">${formattedBudget}</span>
            <input type="number" id="budgetEditInput" style="display:none; width: 90px; border: 1px solid #c8a96b; border-radius: 6px; padding: 2px 6px; font-size: 14px; outline: none; background: white; color: #111827; font-weight: bold;" value="${eventData.budget || 0}">
        </span>
    `;

    const amenities = [
        { key: "parking_required", label: "🚗 Parking" },
        { key: "wifi_required", label: "📶 WiFi" },
        { key: "projector_required", label: "📽️ Projector" },
        { key: "catering_required", label: "🍽️ Catering" },
        { key: "sound_system_required", label: "🔊 Sound System" },
        { key: "stage_setup_required", label: "🎭 Stage Setup" }
    ];

    amenities.forEach(amenity => {
        const isActive = eventData[amenity.key];
        tagsHtml += `
            <span class="interactive-tag ${isActive ? '' : 'inactive'}" onclick="toggleAmenity('${amenity.key}')">
                ${amenity.label} ${isActive ? 'Required' : '(Optional)'}
            </span>
        `;
    });

    summaryTags.innerHTML = tagsHtml;
}

// Global functions for interactive requirements
window.toggleAmenity = function(key) {
    if (!eventData) return;
    eventData[key] = !eventData[key];
    localStorage.setItem("eventDraft", JSON.stringify(eventData));
    renderSummaryTags();
    filterAndRenderVenues(true);
};

window.enableCapacityEdit = function(tagElement) {
    if (event && event.target.tagName === 'INPUT') return;

    const textSpan = document.getElementById("capacityText");
    const input = document.getElementById("capacityEditInput");
    if (!textSpan || !input) return;

    textSpan.style.display = "none";
    input.style.display = "inline-block";
    input.focus();
    input.select();

    input.onblur = function() {
        saveCapacity(input.value);
    };
    
    input.onkeypress = function(e) {
        if (e.key === "Enter") {
            saveCapacity(input.value);
        }
    };
};

function saveCapacity(value) {
    if (!eventData) return;
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
        eventData.required_capacity = parsed;
        eventData.participants = parsed;
        localStorage.setItem("eventDraft", JSON.stringify(eventData));

        const searchCapacity = document.getElementById("searchCapacity");
        if (searchCapacity) {
            if (parsed >= 1000) searchCapacity.value = "1000+";
            else if (parsed >= 500) searchCapacity.value = "500-1000";
            else searchCapacity.value = "100-500";
        }
    }
    renderSummaryTags();
    filterAndRenderVenues(true);
}

window.enableBudgetEdit = function(tagElement) {
    if (event && event.target.tagName === 'INPUT') return;

    const textSpan = document.getElementById("budgetText");
    const input = document.getElementById("budgetEditInput");
    if (!textSpan || !input) return;

    textSpan.style.display = "none";
    input.style.display = "inline-block";
    input.focus();
    input.select();

    input.onblur = function() {
        saveBudget(input.value);
    };
    
    input.onkeypress = function(e) {
        if (e.key === "Enter") {
            saveBudget(input.value);
        }
    };
};

function saveBudget(value) {
    if (!eventData) return;
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
        eventData.budget = parsed;
        localStorage.setItem("eventDraft", JSON.stringify(eventData));
    }
    renderSummaryTags();
    filterAndRenderVenues(true);
}

if (recommendationSummary) {
    const isParticipant = (localStorage.getItem("userRole") || localStorage.getItem("role")) === "Participant";
    if (eventData && !isParticipant) {
        recommendationSummary.style.display = "block";
        renderSummaryTags();
    } else {
        recommendationSummary.style.display = "none";
    }
}

// Global dataset state
let allApprovedVenues = [];
let currentPage = 1;
const itemsPerPage = 6;

function prepopulateSearchFilters() {
    // Check for direct query parameter from landing page quick search
    const queryParam = urlParams.get("query");
    if (queryParam) {
        const searchQueryInput = document.getElementById("searchQuery");
        if (searchQueryInput) {
            searchQueryInput.value = queryParam;
        }
    }

    if (!eventData) return;

    // Prepopulate Location dropdown
    const searchLocation = document.getElementById("searchLocation");
    if (searchLocation && eventData.preferred_location) {
        const locationVal = eventData.preferred_location.trim().toLowerCase();
        for (let option of searchLocation.options) {
            if (option.value.toLowerCase() === locationVal) {
                searchLocation.value = option.value;
                break;
            }
        }
    }

    // Prepopulate Venue Type dropdown
    const searchType = document.getElementById("searchType");
    if (searchType && eventData.venue_type) {
        const typeVal = eventData.venue_type.trim().toLowerCase();
        for (let option of searchType.options) {
            if (option.value.toLowerCase() === typeVal) {
                searchType.value = option.value;
                break;
            }
        }
    }

    // Prepopulate Capacity range dropdown
    const searchCapacity = document.getElementById("searchCapacity");
    if (searchCapacity && eventData.required_capacity) {
        const capacityVal = parseInt(eventData.required_capacity);
        if (!isNaN(capacityVal)) {
            if (capacityVal > 1000) {
                searchCapacity.value = "1000+";
            } else if (capacityVal > 500) {
                searchCapacity.value = "500-1000";
            } else {
                searchCapacity.value = "100-500";
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    prepopulateSearchFilters();
    loadApprovedVenues();
    updateComparisonBar();

    const searchBtn = document.getElementById("searchBtn");
    if (searchBtn) {
        searchBtn.addEventListener("click", () => filterAndRenderVenues(true));
    }

    // Also trigger filtering on pressing Enter inside the text query input
    const queryInput = document.getElementById("searchQuery");
    if (queryInput) {
        queryInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                filterAndRenderVenues(true);
            }
        });
    }
});

async function loadApprovedVenues() {
    const grid = document.getElementById("venuesGrid");
    if (!grid) return;

    try {
        const response = await fetch(`${API_BASE}/venues/approved`);
        allApprovedVenues = await response.json();
        
        // Initial render of all venues
        filterAndRenderVenues();
    } catch (error) {
        console.error("Error loading approved venues list:", error);
        grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444; font-weight: 600;">
            Unable to connect to the backend server.
        </div>`;
    }
}

function filterAndRenderVenues(resetPage = false) {
    if (resetPage) {
        currentPage = 1;
    }

    const grid = document.getElementById("venuesGrid");
    if (!grid) return;

    const paginationContainer = document.querySelector(".pagination");

    const isParticipant = (localStorage.getItem("userRole") || localStorage.getItem("role")) === "Participant";

    // 1. Gather Search Criteria Values
    const query = document.getElementById("searchQuery") ? document.getElementById("searchQuery").value.trim().toLowerCase() : "";
    const selectedType = document.getElementById("searchType") ? document.getElementById("searchType").value : "";
    const selectedCapacity = document.getElementById("searchCapacity") ? document.getElementById("searchCapacity").value : "";
    const selectedLocation = document.getElementById("searchLocation") ? document.getElementById("searchLocation").value : "";

    // Sync dropdown changes back to eventData and refresh tags
    if (eventData) {
        let draftChanged = false;
        if (selectedLocation && selectedLocation !== eventData.preferred_location) {
            eventData.preferred_location = selectedLocation;
            draftChanged = true;
        }
        if (selectedType && selectedType !== eventData.venue_type) {
            eventData.venue_type = selectedType;
            draftChanged = true;
        }
        if (draftChanged) {
            localStorage.setItem("eventDraft", JSON.stringify(eventData));
            renderSummaryTags();
        }
    }

    // 2. Perform Client-side Filtering
    let filteredList = allApprovedVenues.filter(venue => {
        // Text search match
        const matchesQuery = !query || 
            venue.name.toLowerCase().includes(query) || 
            venue.description.toLowerCase().includes(query) ||
            venue.location.toLowerCase().includes(query);

        // Venue Type match
        const matchesType = !selectedType || (venue.type && venue.type.toLowerCase() === selectedType.toLowerCase());

        // Location match
        const matchesLocation = !selectedLocation || venue.location.toLowerCase() === selectedLocation.toLowerCase();

        // Capacity range match with soft boundaries to allow close options
        let matchesCapacity = true;
        if (selectedCapacity === "100-500") {
            matchesCapacity = venue.capacity >= 100 && venue.capacity <= 700; // soft boundary to show 600 pax
        } else if (selectedCapacity === "500-1000") {
            matchesCapacity = venue.capacity >= 500 && venue.capacity <= 1200; // soft boundary to show 1200 pax
        } else if (selectedCapacity === "1000+") {
            matchesCapacity = venue.capacity > 1000;
        }

        return matchesQuery && matchesType && matchesLocation && matchesCapacity;
    });

    grid.innerHTML = "";

    if (filteredList.length === 0) {
        if (paginationContainer) {
            paginationContainer.innerHTML = "";
        }
        grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px; background: white; border-radius: 22px; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
            <h3 style="color: #111827; margin-bottom: 8px; font-size: 20px;">No Venues Found</h3>
            <p style="color: #6b7280;">No venues match your search criteria. Please adjust your filters or query and search again.</p>
        </div>`;
        return;
    }

    // 3. Process Recommendations & Match Scores
    let displayedVenues = [];
    if (eventData) {
        displayedVenues = filteredList.map(venue => {
            const isLocationMatch = venue.location.toLowerCase() === eventData.preferred_location.toLowerCase();
            const isCapacityMatch = venue.capacity >= parseInt(eventData.required_capacity);
            const isBudgetMatch = venue.price <= parseFloat(eventData.budget);
            const isTypeMatch = eventData.venue_type && venue.type.toLowerCase() === eventData.venue_type.toLowerCase();
            
            // Check special requirements
            let totalSpecialReqs = 0;
            let matchedSpecialReqs = 0;

            if (eventData.parking_required) {
                totalSpecialReqs++;
                if (venue.parking_available) matchedSpecialReqs++;
            }
            if (eventData.wifi_required) {
                totalSpecialReqs++;
                if (venue.wifi_available) matchedSpecialReqs++;
            }
            if (eventData.projector_required) {
                totalSpecialReqs++;
                if (venue.projector_available) matchedSpecialReqs++;
            }
            if (eventData.catering_required) {
                totalSpecialReqs++;
                if (venue.catering_available) matchedSpecialReqs++;
            }
            if (eventData.sound_system_required) {
                totalSpecialReqs++;
                if (venue.sound_system_available) matchedSpecialReqs++;
            }
            if (eventData.stage_setup_required) {
                totalSpecialReqs++;
                if (venue.stage_setup_available) matchedSpecialReqs++;
            }

            // Score matching percentage with proper weights
            let matchScore = 0;

            if (totalSpecialReqs > 0) {
                // Core criteria worth 20% each (total 80%)
                if (isLocationMatch) matchScore += 20;
                if (isCapacityMatch) matchScore += 20;
                if (isBudgetMatch) matchScore += 20;
                if (isTypeMatch) matchScore += 20;

                // Special criteria worth 20% in total, divided equally among checked options
                const specialMatchPercentage = (matchedSpecialReqs / totalSpecialReqs) * 20;
                matchScore += specialMatchPercentage;
            } else {
                // No special requirements selected: core criteria worth 25% each (total 100%)
                if (isLocationMatch) matchScore += 25;
                if (isCapacityMatch) matchScore += 25;
                if (isBudgetMatch) matchScore += 25;
                if (isTypeMatch) matchScore += 25;
            }

            // 1. Apply strict capacity constraint penalty:
            // Undersized venues (e.g. 120 pax for a 500 pax event) must be penalized.
            const reqCap = parseInt(eventData.required_capacity);
            if (!isNaN(reqCap) && reqCap > 0 && venue.capacity < reqCap) {
                const capacityRatio = venue.capacity / reqCap;
                if (capacityRatio < 0.5) {
                    matchScore = Math.min(matchScore, 35); // Cap at max 35% if under 50% capacity
                } else {
                    matchScore = Math.round(matchScore * capacityRatio);
                }
            }

            // 2. Apply strict budget constraint penalty:
            // Over-budget venues (e.g. RM 16,000/day for a RM 10,000 budget) must be penalized.
            const reqBudget = parseFloat(eventData.budget);
            if (!isNaN(reqBudget) && reqBudget > 0 && venue.price > reqBudget) {
                const budgetRatio = reqBudget / venue.price;
                if (budgetRatio < 0.7) {
                    matchScore = Math.min(matchScore, 40); // Cap at max 40% if >30% over budget
                } else {
                    matchScore = Math.round(matchScore * budgetRatio);
                }
            }

            matchScore = Math.round(matchScore);
            
            return {
                ...venue,
                matchScore: matchScore,
                isRecommended: isLocationMatch && isCapacityMatch && isTypeMatch && isBudgetMatch
            };
        });

        // Sort so best recommendations bubble up to the top
        displayedVenues.sort((a, b) => b.matchScore - a.matchScore);
    } else {
        // Direct search: compute matchScore based on selected filters
        displayedVenues = filteredList.map(venue => {
            let totalFilters = 0;
            let matchedFilters = 0;

            if (selectedLocation) {
                totalFilters++;
                if (venue.location.toLowerCase() === selectedLocation.toLowerCase()) {
                    matchedFilters++;
                }
            }

            if (selectedType) {
                totalFilters++;
                if (venue.type && venue.type.toLowerCase() === selectedType.toLowerCase()) {
                    matchedFilters++;
                }
            }

            if (selectedCapacity) {
                totalFilters++;
                if (selectedCapacity === "100-500") {
                    if (venue.capacity >= 100 && venue.capacity <= 500) {
                        matchedFilters++;
                    } else if (venue.capacity > 500 && venue.capacity <= 700) {
                        matchedFilters += 0.75; // 75% match
                    }
                } else if (selectedCapacity === "500-1000") {
                    if (venue.capacity >= 500 && venue.capacity <= 1000) {
                        matchedFilters++;
                    } else if (venue.capacity > 1000 && venue.capacity <= 1200) {
                        matchedFilters += 0.75; // 75% match
                    }
                } else if (selectedCapacity === "1000+") {
                    if (venue.capacity > 1000) {
                        matchedFilters++;
                    }
                }
            }

            let matchScore = undefined;
            if (totalFilters > 0) {
                matchScore = Math.round((matchedFilters / totalFilters) * 100);
            }

            return {
                ...venue,
                matchScore: matchScore
            };
        });

        // Sort by match score descending if calculated
        if (selectedLocation || selectedType || selectedCapacity) {
            displayedVenues.sort((a, b) => {
                const scoreA = a.matchScore !== undefined ? a.matchScore : 0;
                const scoreB = b.matchScore !== undefined ? b.matchScore : 0;
                return scoreB - scoreA;
            });
        }
    }

    // 4. Implement Pagination Slicing
    const totalItems = displayedVenues.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    // Guard against current page being out of bounds
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = displayedVenues.slice(startIndex, endIndex);
    const compareList = JSON.parse(localStorage.getItem("compareVenues") || "[]");

    // 5. Render HTML Cards
    pageItems.forEach(venue => {
        const isCompared = compareList.includes(venue.id);
        // Select placeholder image based on type
        let img = "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop";
        if (venue.type === "Indoor") {
            img = "https://images.unsplash.com/photo-1497366412874-3415097a27e7?q=80&w=1200&auto=format&fit=crop";
        } else if (venue.type === "Outdoor") {
            img = "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop";
        } else if (venue.type === "Hybrid") {
            img = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop";
        }

        // Setup badges
        let matchScoreHtml = "";
        let recommendedBadgeHtml = "";
        if (venue.matchScore !== undefined) {
            matchScoreHtml = `<span class="match-score">${venue.matchScore}% Match</span>`;
        }
        if (eventData) {
            if (venue.isRecommended) {
                recommendedBadgeHtml = `<div class="recommended-badge">Best Match</div>`;
            }
        } else {
            recommendedBadgeHtml = `<div class="recommended-badge" style="background: #111827;">Verified</div>`;
        }

        // Facilities summaries
        let facilities = [];
        if (venue.parking_available) facilities.push("Parking");
        if (venue.wifi_available) facilities.push("WiFi");
        if (venue.projector_available) facilities.push("Projector");
        if (venue.catering_available) facilities.push("Catering");
        let facilitiesStr = facilities.length > 0 ? facilities.join(", ") : "Standard Amenities";

        const selectBtnHtml = isParticipant ? '' : `<button class="selectVenueBtn" data-venue="${venue.name}">Select Venue</button>`;
        const priceHtml = isParticipant ? `<h3>&nbsp;</h3>` : `<h3>RM ${parseFloat(venue.price).toLocaleString(undefined, {minimumFractionDigits: 0})}/day</h3>`;

        grid.innerHTML += `
        <div class="venue-card">
            ${recommendedBadgeHtml}
            <img src="${img}" alt="${venue.name}">
            <div class="venue-content">
                <div class="venue-top">
                    <div>
                        <h2>${venue.name}</h2>
                        ${matchScoreHtml}
                    </div>
                    <span class="rating">★ 4.8</span>
                </div>
                <p>${venue.location}, Malaysia</p>
                <div class="venue-details">
                    <span>${venue.capacity} Pax</span>
                    <span>${venue.type}</span>
                    <span>Available</span>
                    <span style="font-size: 11px; max-width: 120px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${facilitiesStr}</span>
                </div>
                <div class="price-row">
                    ${priceHtml}
                    <div class="button-group">
                        <button class="compare-btn ${isCompared ? 'active-compare' : ''}" onclick="toggleCompare(${venue.id})">
                            ${isCompared ? '✓ Selected' : 'Compare'}
                        </button>
                        <button class="view-btn" onclick="viewVenueDetails(${venue.id})">
                            View Details
                        </button>
                        ${selectBtnHtml}
                    </div>
                </div>
            </div>
        </div>
        `;
    });

    // Rebind selection buttons
    document.querySelectorAll(".selectVenueBtn").forEach(button => {
        button.addEventListener("click", () => {
            if (!localStorage.getItem("eventDraft")) {
                alert("Please create an event draft first before selecting a venue.");
                window.location.href = "create-event.html";
                return;
            }

            const venueName = button.dataset.venue;
            console.log("Selected Venue:", venueName);

            localStorage.setItem("selectedVenue", venueName);
            window.location.href = "planner.html";
        });
    });

    // Render Dynamic Pagination Controls
    renderPaginationControls(totalPages);
}

function viewVenueDetails(venueId) {
    const venue = allApprovedVenues.find(v => v.id === venueId);
    if (!venue) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Venue details could not be found.",
                confirmButtonColor: "#c8a96b"
            });
        } else {
            alert("Venue details could not be found.");
        }
        return;
    }

    let img = "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop";
    if (venue.type === "Indoor") {
        img = "https://images.unsplash.com/photo-1497366412874-3415097a27e7?q=80&w=1200&auto=format&fit=crop";
    } else if (venue.type === "Outdoor") {
        img = "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop";
    } else if (venue.type === "Hybrid") {
        img = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop";
    }

    const isParticipant = (localStorage.getItem("userRole") || localStorage.getItem("role")) === "Participant";
    const priceText = isParticipant ? "" : `<p style="font-size: 20px; font-weight: 800; color: #c8a96b; margin-top: 10px; margin-bottom: 4px;">RM ${parseFloat(venue.price).toLocaleString(undefined, {minimumFractionDigits: 0})} / day</p>`;

    const facilities = [];
    if (venue.parking_available) facilities.push("🚗 Parking");
    if (venue.wifi_available) facilities.push("📶 WiFi");
    if (venue.projector_available) facilities.push("📽️ Projector");
    if (venue.catering_available) facilities.push("🍽️ Catering");
    if (venue.sound_system_available) facilities.push("🔊 Sound System");
    if (venue.stage_setup_available) facilities.push("🎭 Stage Setup");

    const facilitiesHtml = facilities.length > 0
        ? facilities.map(f => `<span style="background: rgba(200,169,107,0.12); color: #b08d4b; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-block; margin: 2px;">${f}</span>`).join(" ")
        : `<span style="color: #9ca3af; font-size: 13px;">Standard Amenities Included</span>`;

    const modalContent = `
        <div style="text-align: left; font-family: Arial, sans-serif;">
            <img src="${img}" alt="${venue.name}" style="width: 100%; height: 220px; object-fit: cover; border-radius: 16px; margin-bottom: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="background: #111827; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">${venue.type} Venue</span>
                <span style="color: #f59e0b; font-size: 15px; font-weight: 700;">★ 4.8 Rating</span>
            </div>
            <p style="color: #4b5563; font-size: 14px; margin-bottom: 6px;"><strong>📍 Location:</strong> ${venue.location}, Malaysia</p>
            <p style="color: #4b5563; font-size: 14px; margin-bottom: 6px;"><strong>👥 Capacity:</strong> ${venue.capacity} Pax</p>
            ${priceText}
            <div style="margin-top: 14px; margin-bottom: 14px;">
                <h4 style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 6px;">Venue Description</h4>
                <p style="color: #4b5563; font-size: 13px; line-height: 1.6;">${venue.description || "High-quality venue with comprehensive facilities suitable for corporate and social events."}</p>
            </div>
            <div style="margin-top: 12px;">
                <h4 style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">Available Amenities</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${facilitiesHtml}
                </div>
            </div>
        </div>
    `;

    Swal.fire({
        title: venue.name,
        html: modalContent,
        showCancelButton: true,
        showConfirmButton: !isParticipant,
        confirmButtonText: "Select Venue for Event",
        confirmButtonColor: "#c8a96b",
        cancelButtonText: "Close",
        cancelButtonColor: "#6b7280",
        width: 560
    }).then((result) => {
        if (result.isConfirmed) {
            if (!localStorage.getItem("eventDraft")) {
                alert("Please create an event draft first before selecting a venue.");
                window.location.href = "create-event.html";
                return;
            }
            localStorage.setItem("selectedVenue", venue.name);
            window.location.href = "planner.html";
        }
    });
}

function renderPaginationControls(totalPages) {
    const paginationContainer = document.querySelector(".pagination");
    if (!paginationContainer) return;

    paginationContainer.innerHTML = "";

    // If there is only 1 page, don't show pagination controls
    if (totalPages <= 1) {
        return;
    }

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        if (i === currentPage) {
            btn.classList.add("active-page");
        }
        btn.addEventListener("click", () => {
            currentPage = i;
            filterAndRenderVenues(false);
            
            // Smooth scroll back to search section/top
            const searchSection = document.querySelector(".search-section");
            if (searchSection) {
                searchSection.scrollIntoView({ behavior: "smooth" });
            }
        });
        paginationContainer.appendChild(btn);
    }
}

// COMPARISON HELPER FUNCTIONS
function toggleCompare(venueId) {
    let compareList = JSON.parse(localStorage.getItem("compareVenues") || "[]");
    
    const index = compareList.indexOf(venueId);
    if (index > -1) {
        compareList.splice(index, 1);
    } else {
        if (compareList.length >= 3) {
            alert("You can compare a maximum of 3 venues at a time.");
            return;
        }
        compareList.push(venueId);
    }
    
    localStorage.setItem("compareVenues", JSON.stringify(compareList));
    
    // Re-render current list to update buttons
    filterAndRenderVenues(false);
    
    // Update bottom drawer
    updateComparisonBar();
}

function updateComparisonBar() {
    const compareList = JSON.parse(localStorage.getItem("compareVenues") || "[]");
    let bar = document.querySelector(".comparison-bar");
    
    if (compareList.length === 0) {
        if (bar) {
            bar.classList.remove("show");
            setTimeout(() => {
                const currentList = JSON.parse(localStorage.getItem("compareVenues") || "[]");
                if (currentList.length === 0 && bar.parentNode) {
                    bar.remove();
                }
            }, 400);
        }
        return;
    }
    
    if (!bar) {
        bar = document.createElement("div");
        bar.className = "comparison-bar";
        document.body.appendChild(bar);
    }
    
    // Find matching venue details from global collection
    const selectedVenues = allApprovedVenues.filter(v => compareList.includes(v.id));
    
    const bubbleHtml = selectedVenues.map(venue => `
        <div class="comparison-item-bubble">
            <span>${venue.name}</span>
            <button onclick="toggleCompare(${venue.id})">&times;</button>
        </div>
    `).join("");
    
    bar.innerHTML = `
        <div class="comparison-venues-list">
            <span class="comparison-title">Compare Venues (${compareList.length}/3)</span>
            ${bubbleHtml}
        </div>
        <div class="comparison-actions">
            <button class="comparison-clear-btn" onclick="clearCompare()">Clear All</button>
            <button class="comparison-go-btn" onclick="window.location.href='compare.html'">Compare Now</button>
        </div>
    `;
    
    // Smooth transition show
    setTimeout(() => {
        bar.classList.add("show");
    }, 50);
}

function clearCompare() {
    localStorage.setItem("compareVenues", JSON.stringify([]));
    filterAndRenderVenues(false);
    updateComparisonBar();
}