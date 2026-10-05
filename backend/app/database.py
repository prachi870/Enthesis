"""Database configuration and session management"""
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from .config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    echo=settings.DEBUG
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Session:
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    from .models.user import Base as UserBase
    from .models.action import Base as ActionBase
    from .models.version import Base as VersionBase
    from .models.analysis_run import Base as AnalysisRunBase
    from .models.report import Base as ReportBase
    from .models.builder import BuilderDraft, BuilderDraftVersion
    from .models.builder_action import BuilderAction
    from .models.college_report import CollegeReport, CollegeReportTemplate
    UserBase.metadata.create_all(bind=engine)
    ActionBase.metadata.create_all(bind=engine)
    VersionBase.metadata.create_all(bind=engine)
    AnalysisRunBase.metadata.create_all(bind=engine)
    ReportBase.metadata.create_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    report_columns = {column["name"] for column in inspect(engine).get_columns("college_reports")}
    if "extracted_information" not in report_columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE college_reports ADD COLUMN extracted_information JSON")
            )
    print("Database tables initialized: User, Action, Version, AnalysisRun, Report, BuilderDraft, BuilderAction, CollegeReport, CollegeReportTemplate")
