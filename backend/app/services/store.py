"""Abstract run store. Local JSON now; swap for PostgreSQL/S3 in Phase 4."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Protocol
from pipeline.schemas import PaperRun


class RunStore(Protocol):
    def save(self, run: PaperRun) -> None: ...
    def get(self, paper_id: str) -> PaperRun | None: ...
    def list_all(self) -> list[PaperRun]: ...


class LocalRunStore:
    def __init__(self, root: str):
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)

    def save(self, run: PaperRun) -> None:
        (self.root / f"{run.paper_id}.json").write_text(run.model_dump_json(), encoding='utf-8')

    def get(self, paper_id: str) -> PaperRun | None:
        p = self.root / f"{paper_id}.json"
        return PaperRun(**json.loads(p.read_text(encoding='utf-8'))) if p.exists() else None

    def list_all(self) -> list[PaperRun]:
        """List all stored paper runs."""
        runs = []
        for json_file in self.root.glob("*.json"):
            try:
                run = PaperRun(**json.loads(json_file.read_text(encoding='utf-8')))
                runs.append(run)
            except Exception:
                continue
        # Sort by started time, newest first (handle None/bool values safely)
        runs.sort(key=lambda x: str(x.started) if x.started else "0", reverse=True)
        return runs
