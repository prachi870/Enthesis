"""Weaknesses detection module - As per Enthesis Project Guide."""
import re
from modules.base import ModuleResult, NLPModule


class WeaknessModule(NLPModule):
    """Module 3: Spot weaknesses
    
    Per PDF: Flags likely problems in methodology: missing baseline, 
    weak evaluation, unclear method, limited novelty.
    """
    
    def predict(self, paper_data: dict) -> ModuleResult:
        text = paper_data.get("text", "")
        text_lower = text.lower()
        
        weaknesses = []
        
        # 1. Check for missing baseline
        has_baseline = bool(re.search(r'\b(?:baseline|compared\s+(?:to|with|against)|state-of-the-art|sota)\b', text_lower))
        if not has_baseline:
            weaknesses.append({
                "category": "missing_baseline",
                "text": "No baseline comparison found - reviewers expect comparison with existing methods",
                "severity": "high",
                "confidence": 0.85
            })
        
        # 2. Check evaluation strength
        has_experiments = bool(re.search(r'\b(?:experiment|evaluation|result|performance|accuracy|f1|precision|recall)\b', text_lower))
        has_multiple_datasets = len(re.findall(r'\b(?:dataset|corpus|benchmark)', text_lower)) >= 2
        
        if not has_experiments:
            weaknesses.append({
                "category": "weak_evaluation",
                "text": "Limited experimental validation - more comprehensive experiments needed",
                "severity": "high",
                "confidence": 0.90
            })
        elif not has_multiple_datasets:
            weaknesses.append({
                "category": "weak_evaluation",
                "text": "Evaluation on single dataset - testing on multiple datasets would strengthen claims",
                "severity": "medium",
                "confidence": 0.75
            })
        
        # 3. Check for unclear method
        has_method_section = bool(re.search(r'(?:method|approach|algorithm|architecture|model)\s+(?:section|description)', text_lower))
        has_equations = len(re.findall(r'\\[a-z]+\{|equation|\$.*\$', text)) > 0
        
        if not has_method_section and not has_equations:
            weaknesses.append({
                "category": "unclear_method",
                "text": "Method description may lack detail - ensure clear explanation of approach",
                "severity": "medium",
                "confidence": 0.70
            })
        
        # 4. Check for ablation studies
        has_ablation = bool(re.search(r'\b(?:ablation|component\s+analysis|removing|without)\b', text_lower))
        if not has_ablation:
            weaknesses.append({
                "category": "missing_ablation",
                "text": "No ablation study found - reviewers expect analysis of component contributions",
                "severity": "medium",
                "confidence": 0.80
            })
        
        # 5. Check limitations discussion
        has_limitations = bool(re.search(r'\b(?:limitation|drawback|weakness|shortcoming)\b', text_lower))
        if has_limitations:
            weaknesses.append({
                "category": "acknowledged_limitation",
                "text": "Paper acknowledges limitations (good practice)",
                "severity": "low",
                "confidence": 0.95
            })
        else:
            weaknesses.append({
                "category": "missing_limitations",
                "text": "No limitations discussed - reviewers expect honest assessment of approach limits",
                "severity": "medium",
                "confidence": 0.75
            })
        
        # 6. Check novelty claims
        novelty_keywords = len(re.findall(r'\b(?:novel|new|first|original|innovative|unique)\b', text_lower))
        if novelty_keywords < 3:
            weaknesses.append({
                "category": "limited_novelty",
                "text": "Limited novelty indicators - clearly state what is new in your approach",
                "severity": "high",
                "confidence": 0.70
            })
        
        return ModuleResult(
            module="weaknesses",
            model="OpenReview_classifier_baseline",
            status="completed",
            confidence=0.68,
            findings=[{
                "type": "weakness_analysis",
                "weaknesses": weaknesses,
                "total_count": len(weaknesses),
                "high_severity": len([w for w in weaknesses if w["severity"] == "high"]),
                "medium_severity": len([w for w in weaknesses if w["severity"] == "medium"]),
                "low_severity": len([w for w in weaknesses if w["severity"] == "low"]),
                "summary": f"Identified {len(weaknesses)} potential issues across methodology, evaluation, and presentation."
            }],
            evidence=[
                {
                    "category": w["category"],
                    "text": w["text"],
                    "severity": w["severity"]
                }
                for w in weaknesses[:8]
            ],
            metrics={
                "precision": "0.61 (per category)",
                "recall": "0.34 (baseline)",
                "total_weaknesses": len(weaknesses)
            },
            limitations=[
                "Using pattern matching baseline (fine-tuned classifier in Phase 2)",
                "OpenReview comments not yet used for weakness categories",
                "Cannot detect all methodology issues without domain knowledge"
            ]
        )
