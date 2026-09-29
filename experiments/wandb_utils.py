"""
Weights & Biases utilities for Enthesis experiment tracking.
Provides standardized tracking functions for all modules.
"""

import wandb
from typing import Dict, Any, Optional, List
from pathlib import Path
import json

class EnthesisExperiment:
    """Wrapper for W&B experiment tracking specific to Enthesis modules."""
    
    # Module-specific metric configurations
    MODULE_METRICS = {
        1: ["entity_f1", "entity_precision", "entity_recall", "retrieval_recall@5", "retrieval_recall@10"],
        2: ["accuracy", "f1", "precision", "recall", "auc"],
        3: ["precision", "recall", "f1", "methodology_f1", "experimental_f1", "clarity_f1"],
        4: ["coherence_score", "relevance_score", "overall_quality"],
        5: ["correlation", "mae", "mse", "readability_score", "structure_score"]
    }
    
    MODULE_NAMES = {
        1: "related_work",
        2: "novelty_detection",
        3: "weaknesses_detection",
        4: "reviewer_feedback",
        5: "clarity_analysis"
    }
    
    def __init__(
        self,
        module_number: int,
        model_name: str,
        config: Dict[str, Any],
        run_name: Optional[str] = None,
        tags: Optional[List[str]] = None,
        notes: Optional[str] = None
    ):
        """
        Initialize experiment tracking for a module.
        
        Args:
            module_number: Module number (1-5)
            model_name: Name of the model being trained
            config: Dictionary of hyperparameters
            run_name: Optional custom run name
            tags: Additional tags for the run
            notes: Experiment notes/description
        """
        self.module_number = module_number
        self.model_name = model_name
        self.module_name = self.MODULE_NAMES.get(module_number, f"module{module_number}")
        
        # Generate run name if not provided
        if run_name is None:
            run_name = f"module{module_number}-{model_name}-v1"
        
        # Prepare tags
        default_tags = [f"module{module_number}", self.module_name, model_name]
        if tags:
            default_tags.extend(tags)
        
        # Add module info to config
        config_with_module = {
            "module": module_number,
            "module_name": self.module_name,
            "model": model_name,
            **config
        }
        
        # Initialize W&B run
        self.run = wandb.init(
            project="enthesis",
            name=run_name,
            config=config_with_module,
            tags=default_tags,
            notes=notes or f"Training {model_name} for {self.module_name}"
        )
        
        print(f"✓ W&B run initialized: {self.run.url}")
    
    def log_metrics(self, metrics: Dict[str, float], step: Optional[int] = None):
        """
        Log metrics to W&B.
        
        Args:
            metrics: Dictionary of metric names and values
            step: Optional step number (epoch, iteration, etc.)
        """
        self.run.log(metrics, step=step)
    
    def log_baseline_comparison(self, baseline_scores: Dict[str, float], current_scores: Dict[str, float]):
        """
        Log comparison with baseline scores.
        
        Args:
            baseline_scores: Dictionary of baseline metric values
            current_scores: Dictionary of current metric values
        """
        comparison = {}
        for metric, baseline_val in baseline_scores.items():
            current_val = current_scores.get(metric, 0.0)
            improvement = current_val - baseline_val
            improvement_pct = (improvement / baseline_val * 100) if baseline_val > 0 else 0
            
            comparison[f"{metric}_baseline"] = baseline_val
            comparison[f"{metric}_current"] = current_val
            comparison[f"{metric}_improvement"] = improvement
            comparison[f"{metric}_improvement_pct"] = improvement_pct
        
        self.run.log(comparison)
        
        # Log summary
        self.run.summary.update({
            "baseline_beaten": all(current_scores.get(m, 0) > baseline_scores.get(m, 0) for m in baseline_scores)
        })
    
    def log_epoch(self, epoch: int, train_metrics: Dict[str, float], val_metrics: Dict[str, float]):
        """
        Log training and validation metrics for an epoch.
        
        Args:
            epoch: Epoch number
            train_metrics: Training metrics
            val_metrics: Validation metrics
        """
        combined = {
            "epoch": epoch,
            **{f"train_{k}": v for k, v in train_metrics.items()},
            **{f"val_{k}": v for k, v in val_metrics.items()}
        }
        self.run.log(combined, step=epoch)
    
    def save_model_artifact(self, model_path: Path, artifact_name: Optional[str] = None):
        """
        Save model as W&B artifact.
        
        Args:
            model_path: Path to model file/directory
            artifact_name: Optional custom artifact name
        """
        if artifact_name is None:
            artifact_name = f"{self.module_name}-{self.model_name}"
        
        artifact = wandb.Artifact(
            name=artifact_name,
            type="model",
            description=f"Trained {self.model_name} for {self.module_name}"
        )
        
        if model_path.is_dir():
            artifact.add_dir(str(model_path))
        else:
            artifact.add_file(str(model_path))
        
        self.run.log_artifact(artifact)
        print(f"✓ Model artifact saved: {artifact_name}")
    
    def save_predictions_artifact(self, predictions_file: Path):
        """
        Save predictions as W&B artifact.
        
        Args:
            predictions_file: Path to predictions JSON file
        """
        artifact = wandb.Artifact(
            name=f"{self.module_name}-predictions",
            type="predictions",
            description=f"Predictions from {self.model_name}"
        )
        artifact.add_file(str(predictions_file))
        self.run.log_artifact(artifact)
        print(f"✓ Predictions artifact saved")
    
    def finish(self):
        """Finish the W&B run."""
        self.run.finish()
        print(f"✓ W&B run completed: {self.run.url}")


