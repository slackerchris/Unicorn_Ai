// ===== Desktop UI Implementation =====
// Handles desktop-specific UI interactions and DOM manipulation

class DesktopUI extends UnicornAICore {
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
        // Sidebar elements
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
        
        // Modal elements
        this.settingsModal = document.getElementById('settingsModal');
        this.closeSettingsBtn = document.getElementById('closeSettingsBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.resetSettingsBtn = document.getElementById('resetSettingsBtn');
        
        this.userProfileBtn = document.getElementById('userProfileBtn');
        this.userProfileModal = document.getElementById('userProfileModal');
        this.closeUserProfileBtn = document.getElementById('closeUserProfileBtn');
        this.saveUserProfileBtn = document.getElementById('saveUserProfileBtn');
        
        this.createPersonaModal = document.getElementById('createPersonaModal');
        this.closeCreatePersonaBtn = document.getElementById('closeCreatePersonaBtn');
        this.cancelCreatePersonaBtn = document.getElementById('cancelCreatePersonaBtn');
        this.createPersonaForm = document.getElementById('createPersonaForm');
        
        this.modelManagerBtn = document.getElementById('modelManagerBtn');
        this.modelManagerModal = document.getElementById('modelManagerModal');
        this.downloadModelBtn = document.getElementById('downloadModelBtn');
        this.modelNameInput = document.getElementById('modelNameInput');
        
        // Desktop-specific toggle
        this.sidebarToggle = document.getElementById('sidebarToggle');
    }

    setupEventListeners() {
        // Chat form
        this.chatForm.addEventListener('submit', (e) => this.handleSendMessage(e));
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
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
            }
        });
        
        // Sidebar actions
        this.createPersonaBtn.addEventListener('click', () => this.openCreatePersona());
        this.newSessionBtn.addEventListener('click', () => {
            const sessionId = this.createNewSession();
            this.switchToSession(sessionId);
        });
        this.editPersonaBtn.addEventListener('click', () => this.editCurrentPersona());
        this.deletePersonaBtn.addEventListener('click', () => this.deleteCurrentPersona());
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.voiceModeBtn.addEventListener('click', () => this.toggleVoiceMode());
        this.memoryModeBtn.addEventListener('click', () => this.toggleMemoryMode());
        this.userProfileBtn.addEventListener('click', () => this.openUserProfile());
        this.modelManagerBtn.addEventListener('click', () => this.openModelManager());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        
        // Desktop sidebar toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Modal event listeners
        this.setupModalEventListeners();
    }

    setupModalEventListeners() {
        // Settings modal
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettingsFromModal());
        this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        
        // User Profile modal
        this.closeUserProfileBtn.addEventListener('click', () => this.closeUserProfile());
        this.saveUserProfileBtn.addEventListener('click', () => this.saveUserProfile());
        
        // Create Persona modal
        this.closeCreatePersonaBtn.addEventListener('click', () => this.closeCreatePersona());
        this.cancelCreatePersonaBtn.addEventListener('click', () => this.closeCreatePersona());
        this.createPersonaForm.addEventListener('submit', (e) => this.handleCreatePersona(e));
        
        // Model Manager modal
        this.downloadModelBtn.addEventListener('click', () => this.downloadModel());
        this.modelManagerModal.querySelector('.close-modal').addEventListener('click', () => this.closeModelManager());
        this.modelManagerModal.addEventListener('click', (e) => {
            if (e.target === this.modelManagerModal) {
                this.closeModelManager();
            }
        });
    }

    // ===== Desktop-specific UI Methods =====
    renderMessages() {
        if (!this.chatMessages) return;
        
        this.chatMessages.innerHTML = '';
        
        this.messages.forEach(message => {
            const messageEl = this.createMessageElement(message);
            this.chatMessages.appendChild(messageEl);
        });
        
        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
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
        if (!this.currentPersonaInfo || !this.currentPersona) return;
        
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

    updateSystemStatus(isHealthy) {
        if (!this.systemStatus) return;
        
        this.systemStatus.className = `system-status ${isHealthy ? 'healthy' : 'error'}`;
        this.systemStatus.innerHTML = `
            <i class="fas fa-circle"></i>
            ${isHealthy ? 'System Online' : 'System Offline'}
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

    toggleSidebar() {
        if (this.sidebar) {
            this.sidebar.classList.toggle('collapsed');
        }
    }

    // ===== Event Handlers =====
    async handleSendMessage(e) {
        e.preventDefault();
        
        const content = this.messageInput.value.trim();
        if (!content) return;
        
        // Clear input
        this.messageInput.value = '';
        this.autoResizeTextarea();
        
        // Send message
        await this.sendMessage(content);
    }

    autoResizeTextarea() {
        if (!this.messageInput) return;
        
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
    }

    // ===== Modal Methods =====
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

    openModelManager() {
        if (this.modelManagerModal) {
            this.modelManagerModal.classList.add('active');
        }
    }

    closeModelManager() {
        if (this.modelManagerModal) {
            this.modelManagerModal.classList.remove('active');
        }
    }

    openUserProfile() {
        if (this.userProfileModal) {
            this.userProfileModal.classList.add('active');
        }
    }

    closeUserProfile() {
        if (this.userProfileModal) {
            this.userProfileModal.classList.remove('active');
        }
    }

    // ===== Utility Methods =====
    formatMessageContent(content) {
        return content.replace(/\\n/g, '<br>').replace(/\\*\\*(.*?)\\*\\*/g, '<strong>$1</strong>');
    }

    formatTime(timestamp) {
        return new Date(timestamp).toLocaleTimeString();
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    copyMessage(content) {
        navigator.clipboard.writeText(content).then(() => {
            this.addSystemMessage('Message copied to clipboard');
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
        if (confirm(`Are you sure you want to delete "${personaName}"? This cannot be undone.`)) {
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
            streamingModeCheck.checked = this.settings.streamingMode !== false; // Default to false
        }
    }

    populateCreatePersonaModal() {
        if (!this.createPersonaModal) return;
        
        const form = this.createPersonaModal.querySelector('#createPersonaForm');
        if (!form) return;
        
        if (this.editingPersonaId && this.currentPersona) {
            // Editing existing persona - populate with current data
            const persona = this.currentPersona;
            
            // Update modal title
            const title = this.createPersonaModal.querySelector('.modal-title');
            if (title) title.textContent = 'Edit Persona';
            
            // Update submit button
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Update Persona';
            
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
            // Creating new persona - clear form
            const title = this.createPersonaModal.querySelector('.modal-title');
            if (title) title.textContent = 'Create Persona';
            
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.textContent = 'Create Persona';
            
            // Clear all form fields
            form.reset();
            
            // Enable ID field
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
        
        // Save settings and apply them
        this.saveSettings();
        this.applySettings();
        
        // Show confirmation
        this.addSystemMessage('⚙️ Settings saved successfully!');
        
        this.closeSettings();
    }

    resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            this.settings = this.loadSettings();
            this.saveSettings();
            this.applySettings();
            this.closeSettings();
        }
    }

    saveUserProfile() {
        // Save user profile
        // Implementation depends on your user profile structure
        this.closeUserProfile();
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
            this.addSystemMessage(`✨ Persona ${this.editingPersonaId ? 'updated' : 'created'} successfully!`);
        }
    }

    async downloadModel() {
        // Model download implementation
        // This would be similar to the original implementation
    }
}

// Initialize the desktop app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DesktopUI();
});