"""Research Paper Builder endpoints."""
import logging
import re
import threading
from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..config import settings
from ..database import SessionLocal, get_db
from ..models.analysis_run import AnalysisRun
from ..models.builder import BuilderDraft, BuilderDraftVersion
from ..models.builder_action import BuilderAction
from ..models.user import User
from ..schemas.builder import DraftInput, DraftUpdate, ExportStatusUpdate, VersionCreate
from ..services.auth_optional import get_current_active_user_optional
from ..services.builder import (
    assemble_document,
    export_document,
    generate_document,
    get_findings,
    paper_analysis,
    quality_dashboard,
)
from ..services.store import LocalRunStore
from ..services.builder_analysis import build_paper_text, normalize_findings
from ..services.analysis_report_exporter import export_analysis_report
from modules.base import ModuleResult
from pipeline.orchestrator import default_modules

router = APIRouter(tags=["research-paper-builder"])
analysis_store = LocalRunStore(settings.STORAGE_DIR)
ExportFormat = Literal["pdf", "docx", "latex", "markdown"]
logger = logging.getLogger(__name__)
ANALYSIS_MODULES = ("related_work", "novelty", "weaknesses", "clarity", "reviewer_feedback")


class BuilderActionCreate(BaseModel):
    finding_id: str


class BuilderActionStatus(BaseModel):
    status: Literal["not_started", "in_progress", "reviewed", "resolved"]


def _analysis_response(run: AnalysisRun, db: Session) -> dict:
    data = run.analysis_results or {}
    modules = data.get("modules", {})
    paper_text = data.get("paper_text", "")
    section_spans = data.get("section_spans", {})
    findings = normalize_findings(data.get("results", {}), paper_text, section_spans)
    previous = db.query(AnalysisRun).filter(
        AnalysisRun.paper_id == run.paper_id,
        AnalysisRun.id < run.id,
    ).order_by(AnalysisRun.id.desc()).first()
    delta = {"new": [], "remaining": [], "resolved": [], "changed": []}
    if previous:
        previous_data = previous.analysis_results or {}
        previous_findings = normalize_findings(
            previous_data.get("results", {}),
            previous_data.get("paper_text", ""),
            previous_data.get("section_spans", {}),
        )
        old_by_id = {item["id"]: item for item in previous_findings}
        new_by_id = {item["id"]: item for item in findings}
        comparable_modules = {
            module for module, state in modules.items()
            if state.get("status") == "completed"
        }
        comparable_new = {
            key: item for key, item in new_by_id.items()
            if item["module"] in comparable_modules
        }
        comparable_old = {
            key: item for key, item in old_by_id.items()
            if item["module"] in comparable_modules
        }
        delta["new"] = [item for key, item in comparable_new.items() if key not in comparable_old]
        delta["resolved"] = [item for key, item in comparable_old.items() if key not in comparable_new]
        for key in comparable_new.keys() & comparable_old.keys():
            before, after = old_by_id[key], new_by_id[key]
            changed_fields = (
                "description", "detailed_explanation", "why_detected", "confidence",
                "affected_section", "evidence_text", "recommended_action",
            )
            if any(before.get(field) != after.get(field) for field in changed_fields):
                delta["changed"].append({"before": before, "after": after})
            else:
                delta["remaining"].append(after)
    counts = {}
    for finding in findings:
        counts[finding["module"]] = counts.get(finding["module"], 0) + 1
    evidence_count = sum(bool(item.get("evidence")) for item in findings)
    return {
        "analysis_run_id": run.id,
        "paper_id": run.paper_id,
        "version": int(run.version_id) if (run.version_id or "").isdigit() else None,
        "analysis_date": run.run_date.isoformat() if run.run_date else None,
        "analysis_status": run.pipeline_status,
        "modules": modules,
        "results": data.get("results", {}),
        "paper_text": paper_text,
        "section_spans": section_spans,
        "findings": findings,
        "finding_count": len(findings),
        "findings_requiring_investigation": sum(item["status"] == "requires_investigation" for item in findings),
        "evidence_count": evidence_count,
        "findings_by_module": counts,
        "delta": delta,
        "notice": "Findings are automated indicators and require researcher verification; no novelty, correctness, or publication outcome is guaranteed.",
    }


