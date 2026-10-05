"""Helpers for building evidence-linked results from real analysis modules."""
from __future__ import annotations

import re
from typing import Any


SECTION_LABELS = {
    "problem_statement": "Problem Statement",
    "experiments_results": "Experiments / Results",
}


def build_paper_text(draft: Any) -> tuple[str, dict[str, dict[str, Any]]]:
    """Build the exact manuscript snapshot analyzed and its section offsets."""
    document = draft.content
    supplied = document.get("input", {})
    sections = document.get("generated_content", {})
    blocks: list[str] = []
    spans: dict[str, dict[str, Any]] = {}

    def append_block(key: str, heading: str, content: str) -> None:
        if blocks:
            blocks.append("\n\n")
        heading_start = sum(len(block) for block in blocks)
        blocks.extend((heading, "\n\n"))
        content_start = sum(len(block) for block in blocks)
        blocks.append(content)
        spans[key] = {
            "heading": heading,
            "start": content_start,
            "end": content_start + len(content),
            "content": content,
        }

    append_block("title", "Title", draft.title or "[Missing: title]")
    append_block("authors", "Authors", ", ".join(document.get("authors") or []) or "[Missing: authors]")
    if supplied.get("institution"):
        append_block("institution", "Institution", str(supplied["institution"]))
    for key, value in sections.items():
        if not isinstance(value, str) or key == "missing_information":
            continue
        append_block(key, SECTION_LABELS.get(key, key.replace("_", " ").title()), value)

    return "".join(blocks), spans


