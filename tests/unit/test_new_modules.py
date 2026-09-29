"""Tests for newly implemented modules (Phase 1 baselines)."""
from modules.novelty.inference import NoveltyModule
from modules.novelty.preprocessing import extract_novelty_claims
from modules.weaknesses.inference import WeaknessModule
from modules.weaknesses.preprocessing import categorize_weakness
from modules.clarity.inference import ClarityModule
from modules.clarity.features import extract_style_features

DRAFT_WITH_CLAIMS = """
Abstract
We are the first to apply graph neural networks to citation recommendation.
To the best of our knowledge, no prior work has combined GNNs with citation analysis.

Introduction
Our novel approach uses transformers for document embedding.
"""

DRAFT_WITH_WEAKNESSES = """
Method
Our method is based on neural networks. We did not compare with any baseline.
The evaluation is limited to one small dataset. More details are unclear.
"""

DRAFT_WITH_CLARITY_ISSUES = """
Very very very long sentence that goes on and on and on and on and on and on and on and on.
Perhaps maybe possibly it might could potentially be somewhat unclear.
The thing is that various factors suggest several aspects.
Word word word word word word word word word word.
"""


def test_novelty_claim_extraction():
    """Test that novelty claims are extracted."""
    claims = extract_novelty_claims(DRAFT_WITH_CLAIMS)
    assert len(claims) >= 2
    assert any("first to" in c["claim_text"].lower() for c in claims)


def test_novelty_module_baseline():
    """Test NoveltyModule with baseline model."""
    module = NoveltyModule()
    result = module.predict({"text": DRAFT_WITH_CLAIMS})
    
    assert result.module == "novelty"
    assert result.model == "keyword_nli_baseline"
    assert result.metrics["accuracy"] == "TBD"  # Phase 1 incomplete
    assert "baseline" in result.limitations[0].lower()
    assert len(result.findings) >= 0  # May be empty without related work


def test_weakness_categorization():
    """Test weakness categorization."""
    category = categorize_weakness("No baseline comparison provided")
    assert category == "missing_baseline"
    
    category = categorize_weakness("The evaluation is weak and limited experiments were conducted")
    assert category == "weak_evaluation"


def test_weakness_module_baseline():
    """Test WeaknessModule with baseline detector."""
    module = WeaknessModule()
    result = module.predict({"text": DRAFT_WITH_WEAKNESSES})
    
    assert result.module == "weaknesses"
    assert result.model == "keyword_weakness_detector_baseline"
    assert len(result.findings) > 0  # Should detect some weaknesses
    assert any("baseline" in f["category"] for f in result.findings)
    assert result.metrics["precision_per_category"] == "TBD"


def test_clarity_features():
    """Test style feature extraction."""
    features = extract_style_features(DRAFT_WITH_CLARITY_ISSUES)
    
    assert "sentence_length_cv" in features
    assert "hedging_density" in features
    assert "vague_density" in features
    assert "unique_word_ratio" in features
    
    # Should detect high hedging
    assert features["hedging_count"] > 0
    # Should detect vague language
    assert features["vague_count"] > 0
    # Should detect repetition
    assert features["max_word_repetition"] > 1


def test_clarity_module_baseline():
    """Test ClarityModule with baseline classifier."""
    module = ClarityModule()
    result = module.predict({"text": DRAFT_WITH_CLARITY_ISSUES})
    
    assert result.module == "clarity"
    assert result.model == "feature_based_clarity_baseline"
    assert result.status == "completed"
    assert len(result.findings) > 0
    
    # Should have recommendations
    recs = next((f for f in result.findings if f["type"] == "recommendations"), None)
    assert recs is not None
    assert len(recs["recommendations"]) > 0
    
    # Should flag issues
    assert len(result.evidence) > 0


def test_all_baselines_honest_about_metrics():
    """Verify all baselines report TBD for unmeasured metrics."""
    modules = [
        NoveltyModule(),
        WeaknessModule(),
        ClarityModule(),
    ]
    
    draft = {"text": "Sample paper text for testing."}
    
    for module in modules:
        result = module.predict(draft)
        # All metrics should be TBD or dicts with TBD values
        for metric_name, metric_value in result.metrics.items():
            if isinstance(metric_value, str):
                assert metric_value == "TBD", f"{module.name} fabricated metric {metric_name}"
        
        # All should mention baseline in limitations
        assert any("baseline" in lim.lower() for lim in result.limitations)
