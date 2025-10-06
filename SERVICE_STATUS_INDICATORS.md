# Service Status Indicators Feature

## Date: October 6, 2025

## Summary
Added real-time visual status indicators for all backend services in the web UI sidebar. Users can now see at a glance which services are online, offline, or being checked.

## Features

### Visual Indicators
Each service shows:
- **🟢 Green dot** (pulsing) - Service is online and responding
- **🔴 Red dot** - Service is offline or not responding  
- **🟡 Yellow dot** (pulsing) - Status check in progress

### Monitored Services
1. **Ollama** - LLM backend (port 11434)
2. **ComfyUI** - Image generation (port 8188)
3. **TTS** - Text-to-Speech (port 5050)

### Auto-Refresh
- Status checks run automatically every 10 seconds
- 3-second timeout per service check
- Non-blocking (services checked independently)

## Implementation

### Frontend Changes

#### HTML (`static/index.html`)
Added status indicators in sidebar:
```html
<div class="status-section">
    <h3>System Status</h3>
    <div class="status-indicator" id="ollamaStatus" title="Ollama LLM Service">
        <i class="fas fa-circle status-dot"></i>
        <span class="status-label">Ollama</span>
    </div>
    <div class="status-indicator" id="comfyuiStatus" title="ComfyUI Image Generation">
        <i class="fas fa-circle status-dot"></i>
        <span class="status-label">ComfyUI</span>
    </div>
    <div class="status-indicator" id="ttsStatus" title="Text-to-Speech Service">
        <i class="fas fa-circle status-dot"></i>
        <span class="status-label">TTS</span>
    </div>
</div>
```

#### CSS (`static/style.css`)
Added status styling:
- `.status-indicator.online` - Green with pulse animation
- `.status-indicator.offline` - Red
- `.status-indicator.checking` - Yellow with faster pulse
- Smooth transitions and tooltips

#### JavaScript (`static/app.js`)
Enhanced `checkSystemStatus()`:
- Checks each service independently
- Uses `AbortSignal.timeout(3000)` for 3s timeout
- Updates indicator class based on response
- Runs every 10 seconds (reduced from 30s for better responsiveness)

Service endpoints checked:
- Ollama: `http://localhost:11434/api/tags`
- ComfyUI: `http://localhost:8188/system_stats`
- TTS: `http://localhost:5050/health`

## User Benefits

1. **Instant Visibility** - See which services are running at a glance
2. **Troubleshooting** - Quickly identify offline services
3. **ComfyUI Monitoring** - Specifically addresses the request to monitor ComfyUI status
4. **Peace of Mind** - Know everything is working before trying to use features

## Usage

### For Users:
1. Open Web UI at http://localhost:8000
2. Hard refresh (Ctrl+Shift+R) to get version 9
3. Look at the sidebar - "System Status" section
4. Watch the dots:
   - Green = Good to go! ✅
   - Red = Service needs restart ❌
   - Yellow = Checking... ⏳

### For Troubleshooting:
If you see a red dot:
```bash
# Restart specific service
cd /home/chris/Documents/Git/Unicorn_Ai

# ComfyUI
cd comfyui && source venv/bin/activate && nohup python main.py --normalvram --listen 0.0.0.0 --port 8188 > ../outputs/logs/comfyui.log 2>&1 &

# TTS
cd tts_service_coqui && source venv/bin/activate && nohup python tts_server.py > ../outputs/logs/tts_service.log 2>&1 &

# Or restart everything
./stop_all.sh && ./start_all.sh
```

## Technical Details

### Status Check Logic
```javascript
async checkServiceStatus(url, elementId, serviceName) {
    const element = document.getElementById(elementId);
    element.className = 'status-indicator checking'; // Yellow
    
    try {
        const response = await fetch(url, { 
            method: 'GET',
            signal: AbortSignal.timeout(3000)
        });
        
        element.className = response.ok 
            ? 'status-indicator online'   // Green
            : 'status-indicator offline';  // Red
    } catch (error) {
        element.className = 'status-indicator offline'; // Red
    }
}
```

### Update Frequency
- Initial check: On page load
- Periodic checks: Every 10 seconds
- Timeout per check: 3 seconds max

### Performance Impact
- Minimal: Only 3 lightweight HTTP requests every 10s
- Non-blocking: Uses async/await
- Efficient: No data parsing, just checks HTTP status

## Files Modified
- `static/index.html` - Added status indicator HTML (v=9)
- `static/style.css` - Added status indicator styling (v=9)
- `static/app.js` - Enhanced status checking logic (v=9)

## Testing
- [x] All services online - all green dots
- [x] ComfyUI offline - red dot for ComfyUI only
- [x] TTS offline - red dot for TTS only
- [x] Multiple services offline - multiple red dots
- [x] Auto-refresh working - dots update every 10s
- [x] Tooltips show on hover
- [x] Pulse animation working

## Future Enhancements
1. Click on indicator to see detailed service info
2. Show service uptime
3. Show last check timestamp
4. Add restart button per service
5. Show VRAM usage for Ollama/ComfyUI
6. Add audio alert when service goes offline
7. Add Telegram bot status indicator

## Related Issues
- Addresses: "can i get an indicator light in webui to see the status of comfyui?"
- Solves: ComfyUI going down unnoticed
- Improves: Overall system monitoring and user awareness
