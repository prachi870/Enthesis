"""API endpoints for paper version management"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import json
from datetime import datetime

from modules.version_comparator import VersionComparator
from ..database import get_db
from ..models.version import PaperVersion
from ..services.parsing import extract_text

router = APIRouter(prefix="/papers/{paper_id}/versions", tags=["versions"])


@router.post("/upload")
async def upload_version(
    paper_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a new version of a paper"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Parse the PDF
    content = await file.read()
    paper_text = extract_text(content, file.filename)
    
    # Get existing versions to determine version number
    existing_versions = db.query(PaperVersion).filter(
        PaperVersion.paper_id == paper_id
    ).order_by(PaperVersion.version_number.desc()).all()
    
    version_number = 1 if not existing_versions else existing_versions[0].version_number + 1
    
    # Create new version record
    new_version = PaperVersion(
        paper_id=paper_id,
        version_number=version_number,
        content=paper_text,
        filename=file.filename,
        uploaded_at=datetime.utcnow()
    )
    
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    
    return {
        "id": new_version.id,
        "paper_id": new_version.paper_id,
        "version_number": new_version.version_number,
        "filename": new_version.filename,
        "uploaded_at": new_version.uploaded_at.isoformat(),
        "has_analysis": new_version.analysis_results is not None
    }


@router.get("")
async def list_versions(
    paper_id: str,
    db: Session = Depends(get_db)
):
    """List all versions of a paper"""
    versions = db.query(PaperVersion).filter(
        PaperVersion.paper_id == paper_id
    ).order_by(PaperVersion.version_number.asc()).all()
    
    return [
        {
            "id": v.id,
            "paper_id": v.paper_id,
            "version_number": v.version_number,
            "filename": v.filename,
            "uploaded_at": v.uploaded_at.isoformat(),
            "has_analysis": v.analysis_results is not None
        }
        for v in versions
    ]


@router.post("/{version_id}/analyze")
async def analyze_version(
    paper_id: str,
    version_id: int,
    db: Session = Depends(get_db)
):
    """Store analysis results for a specific version"""
    version = db.query(PaperVersion).filter(
        PaperVersion.id == version_id,
        PaperVersion.paper_id == paper_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Note: Analysis results should be provided in request body
    # For now, return version info to trigger frontend to run analysis
    return {
        "id": version.id,
        "paper_id": version.paper_id,
        "version_number": version.version_number,
        "content": version.content
    }


@router.put("/{version_id}/analysis")
async def update_version_analysis(
    paper_id: str,
    version_id: int,
    analysis_results: dict,
    db: Session = Depends(get_db)
):
    """Update analysis results for a specific version"""
    version = db.query(PaperVersion).filter(
        PaperVersion.id == version_id,
        PaperVersion.paper_id == paper_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    version.analysis_results = analysis_results
    db.commit()
    db.refresh(version)
    
    return {
        "id": version.id,
        "paper_id": version.paper_id,
        "version_number": version.version_number,
        "has_analysis": True
    }


@router.get("/compare")
async def compare_versions(
    paper_id: str,
    version1_id: int,
    version2_id: int,
    db: Session = Depends(get_db)
):
    """Compare two versions of a paper"""
    version1 = db.query(PaperVersion).filter(
        PaperVersion.id == version1_id,
        PaperVersion.paper_id == paper_id
    ).first()
    
    version2 = db.query(PaperVersion).filter(
        PaperVersion.id == version2_id,
        PaperVersion.paper_id == paper_id
    ).first()
    
    if not version1 or not version2:
        raise HTTPException(status_code=404, detail="One or both versions not found")
    
    if not version1.analysis_results or not version2.analysis_results:
        raise HTTPException(
            status_code=400,
            detail="Both versions must have analysis results to compare"
        )
    
    # Perform comparison
    comparator = VersionComparator()
    comparison = comparator.compare_versions(
        version1.analysis_results,
        version2.analysis_results
    )
    
    return {
        "version1": {
            "id": version1.id,
            "version_number": version1.version_number,
            "filename": version1.filename,
            "uploaded_at": version1.uploaded_at.isoformat()
        },
        "version2": {
            "id": version2.id,
            "version_number": version2.version_number,
            "filename": version2.filename,
            "uploaded_at": version2.uploaded_at.isoformat()
        },
        "comparison": comparison
    }
