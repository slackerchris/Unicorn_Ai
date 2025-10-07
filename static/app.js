// ===== Unicorn AI Web App =====
// Phase 6: Web UI Implementation

class UnicornAI {
    constructor() {
        // Use current host instead of hardcoded localhost
        this.apiBase = window.location.origin;
        this.currentPersona = null;
        this.personas = [];
        this.messages = [];
        this.settings = this.loadSettings();
        this.stats = {
            messageCount: 0,
            responseTimes: []
        };
        this.sessions = this.loadSessions();  // Load all saved sessions
        this.currentSessionId = this.getCurrentSessionId();  // Get current or create new
        this.sessionId = this.currentSessionId;  // Unique session ID for memory
        this.memoryEnabled = true;  // Memory on by default
        this.currentAudio = null;  // Track currently playing audio
        
        this.init();
    }
    
    // ===== Session Management =====
    loadSessions() {
        try {
            const sessionsData = localStorage.getItem('unicornAI_sessions');
            return sessionsData ? JSON.parse(sessionsData) : [];
        } catch (error) {
            console.error('Error loading sessions:', error);
            return [];
        }
    }

    saveSessions() {
        try {
            localStorage.setItem('unicornAI_sessions', JSON.stringify(this.sessions));
        } catch (error) {
            console.error('Error saving sessions:', error);
        }
    }

    getCurrentSessionId() {
        const currentId = localStorage.getItem('unicornAI_currentSession');
        if (currentId && this.sessions.find(s => s.id === currentId)) {
            return currentId;
        }
        // Create default session if none exists
        return this.createNewSession();
    }

    createNewSession() {
        console.log('createNewSession() called');
        console.log('Current sessions:', this.sessions);
        const sessionId = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const session = {
            id: sessionId,
            name: `Chat ${this.sessions.length + 1}`,
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            messageCount: 0,
            personaId: this.currentPersona?.id || 'luna'  // Save current persona
        };
        this.sessions.push(session);
        console.log('New session created:', session);
        this.saveSessions();
        localStorage.setItem('unicornAI_currentSession', sessionId);
        console.log('Sessions after create:', this.sessions);
        return sessionId;
    }

    switchToSession(sessionId) {
        console.log('switchToSession() called with:', sessionId);
        // Save current chat before switching
        if (this.currentSessionId) {
            console.log('Saving current session:', this.currentSessionId);
            // Update current session's persona before saving
            const currentSession = this.sessions.find(s => s.id === this.currentSessionId);
            if (currentSession) {
                currentSession.personaId = this.currentPersona?.id;
                this.saveSessions();
            }
            this.saveChatHistory();
        }
        
        // Switch to new session
        this.currentSessionId = sessionId;
        this.sessionId = sessionId;
        localStorage.setItem('unicornAI_currentSession', sessionId);
        console.log('Switched to session:', sessionId);
        
        // Load session's persona
        const session = this.sessions.find(s => s.id === sessionId);
        if (session && session.personaId) {
            console.log('Restoring persona:', session.personaId);
            const persona = this.personas.find(p => p.id === session.personaId);
            if (persona) {
                this.currentPersona = persona;
                this.personaSelector.value = session.personaId;
            }
        }
        
        // Load new session's chat history
        this.messages = [];
        this.chatMessages.innerHTML = '';
        console.log('Cleared messages, loading history...');
        this.loadChatHistory();
        
        // Update UI
        console.log('Rendering sessions list...');
        this.renderSessionsList();
        console.log('Updating header...');
        const sessionNameEl = document.getElementById('currentSessionName');
        if (sessionNameEl && session) {
            sessionNameEl.textContent = session.name;
        }
        console.log('Adding system message...');
        this.addSystemMessage(`Switched to ${session?.name || 'session'}`);
        console.log('switchToSession() complete');
    }

    deleteSession(sessionId) {
        if (this.sessions.length === 1) {
            alert('Cannot delete the last session!');
            return;
        }
        
        if (!confirm('Delete this chat session? This cannot be undone.')) {
            return;
        }
        
        // Remove session
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        this.saveSessions();
        
        // Clear localStorage for this session
        localStorage.removeItem(`unicornAI_chatHistory_${sessionId}`);
        
        // If we deleted the current session, switch to first available
        if (sessionId === this.currentSessionId) {
            this.switchToSession(this.sessions[0].id);
        } else {
            this.renderSessionsList();
        }
    }

