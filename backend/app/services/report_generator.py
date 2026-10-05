"""
Enthesis Research Feedback Report Generator

Generates comprehensive, structured reports that distinguish between:
- Model predictions
- Retrieved evidence
- System-generated interpretation
- Researcher action requirements
"""
from datetime import datetime
from typing import Dict, List, Any, Optional
import json


class ReportGenerator:
    """Generate comprehensive research feedback reports"""
    
    def __init__(self):
        self.report_version = "1.0"
        self.system_name = "Enthesis"
    
    def generate_report(
        self,
        paper_id: str,
        paper_title: str,
        analysis_results: Dict[str, Any],
        paper_text: str = "",
        metadata: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate complete research feedback report.
        
        Args:
            paper_id: Paper identifier
            paper_title: Paper title
            analysis_results: Complete analysis from all modules
            paper_text: Full paper text (optional)
            metadata: Additional metadata (author, date, etc.)
            
        Returns:
            Complete structured report
        """
        metadata = metadata or {}
        
        report = {
            "report_id": f"report_{paper_id}_{int(datetime.utcnow().timestamp())}",
            "generated_at": datetime.utcnow().isoformat(),
            "system_version": self.report_version,
            "paper_id": paper_id,
            "paper_title": paper_title,
            "metadata": metadata,
            
            # Main sections
            "executive_summary": self._generate_executive_summary(analysis_results),
            "research_health_overview": self._generate_health_overview(analysis_results),
            "related_work": self._generate_related_work_section(analysis_results),
            "novelty_analysis": self._generate_novelty_section(analysis_results),
            "potential_weaknesses": self._generate_weaknesses_section(analysis_results),
            "clarity_analysis": self._generate_clarity_section(analysis_results),
            "reviewer_feedback": self._generate_reviewer_section(analysis_results),
            "evidence": self._generate_evidence_section(analysis_results),
            "action_items": self._generate_action_items(analysis_results),
            "limitations": self._generate_limitations_section(analysis_results),
            
            # Disclaimers
            "important_notices": self._generate_disclaimers(),
            
            # Summary stats
            "statistics": self._generate_statistics(analysis_results)
        }
        
        return report
    
    def _generate_executive_summary(self, results: Dict) -> Dict:
        """Generate executive summary with high-level overview"""
        
        # Count findings
        total_findings = 0
        findings_by_type = {}
        
        for module_name, module_data in results.items():
            if isinstance(module_data, dict) and 'findings' in module_data:
                findings = module_data['findings']
                if isinstance(findings, list):
                    count = len(findings)
                    total_findings += count
                    findings_by_type[module_name] = count
        
        # Determine overall status (descriptive, not judgmental)
        status_description = self._determine_status_description(findings_by_type)
        
        return {
            "section_type": "executive_summary",
            "generated_by": "System aggregation",
            "overview": {
                "description": "This report presents findings from automated analysis of your research paper.",
                "total_findings": total_findings,
                "findings_breakdown": findings_by_type,
                "analysis_date": datetime.utcnow().isoformat()
            },
            "key_observations": status_description,
            "next_steps": [
                "Review each section carefully in context of your research goals",
                "Verify all findings against the actual paper content",
                "Prioritize action items based on your revision timeline",
                "Consider findings as suggestions, not requirements"
            ],
            "disclaimer": "This summary aggregates automated analysis results. All findings require researcher verification and should be interpreted in the context of your specific research goals."
        }
    
    def _determine_status_description(self, findings_by_type: Dict) -> List[str]:
        """Generate descriptive status observations (not judgments)"""
        observations = []
        
        if findings_by_type.get('weaknesses', 0) > 0:
            count = findings_by_type['weaknesses']
            observations.append(
                f"Analysis detected {count} potential methodology or evaluation concern(s). "
                "These patterns suggest areas that may benefit from additional detail or clarification."
            )
        
        if findings_by_type.get('clarity', 0) > 0:
            count = findings_by_type['clarity']
            observations.append(
                f"Writing analysis identified {count} clarity indicator(s). "
                "These may relate to presentation, structure, or readability."
            )
        
        if findings_by_type.get('novelty', 0) > 0:
            count = findings_by_type['novelty']
            observations.append(
                f"Novelty analysis generated {count} observation(s) about originality indicators. "
                "Review these in context of your contribution claims."
            )
        
        if findings_by_type.get('reviewer_feedback', 0) > 0:
            count = findings_by_type['reviewer_feedback']
            observations.append(
                f"Simulated reviewer analysis produced {count} comment(s). "
                "These are AI-generated and should be treated as possible perspectives, not actual reviews."
            )
        
        if not observations:
            observations.append(
                "Analysis completed with minimal detected patterns. "
                "This may indicate strong initial draft quality, or patterns outside the detection scope."
            )
        
        return observations
    
    def _generate_health_overview(self, results: Dict) -> Dict:
        """Generate research health overview (indicators, not scores)"""
        
        indicators = {
            "methodology_indicators": self._extract_methodology_indicators(results),
            "novelty_indicators": self._extract_novelty_indicators(results),
            "clarity_indicators": self._extract_clarity_indicators(results),
            "evidence_indicators": self._extract_evidence_indicators(results),
            "completeness_indicators": self._extract_completeness_indicators(results)
        }
        
        return {
            "section_type": "research_health_overview",
            "generated_by": "Aggregated from module analyses",
            "indicators": indicators,
            "interpretation_guide": {
                "note": "These indicators show patterns detected by automated analysis. "
                        "They do not predict acceptance/rejection or indicate paper quality. "
                        "Use them to identify areas that may warrant attention.",
                "green_indicators": "Patterns associated with common best practices detected",
                "yellow_indicators": "Mixed patterns or areas that may benefit from review",
                "red_indicators": "Patterns that commonly benefit from attention or clarification"
            },
            "important_note": "NO OVERALL SCORE provided. Each indicator should be evaluated independently in your research context."
        }
    
    def _extract_methodology_indicators(self, results: Dict) -> Dict:
        """Extract methodology indicators from weaknesses module"""
        weaknesses = results.get('weaknesses', {})
        findings = weaknesses.get('findings', [])
        
        indicators = {
            "baseline_comparison": "not_detected",
            "evaluation_scope": "not_detected",
            "ablation_study": "not_detected",
            "statistical_significance": "not_detected"
        }
        
        for finding in findings:
            if isinstance(finding, dict):
                category = finding.get('category', '')
                if 'baseline' in category:
                    indicators['baseline_comparison'] = 'detected_concern'
                if 'evaluation' in category:
                    indicators['evaluation_scope'] = 'detected_concern'
                if 'ablation' in category:
                    indicators['ablation_study'] = 'detected_concern'
        
        return {
            "indicators": indicators,
            "interpretation": "Shows whether common methodology patterns were detected or flagged"
        }
    
    def _extract_novelty_indicators(self, results: Dict) -> Dict:
        """Extract novelty indicators"""
        novelty = results.get('novelty', {})
        findings = novelty.get('findings', [])
        
        novelty_score = 0.5
        for finding in findings:
            if isinstance(finding, dict) and 'novelty_score' in finding:
                novelty_score = finding['novelty_score']
                break
        
        return {
            "novelty_signal_strength": novelty_score,
            "interpretation": f"Analysis detected novelty indicators at {novelty_score:.2f} level. "
                            "This reflects detected patterns, not actual originality. "
                            "Your actual novelty depends on your contribution and prior work.",
            "note": "Score based on text patterns, not semantic understanding of contribution"
        }
    
    def _extract_clarity_indicators(self, results: Dict) -> Dict:
        """Extract clarity indicators"""
        clarity = results.get('clarity', {})
        findings = clarity.get('findings', [])
        
        return {
            "issues_detected": len(findings),
            "categories": list(set(f.get('category', 'unknown') for f in findings if isinstance(f, dict))),
            "interpretation": f"Detected {len(findings)} clarity pattern(s). Review these for potential improvements."
        }
    
    def _extract_evidence_indicators(self, results: Dict) -> Dict:
        """Extract evidence and citation indicators"""
        related_work = results.get('related_work', {})
        findings = related_work.get('findings', [])
        
        return {
            "related_papers_found": len(findings),
            "interpretation": f"Found {len(findings)} potentially related paper(s). "
                            "Verify relevance and ensure appropriate citation."
        }
    
    def _extract_completeness_indicators(self, results: Dict) -> Dict:
        """Extract completeness indicators"""
        all_findings = []
        for module_data in results.values():
            if isinstance(module_data, dict) and 'findings' in module_data:
                all_findings.extend(module_data['findings'])
        
        return {
            "total_patterns_detected": len(all_findings),
            "interpretation": "Total automated findings across all modules. "
                            "Higher counts don't mean lower quality - they may indicate thorough analysis."
        }
    
    def _generate_related_work_section(self, results: Dict) -> Dict:
        """Generate related work section with clear labeling"""
        related_work = results.get('related_work', {})
        findings = related_work.get('findings', [])
        
        formatted_findings = []
        for idx, finding in enumerate(findings):
            if not isinstance(finding, dict):
                continue
            
            formatted_finding = {
                "finding_id": f"relwork_{idx+1}",
                "type": "model_prediction",
                "description": finding.get('description', finding.get('summary', 'Related work detected')),
                "evidence": {
                    "type": "retrieved_evidence",
                    "paper_title": finding.get('title', 'Unknown'),
                    "similarity_score": finding.get('similarity', 0.0),
                    "source": finding.get('source', 'Citation database')
                },
                "confidence": finding.get('confidence', 0.5),
                "relevant_section": finding.get('section', 'Related Work / Introduction'),
                "system_interpretation": self._interpret_related_work(finding),
                "researcher_action": {
                    "required": True,
                    "actions": [
                        "Verify whether this work is actually related to your research",
                        "Check if you've already cited this work appropriately",
                        "Assess whether this work should be discussed in your paper",
                        "Read the paper to understand the connection"
                    ]
                }
            }
            formatted_findings.append(formatted_finding)
        
        return {
            "section_type": "related_work",
            "generated_by": "Related Work Module - Similarity-based retrieval",
            "model_used": related_work.get('model', 'Unknown'),
            "findings": formatted_findings,
            "section_note": "These are papers retrieved based on similarity. "
                          "The system cannot determine if they are truly related to your research. "
                          "You must verify relevance and citation status."
        }
    
    def _interpret_related_work(self, finding: Dict) -> str:
        """Generate interpretation for related work finding"""
        similarity = finding.get('similarity', 0.0)
        
        if similarity > 0.8:
            return "High textual similarity detected. This paper may share significant topical overlap with your work."
        elif similarity > 0.6:
            return "Moderate textual similarity detected. This paper may be relevant to your research area."
        elif similarity > 0.4:
            return "Some textual similarity detected. Relevance should be verified."
        else:
            return "Low similarity detected. May be tangentially related or a false match."
    
    def _generate_novelty_section(self, results: Dict) -> Dict:
        """Generate novelty analysis section"""
        novelty = results.get('novelty', {})
        findings = novelty.get('findings', [])
        
        formatted_findings = []
        for idx, finding in enumerate(findings):
            if not isinstance(finding, dict):
                continue
            
            formatted_finding = {
                "finding_id": f"novelty_{idx+1}",
                "type": "model_prediction",
                "description": finding.get('description', finding.get('summary', 'Novelty analysis')),
                "evidence": {
                    "type": "text_analysis",
                    "novelty_score": finding.get('novelty_score', 0.5),
                    "classification": finding.get('classification', 'Unknown'),
                    "supporting_text": finding.get('evidence', '')[:200]
                },
                "confidence": finding.get('confidence', 0.5),
                "relevant_section": finding.get('section', 'Introduction / Contributions'),
                "system_interpretation": self._interpret_novelty(finding),
                "researcher_action": {
                    "required": True,
                    "actions": [
                        "Assess whether the system correctly identified your contribution",
                        "Verify your claims are appropriately scoped",
                        "Ensure novelty is clearly articulated in the paper",
                        "Compare with recent work in your area"
                    ]
                }
            }
            formatted_findings.append(formatted_finding)
        
        return {
            "section_type": "novelty_analysis",
            "generated_by": "Novelty Module - Pattern-based classification",
            "model_used": novelty.get('model', 'Unknown'),
            "findings": formatted_findings,
            "section_note": "Novelty scores are based on text patterns, not semantic understanding of your contribution. "
                          "Only you can determine if your work is truly novel."
        }
    
    def _interpret_novelty(self, finding: Dict) -> str:
        """Generate interpretation for novelty finding"""
        score = finding.get('novelty_score', 0.5)
        classification = finding.get('classification', '')
        
        interpretations = {
            'novel': "Text patterns suggest claims of originality. Verify these are accurate and well-supported.",
            'incremental': "Text patterns suggest incremental contribution. Ensure this framing is intentional.",
            'established': "Text patterns suggest established concepts. Consider clarifying your novel contributions.",
            'derivative': "Text patterns suggest building on prior work. Ensure proper attribution and novel aspects are clear."
        }
        
        return interpretations.get(classification.lower(), 
            f"Novelty score: {score:.2f}. Review your contribution claims for clarity and accuracy.")
    
    def _generate_weaknesses_section(self, results: Dict) -> Dict:
        """Generate potential weaknesses section"""
        weaknesses = results.get('weaknesses', {})
        findings = weaknesses.get('findings', [])
        
        formatted_findings = []
        for idx, finding in enumerate(findings):
            if not isinstance(finding, dict):
                continue
            
            formatted_finding = {
                "finding_id": f"weakness_{idx+1}",
                "type": "model_prediction",
                "description": finding.get('text', finding.get('description', 'Potential concern detected')),
                "evidence": {
                    "type": "pattern_detection",
                    "category": finding.get('category', 'unknown'),
                    "severity": finding.get('severity', 'medium'),
                    "detection_basis": "Text pattern matching"
                },
                "confidence": finding.get('confidence', 0.5),
                "relevant_section": self._map_weakness_to_section(finding),
                "system_interpretation": self._interpret_weakness(finding),
                "recommended_investigation": self._recommend_weakness_action(finding),
                "researcher_action": {
                    "required": False,
                    "priority": finding.get('severity', 'medium'),
                    "actions": [
                        "Evaluate whether this pattern represents an actual weakness",
                        "If valid, consider how to address it",
                        "If not valid, this may be a false positive",
                        "Reviewers may notice similar patterns"
                    ]
                }
            }
            formatted_findings.append(formatted_finding)
        
        return {
            "section_type": "potential_weaknesses",
            "generated_by": "Weaknesses Module - Pattern-based detection",
            "model_used": weaknesses.get('model', 'Unknown'),
            "findings": formatted_findings,
            "section_note": "These are POTENTIAL weaknesses detected by pattern matching. "
                          "They are not definitive flaws. You must assess whether each applies to your paper."
        }
    
    def _map_weakness_to_section(self, finding: Dict) -> str:
        """Map weakness category to likely paper section"""
        category = finding.get('category', '').lower()
        
        mapping = {
            'missing_baseline': 'Experiments / Evaluation',
            'weak_evaluation': 'Experiments / Evaluation / Results',
            'unclear_method': 'Methodology / Approach',
            'missing_ablation': 'Experiments / Ablation Studies',
            'limited_novelty': 'Introduction / Contributions',
            'missing_limitations': 'Conclusion / Discussion'
        }
        
        return mapping.get(category, 'Various sections')
    
    def _interpret_weakness(self, finding: Dict) -> str:
        """Generate interpretation for weakness finding"""
        category = finding.get('category', '')
        severity = finding.get('severity', 'medium')
        
        base = finding.get('text', '')
        
        if severity == 'high':
            return f"{base} This pattern is commonly flagged by reviewers and may warrant attention."
        elif severity == 'low':
            return f"{base} This is a minor pattern that may not be a concern."
        else:
            return f"{base} Consider whether this applies to your specific case."
    
    def _recommend_weakness_action(self, finding: Dict) -> List[str]:
        """Recommend specific investigations for weakness"""
        category = finding.get('category', '').lower()
        
        recommendations = {
            'missing_baseline': [
                "Verify you have compared against appropriate baselines",
                "If baselines exist, ensure they are clearly described",
                "Consider if additional comparisons would strengthen claims"
            ],
            'weak_evaluation': [
                "Review the scope and rigor of your evaluation",
                "Consider if additional experiments would be valuable",
                "Ensure evaluation methodology is clearly explained"
            ],
            'unclear_method': [
                "Review method description for completeness and clarity",
                "Consider adding diagrams or additional detail",
                "Ensure reproducibility from description"
            ],
            'missing_ablation': [
                "Consider whether ablation studies would strengthen your work",
                "If ablations exist, ensure they are clearly presented",
                "Assess component contributions to overall results"
            ],
            'missing_limitations': [
                "Add explicit discussion of limitations",
                "Consider scope, assumptions, and edge cases",
                "Discuss situations where approach may not apply"
            ]
        }
        
        return recommendations.get(category, [
            "Assess whether this pattern is present in your paper",
            "If present, evaluate whether it needs addressing",
            "Consult with advisors if uncertain"
        ])
    
    def _generate_clarity_section(self, results: Dict) -> Dict:
        """Generate clarity analysis section"""
        clarity = results.get('clarity', {})
        findings = clarity.get('findings', [])
        
        formatted_findings = []
        for idx, finding in enumerate(findings):
            if not isinstance(finding, dict):
                continue
            
            formatted_finding = {
                "finding_id": f"clarity_{idx+1}",
                "type": "model_prediction",
                "description": finding.get('description', finding.get('text', 'Clarity concern detected')),
                "evidence": {
                    "type": "text_analysis",
                    "category": finding.get('category', 'unknown'),
                    "detected_pattern": finding.get('pattern', 'General clarity pattern')
                },
                "confidence": finding.get('confidence', 0.5),
                "relevant_section": finding.get('section', 'Throughout paper'),
                "system_interpretation": f"Analysis detected a pattern associated with {finding.get('category', 'clarity concerns')}.",
                "recommended_investigation": [
                    "Read the relevant section with fresh eyes",
                    "Consider getting feedback from a colleague",
                    "Assess whether rewording would improve clarity",
                    "Check if technical terms are properly defined"
                ],
                "researcher_action": {
                    "required": False,
                    "actions": [
                        "Review flagged section for clarity",
                        "Determine if improvement is needed",
                        "Consider reader background and expectations"
                    ]
                }
            }
            formatted_findings.append(formatted_finding)
        
        return {
            "section_type": "clarity_analysis",
            "generated_by": "Clarity Module - Readability analysis",
            "model_used": clarity.get('model', 'Unknown'),
            "findings": formatted_findings,
            "section_note": "Clarity analysis is based on readability metrics and patterns. "
                          "What is 'clear' depends on your audience and venue. "
                          "Use these as suggestions, not requirements."
        }
    
    def _generate_reviewer_section(self, results: Dict) -> Dict:
        """Generate reviewer-style feedback section"""
        reviewer = results.get('reviewer_feedback', {})
        findings = reviewer.get('findings', [])
        
        formatted_findings = []
        for idx, finding in enumerate(findings):
            if not isinstance(finding, dict):
                continue
            
            formatted_finding = {
                "finding_id": f"reviewer_{idx+1}",
                "type": "AI_GENERATED_SIMULATION",
                "description": finding.get('feedback', finding.get('comment', 'Simulated reviewer comment')),
                "evidence": {
                    "type": "AI_generated",
                    "category": finding.get('category', 'general'),
                    "style": finding.get('style', 'neutral'),
                    "basis": "Pattern-based generation, not actual review"
                },
                "confidence": finding.get('confidence', 0.3),
                "relevant_section": finding.get('section', 'Various'),
                "system_interpretation": "This is an AI-generated comment simulating possible reviewer perspective. "
                                       "It is NOT an actual peer review. Treat it as one possible viewpoint.",
                "researcher_action": {
                    "required": False,
                    "actions": [
                        "Consider if this perspective has merit",
                        "Assess whether similar concerns might arise in actual review",
                        "Do NOT treat this as definitive feedback",
                        "Get actual human peer review when possible"
                    ]
                }
            }
            formatted_findings.append(formatted_finding)
        
        return {
            "section_type": "reviewer_feedback",
            "generated_by": "Reviewer Feedback Module - AI simulation",
            "model_used": reviewer.get('model', 'Unknown'),
            "findings": formatted_findings,
            "IMPORTANT_WARNING": "⚠️ THESE ARE AI-GENERATED SIMULATIONS, NOT ACTUAL PEER REVIEWS. "
                               "They represent possible perspectives based on patterns, not expert assessment. "
                               "DO NOT rely on these as substitute for real peer review."
        }
    
    def _generate_evidence_section(self, results: Dict) -> Dict:
        """Compile all evidence from findings"""
        all_evidence = []
        
        for module_name, module_data in results.items():
            if not isinstance(module_data, dict):
                continue
            
            findings = module_data.get('findings', [])
            for idx, finding in enumerate(findings):
                if not isinstance(finding, dict):
                    continue
                
                evidence_entry = {
                    "evidence_id": f"{module_name}_{idx+1}",
                    "source_module": module_name,
                    "finding_description": finding.get('description', finding.get('text', 'N/A'))[:200],
                    "evidence_type": self._classify_evidence_type(finding, module_name),
                    "evidence_content": self._extract_evidence_content(finding),
                    "source_location": finding.get('source', finding.get('section', 'Unknown')),
                    "confidence": finding.get('confidence', 0.5),
                    "retrieved_from": finding.get('database', finding.get('source', 'Internal analysis'))
                }
                all_evidence.append(evidence_entry)
        
        return {
            "section_type": "evidence",
            "total_evidence_items": len(all_evidence),
            "evidence_items": all_evidence,
            "note": "This section compiles evidence referenced in findings. "
                   "Evidence may be: retrieved from databases, extracted from paper text, "
                   "or generated by models. Check 'evidence_type' field for classification."
        }
    
    def _classify_evidence_type(self, finding: Dict, module: str) -> str:
        """Classify type of evidence"""
        if module == 'related_work':
            return "retrieved_from_database"
        elif module == 'reviewer_feedback':
            return "AI_generated"
        elif 'evidence' in finding:
            return "extracted_from_paper"
        else:
            return "pattern_detection"
    
    def _extract_evidence_content(self, finding: Dict) -> str:
        """Extract evidence content from finding"""
        if 'evidence' in finding:
            return str(finding['evidence'])[:500]
        elif 'text' in finding:
            return str(finding['text'])[:500]
        elif 'description' in finding:
            return str(finding['description'])[:500]
        else:
            return "No explicit evidence provided"
    
    def _generate_action_items(self, results: Dict) -> Dict:
        """Generate consolidated action items"""
        
        # Get action items from action center if available
        action_center_results = results.get('action_center', {})
        actions = action_center_results.get('actions', [])
        
        if not actions:
            # Generate from findings if action center didn't run
            actions = self._generate_actions_from_findings(results)
        
        # Categorize actions
        high_priority = [a for a in actions if a.get('priority') == 'high']
        medium_priority = [a for a in actions if a.get('priority') == 'medium']
        low_priority = [a for a in actions if a.get('priority') == 'low']
        
        return {
            "section_type": "action_items",
            "generated_by": "Action Center Module or aggregated from findings",
            "total_actions": len(actions),
            "prioritization": {
                "high_priority": {
                    "count": len(high_priority),
                    "items": high_priority
                },
                "medium_priority": {
                    "count": len(medium_priority),
                    "items": medium_priority
                },
                "low_priority": {
                    "count": len(low_priority),
                    "items": low_priority
                }
            },
            "researcher_note": "These actions are system-generated suggestions based on detected patterns. "
                             "Prioritize based on your revision timeline, venue requirements, and advisor feedback. "
                             "Not all actions may be necessary or appropriate for your paper."
        }
    
    def _generate_actions_from_findings(self, results: Dict) -> List[Dict]:
        """Generate actions from findings if action center didn't run"""
        actions = []
        action_id = 1
        
        for module_name, module_data in results.items():
            if not isinstance(module_data, dict):
                continue
            
            findings = module_data.get('findings', [])
            for finding in findings[:5]:  # Limit to prevent overwhelming
                if not isinstance(finding, dict):
                    continue
                
                action = {
                    "action_id": f"action_{action_id}",
                    "title": finding.get('text', finding.get('description', 'Review finding'))[:100],
                    "description": f"Review and address finding from {module_name} module",
                    "priority": finding.get('severity', 'medium'),
                    "module": module_name,
                    "status": "to_do"
                }
                actions.append(action)
                action_id += 1
        
        return actions
    
    def _generate_limitations_section(self, results: Dict) -> Dict:
        """Generate limitations section about the analysis itself"""
        
        return {
            "section_type": "limitations",
            "system_limitations": [
                {
                    "limitation": "Pattern-based detection only",
                    "description": "The system detects text patterns, not semantic meaning. "
                                 "It cannot truly understand your research contribution or assess novelty.",
                    "impact": "May generate false positives (flagging non-issues) or false negatives (missing real issues)"
                },
                {
                    "limitation": "No domain expertise",
                    "description": "The system has no specialized knowledge of your research area. "
                                 "It cannot assess whether your methods are appropriate for your problem.",
                    "impact": "Domain-specific concerns may be missed entirely"
                },
                {
                    "limitation": "Limited context",
                    "description": "Analysis is based on paper text alone, without understanding your "
                                 "broader research context, prior work, or community norms.",
                    "impact": "May suggest changes that don't align with your field's conventions"
                },
                {
                    "limitation": "Not peer review",
                    "description": "This is automated analysis, not expert peer review. "
                                 "It cannot replace feedback from knowledgeable researchers.",
                    "impact": "Should be used as preliminary feedback only, not final assessment"
                },
                {
                    "limitation": "Model biases",
                    "description": "Models are trained on existing papers and may reflect biases "
                                 "in training data or evaluation criteria.",
                    "impact": "May favor certain writing styles or research approaches"
                },
                {
                    "limitation": "Confidence scores are estimates",
                    "description": "Confidence values indicate model uncertainty but are not probability of correctness.",
                    "impact": "High confidence doesn't mean definitely correct; low confidence doesn't mean definitely wrong"
                }
            ],
            "usage_guidelines": [
                "Use findings as starting points for investigation, not conclusions",
                "Verify all findings against actual paper content",
                "Consult with advisors and domain experts",
                "Get actual peer review before submission",
                "Consider venue-specific requirements and norms",
                "Trust your judgment over system suggestions when they conflict",
                "Be skeptical of AI-generated reviewer comments",
                "Focus on findings that resonate with your own concerns"
            ],
            "what_system_cannot_do": [
                "Assess actual novelty of your contribution",
                "Evaluate appropriateness of methods for your problem",
                "Judge paper quality or predict acceptance",
                "Replace peer review or advisor feedback",
                "Understand nuances of your research area",
                "Make decisions about what to change",
                "Guarantee improvement if suggestions followed"
            ]
        }
    
    def _generate_disclaimers(self) -> Dict:
        """Generate important disclaimers for the report"""
        
        return {
            "primary_disclaimer": "This report contains automated analysis results and should be used "
                                "for preliminary feedback only. All findings require verification and "
                                "interpretation by the researcher.",
            
            "key_notices": [
                "NOT PEER REVIEW: This is not peer review and does not replace expert feedback",
                "VERIFY EVERYTHING: All findings must be verified against actual paper content",
                "CONTEXT MATTERS: System lacks your domain expertise and research context",
                "AI GENERATED: Reviewer-style feedback is AI-generated simulation, not real reviews",
                "NO PREDICTIONS: System cannot predict acceptance/rejection or paper quality",
                "SUGGESTIONS ONLY: All recommendations are suggestions, not requirements"
            ],
            
            "interpretation_guidance": {
                "model_predictions": "Identified patterns in text based on trained models",
                "retrieved_evidence": "Information retrieved from databases or paper text",
                "system_interpretation": "Automated interpretation of detected patterns",
                "researcher_action": "Suggested actions for you to consider (not mandatory)"
            },
            
            "responsibility": "Researchers are responsible for all decisions about paper revisions. "
                            "The system provides information; you make the choices."
        }
    
    def _generate_statistics(self, results: Dict) -> Dict:
        """Generate summary statistics for the report"""
        
        total_findings = 0
        findings_by_module = {}
        high_confidence_count = 0
        
        for module_name, module_data in results.items():
            if not isinstance(module_data, dict):
                continue
            
            findings = module_data.get('findings', [])
            if isinstance(findings, list):
                count = len(findings)
                total_findings += count
                findings_by_module[module_name] = count
                
                # Count high confidence
                for f in findings:
                    if isinstance(f, dict) and f.get('confidence', 0) > 0.7:
                        high_confidence_count += 1
        
        return {
            "total_findings": total_findings,
            "findings_by_module": findings_by_module,
            "high_confidence_findings": high_confidence_count,
            "modules_analyzed": len([k for k in results.keys() if isinstance(results[k], dict)]),
            "report_completeness": "full" if total_findings > 0 else "minimal"
        }
    
    def format_as_markdown(self, report: Dict) -> str:
        """Format report as markdown for export"""
        
        md = f"""# Enthesis Research Feedback Report

**Report ID:** {report['report_id']}
**Generated:** {report['generated_at']}
**Paper:** {report['paper_title']}

---

## ⚠️ IMPORTANT NOTICES

{report['important_notices']['primary_disclaimer']}

### Key Points:
"""
        for notice in report['important_notices']['key_notices']:
            md += f"- **{notice}**\n"
        
        md += "\n---\n\n"
        
        # Executive Summary
        md += "## 1. Executive Summary\n\n"
        summary = report['executive_summary']
        md += f"**Total Findings:** {summary['overview']['total_findings']}\n\n"
        md += "**Key Observations:**\n"
        for obs in summary['key_observations']:
            md += f"- {obs}\n"
        md += "\n"
        
        # Continue with other sections...
        # (This would be very long, so showing structure)
        
        return md
    
    def export_to_json(self, report: Dict, filepath: str):
        """Export report as JSON"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
    
    def export_to_markdown(self, report: Dict, filepath: str):
        """Export report as markdown"""
        md_content = self.format_as_markdown(report)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(md_content)
