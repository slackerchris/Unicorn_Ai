"""
Unicorn AI - Telegram Bot Interface
Phase 2: Chat with Luna via Telegram
Phase 4: Voice messages support
Phase 5: Persona management
"""

import os
import asyncio
from typing import Optional
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

# Store user preferences (in production, this would be a database)
user_preferences = {}


def get_voice_mode(user_id: int) -> bool:
    """Check if user has voice mode enabled"""
    return user_preferences.get(user_id, {}).get("voice_mode", False)


def set_voice_mode(user_id: int, enabled: bool):
    """Set voice mode for a user"""
    if user_id not in user_preferences:
        user_preferences[user_id] = {}
    user_preferences[user_id]["voice_mode"] = enabled


def get_memory_mode(user_id: int) -> bool:
    """Check if user has memory mode enabled"""
    return user_preferences.get(user_id, {}).get("memory_mode", True)  # Default: ON


def set_memory_mode(user_id: int, enabled: bool):
    """Set memory mode for a user"""
    if user_id not in user_preferences:
        user_preferences[user_id] = {}
    user_preferences[user_id]["memory_mode"] = enabled
    logger.info(f"User {user_id} memory mode: {enabled}")


def get_user_persona(user_id: int) -> Optional[str]:
    """Get the persona_id for a user (None means use default)"""
    return user_preferences.get(user_id, {}).get("persona_id")


def set_user_persona(user_id: int, persona_id: str):
    """Set the persona for a user"""
    if user_id not in user_preferences:
        user_preferences[user_id] = {}
    user_preferences[user_id]["persona_id"] = persona_id
    logger.info(f"User {user_id} persona: {persona_id}")


# Removed chat_with_api function - now handled inline in handle_message


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command"""
    user = update.effective_user
    logger.info(f"User {user.id} ({user.first_name}) started the bot")
    
    welcome_message = f"""👋 Hi {user.first_name}! I'm {PERSONA_NAME}!

I'm here to chat, listen, and keep you company. Just send me a message and I'll respond!

**Commands:**
/start - Show this welcome message
/help - Get help
/status - Check if I'm online
/voice - Toggle voice messages 🎤
/persona - Switch personalities 🎭

**What I can do:**
✅ Have natural conversations with you
✅ Remember context within our chat
✅ Send you voice messages (toggle with /voice)
✅ Send you photos (when it makes sense)
✅ Switch between different personalities (/persona)
✅ Be caring, fun, and supportive

**Coming soon:**
🔜 See photos you send me
🔜 Remember your schedule

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
/voice - Toggle voice/text messages
/memory - Toggle conversation memory
/persona - Switch AI personality

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


async def voice_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /voice command - toggle voice messages"""
    user = update.effective_user
    current_mode = get_voice_mode(user.id)
    new_mode = not current_mode
    
    set_voice_mode(user.id, new_mode)
    
    if new_mode:
        message = f"""🎤 **Voice mode ON!**

I'll send you voice messages now instead of text. You can still send me text messages though!

To switch back to text: /voice"""
    else:
        message = f"""💬 **Text mode ON!**

I'll send you regular text messages now.

To switch back to voice: /voice"""
    
    await update.message.reply_text(message)


async def memory_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /memory command - toggle conversation memory"""
    user = update.effective_user
    
    # Toggle memory mode
    current_mode = get_memory_mode(user.id)
    new_mode = not current_mode
    set_memory_mode(user.id, new_mode)
    
    # Update backend
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                f"{API_BASE_URL}/memory/toggle/telegram_{user.id}",
                params={"enabled": new_mode}
            )
    except Exception as e:
        logger.error(f"Error toggling memory on backend: {e}")
    
    if new_mode:
        message = f"""🧠 **Memory mode ON!**

I'll remember our conversations now! I can recall past messages and continue where we left off.

To disable memory: /memory"""
    else:
        message = f"""💭 **Memory mode OFF!**

I won't remember past messages. Each message will be treated as a new conversation.

To enable memory: /memory"""
    
    await update.message.reply_text(message)


