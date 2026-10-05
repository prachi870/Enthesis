"""Novelty detection module - As per Enthesis Project Guide."""
import re
from modules.base import ModuleResult, NLPModule


class NoveltyModule(NLPModule):
    """Module 2: Check novelty
    
    Per PDF: Compares "we are the first to..." claims against existing papers
    using entailment (NLI): supported, contradicted, or already done.
    """
    
    def predict(self, paper_data: dict) -> ModuleResult:
        text = paper_data.get("text", "")
        text_lower = text.lower()
        
        # Find novelty claims
        novelty_patterns = [
            r'we\s+are\s+the\s+first',
            r'(?:novel|new|original|unique|innovative)\s+(?:approach|method|framework|technique|contribution)',
            r'we\s+(?:propose|present|introduce)\s+(?:a|an)\s+(?:novel|new)',
            r'to\s+(?:our|the\s+best\s+of\s+our)\s+knowledge',
            r'(?:first|pioneering)\s+(?:work|study|attempt)',
            r'previously\s+(?:unexplored|unstudied)'
        ]
        
        novel_claims = []
        for pattern in novelty_patterns:
            matches = re.findall(f'.{{0,50}}{pattern}.{{0,50}}', text_lower, re.I)
            novel_claims.extend(matches[:3])
        
        unique_claims = list(dict.fromkeys(claim.strip() for claim in novel_claims if claim.strip()))

        return ModuleResult(
            module="novelty",
            model="pattern_matching_claim_extraction",
            status="completed",
            findings=[{
                "type": "novelty_analysis",
                "claims_found": len(unique_claims),
                "summary": (
                    f"Extracted {len(unique_claims)} potential novelty claim(s) by text pattern. "
                    "No literature-corpus comparison was performed."
                )
            }],
            evidence=[
                {"claim": claim, "classification": "requires_investigation"}
                for claim in unique_claims[:10]
            ],
            metrics={"claims_found": len(unique_claims)},
            limitations=[
                "Pattern matching identifies claim wording only and does not determine novelty.",
                "No external literature search or NLI comparison was performed."
            ]
        )
