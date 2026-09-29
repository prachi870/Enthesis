"""Preprocessing for weakness detection (Module 3)."""
from __future__ import annotations
from typing import Literal

WeaknessCategory = Literal[
    "missing_baseline",
    "weak_evaluation",
    "unclear_method",
    "limited_novelty",
    "insufficient_analysis",
    "overstated_claims",
    "other"
]

# Weakness taxonomy based on common review patterns
WEAKNESS_KEYWORDS = {
    "missing_baseline": [
        "no baseline", "missing comparison", "no comparison", "compare with",
        "baseline missing", "lack of baseline", "should compare",
    ],
    "weak_evaluation": [
        "evaluation is weak", "limited evaluation", "insufficient experiments",
        "more experiments needed", "small dataset", "not enough evaluation",
        "limited experimental", "weak experimental"
    ],
    "unclear_method": [
        "unclear method", "not clear how", "method is unclear", "hard to understand",
        "unclear description", "more details needed", "insufficient detail",
        "poorly explained", "vague", "ambiguous"
    ],
    "limited_novelty": [
        "limited novelty", "not novel", "incremental", "minor improvement",
        "marginal contribution", "insufficient novelty", "lacks novelty",
        "similar to existing"
    ],
    "insufficient_analysis": [
        "lack of analysis", "no analysis", "insufficient analysis",
        "missing ablation", "no ablation", "why does", "what if",
        "failure cases", "error analysis missing"
    ],
    "overstated_claims": [
        "overstated", "overclaimed", "too strong", "not supported by",
        "claim is too broad", "not justified", "unsupported claim"
    ]
}


def extract_weakness_indicators(text: str) -> list[dict]:
    """Extract potential weakness mentions from text (method section, etc.).
    
    This is a simple pattern-based extractor for the baseline.
    Phase 2 will use a fine-tuned classifier.
    """
    text_lower = text.lower()
    indicators = []
    
    # Check each category
    for category, keywords in WEAKNESS_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                # Find approximate location
                start_idx = text_lower.find(keyword)
                # Get surrounding context
                context_start = max(0, start_idx - 100)
                context_end = min(len(text), start_idx + len(keyword) + 100)
                context = text[context_start:context_end]
                
                indicators.append({
                    "category": category,
                    "keyword": keyword,
                    "context": context.strip(),
                    "position": start_idx,
                })
    
    return indicators


def parse_openreview_comment(review_comment: dict) -> list[dict]:
    """Parse OpenReview comment structure into weakness annotations.
    
    Expected format:
    {
        "weaknesses": "1. Issue one\n2. Issue two\n...",
        ...
    }
    
    Returns list of weaknesses with manual or automatic categorization.
    """
    weaknesses_text = review_comment.get("weaknesses", "")
    
    # Split by numbered items or newlines
    import re
    items = re.split(r'\n\s*\d+[\.\)]\s*|\n-\s*', weaknesses_text)
    items = [item.strip() for item in items if item.strip()]
    
    parsed = []
    for item in items:
        # Attempt to categorize using keywords
        category = categorize_weakness(item)
        parsed.append({
            "text": item,
            "category": category,
            "confidence": 0.5 if category != "other" else 0.3,
        })
    
    return parsed


def categorize_weakness(weakness_text: str) -> WeaknessCategory:
    """Categorize a weakness using keyword matching (baseline approach)."""
    text_lower = weakness_text.lower()
    
    # Count matches for each category
    scores = {}
    for category, keywords in WEAKNESS_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text_lower)
        if score > 0:
            scores[category] = score
    
    if not scores:
        return "other"
    
    # Return category with highest score
    return max(scores.items(), key=lambda x: x[1])[0]  # type: ignore


def prepare_training_data(openreview_data: list[dict]) -> list[tuple[str, WeaknessCategory]]:
    """Prepare OpenReview comments as training data for classifier.
    
    Args:
        openreview_data: List of reviews with weakness sections
        
    Returns:
        List of (text, label) pairs for training
    """
    training_pairs = []
    
    for review in openreview_data:
        weaknesses = parse_openreview_comment(review)
        for weakness in weaknesses:
            training_pairs.append((
                weakness["text"],
                weakness["category"]
            ))
    
    return training_pairs
