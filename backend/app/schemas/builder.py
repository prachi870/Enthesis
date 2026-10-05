"""Validated request/response contracts for the research paper builder."""
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

BuilderFormat = Literal[
    "imrad", "conference", "thesis", "ieee", "apa", "mla", "chicago",
    "generic", "university",
]


class DraftInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    paper_id: str | None = Field(default=None, max_length=64)
    title: str = Field(default="", max_length=500)
    authors: str | list[str] = Field(default_factory=list, max_length=100)
    abstract: str = Field(default="", max_length=30000)
    institution: str = Field(default="", max_length=1000)
    course: str = Field(default="", max_length=500)
    instructor: str = Field(default="", max_length=500)
    submission_date: str = Field(default="", max_length=100)
    keywords: str | list[str] = Field(default_factory=list, max_length=100)
    introduction: str = Field(default="", max_length=30000)
    related_work: str = Field(default="", max_length=30000)
    problem_statement: str = Field(default="", max_length=30000)
    objectives: str = Field(default="", max_length=30000)
    methodology: str = Field(default="", max_length=30000)
    dataset: str = Field(default="", max_length=30000)
    technologies: str = Field(default="", max_length=30000)
    experiments_results: str = Field(default="", max_length=50000)
    discussion: str = Field(default="", max_length=30000)
    limitations: str = Field(default="", max_length=30000)
    future_work: str = Field(default="", max_length=30000)
    conclusion: str = Field(default="", max_length=30000)
    sections: dict[str, str] = Field(default_factory=dict)
    generated_content: dict[str, str] = Field(default_factory=dict)
    citations: str | list[str] = Field(default_factory=list, max_length=1000)
    references: str | list[str] = Field(default_factory=list, max_length=1000)
    format: BuilderFormat = "imrad"

    @field_validator("sections", "generated_content")
    @classmethod
    def validate_sections(cls, sections: dict[str, str]) -> dict[str, str]:
        if len(sections) > 100:
            raise ValueError("At most 100 sections are allowed")
        if any(len(key) > 100 or len(value) > 100000 for key, value in sections.items()):
            raise ValueError("Section names must be at most 100 characters and section text at most 100000 characters")
        return sections

    @field_validator("references", "citations")
    @classmethod
    def validate_sources(cls, sources: str | list[str]) -> str | list[str]:
        if isinstance(sources, str):
            if len(sources) > 100000:
                raise ValueError("Source text must be at most 100000 characters")
        elif len(sources) > 1000 or any(len(source) > 30000 for source in sources):
            raise ValueError("At most 1000 source entries are allowed, each at most 30000 characters")
        return sources


class DraftUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    paper_id: str | None = Field(default=None, max_length=64)
    title: str | None = Field(default=None, max_length=500)
    authors: str | list[str] | None = Field(default=None, max_length=100)
    abstract: str | None = Field(default=None, max_length=30000)
    institution: str | None = Field(default=None, max_length=1000)
    course: str | None = Field(default=None, max_length=500)
    instructor: str | None = Field(default=None, max_length=500)
    submission_date: str | None = Field(default=None, max_length=100)
    keywords: str | list[str] | None = Field(default=None, max_length=100)
    introduction: str | None = Field(default=None, max_length=30000)
    related_work: str | None = Field(default=None, max_length=30000)
    problem_statement: str | None = Field(default=None, max_length=30000)
    objectives: str | None = Field(default=None, max_length=30000)
    methodology: str | None = Field(default=None, max_length=30000)
    dataset: str | None = Field(default=None, max_length=30000)
    technologies: str | None = Field(default=None, max_length=30000)
    experiments_results: str | None = Field(default=None, max_length=50000)
    discussion: str | None = Field(default=None, max_length=30000)
    limitations: str | None = Field(default=None, max_length=30000)
    future_work: str | None = Field(default=None, max_length=30000)
    conclusion: str | None = Field(default=None, max_length=30000)
    sections: dict[str, str] | None = None
    generated_content: dict[str, str] | None = None
    citations: str | list[str] | None = Field(default=None, max_length=1000)
    references: str | list[str] | None = Field(default=None, max_length=1000)
    format: BuilderFormat | None = None

    @model_validator(mode="before")
    @classmethod
    def reject_null_content(cls, value):
        if isinstance(value, dict):
            nullable = {"paper_id", "format"}
            invalid = [key for key, item in value.items() if item is None and key not in nullable]
            if invalid:
                raise ValueError(f"These fields cannot be null: {', '.join(invalid)}")
        return value

    @field_validator("sections", "generated_content")
    @classmethod
    def validate_sections(cls, sections: dict[str, str] | None) -> dict[str, str] | None:
        if sections is not None and (
            len(sections) > 100
            or any(len(key) > 100 or len(value) > 100000 for key, value in sections.items())
        ):
            raise ValueError("Section names must be at most 100 characters and section text at most 100000 characters")
        return sections

    @field_validator("references", "citations")
    @classmethod
    def validate_sources(cls, sources: str | list[str] | None) -> str | list[str] | None:
        if sources is not None and (
            (isinstance(sources, str) and len(sources) > 100000)
            or (isinstance(sources, list) and (
                len(sources) > 1000 or any(len(source) > 30000 for source in sources)
            ))
        ):
            raise ValueError("At most 1000 source entries are allowed, each at most 30000 characters")
        return sources


class VersionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: dict[str, str] | None = Field(default=None, max_length=100)

    @field_validator("content")
    @classmethod
    def validate_content(cls, content: dict[str, str] | None) -> dict[str, str] | None:
        if content is not None and any(len(key) > 100 or len(value) > 100000 for key, value in content.items()):
            raise ValueError("Section names must be at most 100 characters and section text at most 100000 characters")
        return content


class ExportStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["download_started", "downloaded"]
