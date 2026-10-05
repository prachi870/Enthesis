"""Persisted research-paper drafts and immutable save snapshots."""
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.sql import func

from ..database import Base


class BuilderDraft(Base):
    __tablename__ = "builder_drafts"

    draft_id = Column(String(32), primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    paper_id = Column(String(64), nullable=True, index=True)
    title = Column(String(500), nullable=False, default="")
    document_format = Column(String(40), nullable=False)
    content = Column(JSON, nullable=False)
    export_status = Column(JSON, nullable=False, default=dict)
    version_number = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class BuilderDraftVersion(Base):
    __tablename__ = "builder_draft_versions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    draft_id = Column(String(32), ForeignKey("builder_drafts.draft_id", ondelete="CASCADE"), index=True, nullable=False)
    version_number = Column(Integer, nullable=False)
    title = Column(String(500), nullable=False, default="")
    document_format = Column(String(40), nullable=False)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
