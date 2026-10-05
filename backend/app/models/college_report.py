"""Database records for the independent College Report Generator feature."""
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.sql import func

from ..database import Base


class CollegeReportTemplate(Base):
    __tablename__ = "college_report_templates"

    template_id = Column(String(32), primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    name = Column(String(300), nullable=False)
    semester = Column(String(100), nullable=True)
    source_filename = Column(String(500), nullable=False)
    source_text = Column(Text, nullable=False)
    structure = Column(JSON, nullable=False)
    is_saved = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CollegeReport(Base):
    __tablename__ = "college_reports"

    report_id = Column(String(32), primary_key=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    template_id = Column(
        String(32),
        ForeignKey("college_report_templates.template_id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    project_title = Column(String(500), nullable=False)
    source_filenames = Column(JSON, nullable=False, default=list)
    extracted_text = Column(Text, nullable=False)
    extracted_information = Column(JSON, nullable=False, default=dict)
    information = Column(JSON, nullable=False, default=dict)
    generated_content = Column(JSON, nullable=False, default=dict)
    validation = Column(JSON, nullable=True)
    status = Column(String(30), nullable=False, default="sources_extracted")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
