"""API endpoints for analysis history"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models.analysis_run import AnalysisRun
from ..services.auth import get_current_active_user
from ..models.user import User

router = APIRouter(prefix="/api/v1/papers/{paper_id}/history", tags=["analysis_history"])


@router.get("")
async def get_analysis_history(
    paper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all analysis runs for a paper"""
    runs = db.query(AnalysisRun).filter(
        AnalysisRun.paper_id == paper_id
    ).order_by(AnalysisRun.run_date.desc()).all()
    
    return [run.to_dict() for run in runs]


@router.get("/{run_id}")
async def get_analysis_run(
    paper_id: str,
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get specific analysis run details"""
    run = db.query(AnalysisRun).filter(
        AnalysisRun.id == run_id,
        AnalysisRun.paper_id == paper_id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    
    # Return full details including analysis results
    result = run.to_dict()
    result["analysis_results"] = run.analysis_results
    return result


@router.post("/record")
async def record_analysis_run(
    paper_id: str,
    run_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Record a new analysis run"""
    
    # Extract data from run_data
    new_run = AnalysisRun(
        paper_id=paper_id,
        version_id=run_data.get("version_id"),
        run_date=datetime.utcnow(),
        pipeline_status=run_data.get("pipeline_status", "completed"),
        model_versions=run_data.get("model_versions", {}),
        dataset_versions=run_data.get("dataset_versions", {}),
        completed_modules=run_data.get("completed_modules", []),
        failed_modules=run_data.get("failed_modules", []),
        findings_count=run_data.get("findings_count", {}),
        analysis_results=run_data.get("analysis_results", {}),
        report_generated=run_data.get("report_generated", "no"),
        report_path=run_data.get("report_path"),
        duration_seconds=run_data.get("duration_seconds"),
        trigger=run_data.get("trigger", "manual"),
        user_id=current_user.id,
        notes=run_data.get("notes")
    )
    
    db.add(new_run)
    db.commit()
    db.refresh(new_run)
    
    return new_run.to_dict()


@router.get("/statistics/summary")
async def get_history_statistics(
    paper_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get statistics about analysis history"""
    runs = db.query(AnalysisRun).filter(
        AnalysisRun.paper_id == paper_id
    ).all()
    
    if not runs:
        return {
            "total_runs": 0,
            "successful_runs": 0,
            "failed_runs": 0,
            "average_duration": 0,
            "modules_success_rate": {},
            "latest_run": None
        }
    
    successful = [r for r in runs if r.pipeline_status == "completed"]
    failed = [r for r in runs if r.pipeline_status == "failed"]
    
    # Calculate average duration
    durations = [r.duration_seconds for r in runs if r.duration_seconds]
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    # Calculate module success rates
    module_stats = {}
    for run in runs:
        for module in run.completed_modules:
            if module not in module_stats:
                module_stats[module] = {"success": 0, "total": 0}
            module_stats[module]["success"] += 1
            module_stats[module]["total"] += 1
        
        if run.failed_modules:
            for failure in run.failed_modules:
                module = failure.get("module")
                if module:
                    if module not in module_stats:
                        module_stats[module] = {"success": 0, "total": 0}
                    module_stats[module]["total"] += 1
    
    # Convert to success rates
    success_rates = {}
    for module, stats in module_stats.items():
        success_rates[module] = {
            "rate": stats["success"] / stats["total"] if stats["total"] > 0 else 0,
            "successful": stats["success"],
            "total": stats["total"]
        }
    
    return {
        "total_runs": len(runs),
        "successful_runs": len(successful),
        "failed_runs": len(failed),
        "partial_runs": len([r for r in runs if r.pipeline_status == "partial"]),
        "average_duration": round(avg_duration, 2),
        "modules_success_rate": success_rates,
        "latest_run": runs[0].to_dict() if runs else None
    }


@router.delete("/{run_id}")
async def delete_analysis_run(
    paper_id: str,
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an analysis run (admin only or own runs)"""
    run = db.query(AnalysisRun).filter(
        AnalysisRun.id == run_id,
        AnalysisRun.paper_id == paper_id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    
    # Check ownership
    if run.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this run")
    
    db.delete(run)
    db.commit()
    
    return {"message": "Analysis run deleted successfully"}
