"""Baseline NLI model for novelty checking (Module 2).

Phase 1 baseline: Simple keyword overlap or basic BERT.
Phase 2: Fine-tuned DeBERTa on SciFact.
"""
from __future__ import annotations
from typing import Literal

NoveltyLabel = Literal["supported", "contradicted", "already_done", "unknown"]


class KeywordNLIBaseline:
    """Simple keyword-based baseline for claim verification.
    
    This is the Phase 1 baseline. Will be replaced with fine-tuned DeBERTa in Phase 2.
    """
    
    def __init__(self):
        # Keywords that suggest contradiction/overlap
        self.contradiction_words = {
            "first", "novel", "new", "original", "unique", "unprecedented",
            "never", "no prior", "initial", "pioneering"
        }
        self.support_words = {
            "consistent", "confirms", "aligns", "agrees", "validates",
            "supports", "corroborates"
        }
    
    def predict(self, premise: str, hypothesis: str) -> tuple[NoveltyLabel, float]:
        """Classify relationship between premise (evidence) and hypothesis (claim).
        
        Args:
            premise: Evidence from existing work
            hypothesis: Novelty claim to verify
            
        Returns:
            (label, confidence) where confidence is 0-1
        """
        premise_lower = premise.lower()
        hypothesis_lower = hypothesis.lower()
        
        # Check for novelty claim words in hypothesis
        has_novelty_claim = any(word in hypothesis_lower for word in self.contradiction_words)
        
        # Check for similar content in premise
        # (Very crude overlap - real model would use embeddings)
        premise_words = set(premise_lower.split())
        hypothesis_words = set(hypothesis_lower.split())
        overlap = len(premise_words & hypothesis_words) / max(len(hypothesis_words), 1)
        
        # Simple heuristic logic
        if has_novelty_claim and overlap > 0.3:
            # Claim of novelty but evidence shows prior work
            return "already_done", 0.4  # Low confidence
        elif any(word in premise_lower for word in self.support_words):
            return "supported", 0.5
        else:
            return "unknown", 0.3
    
    def evaluate(self, test_pairs: list[tuple[str, str, NoveltyLabel]]) -> dict[str, float]:
        """Evaluate baseline on labeled test data.
        
        Args:
            test_pairs: [(premise, hypothesis, true_label), ...]
            
        Returns:
            {"accuracy": float, "f1_macro": float}
        """
        if not test_pairs:
            return {"accuracy": 0.0, "f1_macro": 0.0, "note": "No test data available"}
        
        correct = 0
        for premise, hypothesis, true_label in test_pairs:
            pred_label, _ = self.predict(premise, hypothesis)
            if pred_label == true_label:
                correct += 1
        
        accuracy = correct / len(test_pairs)
        
        # F1 would require per-class precision/recall - placeholder for now
        return {
            "accuracy": accuracy,
            "f1_macro": 0.0,  # TBD - needs proper implementation with scikit-learn
            "n_samples": len(test_pairs),
            "baseline": "keyword_overlap"
        }


def prepare_scifact_for_nli(scifact_data: dict) -> list[tuple[str, str, NoveltyLabel]]:
    """Convert SciFact format to NLI pairs for evaluation.
    
    SciFact labels: SUPPORTS, REFUTES, NOT_ENOUGH_INFO
    Map to our labels: supported, contradicted, unknown
    
    Note: 'already_done' is not in SciFact, so we can't evaluate that label.
    """
    pairs = []
    
    # Placeholder - actual implementation needs real SciFact data
    # Format: iterate claims, get evidence, map labels
    
    return pairs  # Returns empty until real data is loaded


# Evaluation metrics (to be used when real data is available)

def compute_metrics(predictions: list[NoveltyLabel], labels: list[NoveltyLabel]) -> dict:
    """Compute accuracy and F1 for novelty classification."""
    from sklearn.metrics import accuracy_score, f1_score
    
    # Map labels to integers for sklearn
    label_map = {"supported": 0, "contradicted": 1, "already_done": 2, "unknown": 3}
    pred_ids = [label_map[p] for p in predictions]
    label_ids = [label_map[l] for l in labels]
    
    return {
        "accuracy": accuracy_score(label_ids, pred_ids),
        "f1_macro": f1_score(label_ids, pred_ids, average="macro", zero_division=0),
        "f1_weighted": f1_score(label_ids, pred_ids, average="weighted", zero_division=0),
    }
