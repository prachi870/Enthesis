"""Clarity checking module (Module 5) - As per Enthesis Project Guide."""
from __future__ import annotations
import re
from modules.base import ModuleResult, NLPModule


class FastClarityAnalyzer:
    """Module 5: Clarity check
    
    Per PDF: Measures writing style (sentence length variance, hedging, 
    vague phrases) and flags unclear or repetitive parts.
    """
    
    def predict(self, text: str) -> dict:
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        if not sentences:
            return {
                "clarity_score": 0,
                "features": {},
                "recommendations": ["No text to analyze"],
                "flagged_passages": []
            }
        
        # Feature 1: Sentence length variance
        sent_lengths = [len(s.split()) for s in sentences]
        avg_sent_len = sum(sent_lengths) / len(sent_lengths)
        
        # Feature 2: Hedging words (vague language)
        hedging_words = ['might', 'maybe', 'perhaps', 'possibly', 'seems', 'appears', 
                        'likely', 'probably', 'somewhat', 'quite', 'rather']
        hedging_count = sum(1 for s in sentences 
                          for word in hedging_words 
                          if re.search(r'\b' + word + r'\b', s.lower()))
        
        # Feature 3: Passive voice
        passive_voice = sum(1 for s in sentences 
                           if re.search(r'\b(?:is|are|was|were|been|being)\s+\w+ed\b', s, re.I))
        
        # Feature 4: Long sentences (>25 words)
        long_sentences = sum(1 for l in sent_lengths if l > 25)
        
        # Feature 5: Vague phrases
        vague_phrases = ['a lot of', 'many', 'several', 'various', 'numerous', 'some']
        vague_count = sum(1 for s in sentences.lower()
                         for phrase in vague_phrases 
                         if phrase in s)
        
        # Feature 6: Repetitive words
        all_words = ' '.join(sentences).lower().split()
        word_freq = {}
        for word in all_words:
            if len(word) > 4:  # Only content words
                word_freq[word] = word_freq.get(word, 0) + 1
        repetitive = sum(1 for count in word_freq.values() if count > 5)
        
        # Calculate clarity score (0-1)
        clarity_score = 1.0
        clarity_score -= (long_sentences / len(sentences)) * 0.25  # Penalty for long sentences
        clarity_score -= (passive_voice / len(sentences)) * 0.20   # Penalty for passive voice
        clarity_score -= (hedging_count / len(sentences)) * 0.15   # Penalty for hedging
        clarity_score -= (vague_count / len(sentences)) * 0.15     # Penalty for vagueness
        clarity_score -= (repetitive / 50) * 0.10                  # Penalty for repetition
        clarity_score = max(0, min(1, clarity_score))
        
        # Generate recommendations
        recommendations = []
        if long_sentences > len(sentences) * 0.2:
            recommendations.append("⚠️ Break down long sentences (>25 words) for better readability")
        else:
            recommendations.append("✓ Sentence length is generally appropriate")
            
        if passive_voice > len(sentences) * 0.15:
            recommendations.append("⚠️ Reduce passive voice usage - prefer active constructions")
        else:
            recommendations.append("✓ Good use of active voice")
            
        if hedging_count > len(sentences) * 0.1:
            recommendations.append("⚠️ Too much hedging language - be more confident in claims")
        else:
            recommendations.append("✓ Appropriate level of certainty in claims")
            
        if vague_count > len(sentences) * 0.1:
            recommendations.append("⚠️ Replace vague phrases with specific quantitative statements")
        
        if repetitive > 3:
            recommendations.append(f"⚠️ {repetitive} words used repetitively - vary vocabulary")
        
        # Flag problematic passages
        flagged = []
        for i, s in enumerate(sentences[:20]):  # Check first 20
            issues = []
            if len(s.split()) > 30:
                issues.append("very long sentence")
            if re.search(r'\b(?:is|are|was|were)\s+\w+ed\b', s):
                issues.append("passive voice")
            if any(word in s.lower() for word in hedging_words):
                issues.append("hedging language")
            
            if issues:
                flagged.append({
                    "sentence_index": i,
                    "sentence": s[:100] + "..." if len(s) > 100 else s,
                    "issues": issues,
                    "word_count": len(s.split())
                })
        
        return {
            "clarity_score": round(clarity_score, 3),
            "features": {
                "avg_sentence_length": round(avg_sent_len, 1),
                "long_sentences": long_sentences,
                "passive_voice_count": passive_voice,
                "hedging_count": hedging_count,
                "vague_phrases": vague_count,
                "repetitive_words": repetitive,
                "total_sentences": len(sentences)
            },
            "recommendations": recommendations,
            "flagged_passages": flagged[:10]  # Top 10
        }


