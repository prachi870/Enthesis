"""Export reports to various formats (PDF, DOCX, Markdown)"""
import json
from pathlib import Path
from typing import Dict, Any
from datetime import datetime
from io import BytesIO

# Try to import optional dependencies
try:
    import markdown
    MARKDOWN_AVAILABLE = True
except ImportError:
    MARKDOWN_AVAILABLE = False
    print("Warning: markdown not available. Markdown export will be basic.")

try:
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("Warning: python-docx not available. DOCX export will be disabled.")

# PDF generation using reportlab (cross-platform)
try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("Warning: reportlab not available. PDF export will be disabled.")


class ReportExporter:
    """Export research reports to multiple formats"""
    
    def export_to_markdown(self, report: Dict[str, Any], filepath: str) -> None:
        """Export report to Markdown format"""
        md_content = self._format_report_as_markdown(report)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)
    
    def export_to_pdf(self, report: Dict[str, Any], filepath: str) -> bool:
        """Export report to PDF format using reportlab"""
        if not PDF_AVAILABLE:
            raise ImportError("reportlab is required for PDF export. Install with: pip install reportlab")
        
        try:
            # Create PDF document
            doc = SimpleDocTemplate(
                filepath,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Container for PDF elements
            elements = []
            
            # Styles
            styles = getSampleStyleSheet()
            
            # Custom styles
            title_style = ParagraphStyle(
                'CustomTitle',
                parent=styles['Heading1'],
                fontSize=24,
                textColor=colors.HexColor('#1a1a1a'),
                spaceAfter=30,
                alignment=TA_CENTER
            )
            
            heading1_style = ParagraphStyle(
                'CustomHeading1',
                parent=styles['Heading1'],
                fontSize=18,
                textColor=colors.HexColor('#2d3748'),
                spaceBefore=20,
                spaceAfter=12,
                borderWidth=1,
                borderColor=colors.HexColor('#6366f1'),
                borderPadding=5
            )
            
            heading2_style = ParagraphStyle(
                'CustomHeading2',
                parent=styles['Heading2'],
                fontSize=14,
                textColor=colors.HexColor('#4a5568'),
                spaceBefore=15,
                spaceAfter=10
            )
            
            notice_style = ParagraphStyle(
                'Notice',
                parent=styles['Normal'],
                fontSize=11,
                textColor=colors.HexColor('#991b1b'),
                backColor=colors.HexColor('#fef2f2'),
                borderWidth=1,
                borderColor=colors.HexColor('#ef4444'),
                borderPadding=10,
                spaceBefore=10,
                spaceAfter=10
            )
            
            body_style = ParagraphStyle(
                'CustomBody',
                parent=styles['Normal'],
                fontSize=11,
                leading=16,
                alignment=TA_JUSTIFY
            )
            
            # Title
            elements.append(Paragraph("Research Feedback Report", title_style))
            elements.append(Spacer(1, 12))
            
            # Metadata
            elements.append(Paragraph(f"<b>Paper:</b> {report.get('paper_title', 'N/A')}", body_style))
            elements.append(Paragraph(f"<b>Generated:</b> {report.get('generated_at', datetime.now().isoformat())}", body_style))
            elements.append(Spacer(1, 20))
            
            # Important Notices
            if 'important_notices' in report:
                elements.append(Paragraph("⚠️ IMPORTANT NOTICES", heading1_style))
                notice_text = f"<b>{report['important_notices']['primary_disclaimer']}</b><br/><br/>"
                for notice in report['important_notices'].get('key_notices', []):
                    notice_text += f"• {notice}<br/>"
                elements.append(Paragraph(notice_text, notice_style))
                elements.append(Spacer(1, 20))
            
            # Executive Summary
            if 'executive_summary' in report:
                elements.append(Paragraph("Executive Summary", heading1_style))
                elements.append(Spacer(1, 10))
                
                overview = report['executive_summary'].get('overview', {})
                elements.append(Paragraph(overview.get('description', ''), body_style))
                elements.append(Spacer(1, 10))
                
                elements.append(Paragraph(f"Total Findings: {overview.get('total_findings', 0)}", body_style))
                elements.append(Spacer(1, 15))
                
                # Key Observations
                elements.append(Paragraph("Key Observations", heading2_style))
                for obs in report['executive_summary'].get('key_observations', []):
                    elements.append(Paragraph(f"• {obs}", body_style))
                elements.append(Spacer(1, 15))
                
                # Next Steps
                elements.append(Paragraph("Next Steps", heading2_style))
                for i, step in enumerate(report['executive_summary'].get('next_steps', []), 1):
                    elements.append(Paragraph(f"{i}. {step}", body_style))
                elements.append(Spacer(1, 20))
            
            # Add sections
            sections_to_add = [
                ('related_work', 'Related Work Analysis'),
                ('novelty_analysis', 'Novelty Analysis'),
                ('potential_weaknesses', 'Potential Weaknesses'),
                ('clarity_analysis', 'Clarity Analysis'),
                ('reviewer_feedback', 'Simulated Reviewer Feedback'),
            ]
            
            for section_key, section_title in sections_to_add:
                if section_key in report:
                    self._add_section_to_pdf(elements, report[section_key], section_title, heading1_style, heading2_style, body_style)
            
            # Action Items
            if 'action_items' in report:
                elements.append(PageBreak())
                elements.append(Paragraph("Action Items", heading1_style))
                elements.append(Paragraph(report['action_items'].get('researcher_note', ''), body_style))
                elements.append(Spacer(1, 15))
                
                for priority in ['high_priority', 'medium_priority', 'low_priority']:
                    priority_data = report['action_items']['prioritization'].get(priority, {})
                    items = priority_data.get('items', [])
                    
                    if items:
                        elements.append(Paragraph(priority.replace('_', ' ').title(), heading2_style))
                        for item in items:
                            elements.append(Paragraph(f"<b>{item.get('title', '')}:</b> {item.get('description', '')}", body_style))
                            elements.append(Spacer(1, 5))
                        elements.append(Spacer(1, 10))
            
            # Build PDF
            doc.build(elements)
            return True
            
        except Exception as e:
            print(f"Error exporting to PDF: {e}")
            raise
    
    def _add_section_to_pdf(self, elements, section_data, section_title, h1_style, h2_style, body_style):
        """Add a section to PDF"""
        elements.append(PageBreak())
        elements.append(Paragraph(section_title, h1_style))
        elements.append(Spacer(1, 10))
        
        if 'section_note' in section_data:
            note_para = Paragraph(f"<i>{section_data['section_note']}</i>", body_style)
            elements.append(note_para)
            elements.append(Spacer(1, 15))
        
        findings = section_data.get('findings', [])
        for idx, finding in enumerate(findings[:20], 1):  # Limit to 20 findings per section
            elements.append(Paragraph(f"Finding {idx}", h2_style))
            elements.append(Paragraph(finding.get('description', ''), body_style))
            elements.append(Spacer(1, 5))
            
            info_text = f"Type: {finding.get('type', 'N/A')}"
            if 'confidence' in finding:
                info_text += f" | Confidence: {finding['confidence']*100:.0f}%"
            elements.append(Paragraph(info_text, body_style))
            elements.append(Spacer(1, 10))
    
    def _format_report_as_html(self, report: Dict[str, Any]) -> str:
        """Format report as HTML (deprecated - using reportlab now)"""
        # Convert markdown to HTML
        md_content = self._format_report_as_markdown(report)
        if MARKDOWN_AVAILABLE:
            html_body = markdown.markdown(md_content, extensions=['extra', 'nl2br', 'sane_lists'])
        else:
            # Basic HTML conversion without markdown
            html_body = md_content.replace('\n', '<br/>')
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Enthesis Research Report</title>
</head>
<body>
    {html_body}
</body>
</html>
        """
        return html
    
    def export_to_docx(self, report: Dict[str, Any], filepath: str) -> bool:
        """Export report to DOCX format"""
        if not DOCX_AVAILABLE:
            raise ImportError("python-docx is required for DOCX export. Install with: pip install python-docx")
        
        try:
            doc = Document()
            
            # Set document margins
            sections = doc.sections
            for section in sections:
                section.top_margin = Inches(1)
                section.bottom_margin = Inches(1)
                section.left_margin = Inches(1)
                section.right_margin = Inches(1)
            
            # Title
            title = doc.add_heading('Research Feedback Report', level=0)
            title.alignment = WD_ALIGN_PARAGRAPH.CENTER
            
            # Metadata
            doc.add_paragraph(f"Paper: {report.get('paper_title', 'N/A')}")
            doc.add_paragraph(f"Generated: {report.get('generated_at', datetime.now().isoformat())}")
            doc.add_paragraph(f"Report ID: {report.get('report_id', 'N/A')}")
            doc.add_paragraph()
            
            # Important Notices
            if 'important_notices' in report:
                doc.add_heading('⚠️ IMPORTANT NOTICES', level=1)
                notice_para = doc.add_paragraph()
                notice_run = notice_para.add_run(report['important_notices']['primary_disclaimer'])
                notice_run.font.color.rgb = RGBColor(153, 27, 27)
                notice_run.bold = True
                
                for notice in report['important_notices'].get('key_notices', []):
                    p = doc.add_paragraph(notice, style='List Bullet')
                    p.runs[0].font.color.rgb = RGBColor(127, 29, 29)
                doc.add_paragraph()
            
            # Executive Summary
            if 'executive_summary' in report:
                doc.add_heading('Executive Summary', level=1)
                
                overview = report['executive_summary'].get('overview', {})
                doc.add_paragraph(overview.get('description', ''))
                doc.add_paragraph(f"Total Findings: {overview.get('total_findings', 0)}")
                doc.add_paragraph()
                
                # Key Observations
                doc.add_heading('Key Observations', level=2)
                for obs in report['executive_summary'].get('key_observations', []):
                    doc.add_paragraph(obs, style='List Bullet')
                doc.add_paragraph()
                
                # Next Steps
                doc.add_heading('Next Steps', level=2)
                for step in report['executive_summary'].get('next_steps', []):
                    doc.add_paragraph(step, style='List Number')
                doc.add_paragraph()
            
            # Add each section
            sections_to_add = [
                ('related_work', 'Related Work Analysis'),
                ('novelty_analysis', 'Novelty Analysis'),
                ('potential_weaknesses', 'Potential Weaknesses'),
                ('clarity_analysis', 'Clarity Analysis'),
                ('reviewer_feedback', 'Simulated Reviewer Feedback'),
            ]
            
            for section_key, section_title in sections_to_add:
                if section_key in report:
                    self._add_section_to_docx(doc, report[section_key], section_title)
            
            # Action Items
            if 'action_items' in report:
                doc.add_heading('Action Items', level=1)
                doc.add_paragraph(report['action_items'].get('researcher_note', ''))
                
                for priority in ['high_priority', 'medium_priority', 'low_priority']:
                    priority_data = report['action_items']['prioritization'].get(priority, {})
                    items = priority_data.get('items', [])
                    
                    if items:
                        doc.add_heading(priority.replace('_', ' ').title(), level=2)
                        for item in items:
                            doc.add_paragraph(f"{item.get('title', '')}: {item.get('description', '')}", style='List Bullet')
                doc.add_paragraph()
            
            # Limitations
            if 'limitations' in report:
                doc.add_heading('System Limitations', level=1)
                for limitation in report['limitations'].get('system_limitations', []):
                    doc.add_heading(limitation.get('limitation', ''), level=3)
                    doc.add_paragraph(limitation.get('description', ''))
                    doc.add_paragraph(f"Impact: {limitation.get('impact', '')}")
                    doc.add_paragraph()
            
            # Save document
            doc.save(filepath)
            return True
            
        except Exception as e:
            print(f"Error exporting to DOCX: {e}")
            raise
    
    def _add_section_to_docx(self, doc: Document, section_data: Dict, section_title: str):
        """Add a section with findings to DOCX"""
        doc.add_heading(section_title, level=1)
        
        # Add section note if available
        if 'section_note' in section_data:
            note_para = doc.add_paragraph(section_data['section_note'])
            note_para.runs[0].font.color.rgb = RGBColor(30, 64, 175)
            note_para.runs[0].italic = True
            doc.add_paragraph()
        
        # Add findings
        findings = section_data.get('findings', [])
        for idx, finding in enumerate(findings, 1):
            # Finding title/description
            finding_para = doc.add_paragraph()
            finding_run = finding_para.add_run(f"Finding {idx}: {finding.get('description', '')}")
            finding_run.bold = True
            
            # Type and confidence
            type_para = doc.add_paragraph()
            type_para.add_run(f"Type: {finding.get('type', 'N/A')}").font.size = Pt(10)
            if 'confidence' in finding:
                type_para.add_run(f" | Confidence: {finding['confidence']*100:.0f}%").font.size = Pt(10)
            
            # Evidence
            if 'evidence' in finding and finding['evidence']:
                doc.add_paragraph('Evidence:', style='Heading 3')
                evidence_text = str(finding['evidence'])
                if len(evidence_text) > 500:
                    evidence_text = evidence_text[:500] + "..."
                doc.add_paragraph(evidence_text)
            
            # System interpretation
            if 'system_interpretation' in finding:
                doc.add_paragraph('System Interpretation:', style='Heading 3')
                doc.add_paragraph(finding['system_interpretation'])
            
            # Recommended investigation
            if 'recommended_investigation' in finding:
                doc.add_paragraph('Recommended Investigation:', style='Heading 3')
                for action in finding['recommended_investigation']:
                    doc.add_paragraph(action, style='List Bullet')
            
            doc.add_paragraph()
    
    def _format_report_as_markdown(self, report: Dict[str, Any]) -> str:
        """Format report as Markdown"""
        lines = []
        
        # Header
        lines.append("# Research Feedback Report")
        lines.append("")
        lines.append(f"**Paper:** {report.get('paper_title', 'N/A')}")
        lines.append(f"**Generated:** {report.get('generated_at', datetime.now().isoformat())}")
        lines.append(f"**Report ID:** {report.get('report_id', 'N/A')}")
        lines.append("")
        lines.append("---")
        lines.append("")
        
        # Important Notices
        if 'important_notices' in report:
            lines.append("## ⚠️ IMPORTANT NOTICES")
            lines.append("")
            lines.append(f"**{report['important_notices']['primary_disclaimer']}**")
            lines.append("")
            for notice in report['important_notices'].get('key_notices', []):
                lines.append(f"- {notice}")
            lines.append("")
            lines.append("---")
            lines.append("")
        
        # Executive Summary
        if 'executive_summary' in report:
            lines.append("## Executive Summary")
            lines.append("")
            
            overview = report['executive_summary'].get('overview', {})
            lines.append(f"**Overview:** {overview.get('description', '')}")
            lines.append("")
            lines.append(f"- **Total Findings:** {overview.get('total_findings', 0)}")
            lines.append(f"- **Modules Analyzed:** {len(overview.get('findings_breakdown', {}))}")
            lines.append("")
            
            lines.append("### Key Observations")
            lines.append("")
            for obs in report['executive_summary'].get('key_observations', []):
                lines.append(f"- {obs}")
            lines.append("")
            
            lines.append("### Next Steps")
            lines.append("")
            for i, step in enumerate(report['executive_summary'].get('next_steps', []), 1):
                lines.append(f"{i}. {step}")
            lines.append("")
            lines.append("---")
            lines.append("")
        
        # Add sections
        sections = [
            ('related_work', 'Related Work Analysis'),
            ('novelty_analysis', 'Novelty Analysis'),
            ('potential_weaknesses', 'Potential Weaknesses'),
            ('clarity_analysis', 'Clarity Analysis'),
            ('reviewer_feedback', 'Simulated Reviewer Feedback'),
        ]
        
        for section_key, section_title in sections:
            if section_key in report:
                lines.extend(self._format_section_as_markdown(report[section_key], section_title))
        
        # Action Items
        if 'action_items' in report:
            lines.append("## Action Items")
            lines.append("")
            lines.append(report['action_items'].get('researcher_note', ''))
            lines.append("")
            
            for priority in ['high_priority', 'medium_priority', 'low_priority']:
                priority_data = report['action_items']['prioritization'].get(priority, {})
                items = priority_data.get('items', [])
                
                if items:
                    lines.append(f"### {priority.replace('_', ' ').title()}")
                    lines.append("")
                    for item in items:
                        lines.append(f"- **{item.get('title', '')}:** {item.get('description', '')}")
                    lines.append("")
        
        # Limitations
        if 'limitations' in report:
            lines.append("## System Limitations")
            lines.append("")
            for limitation in report['limitations'].get('system_limitations', []):
                lines.append(f"### {limitation.get('limitation', '')}")
                lines.append("")
                lines.append(limitation.get('description', ''))
                lines.append("")
                lines.append(f"**Impact:** {limitation.get('impact', '')}")
                lines.append("")
        
        return "\n".join(lines)
    
    def _format_section_as_markdown(self, section_data: Dict, section_title: str) -> list:
        """Format a section as Markdown"""
        lines = []
        lines.append(f"## {section_title}")
        lines.append("")
        
        if 'section_note' in section_data:
            lines.append(f"> {section_data['section_note']}")
            lines.append("")
        
        findings = section_data.get('findings', [])
        for idx, finding in enumerate(findings, 1):
            lines.append(f"### Finding {idx}")
            lines.append("")
            lines.append(f"**Description:** {finding.get('description', '')}")
            lines.append("")
            lines.append(f"- **Type:** {finding.get('type', 'N/A')}")
            if 'confidence' in finding:
                lines.append(f"- **Confidence:** {finding['confidence']*100:.0f}%")
            if 'relevant_section' in finding:
                lines.append(f"- **Section:** {finding['relevant_section']}")
            lines.append("")
            
            if 'evidence' in finding and finding['evidence']:
                lines.append("**Evidence:**")
                lines.append("```")
                lines.append(str(finding['evidence'])[:500])
                lines.append("```")
                lines.append("")
            
            if 'system_interpretation' in finding:
                lines.append(f"**System Interpretation:** {finding['system_interpretation']}")
                lines.append("")
            
            if 'recommended_investigation' in finding:
                lines.append("**Recommended Investigation:**")
                for action in finding['recommended_investigation']:
                    lines.append(f"- {action}")
                lines.append("")
        
        lines.append("---")
        lines.append("")
        return lines
    
    def _format_report_as_html(self, report: Dict[str, Any]) -> str:
        """Format report as HTML for PDF generation"""
        # Convert markdown to HTML
        md_content = self._format_report_as_markdown(report)
        html_body = markdown.markdown(md_content, extensions=['extra', 'nl2br', 'sane_lists'])
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Enthesis Research Report</title>
</head>
<body>
    {html_body}
</body>
</html>
        """
        return html


exporter = ReportExporter()
