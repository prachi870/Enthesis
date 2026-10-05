"""Paper version database model."""
from sqlalchemy import Column, String, Integer, Text, DateTime, JSON
from sqlalchemy.sql import func
from ..database import Base


class PaperVersion(Base):
    """Paper version model for tracking revisions."""
    __tablename__ = "paper_versions"
    
    version_id = Column(String(12), primary_key=True, index=True)
    paper_id = Column(String(12), index=True, nullable=False)  # Base paper identifier
    user_id = Column(String(50), index=True, nullable=False)
    
    version_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.
    filename = Column(String(255), nullable=False)
    
    # Store analysis results as JSON
    analysis_results = Column(JSON)
    analysis_states = Column(JSON)
    
    # Version metadata
    upload_notes = Column(Text)  # Student can add notes about what changed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            "version_id": self.version_id,
            "paper_id": self.paper_id,
            "user_id": self.user_id,
            "version_number": self.version_number,
            "filename": self.filename,
            "analysis_results": self.analysis_results,
            "analysis_states": self.analysis_states,
            "upload_notes": self.upload_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
