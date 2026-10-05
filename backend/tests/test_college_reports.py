from io import BytesIO

from docx import Document
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pypdf import PdfReader
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session, sessionmaker

from backend.app.api.college_reports import router
from backend.app.database import Base, get_db
from backend.app.models.college_report import CollegeReport, CollegeReportTemplate
from backend.app.models.builder import BuilderDraft
from backend.app.services.college_report import _heading_candidates, extract_project_information


def make_client(tmp_path):
    engine = create_engine(f"sqlite:///{tmp_path / 'college-reports.sqlite'}")
    Base.metadata.create_all(bind=engine)
    factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)

    def db_dependency():
        db = factory()
        try:
            yield db
        finally:
            db.close()

    app = FastAPI()
    app.include_router(router, prefix="/api/v1/college-reports")
    app.dependency_overrides[get_db] = db_dependency
    return TestClient(app), engine


def test_template_headings_exclude_rubric_and_instruction_lines():
    headings = _heading_candidates(
        "COLLEGE PROJECT REPORT\n"
        "GENERAL INSTRUCTIONS\n"
        "CHAPTER I: Introduction\n"
        "12 Data Analysis & Interpretation, Tables, Graphs, Charts,\n"
        "13 Discussion and Results\n"
        "19 References / Bibliography\n"
        "Students securing a SGPA of 7.0 or above are eligible\n"
        "results clearly\n"
    )

    assert headings == [
        "CHAPTER I: Introduction",
        "Discussion and Results",
        "References / Bibliography",
    ]


def test_project_information_maps_recognized_guide_headings_to_template_sections():
    source = (
        "The big picture\n"
        "Enthesis helps students review research drafts.\n"
        "How it works\n"
        "The draft passes through five analysis checks.\n"
        "GOAL\n"
        "Build a baseline score for each module.\n"
        "WHAT WE DO\n"
        "Build and test each module.\n"
        "Tools we will use\n"
        "Python, PyTorch, and FastAPI.\n"
        "PHASE 4\n"
        "Launch after research is solid.\n"
    )

    extracted = extract_project_information(
        ["Abstract", "Objectives of the study", "Methodology", "Implementation", "Results"],
        source,
    )

    assert extracted == {
        "Abstract": "Enthesis helps students review research drafts.",
        "Methodology": "The draft passes through five analysis checks.",
        "Objectives of the study": "Build a baseline score for each module.",
        "Implementation": "Python, PyTorch, and FastAPI.",
    }


