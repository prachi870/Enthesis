"""Related work module - As per Enthesis Project Guide."""
import re
from modules.base import ModuleResult, NLPModule


class RelatedWorkModule(NLPModule):
    """Module 1: Find related work
    
    Per PDF: Pulls out methods, datasets, and claims from papers, 
    then finds similar papers by meaning.
    """
    name = "related_work"

    def __init__(self, corpus: list[dict] | None = None):
        self.corpus = corpus or []

    def predict(self, document: dict) -> ModuleResult:
        text = document.get("text", "")
        
        # Extract methods (CamelCase, capitalized terms)
        methods = list(set(re.findall(r'\b([A-Z][a-z]+(?:[A-Z][a-z]+)+|[A-Z]{2,}(?:[a-z]+)?)\b', text)))[:15]
        
        # Extract datasets (UPPERCASE, data mentions)
        datasets = list(set(re.findall(r'\b([A-Z][A-Z]+(?:-[A-Z]+)?|(?:dataset|corpus|benchmark)\s+\w+)\b', text, re.I)))[:10]
        
        # Count claims (we propose, we present, this paper, etc.)
        claims = len(re.findall(r'\b(we\s+(?:propose|present|introduce|show|demonstrate)|this\s+(?:paper|work|study))', text, re.I))
        
        # Find citations/references
        citations = len(re.findall(r'\[\d+\]|\(\d{4}\)|\bet\s+al\.', text))
        
        return ModuleResult(
            module=self.name,
            model="pattern_matching_extraction",
            status="completed",
            findings=[
                {
                    "type": "methods_extracted",
                    "count": len(methods),
                    "items": methods[:10],
                    "description": "Technical methods and algorithms identified in the paper"
                },
                {
                    "type": "datasets_extracted", 
                    "count": len(datasets),
                    "items": datasets[:10],
                    "description": "Datasets and benchmarks mentioned"
                },
                {
                    "type": "claims_found",
                    "count": claims,
                    "description": "Research claims and contributions stated"
                }
            ],
            evidence=[],
            metrics={"citations_found": citations},
            limitations=[
                "Using baseline regex extraction (SciBERT fine-tuning in Phase 2)",
                "Research-paper retrieval and similarity ranking are not available yet; no related papers are returned."
            ]
        )
