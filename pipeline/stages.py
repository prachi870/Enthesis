from enum import Enum


class Stage(str, Enum):
    PARSE = "parse"
    RELATED_WORK = "related_work"
    NOVELTY = "novelty"
    WEAKNESSES = "weaknesses"
    CLARITY = "clarity"
    REVIEWER_FEEDBACK = "reviewer_feedback"


class StageState(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    DONE = "done"  # Added for completed stages
    FAILED = "failed"
    APPROVED = "approved"


# Fixed order per spec: 1,2,3, then 5, then 4.
ORDER = [Stage.PARSE, Stage.RELATED_WORK, Stage.NOVELTY, Stage.WEAKNESSES, Stage.CLARITY, Stage.REVIEWER_FEEDBACK]
