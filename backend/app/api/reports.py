"""API endpoints for generating research feedback reports"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
from datetime import datetime
import os
import tempfile

from ..database import get_db
from ..services.report_generator import ReportGenerator
from ..services.report_exporter import exporter
from ..services.auth import get_current_active_user
from ..models.user import User
from ..services.store import LocalRunStore
from ..config import settings

router = APIRouter(prefix="/api/v1/papers/{paper_id}/report", tags=["reports"])
store = LocalRunStore(settings.STORAGE_DIR)
report_generator = ReportGenerator()


@router.get("")
async def generate_report(
    paper_id: str,
    format: str = "json"  # json or markdown
):
    """
    Generate comprehensive research feedback report.
    
    Args:
        paper_id: Paper identifier
        format: Output format (json or markdown)
        
    Returns:
        Complete structured report
    """
    # Get paper data
    paper_run = store.get(paper_id)
    if not paper_run:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Get analysis results directly from paper_run
    analysis_results = {}
    modules = ['related_work', 'novelty', 'weaknesses', 'clarity', 'reviewer_feedback']
    
    # Try to get results from paper_run.results
    if hasattr(paper_run, 'results') and paper_run.results:
        for module in modules:
            if module in paper_run.results:
                analysis_results[module] = paper_run.results[module]
    
    # Fallback: try store.get_module_result
    if not analysis_results:
        for module in modules:
            try:
                module_data = store.get_module_result(paper_id, module)
                if module_data:
                    analysis_results[module] = module_data
            except Exception as e:
                print(f"Warning: Could not load {module} results: {e}")
                continue
    
    # Get action center results if available
    try:
        if hasattr(paper_run, 'results') and 'action_center' in paper_run.results:
            analysis_results['action_center'] = paper_run.results['action_center']
        else:
            action_results = store.get_module_result(paper_id, 'action_center')
            if action_results:
                analysis_results['action_center'] = action_results
    except:
        pass
    
    # Check if we have any analysis results
    if not analysis_results:
        raise HTTPException(
            status_code=400, 
            detail="No analysis results available. Please complete the analysis first."
        )
    
    # Generate report
    try:
        report = report_generator.generate_report(
            paper_id=paper_id,
            paper_title=paper_run.paper_id,  # Use paper_id as title for now
            analysis_results=analysis_results,
            paper_text=getattr(paper_run, 'text', ''),
            metadata={
                "filename": getattr(paper_run, 'filename', 'unknown'),
                "uploaded_at": paper_run.start_time.isoformat() if paper_run.start_time else None
            }
        )
    except Exception as e:
        print(f"Error generating report: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")
    
    if format == "markdown":
        return {"report": report_generator.format_as_markdown(report)}
    else:
        return report


@router.get("/download")
async def download_report(
    paper_id: str,
    format: str = "markdown"  # markdown, json, pdf, or docx
):
    """
    Download report as file.
    
    Args:
        paper_id: Paper identifier
        format: Output format (markdown, json, pdf, or docx)
        
    Returns:
        File download
    """
    # Validate format
    valid_formats = ['markdown', 'json', 'pdf', 'docx']
    if format not in valid_formats:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid format. Must be one of: {', '.join(valid_formats)}"
        )
    
    # Get paper data
    paper_run = store.get(paper_id)
    if not paper_run:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Get analysis results directly from paper_run
    analysis_results = {}
    modules = ['related_work', 'novelty', 'weaknesses', 'clarity', 'reviewer_feedback']
    
    # Try to get results from paper_run.results
    if hasattr(paper_run, 'results') and paper_run.results:
        for module in modules:
            if module in paper_run.results:
                analysis_results[module] = paper_run.results[module]
    
    # Fallback: try store.get_module_result
    if not analysis_results:
        for module in modules:
            try:
                module_data = store.get_module_result(paper_id, module)
                if module_data:
                    analysis_results[module] = module_data
            except Exception as e:
                print(f"Warning: Could not load {module} results: {e}")
                continue
    
    # Check if we have any analysis results
    if not analysis_results:
        raise HTTPException(
            status_code=400, 
            detail="No analysis results available. Please complete the analysis first."
        )
    
    # Generate report
    try:
        report = report_generator.generate_report(
            paper_id=paper_id,
            paper_title=getattr(paper_run, 'filename', paper_run.paper_id),
            analysis_results=analysis_results,
            paper_text=getattr(paper_run, 'text', ''),
            metadata={
                "filename": getattr(paper_run, 'filename', 'unknown'),
                "uploaded_at": getattr(paper_run, 'start_time', datetime.now()).isoformat() if hasattr(paper_run, 'start_time') else None
            }
        )
    except Exception as e:
        print(f"Error generating report: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")
    
    # Create temporary file
    temp_dir = tempfile.gettempdir()
    
    try:
        if format == "markdown":
            filename = f"enthesis_report_{paper_id}.md"
            filepath = os.path.join(temp_dir, filename)
            exporter.export_to_markdown(report, filepath)
            media_type = "text/markdown"
            
        elif format == "json":
            filename = f"enthesis_report_{paper_id}.json"
            filepath = os.path.join(temp_dir, filename)
            import json
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            media_type = "application/json"
            
        elif format == "pdf":
            filename = f"enthesis_report_{paper_id}.pdf"
            filepath = os.path.join(temp_dir, filename)
            try:
                exporter.export_to_pdf(report, filepath)
                media_type = "application/pdf"
            except ImportError as e:
                raise HTTPException(
                    status_code=501,
                    detail="PDF export not available. Please install required dependencies: pip install weasyprint"
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
                
        elif format == "docx":
            filename = f"enthesis_report_{paper_id}.docx"
            filepath = os.path.join(temp_dir, filename)
            try:
                exporter.export_to_docx(report, filepath)
                media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            except ImportError as e:
                raise HTTPException(
                    status_code=501,
                    detail="DOCX export not available. Please install required dependencies: pip install python-docx"
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"DOCX generation failed: {str(e)}")
        
        # Check if file was created
        if not os.path.exists(filepath):
            raise HTTPException(status_code=500, detail="File generation failed")
        
        return FileResponse(
            path=filepath,
            filename=filename,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in download_report: {e}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")


@router.get("/summary")
async def get_report_summary(
    paper_id: str
):
    """
    Get quick summary of report statistics.
    
    Args:
        paper_id: Paper identifier
        
    Returns:
        Report summary statistics
    """
    # Get paper data
    paper_run = store.get(paper_id)
    if not paper_run:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Get analysis results
    analysis_results = {}
    modules = ['related_work', 'novelty', 'weaknesses', 'clarity', 'reviewer_feedback']
    
    for module in modules:
        module_data = store.get_module_result(paper_id, module)
        if module_data:
            analysis_results[module] = module_data
    
    # Count findings
    total_findings = 0
    findings_by_module = {}
    
    for module_name, module_data in analysis_results.items():
        if isinstance(module_data, dict) and 'findings' in module_data:
            findings = module_data['findings']
            if isinstance(findings, list):
                count = len(findings)
                total_findings += count
                findings_by_module[module_name] = count
    
    return {
        "paper_id": paper_id,
        "total_findings": total_findings,
        "findings_by_module": findings_by_module,
        "modules_analyzed": len(analysis_results),
        "report_available": total_findings > 0
    }
