"""Persistent, user-managed follow-up tasks for builder analysis findings."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from ..database import Base


class BuilderAction(Base):
    __tablename__ = "builder_actions"

    action_id = Column(String(32), primary_key=True, index=True)
    draft_id = Column(
        String(32),
        ForeignKey("builder_drafts.draft_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id = Column(Integer, nullable=True, index=True)
    analysis_run_id = Column(Integer, nullable=False, index=True)
    finding_id = Column(String(120), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    evidence = Column(Text, nullable=True)
    priority = Column(String(20), nullable=False, default="medium")
    status = Column(String(20), nullable=False, default="not_started")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def to_dict(self) -> dict:
        return {
            "action_id": self.action_id,
            "draft_id": self.draft_id,
            "analysis_run_id": self.analysis_run_id,
            "finding_id": self.finding_id,
            "title": self.title,
            "description": self.description,
            "evidence": self.evidence,
            "priority": self.priority,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