def _text_value(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _paper_passage(
    module: str,
    item: dict[str, Any],
    paper_text: str,
    section_spans: dict[str, dict[str, Any]],
) -> tuple[str | None, str | None, dict[str, Any] | None]:
    explicit = next(
        (_text_value(item.get(key)) for key in ("matched_text", "sentence", "claim", "quote", "passage")
         if _text_value(item.get(key))),
        None,
    )
    section = next(
        (_text_value(item.get(key)) for key in ("affected_section", "section")
         if _text_value(item.get(key))),
        None,
    )
    if explicit:
        match = re.search(re.escape(explicit), paper_text, re.IGNORECASE)
        if match:
            return section, explicit, {"text": paper_text[match.start():match.end()], "start": match.start(),
                                       "end": match.end(), "exact_match": True}

    if section:
        key = next(
            (candidate for candidate, span in section_spans.items()
             if candidate == section or span["heading"].casefold() == section.casefold()),
            None,
        )
    else:
        key = None

    if key is None:
        category = str(item.get("category") or item.get("type") or "").casefold()
        section_hint = {
            "baseline": "experiments_results",
            "evaluation": "experiments_results",
            "dataset": "dataset",
            "method": "methodology",
            "clarity": "introduction",
            "novelty": "introduction",
            "related": "related_work",
        }
        key = next((target for hint, target in section_hint.items() if hint in category and target in section_spans), None)
    if key is None:
        key = next((candidate for candidate in section_spans if candidate not in {"title", "authors", "institution"}), None)
    if key is None:
        return section, None, None

    span = section_spans[key]
    content = span["content"]
    passage_match = re.search(r"[^.!?\n]+(?:[.!?]|$)", content.strip())
    if not passage_match:
        return span["heading"], None, None
    passage = passage_match.group(0).strip()
    relative_start = content.find(passage)
    start = span["start"] + relative_start
    return span["heading"], passage, {
        "text": passage,
        "start": start,
        "end": start + len(passage),
        "exact_match": True,
        "context_only": True,
    }


def normalize_findings(
    results: dict[str, Any],
    paper_text: str,
    section_spans: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    """Expose module output as findings without adding model claims or evidence."""
    normalized: list[dict[str, Any]] = []

    def add(module: str, finding_type: str, item: dict[str, Any], index: int = 0) -> None:
        title = next(
            (_text_value(item.get(key)) for key in ("title", "name", "label", "category", "concern_type", "type")
             if _text_value(item.get(key))),
            f"{module.replace('_', ' ').title()} observation",
        )
        description = next(
            (_text_value(item.get(key)) for key in ("description", "summary", "feedback", "text", "interpretation")
             if _text_value(item.get(key))),
            "The analysis module returned an observation without a description.",
        )
        section, passage, evidence = _paper_passage(module, item, paper_text, section_spans)
        confidence = item.get("confidence")
        if not isinstance(confidence, (int, float)) or isinstance(confidence, bool):
            confidence = results.get(module, {}).get("confidence")
        if confidence == 0:
            confidence = None
        recommendation = next(
            (_text_value(item.get(key)) for key in ("recommended_action", "suggested_action", "recommendation")
             if _text_value(item.get(key))),
            None,
        )
        limitations = results.get(module, {}).get("limitations", [])
        category = _text_value(item.get("category")) or _text_value(item.get("concern_type")) or finding_type
        if module == "reviewer_feedback":
            concern = str(item.get("concern_type") or finding_type)
            category = {
                "novelty_questioned": "Novelty",
                "experimental_design": "Experimental Design",
                "baseline_comparison": "Experimental Design",
                "evaluation_rigor": "Evaluation",
                "writing_clarity": "Clarity",
                "reproducibility": "Methodology",
                "unclear_method": "Methodology",
                "weak_evaluation": "Evaluation",
            }.get(concern, "Methodology")
        normalized.append({
            "id": f"{module}:{finding_type}:{index}",
            "module": module,
            "category": category,
            "title": title.replace("_", " ").strip().title(),
            "description": description,
            "detailed_explanation": _text_value(item.get("explanation")) or description,
            "why_detected": _text_value(item.get("why_detected")) or (
                _text_value(item.get("evidence_basis"))
                or "The module detected this using its reported analysis method; see its limitation before interpreting."
            ),
            "confidence": confidence,
            "affected_section": section,
            "evidence": evidence,
            "evidence_text": passage,
            "related_research": item.get("related_research"),
            "recommended_action": recommendation,
            "analysis_limitation": limitations,
            "status": "requires_investigation",
            "source": item,
        })

    for module in ("related_work", "novelty", "weaknesses", "clarity", "reviewer_feedback"):
        data = results.get(module, {})
        if not isinstance(data, dict) or data.get("status") == "not_evaluated":
            continue
        findings = data.get("findings", [])
        evidence_items = data.get("evidence", [])
        if module == "novelty":
            for index, item in enumerate(evidence_items):
                if isinstance(item, dict) and _text_value(item.get("claim")):
                    add(module, "claim", {
                        **item,
                        "title": "Potential novelty claim requires investigation",
                        "description": item["claim"],
                        "why_detected": "Claim wording matched a novelty-claim text pattern; no comparison with external research was performed.",
                        "recommended_action": "Compare this claim with verified, relevant prior research.",
                    }, index)
        elif module == "weaknesses":
            nested = next(
                (finding.get("weaknesses") for finding in findings
                 if isinstance(finding, dict) and isinstance(finding.get("weaknesses"), list)),
                [],
            )
            for index, item in enumerate(nested):
                if isinstance(item, dict):
                    category = str(item.get("category", "potential_issue"))
                    recommendations = {
                        "missing_baseline": "Verify that an appropriate baseline is compared or document why comparison is not applicable.",
                        "weak_evaluation": "Review the evaluation scope and add measured support or explain the chosen evaluation design.",
                        "unclear_method": "Clarify the method details needed for a reader to understand or reproduce the work.",
                        "missing_ablation": "Assess whether component-level analysis is appropriate and document the choice.",
                        "missing_limitations": "Describe limitations supported by the actual study and data.",
                        "limited_novelty": "Compare the contribution claims against verified prior research; no literature search was performed by this module.",
                    }
                    if category == "acknowledged_limitation":
                        continue
                    add(module, str(item.get("category", "potential_issue")), {
                        **item,
                        "description": item.get("text"),
                        "why_detected": f"The rule-based weaknesses module flagged a text pattern for {category.replace('_', ' ')}.",
                        "confidence": item.get("confidence"),
                        "recommended_action": recommendations.get(
                            category,
                            "Review this potential issue against the study details and document the evidence or rationale.",
                        ),
                    }, index)
        elif module == "clarity":
            for index, item in enumerate(evidence_items):
                if isinstance(item, dict):
                    add(module, "clarity", {
                        **item,
                        "title": ", ".join(item.get("issues", [])) or "Clarity passage",
                        "description": "The clarity baseline flagged this passage for review.",
                        "why_detected": "The passage matched the clarity module's reported surface-level style patterns.",
                        "recommended_action": "Review the highlighted sentence for precision and readability.",
                    }, index)
        elif module == "reviewer_feedback":
            for index, item in enumerate(evidence_items):
                if isinstance(item, dict):
                    add(module, str(item.get("concern_type", "reviewer_concern")), {
                        **item,
                        "title": item.get("concern_type", "Reviewer-style concern"),
                        "description": item.get("feedback"),
                        "why_detected": item.get("evidence_basis"),
                        "recommended_action": item.get("suggested_action"),
                    }, index)
        else:
            for index, item in enumerate(findings):
                if isinstance(item, dict) and item.get("type") not in {"overall_score", "style_features", "recommendations"}:
                    add(module, str(item.get("type", "observation")), item, index)

    return normalized