def _run_builder_analysis(run_id: int, selected_modules: tuple[str, ...] = ANALYSIS_MODULES) -> None:
    """Run existing analysis modules and persist each module's actual status and output."""
    db = SessionLocal()
    try:
        run = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
        if run is None:
            logger.error("Builder analysis run %s disappeared before processing", run_id)
            return
        data = dict(run.analysis_results or {})
        paper_text = data.get("paper_text", "")
        modules = default_modules()
        previous_results: dict[str, ModuleResult] = {}

        for name, result_data in data.get("results", {}).items():
            if name in ANALYSIS_MODULES and isinstance(result_data, dict):
                previous_results[name] = ModuleResult.model_validate(result_data)

        for name in ANALYSIS_MODULES:
            if name not in selected_modules:
                continue
            data["modules"][name] = {"status": "running", "error": None}
            run.analysis_results = data
            db.commit()
            try:
                if name == "reviewer_feedback":
                    result = modules[name].predict({"text": paper_text}, previous_results)
                else:
                    result = modules[name].predict({"text": paper_text})
                result_data = result.model_dump()
                data.setdefault("results", {})[name] = result_data
                previous_results[name] = result
                state = "failed" if result.status == "failed" else "completed"
                data["modules"][name] = {
                    "status": state,
                    "error": "; ".join(result.limitations) if state == "failed" else None,
                    "capability_status": result.status,
                }
                if state == "failed":
                    logger.error("Builder analysis module %s failed for run %s: %s", name, run_id, result.limitations)
            except Exception as exc:
                logger.exception("Builder analysis module %s failed for run %s", name, run_id)
                data["modules"][name] = {"status": "failed", "error": str(exc)}
                data.setdefault("errors", {})[name] = str(exc)

            run.analysis_results = data
            run.completed_modules = [
                module for module, state in data["modules"].items()
                if state.get("status") == "completed"
            ]
            run.failed_modules = [
                {"module": module, "error": state.get("error") or "Module failed"}
                for module, state in data["modules"].items() if state.get("status") == "failed"
            ]
            run.findings_count = {
                module: len(result.get("findings", []))
                for module, result in data.get("results", {}).items()
            }
            run.model_versions = {
                module: result["model"]
                for module, result in data.get("results", {}).items()
                if isinstance(result, dict) and result.get("model")
            }
            db.commit()

        states = [data["modules"].get(name, {}).get("status") for name in ANALYSIS_MODULES]
        if any(state == "running" for state in states):
            run.pipeline_status = "running"
        elif any(state == "failed" for state in states):
            run.pipeline_status = "partial" if any(state == "completed" for state in states) else "failed"
        else:
            run.pipeline_status = "completed"
        run.duration_seconds = max(
            0,
            int((datetime.now(timezone.utc).replace(tzinfo=None) - run.run_date.replace(tzinfo=None)).total_seconds()),
        )
        run.analysis_results = data
        db.commit()
    except Exception:
        logger.exception("Could not persist builder analysis run %s", run_id)
        db.rollback()
        failed = db.query(AnalysisRun).filter(AnalysisRun.id == run_id).first()
        if failed:
            failed.pipeline_status = "failed"
            failed.notes = "Analysis worker failed. Check backend logs for details."
            db.commit()
    finally:
        db.close()


