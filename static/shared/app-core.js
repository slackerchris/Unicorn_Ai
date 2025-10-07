// ===== Unicorn AI Core - Shared Business Logic =====
// This contains all API calls, data management, and business logic
// UI-specific code is in desktop-ui.js and mobile-ui.js

class UnicornAICore {
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
        this.sessions = this.loadSessions();
        this.currentSessionId = this.getCurrentSessionId();
        this.sessionId = this.currentSessionId;
        this.memoryEnabled = true;
        this.currentAudio = null;
        this.editingPersonaId = null;
        this.availableModels = [];
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
        return this.createNewSession();
    }

    createNewSession() {
        const sessionId = 'web_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const session = {
            id: sessionId,
            name: `Chat ${this.sessions.length + 1}`,
            created: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            messageCount: 0,
            personaId: this.currentPersona?.id || 'luna'
        };
        this.sessions.push(session);
        this.saveSessions();
        localStorage.setItem('unicornAI_currentSession', sessionId);
        return sessionId;
    }

    switchToSession(sessionId) {
        // Save current chat before switching
        if (this.currentSessionId) {
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
        
        // Load session's persona
        const session = this.sessions.find(s => s.id === sessionId);
        if (session && session.personaId) {
            const persona = this.personas.find(p => p.id === session.personaId);
            if (persona) {
                this.currentPersona = persona;
                // UI will be updated by the UI-specific classes
            }
        }
        
        // Load chat history for this session
        this.loadChatHistory();
        this.renderSessionsList();
        this.updatePersonaDisplay();
        this.renderMessages();
    }

    deleteSession(sessionId) {
        if (this.sessions.length <= 1) {
            this.showError('Cannot delete the last session');
            return;
        }
        
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        this.saveSessions();
        
        // Clean up chat history
        localStorage.removeItem(`unicornAI_chat_${sessionId}`);
        
        // If deleting current session, switch to another
        if (sessionId === this.currentSessionId) {
            const newSession = this.sessions[0];
            this.switchToSession(newSession.id);
        }
        
        this.renderSessionsList();
    }

    // ===== Settings Management =====
    loadSettings() {
        try {
            const settingsData = localStorage.getItem('unicornAI_settings');
            const defaultSettings = {
                theme: 'dark',
                soundEffects: true,
                voiceResponses: false,
                autoVoice: false,
                streamingMode: false,
                temperature: 0.8,
                maxTokens: 2000,
                memoryEnabled: true
            };
            return settingsData ? { ...defaultSettings, ...JSON.parse(settingsData) } : defaultSettings;
        } catch (error) {
            console.error('Error loading settings:', error);
            return {
                theme: 'dark',
                soundEffects: true,
                voiceResponses: false,
                autoVoice: false,
                streamingMode: false,
                temperature: 0.8,
                maxTokens: 2000,
                memoryEnabled: true
            };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('unicornAI_settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    // ===== Chat History Management =====
    loadChatHistory() {
        try {
            const historyData = localStorage.getItem(`unicornAI_chat_${this.currentSessionId}`);
            this.messages = historyData ? JSON.parse(historyData) : [];
        } catch (error) {
            console.error('Error loading chat history:', error);
            this.messages = [];
        }
    }

    saveChatHistory() {
        try {
            localStorage.setItem(`unicornAI_chat_${this.currentSessionId}`, JSON.stringify(this.messages));
            
            // Update session info
            const session = this.sessions.find(s => s.id === this.currentSessionId);
            if (session) {
                session.lastUpdated = new Date().toISOString();
                session.messageCount = this.messages.length;
                this.saveSessions();
            }
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    clearChat() {
        this.messages = [];
        this.saveChatHistory();
        this.renderMessages();
        this.addSystemMessage('Chat cleared');
    }

    // ===== API Calls =====
    async checkSystemStatus() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            const data = await response.json();
            this.updateSystemStatus(data.status === 'healthy');
            return data;
        } catch (error) {
            console.error('System health check failed:', error);
            this.updateSystemStatus(false);
            return { status: 'error' };
        }
    }

    async loadPersonas() {
        try {
            const response = await fetch(`${this.apiBase}/personas`);
            if (!response.ok) throw new Error('Failed to load personas');
            
            const data = await response.json();
            this.personas = data.personas || [];
            
            // Set default persona if none selected
            if (!this.currentPersona && this.personas.length > 0) {
                this.currentPersona = this.personas.find(p => p.id === 'luna') || this.personas[0];
            }
            
            this.updatePersonaSelector();
            this.updatePersonaDisplay();
            
        } catch (error) {
            console.error('Error loading personas:', error);
            this.showError('Failed to load personas');
        }
    }

    async loadAvailableModels() {
        try {
            const response = await fetch(`${this.apiBase}/ollama/models`);
            if (!response.ok) throw new Error('Failed to load models');
            
            const data = await response.json();
            this.availableModels = data.models || [];
            
        } catch (error) {
            console.error('Error loading models:', error);
            this.availableModels = [];
        }
    }

    async switchPersona(personaId) {
        const persona = this.personas.find(p => p.id === personaId);
        if (!persona) {
            console.error('Persona not found:', personaId);
            return;
        }
        
        this.currentPersona = persona;
        this.updatePersonaDisplay();
        
        // Update current session's persona
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (session) {
            session.personaId = personaId;
            this.saveSessions();
        }
        
        this.addSystemMessage(`Switched to ${persona.name} 🎭`);
        
        if (this.settings.soundEffects) {
            this.playSound('message');
        }
    }

    async sendMessage(content, imageData = null) {
        const startTime = Date.now();
        
        // Add user message
        const userMessage = {
            id: Date.now(),
            role: 'user',
            content: content,
            timestamp: new Date().toISOString(),
            image: imageData
        };
        
        this.messages.push(userMessage);
        this.renderMessages();
        this.saveChatHistory();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            const payload = {
                message: content,
                persona_id: this.currentPersona?.id || 'luna',
                session_id: this.sessionId,
                stream: this.settings.streamingMode,
                memory_enabled: this.memoryEnabled
            };
            
            if (imageData) {
                payload.image = imageData;
            }
            
            const response = await fetch(`${this.apiBase}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to send message');
            }
            
            // Handle streaming response
            if (this.settings.streamingMode && response.body) {
                await this.handleStreamingResponse(response);
            } else {
                const data = await response.json();
                this.addAssistantMessage(data);
            }
            
            // Update stats
            const responseTime = Date.now() - startTime;
            this.stats.responseTimes.push(responseTime);
            this.stats.messageCount++;
            this.updateStats();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addSystemMessage(`❌ Error: ${error.message}`);
        } finally {
            this.hideTypingIndicator();
        }
    }

    async handleStreamingResponse(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = null;
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const text = decoder.decode(value);
                const lines = text.split('\\n').filter(line => line.trim());
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            
                            if (data.type === 'message_start') {
                                assistantMessage = {
                                    id: Date.now(),
                                    role: 'assistant',
                                    content: '',
                                    timestamp: new Date().toISOString(),
                                    persona: this.currentPersona
                                };
                                this.messages.push(assistantMessage);
                            } else if (data.type === 'content_delta' && assistantMessage) {
                                assistantMessage.content += data.content;
                                this.renderMessages();
                            } else if (data.type === 'message_end') {
                                this.saveChatHistory();
                                if (this.settings.autoVoice && assistantMessage) {
                                    this.speakMessage(assistantMessage.content);
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing streaming data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error reading stream:', error);
            if (assistantMessage) {
                this.saveChatHistory();
            }
        }
    }

    addAssistantMessage(responseData) {
        const message = {
            id: Date.now(),
            role: 'assistant',
            content: responseData.response,
            timestamp: new Date().toISOString(),
            persona: this.currentPersona,
            image_url: responseData.image_url,
            has_image: responseData.has_image
        };
        
        this.messages.push(message);
        this.renderMessages();
        this.saveChatHistory();
        
        if (this.settings.autoVoice) {
            this.speakMessage(responseData.response);
        }
        
        if (this.settings.soundEffects) {
            this.playSound('message');
        }
    }

    addSystemMessage(content) {
        const message = {
            id: Date.now(),
            role: 'system',
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.messages.push(message);
        this.renderMessages();
        this.saveChatHistory();
    }

    // ===== Voice Functions =====
    async speakMessage(text) {
        if (!this.settings.voiceResponses || !this.currentPersona?.voice) return;
        
        try {
            // Stop any currently playing audio
            if (this.currentAudio) {
                this.currentAudio.pause();
                this.currentAudio = null;
            }
            
            const response = await fetch(`${this.apiBase}/tts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: text,
                    voice: this.currentPersona.voice
                })
            });
            
            if (!response.ok) throw new Error('TTS request failed');
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            this.currentAudio = new Audio(audioUrl);
            this.currentAudio.play();
            
            this.currentAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                this.currentAudio = null;
            };
            
        } catch (error) {
            console.error('Error with TTS:', error);
        }
    }

    toggleVoiceMode() {
        this.settings.voiceResponses = !this.settings.voiceResponses;
        this.saveSettings();
        this.updateVoiceModeButton();
        
        const status = this.settings.voiceResponses ? 'enabled' : 'disabled';
        this.addSystemMessage(`🔊 Voice responses ${status}`);
    }

    toggleMemoryMode() {
        this.memoryEnabled = !this.memoryEnabled;
        this.settings.memoryEnabled = this.memoryEnabled;
        this.saveSettings();
        this.updateMemoryModeButton();
        
        const status = this.memoryEnabled ? 'enabled' : 'disabled';
        this.addSystemMessage(`🧠 Memory ${status}`);
    }

    // ===== Persona Management =====
    async createPersona(personaData) {
        try {
            const response = await fetch(`${this.apiBase}/personas/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(personaData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to create persona');
            }
            
            await this.loadPersonas();
            return true;
            
        } catch (error) {
            console.error('Error creating persona:', error);
            this.showError(error.message);
            return false;
        }
    }

    async updatePersona(personaId, personaData) {
        try {
            const response = await fetch(`${this.apiBase}/personas/${personaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(personaData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to update persona');
            }
            
            await this.loadPersonas();
            return true;
            
        } catch (error) {
            console.error('Error updating persona:', error);
            this.showError(error.message);
            return false;
        }
    }

    async deletePersona(personaId) {
        try {
            const response = await fetch(`${this.apiBase}/personas/${personaId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Failed to delete persona');
            }
            
            await this.loadPersonas();
            return true;
            
        } catch (error) {
            console.error('Error deleting persona:', error);
            this.showError(error.message);
            return false;
        }
    }

    // ===== Utility Functions =====
    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.textContent = message;
        errorEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            max-width: 400px;
            background: var(--error-color);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(errorEl);
        
        setTimeout(() => {
            if (errorEl.parentNode) {
                errorEl.remove();
            }
        }, 5000);
    }

    playSound(type) {
        if (!this.settings.soundEffects) return;
        
        try {
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
        } catch (error) {
            console.error('Error playing sound:', error);
        }
    }

    // ===== Placeholder methods for UI-specific implementations =====
    // These will be implemented by the UI-specific classes
    renderMessages() { /* Implemented by UI classes */ }
    renderSessionsList() { /* Implemented by UI classes */ }
    updatePersonaSelector() { /* Implemented by UI classes */ }
    updatePersonaDisplay() { /* Implemented by UI classes */ }
    updateSystemStatus(isHealthy) { /* Implemented by UI classes */ }
    updateStats() { /* Implemented by UI classes */ }
    updateVoiceModeButton() { /* Implemented by UI classes */ }
    updateMemoryModeButton() { /* Implemented by UI classes */ }
    showTypingIndicator() { /* Implemented by UI classes */ }
    hideTypingIndicator() { /* Implemented by UI classes */ }
}

// Export for use by UI classes
window.UnicornAICore = UnicornAICore;