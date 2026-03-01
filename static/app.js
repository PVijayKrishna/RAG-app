document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const urlInput = document.getElementById('url-input');
    const scrapeBtn = document.getElementById('scrape-btn');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const dropText = document.getElementById('drop-text');
    const sourcesList = document.getElementById('sources-list');

    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const clearSourcesBtn = document.getElementById('clear-sources-btn');

    let chatHistory = [];

    // Setup Textarea Auto-resize
    chatInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight < 200 ? this.scrollHeight : 200) + 'px';
        sendBtn.disabled = !this.value.trim();
    });

    // Chat Interface Functions
    function appendMessage(text, role, isHtml = false) {
        const msgWrapper = document.createElement('div');
        msgWrapper.className = `message ${role}`;

        const avatar = document.createElement('div');
        avatar.className = `avatar ${role}-avatar`;
        avatar.textContent = role === 'user' ? '👤' : '🤖';

        const bubble = document.createElement('div');
        bubble.className = `bubble ${role}-bubble`;

        // Basic Markdown formatting for bot
        let formattedText = text;
        if (role === 'bot' && !isHtml) {
            // Very simple pseudo-markdown parsing
            formattedText = text
                .replace(/\n\n/g, '<br><br>')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code>$1</code>');
            bubble.innerHTML = formattedText;
        } else if (isHtml) {
            bubble.innerHTML = text;
        } else {
            bubble.textContent = text;
        }

        msgWrapper.appendChild(avatar);
        msgWrapper.appendChild(bubble);
        chatMessages.appendChild(msgWrapper);
        scrollToBottom();
        return msgWrapper;
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function clearChat() {
        if (!confirm('Are you sure you want to clear the chat history?')) return;

        chatHistory = [];
        // Keep only the first welcome message
        const welcomeMsg = chatMessages.firstElementChild;
        chatMessages.innerHTML = '';
        if (welcomeMsg) {
            chatMessages.appendChild(welcomeMsg);
        }
    }

    clearChatBtn.addEventListener('click', clearChat);

    function showThinkingIndicator() {
        const msgWrapper = document.createElement('div');
        msgWrapper.className = 'message bot thinking-msg';
        msgWrapper.id = 'thinking-indicator';

        const avatar = document.createElement('div');
        avatar.className = 'avatar bot-avatar';
        avatar.textContent = '🤖';

        const bubble = document.createElement('div');
        bubble.className = 'bubble bot-bubble';
        bubble.innerHTML = `
            <div class="thinking-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;

        msgWrapper.appendChild(avatar);
        msgWrapper.appendChild(bubble);
        chatMessages.appendChild(msgWrapper);
        scrollToBottom();
    }

    function removeThinkingIndicator() {
        const indicator = document.getElementById('thinking-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async function handleSendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Reset Input
        chatInput.value = '';
        chatInput.style.height = 'auto';
        sendBtn.disabled = true;

        // Display user msg
        appendMessage(text, 'user');

        // Prepare Payload
        const payload = {
            message: text,
            history: chatHistory
        };

        // Add to history
        chatHistory.push({ role: 'user', content: text });

        showThinkingIndicator();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            removeThinkingIndicator();
            const data = await response.json();

            if (response.ok) {
                appendMessage(data.response, 'bot');
                chatHistory.push({ role: 'assistant', content: data.response });
            } else {
                appendMessage(`❌ **Error:** ${data.detail || 'Failed to get response'}`, 'bot', false);
            }
        } catch (error) {
            removeThinkingIndicator();
            appendMessage(`❌ **Connection Error:** ${error.message}`, 'bot', false);
        }
    }

    sendBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Sidebar Data Fetching
    async function loadSources() {
        try {
            const response = await fetch('/api/sources');
            if (response.ok) {
                const data = await response.json();
                sourcesList.innerHTML = '';
                if (data.sources.length === 0) {
                    sourcesList.innerHTML = '<li style="justify-content:center; color:#9ca3af;">No sources added yet</li>';
                    return;
                }
                data.sources.forEach(src => {
                    const li = document.createElement('li');
                    li.className = src.type === 'url' ? 'type-url' : '';
                    li.title = src.name;

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'source-name';
                    nameSpan.textContent = src.name;

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-btn';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.title = 'Remove source';
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        removeSource(src.id);
                    };

                    li.appendChild(nameSpan);
                    li.appendChild(removeBtn);
                    sourcesList.appendChild(li);
                });
            }
        } catch (e) {
            console.error('Failed to load sources', e);
        }
    }

    // Initial load
    loadSources();

    async function removeSource(id) {
        if (!confirm('Are you sure you want to remove this source?')) return;

        try {
            const response = await fetch(`/api/sources/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                loadSources();
            } else {
                alert('Error: ' + (data.detail || 'Failed to delete source'));
            }
        } catch (e) {
            console.error('Error deleting source:', e);
            alert('Error deleting source');
        }
    }

    async function clearAllSources() {
        if (!confirm('Are you sure you want to clear ALL sources? This cannot be undone.')) return;

        try {
            const response = await fetch('/api/sources', {
                method: 'DELETE'
            });
            const data = await response.json();

            if (response.ok) {
                loadSources();
            } else {
                alert('Error: ' + (data.detail || 'Failed to clear sources'));
            }
        } catch (e) {
            console.error('Error clearing sources:', e);
            alert('Error clearing sources');
        }
    }

    clearSourcesBtn.addEventListener('click', clearAllSources);

    // URL Scraper Functionality
    async function handleScrape() {
        const url = urlInput.value.trim();
        if (!url) return;

        scrapeBtn.disabled = true;
        scrapeBtn.textContent = '...';

        try {
            const response = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            const data = await response.json();

            if (response.ok) {
                urlInput.value = '';
                loadSources();
                alert('Success: ' + data.message);
            } else {
                alert('Error: ' + (data.detail || 'Failed to scrape URL'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            scrapeBtn.disabled = false;
            scrapeBtn.textContent = 'Add';
        }
    }

    scrapeBtn.addEventListener('click', handleScrape);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleScrape();
        }
    });

    // Drag and Drop File Upload Functionality
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    ['dragleave', 'dragend'].forEach(type => {
        dropZone.addEventListener(type, () => {
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            uploadFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) {
            uploadFile(fileInput.files[0]);
        }
    });

    async function uploadFile(file) {
        const allowedExtensions = ['.pdf', '.docx', '.csv', '.txt', '.md'];
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!allowedExtensions.includes(ext)) {
            alert('Unsupported file type. Allowed types: ' + allowedExtensions.join(', '));
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const originalHtml = dropText.innerHTML;
        dropText.innerHTML = `Uploading...<br><span>${file.name}</span>`;
        dropZone.style.pointerEvents = 'none';

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (response.ok) {
                loadSources();
                alert('Success: ' + data.message);
            } else {
                alert('Error: ' + (data.detail || 'Failed to upload file'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            dropText.innerHTML = originalHtml;
            dropZone.style.pointerEvents = 'auto';
            fileInput.value = ''; // Reset input
        }
    }

    // Database View Logic
    const viewDbBtn = document.getElementById('view-db-btn');
    const dbModal = document.getElementById('db-modal');
    const closeDbModal = document.getElementById('close-db-modal');
    const dbContentArea = document.getElementById('db-content-area');
    const dbCount = document.getElementById('db-count');

    async function loadDatabaseContents() {
        dbContentArea.innerHTML = '<p style="text-align: center; color: #a1a1aa; padding: 20px;">Fetching from Database...</p>';
        try {
            // Note: Update "my-super-secret-token" to whatever you put in .env for ADMIN_TOKEN
            const response = await fetch('/api/debug/chroma', {
                headers: {
                    'X-Admin-Token': 'my-super-secret-token'
                }
            });
            const data = await response.json();

            if (response.ok) {
                dbCount.textContent = data.total_documents;
                if (data.total_documents === 0) {
                    dbContentArea.innerHTML = '<p style="text-align: center; color: #a1a1aa; padding: 20px;">Database is currently empty.</p>';
                    return;
                }

                dbContentArea.innerHTML = '';
                for (let i = 0; i < data.total_documents; i++) {
                    const id = data.ids[i];
                    const metadata = data.metadatas[i];
                    const content = data.documents[i];

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'db-item';

                    itemDiv.innerHTML = `
                        <div class="db-item-header">
                            <span class="db-item-id">ID: ${id}</span>
                            <span class="db-item-source">Source: <span>${metadata && metadata.source ? metadata.source : 'Unknown'}</span></span>
                        </div>
                        <div class="db-item-content">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
                    `;
                    dbContentArea.appendChild(itemDiv);
                }
            } else {
                dbContentArea.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 20px;">Error: ${data.detail || 'Failed to fetch database'}</p>`;
            }
        } catch (error) {
            dbContentArea.innerHTML = `<p style="text-align: center; color: #ef4444; padding: 20px;">Connection Error: ${error.message}</p>`;
        }
    }

    if (viewDbBtn) {
        viewDbBtn.addEventListener('click', () => {
            dbModal.classList.add('show');
            loadDatabaseContents();
        });
    }

    if (closeDbModal) {
        closeDbModal.addEventListener('click', () => {
            dbModal.classList.remove('show');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === dbModal) {
            dbModal.classList.remove('show');
        }
    });
});
