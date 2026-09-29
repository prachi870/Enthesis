"""Papers API endpoints"""
import uuid
import threading
import time
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Depends
from sqlalchemy.orm import Session

from pipeline.orchestrator import Orchestrator, PipelineError
from pipeline.report import build_report
from pipeline.schemas import PaperRun
from pipeline.stages import Stage
from ..config import settings
from ..services.parsing import extract_text
from ..services.store import LocalRunStore
from ..services.auth import get_current_active_user
from ..models.user import User
from ..database import get_db

router = APIRouter(prefix="/api/v1/papers", tags=["papers"])
store = LocalRunStore(settings.STORAGE_DIR)
orch = Orchestrator()


def _get(paper_id: str) -> PaperRun:
    """Get paper run by ID"""
    run = store.get(paper_id)
    if not run:
        raise HTTPException(404, "Paper not found")
    return run


@router.get("/list")
def list_papers(
    search: str = None,
    current_user: User = Depends(get_current_active_user)
):
    """List all uploaded papers with optional search"""
    runs = store.list_all()
    
    # Filter by search term if provided
    if search:
        search_lower = search.lower()
        runs = [
            r for r in runs
            if search_lower in r.filename.lower() or
            search_lower in (r.author or "").lower()
        ]
    
    return {
        "papers": [
            {
                "paper_id": r.paper_id,
                "filename": r.filename,
                "author": r.author,
                "started": r.started,
                "states": r.states,
                "results": r.results,
                "errors": r.errors
            }
            for r in runs
        ]
    }


@router.post("/upload")
async def upload(
    file: UploadFile = File(...),
    author: str = Form(""),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a new paper and automatically start analysis"""
    data = await file.read()
    try:
        text = extract_text(data, file.filename or "")
    except ValueError as e:
        raise HTTPException(400, str(e))
    
    run = PaperRun(
        paper_id=uuid.uuid4().hex[:12],
        filename=file.filename or "draft",
        text=text,
        author=author or current_user.username
    )
    store.save(run)
    
    # Automatically start analysis pipeline
    try:
        orch.start(run)
        store.save(run)
    except PipelineError as e:
        # Even if start fails, return the paper_id
        pass
    
    return {
        "paper_id": run.paper_id,
        "filename": run.filename,
        "states": run.states,
        "message": "Paper uploaded and analysis started"
    }


@router.get("/{paper_id}")
def get_paper(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get paper details by ID"""
    r = _get(paper_id)
    return {
        "paper_id": r.paper_id,
        "filename": r.filename,
        "author": r.author,
        "started": r.started,
        "states": r.states,
        "errors": r.errors,
        "text_preview": r.text[:500] if r.text else None
    }


@router.delete("/{paper_id}")
def delete_paper(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a paper"""
    import os
    
    # Check if paper exists
    _get(paper_id)
    
    # Delete the JSON file
    filepath = os.path.join(settings.STORAGE_DIR, f"{paper_id}.json")
    if os.path.exists(filepath):
        os.remove(filepath)
        return {"message": "Paper deleted successfully", "paper_id": paper_id}
    else:
        raise HTTPException(404, "Paper file not found")


@router.post("/{paper_id}/pipeline/start")
def start_pipeline(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Start analysis pipeline for a paper"""
    run = _get(paper_id)
    try:
        orch.start(run)
        
        # Save updates in background
        def save_periodically():
            for _ in range(20):  # Check for 20 seconds
                time.sleep(1)
                store.save(run)
        
        threading.Thread(target=save_periodically, daemon=True).start()
        
    except PipelineError as e:
        raise HTTPException(409, str(e))
    
    store.save(run)
    return {"states": run.states, "message": "Pipeline started"}


@router.post("/{paper_id}/stages/{stage}/approve")
def approve_stage(
    paper_id: str,
    stage: Stage,
    current_user: User = Depends(get_current_active_user)
):
    """Approve a pipeline stage"""
    run = _get(paper_id)
    try:
        orch.approve(run, stage)
    except PipelineError as e:
        raise HTTPException(409, str(e))
    
    store.save(run)
    return {"states": run.states, "message": f"Stage {stage} approved"}


@router.get("/{paper_id}/results")
def get_results(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get analysis results for a paper"""
    r = _get(paper_id)
    return {
        "states": r.states,
        "results": r.results,
        "errors": r.errors
    }


@router.get("/{paper_id}/report")
def get_report(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get comprehensive analysis report"""
    return build_report(_get(paper_id))


@router.get("/{paper_id}/download")
def download_report(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Download report in a structured format"""
    from fastapi.responses import JSONResponse
    
    report = build_report(_get(paper_id))
    return JSONResponse(
        content=report,
        headers={
            "Content-Disposition": f"attachment; filename=enthesis_report_{paper_id}.json"
        }
    )
