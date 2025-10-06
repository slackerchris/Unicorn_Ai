# ComfyUI Keep-Alive Issue - October 6, 2025

## Problem
ComfyUI keeps stopping unexpectedly, particularly when restarting the main API server.

## Root Cause
Both the main API (`main.py`) and ComfyUI (`comfyui/main.py`) are Python processes running `main.py`. When using generic `pkill -f "python main.py"` commands, **both processes get killed** instead of just the intended one.

### Why This Happens:
```bash
# Process list shows:
python main.py              # ← Main API server
python main.py --listen ... # ← ComfyUI server

# Generic kill command kills BOTH:
pkill -f "python main.py"   # ❌ Kills both!
```

## Solution

### 1. Service Manager Script (`service.sh`)
Created a dedicated service management script that can start/stop/restart individual services safely.

**Features:**
- ✅ Precise process targeting (distinguishes API from ComfyUI)
- ✅ Individual service control
- ✅ Status checking for all services
- ✅ Port status verification

**Usage:**
```bash
# Check status
./service.sh status

# Restart only API (won't kill ComfyUI)
./service.sh restart api

# Restart only ComfyUI
./service.sh restart comfyui

# Start/stop individual services
./service.sh start tts
./service.sh stop telegram
```

### 2. Process Detection
**API Server Detection:**
```bash
ps aux | grep "python main.py" | grep -v comfyui | grep -v grep
```
- Looks for `main.py` BUT excludes comfyui directory

**ComfyUI Detection:**
```bash
ps aux | grep "python main.py.*8188" | grep -v grep
```
- Looks for `main.py` WITH port 8188 (unique to ComfyUI)

### 3. Safe Process Termination
**Stop API Only:**
```bash
ps aux | grep "python main.py" | grep -v comfyui | grep -v grep | awk '{print $2}' | xargs -r kill
```

**Stop ComfyUI Only:**
```bash
ps aux | grep "python main.py.*8188" | grep -v grep | awk '{print $2}' | xargs -r kill
```

## Commands Reference

### Old Way (Problematic):
```bash
# ❌ This kills BOTH API and ComfyUI
pkill -f "python main.py"
```

### New Way (Correct):
```bash
# ✅ Restart only API server
./service.sh restart api

# ✅ Restart only ComfyUI
./service.sh restart comfyui

# ✅ Check what's running
./service.sh status
```

## Service Manager Commands

### Status
```bash
./service.sh status
```
Shows:
- API Server status
- ComfyUI status
- TTS Service status
- Telegram Bot status
- Port availability (8000, 8188, 5050)

### Start Services
```bash
./service.sh start api       # Start API server
./service.sh start comfyui   # Start ComfyUI
./service.sh start tts       # Start TTS service
./service.sh start telegram  # Start Telegram bot
./service.sh start all       # Start all services
```

### Stop Services
```bash
./service.sh stop api        # Stop API server only
./service.sh stop comfyui    # Stop ComfyUI only
./service.sh stop tts        # Stop TTS service
./service.sh stop telegram   # Stop Telegram bot
./service.sh stop all        # Stop all services
```

### Restart Services
```bash
./service.sh restart api       # Restart API server only
./service.sh restart comfyui   # Restart ComfyUI only
./service.sh restart tts       # Restart TTS service
./service.sh restart telegram  # Restart Telegram bot
```

## Why ComfyUI Was Going Down

### Previous Issue Chain:
1. Make changes to `main.py` (API code)
2. Run `pkill -f "python main.py"` to restart API
3. **Both API AND ComfyUI get killed** 
4. Only restart API
5. ComfyUI is now down ❌

### Fixed Workflow:
1. Make changes to `main.py` (API code)
2. Run `./service.sh restart api`
3. **Only API gets killed and restarted**
4. ComfyUI keeps running ✅

## Best Practices

### Development Workflow:
```bash
# 1. Start all services once
./service.sh start all

# 2. When editing code, restart only what changed:
./service.sh restart api      # After editing main.py
./service.sh restart comfyui  # After editing ComfyUI settings

# 3. Check status anytime:
./service.sh status
```

### After Git Pull:
```bash
# Restart all services to load new code
./service.sh restart all
```

### Quick Fixes:
```bash
# If ComfyUI is down:
./service.sh start comfyui

# If API is slow:
./service.sh restart api
```

## Files Modified
- ✅ `service.sh` - New service manager script
- ✅ Made executable with `chmod +x`

## Status
🎉 **FIXED** - ComfyUI and API now managed independently with precise control.

## Future Improvements
Consider implementing:
- Systemd service files for automatic restart on crash
- Health check monitoring with auto-recovery
- Log rotation for service logs
- Process supervision (supervisord or PM2)
