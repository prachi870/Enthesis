"""Shared module interface + result schema (spec section 16)."""
from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field

ModuleStatus = Literal["completed", "not_evaluated", "failed"]


class ModuleResult(BaseModel):
    module: str
    status: ModuleStatus = "completed"
    model: str = "baseline"
    confidence: float = 0.0
    findings: list[dict[str, Any]] = Field(default_factory=list)
    evidence: list[dict[str, Any]] = Field(default_factory=list)
    metrics: dict[str, Any] = Field(default_factory=dict)  # never fabricate; empty/"TBD" until measured
    limitations: list[str] = Field(default_factory=list)


class NLPModule:
    name: str = "base"

    def train(self, config: dict) -> None:
        raise NotImplementedError

    def evaluate(self, dataset) -> dict:
        raise NotImplementedError

    def predict(self, document: dict) -> ModuleResult:
        raise NotImplementedError

    def get_metrics(self) -> dict:
        return {}


class PlaceholderModule(NLPModule):
    """Honest stub: reports not_evaluated until a real model exists (Rule 5)."""

    def __init__(self, name: str):
        self.name = name

    def predict(self, document: dict) -> ModuleResult:
        return ModuleResult(
            module=self.name,
            status="not_evaluated",
            model="none",
            limitations=[f"Module '{self.name}' is not implemented yet; no baseline score exists."],
            metrics={"score": "TBD"},
        )
