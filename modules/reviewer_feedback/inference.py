"""Reviewer-style feedback module (Module 4) - Most research-heavy module."""
from __future__ import annotations
import re
from modules.base import ModuleResult, NLPModule


class ReviewerFeedbackGenerator:
    """Module 4: Reviewer-Style Feedback
    
    Per Project Guide: Groups real reviews by writing style using clustering,
    then generates feedback on your draft in those styles.
    
    Research Approach:
    - OpenReview reviewer comments
    - Review embeddings
    - HDBSCAN clustering
    - LoRA fine-tuned small LLM
    - Score: Overlap with issues real reviewers raised
    
    NOTE: This is the most novel and riskiest module (Phase 2, most time allocation)
    """
    
    def predict(self, text: str, previous_findings: dict = None) -> dict:
        """Generate reviewer-style feedback based on patterns.
        
        For Phase 1 baseline: Use rule-based patterns matching common reviewer concerns.
        For Phase 2: Use trained LLM with LoRA fine-tuning on OpenReview data.
        """
        previous_findings = previous_findings or {}
        
        # Extract previous module issues for context
        related_work_issues = previous_findings.get("related_work", {})
        novelty_issues = previous_findings.get("novelty", {})
        weakness_issues = previous_findings.get("weaknesses", {})
        clarity_issues = previous_findings.get("clarity", {})
        
        # Common reviewer concern patterns (baseline approach)
        feedback_items = []
        
        # 1. Related Work Coverage
        if related_work_issues.get("papers_found", 0) < 5:
            feedback_items.append({
                "concern_type": "insufficient_related_work",
                "severity": "major",
                "reviewer_style": "thorough",
                "feedback": (
                    "The related work section appears limited. A comprehensive survey of recent work "
                    "in this area would strengthen the positioning of this contribution."
                ),
                "evidence": "Limited papers found in related work analysis",
                "suggested_action": "Expand literature review to include recent publications in the field",
                "confidence": 0.7
            })
        
        # 2. Novelty Concerns
        if novelty_issues.get("contradicted_claims", 0) > 0:
            feedback_items.append({
                "concern_type": "novelty_questioned",
                "severity": "major",
                "reviewer_style": "critical",
                "feedback": (
                    "The novelty claim requires careful reconsideration. Existing work appears to "
                    "address similar aspects of the problem. The authors should clarify what is "
                    "genuinely novel beyond prior art."
                ),
                "evidence": "Novelty contradictions detected",
                "suggested_action": "Refine novelty claims to clearly distinguish from existing work",
                "confidence": 0.8
            })
        
        # 3. Methodology Weaknesses
        if weakness_issues.get("categories", []):
            for category in weakness_issues.get("categories", [])[:3]:
                if category == "missing_baseline":
                    feedback_items.append({
                        "concern_type": "experimental_design",
                        "severity": "major",
                        "reviewer_style": "methodical",
                        "feedback": (
                            "The experimental evaluation would benefit from comparison against "
                            "established baselines. Without this, it's difficult to assess the "
                            "magnitude of improvement."
                        ),
                        "evidence": "Missing baseline detection",
                        "suggested_action": "Add baseline comparisons (simple baseline, state-of-the-art)",
                        "confidence": 0.75
                    })
                elif category == "weak_evaluation":
                    feedback_items.append({
                        "concern_type": "evaluation_rigor",
                        "severity": "moderate",
                        "reviewer_style": "methodical",
                        "feedback": (
                            "The evaluation could be more rigorous. Consider including additional "
                            "metrics, ablation studies, and statistical significance testing."
                        ),
                        "evidence": "Weak evaluation patterns detected",
                        "suggested_action": "Strengthen evaluation with multiple metrics and statistical tests",
                        "confidence": 0.7
                    })
        
        # 4. Clarity Issues
        if clarity_issues.get("clarity_score", 1.0) < 0.6:
            feedback_items.append({
                "concern_type": "writing_clarity",
                "severity": "minor",
                "reviewer_style": "constructive",
                "feedback": (
                    "The manuscript would benefit from careful proofreading. Several passages "
                    "could be made clearer and more precise."
                ),
                "evidence": f"Clarity score: {clarity_issues.get('clarity_score', 0.5):.2f}",
                "suggested_action": "Revise for clarity, reduce passive voice, be more specific",
                "confidence": 0.65
            })
        
        # 5. General Methodological Concerns (pattern-based)
        methodology_keywords = [
            'method', 'approach', 'algorithm', 'model', 'architecture', 'design'
        ]
        if any(keyword in text.lower()[:1000] for keyword in methodology_keywords):
            # Check for common issues
            if 'baseline' not in text.lower():
                feedback_items.append({
                    "concern_type": "baseline_comparison",
                    "severity": "major",
                    "reviewer_style": "critical",
                    "feedback": (
                        "The paper should include baseline comparisons to contextualize the results. "
                        "This is standard practice in empirical research."
                    ),
                    "evidence": "No baseline mentioned in methodology",
                    "suggested_action": "Add baseline experiments and comparisons",
                    "confidence": 0.6
                })
        
        # 6. Reproducibility
        if 'code' not in text.lower() and 'github' not in text.lower():
            feedback_items.append({
                "concern_type": "reproducibility",
                "severity": "minor",
                "reviewer_style": "practical",
                "feedback": (
                    "Consider making code available to facilitate reproducibility. "
                    "This is increasingly expected in the research community."
                ),
                "evidence": "No code availability mentioned",
                "suggested_action": "Include code repository link or plan to release code",
                "confidence": 0.5
            })
        
        # Aggregate by severity
        major_concerns = [f for f in feedback_items if f["severity"] == "major"]
        moderate_concerns = [f for f in feedback_items if f["severity"] == "moderate"]
        minor_concerns = [f for f in feedback_items if f["severity"] == "minor"]
        
        # Overall recommendation (pattern-based)
        if len(major_concerns) >= 3:
            overall = "reject"
            summary = "Multiple major concerns require substantial revision"
        elif len(major_concerns) >= 1:
            overall = "major_revision"
            summary = "Significant issues need addressing before acceptance"
        elif len(moderate_concerns) >= 2:
            overall = "minor_revision"
            summary = "Paper is promising but needs refinement"
        else:
            overall = "accept_with_minor_revisions"
            summary = "Paper is generally sound with minor improvements needed"
        
        return {
            "overall_assessment": overall,
            "summary": summary,
            "feedback_items": feedback_items,
            "major_concerns": len(major_concerns),
            "moderate_concerns": len(moderate_concerns),
            "minor_concerns": len(minor_concerns),
            "total_issues": len(feedback_items),
            "reviewer_styles_detected": list(set(f["reviewer_style"] for f in feedback_items)),
        }


