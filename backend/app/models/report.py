"""Report database model"""
from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, Text
from sqlalchemy.sql import func
from ..database import Base


class Report(Base):
    """Generated report records"""
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(String, unique=True, index=True, nullable=False)
    paper_id = Column(String, index=True, nullable=False)
    paper_title = Column(String, nullable=True)
    version_id = Column(String, nullable=True)
    
    # Report status
    status = Column(String, default="generating")  # generating, ready, failed
    
    # Generation metadata
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    generation_time_seconds = Column(Integer, nullable=True)
    
    # Content metadata
    total_findings = Column(Integer, default=0)
    findings_breakdown = Column(JSON, nullable=True)  # {'related_work': 5, 'novelty': 3, ...}
    
    # Available formats
    formats_available = Column(JSON, default=list)  # ['pdf', 'docx', 'markdown', 'json']
    
    # File paths (if stored)
    pdf_path = Column(String, nullable=True)
    docx_path = Column(String, nullable=True)
    markdown_path = Column(String, nullable=True)
    json_path = Column(String, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    
    # Report metadata (renamed from 'metadata' to avoid SQLAlchemy reserved word)
    report_metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<Report(report_id='{self.report_id}', paper_id='{self.paper_id}', status='{self.status}')>"
