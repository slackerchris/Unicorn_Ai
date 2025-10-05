"""
Unicorn AI - Telegram Bot Interface
Phase 2: Chat with Luna via Telegram
"""

import os
import asyncio
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ChatAction
from dotenv import load_dotenv
from loguru import logger
import httpx
import sys

# Load environment variables
load_dotenv("config/.env")

# Configure logging
logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add("outputs/logs/telegram_bot.log", rotation="10 MB", retention="7 days", level="DEBUG")

# Configuration
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
PERSONA_NAME = os.getenv("PERSONA_NAME", "Luna")

if not TELEGRAM_BOT_TOKEN:
    logger.error("TELEGRAM_BOT_TOKEN not found in config/.env")
    print("❌ Error: TELEGRAM_BOT_TOKEN not set in config/.env")
    print("Please follow TELEGRAM_SETUP.md to create your bot and get a token.")
    sys.exit(1)


# Removed chat_with_api function - now handled inline in handle_message


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    logger.info(f"User {user.id} ({user.first_name}) started the bot")
    
    welcome_message = f"""👋 Hi {user.first_name}! I'm {PERSONA_NAME}, your AI companion.

I'm here to chat, listen, and keep you company. Just send me a message and I'll respond!

**Commands:**
/start - Show this welcome message
/help - Get help
/status - Check if I'm online

**What I can do (so far):**
✅ Have natural conversations with you
✅ Remember context within our chat
✅ Be caring, fun, and supportive

**Coming soon:**
🔜 Send you photos
🔜 Send you voice messages
🔜 See photos you send me

Just start chatting! I'm excited to get to know you! 💕"""
    
    await update.message.reply_text(welcome_message)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command"""
    help_text = f"""**How to chat with {PERSONA_NAME}:**

Just send me any message! I'll respond naturally.

**Tips:**
• I remember our conversation context
• You can ask me questions
• Tell me about your day
• I'm here if you need to vent
• Feel free to be yourself - I'm uncensored!

**Commands:**
/start - Welcome message
/help - This help text
/status - Check if I'm working

**Privacy:**
🔒 Everything is private and runs on your own server
🔒 No data is sent to third parties
🔒 Your conversations are just between us"""
    
    await update.message.reply_text(help_text)


async def status_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /status command"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{API_BASE_URL}/health")
            data = response.json()
            
            status_text = f"""✅ **I'm online and ready!**

**Status:**
• API: {data['api']}
• AI Model: {data['ollama']}
• Using: {data['model']}
• Persona: {data['persona']}

Everything looks good! Send me a message! 💬"""
            
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        status_text = "❌ Hmm, I'm having trouble connecting to my brain. Give me a moment! 🤔"
    
    await update.message.reply_text(status_text)


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming text messages"""
    user = update.effective_user
    message_text = update.message.text
    
    logger.info(f"Message from {user.id} ({user.first_name}): {message_text[:50]}...")
    
    # Show typing indicator
    await update.message.chat.send_action(ChatAction.TYPING)
    
    # Get response from API
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{API_BASE_URL}/chat",
                json={"message": message_text}
            )
            response.raise_for_status()
            data = response.json()
            
            text_response = data["response"]
            has_image = data.get("has_image", False)
            image_prompt = data.get("image_prompt")
            
            logger.info(f"Response: {text_response[:50]}...")
            
            # Send text response first
            await update.message.reply_text(text_response)
            
            # If there's an image, generate and send it
            if has_image and image_prompt:
                logger.info(f"Generating image: {image_prompt}")
                await update.message.chat.send_action(ChatAction.UPLOAD_PHOTO)
                
                try:
                    # Generate image
                    img_response = await client.post(
                        f"{API_BASE_URL}/generate-image",
                        params={"prompt": image_prompt}
                    )
                    img_response.raise_for_status()
                    image_data = img_response.content
                    
                    # Send image
                    await update.message.reply_photo(photo=image_data)
                    logger.info("Image sent successfully")
                    
                except Exception as e:
                    logger.error(f"Image generation failed: {e}")
                    await update.message.reply_text(
                        "Sorry, I couldn't generate the image right now 😅"
                    )
    
    except httpx.HTTPError as e:
        logger.error(f"API error: {e}")
        await update.message.reply_text(
            "Sorry, I'm having trouble thinking right now. Can you try again? 🤔"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        await update.message.reply_text(
            "Oops, something went wrong on my end. Try again in a moment? 😅"
        )


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle errors"""
    logger.error(f"Update {update} caused error {context.error}")
    
    if update and update.effective_message:
        await update.effective_message.reply_text(
            "Sorry, something went wrong! 😅 Try again in a moment?"
        )


def main():
    """Start the Telegram bot"""
    logger.info("Starting Telegram bot...")
    logger.info(f"Persona: {PERSONA_NAME}")
    logger.info(f"API: {API_BASE_URL}")
    
    # Create application
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    
    # Add handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("status", status_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    # Add error handler
    application.add_error_handler(error_handler)
    
    # Start bot
    logger.info("Bot started! Send /start to your bot in Telegram")
    print(f"\n✅ {PERSONA_NAME} is now online on Telegram!")
    print(f"📱 Open Telegram and search for your bot")
    print(f"💬 Send /start to begin chatting\n")
    
    # Run bot
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
