// State management for chat memory
const chatHistory = [];
const currentUsername = localStorage.getItem("username") || "Guest";

// Configure marked.js options for tables and line breaks
if (typeof marked !== 'undefined') {
    marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: false,
        mangle: false
    });
}

// Bind enter key
document.getElementById("messageInput").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        sendMessage();
    }
});

async function sendMessage() {
    const input = document.getElementById("messageInput");
    const chatBox = document.getElementById("chatBox");
    const message = input.value.trim();

    if (message === "") {
        return;
    }

    // Display user message in chat UI
    chatBox.innerHTML += `
    <div class="message sent">
        <div class="message-header">
            You
        </div>
        <p>${escapeHtml(message)}</p>
    </div>
    `;

    // Clear input field
    input.value = "";

    // Add loading indicator
    chatBox.innerHTML += `
    <div class="message received loading">
        <div class="message-header">
            EventSync AI
        </div>
        <p>Thinking...</p>
    </div>
    `;

    // Scroll chat to bottom
    chatBox.scrollTop = chatBox.scrollHeight;

    // Track user's message in history
    chatHistory.push({
        role: "user",
        parts: [message]
    });

    try {
        const response = await fetch("http://127.0.0.1:5000/ai-chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: message,
                history: chatHistory,
                username: currentUsername
            })
        });

        const data = await response.json();

        // Remove loading indicator
        const loadingMsg = document.querySelector(".loading");
        if (loadingMsg) {
            loadingMsg.remove();
        }

        if (!data.success) {
            throw new Error(data.message);
        }

        // Track AI response in history
        chatHistory.push({
            role: "model",
            parts: [data.reply]
        });

        triggerNotification("EventSync AI has generated a response.", "info");

        // Parse markdown text using marked.js
        let parsedReply = "";
        if (typeof marked !== 'undefined') {
            parsedReply = marked.parse(data.reply);
        } else {
            // Fallback parsing if marked didn't load
            parsedReply = (data.reply || "")
                .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\* /g, "• ")
                .replace(/\n/g, "<br>");
        }

        // Display AI response
        chatBox.innerHTML += `
        <div class="message received">
            <div class="message-header">
                EventSync AI
            </div>
            <div class="message-content">${parsedReply}</div>
        </div>
        `;

        // Keep chat scrolled down
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (error) {
        console.error("AI chat communication error:", error);

        // Remove loading indicator on fail
        const loadingMsg = document.querySelector(".loading");
        if (loadingMsg) {
            loadingMsg.remove();
        }

        chatBox.innerHTML += `
        <div class="message received">
            <div class="message-header">
                EventSync AI
            </div>
            <div class="message-content">
                <p>Sorry, I am unable to connect or respond at the moment. Please try again later.</p>
            </div>
        </div>
        `;
        
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Simple HTML escaping helper for user messages
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// ========================================
// TOAST NOTIFICATION ENGINE
// ========================================

function triggerNotification(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    // Beautiful inline SVGs for notifications
    const svgs = {
        success: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        warning: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        error: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        info: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    const toast = document.createElement("div");
    toast.className = `toast-card ${type}`;

    const svgIcon = svgs[type] || svgs.info;

    toast.innerHTML = `
        <span class="toast-icon">${svgIcon}</span>
        <div class="toast-content">
            <span class="toast-title">EventSync Real-Time Alert</span>
            <p class="toast-message">${message}</p>
        </div>
        <button class="toast-close-btn" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Fade slide in
    setTimeout(() => {
        toast.classList.add("show");
    }, 50);

    // Slide out after 5s
    setTimeout(() => {
        toast.classList.remove("show");
        toast.classList.add("hide");
        setTimeout(() => {
            toast.remove();
        }, 450);
    }, 5000);
}

window.triggerNotification = triggerNotification;

let testToastIndex = 0;
window.triggerTestToast = function() {
    const samples = [
        { msg: "New participant registered for event 'Design Week'!", type: "success" },
        { msg: "Event 'Digital Technology' has been approved & published by Admin!", type: "success" },
        { msg: "New venue 'Sunway Square' is now approved and available for booking!", type: "info" },
        { msg: "Timeline agenda schedule updated for 'Design Week'.", type: "warning" },
        { msg: "New registration! A participant signed up for 'Digital Technology'.", type: "success" }
    ];
    const sample = samples[testToastIndex % samples.length];
    testToastIndex++;
    triggerNotification(sample.msg, sample.type);
};

// ========================================
// DATABASE SYNCHRONIZATION & POLLING
// ========================================

const seenNotificationIds = new Set();
let allNotificationsList = [];
let isNotificationsExpanded = false;

function renderNotificationFeed() {
    const notifList = document.getElementById("notificationList");
    if (!notifList) return;

    const containerCard = notifList.closest(".card");
    notifList.innerHTML = "";

    if (allNotificationsList.length === 0) {
        notifList.innerHTML = `
            <div class="notification-empty" style="text-align: center; padding: 30px 20px; color: #9ca3af; font-weight: 600; font-size: 14.5px;">
                No notifications yet.
            </div>
        `;
        if (containerCard) {
            const oldBtn = containerCard.querySelector(".toggle-notif-btn");
            if (oldBtn) oldBtn.remove();
        }
        return;
    }

    const notifSvgs = {
        success: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        warning: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        error: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        info: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    const LIMIT = 3;
    const itemsToDisplay = isNotificationsExpanded ? allNotificationsList : allNotificationsList.slice(0, LIMIT);

    itemsToDisplay.forEach(notif => {
        seenNotificationIds.add(notif.id);
        const item = document.createElement("div");
        item.className = `notification-item ${notif.type}`;
        const svg = notifSvgs[notif.type] || notifSvgs.info;
        
        item.innerHTML = `
            <span class="notif-badge ${notif.type}">${svg}</span>
            <span class="notif-text">${notif.message}</span>
        `;
        notifList.appendChild(item);
    });    if (containerCard) {
        let toggleBtn = containerCard.querySelector(".toggle-notif-btn");
        if (allNotificationsList.length > LIMIT) {
            if (!toggleBtn) {
                toggleBtn = document.createElement("button");
                toggleBtn.className = "toggle-notif-btn";
                toggleBtn.style.cssText = "width: 100%; margin-top: 15px; padding: 12px 18px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; font-weight: 700; font-size: 13.5px; color: #1e293b; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.03);";
                toggleBtn.onmouseover = function() { this.style.background = '#111827'; this.style.color = '#ffffff'; };
                toggleBtn.onmouseout = function() { this.style.background = '#f8fafc'; this.style.color = '#1e293b'; };
                containerCard.appendChild(toggleBtn);
            }

            if (isNotificationsExpanded) {
                toggleBtn.innerHTML = `<span>🔼 View Less</span>`;
                toggleBtn.onclick = () => {
                    isNotificationsExpanded = false;
                    renderNotificationFeed();
                };
            } else {
                const hiddenCount = allNotificationsList.length - LIMIT;
                toggleBtn.innerHTML = `<span>🔽 View More Notifications (${hiddenCount} more)</span>`;
                toggleBtn.onclick = () => {
                    isNotificationsExpanded = true;
                    renderNotificationFeed();
                };
            }
        } else if (toggleBtn) {
            toggleBtn.remove();
        }
    }
}

function sortItemsNewestFirst(list) {
    return list.sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (b.id || 0) - (a.id || 0);
    });
}

async function fetchNotifications(isInitialLoad = false) {
    if (!currentUsername || currentUsername === "Guest") {
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/notifications/${encodeURIComponent(currentUsername)}`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        let notifications = await response.json();
        
        if (isInitialLoad) {
            // Sort notifications descending by timestamp then ID to guarantee newest first
            sortItemsNewestFirst(notifications);
            // Mark ALL fetched notification IDs as seen on initial load
            notifications.forEach(n => seenNotificationIds.add(n.id));
            allNotificationsList = notifications;
            renderNotificationFeed();
        } else {
            // For live updates during polling, check for genuinely NEW notifications
            const newNotifs = notifications.filter(n => !seenNotificationIds.has(n.id));
            if (newNotifs.length > 0) {
                newNotifs.forEach(notif => {
                    seenNotificationIds.add(notif.id);
                    allNotificationsList.unshift(notif);
                    triggerNotification(notif.message, notif.type);
                });
                // Keep allNotificationsList strictly sorted descending by timestamp/ID
                sortItemsNewestFirst(allNotificationsList);
                renderNotificationFeed();
            }
        }
    } catch (err) {
        console.error("Failed to sync notifications:", err);
    }
}

// ========================================
// LATEST ANNOUNCEMENTS FEED (DYNAMIC & REAL-TIME)
// ========================================
const seenAnnouncementIds = new Set();
let isInitialAnnouncementLoad = true;

async function fetchGlobalAnnouncements() {
    const listContainer = document.getElementById("liveAnnouncementList");
    if (!listContainer) return;
    
    try {
        const response = await fetch("http://127.0.0.1:5000/admin/notifications");
        if (!response.ok) throw new Error("Announcements fetch failed");
        
        let notifications = await response.json();
        sortItemsNewestFirst(notifications);

        if (isInitialAnnouncementLoad) {
            notifications.forEach(n => seenAnnouncementIds.add(n.id));
            isInitialAnnouncementLoad = false;
        } else {
            // Trigger live toast popups for new announcements during background polling
            const newAnnouncements = notifications.filter(n => !seenAnnouncementIds.has(n.id));
            if (newAnnouncements.length > 0) {
                newAnnouncements.forEach(ann => {
                    seenAnnouncementIds.add(ann.id);
                    triggerNotification(ann.message, "info");
                });
            }
        }
        
        listContainer.innerHTML = "";
        
        // Take top 5 announcements
        const recentNotifs = notifications.slice(0, 5);
        
        if (recentNotifs.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 25px; color: #9ca3af; font-size: 13.5px; font-weight: 500;">
                    No announcements posted yet.
                </div>
            `;
            return;
        }
        
        recentNotifs.forEach(notif => {
            // Determine a clean icon based on message content
            let icon = "📢";
            if (notif.message.toLowerCase().includes("approved") || notif.message.toLowerCase().includes("accepted")) {
                icon = "✅";
            } else if (notif.message.toLowerCase().includes("rejected") || notif.message.toLowerCase().includes("failed")) {
                icon = "❌";
            } else if (notif.message.toLowerCase().includes("registered")) {
                icon = "👤";
            } else if (notif.message.toLowerCase().includes("venue")) {
                icon = "🏢";
            }
            
            listContainer.innerHTML += `
                <div class="announcement-item" style="display: flex; gap: 12px; align-items: flex-start; padding: 12px 14px; border-radius: 12px; background: rgba(255,255,255,0.45); border: 1px solid rgba(17,24,39,0.06); margin-bottom: 10px; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.01);">
                    <div class="announcement-badge" style="background: rgba(200, 169, 107, 0.12); color: #c8a96b; padding: 6px; border-radius: 8px; font-size: 14px; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex-shrink: 0;">
                        ${icon}
                    </div>
                    <div style="flex-grow: 1;">
                        <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.45; font-family: 'Inter', sans-serif;">${notif.message}</p>
                    </div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Failed to load announcements:", err);
    }
}

// ========================================
// TASK COORDINATION ENGINE (MULTI-EVENT & DYNAMIC)
// ========================================
let coordTasks = [];
let activeEventFilter = "ALL";

async function initCoordTasks() {
    const taskList = document.getElementById("coordTaskList");
    if (!taskList) return;

    const storageKey = `coord_tasks_${currentUsername}`;
    let savedTasks = [];
    const saved = localStorage.getItem(storageKey);
    if (saved) {
        try {
            savedTasks = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse saved coord tasks:", e);
        }
    }

    const completionMap = {};
    savedTasks.forEach(t => {
        if (t && t.text) completionMap[t.text] = t.completed || false;
    });

    let generatedTasks = [];
    const selectElem = document.getElementById("coordEventSelect");

    // Fetch user's actual created events from backend
    if (currentUsername && currentUsername !== "Guest") {
        try {
            const res = await fetch(`http://127.0.0.1:5000/my-events/${encodeURIComponent(currentUsername)}`);
            if (res.ok) {
                const userEvents = await res.json();
                if (Array.isArray(userEvents) && userEvents.length > 0) {
                    if (selectElem) {
                        selectElem.innerHTML = `<option value="ALL">All Events (${userEvents.length})</option>`;
                    }

                    userEvents.forEach(latestEvent => {
                        const title = latestEvent.title || "your event";
                        const eventId = latestEvent.id;
                        const venue = latestEvent.selected_venue || 'Selected Venue';
                        const attendees = latestEvent.attendees_registered || 0;
                        const capacity = latestEvent.required_capacity || 100;
                        const pct = Math.round((attendees / capacity) * 100);

                        if (selectElem) {
                            selectElem.innerHTML += `<option value="${eventId}">${title}</option>`;
                        }

                        // 1. Venue confirmation milestone
                        const vTask = `🏢 Venue Confirmation: ${venue} (${latestEvent.status || 'Pending'})`;
                        generatedTasks.push({
                            eventId: eventId,
                            text: vTask,
                            completed: completionMap[vTask] || (latestEvent.status === 'Approved' || latestEvent.status === 'Accepted')
                        });

                        // 2. Attendee Registration Tracker
                        const regTask = `👥 Attendee Progress: ${attendees} / ${capacity} registered (${pct}% capacity)`;
                        generatedTasks.push({
                            eventId: eventId,
                            text: regTask,
                            completed: completionMap[regTask] || (attendees >= capacity)
                        });

                        // 3. Layout & 3D Stage Setup
                        const hasLayout = latestEvent.layout && latestEvent.layout !== "[]" && latestEvent.layout !== "null";
                        const layoutTask = hasLayout ? `📐 Interactive Floor Plan & 3D Setup: Configured for "${title}"` : `📐 Floor Plan Layout: Pending 3D setup in Planner`;
                        generatedTasks.push({
                            eventId: eventId,
                            text: layoutTask,
                            completed: completionMap[layoutTask] || hasLayout
                        });

                        // 4. Timeline Schedule
                        const hasTimeline = latestEvent.timeline && latestEvent.timeline !== "[]" && latestEvent.timeline !== "null";
                        const timeTask = hasTimeline ? `⏱️ Event Timeline Schedule: Agenda sessions configured` : `⏱️ Event Timeline: Pending session schedule setup`;
                        generatedTasks.push({
                            eventId: eventId,
                            text: timeTask,
                            completed: completionMap[timeTask] || hasTimeline
                        });

                        // 5. Selected Equipment & Vendor Checklist
                        if (parseInt(latestEvent.catering_required) === 1) {
                            const txt = `🍽️ Catering Service: Requested for ${capacity} pax ("${title}")`;
                            generatedTasks.push({ eventId: eventId, text: txt, completed: completionMap[txt] || false });
                        }
                        if (parseInt(latestEvent.sound_system_required) === 1) {
                            const txt = `🔊 Audio Visual: Sound system & microphones requested`;
                            generatedTasks.push({ eventId: eventId, text: txt, completed: completionMap[txt] || false });
                        }
                        if (parseInt(latestEvent.parking_required) === 1) {
                            const txt = `🅿️ Parking Logistics: Reserved parking passes requested`;
                            generatedTasks.push({ eventId: eventId, text: txt, completed: completionMap[txt] || false });
                        }
                        if (parseInt(latestEvent.wifi_required) === 1) {
                            const txt = `📶 Network Access: High-speed Wi-Fi requested`;
                            generatedTasks.push({ eventId: eventId, text: txt, completed: completionMap[txt] || false });
                        }
                        if (parseInt(latestEvent.projector_required) === 1) {
                            const txt = `📽️ Presentation Setup: Projector & AV screens requested`;
                            generatedTasks.push({ eventId: eventId, text: txt, completed: completionMap[txt] || false });
                        }
                        if (parseInt(latestEvent.stage_setup_required) === 1) {
                            const txt = `🎭 Stage Setup: Stage backdrop & podium requested`;
                            generatedTasks.push({ eventId: eventId, text: txt, completed: completionMap[txt] || false });
                        }
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch user events for coordination tasks:", err);
        }
    }

    // Preserve custom user-added tasks
    const customUserTasks = savedTasks.filter(st => st && st.isCustom);

    if (generatedTasks.length > 0) {
        coordTasks = [...generatedTasks, ...customUserTasks];
    } else if (savedTasks.length > 0) {
        coordTasks = savedTasks;
    } else {
        coordTasks = [
            { text: "Create your first event in Create Event page", completed: false },
            { text: "Compare venue specs and price offerings", completed: false },
            { text: "Confirm catering and sound requirements with team", completed: false }
        ];
    }

    renderCoordTasks();
}

window.filterCoordTasksByEvent = function(selectedVal) {
    activeEventFilter = selectedVal;
    renderCoordTasks();
};

function renderCoordTasks() {
    const taskList = document.getElementById("coordTaskList");
    if (!taskList) return;

    taskList.innerHTML = "";

    const filteredTasks = coordTasks.filter(task => {
        if (activeEventFilter === "ALL" || !activeEventFilter) return true;
        if (task.isCustom) return true;
        return String(task.eventId) === String(activeEventFilter);
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 13px; font-weight: 500;">
                No coordination tasks for this filter. Add one below!
            </div>
        `;
    } else {
        // Calculate progress percentage
        const completedCount = filteredTasks.filter(t => t.completed).length;
        const totalCount = filteredTasks.length;
        const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

        // Render progress bar header
        taskList.innerHTML += `
            <div style="margin-bottom: 12px; padding: 10px 12px; background: rgba(200, 169, 107, 0.08); border: 1px solid rgba(200, 169, 107, 0.2); border-radius: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px; font-weight: 700; color: #1f2937;">
                    <span>Checklist Progress</span>
                    <span style="color: #c8a96b;">${completedCount} / ${totalCount} Done (${progressPct}%)</span>
                </div>
                <div style="width: 100%; height: 6px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${progressPct}%; height: 100%; background: linear-gradient(90deg, #c8a96b, #10b981); transition: width 0.4s ease;"></div>
                </div>
            </div>
        `;

        filteredTasks.forEach((task) => {
            const index = coordTasks.indexOf(task);
            taskList.innerHTML += `
            <div class="task-item-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-radius: 8px; background: rgba(255,255,255,0.4); margin-bottom: 8px; border: 1px solid rgba(17,24,39,0.05); transition: 0.3s; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
                <label class="task-label-wrapper" style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1; margin: 0; color: #374151; font-size: 13px; font-family: 'Inter', sans-serif; user-select: none;">
                    <input type="checkbox" class="task-coord-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskCoord(${index})" style="width: 15px; height: 15px; accent-color: #c8a96b; cursor: pointer;">
                    <span style="${task.completed ? 'text-decoration: line-through; opacity: 0.55;' : ''}">${task.text}</span>
                </label>
                <button onclick="deleteTaskCoord(${index})" style="background: transparent; border: none; color: #9ca3af; font-size: 18px; cursor: pointer; display: flex; align-items: center; padding: 2px 6px; transition: 0.2s; outline: none;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#9ca3af'">&times;</button>
            </div>
            `;
        });
    }

    // Save to local storage
    const storageKey = `coord_tasks_${currentUsername}`;
    localStorage.setItem(storageKey, JSON.stringify(coordTasks));
}

window.toggleTaskCoord = function(index) {
    if (coordTasks[index]) {
        coordTasks[index].completed = !coordTasks[index].completed;
        renderCoordTasks();
    }
};

window.deleteTaskCoord = function(index) {
    coordTasks.splice(index, 1);
    renderCoordTasks();
};

window.addUserTask = function() {
    const input = document.getElementById("newTaskInput");
    if (!input) return;
    const text = input.value.trim();
    if (text) {
        coordTasks.push({ text: text, completed: false, isCustom: true });
        input.value = "";
        renderCoordTasks();
    }
};

// Initialize dynamic coordination task manager AFTER all variables & functions are declared
initCoordTasks();

// Start database notifications polling loop AFTER all variables & functions are declared
if (currentUsername && currentUsername !== "Guest") {
    // Initial fetch
    fetchNotifications(true);
    fetchGlobalAnnouncements();
    // Poll every 5 seconds for notifications
    setInterval(() => fetchNotifications(false), 5000);
    // Poll every 10 seconds for announcements
    setInterval(fetchGlobalAnnouncements, 10000);

    // Auto welcome pop out toast on page load
    setTimeout(() => {
        triggerNotification(`Welcome back ${currentUsername}! Real-time activity sync active.`, "info");
    }, 1000);

    // Automatic 15-second activity pop out ticker (no clicking needed)
    let autoTickerIdx = 0;
    const tickerMessages = [
        { msg: "New participant registered for event 'Design Week'!", type: "success" },
        { msg: "Event 'Digital Technology' has been approved & published by Admin!", type: "success" },
        { msg: "New venue 'Sunway Square' is now approved and available for booking!", type: "info" }
    ];
    setInterval(() => {
        const item = tickerMessages[autoTickerIdx % tickerMessages.length];
        autoTickerIdx++;
        triggerNotification(item.msg, item.type);
    }, 15000);
}

// Bind enter key for task input
document.addEventListener("DOMContentLoaded", () => {
    const taskInput = document.getElementById("newTaskInput");
    if (taskInput) {
        taskInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                addUserTask();
            }
        });
    }
});