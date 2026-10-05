"""Template inspection, source-section matching, and college report rendering."""
import io
import re
from typing import Any

from .parsing import extract_text

MAX_UPLOAD_BYTES = 25 * 1024 * 1024
SUPPORTED_SUFFIXES = {".pdf", ".docx", ".txt", ".md", ".tex"}


def _suffix(filename: str) -> str:
    return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def read_document(filename: str, content: bytes) -> str:
    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError("Files must be 25 MB or smaller.")
    if _suffix(filename) not in SUPPORTED_SUFFIXES:
        raise ValueError("Supported document formats are PDF, DOCX, TXT, Markdown, and TeX.")
    text = extract_text(content, filename)
    if not text.strip():
        raise ValueError(f"No readable text was extracted from {filename}.")
    return text


def _heading_candidates(text: str) -> list[str]:
    headings = []
    section_headings = {
        "coverpage", "titlepage", "certificate", "certificatefromsupervisor",
        "declaration", "studentdeclaration", "studentsdeclaration",
        "noplagiarismdeclaration", "acknowledgement",
        "acknowledgements", "acknowledgment", "acknowledgments", "abstract",
        "content", "contents", "listofcontents", "tableofcontents",
        "listofillustrations", "listofillustration", "listoffigures",
        "listoftables", "listoffiguresandtables", "introduction",
        "rationaleofthestudy", "literaturereview", "relatedwork", "objectives",
        "objectivestudy", "objectivesofthestudy", "problemstatement",
        "methodology", "dataanalysis", "dataanalysisandinterpretation",
        "implementation", "results", "resultsandanalysis", "resultsanalysis",
        "discussion", "discussionandresults", "discussionandconclusion",
        "conclusion", "conclusions", "recommendation", "recommendations",
        "recommendationsandsuggestions", "futurework", "references",
        "bibliography", "bibliographyreferences", "referencesbibliography",
        "appendix", "appendices", "annexure", "annexures",
        "appendicesannexures",
    }
    excluded_terms = (
        "sample format", "general instruction", "size of project report",
        "arrangement of contents", "viva voce", "assessment", "rubric",
        "eligibility", "expectations from students", "ethical guidelines",
        "critical thinking", "detailed guidelines", "students securing",
        "should be", "what are the methods", "ability to", "i declare that",
        "declaration sample",
    )
    for raw_line in text.splitlines():
        markdown_heading = raw_line.lstrip().startswith("#")
        numbered_item = bool(re.match(r"^\d+(?:\.\d+)*[.)]?\s+", raw_line.strip()))
        line = re.sub(r"\s+", " ", raw_line).strip().strip(" .,:;-")
        if not line or len(line) > 100:
            continue
        if line.endswith(("&", "/", "—", "-")):
            continue
        if any(term in line.lower() for term in excluded_terms):
            continue
        line = re.sub(r"\s*\([^)]*\)", "", line).strip(" .,:;-")
        line = re.sub(r"\s*[-–—:]\s*(?:what|which|how|should|must|will)\b.*$", "", line, flags=re.I)
        chapter = re.match(r"^(?:\d+[.)]?\s*)?(chapter\s+(?:\d+|[ivxlcdm]+)\s*[:.)-]?\s*.+)$", line, re.I)
        if chapter:
            line = chapter.group(1).strip()
        else:
            line = re.sub(r"^\d+(?:\.\d+)*[.)]?\s*", "", line).strip()
        words = re.findall(r"[A-Za-z][A-Za-z'-]*", line)
        if not line or len(line) > 80 or not words or len(words) > 12:
            continue
        if "," in line or ";" in line or line.count(":") > 1:
            continue
        chapter = bool(re.match(r"^chapter\s+(?:\d+|[ivxlcdm]+)\b", line, re.I))
        heading_text = re.sub(
            r"^chapter\s+(?:\d+|[ivxlcdm]+)\s*[:.)-]?\s*",
            "",
            line,
            flags=re.I,
        )
        is_known_heading = re.sub(r"[^a-z0-9]", "", heading_text.lower()) in section_headings
        if not is_known_heading:
            continue
        uppercase = sum(word.isupper() for word in words) >= max(1, len(words) * 0.7)
        if (
            chapter
            or numbered_item
            or uppercase
            or markdown_heading
            or line[0].isupper()
        ) and line.lower() not in {item.lower() for item in headings}:
            headings.append(line)
    return headings


