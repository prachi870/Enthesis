"""Baseline clarity classifier (Module 5).

Phase 1: Feature-based heuristics
Phase 2: Trained classifier on accepted/rejected papers
"""
from __future__ import annotations
from .features import extract_style_features, flag_unclear_passages, compute_clarity_score


class FeatureBasedClarityClassifier:
    """Baseline clarity checker using style features and heuristics.
    
    Phase 1: Rule-based scoring
    Phase 2: Train classifier on accepted vs rejected papers from one subfield
    """
    
    def __init__(self):
        # Thresholds for flagging (tuned on accepted/rejected papers in Phase 2)
        self.thresholds = {
            "sentence_length_cv_high": 1.0,
            "hedging_density_high": 0.02,
            "vague_density_high": 0.03,
            "unique_word_ratio_low": 0.3,
        }
    
    def predict(self, text: str) -> dict:
        """Analyze clarity of the text.
        
        Returns:
            {
                "clarity_score": float (0-1),
                "features": dict,
                "flagged_passages": list,
                "recommendations": list[str]
            }
        """
        features = extract_style_features(text)
        clarity_score = compute_clarity_score(features)
        flagged = flag_unclear_passages(text, features)
        recommendations = self._generate_recommendations(features, flagged)
        
        return {
            "clarity_score": clarity_score,
            "features": features,
            "flagged_passages": flagged,
            "recommendations": recommendations,
        }
    
    def _generate_recommendations(self, features: dict, flagged_passages: list) -> list[str]:
        """Generate concrete editing recommendations."""
        recommendations = []
        
        # Sentence length variation
        if features["sentence_length_cv"] > self.thresholds["sentence_length_cv_high"]:
            recommendations.append(
                "Consider using more consistent sentence lengths for better flow."
            )
        elif features["sentence_length_cv"] < 0.2:
            recommendations.append(
                "Vary sentence lengths to improve readability and maintain reader interest."
            )
        
        # Hedging
        if features["hedging_density"] > self.thresholds["hedging_density_high"]:
            recommendations.append(
                f"Reduce hedging language (found {features['hedging_count']} instances). "
                "Be more direct where evidence supports strong claims."
            )
        
        # Vague language
        if features["vague_density"] > self.thresholds["vague_density_high"]:
            recommendations.append(
                f"Replace vague terms with specific language (found {features['vague_count']} instances)."
            )
        
        # Lexical diversity
        if features["unique_word_ratio"] < self.thresholds["unique_word_ratio_low"]:
            recommendations.append(
                "Increase vocabulary diversity to avoid repetitive language."
            )
        
        # Word repetition
        if features["highly_repeated_words"] > 10:
            recommendations.append(
                f"Review highly repeated words ({features['highly_repeated_words']} words used >3 times). "
                "Consider using synonyms or restructuring."
            )
        
        # Phrase repetition
        if features["repeated_phrase_count"] > 5:
            recommendations.append(
                f"Found {features['repeated_phrase_count']} repeated phrases. "
                "Vary phrasing to improve readability."
            )
        
        # Sentence-level issues
        long_sentences = [f for f in flagged_passages if "very_long" in f["issues"]]
        if long_sentences:
            recommendations.append(
                f"Break up {len(long_sentences)} very long sentences (>50 words) for clarity."
            )
        
        hedging_sentences = [f for f in flagged_passages if "excessive_hedging" in f["issues"]]
        if hedging_sentences:
            recommendations.append(
                f"Reduce hedging in {len(hedging_sentences)} sentences with excessive qualifiers."
            )
        
        return recommendations
    
    def evaluate_correlation(
        self,
        accepted_papers: list[str],
        rejected_papers: list[str]
    ) -> dict:
        """Evaluate if features correlate with acceptance.
        
        This is the key metric for Module 5.
        """
        if not accepted_papers or not rejected_papers:
            return {
                "correlation": "TBD",
                "note": "No accepted/rejected papers available - Phase 1 incomplete"
            }
        
        # Extract features for both sets
        accepted_features = [extract_style_features(text) for text in accepted_papers]
        rejected_features = [extract_style_features(text) for text in rejected_papers]
        
        # Compare means (simple baseline)
        import numpy as np
        
        def mean_feature(features_list, feature_name):
            values = [f[feature_name] for f in features_list if feature_name in f]
            return np.mean(values) if values else 0
        
        feature_names = [
            "sentence_length_cv", "hedging_density", "vague_density",
            "unique_word_ratio", "highly_repeated_words"
        ]
        
        comparisons = {}
        for feature in feature_names:
            acc_mean = mean_feature(accepted_features, feature)
            rej_mean = mean_feature(rejected_features, feature)
            diff = acc_mean - rej_mean
            comparisons[feature] = {
                "accepted_mean": acc_mean,
                "rejected_mean": rej_mean,
                "difference": diff,
            }
        
        # Simple correlation: count how many features differ in expected direction
        # Expected: accepted papers have lower hedging, higher diversity, etc.
        
        return {
            "comparisons": comparisons,
            "n_accepted": len(accepted_papers),
            "n_rejected": len(rejected_papers),
            "baseline": "feature_comparison",
            "correlation_coefficient": "TBD",  # Needs proper statistical test
        }
    
    def train(self, accepted_papers: list[str], rejected_papers: list[str]) -> None:
        """Train classifier on accepted vs rejected papers (Phase 2)."""
        # Phase 2: Use features + labels to train simple classifier (logistic regression, etc.)
        raise NotImplementedError(
            "Training not implemented yet. "
            "Phase 2 task: Train classifier (logistic regression or simple neural net) "
            "on style features from accepted/rejected papers in one subfield."
        )
