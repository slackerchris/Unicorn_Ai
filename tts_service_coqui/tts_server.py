#!/usr/bin/env python3
"""
Standalone TTS Service using Coqui TTS
Runs on port 5050, accepts text and returns audio
"""
import os
import json
import base64
from pathlib import Path
from flask import Flask, request, jsonify, send_file
from TTS.api import TTS

app = Flask(__name__)

# Initialize TTS model
# Using tts_models/en/ljspeech/tacotron2-DDC (good quality, fast)
print("Loading TTS model...")
tts = TTS(model_name="tts_models/en/ljspeech/tacotron2-DDC")
print("TTS model loaded!")

# Output directory for audio files
OUTPUT_DIR = Path(__file__).parent / "audio_output"
OUTPUT_DIR.mkdir(exist_ok=True)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "service": "coqui-tts"})

@app.route('/generate', methods=['POST'])
def generate_audio():
    """
    Generate audio from text
    
    Request JSON:
    {
        "text": "Text to convert to speech",
        "filename": "optional_custom_name.wav"
    }
    
    Returns:
    - Audio file (if return_audio=true in params)
    - Or JSON with base64 encoded audio
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Generate unique filename
        filename = data.get('filename', f"tts_{hash(text)}.wav")
        if not filename.endswith('.wav'):
            filename += '.wav'
        
        output_path = OUTPUT_DIR / filename
        
        # Generate audio
        print(f"Generating audio for: {text[:50]}...")
        tts.tts_to_file(text=text, file_path=str(output_path))
        
        # Check if client wants file or base64
        return_audio = request.args.get('return_audio', 'false').lower() == 'true'
        
        if return_audio:
            return send_file(
                output_path,
                mimetype='audio/wav',
                as_attachment=False,
                download_name=filename
            )
        else:
            # Return base64 encoded audio
            with open(output_path, 'rb') as f:
                audio_base64 = base64.b64encode(f.read()).decode('utf-8')
            
            return jsonify({
                "status": "success",
                "filename": filename,
                "audio_base64": audio_base64,
                "path": str(output_path)
            })
    
    except Exception as e:
        print(f"Error generating audio: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate-file', methods=['POST'])
def generate_file():
    """
    Generate audio and return file path only (for local file access)
    
    Request JSON:
    {
        "text": "Text to convert to speech",
        "output_path": "/full/path/to/output.wav"  # optional
    }
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Use provided path or generate one
        output_path = data.get('output_path')
        if output_path:
            output_path = Path(output_path)
        else:
            filename = f"tts_{hash(text)}.wav"
            output_path = OUTPUT_DIR / filename
        
        # Generate audio
        print(f"Generating audio to {output_path}...")
        tts.tts_to_file(text=text, file_path=str(output_path))
        
        return jsonify({
            "status": "success",
            "path": str(output_path),
            "exists": output_path.exists()
        })
    
    except Exception as e:
        print(f"Error generating audio: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/list-models', methods=['GET'])
def list_models():
    """List available TTS models"""
    try:
        models = TTS().list_models()
        return jsonify({"models": models})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("="*60)
    print("Coqui TTS Service Starting...")
    print(f"Audio output directory: {OUTPUT_DIR}")
    print("Endpoints:")
    print("  POST /generate - Generate audio (returns base64 or file)")
    print("  POST /generate-file - Generate audio (returns path only)")
    print("  GET  /health - Health check")
    print("  GET  /list-models - List available models")
    print("="*60)
    app.run(host='0.0.0.0', port=5050, debug=False)
