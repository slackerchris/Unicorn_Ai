# Coqui TTS Service

Standalone Text-to-Speech service using Coqui TTS with Python 3.11.

## Why Separate Service?

- **Python Version:** Coqui TTS requires Python <3.12, but main project uses Python 3.12.3
- **Isolation:** Keeps TTS dependencies separate from main project
- **Reliability:** Microsoft Edge TTS API was unreliable (401 errors), Coqui TTS runs locally

## Architecture

```
┌─────────────────┐       HTTP POST      ┌──────────────────┐
│   Main App      │ ──────────────────> │  TTS Service     │
│  (Python 3.12)  │  localhost:5050     │  (Python 3.11)   │
│  Port 8000      │ <────────────────── │  Port 5050       │
└─────────────────┘    Audio Files       └──────────────────┘
```

## Installation

Already installed! The setup is complete with:
- Python 3.11 virtual environment
- Coqui TTS and all dependencies
- Flask server

## Usage

### Start TTS Service

```bash
# From project root
./tts_service_coqui/start_tts_service.sh
```

Or manually:
```bash
cd tts_service_coqui
source venv/bin/activate
python tts_server.py
```

The service will start on **port 5050**.

### Endpoints

#### Health Check
```bash
curl http://localhost:5050/health
```

#### Generate Audio (Base64)
```bash
curl -X POST http://localhost:5050/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test!"}'
```

#### Generate Audio (Direct File)
```bash
curl -X POST "http://localhost:5050/generate?return_audio=true" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world!"}' \
  --output test.wav
```

#### Generate to Specific Path
```bash
curl -X POST http://localhost:5050/generate-file \
  -H "Content-Type: application/json" \
  -d '{"text": "Test", "output_path": "/tmp/my_audio.wav"}'
```

#### List Available Models
```bash
curl http://localhost:5050/list-models
```

## TTS Models

Currently using: **tts_models/en/ljspeech/tacotron2-DDC**
- Good quality
- Fast generation
- English only

### Other Available Models

To see all available models:
```bash
cd tts_service_coqui
source venv/bin/activate
python -c "from TTS.api import TTS; print('\n'.join(TTS().list_models()))"
```

To change the model, edit `tts_server.py` line 17:
```python
tts = TTS(model_name="your_model_name_here")
```

## Integration with Main App

The main app uses `coqui_tts_client.py` to communicate with this service:

```python
from coqui_tts_client import coqui_tts_client

# Check if service is running
if await coqui_tts_client.check_health():
    # Generate audio
    result = await coqui_tts_client.generate_audio_file(
        text="Hello world",
        output_path="/path/to/output.wav"
    )
```

## Troubleshooting

### TTS Service Not Running
```bash
# Check if service is running
curl http://localhost:5050/health

# If not, start it
./tts_service_coqui/start_tts_service.sh
```

### Port 5050 Already in Use
```bash
# Find what's using it
sudo lsof -i :5050

# Kill the process
sudo kill -9 <PID>
```

### Model Download Issues
Models are downloaded automatically on first use. If download fails:
- Check internet connection
- Models are cached in `~/.local/share/tts/`
- Try manually downloading: `tts --list_models`

## Output Directory

Audio files are saved to: `tts_service_coqui/audio_output/`

## Performance

- **First run:** Model loads (5-10 seconds)
- **Generation:** ~1-2 seconds per sentence
- **Quality:** High (22050 Hz sampling rate)

## Python Version

This service **MUST** use Python 3.11 due to Coqui TTS dependency constraints.

Main project uses Python 3.12.3 - they are isolated via separate virtual environments.