def test_template_project_generation_validation_and_exports_are_independent(tmp_path):
    client, engine = make_client(tmp_path)
    try:
        template_text = (
            "COLLEGE PROJECT REPORT\n"
            "CERTIFICATE\n"
            "DECLARATION\n"
            "ACKNOWLEDGEMENT\n"
            "ABSTRACT\n"
            "CHAPTER 1 INTRODUCTION\n"
            "CHAPTER 2 METHODOLOGY\n"
            "RESULTS\n"
            "CONCLUSION\n"
            "REFERENCES\n"
        )
        analyzed = client.post(
            "/api/v1/college-reports/templates/analyze",
            data={"name": "Engineering Semester 6", "semester": "Semester 6 · 2026"},
            files={"file": ("sample.txt", template_text.encode("utf-8"), "text/plain")},
        )
        assert analyzed.status_code == 201, analyzed.text
        template = analyzed.json()
        assert template["is_saved"] is False
        assert "CERTIFICATE" in template["structure"]["sections"]
        assert client.get("/api/v1/college-reports/templates").json()["templates"][0]["is_saved"] is False

        saved = client.post(f"/api/v1/college-reports/templates/{template['template_id']}/save")
        assert saved.status_code == 200
        assert saved.json()["is_saved"] is True
        assert len(client.get("/api/v1/college-reports/templates").json()["templates"]) == 1
        refreshed_template = client.post(
            f"/api/v1/college-reports/templates/{template['template_id']}/reanalyze"
        )
        assert refreshed_template.status_code == 200
        assert refreshed_template.json()["structure"]["sections"] == template["structure"]["sections"]

        created = client.post(
            "/api/v1/college-reports/reports",
            data={"template_id": template["template_id"], "project_title": "Waste Forecast Project"},
            files=[(
                "files",
                (
                    "project.txt",
                    b"PROJECT NOTES\nABSTRACT\nStudent-supplied project summary.\n"
                    b"CHAPTER 1 INTRODUCTION\nStudent-supplied introduction text.",
                    "text/plain",
                ),
            )],
        )
        assert created.status_code == 201, created.text
        report = created.json()
        assert report["status"] == "sources_extracted"
        assert report["extracted_text"].find("Student-supplied project summary") >= 0
        assert report["extracted_information"]["ABSTRACT"] == "Student-supplied project summary."
        assert report["extracted_information"]["CHAPTER 1 INTRODUCTION"] == (
            "Student-supplied introduction text."
        )
        with Session(engine) as db:
            db.query(CollegeReport).filter_by(report_id=report["report_id"]).update(
                {"extracted_information": {}}
            )
            db.commit()
        refreshed_report = client.get(
            f"/api/v1/college-reports/reports/{report['report_id']}"
        )
        assert refreshed_report.status_code == 200
        assert refreshed_report.json()["extracted_information"]["ABSTRACT"] == (
            "Student-supplied project summary."
        )
        report = refreshed_report.json()
        assert client.get("/api/v1/college-reports/reports").json()["reports"][0]["report_id"] == report["report_id"]

        comparison = client.post(f"/api/v1/college-reports/reports/{report['report_id']}/compare")
        assert comparison.status_code == 200
        assert comparison.json()["missing_count"] == len(template["structure"]["sections"]) - 2
        assert comparison.json()["sections"][4]["provided_by"] == "project documents"

        first_draft = client.post(f"/api/v1/college-reports/reports/{report['report_id']}/generate")
        assert first_draft.status_code == 200
        assert first_draft.json()["generated_content"]["ABSTRACT"] == "Student-supplied project summary."
        assert first_draft.json()["status"] == "needs_information"

        information = {section: f"Student-provided content for {section}." for section in template["structure"]["sections"]}
        updated = client.put(
            f"/api/v1/college-reports/reports/{report['report_id']}/information",
            json={"project_title": "Waste Forecast Project", "information": information},
        )
        assert updated.status_code == 200
        generated = client.post(f"/api/v1/college-reports/reports/{report['report_id']}/generate")
        assert generated.status_code == 200, generated.text
        assert generated.json()["status"] == "generated"
        assert generated.json()["generated_content"]["CERTIFICATE"] == (
            "Student-provided content for CERTIFICATE."
        )

        validated = client.post(f"/api/v1/college-reports/reports/{report['report_id']}/validate")
        assert validated.status_code == 200
        assert validated.json()["validation"]["valid"] is True
        assert validated.json()["validation"]["section_order_matches_template"] is True

        pdf = client.get(f"/api/v1/college-reports/reports/{report['report_id']}/export?format=pdf")
        assert pdf.status_code == 200, pdf.text
        assert pdf.headers["content-type"] == "application/pdf"
        assert len(PdfReader(BytesIO(pdf.content)).pages) >= 2

        docx = client.get(f"/api/v1/college-reports/reports/{report['report_id']}/export?format=docx")
        assert docx.status_code == 200, docx.text
        paragraphs = [paragraph.text for paragraph in Document(BytesIO(docx.content)).paragraphs]
        assert "Waste Forecast Project" in paragraphs[0]
        assert "CERTIFICATE" in paragraphs

        db_inspector = inspect(engine)
        assert db_inspector.has_table("college_reports")
        assert db_inspector.has_table("college_report_templates")
        with Session(engine) as db:
            assert db.query(CollegeReport).count() == 1
            assert db.query(CollegeReportTemplate).count() == 1
            assert db.query(BuilderDraft).count() == 0
    finally:
        client.close()
        engine.dispose()


def test_college_reports_reject_unsaved_template_and_unsupported_export(tmp_path):
    client, engine = make_client(tmp_path)
    try:
        analyzed = client.post(
            "/api/v1/college-reports/templates/analyze",
            files={"file": ("sample.md", b"# Abstract\n# Conclusion\n", "text/markdown")},
        )
        assert analyzed.status_code == 201, analyzed.text
        rejected = client.post(
            "/api/v1/college-reports/reports",
            data={"template_id": analyzed.json()["template_id"], "project_title": "Test"},
            files=[("files", ("project.txt", b"Project notes.", "text/plain"))],
        )
        assert rejected.status_code == 409
        assert rejected.json()["detail"].startswith("Save the analyzed college template")

        invalid_template = client.post(
            "/api/v1/college-reports/templates/analyze",
            files={"file": ("empty.txt", b"ordinary content without a heading", "text/plain")},
        )
        assert invalid_template.status_code == 422
    finally:
        client.close()
        engine.dispose()
