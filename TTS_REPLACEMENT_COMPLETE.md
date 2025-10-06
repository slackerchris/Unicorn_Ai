# TTS System Replacement - Complete! ✅

## Problem
Microsoft Edge TTS API was returning 401 errors (blocked/changed API).

## Solution
Replaced with **Coqui TTS** - a high-quality, local, offline TTS system.

## Implementation Strategy
Created a **separate TTS service** to avoid Python version conflicts:
- **Main Project:** Python 3.12.3 (incompatible with Coqui TTS)
- **TTS Service:** Python 3.11.13 (required by Coqui TTS)

## Architecture

```
┌─────────────────────────────────┐
│   Main Web UI (Python 3.12)    │
│   http://localhost:8000         │
│                                 │
│   - Chat endpoint               │
│   - Voice generation endpoint   │
│   - Memory system               │
│   - Persona management          │
└──────────┬──────────────────────┘
           │
           │ HTTP POST
           │ (text → audio)
           ↓
┌─────────────────────────────────┐
│  TTS Service (Python 3.11)      │
│  http://localhost:5050          │
│                                 │
│  - Coqui TTS (Tacotron2-DDC)    │
│  - Flask server                 │
│  - HiFiGAN vocoder              │
└─────────────────────────────────┘
```

## Files Created

### 1. TTS Service Folder: `tts_service_coqui/`
```
tts_service_coqui/
├── venv/                      # Python 3.11 virtual environment
├── tts_server.py              # Flask TTS service (port 5050)
├── start_tts_service.sh       # Startup script
├── audio_output/              # Generated audio files
├── tts_output.log             # Service logs
└── README.md                  # Documentation
```

### 2. Client Module: `coqui_tts_client.py`
- Async HTTP client for main app
- Methods:
  - `check_health()` - Check if TTS service is running
  - `generate_audio_file()` - Generate and save WAV file
  - `generate_audio_base64()` - Generate and return base64
  - `generate_audio_bytes()` - Generate and return raw bytes

### 3. Updated Files
- `main.py` - Updated `/generate-voice` endpoint to use Coqui TTS
- `start_all_services.sh` - Added TTS service startup
- `stop_services.sh` - Added TTS service shutdown

## TTS Model
**Model:** `tts_models/en/ljspeech/tacotron2-DDC`
- **Quality:** High (22050 Hz sampling rate)
- **Speed:** 1-2 seconds per sentence
- **Language:** English
- **Vocoder:** HiFiGAN v2

## API Endpoints

### TTS Service (Port 5050)

#### Health Check
```bash
curl http://localhost:5050/health
# Response: {"status": "ok", "service": "coqui-tts"}
```

#### Generate Audio (Base64)
```bash
curl -X POST http://localhost:5050/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world!"}'
```

#### Generate Audio (File)
```bash
curl -X POST "http://localhost:5050/generate?return_audio=true" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!"}' \
  --output voice.wav
```

#### Generate to Specific Path
```bash
curl -X POST http://localhost:5050/generate-file \
  -H "Content-Type: application/json" \
  -d '{"text": "Test", "output_path": "/full/path/to/output.wav"}'
```

### Main App (Port 8000)

#### Generate Voice (Public Endpoint)
```bash
curl "http://localhost:8000/generate-voice?text=Hello%20world!" \
  --output voice.wav
```

## Usage

### Start All Services
```bash
./start_all_services.sh
```

This will start:
1. TTS Service (port 5050) - **10-15 seconds to load model**
2. ComfyUI (port 8188) - if installed
3. Main Web UI (port 8000)
4. Telegram Bot

### Start TTS Service Only
```bash
./tts_service_coqui/start_tts_service.sh
```

### Stop All Services
```bash
./stop_services.sh
```

## Testing

### Test TTS Service
```bash
# Health check
curl http://localhost:5050/health

# Generate test audio
curl -X POST "http://localhost:5050/generate?return_audio=true" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test!"}' \
  --output test.wav

# Play audio (Linux)
aplay test.wav
```

### Test Main App Integration
```bash
# Generate voice through main app
curl "http://localhost:8000/generate-voice?text=Hello%20from%20Unicorn%20AI!" \
  --output voice.wav

# Check file
file voice.wav
ls -lh voice.wav
```

## Performance

- **First Start:** 10-15 seconds (model download and loading)
- **Subsequent Starts:** 5-8 seconds (model already cached)
- **Generation Speed:** 1-2 seconds per sentence
- **Audio Quality:** High (22050 Hz, 16-bit PCM)
- **Model Cache:** `~/.local/share/tts/`

## Output

- **Format:** WAV (RIFF WAVE audio)
- **Codec:** Microsoft PCM
- **Bitrate:** 16-bit
- **Sample Rate:** 22050 Hz
- **Channels:** Mono
- **Typical Size:** ~100KB per 3-4 word sentence

## File Locations

### Generated Audio Files
```
outputs/voice_messages/voice_*.wav
```

### Service Logs
```
outputs/logs/tts_service.log       # TTS service logs
outputs/logs/webui.log             # Main app logs
tts_service_coqui/tts_output.log   # Detailed TTS logs
```

## Troubleshooting

### TTS Service Not Running
```bash
# Check if port 5050 is in use
lsof -i :5050

# Start service manually
cd tts_service_coqui
source venv/bin/activate
python tts_server.py
```

### Main App Can't Connect to TTS
```bash
# Test health endpoint
curl http://localhost:5050/health

# Should return: {"status": "ok", "service": "coqui-tts"}
```

### Model Download Issues
Models are auto-downloaded on first use to:
```
~/.local/share/tts/
```

If download fails:
- Check internet connection
- Manually download: `cd tts_service_coqui && source venv/bin/activate && tts --list_models`

### Port 5050 Already in Use
```bash
# Find process
sudo lsof -i :5050

# Kill process
sudo kill -9 <PID>
```

## Advantages Over Edge TTS

| Feature | Edge TTS | Coqui TTS |
|---------|----------|-----------|
| **Reliability** | ❌ API blocked | ✅ Local, always works |
| **Internet** | ⚠️ Required | ✅ Offline capable |
| **Quality** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Speed** | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Privacy** | ❌ Cloud service | ✅ 100% local |
| **Cost** | ⚠️ MS controlled | ✅ Free forever |
| **Voices** | Many | Fewer (but extensible) |
| **Control** | ❌ None | ✅ Full control |

## Future Enhancements

Possible improvements:
- **Multi-language support** - Install additional language models
- **Voice cloning** - Train custom voices
- **Multiple voice options** - Per-persona voice selection
- **Faster models** - Switch to FastSpeech2 or VITS
- **GPU acceleration** - Use CUDA for faster generation
- **Voice effects** - Pitch, speed, emotion modulation

## Status: ✅ COMPLETE

Voice TTS is now:
- ✅ **Working** - Generates high-quality audio
- ✅ **Reliable** - No external API dependencies
- ✅ **Local** - Runs offline on your machine
- ✅ **Integrated** - Main app and Telegram ready
- ✅ **Documented** - Full setup and usage guides

---

**Date:** October 5, 2025  
**Python Versions:** Main (3.12.3), TTS Service (3.11.13)  
**TTS Model:** Coqui TTS - Tacotron2-DDC + HiFiGAN v2  
**Status:** Production Ready ✅