class ReviewerFeedbackModule(NLPModule):
    """Module 4: Reviewer-Style Feedback
    
    Most research-heavy and novel module per project guide.
    """
    name = "reviewer_feedback"
    
    def __init__(self, model=None):
        self.model = model or ReviewerFeedbackGenerator()
    
    def predict(self, document: dict, previous_results: dict = None) -> ModuleResult:
        """Generate reviewer-style feedback.
        
        Args:
            document: {"text": str}
            previous_results: Results from previous modules for context
            
        Returns:
            ModuleResult with reviewer-style feedback
        """
        text = document.get("text", "")
        previous_results = previous_results or {}
        
        if not text.strip():
            return ModuleResult(
                module=self.name,
                model="pattern_based_baseline",
                status="failed",
                limitations=["No text provided for reviewer feedback generation"],
                metrics={"overlap_score": "TBD"},
            )
        
        # Extract previous findings for context
        previous_findings = {}
        for module_name in ["related_work", "novelty", "weaknesses", "clarity"]:
            if module_name in previous_results:
                result = previous_results[module_name]
                if hasattr(result, 'findings'):
                    previous_findings[module_name] = {
                        "findings": result.findings,
                        "confidence": result.confidence
                    }
        
        # Generate reviewer-style feedback
        analysis = self.model.predict(text, previous_findings)
        
        # Format findings
        findings = [
            {
                "type": "overall_assessment",
                "assessment": analysis["overall_assessment"],
                "summary": analysis["summary"],
                "confidence": 0.5,  # Lower confidence for baseline
            },
            {
                "type": "concern_counts",
                "major_concerns": analysis["major_concerns"],
                "moderate_concerns": analysis["moderate_concerns"],
                "minor_concerns": analysis["minor_concerns"],
                "total_issues": analysis["total_issues"],
            },
            {
                "type": "reviewer_styles",
                "styles_detected": analysis["reviewer_styles_detected"],
            }
        ]
        
        # Evidence = detailed feedback items
        evidence = []
        for item in analysis["feedback_items"]:
            evidence.append({
                "concern_type": item["concern_type"],
                "severity": item["severity"],
                "reviewer_style": item["reviewer_style"],
                "feedback": item["feedback"],
                "evidence_basis": item["evidence"],
                "suggested_action": item["suggested_action"],
                "confidence": item["confidence"],
            })
        
        limitations = [
            "MOST RESEARCH-HEAVY MODULE - This is a Phase 1 baseline only.",
            "Phase 2 requires: OpenReview data, review embeddings, HDBSCAN clustering, LoRA fine-tuning.",
            "Current baseline uses rule-based patterns, not learned reviewer styles.",
            "Overlap score with real reviewers: TBD (requires held-out OpenReview test set).",
            "This is AI-generated feedback, not actual peer review.",
            "Feedback reflects common patterns but may miss paper-specific nuances.",
            "Module 4 given most time in Phase 2 (riskiest and most novel per guide).",
        ]
        
        return ModuleResult(
            module=self.name,
            model="pattern_based_reviewer_baseline",
            status="completed",
            confidence=0.35,  # Low confidence for pattern-based baseline
            findings=findings,
            evidence=evidence,
            metrics={
                "overlap_score": "TBD",
                "phase": "Phase 1 baseline - no ML model yet"
            },
            limitations=limitations,
        )
    
    def train(self, config: dict) -> None:
        """Train reviewer feedback model (Phase 2 - most time allocated)."""
        raise NotImplementedError(
            "Training not implemented yet. "
            "Phase 2 task (MOST RESEARCH-HEAVY): "
            "1. Download OpenReview reviews via API "
            "2. Generate review embeddings "
            "3. Cluster with HDBSCAN to find reviewer style groups "
            "4. Fine-tune small LLM with LoRA on each style cluster "
            "5. Test on held-out OpenReview papers "
            "6. Measure overlap with real reviewer concerns "
            "This is the riskiest module - allocate most time."
        )
    
    def evaluate(self, dataset) -> dict:
        """Evaluate overlap with real reviewer issues."""
        raise NotImplementedError(
            "Evaluation not implemented yet. "
            "Required: "
            "1. Hold-out OpenReview papers (unseen) "
            "2. Generate feedback BEFORE reading real reviews "
            "3. Count overlap with actual reviewer concerns "
            "4. Report precision/recall of caught issues"
        )
    
    def get_metrics(self) -> dict:
        """Return latest evaluation metrics."""
        return {
            "overlap_with_real_reviewers": "TBD",
            "precision": "TBD",
            "recall": "TBD",
            "dataset": "OpenReview (test set TBD)",
            "note": "Phase 1 baseline only - most research-heavy module per guide"
        }
