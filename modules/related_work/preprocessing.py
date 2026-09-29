import re

_SECTION_RE = re.compile(r"^\s*(?:\d+\.?\s+)?(abstract|introduction|related work|method[s]?|methodology|experiments?|results|discussion|conclusion[s]?|references)\s*$", re.I)


def split_sections(text: str) -> dict[str, str]:
    """Split a plain-text draft into sections by common headings."""
    sections: dict[str, list[str]] = {"body": []}
    current = "body"
    for line in text.splitlines():
        m = _SECTION_RE.match(line)
        if m:
            current = m.group(1).lower()
            sections.setdefault(current, [])
        else:
            sections[current].append(line)
    return {k: "\n".join(v).strip() for k, v in sections.items() if "".join(v).strip()}


def tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z0-9]+", text.lower())