    renameSession(sessionId, newName) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            session.name = newName;
            session.lastUpdated = new Date().toISOString();
            this.saveSessions();
            this.renderSessionsList();
        }
    }

    renderSessionsList() {
        const sessionsList = document.getElementById('sessionsList');
        if (!sessionsList) return;
        
        sessionsList.innerHTML = this.sessions.map(session => {
            const isActive = session.id === this.currentSessionId;
            const date = new Date(session.lastUpdated);
            const timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            return `
                <div class="session-item ${isActive ? 'active' : ''}" data-session-id="${session.id}">
                    <div class="session-info">
                        <div class="session-name">${session.name}</div>
                        <div class="session-meta">${session.messageCount || 0} msgs • ${timeStr}</div>
                    </div>
                    <button class="session-delete" data-delete-session="${session.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        // Attach event listeners to session items
        sessionsList.querySelectorAll('.session-item').forEach(item => {
            const sessionId = item.getAttribute('data-session-id');
            item.addEventListener('click', (e) => {
                // Don't switch if clicking delete button
                if (e.target.closest('.session-delete')) return;
                this.switchToSession(sessionId);
            });
        });
        
        // Attach event listeners to delete buttons
        sessionsList.querySelectorAll('.session-delete').forEach(btn => {
            const sessionId = btn.getAttribute('data-delete-session');
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(sessionId);
            });
        });
    }

    // ===== Initialization =====
    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.checkSystemStatus();
        await this.loadPersonas();  // Load personas first
        await this.loadAvailableModels();
        this.loadChatHistory();  // Load previous chat history
        this.renderSessionsList();  // Render sessions list after personas loaded
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
        
        // User Profile Modal
        this.userProfileBtn = document.getElementById('userProfileBtn');
        this.userProfileModal = document.getElementById('userProfileModal');
        this.closeUserProfileBtn = document.getElementById('closeUserProfileBtn');
        this.saveUserProfileBtn = document.getElementById('saveUserProfileBtn');
        
        // Create Persona Modal
        this.createPersonaModal = document.getElementById('createPersonaModal');
        this.closeCreatePersonaBtn = document.getElementById('closeCreatePersonaBtn');
        this.cancelCreatePersonaBtn = document.getElementById('cancelCreatePersonaBtn');
        this.createPersonaForm = document.getElementById('createPersonaForm');
        
        // Model Manager Modal
        this.modelManagerBtn = document.getElementById('modelManagerBtn');
        this.modelManagerModal = document.getElementById('modelManagerModal');
        this.downloadModelBtn = document.getElementById('downloadModelBtn');
        this.modelNameInput = document.getElementById('modelNameInput');
        
        // Mobile menu
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.mobileOverlay = document.getElementById('mobileOverlay');
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
        
        // Sidebar actions
        this.createPersonaBtn.addEventListener('click', () => this.openCreatePersona());
        if (this.newSessionBtn) {
            this.newSessionBtn.addEventListener('click', () => {
                console.log('New Session clicked');
                const sessionId = this.createNewSession();
                console.log('Created session:', sessionId);
                this.switchToSession(sessionId);
            });
        } else {
            console.error('newSessionBtn not found!');
        }
        this.editPersonaBtn.addEventListener('click', () => this.editCurrentPersona());
        this.deletePersonaBtn.addEventListener('click', () => this.deleteCurrentPersona());
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.voiceModeBtn.addEventListener('click', () => this.toggleVoiceMode());
        this.memoryModeBtn.addEventListener('click', () => this.toggleMemoryMode());
        this.userProfileBtn.addEventListener('click', () => this.openUserProfile());
        this.modelManagerBtn.addEventListener('click', () => this.openModelManager());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        
        // Model Manager modal
        this.downloadModelBtn.addEventListener('click', () => this.downloadModel());
        document.getElementById('restartComfyuiBtn').addEventListener('click', () => this.restartComfyUI());
        document.getElementById('viewDebugBtn').addEventListener('click', () => this.viewDebugInfo());
        document.getElementById('setCheckpointBtn').addEventListener('click', () => this.setCheckpoint());
        this.modelManagerModal.querySelector('.close-modal').addEventListener('click', () => this.closeModelManager());
        this.modelManagerModal.addEventListener('click', (e) => {
            if (e.target === this.modelManagerModal) {
                this.closeModelManager();
            }
        });
        
        // Debug modal
        document.getElementById('closeDebugBtn').addEventListener('click', () => this.closeDebugModal());
        document.getElementById('debugModal').addEventListener('click', (e) => {
            if (e.target.id === 'debugModal') {
                this.closeDebugModal();
            }
        });
        
        // Hugging Face search
        document.getElementById('hfSearchBtn').addEventListener('click', () => this.searchHuggingFace());
        document.getElementById('hfSearchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchHuggingFace();
        });
        
        // User Profile modal
        this.closeUserProfileBtn.addEventListener('click', () => this.closeUserProfile());
        this.saveUserProfileBtn.addEventListener('click', () => this.saveUserProfile());
        
        // Settings modal
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        
        // Create Persona modal
        this.closeCreatePersonaBtn.addEventListener('click', () => this.closeCreatePersona());
        this.cancelCreatePersonaBtn.addEventListener('click', () => this.closeCreatePersona());
        this.createPersonaForm.addEventListener('submit', (e) => this.handleCreatePersona(e));
        
        // Mobile menu
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        }
        if (this.mobileOverlay) {
            this.mobileOverlay.addEventListener('click', () => this.closeSidebar());
        }
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        // Close sidebar when clicking on sidebar items (mobile)
        if (this.sidebar) {
            this.sidebar.addEventListener('click', (e) => {
                // Close sidebar when clicking action buttons on mobile
                if (window.innerWidth <= 768 && e.target.closest('.action-btn')) {
                    setTimeout(() => this.closeSidebar(), 300);
                }
            });
        }
        
        // Settings sliders
        document.getElementById('temperatureSetting').addEventListener('input', (e) => {
            document.getElementById('temperatureValue').textContent = e.target.value;
        });
        document.getElementById('maxTokensSetting').addEventListener('input', (e) => {
            document.getElementById('maxTokensValue').textContent = e.target.value;
        });
        
        // Click outside modal to close
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
        
        this.userProfileModal.addEventListener('click', (e) => {
            if (e.target === this.userProfileModal) {
                this.closeUserProfile();
            }
        });
        
        this.createPersonaModal.addEventListener('click', (e) => {
            if (e.target === this.createPersonaModal) {
                this.closeCreatePersona();
            }
        });
        
        // Persona form sliders
        document.getElementById('personaTemperature').addEventListener('input', (e) => {
            document.getElementById('personaTemperatureValue').textContent = e.target.value;
        });
        document.getElementById('personaMaxTokens').addEventListener('input', (e) => {
            document.getElementById('personaMaxTokensValue').textContent = e.target.value;
        });
        
        // Mobile-specific improvements
        this.setupMobileHandling();
    }
    
    setupMobileHandling() {
        // Window resize handling for mobile
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                // Close mobile sidebar when switching to desktop
                this.closeSidebar();
            }
        });
        
        // Prevent zoom on iOS double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Handle mobile input focus (prevent zoom on iOS)
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (window.innerWidth <= 768) {
                    // Scroll input into view on mobile
                    setTimeout(() => {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            });
        });
        
        // Better touch handling for buttons
        const buttons = document.querySelectorAll('button, .btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.98)';
            });
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.transform = '';
                }, 100);
            });
        });
    }

    // ===== System Status =====
    async checkSystemStatus() {
        // Check Ollama (via API proxy)
        this.checkServiceStatus(
            `${this.apiBase}/ollama/models`,
            'ollamaStatus',
            'Ollama'
        );
        
        // Check ComfyUI (via API proxy)
        this.checkServiceStatus(
            `${this.apiBase}/comfyui/status`,
            'comfyuiStatus',
            'ComfyUI'
        );
        
        // Check TTS (via API proxy)
        this.checkServiceStatus(
            `${this.apiBase}/tts/health`,
            'ttsStatus',
            'TTS'
        );
    }

    async checkServiceStatus(url, elementId, serviceName) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Set to checking state
        element.className = 'status-indicator checking';
        
        try {
            const response = await fetch(url, { 
                method: 'GET',
                signal: AbortSignal.timeout(3000) // 3 second timeout
            });
            
            if (response.ok) {
                element.className = 'status-indicator online';
            } else {
                element.className = 'status-indicator offline';
            }
        } catch (error) {
            element.className = 'status-indicator offline';
        }
    }

    updateSystemStatus(isOnline) {
        // Legacy function - kept for compatibility
        const systemStatus = document.getElementById('systemStatus');
        if (systemStatus) {
            systemStatus.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
            systemStatus.innerHTML = `
                <i class="fas fa-circle"></i>
                <span>${isOnline ? 'System Online' : 'System Offline'}</span>
            `;
        }
    }

    startStatusCheck() {
        setInterval(() => this.checkSystemStatus(), 10000); // Check every 10s
    }

    // ===== Personas =====
    async loadPersonas() {
        try {
            const response = await fetch(`${this.apiBase}/personas`);
            if (!response.ok) throw new Error('Failed to load personas');
            
            const data = await response.json();
            
            if (!data.personas || !Array.isArray(data.personas)) {
                throw new Error('Invalid personas data received');
            }
            
            this.personas = data.personas;
            this.currentPersona = data.current || this.personas[0]; // Fallback to first persona
            
            this.renderPersonas();
            this.updateCurrentPersonaDisplay();
        } catch (error) {
            console.error('Error loading personas:', error);
            this.personaSelector.innerHTML = '<option value="">Error loading personas</option>';
            this.showError('Failed to load personas. Please refresh the page.');
        }
    }

    async loadAvailableModels() {
        try {
            // Use the API endpoint instead of direct Ollama connection (works remotely)
            const response = await fetch(`${this.apiBase}/ollama/models`);
            const data = await response.json();
            
            const modelSelect = document.getElementById('personaModel');
            if (!modelSelect) return;
            
            // Populate model dropdown
            modelSelect.innerHTML = data.models.map(model => {
                const name = model.name;
                const size = model.details?.parameter_size || '';
                const label = size ? `${name} (${size})` : name;
                return `<option value="${name}">${label}</option>`;
            }).join('');
            
            // Set default
            if (data.models.length > 0) {
                modelSelect.value = 'dolphin-mistral:latest';
            }
        } catch (error) {
            console.error('Error loading models:', error);
            const modelSelect = document.getElementById('personaModel');
            if (modelSelect) {
                modelSelect.innerHTML = '<option value="dolphin-mistral:latest">dolphin-mistral:latest (default)</option>';
            }
        }
    }

    renderPersonas() {
        const personaIcons = {
            'luna': '🌙',
            'nova': '💻',
            'sage': '🧘',
            'alex': '⚡'
        };
        
        const defaultPersonas = ['luna', 'nova', 'sage', 'alex'];
        
        if (!this.currentPersona) {
            console.error('No current persona set');
            return;
        }
        
        // Build the dropdown options
        this.personaSelector.innerHTML = this.personas.map(persona => {
            const icon = personaIcons[persona.id] || '🦄';
            const selected = persona.id === this.currentPersona.id ? 'selected' : '';
            
            return `<option value="${persona.id}" ${selected}>${icon} ${persona.name}</option>`;
        }).join('');
        
        // Update the info display
        this.updatePersonaInfoDisplay(this.currentPersona);
        
        // Show/hide edit/delete buttons based on current persona
        const isDefaultPersona = defaultPersonas.includes(this.currentPersona.id);
        this.editPersonaBtn.style.display = 'flex';  // Can edit any persona
        this.deletePersonaBtn.style.display = isDefaultPersona ? 'none' : 'flex';
        
        // Remove existing change handler if present
        const newSelector = this.personaSelector.cloneNode(true);
        this.personaSelector.parentNode.replaceChild(newSelector, this.personaSelector);
        this.personaSelector = newSelector;
        
        // Add change handler
        this.personaSelector.addEventListener('change', (e) => {
            const personaId = e.target.value;
            this.switchPersona(personaId);
        });
    }
    
    updatePersonaInfoDisplay(persona) {
        const displayEl = document.getElementById('personaInfoDisplay');
        const traitsEl = document.getElementById('personaDisplayTraits');
        
        if (!displayEl || !traitsEl) return;
        
        // Update description
        const descEl = displayEl.querySelector('.persona-display-description');
        if (descEl) {
            descEl.textContent = persona.description;
        }
        
        // Update traits
        traitsEl.innerHTML = persona.personality_traits.slice(0, 4).map(trait => 
            `<span class="trait-badge">${trait}</span>`
        ).join('');
    }

    async switchPersona(personaId) {
        if (!personaId || personaId === 'null' || personaId === 'undefined') {
            console.error('Invalid persona ID:', personaId);
            this.showError('Invalid persona ID');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/personas/${personaId}/activate`, {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('Failed to switch persona');
            
            const data = await response.json();
            
            // Reload personas to get updated data
            await this.loadPersonas();
            
            // Add system message
            this.addSystemMessage(`Switched to ${this.currentPersona.name}`);
            
            // Play sound
            if (this.settings.soundEffects) {
                this.playSound('switch');
            }
        } catch (error) {
            console.error('Error switching persona:', error);
            this.showError('Failed to switch persona');
        }
    }

    updateCurrentPersonaDisplay() {
        if (!this.currentPersona) return;
        
        const personaIcons = {
            'luna': '🌙',
            'nova': '💻',
            'sage': '🧘',
            'alex': '⚡'
        };
        
        const icon = personaIcons[this.currentPersona.id] || '🦄';
        
        // Update avatar if element exists
        const avatarEl = this.currentPersonaInfo?.querySelector('.persona-avatar');
        if (avatarEl) {
            avatarEl.textContent = icon;
        }
        
        // Note: Header now shows session name, not persona details
        // Persona info is shown in the sidebar persona selector
    }

    // ===== Chat =====
    async handleSendMessage(e) {
        e.preventDefault();
        
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Clear input
        this.messageInput.value = '';
        this.autoResizeTextarea();
        
        // Add user message
        this.addMessage('user', message);
        
        // Show typing indicator
        this.showTyping(true);
        this.sendBtn.disabled = true;
        
        const startTime = Date.now();
        
        try {
            const response = await fetch(`${this.apiBase}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    persona_id: this.currentPersona.id,
                    session_id: this.sessionId,  // Include session ID for memory
                    temperature: this.settings.temperature,
                    max_tokens: this.settings.maxTokens
                })
            });
            
            if (!response.ok) throw new Error('Failed to get response');
            
            const data = await response.json();
            const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);
            
            // Update stats
            this.updateStats(responseTime);
            
            // Hide typing indicator
            this.showTyping(false);
            
            // Add AI response
            const messageEl = this.addMessage('ai', data.response, {
                hasImage: data.has_image,
                imagePrompt: data.image_prompt,
                imageUrl: data.image_url,
                responseTime: responseTime,
                model: data.model  // Include model info
            });
            
            // Handle voice mode - add audio controls to this message
            if (this.settings.voiceMode) {
                await this.addAudioToMessage(messageEl, data.response);
            }
            
            // Play sound
            if (this.settings.soundEffects) {
                this.playSound('message');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showTyping(false);
            this.showError('Failed to send message. Please try again.');
        } finally {
            this.sendBtn.disabled = false;
            this.messageInput.focus();
        }
    }

    async retryLastMessage() {
        // Find the last user message
        let lastUserMessage = null;
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].sender === 'user') {
                lastUserMessage = this.messages[i].text;
                break;
            }
        }

        if (!lastUserMessage) {
            this.showError('No previous message to retry');
            return;
        }

        // Remove the last AI response(s) from display and array
        const messagesToRemove = [];
        for (let i = this.messages.length - 1; i >= 0; i--) {
            if (this.messages[i].sender === 'ai') {
                messagesToRemove.push(i);
            } else {
                break; // Stop at the first non-AI message
            }
        }

        // Remove from array (in reverse order to maintain indices)
        messagesToRemove.forEach(index => {
            this.messages.splice(index, 1);
        });

        // Remove from DOM
        const aiMessages = this.chatMessages.querySelectorAll('.message.ai');
        const lastAiMessage = aiMessages[aiMessages.length - 1];
        if (lastAiMessage) {
            lastAiMessage.remove();
        }

        // Show typing indicator
        this.showTyping(true);
        this.sendBtn.disabled = true;

        const startTime = Date.now();

        try {
            const response = await fetch(`${this.apiBase}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: lastUserMessage,
                    persona_id: this.currentPersona.id,
                    session_id: this.sessionId,
                    temperature: this.settings.temperature,
                    max_tokens: this.settings.maxTokens
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            const responseTime = ((Date.now() - startTime) / 1000).toFixed(1);

            // Update stats
            this.updateStats(responseTime);

            // Hide typing indicator
            this.showTyping(false);

            // Add AI response
            const messageEl = this.addMessage('ai', data.response, {
                hasImage: data.has_image,
                imagePrompt: data.image_prompt,
                imageUrl: data.image_url,
                responseTime: responseTime,
                model: data.model
            });

            // Handle voice mode
            if (this.settings.voiceMode) {
                await this.addAudioToMessage(messageEl, data.response);
            }

            // Play sound
            if (this.settings.soundEffects) {
                this.playSound('message');
            }

            // Save updated messages
            this.saveMessages();

        } catch (error) {
            console.error('Error retrying message:', error);
            this.showTyping(false);
            this.showError('Failed to regenerate response. Please try again.');
        } finally {
            this.sendBtn.disabled = false;
        }
    }

    addMessage(sender, text, options = {}) {
        const message = {
            sender,
            text,
            timestamp: new Date(),
            ...options
        };
        
        this.messages.push(message);
        const messageEl = this.renderMessage(message);
        
        // Save to localStorage
        this.saveChatHistory();
        
        if (this.settings.autoScroll) {
            this.scrollToBottom();
        }
        
        return messageEl;  // Return the element for audio controls
    }

    renderMessage(message) {
        const isUser = message.sender === 'user';
        const time = message.timestamp.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isUser ? 'user' : 'ai'}`;
        
        const personaIcons = {
            'luna': '🌙',
            'nova': '💻',
            'sage': '🧘',
            'alex': '⚡'
        };
        
        const avatar = isUser ? '👤' : (personaIcons[this.currentPersona?.id] || '🦄');
        const name = isUser ? 'You' : (this.currentPersona?.name || 'AI');
        
        messageEl.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${name}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble">${this.formatMessage(message.text)}</div>
                ${message.imageUrl ? `
                    <div class="message-image">
                        <img src="${message.imageUrl}" alt="${message.imagePrompt || 'Generated image'}" 
                             style="max-width: 100%; border-radius: 8px; margin-top: 8px; cursor: pointer;"
                             onclick="window.open('${message.imageUrl}', '_blank')">
                        ${message.imagePrompt ? `<p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 4px;">🖼️ ${message.imagePrompt}</p>` : ''}
                    </div>
                ` : message.hasImage ? `
                    <div class="message-image-placeholder">
                        <p>🖼️ Image: ${message.imagePrompt}</p>
                        <p style="font-size: 0.875rem; color: var(--text-secondary);">
                            (Image generation in progress...)
                        </p>
                    </div>
                ` : ''}
                ${message.responseTime || message.model || !isUser ? `
                    <div class="message-meta">
                        ${message.responseTime ? `<span>⚡ ${message.responseTime}s</span>` : ''}
                        ${message.model ? `<span>🤖 ${message.model}</span>` : ''}
                        ${!isUser ? `<button class="retry-button" onclick="window.chatManager.retryLastMessage()" title="Regenerate response">🔄 Retry</button>` : ''}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Remove welcome message if it exists
        const welcomeMsg = this.chatMessages.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        this.chatMessages.appendChild(messageEl);
        return messageEl;  // Return for audio controls
    }

    formatMessage(text) {
        // Basic formatting
        return text
            .replace(/\[IMAGE:[^\]]+\]/gi, '') // Remove [IMAGE: ...] tags
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .trim();
    }

    addSystemMessage(text) {
        const messageEl = document.createElement('div');
        messageEl.className = 'system-message';
        messageEl.style.textAlign = 'center';
        messageEl.style.padding = '0.5rem';
        messageEl.style.color = 'var(--text-secondary)';
        messageEl.style.fontSize = '0.875rem';
        messageEl.textContent = text;
        
        this.chatMessages.appendChild(messageEl);
        this.scrollToBottom();
    }

    showTyping(show) {
        if (show) {
            this.typingIndicator.classList.add('active');
        } else {
            this.typingIndicator.classList.remove('active');
        }
    }

    // ===== Chat History =====
    saveChatHistory() {
        // Save messages to localStorage for persistence (per session)
        try {
            const chatData = {
                messages: this.messages.map(msg => ({
                    sender: msg.sender,
                    text: msg.text,
                    timestamp: msg.timestamp.toISOString(),
                    persona: msg.persona,
                    hasImage: msg.hasImage,
                    imagePrompt: msg.imagePrompt,
                    imageUrl: msg.imageUrl,
                    responseTime: msg.responseTime,
                    model: msg.model
                })),
                persona: this.currentPersona?.id,
                sessionId: this.sessionId,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(`unicornAI_chatHistory_${this.sessionId}`, JSON.stringify(chatData));
            
            // Update session metadata
            const session = this.sessions.find(s => s.id === this.sessionId);
            if (session) {
                session.messageCount = this.messages.filter(m => m.sender === 'user').length;
                session.lastUpdated = new Date().toISOString();
                this.saveSessions();
            }
            
            console.log('Chat history saved for session:', this.sessionId);
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadChatHistory() {
        // Load messages from localStorage for current session
        try {
            const chatData = localStorage.getItem(`unicornAI_chatHistory_${this.sessionId}`);
            if (!chatData) {
                console.log('No chat history found for session:', this.sessionId);
                // Show welcome message for new session
                this.chatMessages.innerHTML = `
                    <div class="welcome-message">
                        <div class="welcome-icon">🦄</div>
                        <h2>Welcome to Unicorn AI</h2>
                        <p>Start chatting with ${this.currentPersona?.name || 'someone'}!</p>
                    </div>
                `;
                return;
            }
            
            const data = JSON.parse(chatData);
            
            this.messages = data.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
            }));
            
            // Re-render all messages
            this.chatMessages.innerHTML = '';
            this.messages.forEach(msg => {
                this.renderMessage(msg);
            });
            
            // Update stats
            this.stats.messageCount = this.messages.filter(m => m.sender === 'user').length;
            this.updateStatsDisplay();
            
            console.log(`Loaded ${this.messages.length} messages from history`);
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    async clearChat() {
        if (confirm('Are you sure you want to clear the chat history? This will also clear conversation memory.')) {
            this.messages = [];
            this.chatMessages.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">🦄</div>
                    <h2>Chat Cleared</h2>
                    <p>Start a new conversation below!</p>
                </div>
            `;
            this.stats.messageCount = 0;
            this.stats.responseTimes = [];
            this.updateStatsDisplay();
            
            // Clear localStorage for this session
            localStorage.removeItem(`unicornAI_chatHistory_${this.sessionId}`);
            
            // Update session metadata
            const session = this.sessions.find(s => s.id === this.sessionId);
            if (session) {
                session.messageCount = 0;
                session.lastUpdated = new Date().toISOString();
                this.saveSessions();
                this.renderSessionsList();
            }
            
            // Clear memory on backend
            try {
                await fetch(`${this.apiBase}/memory/clear/${this.sessionId}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.error('Error clearing memory:', error);
            }
        }
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 150) + 'px';
    }

    // ===== Voice Mode =====
    toggleVoiceMode() {
        this.settings.voiceMode = !this.settings.voiceMode;
        this.updateVoiceModeButton();
        this.saveSettingsToStorage();
    }

    updateVoiceModeButton() {
        const isEnabled = this.settings.voiceMode;
        this.voiceModeBtn.dataset.voiceEnabled = isEnabled;
        this.voiceModeBtn.innerHTML = `
            <i class="fas fa-microphone${isEnabled ? '' : '-slash'}"></i>
            Voice Mode: ${isEnabled ? 'On' : 'Off'}
        `;
    }

    async toggleMemoryMode() {
        this.memoryEnabled = !this.memoryEnabled;
        
        // Update button appearance
        this.memoryModeBtn.dataset.memoryEnabled = this.memoryEnabled;
        this.memoryModeBtn.innerHTML = `
            <i class="fas fa-brain"></i>
            Memory: ${this.memoryEnabled ? 'On' : 'Off'}
        `;
        
        // Notify backend
        try {
            const response = await fetch(`${this.apiBase}/memory/toggle/${this.sessionId}?enabled=${this.memoryEnabled}`, {
                method: 'POST'
            });
            const data = await response.json();
            this.addSystemMessage(`Memory ${this.memoryEnabled ? 'enabled' : 'disabled'}. ${this.memoryEnabled ? 'I will remember our conversations.' : 'I won\'t remember past messages.'}`);
        } catch (error) {
            console.error('Error toggling memory:', error);
        }
    }

    async addAudioToMessage(messageEl, text) {
        try {
            // Stop any other currently playing audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            
            // Remove image tags from text
            const cleanText = text.replace(/\[IMAGE:.*?\]/g, '');
            
            // Create audio controls for this message
            const audioContainer = document.createElement('div');
            audioContainer.className = 'message-audio-controls';
            audioContainer.innerHTML = `
                <div class="audio-loading">
                    <i class="fas fa-spinner fa-spin"></i> Generating audio...
                </div>
            `;
            
            const messageContent = messageEl.querySelector('.message-content');
            messageContent.appendChild(audioContainer);
            
            // Generate audio
            const response = await fetch(`${this.apiBase}/generate-voice?text=${encodeURIComponent(cleanText)}`);
            if (!response.ok) throw new Error('Failed to generate voice');
            
            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            
            // Create audio player HTML
            audioContainer.innerHTML = `
                <div class="audio-player">
                    <button class="audio-play-btn" title="Play">
                        <i class="fas fa-play"></i>
                    </button>
                    <div class="audio-progress-container">
                        <input type="range" class="audio-seek-bar" min="0" max="100" value="0">
                        <span class="audio-time">0:00 / 0:00</span>
                    </div>
                    <div class="audio-volume-container">
                        <i class="fas fa-volume-up audio-volume-icon"></i>
                        <input type="range" class="audio-volume-bar" min="0" max="100" value="80">
                    </div>
                    <button class="audio-download-btn" title="Download">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            `;
            
            // Create audio element
            const audio = new Audio(audioUrl);
            audio.volume = 0.8;
            
            // Get control elements
            const playBtn = audioContainer.querySelector('.audio-play-btn');
            const seekBar = audioContainer.querySelector('.audio-seek-bar');
            const timeDisplay = audioContainer.querySelector('.audio-time');
            const volumeBar = audioContainer.querySelector('.audio-volume-bar');
            const volumeIcon = audioContainer.querySelector('.audio-volume-icon');
            const downloadBtn = audioContainer.querySelector('.audio-download-btn');
            
            // Play/Pause
            playBtn.addEventListener('click', () => {
                if (audio.paused) {
                    // Pause any other playing audio
                    if (this.currentAudio && this.currentAudio !== audio) {
                        this.currentAudio.pause();
                    }
                    this.currentAudio = audio;
                    audio.play();
                    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                } else {
                    audio.pause();
                    playBtn.innerHTML = '<i class="fas fa-play"></i>';
                }
            });
            
            // Update progress
            audio.addEventListener('loadedmetadata', () => {
                seekBar.max = audio.duration;
                timeDisplay.textContent = `0:00 / ${this.formatTime(audio.duration)}`;
            });
            
            audio.addEventListener('timeupdate', () => {
                seekBar.value = audio.currentTime;
                timeDisplay.textContent = `${this.formatTime(audio.currentTime)} / ${this.formatTime(audio.duration)}`;
            });
            
            // Seek
            seekBar.addEventListener('input', (e) => {
                audio.currentTime = e.target.value;
            });
            
            // Volume
            volumeBar.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                audio.volume = volume;
                
                // Update icon
                if (volume === 0) {
                    volumeIcon.className = 'fas fa-volume-mute audio-volume-icon';
                } else if (volume < 0.5) {
                    volumeIcon.className = 'fas fa-volume-down audio-volume-icon';
                } else {
                    volumeIcon.className = 'fas fa-volume-up audio-volume-icon';
                }
            });
            
            // Download
            downloadBtn.addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = `voice_${Date.now()}.wav`;
                a.click();
            });
            
            // When ended
            audio.addEventListener('ended', () => {
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                if (this.currentAudio === audio) {
                    this.currentAudio = null;
                }
            });
            
        } catch (error) {
            console.error('Error adding audio to message:', error);
            const audioContainer = messageEl.querySelector('.message-audio-controls');
            if (audioContainer) {
                audioContainer.innerHTML = `
                    <div class="audio-error">
                        <i class="fas fa-exclamation-circle"></i> Failed to generate audio
                    </div>
                `;
            }
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // ===== Settings =====
    loadSettings() {
        const defaults = {
            temperature: 0.8,
            maxTokens: 150,
            soundEffects: true,
            darkMode: true,
            autoScroll: true,
            voiceMode: false
        };
        
        const saved = localStorage.getItem('unicornAI_settings');
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }

    saveSettingsToStorage() {
        localStorage.setItem('unicornAI_settings', JSON.stringify(this.settings));
    }

    applySettings() {
        document.getElementById('temperatureSetting').value = this.settings.temperature;
        document.getElementById('temperatureValue').textContent = this.settings.temperature;
        document.getElementById('maxTokensSetting').value = this.settings.maxTokens;
        document.getElementById('maxTokensValue').textContent = this.settings.maxTokens;
        document.getElementById('soundEffectsSetting').checked = this.settings.soundEffects;
        document.getElementById('darkModeSetting').checked = this.settings.darkMode;
        document.getElementById('autoScrollSetting').checked = this.settings.autoScroll;
        this.updateVoiceModeButton();
    }

    openSettings() {
        this.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.settingsModal.classList.remove('active');
    }

    async openUserProfile() {
        await this.loadUserProfile();  // Load profile when opening
        this.userProfileModal.classList.add('active');
    }

    closeUserProfile() {
        this.userProfileModal.classList.remove('active');
    }

    async saveSettings() {
        this.settings.temperature = parseFloat(document.getElementById('temperatureSetting').value);
        this.settings.maxTokens = parseInt(document.getElementById('maxTokensSetting').value);
        this.settings.soundEffects = document.getElementById('soundEffectsSetting').checked;
        this.settings.darkMode = document.getElementById('darkModeSetting').checked;
        this.settings.autoScroll = document.getElementById('autoScrollSetting').checked;
        
        this.saveSettingsToStorage();
        
        // Also save user profile
        await this.saveUserProfile();
        
        this.closeSettings();
        this.addSystemMessage('Settings and profile saved!');
    }

    resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            this.settings = {
                temperature: 0.8,
                maxTokens: 150,
                soundEffects: true,
                darkMode: true,
                autoScroll: true,
                voiceMode: false
            };
            this.applySettings();
            this.saveSettingsToStorage();
            this.addSystemMessage('Settings reset to defaults!');
        }
    }

    // ===== User Profile =====
    async loadUserProfile() {
        try {
            const response = await fetch(`${this.apiBase}/user/profile`);
            if (response.ok) {
                const profile = await response.json();
                
                // Populate form fields
                document.getElementById('userName').value = profile.name || '';
                document.getElementById('userPreferredName').value = profile.preferred_name || '';
                document.getElementById('userPronouns').value = profile.pronouns || '';
                document.getElementById('userInterests').value = profile.interests?.join(', ') || '';
                document.getElementById('userFacts').value = profile.facts?.join('\n') || '';
                document.getElementById('userFormality').value = profile.preferences?.formality || 'casual';
                document.getElementById('userHumor').checked = profile.preferences?.humor !== false;
                document.getElementById('userEmojis').checked = profile.preferences?.emojis !== false;
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    async saveUserProfile() {
        try {
            const profile = {
                name: document.getElementById('userName').value.trim(),
                preferred_name: document.getElementById('userPreferredName').value.trim(),
                pronouns: document.getElementById('userPronouns').value.trim(),
                interests: document.getElementById('userInterests').value
                    .split(',')
                    .map(i => i.trim())
                    .filter(i => i),
                facts: document.getElementById('userFacts').value
                    .split('\n')
                    .map(f => f.trim())
                    .filter(f => f),
                preferences: {
                    formality: document.getElementById('userFormality').value,
                    humor: document.getElementById('userHumor').checked,
                    emojis: document.getElementById('userEmojis').checked
                }
            };

            const response = await fetch(`${this.apiBase}/user/profile`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profile)
            });

            if (response.ok) {
                this.addSystemMessage('Profile saved! The AI will now use your preferences.');
            } else {
                throw new Error('Failed to save profile');
            }
        } catch (error) {
            console.error('Error saving user profile:', error);
            this.addSystemMessage('Error: Failed to save profile', true);
        }
    }

    // ===== Stats =====
    updateStats(responseTime) {
        this.stats.messageCount++;
        this.stats.responseTimes.push(parseFloat(responseTime));
        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        this.messageCountEl.textContent = this.stats.messageCount;
        
        if (this.stats.responseTimes.length > 0) {
            const avg = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
            this.avgResponseTimeEl.textContent = avg.toFixed(1) + 's';
        } else {
            this.avgResponseTimeEl.textContent = '0s';
        }
    }

    // ===== Utilities =====
    toggleSidebar() {
        this.sidebar.classList.toggle('active');
        const overlay = document.getElementById('mobileOverlay');
        if (overlay) {
            overlay.classList.toggle('active');
        }
    }
    
    closeSidebar() {
        this.sidebar.classList.remove('active');
        const overlay = document.getElementById('mobileOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    // ===== Persona Creation =====
    async openCreatePersona() {
        this.editingPersonaId = null;  // Clear edit mode
        
        // Reload models before opening modal
        await this.loadAvailableModels();
        
        this.createPersonaModal.classList.add('active');
        this.createPersonaForm.reset();
        document.getElementById('personaTemperatureValue').textContent = '0.8';
        document.getElementById('personaMaxTokensValue').textContent = '150';
        document.querySelector('#createPersonaModal h2').textContent = 'Create Custom Persona';
        document.getElementById('submitPersonaBtn').innerHTML = '<i class="fas fa-magic"></i> Create Persona';
    }
    
    async editCurrentPersona() {
        if (!this.currentPersona) return;
        
        this.editingPersonaId = this.currentPersona.id;
        
        // Reload models before opening modal
        await this.loadAvailableModels();
        
        this.createPersonaModal.classList.add('active');
        
        // Pre-fill form with current persona data
        document.getElementById('personaId').value = this.currentPersona.id;
        document.getElementById('personaId').disabled = true;  // Can't change ID
        document.getElementById('personaName').value = this.currentPersona.name;
        document.getElementById('personaDescription').value = this.currentPersona.description;
        document.getElementById('personaTraits').value = this.currentPersona.personality_traits.join(', ');
        document.getElementById('personaSpeakingStyle').value = this.currentPersona.speaking_style;
        document.getElementById('personaSystemPrompt').value = this.currentPersona.system_prompt || '';
        document.getElementById('personaModel').value = this.currentPersona.model || 'dolphin-mistral:latest';
        document.getElementById('personaVoice').value = this.currentPersona.voice;
        document.getElementById('personaGender').value = this.currentPersona.gender || '';
        document.getElementById('personaImageStyle').value = this.currentPersona.image_style || '';
        document.getElementById('personaTemperature').value = this.currentPersona.temperature;
        document.getElementById('personaTemperatureValue').textContent = this.currentPersona.temperature;
        document.getElementById('personaMaxTokens').value = this.currentPersona.max_tokens;
        document.getElementById('personaMaxTokensValue').textContent = this.currentPersona.max_tokens;
        
        document.querySelector('#createPersonaModal h2').textContent = 'Edit Persona';
        document.getElementById('submitPersonaBtn').innerHTML = '<i class="fas fa-save"></i> Update Persona';
    }
    
    closeCreatePersona() {
        this.createPersonaModal.classList.remove('active');
        this.editingPersonaId = null;
        document.getElementById('personaId').disabled = false;
        document.querySelector('#createPersonaModal h2').textContent = 'Create Custom Persona';
        document.getElementById('submitPersonaBtn').innerHTML = '<i class="fas fa-magic"></i> Create Persona';
    }
    
    async handleCreatePersona(e) {
        e.preventDefault();
        
        // Get form elements from the form itself to avoid ID conflicts
        const form = e.target;
        const personaIdEl = form.querySelector('#personaId');
        const nameEl = form.querySelector('#personaName');
        const descriptionEl = form.querySelector('#personaDescription');
        const traitsEl = form.querySelector('#personaTraits');
        const speakingStyleEl = form.querySelector('#personaSpeakingStyle');
        const systemPromptEl = form.querySelector('#personaSystemPrompt');
        const modelEl = form.querySelector('#personaModel');
        const voiceEl = form.querySelector('#personaVoice');
        const imageStyleEl = form.querySelector('#personaImageStyle');
        const temperatureEl = form.querySelector('#personaTemperature');
        const maxTokensEl = form.querySelector('#personaMaxTokens');
        
        // Check if all elements exist
        if (!personaIdEl || !nameEl || !descriptionEl || !traitsEl || !speakingStyleEl || !systemPromptEl || !modelEl || !voiceEl || !temperatureEl || !maxTokensEl) {
            this.showError('Form elements not found. Please refresh the page.');
            console.error('Missing form elements:', {
                personaId: !!personaIdEl,
                name: !!nameEl,
                description: !!descriptionEl,
                traits: !!traitsEl,
                speakingStyle: !!speakingStyleEl,
                systemPrompt: !!systemPromptEl,
                voice: !!voiceEl,
                imageStyle: !!imageStyleEl,
                temperature: !!temperatureEl,
                maxTokens: !!maxTokensEl
            });
            return;
        }
        
        const personaId = personaIdEl.value.trim().toLowerCase();
        const name = nameEl.value.trim();
        const description = descriptionEl.value.trim();
        const traitsInput = traitsEl.value.trim();
        const speakingStyle = speakingStyleEl.value.trim();
        const systemPrompt = systemPromptEl.value.trim();
        const model = modelEl.value;
        const voice = voiceEl.value;
        const gender = document.getElementById('personaGender').value;
        const imageStyle = imageStyleEl.value.trim();
        const temperature = parseFloat(temperatureEl.value);
        const maxTokens = parseInt(maxTokensEl.value);
        
        // Determine if we're editing or creating
        const isEditing = !!this.editingPersonaId;
        
        // Validate ID format (only for creation, not editing)
        if (!isEditing && (!personaId || !/^[a-z0-9-]+$/.test(personaId))) {
            this.showError('Persona ID must contain only lowercase letters, numbers, and hyphens');
            return;
        }
        
        // Parse traits
        const traits = traitsInput.split(',').map(t => t.trim()).filter(t => t);
        if (traits.length < 3) {
            this.showError('Please provide at least 3 personality traits');
            return;
        }
        
        // Create or update persona
        try {
            const url = isEditing 
                ? `${this.apiBase}/personas/${this.editingPersonaId}` 
                : `${this.apiBase}/personas/create`;
            const method = isEditing ? 'PUT' : 'POST';
            
            // Prepare request body - only include id for creation, not updates
            const requestBody = {
                name: name,
                description: description,
                personality_traits: traits,
                speaking_style: speakingStyle,
                system_prompt: systemPrompt,
                model: model,
                voice: voice,
                gender: gender || null,
                image_style: imageStyle,
                temperature: temperature,
                max_tokens: maxTokens
            };
            
            // Only add ID for creation, not updates
            if (!isEditing) {
                requestBody.id = personaId;
            }
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create persona');
            }
            
            const data = await response.json();
            
            // Close modal
            this.closeCreatePersona();
            
            // Reload personas
            await this.loadPersonas();
            
            // For updates, reload personas and update display without switching
            // For creation, switch to the new persona
            if (isEditing) {
                // Just reload personas to refresh the display
                await this.loadPersonas();
            } else {
                // Switch to newly created persona
                if (personaId && personaId !== 'null') {
                    await this.switchPersona(personaId);
                }
            }
            
            // Show success message
            const action = isEditing ? 'Updated' : 'Created';
            this.addSystemMessage(`✨ ${action} persona: ${name}!`);
            
            if (this.settings.soundEffects) {
                this.playSound('message');
            }
            
        } catch (error) {
            console.error('Error creating persona:', error);
            this.showError(error.message || 'Failed to create persona');
        }
    }
    
    deleteCurrentPersona() {
        const personaId = this.currentPersona.id;
        const personaName = this.currentPersona.name;
        
        if (!confirm(`Are you sure you want to delete "${personaName}"? This cannot be undone.`)) {
            return;
        }
        
        this.deletePersona(personaId);
    }
    
    async deletePersona(personaId) {
        const persona = this.personas.find(p => p.id === personaId);
        if (!persona) return;
        
        try {
            const response = await fetch(`${this.apiBase}/personas/${personaId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to delete persona');
            }
            
            // Reload personas
            await this.loadPersonas();
            
            // Show success
            this.addSystemMessage(`Deleted persona: ${persona.name}`);
            
        } catch (error) {
            console.error('Error deleting persona:', error);
            this.showError(error.message || 'Failed to delete persona');
        }
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        errorEl.style.position = 'fixed';
        errorEl.style.top = '20px';
        errorEl.style.right = '20px';
        errorEl.style.zIndex = '1000';
        errorEl.style.maxWidth = '400px';
        
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            errorEl.remove();
        }, 5000);
    }

    playSound(type) {
        // Simple beep sounds using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = type === 'message' ? 800 : 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }

    // ===== Model Manager =====
    async openModelManager() {
        this.modelManagerModal.classList.add('active');
        this.loadPopularModels();
        await this.loadInstalledModels();
        await this.loadComfyUICheckpoints();
    }

    closeModelManager() {
        this.modelManagerModal.classList.remove('active');
    }

    loadPopularModels() {
        const popularModels = [
            {
                name: 'llama3.2:latest',
                displayName: 'Llama 3.2',
                size: '2GB',
                description: 'Meta\'s latest Llama model, great all-rounder'
            },
            {
                name: 'mistral:7b',
                displayName: 'Mistral 7B',
                size: '4.1GB',
                description: 'Powerful 7B parameter model, excellent performance'
            },
            {
                name: 'phi3:mini',
                displayName: 'Phi-3 Mini',
                size: '2.3GB',
                description: 'Microsoft\'s compact model, fast and efficient'
            },
            {
                name: 'gemma2:2b',
                displayName: 'Gemma 2 2B',
                size: '1.6GB',
                description: 'Google\'s lightweight model, very fast'
            },
            {
                name: 'qwen2.5:7b',
                displayName: 'Qwen 2.5 7B',
                size: '4.7GB',
                description: 'Alibaba\'s multilingual model with coding skills'
            },
            {
                name: 'codellama:7b',
                displayName: 'Code Llama 7B',
                size: '3.8GB',
                description: 'Specialized for code generation and completion'
            }
        ];

        const listEl = document.getElementById('popularModelsList');
        listEl.innerHTML = popularModels.map(model => `
            <div class="model-item" style="background: var(--bg-secondary); padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s;" 
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.2)';"
                 onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
                 onclick="app.downloadPopularModel('${model.name}')">
                <div style="font-weight: 600; color: var(--primary-color); margin-bottom: 4px;">${model.displayName}</div>
                <div style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 4px;">${model.size}</div>
                <div style="font-size: 0.8em; color: var(--text-secondary); line-height: 1.3;">${model.description}</div>
                <div style="margin-top: 8px; text-align: center;">
                    <i class="fas fa-download" style="color: var(--primary-color);"></i>
                    <span style="font-size: 0.85em; color: var(--primary-color); margin-left: 4px;">Click to Download</span>
                </div>
            </div>
        `).join('');
    }

    async downloadPopularModel(modelName) {
        // Set the model name in the input field
        const modelNameInput = document.getElementById('modelNameInput');
        modelNameInput.value = modelName;
        
        // Trigger the download
        await this.downloadModel();
    }

    async loadInstalledModels() {
        const listEl = document.getElementById('installedModelsList');
        
        try {
            listEl.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
            
            const response = await fetch(`${this.apiBase}/ollama/models`);
            if (!response.ok) throw new Error('Failed to load models');
            
            const data = await response.json();
            const models = data.models || [];
            
            if (models.length === 0) {
                listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No models installed</div>';
                return;
            }
            
            listEl.innerHTML = models.map(model => {
                const sizeGB = (model.size / (1024 * 1024 * 1024)).toFixed(2);
                const modifiedDate = new Date(model.modified_at).toLocaleDateString();
                
                return `
                    <div class="model-item" style="background: var(--bg-secondary); padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 5px;">${model.name}</div>
                                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                                    📦 ${sizeGB} GB • 📅 ${modifiedDate}
                                    ${model.details?.parameter_size ? `• 🧠 ${model.details.parameter_size}` : ''}
                                </div>
                            </div>
                            <button class="btn btn-danger btn-small" onclick="window.unicornAI.deleteModel('${model.name}')" style="margin-left: 10px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading models:', error);
            listEl.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--error-color);">Failed to load models</div>';
        }
    }

    async downloadModel() {
        const modelName = this.modelNameInput.value.trim();
        
        if (!modelName) {
            this.showError('Please enter a model name');
            return;
        }
        
        const progressDiv = document.getElementById('downloadProgress');
        const statusEl = document.getElementById('downloadStatus');
        const percentEl = document.getElementById('downloadPercent');
        const progressBar = document.getElementById('downloadProgressBar');
        const detailsEl = document.getElementById('downloadDetails');
        const downloadBtn = this.downloadModelBtn;
        
        try {
            progressDiv.style.display = 'block';
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
            
            statusEl.textContent = 'Starting download...';
            percentEl.textContent = '0%';
            progressBar.style.width = '0%';
            detailsEl.textContent = '';
            
            const response = await fetch(`${this.apiBase}/ollama/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelName })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = 'Failed to start download';
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.detail || errorData.error || errorMessage;
                } catch {
                    errorMessage = errorText || errorMessage;
                }
                throw new Error(errorMessage);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let hasError = false;
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const text = decoder.decode(value);
                const lines = text.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            
                            // Check for errors from Ollama
                            if (data.error) {
                                hasError = true;
                                statusEl.textContent = '❌ Download failed';
                                detailsEl.textContent = data.error;
                                this.showError('Ollama error: ' + data.error);
                                break;
                            }
                            
                            if (data.status) {
                                statusEl.textContent = data.status;
                            }
                            
                            if (data.completed && data.total) {
                                const percent = Math.round((data.completed / data.total) * 100);
                                percentEl.textContent = `${percent}%`;
                                progressBar.style.width = `${percent}%`;
                                
                                const completedMB = (data.completed / (1024 * 1024)).toFixed(1);
                                const totalMB = (data.total / (1024 * 1024)).toFixed(1);
                                detailsEl.textContent = `${completedMB} MB / ${totalMB} MB`;
                            }
                            
                            if (data.status === 'success') {
                                statusEl.textContent = '✅ Download complete!';
                                percentEl.textContent = '100%';
                                progressBar.style.width = '100%';
                                this.modelNameInput.value = '';
                                await this.loadInstalledModels();
                                await this.loadAvailableModels(); // Refresh persona editor dropdown
                                
                                setTimeout(() => {
                                    progressDiv.style.display = 'none';
                                }, 3000);
                            }
                        } catch (e) {
                            console.error('Error parsing progress:', e, 'Line:', line);
                        }
                    }
                }
                
                if (hasError) break;
            }
            
        } catch (error) {
            console.error('Error downloading model:', error);
            statusEl.textContent = '❌ Download failed';
            detailsEl.textContent = error.message;
            this.showError('Failed to download model: ' + error.message);
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
        }
    }

    async deleteModel(modelName) {
        if (!confirm(`Delete model "${modelName}"?\n\nThis will permanently remove the model from your system.`)) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBase}/ollama/models/${encodeURIComponent(modelName)}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete model');
            
            const data = await response.json();
            this.addSystemMessage(`🗑️ Deleted model: ${modelName}`);
            
            await this.loadInstalledModels();
            await this.loadAvailableModels(); // Refresh persona editor dropdown
            
        } catch (error) {
            console.error('Error deleting model:', error);
            this.showError('Failed to delete model: ' + error.message);
        }
    }
    
    async restartComfyUI() {
        const btn = document.getElementById('restartComfyuiBtn');
        const originalHTML = btn.innerHTML;
        
        if (!confirm('Restart ComfyUI?\n\nThis will temporarily stop image generation while ComfyUI restarts (about 10 seconds).')) {
            return;
        }
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restarting...';
            
            const response = await fetch(`${this.apiBase}/comfyui/restart`, {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('Failed to restart ComfyUI');
            
            const data = await response.json();
            this.addSystemMessage('🔄 ComfyUI restarted successfully');
            
            // Wait a bit for ComfyUI to fully start
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            btn.innerHTML = '<i class="fas fa-check"></i> Restarted!';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('Error restarting ComfyUI:', error);
            this.showError('Failed to restart ComfyUI: ' + error.message);
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }
    
    // ===== Hugging Face Integration =====
    
    async searchHuggingFace() {
        const searchInput = document.getElementById('hfSearchInput');
        const resultsContainer = document.getElementById('hfSearchResults');
        const resultsList = document.getElementById('hfResultsList');
        
        const query = searchInput.value.trim();
        if (!query) {
            this.showError('Please enter a search term');
            return;
        }
        
        resultsContainer.style.display = 'block';
        resultsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Searching Hugging Face...</div>';
        
        try {
            const response = await fetch(`${this.apiBase}/huggingface/search?query=${encodeURIComponent(query)}&limit=15`);
            if (!response.ok) throw new Error('Failed to search Hugging Face');
            
            const data = await response.json();
            
            if (data.models && data.models.length > 0) {
                resultsList.innerHTML = '';
                
                for (const model of data.models) {
                    const modelCard = document.createElement('div');
                    modelCard.style.cssText = 'background: var(--bg-secondary); border-radius: 8px; padding: 15px; margin-bottom: 10px;';
                    
                    modelCard.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 5px;">
                                    ${model.model_name}
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 5px;">
                                    by ${model.author}
                                </div>
                                <div style="font-size: 0.75rem; color: var(--text-secondary);">
                                    📥 ${this.formatNumber(model.downloads)} downloads · ❤️ ${model.likes} likes
                                </div>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="app.selectHFModel('${model.id}')" style="white-space: nowrap;">
                                Select
                            </button>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">
                            <a href="${model.url}" target="_blank" style="color: var(--primary-color);">View on Hugging Face →</a>
                        </div>
                    `;
                    
                    resultsList.appendChild(modelCard);
                }
            } else {
                resultsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No GGUF models found for "' + query + '"</div>';
            }
            
        } catch (error) {
            console.error('Error searching Hugging Face:', error);
            resultsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--error);">Error: ' + error.message + '</div>';
        }
    }
    
    async selectHFModel(modelId) {
        const [owner, repo] = modelId.split('/');
        const resultsList = document.getElementById('hfResultsList');
        
        resultsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Loading model files...</div>';
        
        try {
            const response = await fetch(`${this.apiBase}/huggingface/model/${owner}/${repo}/files`);
            if (!response.ok) throw new Error('Failed to load model files');
            
            const data = await response.json();
            
            if (data.files && data.files.length > 0) {
                resultsList.innerHTML = `
                    <div style="background: var(--bg-secondary); border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                        <h4 style="margin: 0 0 10px 0;">📦 ${modelId}</h4>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
                            Found ${data.files.length} GGUF file(s). Select a file to import:
                        </p>
                    </div>
                `;
                
                for (const file of data.files) {
                    const fileCard = document.createElement('div');
                    fileCard.style.cssText = 'background: var(--bg-secondary); border-radius: 8px; padding: 15px; margin-bottom: 10px;';
                    
                    // Extract quantization info from filename (e.g., Q4_K_M, Q5_K_S)
                    const quantMatch = file.path.match(/Q\d+_[KF]_[MSL]|Q\d+_\d+/i);
                    const quantization = quantMatch ? quantMatch[0] : 'Unknown';
                    
                    fileCard.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 5px;">
                                    ${file.path}
                                </div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                                    📊 ${quantization} quantization · 💾 ${file.size_gb} GB
                                </div>
                            </div>
                            <button class="btn btn-sm btn-primary" onclick="app.importHFModel('${modelId}', '${file.download_url}', '${file.path}', ${file.size_gb})" style="white-space: nowrap;">
                                <i class="fas fa-download"></i> Import
                            </button>
                        </div>
                    `;
                    
                    resultsList.appendChild(fileCard);
                }
                
                // Add back button
                const backBtn = document.createElement('div');
                backBtn.style.cssText = 'text-align: center; margin-top: 15px;';
                backBtn.innerHTML = `<button class="btn btn-secondary" onclick="app.searchHuggingFace()">← Back to Search</button>`;
                resultsList.appendChild(backBtn);
                
            } else {
                resultsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">No GGUF files found for this model</div>';
            }
            
        } catch (error) {
            console.error('Error loading model files:', error);
            resultsList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--error);">Error: ' + error.message + '</div>';
        }
    }
    
    async importHFModel(modelId, downloadUrl, fileName, sizeGB) {
        // Generate a clean model name
        const modelName = modelId.split('/')[1].toLowerCase().replace(/[^a-z0-9-]/g, '-');
        
        if (!confirm(`Import ${fileName} (${sizeGB} GB)?\n\nThis will:\n1. Download the GGUF file from Hugging Face\n2. Create a Modelfile\n3. Import to Ollama as "${modelName}"\n\nThis may take several minutes depending on file size.`)) {
            return;
        }
        
        const resultsList = document.getElementById('hfResultsList');
        resultsList.innerHTML = `
            <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; text-align: center;">
                <div style="font-size: 1.2rem; margin-bottom: 15px;">
                    <i class="fas fa-spinner fa-spin"></i> Importing ${fileName}
                </div>
                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px;">
                    This may take several minutes for large files...
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    ⏳ Downloading from Hugging Face<br>
                    📦 Creating Modelfile<br>
                    🦙 Importing to Ollama
                </div>
            </div>
        `;
        
        try {
            const response = await fetch(`${this.apiBase}/huggingface/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    download_url: downloadUrl,
                    model_name: modelName,
                    file_name: fileName
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to import model');
            }
            
            const data = await response.json();
            
            resultsList.innerHTML = `
                <div style="background: var(--success-bg); border: 1px solid var(--success); border-radius: 8px; padding: 20px; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 10px;">✅</div>
                    <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 10px; color: var(--success);">
                        Successfully Imported!
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 15px;">
                        Model "${data.model_name}" is now available in Ollama
                    </div>
                    <button class="btn btn-primary" onclick="app.closeModelManager(); app.addSystemMessage('✨ New model imported: ${data.model_name}');">
                        Done
                    </button>
                </div>
            `;
            
            // Refresh model lists
            await this.loadInstalledModels();
            await this.loadAvailableModels();
            
        } catch (error) {
            console.error('Error importing model:', error);
            resultsList.innerHTML = `
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; text-align: center;">
                    <div style="font-size: 1.5rem; margin-bottom: 10px; color: var(--error);">❌</div>
                    <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 10px; color: var(--error);">
                        Import Failed
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 15px;">
                        ${error.message}
                    </div>
                    <button class="btn btn-secondary" onclick="app.searchHuggingFace()">
                        ← Back to Search
                    </button>
                </div>
            `;
        }
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    // ===== Debug Info =====
    
    async viewDebugInfo() {
        const modal = document.getElementById('debugModal');
        const content = document.getElementById('debugContent');
        
        modal.style.display = 'block';
        content.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top: 15px;">Loading debug information...</p></div>';
        
        try {
            const response = await fetch(`${this.apiBase}/comfyui/last-generation`);
            if (!response.ok) throw new Error('Failed to fetch debug info');
            
            const data = await response.json();
            
            if (!data.timestamp) {
                content.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);"><i class="fas fa-image fa-2x"></i><p style="margin-top: 15px;">No image generation yet</p><p style="font-size: 0.9rem; opacity: 0.7;">Generate an image first to see debug info</p></div>';
                return;
            }
            
            const date = new Date(data.timestamp * 1000);
            const timeStr = date.toLocaleString();
            
            content.innerHTML = `
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                        ${data.success ? '<i class="fas fa-check-circle" style="color: var(--success);"></i> Success' : '<i class="fas fa-times-circle" style="color: var(--error);"></i> Failed'}
                    </h3>
                    <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; font-size: 0.95rem;">
                        <div style="font-weight: 600;">Time:</div>
                        <div>${timeStr}</div>
                        
                        <div style="font-weight: 600;">Persona:</div>
                        <div>${data.persona}</div>
                        
                        <div style="font-weight: 600;">Dimensions:</div>
                        <div>${data.width}x${data.height}</div>
                    </div>
                </div>
                
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 1rem;">
                        <i class="fas fa-comment"></i> Original Prompt
                    </h3>
                    <div style="background: var(--bg-primary); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;">
${data.original_prompt || 'N/A'}</div>
                </div>
                
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 1rem;">
                        <i class="fas fa-magic"></i> Full Prompt (Sent to ComfyUI)
                    </h3>
                    <div style="background: var(--bg-primary); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;">
${data.full_prompt}</div>
                </div>
                
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 1rem;">
                        <i class="fas fa-ban"></i> Negative Prompt
                    </h3>
                    <div style="background: var(--bg-primary); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; max-height: 150px; overflow-y: auto;">
${data.negative_prompt}</div>
                </div>
                
                ${data.image_style ? `
                <div style="background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 1rem;">
                        <i class="fas fa-palette"></i> Image Style
                    </h3>
                    <div style="background: var(--bg-primary); padding: 12px; border-radius: 6px; font-family: monospace; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;">
${data.image_style}</div>
                </div>
                ` : ''}
                
                ${data.error ? `
                <div style="background: var(--error-bg, rgba(220, 53, 69, 0.1)); border: 1px solid var(--error); border-radius: 8px; padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; font-size: 1rem; color: var(--error);">
                        <i class="fas fa-exclamation-triangle"></i> Error
                    </h3>
                    <div style="font-family: monospace; font-size: 0.9rem; color: var(--error);">
${data.error}</div>
                </div>
                ` : ''}
            `;
            
        } catch (error) {
            console.error('Error loading debug info:', error);
            content.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--error);">
                    <i class="fas fa-exclamation-circle fa-2x"></i>
                    <p style="margin-top: 15px;">Failed to load debug information</p>
                    <p style="font-size: 0.9rem; opacity: 0.7;">${error.message}</p>
                </div>
            `;
        }
    }
    
    closeDebugModal() {
        document.getElementById('debugModal').style.display = 'none';
    }

    async loadComfyUICheckpoints() {
        try {
            const response = await fetch(`${this.apiBase}/comfyui/checkpoints`);
            if (!response.ok) {
                throw new Error('Failed to load checkpoints');
            }

            const data = await response.json();
            const checkpointSelector = document.getElementById('checkpointSelector');
            const currentCheckpointSpan = document.getElementById('currentCheckpoint');
            
            // Clear existing options
            checkpointSelector.innerHTML = '';
            
            if (data.checkpoints && data.checkpoints.length > 0) {
                // Add checkpoints to dropdown
                data.checkpoints.forEach(checkpoint => {
                    const option = document.createElement('option');
                    option.value = checkpoint;
                    option.textContent = checkpoint;
                    if (checkpoint === data.current) {
                        option.selected = true;
                    }
                    checkpointSelector.appendChild(option);
                });
                
                // Update current checkpoint display
                currentCheckpointSpan.textContent = data.current || 'None';
            } else {
                // No checkpoints found
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No checkpoints found';
                checkpointSelector.appendChild(option);
                currentCheckpointSpan.textContent = 'None found';
            }
            
        } catch (error) {
            console.error('Error loading checkpoints:', error);
            const checkpointSelector = document.getElementById('checkpointSelector');
            const currentCheckpointSpan = document.getElementById('currentCheckpoint');
            
            checkpointSelector.innerHTML = '<option value="">Error loading checkpoints</option>';
            currentCheckpointSpan.textContent = 'Error loading';
            this.showError('Failed to load ComfyUI checkpoints: ' + error.message);
        }
    }

    async setCheckpoint() {
        const checkpointSelector = document.getElementById('checkpointSelector');
        const selectedCheckpoint = checkpointSelector.value;
        
        if (!selectedCheckpoint) {
            this.showError('Please select a checkpoint');
            return;
        }
        
        const setCheckpointBtn = document.getElementById('setCheckpointBtn');
        const originalText = setCheckpointBtn.innerHTML;
        
        try {
            setCheckpointBtn.disabled = true;
            setCheckpointBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Setting...';
            
            const response = await fetch(`${this.apiBase}/comfyui/checkpoint`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    checkpoint: selectedCheckpoint
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to set checkpoint');
            }
            
            const result = await response.json();
            
            // Update current checkpoint display
            document.getElementById('currentCheckpoint').textContent = selectedCheckpoint;
            
            this.showSuccess(`Checkpoint changed to: ${selectedCheckpoint}`);
            
        } catch (error) {
            console.error('Error setting checkpoint:', error);
            this.showError('Failed to set checkpoint: ' + error.message);
        } finally {
            setCheckpointBtn.disabled = false;
            setCheckpointBtn.innerHTML = originalText;
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.unicornAI = new UnicornAI();
    // Make chatManager globally accessible for retry button
    window.chatManager = window.unicornAI;
});
