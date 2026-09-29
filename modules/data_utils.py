"""Data loading utilities for all modules.

Follow Phase 1 requirement: verify licenses before downloading.
All loaders return consistent formats and log dataset access.
"""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any


def load_scierc(cache_dir: Path | None = None) -> dict[str, list[dict]]:
    """Load SciERC dataset for entity extraction (Module 1).
    
    LICENSE: Must be verified before use. AI2 license from https://github.com/allenai/sciERC
    
    Returns:
        {
            "train": [{"doc_key": str, "sentences": list[list[str]], "ner": list[list[list]]}],
            "dev": [...],
            "test": [...]
        }
    """
    raise NotImplementedError(
        "SciERC dataset not downloaded. "
        "Required action: Verify license at https://github.com/allenai/sciERC, "
        "then implement loading via HuggingFace datasets or direct download."
    )


def load_scifact(cache_dir: Path | None = None) -> dict[str, Any]:
    """Load SciFact dataset for claim verification (Module 2).
    
    LICENSE: Apache 2.0 (verified at https://github.com/allenai/scifact)
    
    Returns:
        {
            "claims": {"train": [...], "dev": [...], "test": [...]},
            "corpus": {doc_id: {"title": str, "abstract": str, "structured": bool}}
        }
    """
    raise NotImplementedError(
        "SciFact dataset not downloaded. "
        "Required action: Download from HuggingFace: datasets.load_dataset('allenai/scifact')"
    )


def load_openreview_reviews(
    venue: str = "ICLR.cc/2023/Conference",
    cache_dir: Path | None = None
) -> list[dict]:
    """Load OpenReview reviews for weakness detection and reviewer feedback (Modules 3 & 4).
    
    LICENSE: OpenReview Terms of Service (public reviews only)
    Website: https://openreview.net/
    
    Args:
        venue: OpenReview venue ID (e.g., "ICLR.cc/2023/Conference")
        cache_dir: Local cache directory
        
    Returns:
        [
            {
                "paper_id": str,
                "review_id": str,
                "rating": int,
                "confidence": int,
                "summary": str,
                "strengths": str,
                "weaknesses": str,
                "questions": str
            }
        ]
    """
    raise NotImplementedError(
        "OpenReview data not accessed. "
        "Required action: Review Terms of Service at https://openreview.net/, "
        "install openreview-py package, and implement API access."
    )


def load_clarity_corpus(subfield: str = "nlp", cache_dir: Path | None = None) -> dict[str, list[dict]]:
    """Load accepted/rejected papers for clarity analysis (Module 5).
    
    LICENSE: Depends on source - must verify before use
    
    Potential sources:
    - PeerRead: https://github.com/allenai/PeerRead (MIT license)
    - ACL papers with OpenReview acceptance status
    
    Args:
        subfield: Research subfield (e.g., "nlp", "cv", "ml")
        cache_dir: Local cache directory
        
    Returns:
        {
            "accepted": [{"title": str, "abstract": str, "text": str}],
            "rejected": [{"title": str, "abstract": str, "text": str}]
        }
    """
    raise NotImplementedError(
        "Clarity corpus not selected or downloaded. "
        "Required action: Select one subfield, verify license, and implement loading."
    )


def get_semantic_scholar_corpus(
    query: str | None = None,
    limit: int = 10000,
    fields: list[str] | None = None
) -> list[dict]:
    """Retrieve papers from Semantic Scholar API for retrieval corpus (Module 1).
    
    LICENSE: Semantic Scholar API Terms of Service (non-commercial research allowed)
    API Docs: https://api.semanticscholar.org/api-docs/
    
    Args:
        query: Search query (None = general CS papers)
        limit: Maximum papers to retrieve
        fields: Fields to return (title, abstract, authors, year, etc.)
        
    Returns:
        [{"paperId": str, "title": str, "abstract": str, ...}]
    """
    raise NotImplementedError(
        "Semantic Scholar API not configured. "
        "Required action: Review Terms of Service, obtain API key if needed, "
        "implement API client with rate limiting."
    )


# Validation helpers

def validate_dataset_license(dataset_name: str) -> bool:
    """Check if dataset license has been verified and documented.
    
    Returns False if dataset is not in docs/datasets.md with verified status.
    """
    # In production, this would parse docs/datasets.md
    # For now, return False to enforce manual verification
    return False


def dataset_status_check():
    """Print current status of all required datasets."""
    datasets = {
        "SciERC (Module 1 - Extraction)": "❌ Not downloaded - License must be verified",
        "S2ORC/Semantic Scholar (Module 1 - Retrieval)": "❌ Not configured - Terms of Service must be reviewed",
        "SciFact (Module 2 - Novelty)": "❌ Not downloaded - Apache 2.0 license verified",
        "OpenReview (Modules 3 & 4)": "❌ Not accessed - Terms of Service must be reviewed",
        "Clarity Corpus (Module 5)": "❌ Not selected - Subfield and source must be chosen",
    }
    
    print("\n=== Enthesis Dataset Status (Phase 1 Requirement) ===\n")
    for dataset, status in datasets.items():
        print(f"{dataset}")
        print(f"  {status}\n")
    print("Phase 1 completion criterion: All datasets downloaded and licensed")
    print("Current status: NOT READY\n")


if __name__ == "__main__":
    dataset_status_check()
