"""Module 1 baselines: keyword extraction + TF-IDF retrieval (no neural models)."""
from __future__ import annotations
import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

_METHOD_RE = re.compile(r"\b(?:we (?:propose|use|introduce|train|fine-tune|present)|using|based on)\s+([A-Za-z0-9\-\s]{3,60}?)(?:[.,;]| to | for )", re.I)
_DATASET_RE = re.compile(r"\b([A-Z][A-Za-z0-9\-]{2,}(?:\s?[A-Z0-9][A-Za-z0-9\-]*)?)\s+(?:dataset|corpus|benchmark)\b")


def extract_entities(text: str) -> dict[str, list[str]]:
    methods = sorted({m.strip() for m in _METHOD_RE.findall(text)})
    datasets = sorted({d.strip() for d in _DATASET_RE.findall(text)})
    return {"methods": methods, "datasets": datasets}


class TfidfRetriever:
    """Retrieval baseline. Replaced later by SPECTER2 + FAISS; used to set Recall@k baseline."""

    def __init__(self):
        self.vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.papers: list[dict] = []
        self.matrix = None

    def index(self, papers: list[dict]) -> None:
        """papers: [{'id','title','abstract'}]"""
        self.papers = papers
        self.matrix = self.vec.fit_transform([f"{p['title']}. {p['abstract']}" for p in papers])

    def search(self, query: str, k: int = 5) -> list[dict]:
        if self.matrix is None or not self.papers:
            return []
        sims = cosine_similarity(self.vec.transform([query]), self.matrix)[0]
        top = sims.argsort()[::-1][:k]
        return [{"id": self.papers[i]["id"], "title": self.papers[i]["title"], "score": float(sims[i])} for i in top if sims[i] > 0]


def recall_at_k(retrieved: list[list[str]], relevant: list[set[str]], k: int) -> float:
    """Mean per-query fraction of relevant ids found in top-k. Use on real data only."""
    vals = [len(set(r[:k]) & rel) / len(rel) for r, rel in zip(retrieved, relevant) if rel]
    return sum(vals) / len(vals) if vals else 0.0