def _draft_response(draft: BuilderDraft, db: Session | None = None) -> dict:
    document = draft.content
    supplied = document.get("input", {})
    details = {
        key: supplied.get(key, "")
        for key in (
            "title", "institution", "abstract", "introduction", "related_work",
            "problem_statement", "objectives", "methodology", "dataset", "technologies",
            "experiments_results", "discussion", "limitations", "future_work", "conclusion",
            "references", "citations", "course", "instructor", "submission_date",
        )
    }
    for source_key in ("references", "citations"):
        if isinstance(details[source_key], list):
            details[source_key] = "\n".join(details[source_key])
    details["authors"] = ", ".join(document.get("authors", []))
    details["keywords"] = ", ".join(document.get("keywords", []))
    source_paper_id = supplied.get("paper_id")
    persisted_run = None
    if db is not None:
        persisted_run = db.query(AnalysisRun).filter(
            AnalysisRun.paper_id == draft.draft_id
        ).order_by(AnalysisRun.id.desc()).first()
    run = (
        paper_analysis(source_paper_id or draft.draft_id, analysis_store)
        if persisted_run is None and not document.get("is_generated")
        else None
    )
    persisted_analysis = _analysis_response(persisted_run, db) if persisted_run is not None and db is not None else None
    findings = (
        persisted_analysis["findings"] if persisted_analysis
        else get_findings(run) if run else []
    )
    return {
        "draft_id": draft.draft_id,
        "id": draft.draft_id,
        "paper_id": draft.draft_id,
        "analysis_paper_id": source_paper_id,
        "title": draft.title,
        "format": draft.document_format,
        "version": draft.version_number,
        "version_id": f"{draft.draft_id}:v{draft.version_number}",
        "status": "draft",
        "is_generated": bool(document.get("is_generated", False)),
        "created_at": draft.created_at.isoformat() if draft.created_at else None,
        "updated_at": draft.updated_at.isoformat() if draft.updated_at else None,
        "document": document,
        "details": details,
        "generated_content": document.get("generated_content", {}),
        "generated_sections": document.get("generated_content", {}),
        "content": document.get("generated_content", {}),
        "sections": document.get("generated_content", {}),
        "analysis_results": persisted_analysis or ({
            "paper_id": run.paper_id,
            "results": run.results,
            "states": {key: (value.value if hasattr(value, "value") else value)
                       for key, value in run.states.items()},
            "findings": findings,
            "finding_count": len(findings),
            "quality_dashboard": quality_dashboard(run),
        } if run else None),
        "finding_count": len(findings),
        "analysis_status": (
            persisted_run.pipeline_status.title() if persisted_run
            else "Complete" if run else "Not analyzed"
        ),
        "export_status": draft.export_status or {},
        "assumptions": document.get("assumptions", []),
    }


def _record_version(db: Session, draft: BuilderDraft) -> None:
    db.add(BuilderDraftVersion(
        draft_id=draft.draft_id,
        version_number=draft.version_number,
        title=draft.title,
        document_format=draft.document_format,
        content=draft.content,
    ))


