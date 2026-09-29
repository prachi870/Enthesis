"""Baseline classifier for weakness detection (Module 3).

Phase 1: Keyword-based pattern matching
Phase 2: Fine-tuned BERT/RoBERTa classifier on OpenReview data
"""
from __future__ import annotations
from .preprocessing import WeaknessCategory, WEAKNESS_KEYWORDS, categorize_weakness


class KeywordWeaknessDetector:
    """Baseline weakness detector using keyword patterns.
    
    This is a simple rule-based approach for Phase 1.
    Will be replaced with fine-tuned classifier in Phase 2.
    """
    
    def __init__(self):
        self.categories = list(WEAKNESS_KEYWORDS.keys())
    
    def predict(self, text: str) -> list[dict]:
        """Detect potential weaknesses in paper text.
        
        Args:
            text: Paper section text (method, evaluation, etc.)
            
        Returns:
            List of detected weaknesses with category, confidence, evidence
        """
        text_lower = text.lower()
        detections = []
        
        for category, keywords in WEAKNESS_KEYWORDS.items():
            matches = []
            for keyword in keywords:
                if keyword in text_lower:
                    # Find all occurrences
                    start = 0
                    while True:
                        idx = text_lower.find(keyword, start)
                        if idx == -1:
                            break
                        matches.append((keyword, idx))
                        start = idx + 1
            
            if matches:
                # Get context for first match
                keyword, idx = matches[0]
                context_start = max(0, idx - 150)
                context_end = min(len(text), idx + len(keyword) + 150)
                context = text[context_start:context_end].strip()
                
                # Compute simple confidence based on number of matching keywords
                confidence = min(0.3 + len(matches) * 0.1, 0.7)
                
                detections.append({
                    "category": category,
                    "confidence": confidence,
                    "evidence_span": context,
                    "keyword_matches": [kw for kw, _ in matches],
                    "explanation": self._generate_explanation(category),
                })
        
        return detections
    
    def predict_proba(self, text: str) -> dict[WeaknessCategory, float]:
        """Return probability distribution over weakness categories.
        
        For keyword baseline, this is based on keyword density.
        """
        text_lower = text.lower()
        scores = {}
        
        for category, keywords in WEAKNESS_KEYWORDS.items():
            # Count keyword occurrences
            count = sum(text_lower.count(kw) for kw in keywords)
            # Normalize by text length (rough probability)
            score = min(count / max(len(text.split()) / 100, 1), 1.0)
            scores[category] = score
        
        return scores  # type: ignore
    
    def _generate_explanation(self, category: WeaknessCategory) -> str:
        """Generate human-readable explanation for detected weakness."""
        explanations = {
            "missing_baseline": "Consider adding baseline comparisons to demonstrate improvement.",
            "weak_evaluation": "Evaluation could be strengthened with additional experiments or metrics.",
            "unclear_method": "Method description may benefit from additional detail or clarification.",
            "limited_novelty": "Consider emphasizing novel contributions or distinguishing from prior work.",
            "insufficient_analysis": "Additional analysis (e.g., ablations, error analysis) would strengthen claims.",
            "overstated_claims": "Ensure claims are well-supported by experimental results.",
            "other": "Review feedback suggests potential improvement in this area.",
        }
        return explanations.get(category, "Consider addressing this area based on reviewer feedback.")
    
    def evaluate(self, test_data: list[tuple[str, list[WeaknessCategory]]]) -> dict:
        """Evaluate detector on labeled test data.
        
        Args:
            test_data: [(text, [true_category1, true_category2, ...]), ...]
            
        Returns:
            Per-category precision and recall
        """
        if not test_data:
            return {
                "precision_per_category": {},
                "recall_per_category": {},
                "note": "No test data available - Phase 1 incomplete"
            }
        
        # Track true positives, false positives, false negatives per category
        tp = {cat: 0 for cat in self.categories}
        fp = {cat: 0 for cat in self.categories}
        fn = {cat: 0 for cat in self.categories}
        
        for text, true_categories in test_data:
            predictions = self.predict(text)
            pred_categories = {p["category"] for p in predictions}
            true_set = set(true_categories)
            
            for category in self.categories:
                if category in pred_categories and category in true_set:
                    tp[category] += 1
                elif category in pred_categories and category not in true_set:
                    fp[category] += 1
                elif category not in pred_categories and category in true_set:
                    fn[category] += 1
        
        # Compute precision and recall
        precision = {}
        recall = {}
        for category in self.categories:
            if tp[category] + fp[category] > 0:
                precision[category] = tp[category] / (tp[category] + fp[category])
            else:
                precision[category] = 0.0
            
            if tp[category] + fn[category] > 0:
                recall[category] = tp[category] / (tp[category] + fn[category])
            else:
                recall[category] = 0.0
        
        return {
            "precision_per_category": precision,
            "recall_per_category": recall,
            "baseline": "keyword_matching",
            "n_samples": len(test_data),
        }


def prepare_openreview_dataset(reviews: list[dict]) -> list[tuple[str, list[WeaknessCategory]]]:
    """Convert OpenReview reviews into weakness detection dataset.
    
    This requires manual annotation or semi-automatic categorization.
    """
    # Placeholder - needs actual OpenReview data and annotation
    return []
