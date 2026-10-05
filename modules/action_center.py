"""
Research Action Center - Convert findings into actionable research tasks

Aggregates findings from all modules and creates prioritized action items.

Each action item includes:
- Title
- Description
- Source finding
- Evidence
- Priority (high/medium/low)
- Status (not_started/in_progress/reviewed/resolved)

Status changes:
- Only student can mark items as in_progress, reviewed, or resolved
- System never auto-resolves issues
- New analysis can create new items but won't change existing statuses
"""
from typing import List, Dict, Any
import hashlib
from datetime import datetime


class ActionCenter:
    """Convert analysis findings into actionable research tasks."""
    
    # Priority mappings based on severity and category
    PRIORITY_MAPPINGS = {
        # Severity-based
        'high': 'high',
        'major': 'high',
        'medium': 'medium',
        'moderate': 'medium',
        'low': 'low',
        'minor': 'low',
        
        # Category-based priorities
        'novelty': 'high',
        'missing_baseline': 'high',
        'weak_evaluation': 'medium',
        'unclear_method': 'medium',
        'poor_clarity': 'low',
        'reproducibility': 'low'
    }
    
    def __init__(self):
        pass
    
    def generate_actions(
        self,
        paper_id: str,
        analysis_results: Dict[str, Any],
        existing_actions: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate action items from analysis results.
        
        Args:
            paper_id: Paper identifier
            analysis_results: Results from all analysis modules
            existing_actions: Previously generated actions (to preserve status)
            
        Returns:
            Dictionary with action items organized by priority
        """
        actions = []
        
        # Extract actions from each module
        if 'related_work' in analysis_results:
            actions.extend(self._extract_related_work_actions(
                analysis_results['related_work']
            ))
        
        if 'novelty' in analysis_results:
            actions.extend(self._extract_novelty_actions(
                analysis_results['novelty']
            ))
        
        if 'weaknesses' in analysis_results:
            actions.extend(self._extract_weakness_actions(
                analysis_results['weaknesses']
            ))
        
        if 'clarity' in analysis_results:
            actions.extend(self._extract_clarity_actions(
                analysis_results['clarity']
            ))
        
        if 'reviewer_feedback' in analysis_results:
            actions.extend(self._extract_reviewer_actions(
                analysis_results['reviewer_feedback']
            ))
        
        # Add unique IDs and timestamps
        for action in actions:
            action['action_id'] = self._generate_action_id(action)
            action['created_at'] = datetime.now().isoformat()
            action['status'] = 'not_started'  # Default status
        
        # Preserve statuses from existing actions
        if existing_actions:
            actions = self._merge_with_existing(actions, existing_actions)
        
        # Organize by priority
        organized = self._organize_by_priority(actions)
        
        # Generate summary
        summary = self._generate_summary(actions)
        
        return {
            "paper_id": paper_id,
            "actions": actions,
            "by_priority": organized,
            "summary": summary,
            "generated_at": datetime.now().isoformat()
        }
    
    def _generate_action_id(self, action: Dict[str, Any]) -> str:
        """Generate unique ID for action based on content."""
        # Create hash from title + source
        content = f"{action['title']}:{action['source_module']}:{action.get('source_finding_type', '')}"
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    def _extract_related_work_actions(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract actions from related work module."""
        actions = []
        findings = results.get('findings', [])
        
        for finding in findings:
            if finding.get('type') == 'methods_extracted':
                count = finding.get('count', 0)
                if count < 3:
                    actions.append({
                        'title': 'Expand methods discussion',
                        'description': f'Only {count} methods identified. Consider discussing more relevant techniques and approaches used in the paper.',
                        'source_module': 'related_work',
                        'source_finding_type': 'methods_extracted',
                        'evidence': f"Methods found: {', '.join(finding.get('items', [])[:5])}",
                        'priority': 'medium',
                        'recommended_action': 'Add detailed discussion of key methods and algorithms used.'
                    })
            
            elif finding.get('type') == 'datasets_extracted':
                count = finding.get('count', 0)
                if count < 2:
                    actions.append({
                        'title': 'Add dataset information',
                        'description': f'Limited dataset mentions ({count} found). Ensure all datasets used are properly documented.',
                        'source_module': 'related_work',
                        'source_finding_type': 'datasets_extracted',
                        'evidence': f"Datasets found: {', '.join(finding.get('items', [])[:5]) if finding.get('items') else 'None'}",
                        'priority': 'medium',
                        'recommended_action': 'Document all datasets with statistics, source, and usage details.'
                    })
        
        # Check for related papers
        evidence = results.get('evidence', [])
        if len(evidence) < 3:
            actions.append({
                'title': 'Strengthen related work section',
                'description': f'Only {len(evidence)} related papers found. Expand literature review with recent and relevant publications.',
                'source_module': 'related_work',
                'source_finding_type': 'related_papers',
                'evidence': f"{len(evidence)} related papers identified in analysis",
                'priority': 'high',
                'recommended_action': 'Add 5-10 highly relevant papers from the last 2-3 years.'
            })
        
        return actions
    
    def _extract_novelty_actions(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract actions from novelty module."""
        actions = []
        findings = results.get('findings', [])
        
        for finding in findings:
            if finding.get('type') == 'novelty_analysis':
                novelty_score = finding.get('novelty_score', 1.0)
                
                if novelty_score < 0.5:
                    actions.append({
                        'title': 'Verify novelty claim against related research',
                        'description': f'Novelty score of {novelty_score:.2f} suggests potential overlap with existing work. Carefully compare your contributions with recent publications.',
                        'source_module': 'novelty',
                        'source_finding_type': 'novelty_analysis',
                        'evidence': finding.get('summary', ''),
                        'priority': 'high',
                        'recommended_action': 'Conduct thorough literature search and clearly articulate unique contributions.'
                    })
                
                contradicted = finding.get('entailment_contradicted', 0)
                if contradicted > 2:
                    actions.append({
                        'title': 'Address contradictions with existing work',
                        'description': f'{contradicted} potential contradictions detected. Review claims that may conflict with established findings.',
                        'source_module': 'novelty',
                        'source_finding_type': 'contradictions',
                        'evidence': f"{contradicted} contradiction indicators found",
                        'priority': 'high',
                        'recommended_action': 'Carefully review and either revise claims or explain differences.'
                    })
        
        # Check evidence items for novel claims
        evidence = results.get('evidence', [])
        for item in evidence[:3]:  # Top 3 claims
            if item.get('status') == 'novel':
                actions.append({
                    'title': 'Document novel contribution',
                    'description': f'Ensure this claim is well-supported: "{item.get("claim", "")[:100]}..."',
                    'source_module': 'novelty',
                    'source_finding_type': 'novel_claim',
                    'evidence': item.get('claim', ''),
                    'priority': 'medium',
                    'recommended_action': 'Provide experimental evidence or theoretical justification.'
                })
        
        return actions
    
    def _extract_weakness_actions(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract actions from weaknesses module."""
        actions = []
        findings = results.get('findings', [])
        
        for finding in findings:
            weakness_type = finding.get('type', '')
            severity = finding.get('severity', 'medium')
            
            # Map weakness types to actions
            action_templates = {
                'missing_baseline': {
                    'title': 'Add baseline comparisons',
                    'description': 'Experiments lack baseline comparisons. Add standard baselines to contextualize results.',
                    'priority': 'high'
                },
                'weak_evaluation': {
                    'title': 'Strengthen experimental evaluation',
                    'description': 'Evaluation could be more comprehensive. Consider multiple datasets, metrics, and ablation studies.',
                    'priority': 'medium'
                },
                'unclear_method': {
                    'title': 'Clarify methodology description',
                    'description': 'Method description needs more detail. Add implementation specifics for reproducibility.',
                    'priority': 'medium'
                },
                'limited_novelty': {
                    'title': 'Clarify unique contribution',
                    'description': 'Novel aspects need clearer articulation. Explicitly state what is new compared to prior work.',
                    'priority': 'high'
                },
                'insufficient_evidence': {
                    'title': 'Provide supporting evidence',
                    'description': 'Claims need more supporting evidence. Add experiments, citations, or theoretical analysis.',
                    'priority': 'high'
                },
                'poor_clarity': {
                    'title': 'Improve writing clarity',
                    'description': 'Writing could be clearer. Revise for better organization and readability.',
                    'priority': 'low'
                }
            }
            
            if weakness_type in action_templates:
                template = action_templates[weakness_type]
                actions.append({
                    'title': template['title'],
                    'description': f"{template['description']} {finding.get('description', '')}",
                    'source_module': 'weaknesses',
                    'source_finding_type': weakness_type,
                    'evidence': finding.get('evidence', ''),
                    'priority': self.PRIORITY_MAPPINGS.get(severity, template['priority']),
                    'recommended_action': finding.get('suggestion', 'Review and address this weakness.')
                })
        
        return actions
    
    def _extract_clarity_actions(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract actions from clarity module."""
        actions = []
        findings = results.get('findings', [])
        
        for finding in findings:
            if finding.get('type') == 'clarity_issues':
                issues = finding.get('issues', [])
                for issue in issues[:3]:  # Top 3 clarity issues
                    actions.append({
                        'title': f"Review {issue.get('category', 'writing')} clarity",
                        'description': issue.get('description', 'Improve writing in this area.'),
                        'source_module': 'clarity',
                        'source_finding_type': 'clarity_issue',
                        'evidence': issue.get('example', ''),
                        'priority': 'low',
                        'recommended_action': issue.get('suggestion', 'Revise for clarity.')
                    })
            
            elif finding.get('type') == 'readability_score':
                score = finding.get('score', 1.0)
                if score < 0.6:
                    actions.append({
                        'title': 'Improve overall readability',
                        'description': f'Readability score of {score:.2f} is below target. Simplify language and improve flow.',
                        'source_module': 'clarity',
                        'source_finding_type': 'readability',
                        'evidence': f"Readability: {score:.2f}",
                        'priority': 'low',
                        'recommended_action': 'Use shorter sentences, active voice, and clear transitions.'
                    })
        
        return actions
    
    def _extract_reviewer_actions(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract actions from reviewer feedback module."""
        actions = []
        evidence = results.get('evidence', [])
        
        for item in evidence:
            concern_type = item.get('concern_type', '')
            severity = item.get('severity', 'medium')
            
            # Skip if we already have similar action from other modules
            # Reviewer feedback is supplementary
            if concern_type not in ['insufficient_related_work', 'reproducibility']:
                continue
            
            if concern_type == 'insufficient_related_work':
                actions.append({
                    'title': 'Expand related work coverage',
                    'description': item.get('feedback', 'Related work section needs expansion.'),
                    'source_module': 'reviewer_feedback',
                    'source_finding_type': concern_type,
                    'evidence': item.get('evidence_basis', ''),
                    'priority': self.PRIORITY_MAPPINGS.get(severity, 'medium'),
                    'recommended_action': item.get('suggested_action', 'Add more related work.')
                })
            
            elif concern_type == 'reproducibility':
                actions.append({
                    'title': 'Improve reproducibility',
                    'description': item.get('feedback', 'Add details for reproducibility.'),
                    'source_module': 'reviewer_feedback',
                    'source_finding_type': concern_type,
                    'evidence': item.get('evidence_basis', ''),
                    'priority': 'low',
                    'recommended_action': item.get('suggested_action', 'Add code/data availability.')
                })
        
        return actions
    
    def _merge_with_existing(
        self,
        new_actions: List[Dict[str, Any]],
        existing_actions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Merge new actions with existing, preserving statuses."""
        existing_map = {a['action_id']: a for a in existing_actions}
        
        merged = []
        for action in new_actions:
            action_id = action['action_id']
            
            if action_id in existing_map:
                # Preserve status and any user updates
                existing = existing_map[action_id]
                action['status'] = existing.get('status', 'not_started')
                action['updated_at'] = existing.get('updated_at')
                action['notes'] = existing.get('notes', '')
            
            merged.append(action)
        
        return merged
    
    def _organize_by_priority(
        self,
        actions: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Organize actions by priority level."""
        organized = {
            'high': [],
            'medium': [],
            'low': []
        }
        
        for action in actions:
            priority = action.get('priority', 'medium')
            if priority in organized:
                organized[priority].append(action)
        
        # Sort each priority group by source module importance
        module_priority = {
            'novelty': 1,
            'weaknesses': 2,
            'related_work': 3,
            'reviewer_feedback': 4,
            'clarity': 5
        }
        
        for priority in organized:
            organized[priority].sort(
                key=lambda x: module_priority.get(x.get('source_module', ''), 99)
            )
        
        return organized
    
    def _generate_summary(self, actions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary statistics."""
        total = len(actions)
        
        by_priority = {
            'high': len([a for a in actions if a.get('priority') == 'high']),
            'medium': len([a for a in actions if a.get('priority') == 'medium']),
            'low': len([a for a in actions if a.get('priority') == 'low'])
        }
        
        by_status = {
            'not_started': len([a for a in actions if a.get('status') == 'not_started']),
            'in_progress': len([a for a in actions if a.get('status') == 'in_progress']),
            'reviewed': len([a for a in actions if a.get('status') == 'reviewed']),
            'resolved': len([a for a in actions if a.get('status') == 'resolved'])
        }
        
        by_module = {}
        for action in actions:
            module = action.get('source_module', 'unknown')
            by_module[module] = by_module.get(module, 0) + 1
        
        # Calculate completion percentage
        completion = 0
        if total > 0:
            completed = by_status.get('resolved', 0) + by_status.get('reviewed', 0)
            completion = (completed / total) * 100
        
        return {
            "total_actions": total,
            "by_priority": by_priority,
            "by_status": by_status,
            "by_module": by_module,
            "completion_percentage": round(completion, 1),
            "urgent_actions": by_priority.get('high', 0)
        }
    
    def update_action_status(
        self,
        action_id: str,
        new_status: str,
        notes: str = None
    ) -> Dict[str, Any]:
        """
        Update the status of an action item.
        
        Only valid statuses: not_started, in_progress, reviewed, resolved
        """
        valid_statuses = ['not_started', 'in_progress', 'reviewed', 'resolved']
        
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status. Must be one of: {', '.join(valid_statuses)}")
        
        update = {
            "action_id": action_id,
            "status": new_status,
            "updated_at": datetime.now().isoformat()
        }
        
        if notes:
            update["notes"] = notes
        
        return update
