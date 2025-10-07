// ===== Mobile UI Implementation =====
// Handles mobile-specific UI interactions and DOM manipulation

class MobileUI extends UnicornAICore {
    constructor() {
        super();
        this.init();
    }

    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.checkSystemStatus();
        await this.loadPersonas();
        await this.loadAvailableModels();
        this.loadChatHistory();
        this.renderSessionsList();
        this.applySettings();
        this.startStatusCheck();
    }

    setupElements() {
        // Mobile-specific elements
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.mobileOverlay = document.getElementById('mobileOverlay');
        
        // Sidebar elements (same as desktop but with mobile behavior)
        this.sidebar = document.getElementById('sidebar');
        this.personaSelector = document.getElementById('personaSelector');
        this.editPersonaBtn = document.getElementById('editPersonaBtn');
        this.deletePersonaBtn = document.getElementById('deletePersonaBtn');
        this.createPersonaBtn = document.getElementById('createPersonaBtn');
        this.newSessionBtn = document.getElementById('newSessionBtn');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.voiceModeBtn = document.getElementById('voiceModeBtn');
        this.memoryModeBtn = document.getElementById('memoryModeBtn');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.messageCountEl = document.getElementById('messageCount');
        this.avgResponseTimeEl = document.getElementById('avgResponseTime');
        this.systemStatus = document.getElementById('systemStatus');
        
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.chatForm = document.getElementById('chatForm');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.typingIndicator = document.getElementById('typingIndicator');
        
        // Header elements
        this.currentPersonaInfo = document.getElementById('currentPersonaInfo');
        
        // Modal elements (same as desktop)
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.resetSettingsBtn = document.getElementById('resetSettingsBtn');
        
        this.createPersonaModal = document.getElementById('createPersonaModal');
        this.closeCreatePersonaBtn = document.getElementById('closeCreatePersonaBtn');
        this.cancelCreatePersonaBtn = document.getElementById('cancelCreatePersonaBtn');
        this.createPersonaForm = document.getElementById('createPersonaForm');
    }

    setupEventListeners() {
        // Mobile menu
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.openSidebar());
        }
        if (this.mobileOverlay) {
            this.mobileOverlay.addEventListener('click', () => this.closeSidebar());
        }
        
        // Chat form
        this.chatForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
        
        // Mobile-friendly enter key (allows shift+enter for new line)
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.chatForm.dispatchEvent(new Event('submit'));
            }
        });
        
        // Persona selector
        this.personaSelector.addEventListener('change', (e) => {
            if (e.target.value) {
                this.switchPersona(e.target.value);
                this.closeSidebar(); // Auto-close sidebar on mobile after selection
            }
        });
        
        // Sidebar actions
        this.createPersonaBtn.addEventListener('click', () => {
            this.openCreatePersona();
            this.closeSidebar();
        });
        
        this.newSessionBtn.addEventListener('click', () => {
            const sessionId = this.createNewSession();
            this.switchToSession(sessionId);
            this.closeSidebar();
        });
        
        this.editPersonaBtn.addEventListener('click', () => {
            this.editCurrentPersona();
            this.closeSidebar();
        });
        
        this.deletePersonaBtn.addEventListener('click', () => {
            this.deleteCurrentPersona();
            this.closeSidebar();
        });
        
        this.clearChatBtn.addEventListener('click', () => {
            this.clearChat();
            this.closeSidebar();
        });
        
        this.voiceModeBtn.addEventListener('click', () => {
            this.toggleVoiceMode();
        });
        
        this.memoryModeBtn.addEventListener('click', () => {
            this.toggleMemoryMode();
        });
        
        this.settingsBtn.addEventListener('click', () => {
            this.openSettings();
            this.closeSidebar();
        });
        
        // Modal event listeners
        this.setupModalEventListeners();
        
        // Mobile-specific: Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (this.sidebar.classList.contains('active') && 
                !this.sidebar.contains(e.target) && 
                !this.mobileMenuBtn.contains(e.target)) {
                this.closeSidebar();
            }
        });
        
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustForOrientation();
            }, 100);
        });
        
        // Handle viewport changes (keyboard showing/hiding)
        window.addEventListener('resize', () => {
            this.adjustForKeyboard();
        });
    }

    setupModalEventListeners() {
        // Settings modal
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettingsFromModal());
        this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        
        // Create Persona modal
        this.closeCreatePersonaBtn.addEventListener('click', () => this.closeCreatePersona());
        this.cancelCreatePersonaBtn.addEventListener('click', () => this.closeCreatePersona());
        this.createPersonaForm.addEventListener('submit', (e) => this.handleCreatePersona(e));
    }

    // ===== Mobile-specific UI Methods =====
    openSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.add('active');
        }
        if (this.mobileOverlay) {
            this.mobileOverlay.classList.add('active');
        }
        // Prevent body scrolling when sidebar is open
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.remove('active');
        }
        if (this.mobileOverlay) {
            this.mobileOverlay.classList.remove('active');
        }
        // Restore body scrolling
        document.body.style.overflow = '';
    }

    renderMessages() {
        if (!this.chatMessages) return;
        
        this.chatMessages.innerHTML = '';
        
        this.messages.forEach(message => {
            const messageEl = this.createMessageElement(message);
            this.chatMessages.appendChild(messageEl);
        });
        
        // Scroll to bottom with mobile-friendly behavior
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 50);
    }

    createMessageElement(message) {
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${message.role}`;
        
        if (message.role === 'user') {
            messageEl.innerHTML = `
                <div class="message-content">
                    <div class="message-text">${this.formatMessageContent(message.content)}</div>
                    ${message.image ? `<img src="${message.image}" alt="User uploaded image" class="message-image">` : ''}
                    <div class="message-time">${this.formatTime(message.timestamp)}</div>
                </div>
                <div class="message-avatar">
                    <i class="fas fa-user"></i>
                </div>
            `;
        } else if (message.role === 'assistant') {
            const persona = message.persona || this.currentPersona;
            messageEl.innerHTML = `
                <div class="message-avatar">
                    <span class="persona-emoji">${persona?.name?.charAt(0) || '🤖'}</span>
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="persona-name">${persona?.name || 'Assistant'}</span>
                    </div>
                    <div class="message-text">${this.formatMessageContent(message.content)}</div>
                    ${message.image_url ? `<img src="${message.image_url}" alt="Generated image" class="message-image">` : ''}
                    <div class="message-actions">
                        <button class="message-action-btn" onclick="app.speakMessage('${message.content.replace(/'/g, "\\'")}')">
                            <i class="fas fa-volume-up"></i>
                        </button>
                        <button class="message-action-btn" onclick="app.copyMessage('${message.content.replace(/'/g, "\\'")}')">
                            <i class="fas fa-copy"></i>
                        </button>
                        <span class="message-time">${this.formatTime(message.timestamp)}</span>
                    </div>
                </div>
            `;
        } else if (message.role === 'system') {
            messageEl.innerHTML = `
                <div class="system-message">
                    <i class="fas fa-info-circle"></i>
                    ${message.content}
                </div>
            `;
        }
        
        return messageEl;
    }

    renderSessionsList() {
        const sessionsContainer = document.getElementById('sessionsList');
        if (!sessionsContainer) return;
        
        sessionsContainer.innerHTML = '';
        
        this.sessions.forEach(session => {
            const sessionEl = document.createElement('div');
            sessionEl.className = `session-item ${session.id === this.currentSessionId ? 'active' : ''}`;
            
            sessionEl.innerHTML = `
                <div class="session-info" onclick="app.switchToSession('${session.id}')">
                    <div class="session-name">${session.name}</div>
                    <div class="session-meta">
                        ${session.messageCount || 0} messages • ${this.formatDate(session.lastUpdated)}
                    </div>
                </div>
                <button class="session-delete" onclick="app.deleteSession('${session.id}')" title="Delete session">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            sessionsContainer.appendChild(sessionEl);
        });
    }

    updatePersonaSelector() {
        if (!this.personaSelector) return;
        
        this.personaSelector.innerHTML = '<option value="">Select a persona...</option>';
        
        this.personas.forEach(persona => {
            const option = document.createElement('option');
            option.value = persona.id;
            option.textContent = persona.name;
            option.selected = this.currentPersona?.id === persona.id;
            this.personaSelector.appendChild(option);
        });
        
        // Show/hide edit/delete buttons
        const hasPersona = !!this.currentPersona;
        this.editPersonaBtn.style.display = hasPersona ? 'block' : 'none';
        this.deletePersonaBtn.style.display = hasPersona ? 'block' : 'none';
    }

    updatePersonaDisplay() {
        // Mobile header shows simplified persona info
        const mobileTitle = document.querySelector('.mobile-title');
        if (mobileTitle && this.currentPersona) {
            mobileTitle.textContent = `🦄 ${this.currentPersona.name}`;
        }
        
        // Also update any persona info in the chat area
        if (this.currentPersonaInfo && this.currentPersona) {
            this.currentPersonaInfo.innerHTML = `
                <div class="current-persona">
                    <span class="persona-emoji">${this.currentPersona.name.charAt(0)}</span>
                    <div class="persona-details">
                        <div class="persona-name">${this.currentPersona.name}</div>
                        <div class="persona-description">${this.currentPersona.description}</div>
                    </div>
                </div>
            `;
        }
    }

    updateSystemStatus(isHealthy) {
        if (!this.systemStatus) return;
        
        this.systemStatus.className = `system-status ${isHealthy ? 'healthy' : 'error'}`;
        this.systemStatus.innerHTML = `
            <i class="fas fa-circle"></i>
            ${isHealthy ? 'Online' : 'Offline'}
        `;
    }

    updateStats() {
        if (this.messageCountEl) {
            this.messageCountEl.textContent = this.stats.messageCount;
        }
        
        if (this.avgResponseTimeEl && this.stats.responseTimes.length > 0) {
            const avgTime = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
            this.avgResponseTimeEl.textContent = `${(avgTime / 1000).toFixed(1)}s`;
        }
    }

    updateVoiceModeButton() {
        if (!this.voiceModeBtn) return;
        
        const icon = this.settings.voiceResponses ? 'fas fa-volume-up' : 'fas fa-volume-mute';
        const text = this.settings.voiceResponses ? 'Voice: On' : 'Voice: Off';
        
        this.voiceModeBtn.innerHTML = `<i class="${icon}"></i> ${text}`;
        this.voiceModeBtn.className = `action-btn ${this.settings.voiceResponses ? 'active' : ''}`;
    }

    updateMemoryModeButton() {
        if (!this.memoryModeBtn) return;
        
        const icon = this.memoryEnabled ? 'fas fa-brain' : 'fas fa-brain';
        const text = this.memoryEnabled ? 'Memory: On' : 'Memory: Off';
        
        this.memoryModeBtn.innerHTML = `<i class="${icon}"></i> ${text}`;
        this.memoryModeBtn.className = `action-btn ${this.memoryEnabled ? 'active' : ''}`;
    }

    showTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'block';
        }
    }

    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.style.display = 'none';
        }
    }

    // ===== Mobile-specific Event Handlers =====
    async handleSendMessage(e) {
        e.preventDefault();
        
        const content = this.messageInput.value.trim();
        if (!content) return;
        
        // Clear input
        this.messageInput.value = '';
        this.autoResizeTextarea();
        
        // Send message
        await this.sendMessage(content);
        
        // Scroll to bottom after sending
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    autoResizeTextarea() {
        if (!this.messageInput) return;
        
        // Reset height to auto to get the correct scrollHeight
        this.messageInput.style.height = 'auto';
        
        // Set height based on content, with mobile-friendly limits
        const maxHeight = 120; // Max height for mobile
        const newHeight = Math.min(this.messageInput.scrollHeight, maxHeight);
        
        this.messageInput.style.height = newHeight + 'px';
    }

    // ===== Mobile-specific Utility Methods =====
    adjustForOrientation() {
        // Handle orientation changes
        if (this.chatMessages) {
            setTimeout(() => {
                this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
            }, 200);
        }
    }

    adjustForKeyboard() {
        // Handle keyboard showing/hiding on mobile
        const viewport = window.visualViewport;
        if (viewport) {
            const keyboardHeight = window.innerHeight - viewport.height;
            if (keyboardHeight > 0) {
                // Keyboard is showing - scroll to bottom
                setTimeout(() => {
                    if (this.chatMessages) {
                        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
                    }
                }, 100);
            }
        }
    }

    // ===== Modal Methods (Mobile-optimized) =====
    openSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.add('active');
            this.populateSettingsModal();
        }
    }

    closeSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('active');
        }
    }

    openCreatePersona() {
        if (this.createPersonaModal) {
            this.createPersonaModal.classList.add('active');
            this.populateCreatePersonaModal();
        }
    }

    closeCreatePersona() {
        if (this.createPersonaModal) {
            this.createPersonaModal.classList.remove('active');
            this.editingPersonaId = null;
        }
    }

    // ===== Shared Utility Methods =====
    formatMessageContent(content) {
        return content.replace(/\\n/g, '<br>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    copyMessage(content) {
        navigator.clipboard.writeText(content).then(() => {
            this.addSystemMessage('📋 Copied to clipboard');
        });
    }

    editCurrentPersona() {
        if (!this.currentPersona) return;
        this.editingPersonaId = this.currentPersona.id;
        this.openCreatePersona();
    }

    deleteCurrentPersona() {
        if (!this.currentPersona) return;
        
        const personaName = this.currentPersona.name;
        if (confirm(`Delete "${personaName}"?`)) {
            this.deletePersona(this.currentPersona.id);
        }
    }

    applySettings() {
        this.updateVoiceModeButton();
        this.updateMemoryModeButton();
    }

    startStatusCheck() {
        // Check system status every 30 seconds
        setInterval(() => {
            this.checkSystemStatus();
        }, 30000);
    }

    populateSettingsModal() {
        if (!this.settingsModal) return;
        
        // Populate settings form with current values
        const themeSelect = this.settingsModal.querySelector('#themeSelect');
        if (themeSelect) {
            themeSelect.value = this.settings.theme || 'dark';
        }
        
        const soundEffectsCheck = this.settingsModal.querySelector('#soundEffectsCheck');
        if (soundEffectsCheck) {
            soundEffectsCheck.checked = this.settings.soundEffects || false;
        }
        
        const voiceResponsesCheck = this.settingsModal.querySelector('#voiceResponsesCheck');
        if (voiceResponsesCheck) {
            voiceResponsesCheck.checked = this.settings.voiceResponses || false;
        }
        
        const streamingModeCheck = this.settingsModal.querySelector('#streamingModeCheck');
        if (streamingModeCheck) {
            streamingModeCheck.checked = this.settings.streamingMode !== false;
        }
    }

    populateCreatePersonaModal() {
        if (!this.createPersonaModal) return;
        
        const form = this.createPersonaModal.querySelector('#createPersonaForm');
        if (!form) return;
        
        if (this.editingPersonaId && this.currentPersona) {
            // Editing existing persona
            const persona = this.currentPersona;
            
            const title = this.createPersonaModal.querySelector('.modal-title');
            if (title) title.textContent = 'Edit Persona';
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Update';
            
            // Populate form fields
            const fields = {
                'personaId': persona.id,
                'personaName': persona.name,
                'personaDescription': persona.description,
                'personaTraits': persona.personality_traits?.join(', ') || '',
                'personaSpeakingStyle': persona.speaking_style || '',
                'personaSystemPrompt': persona.system_prompt || ''
            };
            
            Object.entries(fields).forEach(([fieldId, value]) => {
                const field = form.querySelector(`#${fieldId}`);
                if (field) {
                    field.value = value;
                }
            });
            
            // Disable ID field when editing
            const idField = form.querySelector('#personaId');
            if (idField) {
                idField.disabled = true;
                idField.style.opacity = '0.6';
            }
            
        } else {
            // Creating new persona
            const title = this.createPersonaModal.querySelector('.modal-title');
            if (title) title.textContent = 'Create Persona';
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Create';
            
            form.reset();
            
            const idField = form.querySelector('#personaId');
            if (idField) {
                idField.disabled = false;
                idField.style.opacity = '1';
            }
        }
    }

    saveSettingsFromModal() {
        if (!this.settingsModal) return;
        
        // Get form values and update settings
        const themeSelect = this.settingsModal.querySelector('#themeSelect');
        if (themeSelect) {
            this.settings.theme = themeSelect.value;
        }
        
        const soundEffectsCheck = this.settingsModal.querySelector('#soundEffectsCheck');
        if (soundEffectsCheck) {
            this.settings.soundEffects = soundEffectsCheck.checked;
        }
        
        const voiceResponsesCheck = this.settingsModal.querySelector('#voiceResponsesCheck');
        if (voiceResponsesCheck) {
            this.settings.voiceResponses = voiceResponsesCheck.checked;
        }
        
        const streamingModeCheck = this.settingsModal.querySelector('#streamingModeCheck');
        if (streamingModeCheck) {
            this.settings.streamingMode = streamingModeCheck.checked;
        }
        
        // Save and apply settings
        this.saveSettings();
        this.applySettings();
        
        this.addSystemMessage('⚙️ Settings saved!');
        this.closeSettings();
    }

    resetSettings() {
        if (confirm('Reset settings?')) {
            this.settings = this.loadSettings();
            this.saveSettings();
            this.applySettings();
            this.closeSettings();
        }
    }

    async handleCreatePersona(e) {
        e.preventDefault();
        
        // Extract form data and create/update persona
        const formData = new FormData(e.target);
        const rawData = Object.fromEntries(formData);
        
        // Process the form data to match API expectations
        const personaData = {
            name: rawData.name,
            description: rawData.description,
            personality_traits: rawData.personality_traits.split(',').map(t => t.trim()).filter(t => t),
            speaking_style: rawData.speaking_style,
            system_prompt: rawData.system_prompt
        };
        
        // Only include ID for creation, not updates
        if (!this.editingPersonaId) {
            personaData.id = rawData.id;
        }
        
        let success;
        if (this.editingPersonaId) {
            success = await this.updatePersona(this.editingPersonaId, personaData);
        } else {
            success = await this.createPersona(personaData);
        }
        
        if (success) {
            this.closeCreatePersona();
            this.addSystemMessage(`✨ Persona ${this.editingPersonaId ? 'updated' : 'created'}!`);
        }
    }
}

// Initialize the mobile app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MobileUI();
});