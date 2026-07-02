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
    const container = document.getElementById("toastContainer");
    if (!container) return;

    // Beautiful inline SVGs for notifications
    const svgs = {
        success: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        warning: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        error: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        info: `<svg class="toast-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    const notifSvgs = {
        success: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        warning: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        error: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        info: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
    };

    const toast = document.createElement("div");
    toast.className = `toast-card ${type}`;

    const svgIcon = svgs[type] || svgs.info;

    toast.innerHTML = `
        <span class="toast-icon">${svgIcon}</span>
        <div class="toast-content">
            <span class="toast-title">System Update</span>
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

    // Append to live notification list container
    const notifList = document.getElementById("notificationList");
    if (notifList) {
        // Remove empty state placeholder if present
        const emptyState = notifList.querySelector(".notification-empty");
        if (emptyState) {
            emptyState.remove();
        }

        // Prevent duplicate entries by checking if the message already exists in the feed
        const existingItems = notifList.querySelectorAll(".notification-item");
        for (const item of existingItems) {
            const itemText = item.querySelector(".notif-text")?.textContent?.trim();
            if (itemText === message.trim()) {
                item.remove(); // Remove the old instance
            }
        }

        const newItem = document.createElement("div");
        newItem.className = `notification-item new-notification ${type}`;

        const notifSvg = notifSvgs[type] || notifSvgs.info;

        newItem.innerHTML = `
            <span class="notif-badge ${type}">${notifSvg}</span>
            <span class="notif-text">${message}</span>
        `;
        notifList.insertBefore(newItem, notifList.firstChild);
    }
}

// ========================================
// DATABASE SYNCHRONIZATION & POLLING
// ========================================

const seenNotificationIds = new Set();

async function fetchNotifications(isInitialLoad = false) {
    if (!currentUsername || currentUsername === "Guest") {
        return;
    }

    try {
        const response = await fetch(`http://127.0.0.1:5000/notifications/${encodeURIComponent(currentUsername)}`);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const notifications = await response.json();
        const notifList = document.getElementById("notificationList");
        if (!notifList) return;

        const notifSvgs = {
            success: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
            warning: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
            error: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
            info: `<svg class="notif-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`
        };

        if (isInitialLoad) {
            // Clear the placeholder
            notifList.innerHTML = "";
            
            if (notifications.length === 0) {
                notifList.innerHTML = `
                    <div class="notification-empty" style="text-align: center; padding: 30px 20px; color: #9ca3af; font-weight: 600; font-size: 14.5px;">
                        No notifications yet.
                    </div>
                `;
                return;
            }

            // Populate the history (newest to oldest in DB, which is descending)
            notifications.forEach(notif => {
                seenNotificationIds.add(notif.id);
                
                const item = document.createElement("div");
                item.className = `notification-item ${notif.type}`;
                const svg = notifSvgs[notif.type] || notifSvgs.info;
                
                item.innerHTML = `
                    <span class="notif-badge ${notif.type}">${svg}</span>
                    <span class="notif-text">${notif.message}</span>
                `;
                notifList.appendChild(item);
            });
        } else {
            // For updates, process from oldest (last item in descending array) to newest (first item in descending array)
            for (let i = notifications.length - 1; i >= 0; i--) {
                const notif = notifications[i];
                if (!seenNotificationIds.has(notif.id)) {
                    seenNotificationIds.add(notif.id);
                    triggerNotification(notif.message, notif.type);
                }
            }
        }
    } catch (err) {
        console.error("Failed to sync notifications:", err);
    }
}

// Start database notifications polling loop
if (currentUsername && currentUsername !== "Guest") {
    // Initial fetch
    fetchNotifications(true);
    // Poll every 5 seconds
    setInterval(() => fetchNotifications(false), 5000);
}