"""Complete Reports API with proper generation, tracking, and downloading"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import os
import tempfile
import time
import re

from ..database import get_db
from ..models.report import Report
from ..services.report_generator import ReportGenerator
from ..services.report_exporter import exporter
from ..services.store import LocalRunStore
from ..config import settings

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])
store = LocalRunStore(settings.STORAGE_DIR)
report_generator = ReportGenerator()

# Track ongoing generations to prevent duplicates
_generating = set()


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to be filesystem-safe"""
    # Remove or replace problematic characters
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)
    filename = filename.replace(' ', '_')
    # Limit length
    if len(filename) > 200:
        filename = filename[:200]
    return filename or "report"


@router.get("/list")
async def list_all_reports(
    db: Session = Depends(get_db),
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    List all generated reports across all papers.
    
    Args:
        status: Filter by status (generating, ready, failed)
        skip: Pagination offset
        limit: Max results
        
    Returns:
        List of report records
    """
    query = db.query(Report)
    
    if status:
        query = query.filter(Report.status == status)
    
    reports = query.order_by(Report.generated_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "reports": [
            {
                "report_id": r.report_id,
                "paper_id": r.paper_id,
                "paper_title": r.paper_title,
                "version_id": r.version_id,
                "status": r.status,
                "generated_at": r.generated_at.isoformat() if r.generated_at else None,
                "total_findings": r.total_findings,
                "findings_breakdown": r.findings_breakdown,
                "formats_available": r.formats_available or [],
                "error_message": r.error_message if r.status == "failed" else None
            }
            for r in reports
        ],
        "total": query.count()
    }


@router.get("/paper/{paper_id}")
async def get_paper_reports(
    paper_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all reports for a specific paper.
    
    Args:
        paper_id: Paper identifier
        
    Returns:
        List of reports for this paper
    """
    reports = db.query(Report).filter(
        Report.paper_id == paper_id
    ).order_by(Report.generated_at.desc()).all()
    
    return {
        "paper_id": paper_id,
        "reports": [
            {
                "report_id": r.report_id,
                "status": r.status,
                "generated_at": r.generated_at.isoformat() if r.generated_at else None,
                "total_findings": r.total_findings,
                "findings_breakdown": r.findings_breakdown,
                "formats_available": r.formats_available or []
            }
            for r in reports
        ]
    }


@router.post("/generate/{paper_id}")
async def generate_report_for_paper(
    paper_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    force: bool = False
):
    """
    Generate a new report for a paper.
    
    Args:
        paper_id: Paper identifier
        force: Force regeneration even if recent report exists
        
    Returns:
        Report record with generation status
    """
    # Check if already generating
    if paper_id in _generating:
        raise HTTPException(
            status_code=409,
            detail="Report generation already in progress for this paper"
        )
    
    # Check if recent report exists
    if not force:
        recent_report = db.query(Report).filter(
            Report.paper_id == paper_id,
            Report.status == "ready"
        ).order_by(Report.generated_at.desc()).first()
        
        if recent_report:
            # If report is less than 1 hour old, return existing
            age_seconds = (datetime.utcnow() - recent_report.generated_at).total_seconds()
            if age_seconds < 3600:
                return {
                    "message": "Recent report already exists",
                    "report_id": recent_report.report_id,
                    "status": "ready",
                    "generated_at": recent_report.generated_at.isoformat()
                }
    
    # Get paper data
    paper_run = store.get(paper_id)
    if not paper_run:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Create report record
    report_id = f"report_{paper_id}_{int(time.time())}"
    report_record = Report(
        report_id=report_id,
        paper_id=paper_id,
        paper_title=getattr(paper_run, 'filename', paper_id),
        status="generating"
    )
    db.add(report_record)
    db.commit()
    db.refresh(report_record)
    
    # Generate report in background
    _generating.add(paper_id)
    background_tasks.add_task(
        _generate_report_task,
        report_record.id,
        paper_id
    )
    
    return {
        "message": "Report generation started",
        "report_id": report_id,
        "status": "generating"
    }


def _generate_report_task(report_db_id: int, paper_id: str):
    """Background task to generate report"""
    from ..database import SessionLocal
    
    db = SessionLocal()
    start_time = time.time()
    
    try:
        # Get report record
        report_record = db.query(Report).filter(Report.id == report_db_id).first()
        if not report_record:
            return
        
        # Get paper data
        paper_run = store.get(paper_id)
        if not paper_run:
            report_record.status = "failed"
            report_record.error_message = "Paper not found"
            db.commit()
            return
        
        # Get analysis results
        analysis_results = {}
        modules = ['related_work', 'novelty', 'weaknesses', 'clarity', 'reviewer_feedback']
        
        if hasattr(paper_run, 'results') and paper_run.results:
            for module in modules:
                if module in paper_run.results:
                    analysis_results[module] = paper_run.results[module]
        
        if not analysis_results:
            report_record.status = "failed"
            report_record.error_message = "No analysis results available"
            db.commit()
            return
        
        # Generate report
        report_data = report_generator.generate_report(
            paper_id=paper_id,
            paper_title=getattr(paper_run, 'filename', paper_id),
            analysis_results=analysis_results,
            paper_text=getattr(paper_run, 'text', ''),
            metadata={
                "filename": getattr(paper_run, 'filename', 'unknown')
            }
        )
        
        # Count findings
        total_findings = 0
        findings_breakdown = {}
        for module_name, module_data in analysis_results.items():
            if isinstance(module_data, dict) and 'findings' in module_data:
                count = len(module_data['findings'])
                total_findings += count
                findings_breakdown[module_name] = count
        
        # Update report record
        report_record.status = "ready"
        report_record.total_findings = total_findings
        report_record.findings_breakdown = findings_breakdown
        report_record.formats_available = ['pdf', 'docx', 'markdown', 'json']
        report_record.generation_time_seconds = int(time.time() - start_time)
        report_record.report_metadata = {"report_data": report_data}
        
        db.commit()
        
    except Exception as e:
        print(f"Error generating report: {e}")
        import traceback
        traceback.print_exc()
        
        report_record = db.query(Report).filter(Report.id == report_db_id).first()
        if report_record:
            report_record.status = "failed"
            report_record.error_message = str(e)
            db.commit()
    
    finally:
        _generating.discard(paper_id)
        db.close()


@router.get("/download/{report_id}")
async def download_report_by_id(
    report_id: str,
    format: str = "pdf",
    db: Session = Depends(get_db)
):
    """
    Download a specific report in specified format.
    
    Args:
        report_id: Report identifier
        format: Output format (pdf, docx, markdown, json)
        
    Returns:
        File download
    """
    # Validate format
    valid_formats = ['pdf', 'docx', 'markdown', 'json']
    if format not in valid_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid format. Must be one of: {', '.join(valid_formats)}"
        )
    
    # Get report record
    report_record = db.query(Report).filter(Report.report_id == report_id).first()
    if not report_record:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report_record.status != "ready":
        raise HTTPException(
            status_code=400,
            detail=f"Report is not ready. Current status: {report_record.status}"
        )
    
    # Get report data from metadata
    report_data = report_record.report_metadata.get("report_data") if report_record.report_metadata else None
    if not report_data:
        raise HTTPException(status_code=500, detail="Report data not found")
    
    # Generate file
    temp_dir = tempfile.gettempdir()
    safe_title = sanitize_filename(report_record.paper_title or report_record.paper_id)
    
    try:
        if format == "pdf":
            filename = f"{safe_title}_research_report.pdf"
            filepath = os.path.join(temp_dir, filename)
            exporter.export_to_pdf(report_data, filepath)
            media_type = "application/pdf"
            
        elif format == "docx":
            filename = f"{safe_title}_research_report.docx"
            filepath = os.path.join(temp_dir, filepath)
            exporter.export_to_docx(report_data, filepath)
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            
        elif format == "markdown":
            filename = f"{safe_title}_research_report.md"
            filepath = os.path.join(temp_dir, filename)
            exporter.export_to_markdown(report_data, filepath)
            media_type = "text/markdown"
            
        elif format == "json":
            filename = f"{safe_title}_research_report.json"
            filepath = os.path.join(temp_dir, filename)
            import json
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, ensure_ascii=False)
            media_type = "application/json"
        
        # Verify file exists
        if not os.path.exists(filepath):
            raise HTTPException(status_code=500, detail="File generation failed")
        
        # Return file
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type=media_type,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
        
    except Exception as e:
        print(f"Error downloading report: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.get("/status/{report_id}")
async def get_report_status(
    report_id: str,
    db: Session = Depends(get_db)
):
    """
    Get status of a report generation.
    
    Args:
        report_id: Report identifier
        
    Returns:
        Report status information
    """
    report_record = db.query(Report).filter(Report.report_id == report_id).first()
    if not report_record:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return {
        "report_id": report_record.report_id,
        "status": report_record.status,
        "generated_at": report_record.generated_at.isoformat() if report_record.generated_at else None,
        "generation_time_seconds": report_record.generation_time_seconds,
        "total_findings": report_record.total_findings,
        "formats_available": report_record.formats_available or [],
        "error_message": report_record.error_message if report_record.status == "failed" else None
    }


@router.delete("/{report_id}")
async def delete_report(
    report_id: str,
    db: Session = Depends(get_db)
):
    """Delete a report record"""
    report_record = db.query(Report).filter(Report.report_id == report_id).first()
    if not report_record:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db.delete(report_record)
    db.commit()
    
    return {"message": "Report deleted successfully"}
