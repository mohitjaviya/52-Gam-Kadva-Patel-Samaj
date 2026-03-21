// ===== Messages Page JavaScript =====

let currentPartnerId = null;
let refreshInterval = null;
let currentUserId = null;
let currentTab = 'conversations'; // 'conversations' or 'requests'
let cachedConversations = [];
let cachedRequests = [];
let currentPartnerIsRequest = false;

// Initialize messages page
document.addEventListener('DOMContentLoaded', async () => {
    // Get current user
    const user = await checkSession();
    if (user) {
        currentUserId = user.id;
    }

    // Load conversations
    await loadConversations();

    // Check if navigated with ?to=userId
    const params = new URLSearchParams(window.location.search);
    const toUserId = params.get('to');
    if (toUserId) {
        openConversation(parseInt(toUserId));
    }

    // Auto-refresh conversations every 10 seconds
    refreshInterval = setInterval(() => {
        loadConversations(true); // silent refresh
        if (currentPartnerId) {
            loadMessages(currentPartnerId, true); // silent refresh chat
        }
    }, 10000);
});

// Load conversations list
async function loadConversations(silent = false) {
    try {
        const response = await fetch('/api/messages/conversations', {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            cachedConversations = data.conversations || [];
            cachedRequests = data.requests || [];
            
            const reqBadge = document.getElementById('requestsCountBadge');
            if (reqBadge) {
                if (cachedRequests.length > 0) {
                    reqBadge.textContent = cachedRequests.length > 9 ? '9+' : cachedRequests.length;
                    reqBadge.style.display = 'inline-block';
                } else {
                    reqBadge.style.display = 'none';
                }
            }

            const list = document.getElementById('conversationsList');
            const empty = document.getElementById('conversationsEmpty');

            const currentData = currentTab === 'conversations' ? cachedConversations : cachedRequests;

            if (currentData.length === 0) {
                list.innerHTML = '';
                empty.style.display = 'flex';
                const searchBtn = empty.querySelector('a');
                if (currentTab === 'requests') {
                    empty.querySelector('p').textContent = 'No message requests';
                    empty.querySelector('span').textContent = 'You have no pending requests at the moment.';
                    if (searchBtn) searchBtn.style.display = 'none';
                } else {
                    empty.querySelector('p').textContent = 'No conversations yet';
                    empty.querySelector('span').textContent = 'Search the directory and send a message to start a conversation!';
                    if (searchBtn) searchBtn.style.display = 'inline-block';
                }
            } else {
                empty.style.display = 'none';
                renderConversations(currentData);
            }
        }
    } catch (error) {
        if (!silent) console.error('Error loading conversations:', error);
    }
}

// Switch between Messages and Requests tab
function switchMessageTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.message-tab').forEach(t => t.classList.remove('active'));
    
    if (tabName === 'conversations') {
        document.getElementById('tabConversations').classList.add('active');
    } else {
        document.getElementById('tabRequests').classList.add('active');
    }
    
    // trigger render
    loadConversations(true);
}

// Render conversations list
function renderConversations(conversations) {
    const list = document.getElementById('conversationsList');
    list.innerHTML = '';

    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = `conversation-item${conv.partner.id === currentPartnerId ? ' active' : ''}${conv.unreadCount > 0 ? ' unread' : ''}`;
        item.onclick = () => openConversation(conv.partner.id);

        const fullName = [conv.partner.first_name, conv.partner.middle_name, conv.partner.last_name]
            .filter(Boolean).join(' ');
        const initials = getInitials(conv.partner.first_name, conv.partner.last_name);
        const timeAgo = formatTimeAgo(conv.lastMessage.created_at);
        const isSentByMe = conv.lastMessage.sender_id === currentUserId;
        const previewText = conv.lastMessage.content;
        const displayUnread = conv.unreadCount > 4 ? '4+' : conv.unreadCount;

        item.innerHTML = `
            <div class="conv-avatar">
                <span>${escapeHtml(initials)}</span>
            </div>
            <div class="conv-info">
                <div class="conv-top">
                    <span class="conv-name">${escapeHtml(fullName)}</span>
                    <span class="conv-time">${timeAgo}</span>
                </div>
                <div class="conv-bottom">
                    <span class="conv-preview">${isSentByMe ? '<i class="fas fa-reply fa-flip-horizontal"></i> ' : ''}${escapeHtml(previewText)}</span>
                    ${conv.unreadCount > 0 ? `<span class="conv-unread-badge">${displayUnread}</span>` : ''}
                </div>
            </div>
        `;

        list.appendChild(item);
    });
}

// Open a conversation
async function openConversation(partnerId) {
    currentPartnerId = partnerId;

    // Show chat panel (mobile: hide conversations)
    document.getElementById('chatPlaceholder').style.display = 'none';
    document.getElementById('chatActive').style.display = 'flex';
    document.getElementById('conversationsPanel').classList.add('mobile-hidden');
    document.getElementById('chatPanel').classList.add('mobile-visible');

    // Mark messages as read
    try {
        await fetch(`/api/messages/read/${partnerId}`, {
            method: 'PUT',
            credentials: 'include'
        });
    } catch (e) { /* silent */ }

    // Load messages
    await loadMessages(partnerId);

    // Highlight active conversation
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });

    // Refresh conversation list to update unread badges
    loadConversations(true);

    // Focus input
    document.getElementById('messageInput').focus();
}

