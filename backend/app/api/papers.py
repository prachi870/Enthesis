"""Papers API endpoints"""
import uuid
import threading
import time
from typing import Dict
from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Depends
from sqlalchemy.orm import Session

from pipeline.orchestrator import Orchestrator, PipelineError
from pipeline.report import build_report
from pipeline.schemas import PaperRun
from pipeline.stages import Stage
from modules.claim_extractor import ClaimExtractor
from modules.novelty_investigator import NoveltyInvestigator
from modules.weakness_mapper import WeaknessMapper
from modules.reviewer_room import ReviewerRoom
from modules.action_center import ActionCenter
from ..config import settings
from ..services.parsing import extract_text
from ..services.store import LocalRunStore
from ..services.auth import get_current_active_user
from ..models.user import User
from ..database import get_db

router = APIRouter(prefix="/api/v1/papers", tags=["papers"])
store = LocalRunStore(settings.STORAGE_DIR)
orch = Orchestrator()
claim_extractor = ClaimExtractor()
novelty_investigator = NoveltyInvestigator()
weakness_mapper = WeaknessMapper()
reviewer_room = ReviewerRoom()
action_center = ActionCenter()


def _get(paper_id: str, current_user: User = None) -> PaperRun:
    """Get paper run by ID, optionally checking user ownership"""
    run = store.get(paper_id)
    if not run:
        raise HTTPException(404, "Paper not found")
    
    # If user is provided, check ownership
    if current_user and run.user_id and run.user_id != current_user.username:
        raise HTTPException(403, "You don't have access to this paper")
    
    return run


@router.get("/list")
def list_papers(
    search: str = None,
    current_user: User = Depends(get_current_active_user)
):
    """List all uploaded papers for the current user with optional search"""
    runs = store.list_all()
    
    # Filter by current user
    user_runs = [r for r in runs if r.user_id == current_user.username]
    
    # Filter by search term if provided
    if search:
        search_lower = search.lower()
        user_runs = [
            r for r in user_runs
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
            for r in user_runs
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
        author=author or current_user.full_name or current_user.username,
        user_id=current_user.username  # Associate paper with current user
    )
    store.save(run)
    
    # Automatically start analysis pipeline
    try:
        orch.start(run)
        store.save(run)
    except PipelineError as e:
        # Even if start fails, return the paper_id
        pass
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
    r = _get(paper_id, current_user)
    return {
        "paper_id": r.paper_id,
        "filename": r.filename,
        "author": r.author,
        "started": r.started,
        "states": r.states,
        "errors": r.errors,
        "text": r.text,  # Include full text
        "text_preview": r.text[:500] if r.text else None
    }


@router.delete("/{paper_id}")
def delete_paper(
    paper_id: str
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
    paper_id: str
):
    """Get analysis results for a paper"""
    r = _get(paper_id)
    return {
        "paper": {
            "paper_id": r.paper_id,
            "filename": r.filename,
            "title": r.filename.replace('.pdf', '').replace('_', ' ').title(),
            "author": r.author
        },
        "states": r.states,
        "results": r.results,
        "errors": r.errors
    }


@router.get("/{paper_id}/report")
def get_report(
    paper_id: str
):
    """Get comprehensive analysis report"""
    return build_report(_get(paper_id))


