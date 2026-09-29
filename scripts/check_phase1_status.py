#!/usr/bin/env python3
"""Check Phase 1 completion status.

Phase 1 completion criterion: Every module has a baseline score written down.
"""
from pathlib import Path


def check_phase1_status():
    print("\n" + "="*70)
    print("ENTHESIS - PHASE 1 STATUS CHECK")
    print("="*70)
    
    # Module baseline status
    modules_status = {
        "Module 1 - Related Work": {
            "baseline": "✅ regex + TF-IDF implemented",
            "data": "❌ SciERC not downloaded",
            "score": "❌ F1 = TBD, Recall@k = TBD",
            "license": "❌ Not verified",
        },
        "Module 2 - Novelty": {
            "baseline": "✅ keyword NLI implemented",
            "data": "❌ SciFact not downloaded",
            "score": "❌ Accuracy = TBD, F1 = TBD",
            "license": "✅ Apache 2.0 (documented)",
        },
        "Module 3 - Weaknesses": {
            "baseline": "✅ keyword matching implemented",
            "data": "❌ OpenReview not accessed",
            "score": "❌ Precision/Recall = TBD",
            "license": "❌ Terms of Service not reviewed",
        },
        "Module 5 - Clarity": {
            "baseline": "✅ feature heuristics implemented",
            "data": "❌ Clarity corpus not selected",
            "score": "❌ Correlation = TBD",
            "license": "❌ Depends on source (not selected)",
        },
        "Module 4 - Reviewer Feedback": {
            "baseline": "❌ Placeholder only (deferred to end of Phase 2)",
            "data": "❌ OpenReview not accessed",
            "score": "❌ Issue overlap = TBD",
            "license": "❌ Terms of Service not reviewed",
        },
    }
    
    print("\n📊 MODULE STATUS\n")
    for module_name, status in modules_status.items():
        print(f"{module_name}:")
        for key, value in status.items():
            print(f"  {key:12s}: {value}")
        print()
    
    # Overall checklist
    print("\n✓ PHASE 1 CHECKLIST\n")
    
    checklist = [
        ("Repository structure", True, "Clean modular architecture"),
        ("Base interfaces", True, "ModuleResult, NLPModule defined"),
        ("Module 1 baseline", True, "regex + TF-IDF"),
        ("Module 2 baseline", True, "keyword NLI"),
        ("Module 3 baseline", True, "keyword matching"),
        ("Module 5 baseline", True, "feature heuristics"),
        ("Module 4 baseline", False, "Placeholder (deferred)"),
        ("SciERC dataset", False, "Not downloaded - license must be verified"),
        ("SciFact dataset", False, "Not downloaded"),
        ("OpenReview access", False, "Not configured"),
        ("Clarity corpus", False, "Subfield not selected"),
        ("Baseline scores measured", False, "All TBD - no real data evaluated"),
        ("Weights & Biases", False, "Not set up"),
        ("Docs/datasets.md", True, "Sources documented, licenses need verification"),
        ("Results table", True, "Template ready, scores TBD"),
    ]
    
    completed = sum(1 for _, done, _ in checklist if done)
    total = len(checklist)
    
    for item, done, note in checklist:
        status = "✅" if done else "❌"
        print(f"  {status} {item:30s} | {note}")
    
    print(f"\n  Progress: {completed}/{total} items ({100*completed//total}%)")
    
    # Requirements for completion
    print("\n🎯 PHASE 1 COMPLETION CRITERION\n")
    print("  'Every module has a baseline score written down.'\n")
    print("  Status: ❌ NOT MET")
    print("  Reason: All scores are TBD (no evaluation on real data)\n")
    
    # Next steps
    print("\n📋 NEXT STEPS TO COMPLETE PHASE 1\n")
    steps = [
        "1. Verify SciERC license and download dataset",
        "2. Download SciFact dataset (license already verified: Apache 2.0)",
        "3. Review OpenReview Terms of Service and configure API access",
        "4. Select one subfield for clarity corpus (e.g., ACL/EMNLP papers)",
        "5. Set up Weights & Biases account and project",
        "6. Run baseline evaluations:",
        "   - Module 1: Measure F1 (extraction) and Recall@k (retrieval) on SciERC/S2ORC",
        "   - Module 2: Measure Accuracy and F1 on SciFact test set",
        "   - Module 3: Measure per-category P/R on OpenReview weakness comments",
        "   - Module 5: Measure feature correlation on accepted/rejected papers",
        "7. Update experiments/results/results_table.md with real scores",
        "8. Document all licenses in docs/datasets.md",
        "",
        "Estimated time: 1-2 weeks of focused work",
    ]
    
    for step in steps:
        if step.startswith("   "):
            print(f"  {step}")
        else:
            print(f"  {step}")
    
    print("\n" + "="*70)
    print("CURRENT PHASE: 1 (Setup and Baselines)")
    print("CANNOT START PHASE 2 UNTIL CRITERION IS MET")
    print("="*70 + "\n")


if __name__ == "__main__":
    check_phase1_status()
