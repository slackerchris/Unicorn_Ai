// ===== Unicorn AI Web App =====
// Phase 6: Web UI Implementation

class UnicornAI {
    constructor() {
        this.apiBase = 'http://localhost:8000';
        this.currentPersona = null;
        this.personas = [];
        this.messages = [];
        this.settings = this.loadSettings();
        this.stats = {
            messageCount: 0,
            responseTimes: []
        };
        
        this.init();
    }

    // ===== Initialization =====
    async init() {
        this.setupElements();
        this.setupEventListeners();
        await this.checkSystemStatus();
        await this.loadPersonas();
        this.applySettings();
        this.startStatusCheck();
    }

    setupElements() {
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.personaSelector = document.getElementById('personaSelector');
        this.deletePersonaBtn = document.getElementById('deletePersonaBtn');
        this.createPersonaBtn = document.getElementById('createPersonaBtn');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        this.voiceModeBtn = document.getElementById('voiceModeBtn');
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
        
        // Create Persona Modal
        this.createPersonaModal = document.getElementById('createPersonaModal');
        this.closeCreatePersonaBtn = document.getElementById('closeCreatePersonaBtn');
        this.cancelCreatePersonaBtn = document.getElementById('cancelCreatePersonaBtn');
        this.createPersonaForm = document.getElementById('createPersonaForm');
        
        // Mobile menu
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
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
        this.deletePersonaBtn.addEventListener('click', () => this.deleteCurrentPersona());
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        this.voiceModeBtn.addEventListener('click', () => this.toggleVoiceMode());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        
        // Settings modal
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.resetSettingsBtn.addEventListener('click', () => this.resetSettings());
        
        // Create Persona modal
        this.closeCreatePersonaBtn.addEventListener('click', () => this.closeCreatePersona());
        this.cancelCreatePersonaBtn.addEventListener('click', () => this.closeCreatePersona());
        this.createPersonaForm.addEventListener('submit', (e) => this.handleCreatePersona(e));
        
        // Mobile menu
        this.mobileMenuBtn.addEventListener('click', () => this.toggleSidebar());
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        
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
    }

    // ===== System Status =====
    async checkSystemStatus() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            if (response.ok) {
                this.updateSystemStatus(true);
            } else {
                this.updateSystemStatus(false);
            }
        } catch (error) {
            this.updateSystemStatus(false);
        }
    }

    updateSystemStatus(isOnline) {
        this.systemStatus.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
        this.systemStatus.innerHTML = `
            <i class="fas fa-circle"></i>
            <span>${isOnline ? 'System Online' : 'System Offline'}</span>
        `;
    }

    startStatusCheck() {
        setInterval(() => this.checkSystemStatus(), 30000); // Check every 30s
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
        
        // Show/hide delete button based on current persona
        const isDefaultPersona = defaultPersonas.includes(this.currentPersona.id);
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
        const personaIcons = {
            'luna': '🌙',
            'nova': '💻',
            'sage': '🧘',
            'alex': '⚡'
        };
        
        const icon = personaIcons[this.currentPersona.id] || '🦄';
        this.currentPersonaInfo.querySelector('.persona-avatar').textContent = icon;
        document.getElementById('currentPersonaName').textContent = this.currentPersona.name;
        document.getElementById('currentPersonaDescription').textContent = this.currentPersona.description;
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
            this.addMessage('ai', data.response, {
                hasImage: data.has_image,
                imagePrompt: data.image_prompt,
                responseTime: responseTime
            });
            
            // Handle voice mode
            if (this.settings.voiceMode) {
                await this.playVoiceResponse(data.response);
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

    addMessage(sender, text, options = {}) {
        const message = {
            sender,
            text,
            timestamp: new Date(),
            ...options
        };
        
        this.messages.push(message);
        this.renderMessage(message);
        
        if (this.settings.autoScroll) {
            this.scrollToBottom();
        }
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
                ${message.hasImage ? `
                    <div class="message-image-placeholder">
                        <p>🖼️ Image: ${message.imagePrompt}</p>
                        <p style="font-size: 0.875rem; color: var(--text-secondary);">
                            (Image generation in progress...)
                        </p>
                    </div>
                ` : ''}
                ${message.responseTime ? `
                    <div class="message-meta">
                        <span>⚡ ${message.responseTime}s</span>
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
    }

    formatMessage(text) {
        // Basic formatting
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
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

    clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
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

    async playVoiceResponse(text) {
        try {
            // Remove image tags from text
            const cleanText = text.replace(/\[IMAGE:.*?\]/g, '');
            
            const response = await fetch(`${this.apiBase}/generate-voice?text=${encodeURIComponent(cleanText)}`);
            if (!response.ok) throw new Error('Failed to generate voice');
            
            const blob = await response.blob();
            const audio = new Audio(URL.createObjectURL(blob));
            audio.play();
        } catch (error) {
            console.error('Error playing voice:', error);
        }
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

    saveSettings() {
        this.settings.temperature = parseFloat(document.getElementById('temperatureSetting').value);
        this.settings.maxTokens = parseInt(document.getElementById('maxTokensSetting').value);
        this.settings.soundEffects = document.getElementById('soundEffectsSetting').checked;
        this.settings.darkMode = document.getElementById('darkModeSetting').checked;
        this.settings.autoScroll = document.getElementById('autoScrollSetting').checked;
        
        this.saveSettingsToStorage();
        this.closeSettings();
        this.addSystemMessage('Settings saved!');
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
    }
    
    // ===== Persona Creation =====
    openCreatePersona() {
        this.createPersonaModal.classList.add('active');
        this.createPersonaForm.reset();
        document.getElementById('personaTemperatureValue').textContent = '0.8';
        document.getElementById('personaMaxTokensValue').textContent = '150';
    }
    
    closeCreatePersona() {
        this.createPersonaModal.classList.remove('active');
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
        const voiceEl = form.querySelector('#personaVoice');
        const temperatureEl = form.querySelector('#personaTemperature');
        const maxTokensEl = form.querySelector('#personaMaxTokens');
        
        // Check if all elements exist
        if (!personaIdEl || !nameEl || !descriptionEl || !traitsEl || !speakingStyleEl || !voiceEl || !temperatureEl || !maxTokensEl) {
            this.showError('Form elements not found. Please refresh the page.');
            console.error('Missing form elements:', {
                personaId: !!personaIdEl,
                name: !!nameEl,
                description: !!descriptionEl,
                traits: !!traitsEl,
                speakingStyle: !!speakingStyleEl,
                voice: !!voiceEl,
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
        const voice = voiceEl.value;
        const temperature = parseFloat(temperatureEl.value);
        const maxTokens = parseInt(maxTokensEl.value);
        
        // Validate ID format
        if (!/^[a-z0-9-]+$/.test(personaId)) {
            this.showError('Persona ID must contain only lowercase letters, numbers, and hyphens');
            return;
        }
        
        // Parse traits
        const traits = traitsInput.split(',').map(t => t.trim()).filter(t => t);
        if (traits.length < 3) {
            this.showError('Please provide at least 3 personality traits');
            return;
        }
        
        // Create persona
        try {
            const response = await fetch(`${this.apiBase}/personas/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: personaId,
                    name: name,
                    description: description,
                    personality_traits: traits,
                    speaking_style: speakingStyle,
                    voice: voice,
                    temperature: temperature,
                    max_tokens: maxTokens
                })
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
            
            // Switch to new persona
            await this.switchPersona(personaId);
            
            // Show success
            this.addSystemMessage(`✨ Created new persona: ${name}!`);
            
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
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.unicornAI = new UnicornAI();
});
