"""Independent college report generation endpoints."""
import re
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.college_report import CollegeReport, CollegeReportTemplate
from ..models.user import User
from ..services.auth_optional import get_current_active_user_optional
from ..services.college_report import (
    build_report_content,
    compare_sections,
    export_college_report,
    extract_project_information,
    inspect_template,
    read_document,
    reanalyze_template_structure,
    validate_report,
)

router = APIRouter(tags=["college-report-generator"])


class ReportInformationUpdate(BaseModel):
    information: dict[str, str] = Field(default_factory=dict)
    project_title: str | None = None


def _owner_id(user: User | None):
    return user.id if user else None


def _get_template(db: Session, template_id: str, user: User | None) -> CollegeReportTemplate:
    template = db.query(CollegeReportTemplate).filter(
        CollegeReportTemplate.template_id == template_id,
        CollegeReportTemplate.user_id == _owner_id(user),
    ).first()
    if template is None:
        raise HTTPException(status_code=404, detail="College template not found")
    return template


def _get_report(db: Session, report_id: str, user: User | None) -> CollegeReport:
    report = db.query(CollegeReport).filter(
        CollegeReport.report_id == report_id,
        CollegeReport.user_id == _owner_id(user),
    ).first()
    if report is None:
        raise HTTPException(status_code=404, detail="College report not found")
    template = _get_template(db, report.template_id, user)
    extracted_information = extract_project_information(
        template.structure.get("sections", []),
        report.extracted_text,
    )
    if report.extracted_information != extracted_information:
        report.extracted_information = extracted_information
        db.commit()
        db.refresh(report)
    return report


def _template_response(template: CollegeReportTemplate) -> dict:
    return {
        "template_id": template.template_id,
        "name": template.name,
        "semester": template.semester,
        "source_filename": template.source_filename,
        "structure": template.structure,
        "is_saved": template.is_saved,
        "created_at": template.created_at.isoformat() if template.created_at else None,
    }


def _report_response(report: CollegeReport, template: CollegeReportTemplate) -> dict:
    return {
        "report_id": report.report_id,
        "template_id": report.template_id,
        "template_name": template.name,
        "semester": template.semester,
        "project_title": report.project_title,
        "source_filenames": report.source_filenames or [],
        "extracted_text": report.extracted_text,
        "extracted_information": report.extracted_information or {},
        "information": report.information or {},
        "generated_content": report.generated_content or {},
        "validation": report.validation,
        "status": report.status,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "updated_at": report.updated_at.isoformat() if report.updated_at else None,
    }


