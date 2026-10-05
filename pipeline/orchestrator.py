"""Staged pipeline with explicit approval gates. Never auto-skips approval."""
from __future__ import annotations
import threading
import time
from typing import Callable
from modules.base import ModuleResult, NLPModule, PlaceholderModule
from modules.related_work.inference import RelatedWorkModule
from .schemas import PaperRun
from .stages import ORDER, Stage, StageState


class PipelineError(Exception):
    pass


def default_modules() -> dict[str, NLPModule]:
    from modules.novelty.inference import NoveltyModule
    from modules.weaknesses.inference import WeaknessModule
    from modules.clarity.inference import ClarityModule
    from modules.reviewer_feedback.inference import ReviewerFeedbackModule
    
    mods: dict[str, NLPModule] = {
        Stage.RELATED_WORK.value: RelatedWorkModule(),
        Stage.NOVELTY.value: NoveltyModule(),
        Stage.WEAKNESSES.value: WeaknessModule(),
        Stage.CLARITY.value: ClarityModule(),
        Stage.REVIEWER_FEEDBACK.value: ReviewerFeedbackModule(),  # Module 4
    }
    return mods


class Orchestrator:
    def __init__(self, modules: dict[str, NLPModule] | None = None, parser: Callable[[bytes, str], str] | None = None):
        self.modules = modules or default_modules()
        self._running_threads = {}

    # -- helpers
    @staticmethod
    def next_pending(run: PaperRun) -> Stage | None:
        for s in ORDER:
            if run.states[s.value] == StageState.PENDING:
                return s
        return None

    @staticmethod
    def _gate_open(run: PaperRun, stage: Stage) -> bool:
        idx = ORDER.index(stage)
        return idx == 0 or run.states[ORDER[idx - 1].value] == StageState.APPROVED

    # -- actions
    def start(self, run: PaperRun) -> PaperRun:
        """Start pipeline with STAGED APPROVAL workflow.
        
        Per project guide: Student reviews/approves each stage before next runs.
        
        Workflow:
        1. Parse document
        2. Run Module 1 (Related Work) → WAIT for approval
        3. Student inspects evidence → Approves
        4. Run Module 2 (Novelty) → WAIT for approval
        5. Student inspects evidence → Approves
        6. Run Module 3 (Weaknesses) → WAIT for approval
        7. Student inspects evidence → Approves
        8. Run Module 5 (Clarity) → WAIT for approval
        9. Student inspects evidence → Approves
        10. Run Module 4 (Reviewer Feedback) → Final report
        """
        if run.started:
            raise PipelineError("Pipeline already started")
        run.started = True
        
        # Only run PARSE and first module (Related Work)
        # Rest wait for explicit approval
        self._run_stage(run, Stage.PARSE)
        
        if run.states[Stage.PARSE.value] == StageState.DONE:
            # Automatically run first analysis module
            self._run_stage(run, Stage.RELATED_WORK)
        
        return run

    def approve(self, run: PaperRun, stage: Stage) -> PaperRun:
        """Approve a completed stage and run the next one.
        
        This implements the staged approval workflow:
        - Student inspects results
        - Student approves
        - System runs next module
        - Repeat
        """
        current_state = run.states[stage.value]
        
        if current_state not in [StageState.COMPLETED, StageState.DONE]:
            raise PipelineError(
                f"Stage '{stage.value}' is {current_state.value}; "
                f"only completed/done stages can be approved"
            )
        
        # Mark as approved
        run.states[stage.value] = StageState.APPROVED
        
        # Find and run next pending stage
        nxt = self.next_pending(run)
        if nxt is not None:
            self._run_stage(run, nxt)  # Runs exactly ONE stage, then waits
        
        return run

    def _run_stage(self, run: PaperRun, stage: Stage) -> PaperRun:
        """Run a single stage and mark as DONE (waiting for approval)."""
        run.states[stage.value] = StageState.RUNNING
        
        try:
            if stage == Stage.PARSE:
                if not run.text.strip():
                    raise PipelineError("Document has no extractable text")
                run.results[stage.value] = {"chars": len(run.text)}
            else:
                # Module 4 (Reviewer Feedback) needs previous results, others don't
                if stage == Stage.REVIEWER_FEEDBACK:
                    # Gather previous results for Module 4
                    previous_results = {}
                    for prev_stage in [Stage.RELATED_WORK, Stage.NOVELTY, Stage.WEAKNESSES, Stage.CLARITY]:
                        if run.states[prev_stage.value] == StageState.APPROVED:
                            previous_results[prev_stage.value] = run.results.get(prev_stage.value)
                    
                    res: ModuleResult = self.modules[stage.value].predict(
                        {"text": run.text},
                        previous_results
                    )
                else:
                    # All other modules (1, 2, 3, 5) only take paper_data
                    res: ModuleResult = self.modules[stage.value].predict(
                        {"text": run.text}
                    )
                
                run.results[stage.value] = res.model_dump()
            
            # Mark as DONE (waiting for student approval)
            run.states[stage.value] = StageState.DONE
            
        except Exception as e:
            run.states[stage.value] = StageState.FAILED
            run.errors[stage.value] = str(e)
        
        return run
