# How to Create Your Telegram Bot

## Step 1: Talk to BotFather

1. Open Telegram on your phone or desktop
2. Search for **@BotFather** (the official bot)
3. Start a chat and send: `/newbot`
4. Follow the prompts:
   - **Name**: Unicorn AI (or whatever you want)
   - **Username**: Must end in 'bot' (e.g., `unicorn_ai_bot` or `your_name_ai_bot`)

## Step 2: Get Your Token

BotFather will give you a token that looks like:
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

**Keep this secret!** This is your bot's password.

## Step 3: Add Token to Config

Copy the token and run:

```bash
cd /home/chris/Documents/Git/Projects/Unicorn_Ai
nano config/.env
```

Add this line (replace with your actual token):
```
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

Save and exit (Ctrl+X, Y, Enter)

## Step 4: Start Your Bot

We'll do this next! Just get your token first.

---

**Once you have the token, let me know and I'll help you start the bot!**