@router.get("/templates")
def list_templates(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    templates = db.query(CollegeReportTemplate).filter(
        CollegeReportTemplate.user_id == _owner_id(current_user),
    ).order_by(CollegeReportTemplate.created_at.desc()).all()
    return {"templates": [_template_response(item) for item in templates]}


@router.post("/templates/analyze", status_code=201)
async def analyze_template(
    file: UploadFile = File(...),
    name: str = Form(""),
    semester: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    filename = file.filename or ""
    try:
        content = await file.read()
        text, structure = inspect_template(filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    template = CollegeReportTemplate(
        template_id=uuid4().hex,
        user_id=_owner_id(current_user),
        name=name.strip() or filename.rsplit(".", 1)[0],
        semester=semester.strip() or None,
        source_filename=filename,
        source_text=text,
        structure=structure,
        is_saved=False,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return _template_response(template)


@router.post("/templates/{template_id}/save")
def save_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    template = _get_template(db, template_id, current_user)
    template.is_saved = True
    db.commit()
    db.refresh(template)
    return _template_response(template)


@router.post("/templates/{template_id}/reanalyze")
def reanalyze_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    template = _get_template(db, template_id, current_user)
    try:
        template.structure = reanalyze_template_structure(
            template.source_text, template.structure or {}
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    db.commit()
    db.refresh(template)
    return _template_response(template)


@router.post("/reports", status_code=201)
async def create_college_report(
    template_id: str = Form(...),
    project_title: str = Form(...),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    template = _get_template(db, template_id, current_user)
    if not template.is_saved:
        raise HTTPException(status_code=409, detail="Save the analyzed college template before creating a report.")
    if not project_title.strip():
        raise HTTPException(status_code=422, detail="Project title is required.")
    texts = []
    filenames = []
    for upload in files:
        filename = upload.filename or ""
        try:
            text = read_document(filename, await upload.read())
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=f"{filename}: {exc}") from exc
        texts.append(f"--- Source document: {filename} ---\n{text}")
        filenames.append(filename)
    if not texts:
        raise HTTPException(status_code=422, detail="Upload at least one project document.")
    extracted_text = "\n\n".join(texts)
    extracted_information = extract_project_information(
        template.structure.get("sections", []),
        extracted_text,
    )
    report = CollegeReport(
        report_id=uuid4().hex,
        user_id=_owner_id(current_user),
        template_id=template_id,
        project_title=project_title.strip(),
        source_filenames=filenames,
        extracted_text=extracted_text,
        extracted_information=extracted_information,
        information={},
        generated_content={},
        status="sources_extracted",
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return _report_response(report, template)


@router.get("/reports")
def list_college_reports(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    reports = db.query(CollegeReport).filter(
        CollegeReport.user_id == _owner_id(current_user),
    ).order_by(CollegeReport.updated_at.desc()).all()
    templates = {
        template.template_id: template
        for template in db.query(CollegeReportTemplate).filter(
            CollegeReportTemplate.user_id == _owner_id(current_user)
        ).all()
    }
    return {
        "reports": [
            _report_response(report, templates[report.template_id])
            for report in reports if report.template_id in templates
        ]
    }


@router.get("/reports/{report_id}")
def get_college_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    report = _get_report(db, report_id, current_user)
    template = _get_template(db, report.template_id, current_user)
    return _report_response(report, template)


@router.put("/reports/{report_id}/information")
def update_college_report_information(
    report_id: str,
    payload: ReportInformationUpdate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    report = _get_report(db, report_id, current_user)
    report.information = {
        key: value.strip() for key, value in payload.information.items()
        if isinstance(value, str) and value.strip()
    }
    if payload.project_title and payload.project_title.strip():
        report.project_title = payload.project_title.strip()
    report.status = "information_updated"
    report.validation = None
    db.commit()
    db.refresh(report)
    template = _get_template(db, report.template_id, current_user)
    return _report_response(report, template)


@router.post("/reports/{report_id}/compare")
def compare_college_report_sections(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    report = _get_report(db, report_id, current_user)
    template = _get_template(db, report.template_id, current_user)
    sections = template.structure.get("sections", [])
    comparison = compare_sections(
        sections,
        report.information or {},
        report.extracted_information or {},
    )
    return {
        "report_id": report_id,
        "sections": comparison,
        "provided_count": sum(item["status"] == "provided" for item in comparison),
        "missing_count": sum(item["status"] == "missing" for item in comparison),
    }


@router.post("/reports/{report_id}/generate")
def generate_college_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    report = _get_report(db, report_id, current_user)
    template = _get_template(db, report.template_id, current_user)
    sections = template.structure.get("sections", [])
    if not sections:
        raise HTTPException(status_code=422, detail="The selected template has no identified sections.")
    content, missing = build_report_content(
        sections, report.information or {}, report.extracted_information or {}
    )
    report.generated_content = content
    report.validation = validate_report(
        sections, content, template.structure.get("formatting", {})
    )
    report.status = "generated" if not missing else "needs_information"
    db.commit()
    db.refresh(report)
    return {
        **_report_response(report, template),
        "missing_sections": missing,
        "section_comparison": compare_sections(
            sections, report.information or {}, report.extracted_information or {},
        ),
    }


@router.post("/reports/{report_id}/validate")
def validate_college_report_endpoint(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    report = _get_report(db, report_id, current_user)
    template = _get_template(db, report.template_id, current_user)
    if not report.generated_content:
        raise HTTPException(status_code=409, detail="Generate the report before validating its format.")
    report.validation = validate_report(
        template.structure.get("sections", []),
        report.generated_content,
        template.structure.get("formatting", {}),
    )
    report.status = "validated" if report.validation["valid"] else "needs_information"
    db.commit()
    db.refresh(report)
    return _report_response(report, template)


@router.get("/reports/{report_id}/export")
def export_college_report_endpoint(
    report_id: str,
    format: str = Query(..., pattern="^(pdf|docx)$"),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_active_user_optional),
):
    report = _get_report(db, report_id, current_user)
    template = _get_template(db, report.template_id, current_user)
    if not report.generated_content:
        raise HTTPException(status_code=409, detail="Generate the college report before exporting it.")
    try:
        content, media_type, extension = export_college_report(
            _report_response(report, template),
            _template_response(template),
            format,
        )
    except ImportError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
    safe_title = re.sub(r"[^A-Za-z0-9_-]", "-", report.project_title).strip("-") or "college-report"
    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_title}.{extension}"'},
    )