def _find_draft(db: Session, draft_id: str, current_user: User | None = None) -> BuilderDraft:
    draft = db.query(BuilderDraft).filter(BuilderDraft.draft_id == draft_id).first()
    if draft is None:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.user_id != (current_user.id if current_user else None):
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@router.post("/drafts", status_code=201)
@router.post("", status_code=201)
def create_draft(
    payload: DraftInput,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    supplied = payload.model_dump()
    document = assemble_document(supplied)
    draft = BuilderDraft(
        draft_id=uuid4().hex,
        user_id=current_user.id if current_user else None,
        paper_id=supplied.get("paper_id"),
        title=supplied["title"],
        document_format=supplied["format"],
        content={"input": supplied, **document, "is_generated": False},
        version_number=1,
    )
    db.add(draft)
    db.flush()
    _record_version(db, draft)
    db.commit()
    db.refresh(draft)
    return _draft_response(draft, db)


@router.get("/drafts/{draft_id}")
@router.get("/{draft_id}")
def get_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    return _draft_response(_find_draft(db, draft_id, current_user), db)


@router.put("/drafts/{draft_id}")
@router.put("/{draft_id}")
def update_draft(
    draft_id: str,
    payload: DraftUpdate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    draft = _find_draft(db, draft_id, current_user)
    previous = draft.content.get("input", {})
    supplied = {**previous, **payload.model_dump(exclude_unset=True)}
    if supplied.get("format") is None:
        supplied["format"] = draft.document_format
    assembled = assemble_document(supplied)
    draft.paper_id = supplied.get("paper_id")
    draft.title = supplied.get("title", "")
    draft.document_format = supplied["format"]
    draft.content = {
        "input": supplied,
        **assembled,
        "is_generated": bool(draft.content.get("is_generated", False)),
        "assumptions": draft.content.get("assumptions", []),
    }
    draft.version_number += 1
    _record_version(db, draft)
    db.commit()
    db.refresh(draft)
    return _draft_response(draft, db)


@router.get("/drafts/{draft_id}/versions")
@router.get("/{draft_id}/versions")
def list_versions(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    draft = _find_draft(db, draft_id, current_user)
    versions = (
        db.query(BuilderDraftVersion)
        .filter(BuilderDraftVersion.draft_id == draft_id)
        .order_by(BuilderDraftVersion.version_number.asc())
        .all()
    )
    return {
        "draft_id": draft_id,
        "current_version": draft.version_number,
        "versions": [
            {
                "id": f"{draft_id}:v{version.version_number}",
                "paper_id": draft_id,
                "version": version.version_number,
                "title": version.title,
                "format": version.document_format,
                "status": "saved",
                "created_at": version.created_at.isoformat() if version.created_at else None,
                "updated_at": version.created_at.isoformat() if version.created_at else None,
                "document": version.content,
                "content": version.content.get("generated_content", {}),
                "sections": version.content.get("generated_content", {}),
            }
            for version in versions
        ],
    }


@router.get("/drafts/{draft_id}/versions/{version_number}")
@router.get("/{draft_id}/versions/{version_number}")
def get_version(
    draft_id: str,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)
    version = db.query(BuilderDraftVersion).filter(
        BuilderDraftVersion.draft_id == draft_id,
        BuilderDraftVersion.version_number == version_number,
    ).first()
    if version is None:
        raise HTTPException(status_code=404, detail="Draft version not found")
    return {
        "id": f"{draft_id}:v{version.version_number}",
        "paper_id": draft_id,
        "draft_id": draft_id,
        "version": version.version_number,
        "title": version.title,
        "format": version.document_format,
        "status": "saved",
        "created_at": version.created_at.isoformat() if version.created_at else None,
        "updated_at": version.created_at.isoformat() if version.created_at else None,
        "document": version.content,
        "content": version.content.get("generated_content", {}),
        "sections": version.content.get("generated_content", {}),
    }


@router.get("/drafts/{draft_id}/export")
@router.get("/{draft_id}/export")
def export_draft(
    draft_id: str,
    format: ExportFormat = Query(...),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    draft = _find_draft(db, draft_id, current_user)
    data, content_type = export_document(draft.content, format)
    suffix = "tex" if format == "latex" else format
    return Response(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="research-draft-{draft.draft_id}.{suffix}"'},
    )


@router.get("/papers/{paper_id}/findings")
def builder_findings(paper_id: str):
    run = paper_analysis(paper_id, analysis_store)
    if run is None:
        raise HTTPException(status_code=404, detail="No existing Enthesis analysis found for this paper")
    return {"paper_id": paper_id, "findings": get_findings(run)}


@router.get("/papers/{paper_id}/quality")
def builder_quality(paper_id: str):
    run = paper_analysis(paper_id, analysis_store)
    if run is None:
        raise HTTPException(status_code=404, detail="No existing Enthesis analysis found for this paper")
    return quality_dashboard(run)


@router.get("")
def list_drafts(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    drafts = (
        db.query(BuilderDraft)
        .filter(BuilderDraft.user_id == (current_user.id if current_user else None))
        .order_by(BuilderDraft.updated_at.desc())
        .all()
    )
    return {"papers": [_draft_response(draft, db) for draft in drafts]}


@router.post("/{draft_id}/generate")
def generate_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    draft = _find_draft(db, draft_id, current_user)
    supplied = draft.content.get("input", {})
    title_was_assumed = not str(supplied.get("title") or "").strip()
    if title_was_assumed:
        topic = (
            supplied.get("problem_statement")
            or supplied.get("abstract")
            or supplied.get("objectives")
            or "the supplied project topic"
        )
        topic = str(topic).strip().splitlines()[0].rstrip(".")
        supplied = {**supplied, "title": f"Assumption-based study of {topic[:160]}"}
    assembled = generate_document({**supplied, "generated_content": {}})
    if title_was_assumed:
        assembled["assumptions"] = ["title", *assembled["assumptions"]]
    draft.title = supplied.get("title", "")
    draft.document_format = supplied.get("format", draft.document_format)
    draft.content = {"input": supplied, **assembled, "is_generated": True}
    draft.version_number += 1
    _record_version(db, draft)
    db.commit()
    db.refresh(draft)
    return _draft_response(draft, db)


@router.post("/{draft_id}/sections/{section_key}/regenerate")
def regenerate_section(
    draft_id: str,
    section_key: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    draft = _find_draft(db, draft_id, current_user)
    generated = draft.content.get("generated_content", {})
    section_content = generated.get(section_key)
    if section_content is None:
        raise HTTPException(status_code=404, detail="Section not found")
    return {
        "draft_id": draft_id,
        "section": section_key,
        "section_content": section_content,
        "notice": "No new claims or prose were created; this is the existing user-supplied text or explicit missing-information marker.",
    }


@router.post("/{draft_id}/analyze")
def analyze_draft(
    draft_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    draft = _find_draft(db, draft_id, current_user)
    source_paper_id = draft.content.get("input", {}).get("paper_id")
    if source_paper_id and not draft.content.get("is_generated"):
        existing = paper_analysis(source_paper_id, analysis_store)
        if existing is not None:
            findings = get_findings(existing)
            return {
                "paper_id": draft_id,
                "analysis_status": "completed",
                "analysis_results": {
                    "paper_id": existing.paper_id,
                    "results": existing.results,
                    "states": {key: (value.value if hasattr(value, "value") else value)
                               for key, value in existing.states.items()},
                    "findings": findings,
                    "finding_count": len(findings),
                    "quality_dashboard": quality_dashboard(existing),
                },
            }
    if not draft.content.get("is_generated"):
        raise HTTPException(status_code=409, detail="Generate the paper before analyzing it.")

    active_run = db.query(AnalysisRun).filter(
        AnalysisRun.paper_id == draft_id,
        AnalysisRun.version_id == str(draft.version_number),
        AnalysisRun.pipeline_status == "running",
    ).order_by(AnalysisRun.id.desc()).first()
    if active_run is not None:
        return _analysis_response(active_run, db)

    paper_text, section_spans = build_paper_text(draft)
    initial_results = {
        "paper_text": paper_text,
        "section_spans": section_spans,
        "paper_title": draft.title,
        "generated_content": draft.content.get("generated_content", {}),
        "modules": {module: {"status": "pending", "error": None} for module in ANALYSIS_MODULES},
        "results": {},
        "errors": {},
    }
    new_run = AnalysisRun(
        paper_id=draft_id,
        version_id=str(draft.version_number),
        pipeline_status="running",
        model_versions={},
        dataset_versions=None,
        completed_modules=[],
        failed_modules=[],
        findings_count={},
        analysis_results=initial_results,
        report_generated="no",
        trigger="reanalysis" if db.query(AnalysisRun).filter(
            AnalysisRun.paper_id == draft_id
        ).count() else "manual",
        user_id=current_user.id if current_user else None,
        notes=None,
    )
    db.add(new_run)
    db.commit()
    db.refresh(new_run)
    worker = threading.Thread(target=_run_builder_analysis, args=(new_run.id,), daemon=True)
    worker.start()
    return _analysis_response(new_run, db)


@router.get("/{draft_id}/analysis/{run_id}")
def get_builder_analysis(
    draft_id: str,
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)
    run = db.query(AnalysisRun).filter(
        AnalysisRun.id == run_id,
        AnalysisRun.paper_id == draft_id,
    ).first()
    if run is None:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    return _analysis_response(run, db)


@router.post("/{draft_id}/analysis/{run_id}/retry/{module_name}")
def retry_builder_analysis_module(
    draft_id: str,
    run_id: int,
    module_name: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)
    if module_name not in ANALYSIS_MODULES:
        raise HTTPException(status_code=404, detail="Analysis module not found")
    run = db.query(AnalysisRun).filter(
        AnalysisRun.id == run_id,
        AnalysisRun.paper_id == draft_id,
    ).first()
    if run is None:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    data = dict(run.analysis_results or {})
    if data.get("modules", {}).get(module_name, {}).get("status") == "running":
        raise HTTPException(status_code=409, detail="This analysis module is already running.")
    data["modules"][module_name] = {"status": "pending", "error": None}
    data.get("results", {}).pop(module_name, None)
    data.get("errors", {}).pop(module_name, None)
    run.analysis_results = data
    run.pipeline_status = "running"
    db.commit()
    worker = threading.Thread(
        target=_run_builder_analysis,
        args=(run.id, (module_name,)),
        daemon=True,
    )
    worker.start()
    return _analysis_response(run, db)


@router.get("/{draft_id}/analysis/{run_id}/actions")
def list_builder_analysis_actions(
    draft_id: str,
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)
    run = db.query(AnalysisRun).filter(
        AnalysisRun.id == run_id,
        AnalysisRun.paper_id == draft_id,
    ).first()
    if run is None:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    actions = db.query(BuilderAction).filter(
        BuilderAction.draft_id == draft_id,
        BuilderAction.analysis_run_id == run_id,
        BuilderAction.user_id == (current_user.id if current_user else None),
    ).order_by(BuilderAction.created_at.asc()).all()
    return {"actions": [action.to_dict() for action in actions]}


@router.post("/{draft_id}/analysis/{run_id}/actions", status_code=201)
def create_builder_analysis_action(
    draft_id: str,
    run_id: int,
    payload: BuilderActionCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)
    run = db.query(AnalysisRun).filter(
        AnalysisRun.id == run_id,
        AnalysisRun.paper_id == draft_id,
    ).first()
    if run is None:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    findings = normalize_findings(
        (run.analysis_results or {}).get("results", {}),
        (run.analysis_results or {}).get("paper_text", ""),
        (run.analysis_results or {}).get("section_spans", {}),
    )
    finding = next((item for item in findings if item["id"] == payload.finding_id), None)
    if finding is None:
        raise HTTPException(status_code=404, detail="Finding not found in this analysis run")
    existing = db.query(BuilderAction).filter(
        BuilderAction.analysis_run_id == run_id,
        BuilderAction.finding_id == finding["id"],
        BuilderAction.user_id == (current_user.id if current_user else None),
    ).first()
    if existing is not None:
        return existing.to_dict()
    action = BuilderAction(
        action_id=uuid4().hex,
        draft_id=draft_id,
        user_id=current_user.id if current_user else None,
        analysis_run_id=run_id,
        finding_id=finding["id"],
        title=finding["title"],
        description=finding["recommended_action"] or finding["description"],
        evidence=finding.get("evidence_text"),
        priority="high" if finding["module"] in {"novelty", "weaknesses"} else "medium",
        status="not_started",
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return action.to_dict()


@router.patch("/{draft_id}/analysis/{run_id}/actions/{action_id}")
def update_builder_analysis_action(
    draft_id: str,
    run_id: int,
    action_id: str,
    payload: BuilderActionStatus,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)
    action = db.query(BuilderAction).filter(
        BuilderAction.action_id == action_id,
        BuilderAction.draft_id == draft_id,
        BuilderAction.analysis_run_id == run_id,
        BuilderAction.user_id == (current_user.id if current_user else None),
    ).first()
    if action is None:
        raise HTTPException(status_code=404, detail="Action not found")
    action.status = payload.status
    db.commit()
    db.refresh(action)
    return action.to_dict()


@router.get("/{draft_id}/analysis/{run_id}/report")
def generate_builder_analysis_report(
    draft_id: str,
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)
    run = db.query(AnalysisRun).filter(
        AnalysisRun.id == run_id,
        AnalysisRun.paper_id == draft_id,
    ).first()
    if run is None:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    response = _analysis_response(run, db)
    if response["analysis_status"] == "running":
        raise HTTPException(status_code=409, detail="Wait for the analysis to finish before generating its report.")
    return _build_analysis_report(draft_id, run, response)


def _build_analysis_report(draft_id: str, run: AnalysisRun, response: dict) -> dict:
    return {
        "paper_id": draft_id,
        "paper_title": (run.analysis_results or {}).get("paper_title"),
        "version": response["version"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "analysis_status": response["analysis_status"],
        "modules": response["modules"],
        "findings": response["findings"],
        "summary": {
            "findings_by_module": response["findings_by_module"],
            "total_findings": response["finding_count"],
            "requiring_investigation": response["findings_requiring_investigation"],
            "evidence_count": response["evidence_count"],
        },
        "limitations": [
            "Automated analysis findings require author review.",
            "Unavailable capabilities are identified in their module output.",
            "This report does not determine novelty, correctness, acceptance, or publication probability.",
        ],
    }


@router.get("/{draft_id}/analysis/{run_id}/report/export")
def export_builder_analysis_report(
    draft_id: str,
    run_id: int,
    format: Literal["pdf", "docx", "markdown", "json"] = Query(...),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)
    run = db.query(AnalysisRun).filter(
        AnalysisRun.id == run_id,
        AnalysisRun.paper_id == draft_id,
    ).first()
    if run is None:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    response = _analysis_response(run, db)
    if response["analysis_status"] == "running":
        raise HTTPException(status_code=409, detail="Wait for the analysis to finish before exporting its report.")
    report = _build_analysis_report(draft_id, run, response)
    try:
        content, media_type, extension = export_analysis_report(report, format)
    except ImportError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    safe_id = re.sub(r"[^A-Za-z0-9_-]", "-", draft_id)
    filename = f"analysis-report-{safe_id}-v{report['version'] or 'unknown'}.{extension}"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{draft_id}/versions")
def create_version(
    draft_id: str,
    payload: VersionCreate = VersionCreate(),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)
    if payload.content is None:
        return update_draft(draft_id, DraftUpdate(), db, current_user)
    return update_draft(draft_id, DraftUpdate(generated_content=payload.content), db, current_user)


@router.get("/{draft_id}/versions/{version_id}/compare")
def compare_versions(
    draft_id: str,
    version_id: str,
    other_version_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    _find_draft(db, draft_id, current_user)

    def parse_version(identifier: str) -> int:
        match = __import__("re").search(r":v(\d+)$", identifier)
        if match:
            return int(match.group(1))
        try:
            return int(identifier)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Invalid version identifier") from exc

    first_number, second_number = parse_version(version_id), parse_version(other_version_id)
    versions = db.query(BuilderDraftVersion).filter(
        BuilderDraftVersion.draft_id == draft_id,
        BuilderDraftVersion.version_number.in_([first_number, second_number]),
    ).all()
    by_number = {version.version_number: version for version in versions}
    if first_number not in by_number or second_number not in by_number:
        raise HTTPException(status_code=404, detail="Draft version not found")
    first, second = by_number[first_number], by_number[second_number]
    left, right = first.content.get("generated_content", {}), second.content.get("generated_content", {})
    changed = [
        key for key in dict.fromkeys([*left.keys(), *right.keys()])
        if left.get(key) != right.get(key)
    ]
    return {
        "id": draft_id,
        "paper_id": draft_id,
        "draft_id": draft_id,
        "version": second_number,
        "title": second.title,
        "format": second.document_format,
        "status": "saved",
        "created_at": second.created_at.isoformat() if second.created_at else None,
        "updated_at": second.created_at.isoformat() if second.created_at else None,
        "content": right,
        "sections": right,
        "analysis_results": None,
        "export_status": {},
        "finding_count": 0,
        "from_version": first_number,
        "to_version": second_number,
        "changed_sections": changed,
        "versions": [
            {"version": first_number, "generated_content": left},
            {"version": second_number, "generated_content": right},
        ],
        "notice": "Comparison lists literal content changes; it does not assess factual accuracy or quality.",
    }


@router.post("/{draft_id}/export/status")
def update_export_status(
    draft_id: str,
    payload: ExportStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    status = payload.status
    draft = _find_draft(db, draft_id, current_user)
    status_by_format = dict(draft.export_status or {})
    status_by_format[status] = True
    draft.export_status = status_by_format
    db.commit()
    db.refresh(draft)
    return _draft_response(draft, db)