@router.get("/{paper_id}/download")
def download_report(
    paper_id: str
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


@router.get("/{paper_id}/claims")
def get_claims(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Extract and categorize research claims from the paper"""
    run = _get(paper_id)
    
    # Extract claims from paper text
    claims = claim_extractor.extract_claims(run.text, paper_id)
    
    # Get summary statistics
    summary = claim_extractor.get_claims_summary(claims)
    
    # Enrich claims with related work if available
    related_work = run.results.get("related_work", {})
    novelty = run.results.get("novelty", {})
    
    # Add analysis context to claims
    for claim in claims:
        # Add recommended investigation based on claim type
        claim["recommended_investigation"] = _get_investigation_recommendation(claim, related_work, novelty)
        
        # Add model analysis
        claim["model_analysis"] = _get_model_analysis(claim)
        
        # Add related research if available
        if related_work and related_work.get("evidence"):
            claim["related_research"] = related_work["evidence"][:3]  # Top 3 related papers
        else:
            claim["related_research"] = []
    
    return {
        "paper_id": paper_id,
        "filename": run.filename,
        "summary": summary,
        "claims": claims
    }


def _get_investigation_recommendation(claim: dict, related_work: dict, novelty: dict) -> str:
    """Generate investigation recommendation for a claim."""
    claim_type = claim["claim_type"]
    
    recommendations = {
        "novelty": (
            "Verify this claim against existing literature. Check if similar claims have been made "
            "by other researchers. Consider using semantic search across recent publications."
        ),
        "performance": (
            "Validate this performance claim with rigorous experimental evidence. Ensure comparisons "
            "are fair (same datasets, evaluation metrics, and experimental setup). Include statistical "
            "significance testing and error bars."
        ),
        "method": (
            "Document this method thoroughly with implementation details, hyperparameters, and "
            "reproducibility information. Consider releasing code to support the claim."
        ),
        "dataset": (
            "Provide detailed dataset statistics, collection methodology, and potential biases. "
            "Consider releasing the dataset or providing detailed access instructions."
        ),
        "comparison": (
            "Ensure comparisons are comprehensive and fair. Include multiple baselines, ablation studies, "
            "and analysis of when/why the proposed method performs better or worse."
        )
    }
    
    base_rec = recommendations.get(claim_type, "Further investigation recommended.")
    
    # Add context from modules if available
    if claim_type == "novelty" and novelty:
        findings = novelty.get("findings", [])
        if findings:
            novelty_score = findings[0].get("novelty_score", 0)
            if novelty_score < 0.5:
                base_rec += " NOTE: Novelty analysis detected potential overlaps with existing work."
    
    if claim_type == "performance" and related_work:
        evidence = related_work.get("evidence", [])
        if len(evidence) > 3:
            base_rec += f" NOTE: Found {len(evidence)} related papers for comparison."
    
    return base_rec


def _get_model_analysis(claim: dict) -> str:
    """Generate model analysis for a claim."""
    claim_type = claim["claim_type"]
    confidence = claim["confidence"]
    has_metrics = len(claim.get("metrics", [])) > 0
    
    analysis_parts = []
    
    # Model used
    analysis_parts.append(f"Extracted using pattern-based NLP with {claim_type}-specific rules.")
    
    # Confidence explanation
    if confidence > 0.8:
        analysis_parts.append(f"High confidence ({confidence:.2f}) due to clear claim structure and supporting evidence.")
    elif confidence > 0.7:
        analysis_parts.append(f"Moderate confidence ({confidence:.2f}) - claim is well-formed with some supporting indicators.")
    else:
        analysis_parts.append(f"Lower confidence ({confidence:.2f}) - claim may be implicit or require manual verification.")
    
    # Metrics
    if has_metrics:
        analysis_parts.append(f"Found {len(claim['metrics'])} quantitative metrics supporting this claim.")
    else:
        analysis_parts.append("No specific quantitative metrics detected in claim text.")
    
    # Section context
    section = claim.get("section", "Unknown")
    if section in ["Abstract", "Introduction", "Conclusion"]:
        analysis_parts.append(f"Appears in {section} - typically contains high-level claims.")
    elif section in ["Methodology", "Experiments", "Results"]:
        analysis_parts.append(f"Appears in {section} - likely to have detailed supporting evidence.")
    
    return " ".join(analysis_parts)


@router.get("/{paper_id}/novelty-investigation")
def investigate_novelty(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Investigate novelty of research claims using NLI-style analysis.
    
    For each claim, provides:
    - Claim text
    - Relevant existing research
    - Evidence from paper and literature
    - NLI classification (supported, contradicted, overlapping, novel, etc.)
    - Detailed explanation with cautious language
    """
    run = _get(paper_id)
    
    # Extract claims first
    claims = claim_extractor.extract_claims(run.text, paper_id)
    
    if not claims:
        return {
            "paper_id": paper_id,
            "message": "No claims found to investigate",
            "investigations": [],
            "summary": {}
        }
    
    # Get related work results if available
    related_work = run.results.get("related_work", {})
    related_papers = related_work.get("evidence", [])
    
    # Investigate each claim
    investigations = novelty_investigator.investigate_claims(
        claims,
        run.text,
        related_papers
    )
    
    # Get summary
    summary = novelty_investigator.get_investigation_summary(investigations)
    
    # Add paper context
    summary["paper_filename"] = run.filename
    summary["related_papers_available"] = len(related_papers)
    
    return {
        "paper_id": paper_id,
        "filename": run.filename,
        "investigations": investigations,
        "summary": summary
    }


@router.get("/{paper_id}/weakness-heatmap")
def get_weakness_heatmap(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate weakness heatmap for paper sections.
    
    Visualizes potential issues across paper sections:
    - Abstract, Introduction, Related Work, Methodology
    - Experiments, Results, Discussion, Conclusion
    
    For each section shows:
    - Heat level (none/minimal/low/medium/high)
    - Number of findings
    - Weakness categories
    - Descriptions with cautious language
    - Confidence scores
    - Evidence
    - Recommended actions
    
    Uses phrases like "Potential issues detected" - never "bad" or definitive judgments.
    """
    run = _get(paper_id)
    
    # Get analysis results if available
    analysis_results = run.results
    
    # Map weaknesses to sections
    heatmap_data = weakness_mapper.map_weaknesses(
        run.text,
        paper_id,
        analysis_results
    )
    
    # Add paper metadata
    heatmap_data["filename"] = run.filename
    heatmap_data["author"] = run.author
    
    return heatmap_data


@router.get("/{paper_id}/reviewer-room")
def get_reviewer_room(
    paper_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Generate Reviewer Room with AI-generated reviewer-style feedback.
    
    Organizes feedback into categories:
    - Methodology
    - Novelty
    - Evaluation
    - Clarity
    - Experimental Design
    
    For each pattern shows:
    - Pattern name and description
    - Detected concern
    - Evidence from paper
    - Related reviewer patterns
    - Confidence
    - Recommended investigation
    
    IMPORTANT: All output clearly labeled as "AI-generated reviewer-style feedback"
    Does NOT represent actual human reviews or reviewer identities.
    """
    run = _get(paper_id)
    
    # Get reviewer feedback module results
    reviewer_feedback = run.results.get("reviewer_feedback", {})
    
    if not reviewer_feedback:
        return {
            "paper_id": paper_id,
            "message": "Reviewer feedback not yet generated. Please complete the analysis pipeline.",
            "categories": {},
            "summary_stats": {}
        }
    
    # Organize into reviewer room format
    room_data = reviewer_room.organize_feedback(reviewer_feedback, paper_id)
    
    # Add paper metadata
    room_data["filename"] = run.filename
    room_data["author"] = run.author
    
    return room_data


@router.get("/{paper_id}/action-center")
def get_action_center(
    paper_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get Research Action Center with prioritized tasks.
    
    Converts findings from all modules into actionable research tasks:
    - HIGH PRIORITY: Novelty verification, missing baselines
    - MEDIUM PRIORITY: Method clarification, evaluation improvements  
    - LOW PRIORITY: Clarity improvements, reproducibility
    
    Each action includes:
    - Title
    - Description
    - Source finding
    - Evidence
    - Priority
    - Status (not_started/in_progress/reviewed/resolved)
    
    Students can mark actions as in_progress, reviewed, or resolved.
    System never auto-resolves - only student can change status.
    """
    run = _get(paper_id)
    
    # Get existing actions from database
    from ..models.action import Action
    existing_actions_db = db.query(Action).filter(
        Action.paper_id == paper_id,
        Action.user_id == current_user.username
    ).all()
    
    existing_actions = [action.to_dict() for action in existing_actions_db]
    
    # Generate actions from analysis results
    action_data = action_center.generate_actions(
        paper_id,
        run.results,
        existing_actions
    )
    
    # Save new actions to database
    for action in action_data['actions']:
        # Check if action already exists
        existing = db.query(Action).filter(
            Action.action_id == action['action_id']
        ).first()
        
        if not existing:
            # Create new action
            new_action = Action(
                action_id=action['action_id'],
                paper_id=paper_id,
                user_id=current_user.username,
                title=action['title'],
                description=action['description'],
                source_module=action['source_module'],
                source_finding_type=action.get('source_finding_type'),
                evidence=action.get('evidence'),
                priority=action['priority'],
                status=action['status'],
                recommended_action=action.get('recommended_action')
            )
            db.add(new_action)
    
    db.commit()
    
    # Add paper metadata
    action_data["filename"] = run.filename
    action_data["author"] = run.author
    
    return action_data


@router.put("/{paper_id}/actions/{action_id}/status")
def update_action_status(
    paper_id: str,
    action_id: str,
    status: str,
    notes: str = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update the status of an action item.
    
    Valid statuses:
    - not_started: Initial state
    - in_progress: Student is working on it
    - reviewed: Student has reviewed the issue
    - resolved: Student has addressed the issue
    
    Only the student can change status. System never auto-resolves.
    """
    from ..models.action import Action, ActionStatus
    
    # Validate status
    valid_statuses = ['not_started', 'in_progress', 'reviewed', 'resolved']
    if status not in valid_statuses:
        raise HTTPException(400, f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
    
    # Find action
    action = db.query(Action).filter(
        Action.action_id == action_id,
        Action.paper_id == paper_id,
        Action.user_id == current_user.username
    ).first()
    
    if not action:
        raise HTTPException(404, "Action not found")
    
    # Update status
    action.status = ActionStatus(status)
    if notes:
        action.notes = notes
    
    db.commit()
    db.refresh(action)
    
    return {
        "action_id": action_id,
        "status": status,
        "updated_at": action.updated_at.isoformat() if action.updated_at else None,
        "message": f"Action marked as {status}"
    }


@router.get("/{paper_id}/actions/summary")
def get_actions_summary(
    paper_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get summary statistics for action items."""
    from ..models.action import Action
    
    actions = db.query(Action).filter(
        Action.paper_id == paper_id,
        Action.user_id == current_user.username
    ).all()
    
    total = len(actions)
    by_status = {
        'not_started': len([a for a in actions if a.status.value == 'not_started']),
        'in_progress': len([a for a in actions if a.status.value == 'in_progress']),
        'reviewed': len([a for a in actions if a.status.value == 'reviewed']),
        'resolved': len([a for a in actions if a.status.value == 'resolved'])
    }
    
    by_priority = {
        'high': len([a for a in actions if a.priority.value == 'high']),
        'medium': len([a for a in actions if a.priority.value == 'medium']),
        'low': len([a for a in actions if a.priority.value == 'low'])
    }
    
    completion = 0
    if total > 0:
        completed = by_status['resolved'] + by_status['reviewed']
        completion = (completed / total) * 100
    
    return {
        "paper_id": paper_id,
        "total_actions": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "completion_percentage": round(completion, 1)
    }