class ClarityModule(NLPModule):
    """Module 5: Clarity check - As per project guide."""
    name = "clarity"
    
    def __init__(self, model=None):
        self.model = model or FastClarityAnalyzer()
    
    def predict(self, document: dict) -> ModuleResult:
        """Analyze clarity of the document.
        
        Args:
            document: {"text": str}
            
        Returns:
            ModuleResult with clarity analysis and recommendations
        """
        text = document.get("text", "")
        
        if not text.strip():
            return ModuleResult(
                module=self.name,
                model="feature_based_baseline",
                status="failed",
                limitations=["No text provided for clarity analysis"],
                metrics={"correlation": "TBD"},
            )
        
        # Run clarity analysis
        analysis = self.model.predict(text)
        
        # Format findings
        findings = [
            {
                "type": "overall_score",
                "clarity_score": analysis["clarity_score"],
                "interpretation": self._interpret_score(analysis["clarity_score"]),
            },
            {
                "type": "style_features",
                "features": analysis["features"],
            },
            {
                "type": "recommendations",
                "recommendations": analysis["recommendations"],
            }
        ]
        
        # Evidence = flagged passages
        evidence = []
        for flagged in analysis["flagged_passages"][:10]:  # Limit to top 10
            evidence.append({
                "sentence_index": flagged["sentence_index"],
                "text": flagged["sentence"],
                "issues": flagged["issues"],
                "word_count": flagged["word_count"],
            })
        
        limitations = [
            "Baseline uses feature-based heuristics; classifier not yet trained (Phase 2).",
            "Correlation with acceptance: TBD (no accepted/rejected dataset evaluated yet).",
            "Clarity score is not a guarantee of acceptance - many factors influence reviews.",
            "Features measure surface-level style, not semantic clarity or correctness.",
            "Recommendations are concrete guidance, not automatic rewriting."
        ]
        
        return ModuleResult(
            module=self.name,
            model="feature_based_clarity_baseline",
            status="completed",
            confidence=0.4,  # Medium-low confidence for heuristic baseline
            findings=findings,
            evidence=evidence,
            metrics={"correlation": "TBD", "baseline_correlation": "TBD"},
            limitations=limitations,
        )
    
    def _interpret_score(self, score: float) -> str:
        """Interpret clarity score."""
        if score >= 0.8:
            return "Writing is generally clear and well-structured."
        elif score >= 0.6:
            return "Writing is acceptable but has areas for improvement."
        elif score >= 0.4:
            return "Writing has multiple clarity issues that should be addressed."
        else:
            return "Writing needs significant revision for clarity."
    
    def train(self, config: dict) -> None:
        """Train classifier on accepted/rejected papers (Phase 2)."""
        raise NotImplementedError(
            "Training not implemented yet. "
            "Phase 2 task: Train classifier on style features from accepted/rejected papers. "
            "Requires: Clarity dataset (one subfield), feature extraction, training script."
        )
    
    def evaluate(self, dataset) -> dict:
        """Evaluate correlation with accept/reject labels."""
        raise NotImplementedError(
            "Evaluation not implemented yet. "
            "Required: Load accepted/rejected papers, compute feature correlation with labels."
        )
    
    def get_metrics(self) -> dict:
        """Return latest evaluation metrics."""
        return {
            "baseline_correlation": "TBD",
            "improved_correlation": "TBD",
            "dataset": "Accepted/Rejected papers (subfield TBD)",
            "note": "Phase 1 not complete - no correlation measured on real data"
        }
