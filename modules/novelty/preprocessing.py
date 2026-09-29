"""Claim extraction and preprocessing for novelty checking (Module 2)."""
from __future__ import annotations
import re
from typing import Any


# Common novelty claim patterns
NOVELTY_PATTERNS = [
    r"we (?:are the )?first to ([\w\s]{10,100})",
    r"to (?:the best of )?our knowledge,? (?:this is )?(?:the )?first ([\w\s]{10,100})",
    r"(?:this|our) (?:paper|work) (?:is the )?first to ([\w\s]{10,100})",
    r"novel (?:approach|method|technique|framework) (?:for|to) ([\w\s]{10,100})",
    r"unlike previous work,? (?:we|our) ([\w\s]{10,100})",
    r"no prior work has ([\w\s]{10,100})",
]


def extract_novelty_claims(text: str) -> list[dict[str, Any]]:
    """Extract claims of novelty from paper text.
    
    Returns list of claims with context for NLI verification.
    """
    claims = []
    
    for pattern in NOVELTY_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            # Get sentence context (rough approximation)
            start = max(0, match.start() - 100)
            end = min(len(text), match.end() + 100)
            context = text[start:end].strip()
            
            claim = {
                "claim_text": match.group(0),
                "claim_content": match.group(1) if match.lastindex else match.group(0),
                "context": context,
                "span": (match.start(), match.end()),
                "pattern": pattern,
            }
            claims.append(claim)
    
    return claims


def format_nli_pair(claim: str, evidence: str) -> dict[str, str]:
    """Format claim and evidence for NLI model.
    
    Args:
        claim: Hypothesis/claim to verify
        evidence: Premise/evidence from related work
        
    Returns:
        {"premise": str, "hypothesis": str}
    """
    return {
        "premise": evidence.strip(),
        "hypothesis": claim.strip(),
    }


def clean_claim_text(raw_claim: str) -> str:
    """Normalize claim text for comparison."""
    # Remove leading "we are the first to" etc.
    cleaned = re.sub(r"^(?:we (?:are the )?first to|to our knowledge,?\s*)", "", raw_claim, flags=re.IGNORECASE)
    return cleaned.strip()
