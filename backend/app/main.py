"""Main FastAPI application"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import init_db
from .api.papers import router as papers_router
from .api.auth import router as auth_router
from .api.versions import router as versions_router
from .api.analysis_history import router as history_router
from .api.reports import router as old_reports_router
from .api.reports_complete import router as reports_complete_router
from .api.builder import router as builder_router
from .api.college_reports import router as college_reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup: Initialize database
    init_db()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Research-Validated NLP Pipeline for Academic Paper Analysis",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(papers_router)
app.include_router(versions_router, prefix="/api/v1")
app.include_router(history_router)
app.include_router(old_reports_router)  # Keep old for compatibility
app.include_router(reports_complete_router)  # New complete reports API
app.include_router(builder_router, prefix="/api/v1/builder")
# Compatibility prefix used by the Research Paper Builder client.
app.include_router(builder_router, prefix="/api/v1/research-papers")
# College report data and APIs remain separate from research-paper builder records.
app.include_router(college_reports_router, prefix="/api/v1/college-reports")


@app.get("/health")
def health():
    """Health check endpoint"""
    return {"status": "ok", "app": settings.APP_NAME}
