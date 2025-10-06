#!/bin/bash
# Install Unicorn AI systemd services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🦄 Installing Unicorn AI systemd services..."
echo ""

# Copy service files to systemd directory
echo "📋 Copying service files..."
sudo cp "$SCRIPT_DIR/systemd/unicorn-tts.service" /etc/systemd/system/
sudo cp "$SCRIPT_DIR/systemd/unicorn-comfyui.service" /etc/systemd/system/
sudo cp "$SCRIPT_DIR/systemd/unicorn-api.service" /etc/systemd/system/
sudo cp "$SCRIPT_DIR/systemd/unicorn-telegram.service" /etc/systemd/system/

# Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Enable services (start on boot)
echo "✅ Enabling services to start on boot..."
sudo systemctl enable unicorn-tts.service
sudo systemctl enable unicorn-comfyui.service
sudo systemctl enable unicorn-api.service
sudo systemctl enable unicorn-telegram.service

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Available commands:"
echo "  sudo systemctl start unicorn-tts      # Start TTS service"
echo "  sudo systemctl start unicorn-comfyui  # Start ComfyUI"
echo "  sudo systemctl start unicorn-api      # Start API"
echo "  sudo systemctl start unicorn-telegram # Start Telegram bot"
echo ""
echo "  sudo systemctl stop unicorn-tts       # Stop TTS service"
echo "  sudo systemctl stop unicorn-comfyui   # Stop ComfyUI"
echo "  sudo systemctl stop unicorn-api       # Stop API"
echo "  sudo systemctl stop unicorn-telegram  # Stop Telegram bot"
echo ""
echo "  sudo systemctl status unicorn-*       # Check all services"
echo "  sudo systemctl restart unicorn-*      # Restart all services"
echo ""
echo "🚀 To start all services now, run:"
echo "  sudo systemctl start unicorn-tts unicorn-comfyui unicorn-api unicorn-telegram"
echo ""
echo "📊 To view logs:"
echo "  sudo journalctl -u unicorn-tts -f"
echo "  sudo journalctl -u unicorn-comfyui -f"
echo "  sudo journalctl -u unicorn-api -f"
echo "  sudo journalctl -u unicorn-telegram -f"
