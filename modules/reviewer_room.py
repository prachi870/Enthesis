"""
Reviewer Room - Organize AI-generated reviewer-style feedback into categories

Clusters feedback into:
- Methodology
- Novelty
- Evaluation
- Clarity
- Experimental Design

For each pattern shows:
- Pattern name
- Description
- Detected concern
- Evidence from paper
- Related reviewer patterns
- Confidence
- Recommended investigation

IMPORTANT: All output clearly labeled as "AI-generated reviewer-style feedback"
Never represents as actual human review or invents reviewer identities.
"""
from typing import List, Dict, Any
import re


class ReviewerRoom:
    """Organize reviewer-style feedback into visual categories."""
    
    # Reviewer pattern categories
    CATEGORIES = {
        'methodology': {
            'name': 'Methodology',
            'description': 'Concerns about the proposed approach, methods, and techniques',
            'icon': 'code',
            'color': 'blue'
        },
        'novelty': {
            'name': 'Novelty',
            'description': 'Questions about originality and contribution to the field',
            'icon': 'target',
            'color': 'purple'
        },
        'evaluation': {
            'name': 'Evaluation',
            'description': 'Issues with experimental setup, metrics, and validation',
            'icon': 'chart',
            'color': 'green'
        },
        'clarity': {
            'name': 'Clarity',
            'description': 'Concerns about writing quality, organization, and presentation',
            'icon': 'file',
            'color': 'orange'
        },
        'experimental_design': {
            'name': 'Experimental Design',
            'description': 'Problems with experimental methodology and rigor',
            'icon': 'beaker',
            'color': 'red'
        }
    }
    
    # Map concern types to categories
    CONCERN_TO_CATEGORY = {
        'insufficient_related_work': 'methodology',
        'novelty_questioned': 'novelty',
        'experimental_design': 'experimental_design',
        'evaluation_rigor': 'evaluation',
        'writing_clarity': 'clarity',
        'baseline_comparison': 'experimental_design',
        'reproducibility': 'methodology',
        'unclear_method': 'methodology',
        'weak_evaluation': 'evaluation',
        'missing_baseline': 'experimental_design',
        'limited_novelty': 'novelty',
        'insufficient_evidence': 'evaluation',
        'poor_clarity': 'clarity'
    }
    
    # Reviewer style descriptions
    REVIEWER_STYLES = {
        'thorough': {
            'name': 'Thorough Reviewer',
            'characteristics': 'Comprehensive, detail-oriented, looks for completeness',
            'typical_concerns': 'Missing references, incomplete comparisons, insufficient detail'
        },
        'critical': {
            'name': 'Critical Reviewer',
            'characteristics': 'Skeptical, questions claims, demands strong evidence',
            'typical_concerns': 'Weak claims, lack of novelty, insufficient justification'
        },
        'methodical': {
            'name': 'Methodical Reviewer',
            'characteristics': 'Focuses on experimental rigor and scientific method',
            'typical_concerns': 'Missing baselines, weak evaluation, statistical issues'
        },
        'constructive': {
            'name': 'Constructive Reviewer',
            'characteristics': 'Helpful, suggests improvements, focuses on fixing issues',
            'typical_concerns': 'Writing quality, presentation, organization'
        },
        'practical': {
            'name': 'Practical Reviewer',
            'characteristics': 'Values real-world applicability and reproducibility',
            'typical_concerns': 'Code availability, practical limitations, deployment issues'
        }
    }
    
    def __init__(self):
        pass
    
    def organize_feedback(
        self,
        feedback_result: Dict[str, Any],
        paper_id: str = None
    ) -> Dict[str, Any]:
        """
        Organize reviewer feedback into visual categories.
        
        Args:
            feedback_result: Result from ReviewerFeedbackModule
            paper_id: Optional paper identifier
            
        Returns:
            Organized feedback by category with patterns
        """
        feedback_items = feedback_result.get('evidence', [])
        overall_assessment = None
        summary = None
        
        # Extract overall assessment from findings
        findings = feedback_result.get('findings', [])
        for finding in findings:
            if finding.get('type') == 'overall_assessment':
                overall_assessment = finding.get('assessment')
                summary = finding.get('summary')
        
        # Organize feedback by category
        categorized = self._categorize_feedback(feedback_items)
        
        # Create reviewer patterns for each category
        patterns_by_category = {}
        
        for category_key, items in categorized.items():
            patterns = self._create_patterns(items, category_key)
            if patterns:
                patterns_by_category[category_key] = patterns
        
        # Identify reviewer style clusters
        style_clusters = self._identify_style_clusters(feedback_items)
        
        # Generate summary statistics
        summary_stats = self._generate_summary(
            patterns_by_category,
            style_clusters,
            overall_assessment
        )
        
        return {
            "paper_id": paper_id,
            "ai_generated_notice": "⚠️ AI-GENERATED REVIEWER-STYLE FEEDBACK - Not actual human review",
            "disclaimer": "This feedback is generated by AI patterns and does not represent actual peer reviewers, their identities, or their opinions.",
            "overall_assessment": overall_assessment,
            "summary": summary,
            "categories": patterns_by_category,
            "style_clusters": style_clusters,
            "summary_stats": summary_stats
        }
    
    def _categorize_feedback(
        self,
        feedback_items: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Categorize feedback items."""
        categorized = {cat: [] for cat in self.CATEGORIES.keys()}
        
        for item in feedback_items:
            concern_type = item.get('concern_type', 'general')
            category = self.CONCERN_TO_CATEGORY.get(concern_type, 'methodology')
            categorized[category].append(item)
        
        return categorized
    
    def _create_patterns(
        self,
        items: List[Dict[str, Any]],
        category: str
    ) -> List[Dict[str, Any]]:
        """Create reviewer patterns from feedback items."""
        patterns = []
        
        for idx, item in enumerate(items):
            pattern = {
                "pattern_id": f"{category}_{idx + 1}",
                "pattern_name": self._get_pattern_name(item),
                "description": self._get_pattern_description(item),
                "detected_concern": item.get('feedback', ''),
                "evidence": item.get('evidence_basis', ''),
                "severity": item.get('severity', 'moderate'),
                "reviewer_style": item.get('reviewer_style', 'general'),
                "confidence": item.get('confidence', 0.5),
                "recommended_investigation": item.get('suggested_action', ''),
                "related_patterns": self._find_related_patterns(item, items),
                "category": category
            }
            patterns.append(pattern)
        
        return patterns
    
    def _get_pattern_name(self, item: Dict[str, Any]) -> str:
        """Generate pattern name from concern type."""
        concern_type = item.get('concern_type', 'general')
        
        names = {
            'insufficient_related_work': 'Limited Literature Coverage',
            'novelty_questioned': 'Novelty Claims Questioned',
            'experimental_design': 'Experimental Design Concern',
            'evaluation_rigor': 'Evaluation Rigor Issue',
            'writing_clarity': 'Clarity and Presentation',
            'baseline_comparison': 'Missing Baseline Comparison',
            'reproducibility': 'Reproducibility Concern',
            'unclear_method': 'Method Description Unclear',
            'weak_evaluation': 'Evaluation Scope Limited',
            'missing_baseline': 'Baseline Experiments Missing',
            'limited_novelty': 'Limited Novel Contribution',
            'insufficient_evidence': 'Claims Need More Support',
            'poor_clarity': 'Writing Needs Improvement'
        }
        
        return names.get(concern_type, concern_type.replace('_', ' ').title())
    
    def _get_pattern_description(self, item: Dict[str, Any]) -> str:
        """Generate pattern description."""
        severity = item.get('severity', 'moderate')
        style = item.get('reviewer_style', 'general')
        
        descriptions = {
            ('insufficient_related_work', 'thorough'): 
                'Comprehensive reviewer notes insufficient coverage of related literature',
            ('novelty_questioned', 'critical'):
                'Skeptical reviewer questions the originality of the contribution',
            ('experimental_design', 'methodical'):
                'Methodical reviewer identifies experimental design issues',
            ('evaluation_rigor', 'methodical'):
                'Detail-oriented reviewer finds evaluation lacking rigor',
            ('writing_clarity', 'constructive'):
                'Constructive reviewer suggests writing improvements',
            ('baseline_comparison', 'critical'):
                'Critical reviewer requires baseline comparisons',
            ('reproducibility', 'practical'):
                'Practical reviewer concerned about reproducibility'
        }
        
        key = (item.get('concern_type'), style)
        if key in descriptions:
            return descriptions[key]
        
        # Default description
        return f"AI-detected {severity} concern from {style}-style review pattern"
    
    def _find_related_patterns(
        self,
        item: Dict[str, Any],
        all_items: List[Dict[str, Any]]
    ) -> List[str]:
        """Find related reviewer patterns."""
        related = []
        item_type = item.get('concern_type')
        
        # Patterns that often co-occur
        relationships = {
            'missing_baseline': ['weak_evaluation', 'experimental_design'],
            'novelty_questioned': ['insufficient_related_work', 'limited_novelty'],
            'evaluation_rigor': ['missing_baseline', 'insufficient_evidence'],
            'unclear_method': ['reproducibility', 'poor_clarity'],
            'weak_evaluation': ['missing_baseline', 'insufficient_evidence']
        }
        
        related_types = relationships.get(item_type, [])
        
        for other in all_items:
            if other != item and other.get('concern_type') in related_types:
                related.append(self._get_pattern_name(other))
        
        return related[:3]  # Max 3 related patterns
    
    def _identify_style_clusters(
        self,
        feedback_items: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Identify clusters of reviewer styles."""
        style_counts = {}
        
        for item in feedback_items:
            style = item.get('reviewer_style', 'general')
            if style not in style_counts:
                style_counts[style] = []
            style_counts[style].append(item)
        
        clusters = []
        for style, items in style_counts.items():
            if style in self.REVIEWER_STYLES:
                style_info = self.REVIEWER_STYLES[style]
                cluster = {
                    "style": style,
                    "name": style_info['name'],
                    "characteristics": style_info['characteristics'],
                    "typical_concerns": style_info['typical_concerns'],
                    "pattern_count": len(items),
                    "avg_confidence": sum(i.get('confidence', 0.5) for i in items) / len(items),
                    "severity_distribution": {
                        'major': sum(1 for i in items if i.get('severity') == 'major'),
                        'moderate': sum(1 for i in items if i.get('severity') == 'moderate'),
                        'minor': sum(1 for i in items if i.get('severity') == 'minor')
                    }
                }
                clusters.append(cluster)
        
        # Sort by pattern count (most common first)
        clusters.sort(key=lambda x: x['pattern_count'], reverse=True)
        
        return clusters
    
    def _generate_summary(
        self,
        patterns_by_category: Dict[str, List[Dict[str, Any]]],
        style_clusters: List[Dict[str, Any]],
        overall_assessment: str = None
    ) -> Dict[str, Any]:
        """Generate summary statistics."""
        total_patterns = sum(len(patterns) for patterns in patterns_by_category.values())
        
        # Count by severity across all patterns
        severity_counts = {'major': 0, 'moderate': 0, 'minor': 0}
        for patterns in patterns_by_category.values():
            for pattern in patterns:
                severity = pattern.get('severity', 'moderate')
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
        
        # Find dominant reviewer style
        dominant_style = None
        if style_clusters:
            dominant_style = style_clusters[0]['name']
        
        # Category distribution
        category_distribution = {
            cat_key: len(patterns)
            for cat_key, patterns in patterns_by_category.items()
            if len(patterns) > 0
        }
        
        # Top concerns (categories with most patterns)
        top_concerns = sorted(
            [(cat, count) for cat, count in category_distribution.items()],
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        return {
            "total_patterns": total_patterns,
            "categories_with_feedback": len(category_distribution),
            "severity_distribution": severity_counts,
            "dominant_reviewer_style": dominant_style,
            "style_cluster_count": len(style_clusters),
            "top_concern_categories": [
                {"category": self.CATEGORIES[cat]['name'], "count": count}
                for cat, count in top_concerns
            ],
            "overall_assessment": overall_assessment or "not_determined",
            "recommendation": self._get_recommendation(severity_counts, overall_assessment)
        }
    
    def _get_recommendation(
        self,
        severity_counts: Dict[str, int],
        assessment: str = None
    ) -> str:
        """Generate overall recommendation."""
        if assessment:
            recommendations = {
                'accept_with_minor_revisions': 'The paper is generally sound. Address minor concerns before publication.',
                'minor_revision': 'The paper shows promise but needs refinement in several areas.',
                'major_revision': 'Significant issues require substantial revision before acceptance.',
                'reject': 'Multiple major concerns suggest the paper needs fundamental rethinking.'
            }
            return recommendations.get(assessment, 'Review the feedback carefully and address concerns.')
        
        # Fallback based on severity
        if severity_counts.get('major', 0) >= 3:
            return 'Multiple major concerns detected. Substantial revision recommended.'
        elif severity_counts.get('major', 0) >= 1:
            return 'Address major concerns and consider moderate issues.'
        elif severity_counts.get('moderate', 0) >= 2:
            return 'Focus on moderate concerns to strengthen the paper.'
        else:
            return 'Address minor issues to improve overall quality.'
