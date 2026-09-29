"""
Quick interactive setup for Weights & Biases.
Guides user through account creation and authentication.
"""

import subprocess
import sys
from pathlib import Path

def print_header(text):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(text)
    print("=" * 60)

def print_step(number, text):
    """Print a step header."""
    print(f"\n{number}. {text}")
    print("-" * 60)

def check_wandb_installed():
    """Check if wandb is installed."""
    try:
        import wandb
        print(f"✓ wandb {wandb.__version__} is installed")
        return True
    except ImportError:
        print("✗ wandb is not installed")
        print("\nInstalling wandb...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "wandb"])
        print("✓ wandb installed successfully")
        return True

def check_authentication():
    """Check if user is authenticated."""
    try:
        import wandb
        api = wandb.Api()
        user = api.viewer
        if user:
            username = user.get('username', 'unknown')
            print(f"✓ You're logged in as: {username}")
            return True, username
    except:
        pass
    
    print("✗ You're not logged in yet")
    return False, None

def guide_login():
    """Guide user through login process."""
    print("\n📋 Follow these steps to login:")
    print("\n1. Open this link in your browser:")
    print("   👉 https://wandb.ai/authorize")
    print("\n2. If you don't have an account:")
    print("   - Click 'Sign Up' to create one (free)")
    print("   - Or use Google/GitHub to sign up")
    print("\n3. Copy your API key (40+ character string)")
    print("\n4. Open a NEW PowerShell window and run:")
    print("   wandb login")
    print("\n5. Paste your API key and press Enter")
    print("\n" + "=" * 60)
    print("After logging in, run this script again to complete setup!")
    print("=" * 60)

def create_project():
    """Create W&B project."""
    import wandb
    
    print("\nCreating 'enthesis' project on W&B...")
    
    try:
        # Initialize a test run to create project
        run = wandb.init(
            project="enthesis",
            name="setup-test",
            tags=["setup"],
            notes="Initial setup verification"
        )
        
        run.log({"setup": 1})
        
        print(f"✓ Project created successfully!")
        print(f"✓ Dashboard: {run.url.rsplit('/', 2)[0]}")
        
        run.finish()
        return True
        
    except Exception as e:
        print(f"✗ Error creating project: {e}")
        return False

def main():
    """Main setup flow."""
    print_header("🚀 Enthesis + Weights & Biases Quick Setup")
    
    # Step 1: Check installation
    print_step(1, "Checking wandb installation")
    if not check_wandb_installed():
        return
    
    # Step 2: Check authentication
    print_step(2, "Checking authentication")
    is_logged_in, username = check_authentication()
    
    if not is_logged_in:
        guide_login()
        return
    
    # Step 3: Create project
    print_step(3, "Setting up Enthesis project")
    if not create_project():
        return
    
    # Step 4: Create config files
    print_step(4, "Creating configuration files")
    
    config_exists = Path("docs/wandb_config.md").exists()
    utils_exists = Path("experiments/wandb_utils.py").exists()
    
    print(f"{'✓' if config_exists else '✗'} docs/wandb_config.md")
    print(f"{'✓' if utils_exists else '✗'} experiments/wandb_utils.py")
    
    # Success!
    print_header("✅ Setup Complete!")
    print(f"""
🎉 W&B is ready to track your experiments!

📊 Your Dashboard: https://wandb.ai/{username}/enthesis

📚 Next Steps:
   1. Start training models in Phase 2
   2. Experiments will be tracked automatically
   3. View live metrics in your dashboard

💡 Quick Test:
   python -c "from experiments.wandb_utils import *; print('W&B utils ready!')"

📖 Documentation:
   - docs/wandb_config.md - Usage examples
   - docs/wandb_setup_guide.md - Detailed guide
   - experiments/wandb_utils.py - Helper functions
""")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠ Setup cancelled by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        print("\nFor help, see: docs/wandb_setup_guide.md")