def load_baseline_scores(module_number: int) -> Dict[str, float]:
    """
    Load baseline scores for a module from results_table.md.
    
    Args:
        module_number: Module number (1-5)
    
    Returns:
        Dictionary of metric names and baseline scores
    """
    results_file = Path("experiments/results/all_baselines.json")
    
    if not results_file.exists():
        print(f"⚠ Baseline scores file not found: {results_file}")
        return {}
    
    with open(results_file, 'r') as f:
        all_results = json.load(f)
    
    module_key = f"module{module_number}"
    if module_key in all_results:
        return all_results[module_key]
    
    return {}


def create_quick_experiment(
    module_number: int,
    model_name: str,
    **kwargs
) -> EnthesisExperiment:
    """
    Quick experiment creation with minimal config.
    
    Args:
        module_number: Module number (1-5)
        model_name: Name of the model
        **kwargs: Additional config parameters
    
    Returns:
        EnthesisExperiment instance
    """
    return EnthesisExperiment(
        module_number=module_number,
        model_name=model_name,
        config=kwargs
    )


# Example usage
if __name__ == "__main__":
    print("Enthesis W&B Utilities")
    print("=" * 60)
    print("\nExample: Starting a Module 1 experiment\n")
    
    example_code = '''
# Start experiment
exp = EnthesisExperiment(
    module_number=1,
    model_name="sciBERT",
    config={
        "learning_rate": 2e-5,
        "batch_size": 16,
        "epochs": 5,
        "max_length": 512
    },
    tags=["baseline-improvement", "entity-extraction"]
)

# Load baseline scores for comparison
baseline = load_baseline_scores(module_number=1)

# Log training progress
for epoch in range(5):
    train_metrics = {"loss": 0.5, "f1": 0.6}
    val_metrics = {"loss": 0.4, "f1": 0.65}
    exp.log_epoch(epoch, train_metrics, val_metrics)

# Log final comparison with baseline
final_scores = {"entity_f1": 0.65, "retrieval_recall@5": 0.45}
exp.log_baseline_comparison(baseline, final_scores)

# Save model
exp.save_model_artifact(Path("models/module1_sciBERT"))

# Finish
exp.finish()
'''
    print(example_code)
