from __future__ import annotations
from typing import Any
from pydantic import BaseModel, Field
from .stages import Stage, StageState, ORDER


class PaperRun(BaseModel):
    paper_id: str
    filename: str
    text: str = ""
    author: str = ""
    user_id: str = ""  # Add user_id field to associate paper with user
    started: bool = False
    states: dict[str, StageState] = Field(default_factory=lambda: {s.value: StageState.PENDING for s in ORDER})
    results: dict[str, Any] = Field(default_factory=dict)
    errors: dict[str, str] = Field(default_factory=dict)
