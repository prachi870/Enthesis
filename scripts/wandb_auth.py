"""
Simple script to authenticate with W&B using API key.
Run this with your API key as an argument or it will prompt you.
"""

import sys
import wandb

def authenticate_wandb(api_key=None):
    """Authenticate with W&B using API key."""
    
    if api_key is None:
        print("=" * 60)
        print("W&B Authentication")
        print("=" * 60)
        print("\nGet your API key from: https://wandb.ai/authorize")
        api_key = input("\nPaste your API key here: ").strip()
    
    if not api_key:
        print("❌ No API key provided")
        return False
    
    try:
        # Login with the API key
        wandb.login(key=api_key)
        
        # Verify authentication
        api = wandb.Api()
        user = api.viewer
        username = user.get('username', 'unknown')
        
        print("\n✅ Successfully authenticated!")
        print(f"📊 Logged in as: {username}")
        print(f"🔗 Dashboard: https://wandb.ai/{username}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Authentication failed: {e}")
        print("\nPlease check:")
        print("  1. API key is correct (40+ characters)")
        print("  2. No extra spaces in the key")
        print("  3. Key is from: https://wandb.ai/authorize")
        return False

if __name__ == "__main__":
    # Check if API key provided as argument
    api_key = sys.argv[1] if len(sys.argv) > 1 else None
    
    success = authenticate_wandb(api_key)
    
    if success:
        print("\n" + "=" * 60)
        print("Next step: Run the setup to create your project")
        print("Command: python scripts/wandb_quick_start.py")
        print("=" * 60)
        exit(0)
    else:
        exit(1)
