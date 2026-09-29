# Weights & Biases Setup Guide

## Step 1: Create W&B Account (if you don't have one)

1. Go to: **https://wandb.ai/signup**
2. Sign up with email or GitHub/Google
3. Verify your email if prompted

## Step 2: Get Your API Key

1. Go to: **https://wandb.ai/authorize**
2. You'll see your API key displayed
3. Click "Copy" to copy it to clipboard
4. **Important**: Keep this key secure, don't share it

## Step 3: Login to W&B

Open PowerShell in your project directory and run:

```powershell
wandb login
```

When prompted:
- Choose option **(2) Use an existing W&B account**
- Paste your API key (the 40+ character string from step 2)
- Press Enter

You should see: `Successfully logged in to Weights & Biases!`

## Step 4: Verify Setup

Run the setup verification script:

```powershell
python scripts/setup_wandb.py
```

This will:
- ✓ Check wandb installation
- ✓ Verify authentication
- ✓ Create the "enthesis" project
- ✓ Generate configuration files

## Step 5: View Your Dashboard

After setup completes, visit:
- **https://wandb.ai/your-username/enthesis**

(Replace `your-username` with your actual W&B username)

---

## Quick Reference

### Check if logged in:
```powershell
wandb verify
```

### Logout:
```powershell
wandb logout
```

### View current settings:
```powershell
wandb settings
```

---

## Troubleshooting

### "Invalid API key" error
- Make sure you copied the full 40+ character key
- No extra spaces at beginning/end
- Get a fresh key from: https://wandb.ai/authorize

### "Authentication failed"
- Try logging out first: `wandb logout`
- Then login again: `wandb login`
- Make sure you're using the latest key

### Can't access dashboard
- Make sure you're logged in to wandb.ai in your browser
- Project is created automatically on first run
- URL format: https://wandb.ai/USERNAME/enthesis

---

## Next Steps

Once setup is complete:
1. ✓ W&B is ready to track experiments
2. Start Phase 2 training with automatic tracking
3. View live metrics at your dashboard
4. Compare runs and track improvements

See `docs/wandb_config.md` for usage examples in training scripts.
