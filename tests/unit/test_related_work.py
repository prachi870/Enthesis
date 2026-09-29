from modules.related_work.baseline import TfidfRetriever, extract_entities, recall_at_k
from modules.related_work.inference import RelatedWorkModule
from modules.related_work.preprocessing import split_sections

DRAFT = """Abstract
We propose graph neural networks for citation recommendation on the SciERC dataset.
Introduction
Prior work is limited.
"""

CORPUS = [
    {"id": "p1", "title": "Graph neural networks for citation recommendation", "abstract": "We study GNNs for recommending citations."},
    {"id": "p2", "title": "Image segmentation with transformers", "abstract": "Vision models for medical images."},
]


def test_split_sections():
    s = split_sections(DRAFT)
    assert "abstract" in s and "introduction" in s


def test_extract_entities():
    e = extract_entities(DRAFT)
    assert "SciERC" in e["datasets"]


def test_retrieval_ranks_relevant_first():
    r = TfidfRetriever(); r.index(CORPUS)
    assert r.search("graph neural network citation recommendation")[0]["id"] == "p1"


def test_recall_at_k():
    assert recall_at_k([["a", "b"]], [{"a", "c"}], 2) == 0.5


def test_module_result_never_fabricates_metrics():
    res = RelatedWorkModule(CORPUS).predict({"text": DRAFT})
    assert res.metrics == {"f1": "TBD", "recall@k": "TBD"}
    assert res.evidence and res.limitations
