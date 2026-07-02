// EventSync Landing Page Live Recommendations Logic

document.addEventListener("DOMContentLoaded", () => {
    let allApprovedVenues = [];

    // Setup input elements
    const previewEventType = document.getElementById("previewEventType");
    const previewCapacity = document.getElementById("previewCapacity");
    const previewLocation = document.getElementById("previewLocation");
    const previewVenueType = document.getElementById("previewVenueType");
    const previewGenerateBtn = document.getElementById("previewGenerateBtn");
    const resultsContainer = document.getElementById("previewResultsContainer");

    // Load live venues from backend database
    async function loadVenues() {
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #6b7280; font-size: 14px;">
                Loading live recommendations...
            </div>
        `;

        try {
            const response = await fetch("http://127.0.0.1:5000/venues/approved");
            allApprovedVenues = await response.json();
            
            // Render 3 random featured venues dynamically
            renderFeaturedVenues();
            
            // Show premium placeholder prompt until user triggers recommendations
            resultsContainer.innerHTML = `
                <div class="recommendation-placeholder" style="text-align: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 16px; border: 1px dashed rgba(17, 24, 39, 0.15); box-shadow: inset 0 2px 4px rgba(0,0,0,0.02); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px;">
                    <div style="font-size: 40px; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));">🎯</div>
                    <h3 style="color: #111827; font-size: 16px; font-weight: 600; margin-bottom: 6px; font-family: 'Outfit', sans-serif;">Ready to Find Your Venue?</h3>
                    <p style="color: #4b5563; font-size: 13px; max-width: 280px; line-height: 1.5; margin: 0; font-family: 'Inter', sans-serif;">Specify your event requirements above and click <strong>Generate Recommendation</strong> to discover matched venues.</p>
                </div>
            `;
        } catch (error) {
            console.error("Error loading approved venues for landing preview:", error);
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 30px; background: white; border-radius: 16px; border: 1px solid #fee2e2; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                    <h3 style="color: #ef4444; font-size: 16px; margin-bottom: 8px;">Database Offline</h3>
                    <p style="color: #6b7280; font-size: 13px; margin-bottom: 0;">Please ensure the backend server is running on http://127.0.0.1:5000 to fetch recommendations.</p>
                </div>
            `;
        }
    }

    // Matching logic
    function generateRecommendation() {
        if (!resultsContainer || allApprovedVenues.length === 0) return;

        const eventType = previewEventType.value;
        const selectedCapacityRange = previewCapacity.value;
        const selectedLocation = previewLocation.value;
        const venueType = previewVenueType.value;

        // Process venue list with matching score calculation
        const scoredVenues = allApprovedVenues.map(venue => {
            let score = 0;

            // 1. Location Match (25%)
            if (venue.location.toLowerCase() === selectedLocation.toLowerCase()) {
                score += 25;
            }

            // 2. Venue Type Match (25%)
            if (venue.type && venue.type.toLowerCase() === venueType.toLowerCase()) {
                score += 25;
            }

            // 3. Capacity Range Match (25%)
            let capacityScore = 0;
            if (selectedCapacityRange === "100-500") {
                if (venue.capacity >= 100 && venue.capacity <= 500) {
                    capacityScore = 25;
                } else if (venue.capacity > 500 && venue.capacity <= 1000) {
                    capacityScore = 15;
                } else if (venue.capacity < 100) {
                    capacityScore = 5;
                }
            } else if (selectedCapacityRange === "500-1000") {
                if (venue.capacity > 500 && venue.capacity <= 1000) {
                    capacityScore = 25;
                } else if (venue.capacity > 1000) {
                    capacityScore = 15;
                } else if (venue.capacity >= 300 && venue.capacity <= 500) {
                    capacityScore = 10;
                }
            } else if (selectedCapacityRange === "1000+") {
                if (venue.capacity > 1000) {
                    capacityScore = 25;
                } else if (venue.capacity >= 500 && venue.capacity <= 1000) {
                    capacityScore = 15;
                } else {
                    capacityScore = 5;
                }
            }
            score += capacityScore;

            // 4. Event Type Match (25%)
            let keywordMatch = false;
            const textToSearch = (venue.name + " " + venue.description).toLowerCase();
            
            let keywords = [];
            if (eventType === "Conference") {
                keywords = ["conference", "summit", "forum", "meeting", "business"];
            } else if (eventType === "Seminar") {
                keywords = ["seminar", "talk", "presentation", "classroom"];
            } else if (eventType === "Workshop") {
                keywords = ["workshop", "hands-on", "training", "studio", "lab"];
            } else if (eventType === "Networking") {
                keywords = ["networking", "mixer", "social", "lounge", "meetup"];
            } else if (eventType === "Corporate Dinner") {
                keywords = ["dinner", "gala", "ballroom", "banquet", "annual"];
            } else if (eventType === "Training") {
                keywords = ["training", "classroom", "education", "course", "seminar"];
            } else if (eventType === "Product Launch") {
                keywords = ["launch", "expo", "exhibition", "showcase", "press"];
            }

            for (let kw of keywords) {
                if (textToSearch.includes(kw)) {
                    keywordMatch = true;
                    break;
                }
            }

            if (keywordMatch) {
                score += 25;
            } else {
                // baseline compatibility score
                score += 10;
            }

            return {
                ...venue,
                matchScore: score
            };
        });

        // Sort by match score descending
        scoredVenues.sort((a, b) => b.matchScore - a.matchScore);

        // Render top recommended card
        const topVenue = scoredVenues[0];
        
        // Parse facilities
        let facilities = [];
        if (topVenue.parking_available) facilities.push("Parking");
        if (topVenue.wifi_available) facilities.push("WiFi");
        if (topVenue.projector_available) facilities.push("Projector");
        if (topVenue.catering_available) facilities.push("Catering");
        if (facilities.length === 0) facilities.push("Amenities");

        const facilitiesHtml = facilities.map(f => `<span>${f} Available</span>`).join("");

        const isLoggedIn = !!localStorage.getItem("username");
        const isParticipant = (localStorage.getItem("userRole") || localStorage.getItem("role")) === "Participant";
        
        const topPriceHtml = isParticipant ? `<h4>&nbsp;</h4>` : `<h4>RM ${parseFloat(topVenue.price).toLocaleString(undefined, {minimumFractionDigits: 0})}/day</h4>`;
        const actionButtonHtml = `<button onclick="window.location.href='${isLoggedIn ? 'venues.html' : 'login.html'}'">${isLoggedIn ? 'Go to Venues' : 'Compare Venue'}</button>`;

        // Build HTML
        let html = `
            <!-- Top Recommendation (Fully Visible) -->
            <div class="recommended-card" style="margin-bottom: 20px;">
                <div class="recommended-top">
                    <div>
                        <h3>${topVenue.name}</h3>
                        <p>${topVenue.location}, Malaysia</p>
                    </div>
                    <div class="match-score">
                        ${topVenue.matchScore}% Match
                    </div>
                </div>
                <div class="recommended-details">
                    <span>${topVenue.capacity} Capacity</span>
                    <span>${topVenue.type} Venue</span>
                    ${facilitiesHtml}
                </div>
                <div class="recommended-bottom">
                    ${topPriceHtml}
                    ${actionButtonHtml}
                </div>
            </div>
        `;

        // Render blurred cards if there are other candidates
        const nextVenues = scoredVenues.slice(1, 3);
        if (nextVenues.length > 0) {
            let blurredCardsHtml = "";
            nextVenues.forEach(venue => {
                const cardPriceHtml = isParticipant ? `<h4>&nbsp;</h4>` : `<h4>RM ${parseFloat(venue.price).toLocaleString(undefined, {minimumFractionDigits: 0})}/day</h4>`;
                const cardButtonHtml = `<button onclick="window.location.href='${isLoggedIn ? 'venues.html' : 'login.html'}'">${isLoggedIn ? 'Go to Venues' : 'Compare Venue'}</button>`;
                
                blurredCardsHtml += `
                    <div class="recommended-card ${isLoggedIn ? '' : 'blurred-card'}" style="margin-bottom: 10px;">
                        <div class="recommended-top">
                            <div>
                                <h3>${venue.name}</h3>
                                <p>${venue.location}, Malaysia</p>
                            </div>
                            <div class="match-score">
                                ${venue.matchScore}% Match
                            </div>
                        </div>
                        <div class="recommended-details">
                            <span>${venue.capacity} Capacity</span>
                            <span>${venue.type} Venue</span>
                        </div>
                        <div class="recommended-bottom">
                            ${cardPriceHtml}
                            ${cardButtonHtml}
                        </div>
                    </div>
                `;
            });

            if (isLoggedIn) {
                html += `
                    <div class="locked-venues-container">
                        ${blurredCardsHtml}
                    </div>
                `;
            } else {
                html += `
                    <!-- Blurred Other Candidates with Overlay -->
                    <div class="locked-venues-container">
                        ${blurredCardsHtml}
                        <div class="locked-overlay">
                            <div class="locked-message-box">
                                <h3>🔑 Login to Unlock More Venues</h3>
                                <p>We found ${scoredVenues.length - 1} other matching venues for your criteria. Sign in to view details, compare features, and check real-time availability.</p>
                                <button onclick="window.location.href='login.html'">Login to Unlock</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        resultsContainer.innerHTML = html;
    }

    // Render 3 random featured venues from the approved database list
    function renderFeaturedVenues() {
        const featuredGrid = document.getElementById("featuredVenuesGrid");
        if (!featuredGrid || allApprovedVenues.length === 0) return;

        // Shuffle and take top 3
        const shuffled = [...allApprovedVenues].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);

        featuredGrid.innerHTML = selected.map(venue => {
            // Select placeholder image based on type
            let img = "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200&auto=format&fit=crop";
            if (venue.type === "Indoor") {
                img = "https://images.unsplash.com/photo-1497366412874-3415097a27e7?q=80&w=1200&auto=format&fit=crop";
            } else if (venue.type === "Outdoor") {
                img = "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=1200&auto=format&fit=crop";
            } else if (venue.type === "Hybrid") {
                img = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=1200&auto=format&fit=crop";
            }

            return `
                <div class="event-card card-hover" onclick="window.location.href='login.html'" style="cursor: pointer;">
                    <img src="${img}" alt="${venue.name}">
                    <div class="event-content">
                        <h3>${venue.name}</h3>
                        <p>${venue.location}, Malaysia</p>
                        <span>${venue.capacity} Pax Capacity</span>
                    </div>
                </div>
            `;
        }).join("");
    }

    // Add click event listener to Generate button
    if (previewGenerateBtn) {
        previewGenerateBtn.addEventListener("click", generateRecommendation);
    }

    // Quick search bar redirection logic
    const landingSearchInput = document.getElementById("landingSearchInput");
    const landingSearchBtn = document.getElementById("landingSearchBtn");

    function executeLandingSearch() {
        if (!landingSearchInput) return;
        const query = landingSearchInput.value.trim();
        
        // Login gate check
        const isLoggedIn = localStorage.getItem("username");
        if (isLoggedIn) {
            if (query) {
                window.location.href = `venues.html?query=${encodeURIComponent(query)}`;
            } else {
                window.location.href = "venues.html";
            }
        } else {
            // Save search query so they can be redirected post-login
            localStorage.setItem("pendingSearchQuery", query);
            window.location.href = "login.html";
        }
    }

    if (landingSearchBtn) {
        landingSearchBtn.addEventListener("click", executeLandingSearch);
    }
    if (landingSearchInput) {
        landingSearchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                executeLandingSearch();
            }
        });
    }

    // Hero buttons redirection logic based on login status
    const heroFindVenuesBtn = document.getElementById("heroFindVenuesBtn");
    const heroStartPlanningBtn = document.getElementById("heroStartPlanningBtn");

    if (heroFindVenuesBtn) {
        heroFindVenuesBtn.addEventListener("click", () => {
            if (localStorage.getItem("username")) {
                window.location.href = "venues.html";
            } else {
                window.location.href = "login.html";
            }
        });
    }

    if (heroStartPlanningBtn) {
        heroStartPlanningBtn.addEventListener("click", () => {
            if (localStorage.getItem("username")) {
                window.location.href = "create-event.html";
            } else {
                window.location.href = "login.html";
            }
        });
    }

    // Dynamic Navbar Login/Logout toggle
    const navLogin = document.getElementById("navLogin");
    if (navLogin) {
        const username = localStorage.getItem("username");
        if (username) {
            navLogin.textContent = "Logout";
            navLogin.href = "#";
            navLogin.addEventListener("click", (e) => {
                e.preventDefault();
                // Clear session keys
                localStorage.removeItem("username");
                localStorage.removeItem("role");
                localStorage.removeItem("userRole");
                localStorage.removeItem("selectedVenue");
                localStorage.removeItem("eventDraft");
                localStorage.removeItem("eventTimeline");
                localStorage.removeItem("editEventId");
                localStorage.removeItem("compareVenues");
                // Reload to refresh the landing page state
                window.location.reload();
            });
        }
    }

    // Load venues initial database request
    loadVenues();
});
