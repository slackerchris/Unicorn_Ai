#!/bin/bash
# Service Monitor - Checks and restarts services if they're down
# Run this periodically with cron or as a systemd timer

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_FILE="outputs/logs/monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check ComfyUI
if ! curl -s http://localhost:8188/system_stats > /dev/null 2>&1; then
    log "⚠️  ComfyUI is down, restarting..."
    
    # Kill any stuck processes
    pkill -f "comfyui.*main.py" 2>/dev/null
    sleep 2
    
    # Start ComfyUI
    cd comfyui
    if [ -d "venv" ]; then
        source venv/bin/activate
        nohup python main.py --normalvram --listen 0.0.0.0 --port 8188 > ../outputs/logs/comfyui.log 2>&1 &
        log "✅ ComfyUI restarted (PID: $!)"
    else
        log "❌ ComfyUI venv not found"
    fi
    cd ..
else
    log "✓ ComfyUI is running"
fi

# Check TTS Service
if ! curl -s http://localhost:5050/health > /dev/null 2>&1; then
    log "⚠️  TTS Service is down, restarting..."
    
    # Kill any stuck processes
    pkill -f "tts_server.py" 2>/dev/null
    sleep 2
    
    # Start TTS
    cd tts_service_coqui
    if [ -d "venv" ]; then
        source venv/bin/activate
        nohup python tts_server.py > ../outputs/logs/tts_service.log 2>&1 &
        log "✅ TTS Service restarted (PID: $!)"
        deactivate
    else
        log "❌ TTS venv not found"
    fi
    cd ..
else
    log "✓ TTS Service is running"
fi

# Check Web UI
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    log "⚠️  Web UI is down, restarting..."
    
    # Kill any stuck processes
    pkill -f "python.*main.py" 2>/dev/null
    sleep 2
    
    # Start Web UI
    if [ -d "venv" ]; then
        source venv/bin/activate
        nohup python main.py > outputs/logs/webui.log 2>&1 &
        log "✅ Web UI restarted (PID: $!)"
    else
        nohup python3 main.py > outputs/logs/webui.log 2>&1 &
        log "✅ Web UI restarted (PID: $!)"
    fi
else
    log "✓ Web UI is running"
fi

# Check Ollama
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    log "⚠️  Ollama is down, please start it manually: systemctl start ollama"
else
    log "✓ Ollama is running"
fi

log "=== Monitoring check complete ==="