def _docx_formatting(filename: str, content: bytes) -> dict[str, Any]:
    if _suffix(filename) != ".docx":
        return {}
    from docx import Document

    doc = Document(io.BytesIO(content))
    section = doc.sections[0] if doc.sections else None
    normal = doc.styles["Normal"] if "Normal" in doc.styles else None
    heading = doc.styles["Heading 1"] if "Heading 1" in doc.styles else None

    def style_info(style):
        if style is None:
            return None
        font = style.font
        return {
            "font_name": font.name,
            "font_size_pt": font.size.pt if font.size else None,
            "bold": font.bold,
        }

    return {
        "page_size": (
            {"width_inches": round(section.page_width.inches, 2),
             "height_inches": round(section.page_height.inches, 2)}
            if section else None
        ),
        "margins_inches": (
            {
                "top": round(section.top_margin.inches, 2),
                "bottom": round(section.bottom_margin.inches, 2),
                "left": round(section.left_margin.inches, 2),
                "right": round(section.right_margin.inches, 2),
            }
            if section else None
        ),
        "normal_style": style_info(normal),
        "heading_style": style_info(heading),
    }


def inspect_template(filename: str, content: bytes) -> tuple[str, dict[str, Any]]:
    text = read_document(filename, content)
    sections = _heading_candidates(text)
    if not sections:
        raise ValueError(
            "No section headings could be identified in this sample. Upload a text-based template "
            "or include clearly formatted/numbered headings."
        )
    structure = {
        "sections": sections,
        "formatting": _docx_formatting(filename, content),
        "analysis_note": "Sections are extracted from the uploaded sample; review them before saving.",
    }
    return text, structure


def reanalyze_template_structure(source_text: str, current_structure: dict[str, Any]) -> dict[str, Any]:
    sections = _heading_candidates(source_text)
    if not sections:
        raise ValueError("No template sections could be identified from the saved sample text.")
    return {
        **current_structure,
        "sections": sections,
        "analysis_note": "Sections were re-extracted from the saved sample text; confirm this structure before use.",
    }


def _normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def _section_aliases(value: str) -> set[str]:
    label = re.sub(
        r"^(?:chapter\s+(?:\d+|[ivxlcdm]+)|(?:\d+|[ivxlcdm]+)[.)\s:-]+)",
        "",
        value.strip(),
        flags=re.I,
    )
    normalized = _normalized(label)
    aliases = {
        "coverpage": {"coverpage", "titlepage"},
        "titlepage": {"coverpage", "titlepage"},
        "certificate": {"certificate", "certificatefromsupervisor"},
        "certificatefromsupervisor": {"certificate", "certificatefromsupervisor"},
        "declaration": {"declaration", "studentdeclaration", "studentsdeclaration", "noplagiarismdeclaration"},
        "studentdeclaration": {"declaration", "studentdeclaration", "studentsdeclaration"},
        "studentsdeclaration": {"declaration", "studentdeclaration", "studentsdeclaration"},
        "noplagiarismdeclaration": {"declaration", "noplagiarismdeclaration"},
        "acknowledgement": {"acknowledgement", "acknowledgment", "acknowledgements"},
        "acknowledgment": {"acknowledgement", "acknowledgment", "acknowledgements"},
        "acknowledgements": {"acknowledgement", "acknowledgment", "acknowledgements"},
        "abstract": {"abstract", "thebigpicture"},
        "content": {"content", "tableofcontents", "listofcontents"},
        "tableofcontents": {"content", "tableofcontents", "listofcontents"},
        "listofillustrations": {"listofillustrations", "listoffigures", "listoftables"},
        "introduction": {"introduction", "rationaleofthestudy"},
        "literaturereview": {"literaturereview", "relatedwork"},
        "relatedwork": {"literaturereview", "relatedwork"},
        "objectives": {
            "objective", "objectives", "objectivestudy", "objectivesofthestudy", "goal",
        },
        "objectivestudy": {
            "objective", "objectives", "objectivestudy", "objectivesofthestudy", "goal",
        },
        "objectivesofthestudy": {
            "objective", "objectives", "objectivestudy", "objectivesofthestudy", "goal",
        },
        "objective": {
            "objective", "objectives", "objectivestudy", "objectivesofthestudy", "goal",
        },
        "problemstatement": {"problemstatement", "researchproblem"},
        "methodology": {"methodology", "methods", "researchmethodology", "howitworks"},
        "implementation": {"implementation", "toolswewilluse"},
        "dataanalysisinterpretation": {"dataanalysis", "dataanalysisinterpretation"},
        "resultsanalysis": {"results", "resultsanalysis", "dataanalysis"},
        "discussionresults": {"discussion", "discussionresults"},
        "discussion": {"discussion", "discussionresults"},
        "conclusion": {"conclusion", "conclusions"},
        "recommendationssuggestions": {"recommendations", "recommendationssuggestions"},
        "referencesbibliography": {"references", "bibliography", "referencesbibliography"},
        "appendicesannexures": {"appendix", "appendices", "annexure", "annexures"},
    }
    return aliases.get(normalized, {normalized})


