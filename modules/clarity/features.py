"""Style feature extraction for clarity analysis (Module 5)."""
from __future__ import annotations
import re
import numpy as np
from typing import Any


# Hedging and vague phrases
HEDGING_PHRASES = [
    "might", "may", "could", "possibly", "perhaps", "seems",
    "appears", "suggests", "indicates", "likely", "probably",
    "somewhat", "relatively", "fairly", "rather", "quite"
]

VAGUE_PHRASES = [
    "very", "really", "quite", "somewhat", "rather", "fairly",
    "several", "various", "numerous", "many", "some",
    "thing", "stuff", "aspect", "factor", "issue", "etc"
]


def extract_style_features(text: str) -> dict[str, Any]:
    """Extract measurable style features for clarity assessment.
    
    Features per spec (Module 5):
    - Sentence length variation
    - Hedging language
    - Vague phrases
    - Repetition
    """
    sentences = split_sentences(text)
    words = text.lower().split()
    
    features = {}
    
    # 1. Sentence length variation
    if sentences:
        sentence_lengths = [len(s.split()) for s in sentences]
        features["mean_sentence_length"] = np.mean(sentence_lengths)
        features["std_sentence_length"] = np.std(sentence_lengths)
        features["max_sentence_length"] = max(sentence_lengths)
        features["min_sentence_length"] = min(sentence_lengths)
        # Coefficient of variation (normalized measure of variation)
        features["sentence_length_cv"] = (
            features["std_sentence_length"] / features["mean_sentence_length"]
            if features["mean_sentence_length"] > 0 else 0
        )
    else:
        features.update({
            "mean_sentence_length": 0,
            "std_sentence_length": 0,
            "max_sentence_length": 0,
            "min_sentence_length": 0,
            "sentence_length_cv": 0,
        })
    
    # 2. Hedging language density
    hedging_count = sum(1 for word in words if word in HEDGING_PHRASES)
    features["hedging_density"] = hedging_count / max(len(words), 1)
    features["hedging_count"] = hedging_count
    
    # 3. Vague phrases density
    vague_count = sum(1 for word in words if word in VAGUE_PHRASES)
    features["vague_density"] = vague_count / max(len(words), 1)
    features["vague_count"] = vague_count
    
    # 4. Repetition metrics
    # Word repetition (excluding common stop words)
    word_counts = {}
    for word in words:
        if len(word) > 3:  # Skip very short words
            word_counts[word] = word_counts.get(word, 0) + 1
    
    if word_counts:
        repeated_words = {w: c for w, c in word_counts.items() if c > 3}
        features["unique_word_ratio"] = len(word_counts) / max(len(words), 1)
        features["highly_repeated_words"] = len(repeated_words)
        features["max_word_repetition"] = max(word_counts.values())
    else:
        features["unique_word_ratio"] = 0
        features["highly_repeated_words"] = 0
        features["max_word_repetition"] = 0
    
    # 5. Phrase repetition (bigrams)
    bigrams = [f"{words[i]} {words[i+1]}" for i in range(len(words)-1)]
    bigram_counts = {}
    for bigram in bigrams:
        bigram_counts[bigram] = bigram_counts.get(bigram, 0) + 1
    
    repeated_bigrams = {b: c for b, c in bigram_counts.items() if c > 2}
    features["repeated_phrase_count"] = len(repeated_bigrams)
    
    # 6. Additional readability indicators
    features["total_words"] = len(words)
    features["total_sentences"] = len(sentences)
    features["avg_word_length"] = np.mean([len(w) for w in words]) if words else 0
    
    return features


def split_sentences(text: str) -> list[str]:
    """Simple sentence splitter."""
    # Basic sentence splitting on period, exclamation, question mark
    sentences = re.split(r'[.!?]+', text)
    return [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]


def flag_unclear_passages(text: str, features: dict) -> list[dict]:
    """Flag specific passages that may be unclear or repetitive.
    
    Returns list of flagged passages with reasons.
    """
    flags = []
    sentences = split_sentences(text)
    
    for i, sentence in enumerate(sentences):
        issues = []
        
        # Check sentence length
        word_count = len(sentence.split())
        if word_count > 50:
            issues.append("very_long")
        elif word_count < 5:
            issues.append("very_short")
        
        # Check for excessive hedging
        sentence_lower = sentence.lower()
        hedging_in_sentence = sum(1 for phrase in HEDGING_PHRASES if phrase in sentence_lower)
        if hedging_in_sentence >= 3:
            issues.append("excessive_hedging")
        
        # Check for vague language
        vague_in_sentence = sum(1 for phrase in VAGUE_PHRASES if phrase in sentence_lower)
        if vague_in_sentence >= 3:
            issues.append("vague_language")
        
        if issues:
            flags.append({
                "sentence_index": i,
                "sentence": sentence[:200],  # Truncate for display
                "issues": issues,
                "word_count": word_count,
            })
    
    return flags


def compute_clarity_score(features: dict) -> float:
    """Compute overall clarity score (0-1, higher is clearer).
    
    This is a simple heuristic for the baseline.
    Phase 2 will use a trained classifier.
    """
    score = 1.0
    
    # Penalize very high or very low sentence length variation
    if features["sentence_length_cv"] > 1.0:
        score -= 0.2
    elif features["sentence_length_cv"] < 0.2:
        score -= 0.1
    
    # Penalize high hedging
    if features["hedging_density"] > 0.02:
        score -= 0.2
    
    # Penalize vague language
    if features["vague_density"] > 0.03:
        score -= 0.2
    
    # Penalize low lexical diversity
    if features["unique_word_ratio"] < 0.3:
        score -= 0.2
    
    # Penalize excessive repetition
    if features["highly_repeated_words"] > 10:
        score -= 0.1
    
    return max(0.0, min(1.0, score))