// Load messages for a conversation
async function loadMessages(partnerId, silent = false) {
    try {
        const response = await fetch(`/api/messages/conversation/${partnerId}`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            // Update chat header
            const partner = data.partner;
            const fullName = [partner.first_name, partner.middle_name, partner.last_name]
                .filter(Boolean).join(' ');
            const initials = getInitials(partner.first_name, partner.last_name);

            document.getElementById('chatUserName').textContent = fullName;
            document.getElementById('chatUserOccupation').textContent =
                capitalize(partner.occupation_type || '');
            document.getElementById('chatUserAvatar').innerHTML = `<span>${escapeHtml(initials)}</span>`;

            const userInfoWrapper = document.querySelector('.chat-user-info');
            if (userInfoWrapper) {
                userInfoWrapper.style.cursor = 'pointer';
                userInfoWrapper.title = 'View Profile';
                userInfoWrapper.onclick = () => window.location.href = '/search?view=' + partner.id;
            }

            // Check if this is a pending request pointing to current user
            const actionsUi = document.getElementById('chatRequestActions');
            const composeArea = document.getElementById('chatComposeArea');
            if (data.status === 'pending' && data.actionUserId === currentUserId) {
                currentPartnerIsRequest = true;
                if (actionsUi) actionsUi.style.display = 'block';
                if (composeArea) composeArea.style.display = 'none';
            } else {
                currentPartnerIsRequest = false;
                if (actionsUi) actionsUi.style.display = 'none';
                if (composeArea) composeArea.style.display = 'block';
            }

            // Render messages
            renderMessages(data.messages);
        }
    } catch (error) {
        if (!silent) console.error('Error loading messages:', error);
    }
}

// Render messages in the chat view
function renderMessages(messages) {
    const container = document.getElementById('chatMessages');
    const wasAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;

    container.innerHTML = '';

    if (messages.length === 0) {
        container.innerHTML = `
            <div class="chat-empty">
                <i class="fas fa-hand-wave"></i>
                <p>No messages yet — say hello!</p>
            </div>
        `;
        return;
    }

    let lastDate = null;

    messages.forEach(msg => {
        const msgDate = new Date(msg.created_at).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        // Insert date divider
        if (msgDate !== lastDate) {
            const divider = document.createElement('div');
            divider.className = 'chat-date-divider';
            divider.innerHTML = `<span>${msgDate}</span>`;
            container.appendChild(divider);
            lastDate = msgDate;
        }

        const bubble = document.createElement('div');
        const isMine = msg.sender_id === currentUserId;
        bubble.className = `message-bubble ${isMine ? 'message-sent' : 'message-received'}`;

        const time = new Date(msg.created_at).toLocaleTimeString('en-IN', {
            hour: '2-digit', minute: '2-digit'
        });

        bubble.innerHTML = `
            <div class="message-content">${escapeHtml(msg.content)}</div>
            <div class="message-meta">
                <span class="message-time">${time}</span>
                ${isMine ? `<span class="message-status">${msg.is_read ? '<i class="fas fa-check-double read"></i>' : '<i class="fas fa-check"></i>'}</span>` : ''}
            </div>
        `;

        container.appendChild(bubble);
    });

    // Scroll to bottom
    if (wasAtBottom || !container.dataset.initialized) {
        container.scrollTop = container.scrollHeight;
        container.dataset.initialized = 'true';
    }
}

// Send message
async function sendMessage(e) {
    e.preventDefault();

    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content || !currentPartnerId) return;

    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;

    try {
        const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                receiverId: currentPartnerId,
                content: content
            })
        });

        const data = await response.json();

        if (data.success) {
            input.value = '';
            input.style.height = 'auto';
            await loadMessages(currentPartnerId);
            loadConversations(true);
        } else {
            showNotification(data.message || 'Failed to send message', 'error');
        }
    } catch (error) {
        showNotification('Failed to send message. Please try again.', 'error');
    } finally {
        sendBtn.disabled = false;
    }
}

// Handle Enter key in message input (send on Enter, new line on Shift+Enter)
function handleMessageKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(e);
    }
}

// Show conversations panel (mobile back button)
function showConversations() {
    currentPartnerId = null;
    document.getElementById('conversationsPanel').classList.remove('mobile-hidden');
    document.getElementById('chatPanel').classList.remove('mobile-visible');
    document.getElementById('chatPlaceholder').style.display = 'flex';
    document.getElementById('chatActive').style.display = 'none';
}

// Handle allowing/denying message requests
async function handleMessageRequest(action) {
    if (!currentPartnerId) return;

    try {
        const response = await fetch(`/api/messages/request/${action}/${currentPartnerId}`, {
            method: 'POST',
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success) {
            showNotification(`Message request ${action}ed`);
            if (action === 'deny') {
                showConversations(); // Go back to list
            } else {
                await loadMessages(currentPartnerId); // Refresh to show composer
            }
            loadConversations(true); // Refresh lists
        } else {
            showNotification(data.message || 'Failed to update request', 'error');
        }
    } catch (error) {
        showNotification('Error processing request', 'error');
    }
}

// Auto-resize textarea
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('messageInput');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }
});

// Format time ago
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

// Cleanup on page leave
window.addEventListener('beforeunload', () => {
    if (refreshInterval) clearInterval(refreshInterval);
});