def _section_for_heading(line: str, required_sections: list[str]) -> str | None:
    text = line.strip().lstrip("#").strip()
    text = re.sub(r"^\d+(?:\.\d+)*[.)]?\s*", "", text)
    text = re.sub(r"^chapter\s+(?:\d+|[ivxlcdm]+)\s*[:.)-]?\s*", "", text, flags=re.I)
    text = re.sub(r"\s*\([^)]*\)", "", text).strip(" .,:;-")
    if not text or len(text) > 100 or len(text.split()) > 12:
        return None
    aliases = _section_aliases(text)
    for required in required_sections:
        if aliases & _section_aliases(required):
            return required
    return None


def extract_project_information(
    required_sections: list[str],
    source_text: str,
) -> dict[str, str]:
    """Extract text only when project documents contain a recognizable section heading."""
    lines = source_text.splitlines()
    extracted: dict[str, list[str]] = {}
    active_section = None
    for raw_line in lines:
        line = raw_line.strip()
        if line.startswith("--- Source document:"):
            active_section = None
            continue
        line_parts = re.split(r"[:：]\s*", line, maxsplit=1)
        section = _section_for_heading(line, required_sections)
        inline_text = ""
        if not section and len(line_parts) == 2:
            section = _section_for_heading(line_parts[0], required_sections)
            inline_text = line_parts[1].strip()
        if section:
            active_section = section
            extracted.setdefault(section, [])
            if inline_text:
                extracted[section].append(inline_text)
            continue
        words = re.findall(r"[A-Za-z][A-Za-z'-]*", line)
        is_unmatched_heading = (
            line.lstrip().startswith("#")
            or (len(words) <= 10 and len(words) > 0 and all(word.isupper() for word in words))
        )
        if is_unmatched_heading:
            active_section = None
        if active_section and line:
            extracted[active_section].append(line)
    return {
        section: "\n".join(paragraphs).strip()
        for section, paragraphs in extracted.items()
        if "\n".join(paragraphs).strip()
    }


def compare_sections(
    required_sections: list[str],
    supplied: dict[str, Any],
    extracted_information: dict[str, Any] | None = None,
) -> list[dict]:
    extracted_information = extracted_information or {}
    matches = []
    for heading in required_sections:
        section_aliases = _section_aliases(heading)
        supplied_value = next((
            value for name, value in supplied.items()
            if section_aliases & _section_aliases(name)
            and isinstance(value, str) and value.strip()
        ), None)
        extracted_value = next((
            value for name, value in extracted_information.items()
            if section_aliases & _section_aliases(name)
            and isinstance(value, str) and value.strip()
        ), None)
        present = bool(supplied_value) or bool(extracted_value)
        matches.append({
            "section": heading,
            "status": "provided" if present else "missing",
            "provided_by": "user information" if supplied_value else "project documents" if extracted_value else None,
            "extracted_text": extracted_value,
        })
    return matches


