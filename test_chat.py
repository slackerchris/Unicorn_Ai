#!/usr/bin/env python3
"""
Simple test script to chat with Luna
Usage: python test_chat.py
"""

import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def chat(message):
    """Send a message and print the response"""
    response = requests.post(
        f"{BASE_URL}/chat",
        json={"message": message},
        timeout=60
    )
    
    if response.status_code == 200:
        data = response.json()
        return data["response"]
    else:
        return f"Error: {response.status_code} - {response.text}"

def main():
    print("🦄 Unicorn AI - Chat with Luna")
    print("=" * 50)
    print("Type 'quit' to exit\n")
    
    # Check health
    try:
        health = requests.get(f"{BASE_URL}/health", timeout=5).json()
        print(f"✅ Connected to {health['persona']} using {health['model']}\n")
    except Exception as e:
        print(f"❌ Server not running. Start with: python main.py")
        sys.exit(1)
    
    while True:
        try:
            # Get user input
            user_input = input("You: ").strip()
            
            if not user_input:
                continue
                
            if user_input.lower() in ['quit', 'exit', 'bye']:
                print("\n👋 Goodbye!")
                break
            
            # Send message
            print("Luna: ", end="", flush=True)
            response = chat(user_input)
            print(response)
            print()
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")

if __name__ == "__main__":
    main()