async def persona_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /persona command - list or switch personas"""
    user = update.effective_user
    
    # If no argument, list available personas
    if not context.args:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{API_BASE_URL}/personas")
                response.raise_for_status()
                personas = response.json()
                
                message = "🎭 **Available Personas:**\n\n"
                for persona in personas:
                    emoji = "⭐" if persona["is_current"] else "  "
                    message += f"{emoji} **{persona['name']}** (`{persona['id']}`)\n"
                    message += f"   {persona['description']}\n\n"
                
                message += "To switch persona: `/persona <id>`\n"
                message += "Example: `/persona nova`"
                
                await update.message.reply_text(message)
                
        except Exception as e:
            logger.error(f"Failed to fetch personas: {e}")
            await update.message.reply_text("Sorry, I couldn't fetch the persona list 😅")
    
    else:
        # Switch to specified persona
        persona_id = context.args[0]
        
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(f"{API_BASE_URL}/personas/{persona_id}/activate")
                response.raise_for_status()
                data = response.json()
                
                # Update user preference
                set_user_persona(user.id, persona_id)
                
                message = f"""✅ **Persona Changed!**

Now chatting with: **{data['persona']['name']}**

Try talking to me - I'll respond in my new personality! 💫"""
                
                await update.message.reply_text(message)
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                await update.message.reply_text(f"Persona '{persona_id}' not found. Use /persona to see available personas.")
            else:
                await update.message.reply_text("Sorry, I couldn't switch personas right now 😅")
        except Exception as e:
            logger.error(f"Failed to switch persona: {e}")
            await update.message.reply_text("Sorry, something went wrong 😅")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle incoming text messages"""
    user = update.effective_user
    message_text = update.message.text
    
    logger.info(f"Message from {user.id} ({user.first_name}): {message_text[:50]}...")
    
    # Check if user has voice mode enabled
    voice_mode = get_voice_mode(user.id)
    
    # Get user's chosen persona (if any)
    user_persona_id = get_user_persona(user.id)
    
    # Show typing indicator
    await update.message.chat.send_action(ChatAction.TYPING)
    
    # Get response from API
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Build request payload
            payload = {
                "message": message_text,
                "session_id": f"telegram_{user.id}"  # Unique session ID per user
            }
            if user_persona_id:
                payload["persona_id"] = user_persona_id
            
            response = await client.post(
                f"{API_BASE_URL}/chat",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            text_response = data["response"]
            has_image = data.get("has_image", False)
            image_prompt = data.get("image_prompt")
            image_url = data.get("image_url")
            
            logger.info(f"Response: {text_response[:50]}...")
            if image_url:
                logger.info(f"Image generated: {image_url}")
            
            # Clean text for voice (remove [IMAGE: ...] tags)
            clean_text = text_response
            if has_image:
                import re
                clean_text = re.sub(r'\[IMAGE:[^\]]+\]', '', text_response).strip()
            
            # Send response as voice or text
            if voice_mode and clean_text:
                logger.info("Sending voice message")
                await update.message.chat.send_action(ChatAction.RECORD_VOICE)
                
                try:
                    # Generate voice message
                    voice_response = await client.post(
                        f"{API_BASE_URL}/generate-voice",
                        params={"text": clean_text}
                    )
                    voice_response.raise_for_status()
                    voice_data = voice_response.content
                    
                    # Send voice message
                    await update.message.reply_voice(voice=voice_data)
                    logger.info("Voice message sent successfully")
                    
                except Exception as e:
                    logger.error(f"Voice generation failed, falling back to text: {e}")
                    await update.message.reply_text(text_response)
            else:
                # Send text response
                await update.message.reply_text(text_response)
            
            # If there's an image, send it
            if image_url:
                logger.info(f"Sending image from: {image_url}")
                await update.message.chat.send_action(ChatAction.UPLOAD_PHOTO)
                
                try:
                    # Download the image from the local server
                    img_response = await client.get(f"{API_BASE_URL}{image_url}")
                    img_response.raise_for_status()
                    image_data = img_response.content
                    
                    # Send image
                    caption = f"🖼️ {image_prompt}" if image_prompt else None
                    await update.message.reply_photo(
                        photo=image_data,
                        caption=caption
                    )
                    logger.info("Image sent successfully")
                    
                except Exception as e:
                    logger.error(f"Failed to send image: {e}")
                    await update.message.reply_text(
                        "Sorry, I couldn't send the image right now 😅"
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
    application.add_handler(CommandHandler("voice", voice_command))
    application.add_handler(CommandHandler("memory", memory_command))
    application.add_handler(CommandHandler("persona", persona_command))
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
