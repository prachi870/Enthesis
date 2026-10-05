"""Analysis Run model - Track every analysis execution"""
from sqlalchemy import Column, Integer, String, DateTime, JSON, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class AnalysisRun(Base):
    """
    Track every analysis run for reproducibility.
    
    Each run records:
    - When it was executed
    - Which paper version was analyzed
    - What models/datasets were used
    - What the results were
    - Pipeline status and any failures
    """
    __tablename__ = "analysis_runs"
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(String, nullable=False, index=True)
    version_id = Column(String(12), nullable=True)  # String to match PaperVersion.version_id
    
    # Execution metadata
    run_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    pipeline_status = Column(String, nullable=False)  # completed, failed, partial, running
    
    # Model/Dataset versions for reproducibility
    model_versions = Column(JSON, nullable=False)  # {"module1": "model_v1.0", ...}
    dataset_versions = Column(JSON, nullable=True)  # {"module1": "dataset_v1.0", ...}
    
    # Results summary
    completed_modules = Column(JSON, nullable=False)  # ["related_work", "novelty", ...]
    failed_modules = Column(JSON, nullable=True)  # [{"module": "x", "error": "..."}]
    findings_count = Column(JSON, nullable=False)  # {"weaknesses": 5, "clarity": 3, ...}
    
    # Full results
    analysis_results = Column(JSON, nullable=False)  # Complete analysis output
    
    # Report status
    report_generated = Column(String, nullable=False)  # yes, no, failed
    report_path = Column(String, nullable=True)
    
    # Metadata
    duration_seconds = Column(Integer, nullable=True)
    trigger = Column(String, nullable=False)  # manual, auto, scheduled, reanalysis
    user_id = Column(Integer, nullable=True)  # Store user ID without foreign key for now
    
    # Notes
    notes = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<AnalysisRun {self.id} paper={self.paper_id} status={self.pipeline_status}>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "paper_id": self.paper_id,
            "version_id": self.version_id,
            "run_date": self.run_date.isoformat() if self.run_date else None,
            "pipeline_status": self.pipeline_status,
            "model_versions": self.model_versions,
            "dataset_versions": self.dataset_versions,
            "completed_modules": self.completed_modules,
            "failed_modules": self.failed_modules or [],
            "findings_count": self.findings_count,
            "report_generated": self.report_generated,
            "report_path": self.report_path,
            "duration_seconds": self.duration_seconds,
            "trigger": self.trigger,
            "user_id": self.user_id,
            "notes": self.notes
        }