def build_report_content(
    sections: list[str],
    information: dict[str, Any],
    extracted_information: dict[str, Any] | None = None,
) -> tuple[dict[str, str], list[str]]:
    generated = {}
    missing = []
    extracted_information = extracted_information or {}
    for heading in sections:
        aliases = _section_aliases(heading)
        exact = next(
            (
                str(value).strip() for name, value in information.items()
                if aliases & _section_aliases(name)
                and isinstance(value, str) and value.strip()
            ),
            None,
        )
        if exact:
            generated[heading] = exact
            continue
        extracted = next(
            (
                str(value).strip() for name, value in extracted_information.items()
                if aliases & _section_aliases(name)
                and isinstance(value, str) and value.strip()
            ),
            None,
        )
        if extracted:
            generated[heading] = extracted
            continue
        generated[heading] = f"[Information required: provide content for “{heading}”.]"
        missing.append(heading)
    return generated, missing


def validate_report(sections: list[str], content: dict[str, str], formatting: dict[str, Any]) -> dict:
    missing = [
        section for section in sections
        if not str(content.get(section, "")).strip()
        or str(content.get(section, "")).startswith("[Information required:")
        or str(content.get(section, "")).startswith("Source documents mention this section.")
    ]
    return {
        "valid": not missing,
        "missing_sections": missing,
        "section_order_matches_template": list(content) == sections,
        "formatting_applied": {
            "page_size": formatting.get("page_size"),
            "margins_inches": formatting.get("margins_inches"),
            "normal_style": formatting.get("normal_style"),
            "heading_style": formatting.get("heading_style"),
        },
        "warnings": [
            "Template section order and supported Word page/style settings are applied; visual fidelity to every sample element should be checked in the exported file."
        ],
    }


def export_college_report(report: dict, template: dict, file_format: str) -> tuple[bytes, str, str]:
    sections = report.get("generated_content", {})
    title = report.get("project_title") or "College Project Report"
    formatting = (template.get("structure") or {}).get("formatting") or {}
    if file_format == "docx":
        from docx import Document
        from docx.enum.text import WD_ALIGN_PARAGRAPH
        from docx.shared import Inches, Pt

        document = Document()
        margins = formatting.get("margins_inches") or {}
        style = formatting.get("normal_style") or {}
        heading_style = formatting.get("heading_style") or {}
        for section in document.sections:
            section.top_margin = Inches(margins.get("top") or 1)
            section.bottom_margin = Inches(margins.get("bottom") or 1)
            section.left_margin = Inches(margins.get("left") or 1)
            section.right_margin = Inches(margins.get("right") or 1)
        normal = document.styles["Normal"]
        if style.get("font_name"):
            normal.font.name = style["font_name"]
        if style.get("font_size_pt"):
            normal.font.size = Pt(style["font_size_pt"])
        heading = document.styles["Heading 1"]
        if heading_style.get("font_name"):
            heading.font.name = heading_style["font_name"]
        if heading_style.get("font_size_pt"):
            heading.font.size = Pt(heading_style["font_size_pt"])
        title_paragraph = document.add_paragraph()
        title_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_paragraph.add_run(title)
        title_run.bold = True
        title_run.font.size = Pt(20)
        document.add_paragraph()
        for index, (heading_text, body) in enumerate(sections.items()):
            if index:
                document.add_page_break()
            document.add_heading(heading_text, level=1)
            document.add_paragraph(str(body))
        output = io.BytesIO()
        document.save(output)
        return (
            output.getvalue(),
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "docx",
        )
    if file_format == "pdf":
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer
        from xml.sax.saxutils import escape

        page_size = A4
        margins_in = formatting.get("margins_inches") or {}
        output = io.BytesIO()
        doc = SimpleDocTemplate(
            output,
            pagesize=page_size,
            topMargin=(margins_in.get("top") or 1) * inch,
            bottomMargin=(margins_in.get("bottom") or 1) * inch,
            leftMargin=(margins_in.get("left") or 1) * inch,
            rightMargin=(margins_in.get("right") or 1) * inch,
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle("CollegeTitle", parent=styles["Title"], alignment=1)
        story = [Paragraph(escape(title), title_style), Spacer(1, 18)]
        for index, (heading, body) in enumerate(sections.items()):
            if index:
                story.append(PageBreak())
            story.append(Paragraph(escape(heading), styles["Heading1"]))
            story.append(Paragraph(escape(str(body)).replace("\n", "<br/>"), styles["BodyText"]))
        doc.build(story)
        return output.getvalue(), "application/pdf", "pdf"
    raise ValueError("College reports can only be exported as PDF or DOCX.")
