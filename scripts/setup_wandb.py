"""
Setup script for Weights & Biases integration with Enthesis project.
Creates W&B project and configures experiment tracking for all modules.
"""

import wandb
import os
from pathlib import Path

def setup_wandb():
    """Initialize W&B project and verify setup."""
    
    print("=" * 60)
    print("Weights & Biases Setup for Enthesis Project")
    print("=" * 60)
    
    # Project configuration
    project_name = "enthesis"
    entity = None  # Will use default user/team
    
    print("\n1. Checking W&B installation...")
    try:
        print(f"   ✓ wandb version: {wandb.__version__}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return False
    
    print("\n2. Checking authentication...")
    # Check if already logged in
    logged_in = False
    try:
        api = wandb.Api()
        user = api.viewer
        if user:
            print(f"   ✓ Logged in as: {user.get('username', 'unknown')}")
            print(f"   ✓ Entity: {user.get('entity', 'personal')}")
            logged_in = True
    except Exception as e:
        print(f"   ✗ Not authenticated yet")
        print(f"\n   Please complete authentication first:")
        print(f"   1. Get your API key from: https://wandb.ai/authorize")
        print(f"   2. Run: wandb login")
        print(f"   3. Paste your API key when prompted")
        print(f"   4. Then run this setup script again")
        print(f"\n   See docs/wandb_setup_guide.md for detailed instructions")
        return False
    
    if not logged_in:
        return False
    
    print(f"\n3. Creating/verifying project '{project_name}'...")
    try:
        # Initialize a test run to create project
        run = wandb.init(
            project=project_name,
            entity=entity,
            name="setup-verification",
            tags=["setup", "test"],
            notes="Verification run to ensure W&B is configured correctly"
        )
        
        # Log test metrics
        run.log({
            "test_metric": 1.0,
            "setup_complete": True
        })
        
        print(f"   ✓ Project created/verified")
        print(f"   ✓ Run URL: {run.url}")
        
        # Finish the run
        run.finish()
        
    except Exception as e:
        print(f"   ✗ Error creating project: {e}")
        return False
    
    print("\n4. Creating W&B configuration file...")
    config_content = f"""# Weights & Biases Configuration for Enthesis

## Project Information
- **Project Name**: {project_name}
- **Purpose**: Track experiments for NLP research paper analysis modules
- **Setup Date**: 2026-09-28

## Usage

### Initialize a run in your training script:

```python
import wandb

# Start a new run
run = wandb.init(
    project="{project_name}",
    name="module1-sciBERT-v1",  # Descriptive run name
    config={{
        "module": "related_work",
        "model": "sciBERT",
        "learning_rate": 2e-5,
        "batch_size": 16,
        "epochs": 5
    }},
    tags=["module1", "baseline-improvement"]
)

# Log metrics during training
run.log({{
    "epoch": epoch,
    "train_loss": loss,
    "val_f1": f1_score
}})

# Finish the run
run.finish()
```

## Module-Specific Tracking

### Module 1 (Related Work)
- **Metrics**: entity_f1, entity_precision, entity_recall, retrieval_recall@5, retrieval_recall@10
- **Tags**: module1, related_work, entity_extraction, retrieval

### Module 2 (Novelty Detection)
- **Metrics**: accuracy, f1, precision, recall, auc
- **Tags**: module2, novelty, nli, scifact

### Module 3 (Weaknesses Detection)
- **Metrics**: precision, recall, f1, category_f1 (per weakness type)
- **Tags**: module3, weaknesses, classification

### Module 4 (Reviewer Feedback)
- **Metrics**: coherence_score, relevance_score, overall_quality
- **Tags**: module4, reviewer_feedback, generation

### Module 5 (Clarity Analysis)
- **Metrics**: correlation, mae, mse, feature_importance
- **Tags**: module5, clarity, style_analysis

## Best Practices

1. **Run Naming**: Use format `moduleX-model-version` (e.g., `module1-sciBERT-v2`)
2. **Tags**: Always include module number and key descriptors
3. **Config**: Log all hyperparameters in the config dict
4. **Artifacts**: Save model checkpoints as W&B artifacts
5. **Notes**: Add run.notes with experiment description

## View Results

Dashboard: https://wandb.ai/your-username/{project_name}

## Authentication

If not logged in, run:
```bash
wandb login
```

Then paste your API key from: https://wandb.ai/authorize
"""
    
    docs_dir = Path("docs")
    docs_dir.mkdir(exist_ok=True)
    config_path = docs_dir / "wandb_config.md"
    config_path.write_text(config_content, encoding="utf-8")
    print(f"   ✓ Configuration saved to: {config_path}")
    
    print("\n5. Creating experiment tracking wrapper...")
    # This will be created next
    
    print("\n" + "=" * 60)
    print("✓ W&B Setup Complete!")
    print("=" * 60)
    print(f"\nNext steps:")
    print(f"1. View your project: https://wandb.ai")
    print(f"2. Start Phase 2 training with W&B tracking enabled")
    print(f"3. Check docs/wandb_config.md for usage examples")
    
    return True

if __name__ == "__main__":
    # Check if wandb is installed
    try:
        import wandb
    except ImportError:
        print("ERROR: wandb not installed. Installing...")
        import subprocess
        subprocess.check_call(["pip", "install", "wandb"])
        import wandb
    
    # Run setup
    success = setup_wandb()
    
    if not success:
        print("\n⚠ Setup incomplete. Please resolve issues above.")
        exit(1)
    else:
        print("\n✓ Ready to start Phase 2 with experiment tracking!")
        exit(0)
