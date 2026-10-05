"""Service to record analysis runs for history tracking"""
from datetime import datetime
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from ..models.analysis_run import AnalysisRun


class AnalysisRecorder:
    """Record analysis runs for reproducibility and history"""
    
    @staticmethod
    def record_run(
        db: Session,
        paper_id: str,
        analysis_results: Dict,
        pipeline_status: str,
        version_id: Optional[int] = None,
        user_id: Optional[int] = None,
        duration_seconds: Optional[int] = None,
        trigger: str = "manual",
        notes: Optional[str] = None
    ) -> AnalysisRun:
        """
        Record a completed analysis run.
        
        Args:
            db: Database session
            paper_id: Paper identifier
            analysis_results: Complete analysis output
            pipeline_status: completed, failed, partial
            version_id: Paper version ID if applicable
            user_id: User who triggered the analysis
            duration_seconds: How long the analysis took
            trigger: manual, auto, scheduled, reanalysis
            notes: Optional notes about this run
            
        Returns:
            Created AnalysisRun record
        """
        
        # Extract model versions from results
        model_versions = {}
        for module_name, module_data in analysis_results.items():
            if isinstance(module_data, dict):
                model = module_data.get("model", "unknown")
                model_versions[module_name] = model
        
        # Extract dataset versions (if available)
        dataset_versions = {}
        for module_name, module_data in analysis_results.items():
            if isinstance(module_data, dict) and "dataset" in module_data:
                dataset_versions[module_name] = module_data["dataset"]
        
        # Determine completed modules
        completed_modules = []
        failed_modules = []
        
        for module_name, module_data in analysis_results.items():
            if isinstance(module_data, dict):
                status = module_data.get("status", "unknown")
                if status in ["completed", "approved", "done"]:
                    completed_modules.append(module_name)
                elif status == "failed":
                    error = module_data.get("error", "Unknown error")
                    failed_modules.append({
                        "module": module_name,
                        "error": error
                    })
        
        # Count findings by module
        findings_count = {}
        for module_name, module_data in analysis_results.items():
            if isinstance(module_data, dict) and "findings" in module_data:
                findings = module_data["findings"]
                if isinstance(findings, list):
                    findings_count[module_name] = len(findings)
                else:
                    findings_count[module_name] = 0
        
        # Determine report status
        report_generated = "no"
        report_path = None
        if "report" in analysis_results:
            report_generated = "yes"
            report_path = analysis_results.get("report_path")
        
        # Create analysis run record
        new_run = AnalysisRun(
            paper_id=paper_id,
            version_id=version_id,
            run_date=datetime.utcnow(),
            pipeline_status=pipeline_status,
            model_versions=model_versions,
            dataset_versions=dataset_versions if dataset_versions else None,
            completed_modules=completed_modules,
            failed_modules=failed_modules if failed_modules else None,
            findings_count=findings_count,
            analysis_results=analysis_results,
            report_generated=report_generated,
            report_path=report_path,
            duration_seconds=duration_seconds,
            trigger=trigger,
            user_id=user_id,
            notes=notes
        )
        
        db.add(new_run)
        db.commit()
        db.refresh(new_run)
        
        return new_run
    
    @staticmethod
    def get_model_info() -> Dict[str, str]:
        """
        Get current model versions being used.
        
        Returns:
            Dictionary of module names to model identifiers
        """
        return {
            "related_work": "OpenReview_baseline_v1.0",
            "novelty": "NLI_baseline_v1.0",
            "weaknesses": "OpenReview_classifier_baseline_v1.0",
            "clarity": "Readability_baseline_v1.0",
            "reviewer_feedback": "ReviewerStyle_baseline_v1.0"
        }
    
    @staticmethod
    def get_dataset_info() -> Dict[str, str]:
        """
        Get current dataset versions being used.
        
        Returns:
            Dictionary of module names to dataset identifiers
        """
        return {
            "related_work": "S2ORC_citations_v1",
            "novelty": "NLI_training_v1",
            "weaknesses": "OpenReview_papers_v1",
            "clarity": "Academic_corpus_v1",
            "reviewer_feedback": "OpenReview_reviews_v1"
        }
