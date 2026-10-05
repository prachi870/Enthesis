"""Action item database model."""
from sqlalchemy import Column, String, Text, DateTime, Enum
from sqlalchemy.sql import func
from ..database import Base
import enum


class ActionStatus(str, enum.Enum):
    """Action item status enum."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    REVIEWED = "reviewed"
    RESOLVED = "resolved"


class ActionPriority(str, enum.Enum):
    """Action item priority enum."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Action(Base):
    """Action item model for tracking research tasks."""
    __tablename__ = "actions"
    
    action_id = Column(String(12), primary_key=True, index=True)
    paper_id = Column(String(12), index=True, nullable=False)
    user_id = Column(String(50), index=True, nullable=False)
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    source_module = Column(String(50), nullable=False)
    source_finding_type = Column(String(100))
    evidence = Column(Text)
    
    priority = Column(Enum(ActionPriority), nullable=False, default=ActionPriority.MEDIUM)
    status = Column(Enum(ActionStatus), nullable=False, default=ActionStatus.NOT_STARTED)
    
    recommended_action = Column(Text)
    notes = Column(Text)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            "action_id": self.action_id,
            "paper_id": self.paper_id,
            "user_id": self.user_id,
            "title": self.title,
            "description": self.description,
            "source_module": self.source_module,
            "source_finding_type": self.source_finding_type,
            "evidence": self.evidence,
            "priority": self.priority.value if self.priority else "medium",
            "status": self.status.value if self.status else "not_started",
            "recommended_action": self.recommended_action,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
