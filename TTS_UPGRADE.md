# TTS Service Upgrade - Edge TTS → Coqui TTS

**Date:** October 5, 2025  
**Status:** ✅ Complete and Working

---

## Problem

Microsoft Edge TTS API was returning **401 errors** - the service became unreliable/blocked.

```
Voice generation failed: All voices failed: no token provided
```

---

## Solution

Replaced Edge TTS with **Coqui TTS** - a local, open-source TTS system.

### Why Coqui TTS?

- ✅ **Local** - No external API dependencies
- ✅ **High Quality** - Natural sounding voices
- ✅ **Offline** - Works without internet
- ✅ **Open Source** - Free and reliable
- ✅ **Fast** - 1-2 seconds per sentence

---

## Architecture

### Old System (Broken)
```
Web UI → Main App (port 8000) → Edge TTS API (Microsoft) → ❌ 401 Error
```

### New System (Working)
```
Web UI → Main App (port 8000) → TTS Service (port 5050) → Coqui TTS → ✅ Audio
         Python 3.12                  Python 3.11          Local Model
```

---

## Implementation Details

### Separate TTS Service

**Why separate?**
- Coqui TTS requires Python <3.12
- Main project uses Python 3.12.3
- Isolation prevents breaking main project

### Files Created

1. **`tts_service_coqui/`** - Standalone TTS service
   - `venv/` - Python 3.11 virtual environment
   - `tts_server.py` - Flask server (port 5050)
   - `start_tts_service.sh` - Startup script
   - `README.md` - Documentation
   - `audio_output/` - Generated audio files

2. **`coqui_tts_client.py`** - Client library for main app
   - `CoquiTTSClient` class
   - Health check, audio generation methods

### Files Modified

1. **`main.py`**
   - Added `coqui_tts_client` import
   - Updated `/generate-voice` endpoint
   - Now uses absolute paths for audio files

2. **`start_all_services.sh`**
   - Added TTS service startup (step 1)
   - Now starts: TTS → ComfyUI → API → Telegram

3. **`stop_services.sh`**
   - Already handles TTS PID from pids.txt

---

## Usage

### Start TTS Service Alone
```bash
./tts_service_coqui/start_tts_service.sh
```

### Start All Services (Recommended)
```bash
./start_all_services.sh
```

This starts:
1. **TTS Service** (port 5050) - First, to load model
2. **ComfyUI** (port 8188) - Image generation
3. **API Backend** (port 8000) - Main app
4. **Telegram Bot** - Chat interface

### Test TTS Service

```bash
# Health check
curl http://localhost:5050/health

# Generate audio
curl -X POST "http://localhost:5050/generate?return_audio=true" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from Unicorn AI!"}' \
  --output test.wav
```

### Test via Web UI

1. Open http://localhost:8000
2. Click the 🔊 Voice button (toggle on)
3. Send a message
4. Audio plays automatically!

---

## Technical Specs

### TTS Model
- **Model:** `tts_models/en/ljspeech/tacotron2-DDC`
- **Quality:** High (LJSpeech dataset)
- **Language:** English
- **Speed:** ~1-2 seconds per sentence
- **Format:** WAV (16-bit, 22050 Hz)

### Python Environments

**Main App** (`venv/`)
- Python: 3.12.3
- FastAPI, Ollama, ChromaDB, etc.

**TTS Service** (`tts_service_coqui/venv/`)
- Python: 3.11.13
- Coqui TTS, Flask, torch, etc.

---

## API Endpoints

### TTS Service (Port 5050)

#### `GET /health`
Health check
```bash
curl http://localhost:5050/health
```

#### `POST /generate`
Generate audio (returns base64 or file)
```bash
curl -X POST http://localhost:5050/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'
```

#### `POST /generate-file`
Generate audio to specific path
```bash
curl -X POST http://localhost:5050/generate-file \
  -H "Content-Type: application/json" \
  -d '{"text": "Test", "output_path": "/full/path.wav"}'
```

### Main App (Port 8000)

#### `GET /generate-voice?text=...`
Generate voice via main app (uses TTS service internally)
```bash
curl "http://localhost:8000/generate-voice?text=Hello!" \
  --output voice.wav
```

---

## File Locations

### Audio Output
- **TTS Service:** `tts_service_coqui/audio_output/`
- **Main App:** `outputs/voice_messages/`

### Logs
- **TTS Service:** `outputs/logs/tts_service.log`
- **Main App:** `outputs/logs/api.log`

---

## Testing Results

### ✅ TTS Service
```bash
$ curl -X POST "http://localhost:5050/generate?return_audio=true" \
  -H "Content-Type: application/json" \
  -d '{"text": "Testing Coqui TTS!"}' \
  --output test.wav

$ ls -lh test.wav
-rw-rw-r-- 1 chris chris 97K Oct  5 [TIME] test.wav

$ file test.wav
test.wav: RIFF (little-endian) data, WAVE audio, Microsoft PCM, 16 bit, mono 22050 Hz
```

### ✅ Main App Integration
```bash
$ curl "http://localhost:8000/generate-voice?text=Testing%20Unicorn%20AI%20voice!" \
  --output /tmp/unicorn_final.wav

$ ls -lh /tmp/unicorn_final.wav
-rw-rw-r-- 1 chris chris 104K Oct  5 [TIME] /tmp/unicorn_final.wav
```

### ✅ Web UI
- Voice button (🔊) works
- Audio plays automatically when enabled
- No more 401 errors!

---

## Troubleshooting

### TTS Service Not Running
```bash
# Check if running
curl http://localhost:5050/health

# Start it
./tts_service_coqui/start_tts_service.sh

# Check logs
tail -f outputs/logs/tts_service.log
```

### Port 5050 Already in Use
```bash
# Find what's using it
sudo lsof -i :5050

# Kill it
sudo kill -9 <PID>
```

### Web UI Still Uses Old TTS
```bash
# Restart main app
pkill -f "python main.py"
./start_all_services.sh
```

### Model Loading Takes Time
First startup takes 10-15 seconds to load the model into memory. Be patient!

---

## Performance

- **Cold Start:** 10-15 seconds (model loading)
- **Warm Generation:** 1-2 seconds per sentence
- **Memory Usage:** ~1.5 GB (model in RAM)
- **Audio Quality:** High (comparable to commercial TTS)

---

## Future Improvements

### Possible Enhancements
- [ ] Multiple voices/speakers
- [ ] Multi-language support
- [ ] Voice cloning
- [ ] Faster models (speedyspeech)
- [ ] Streaming audio generation

### Alternative Models

See available models:
```bash
cd tts_service_coqui
source venv/bin/activate
python -c "from TTS.api import TTS; print('\n'.join(TTS().list_models()))"
```

To change model, edit `tts_server.py` line 17:
```python
tts = TTS(model_name="your_model_here")
```

---

## Summary

| Metric | Edge TTS (Old) | Coqui TTS (New) |
|--------|----------------|-----------------|
| **Status** | ❌ Broken (401) | ✅ Working |
| **Dependency** | Microsoft API | Local |
| **Internet** | Required | Not required |
| **Quality** | Good | High |
| **Speed** | Fast | Fast (1-2s) |
| **Reliability** | Unreliable | Reliable |
| **Cost** | Free | Free |

---

## Conclusion

✅ **Voice TTS is now working with Coqui TTS!**

- No more Microsoft API errors
- Local and reliable
- High quality audio
- Web UI voice button functional
- Easy to maintain

The system is ready for voice interactions! 🎉🔊
