#!/bin/bash

# Start Coqui TTS Service
# This service runs on port 5050 with Python 3.11

cd "$(dirname "$0")"

echo "=========================================="
echo "Starting Coqui TTS Service (Python 3.11)"
echo "Port: 5050"
echo "=========================================="

source venv/bin/activate
python tts_server.py
