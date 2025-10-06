# Systemd Service Setup for Unicorn AI

This sets up Unicorn AI to run 24/7 with automatic restart on failure and start on boot.

## Installation

1. **Stop any manually running services:**
```bash
./stop_all.sh
```

2. **Install systemd services:**
```bash
./install_systemd.sh
```

3. **Start all services:**
```bash
sudo systemctl start unicorn-tts unicorn-comfyui unicorn-api unicorn-telegram
```

4. **Check status:**
```bash
sudo systemctl status unicorn-*
```

## Service Management

### Start/Stop Individual Services
```bash
sudo systemctl start unicorn-tts      # TTS service
sudo systemctl start unicorn-comfyui  # Image generation
sudo systemctl start unicorn-api      # Main API
sudo systemctl start unicorn-telegram # Telegram bot

sudo systemctl stop unicorn-tts
sudo systemctl stop unicorn-comfyui
sudo systemctl stop unicorn-api
sudo systemctl stop unicorn-telegram
```

### Start/Stop All Services
```bash
sudo systemctl start unicorn-*
sudo systemctl stop unicorn-*
sudo systemctl restart unicorn-*
```

### Check Service Status
```bash
sudo systemctl status unicorn-*           # All services
sudo systemctl status unicorn-api         # Just API
sudo systemctl status unicorn-telegram    # Just Telegram
```

### View Logs
```bash
# Real-time logs
sudo journalctl -u unicorn-api -f
sudo journalctl -u unicorn-telegram -f
sudo journalctl -u unicorn-tts -f
sudo journalctl -u unicorn-comfyui -f

# Last 100 lines
sudo journalctl -u unicorn-api -n 100
```

### Enable/Disable Auto-start on Boot
```bash
# Enable (default after install)
sudo systemctl enable unicorn-tts
sudo systemctl enable unicorn-comfyui
sudo systemctl enable unicorn-api
sudo systemctl enable unicorn-telegram

# Disable
sudo systemctl disable unicorn-tts
sudo systemctl disable unicorn-comfyui
sudo systemctl disable unicorn-api
sudo systemctl disable unicorn-telegram
```

## What Each Service Does

- **unicorn-tts** (port 5050): Coqui TTS voice generation
- **unicorn-comfyui** (port 8188): SDXL image generation
- **unicorn-api** (port 8000): Main FastAPI backend + Web UI
- **unicorn-telegram**: Telegram bot interface

## Features

- ✅ **Auto-restart**: If a service crashes, systemd restarts it automatically (10 second delay)
- ✅ **Start on boot**: Services start when system boots
- ✅ **Dependency management**: API waits for TTS/ComfyUI, Telegram waits for API
- ✅ **Proper logging**: All logs go to `outputs/logs/` and systemd journal
- ✅ **Process management**: systemd handles all process lifecycle

## Troubleshooting

### Service won't start
```bash
# Check detailed status
sudo systemctl status unicorn-api

# Check logs
sudo journalctl -u unicorn-api -n 50

# Test manually
cd /home/chris/Documents/Git/Unicorn_Ai
source venv/bin/activate
python main.py  # Should show any errors
```

### Service keeps restarting
```bash
# Check what's failing
sudo journalctl -u unicorn-api -f

# Common issues:
# - Port already in use (kill old process)
# - Missing dependencies (reinstall requirements)
# - Permission issues (check file ownership)
```

### Uninstall systemd services
```bash
sudo systemctl stop unicorn-*
sudo systemctl disable unicorn-*
sudo rm /etc/systemd/system/unicorn-*.service
sudo systemctl daemon-reload
```

## Manual Control (Alternative)

If you want to stop using systemd and go back to manual control:

```bash
# Disable and stop all services
sudo systemctl stop unicorn-*
sudo systemctl disable unicorn-*

# Use manual scripts
./start_all_services.sh
./stop_services.sh
```
