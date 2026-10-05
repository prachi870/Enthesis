"""
Weakness Mapper - Map detected weaknesses to paper sections

Analyzes paper to identify potential issues in each section:
- Missing baseline
- Weak evaluation
- Unclear method
- Limited novelty
- Insufficient evidence
- Poor clarity

Uses cautious language - never labels sections as "bad".
"""
import re
from typing import List, Dict, Any


class WeaknessMapper:
    """Map weaknesses to paper sections for heatmap visualization."""
    
    # Standard paper sections
    PAPER_SECTIONS = [
        'abstract',
        'introduction',
        'related_work',
        'methodology',
        'experiments',
        'results',
        'discussion',
        'conclusion'
    ]
    
    # Section aliases for detection
    SECTION_ALIASES = {
        'abstract': ['abstract', 'summary'],
        'introduction': ['introduction', 'intro', 'motivation'],
        'related_work': ['related work', 'related works', 'background', 'literature review', 'prior work'],
        'methodology': ['methodology', 'method', 'methods', 'approach', 'proposed method', 'our approach'],
        'experiments': ['experiments', 'experimental setup', 'experimental design', 'setup'],
        'results': ['results', 'experimental results', 'findings', 'performance'],
        'discussion': ['discussion', 'analysis', 'discussion and analysis'],
        'conclusion': ['conclusion', 'conclusions', 'concluding remarks', 'future work']
    }
    
    # Weakness patterns by category
    WEAKNESS_PATTERNS = {
        'missing_baseline': {
            'patterns': [
                r'no\s+(?:baseline|comparison)',
                r'lack\s+of\s+(?:baseline|comparison)',
                r'without\s+(?:comparing|baseline)',
                r'not\s+compared\s+(?:to|with|against)',
                r'missing\s+comparison',
                r'no\s+(?:prior|existing)\s+methods?'
            ],
            'sections': ['experiments', 'results', 'methodology'],
            'severity': 'high',
            'description': 'Potential missing baseline comparison',
            'explanation': 'The evaluation may benefit from comparisons with established baseline methods to contextualize the results.',
            'recommended_action': 'Consider adding comparisons with at least 2-3 standard baseline methods from recent literature.'
        },
        'weak_evaluation': {
            'patterns': [
                r'(?:single|one)\s+(?:dataset|metric|experiment)',
                r'limited\s+(?:evaluation|experiments|testing)',
                r'small\s+(?:dataset|sample)',
                r'(?:no|without)\s+(?:ablation|statistical\s+test)',
                r'lack\s+of\s+(?:evaluation|experiments)',
                r'not\s+(?:enough|sufficient)\s+(?:data|experiments)',
                r'preliminary\s+results?'
            ],
            'sections': ['experiments', 'results', 'methodology'],
            'severity': 'high',
            'description': 'Potential evaluation limitations detected',
            'explanation': 'The experimental evaluation could be strengthened with additional datasets, metrics, or statistical validation.',
            'recommended_action': 'Consider expanding evaluation to multiple datasets, adding ablation studies, and including statistical significance testing.'
        },
        'unclear_method': {
            'patterns': [
                r'(?:unclear|vague|ambiguous)\s+(?:description|explanation)',
                r'not\s+(?:clear|explained|specified)',
                r'lack\s+of\s+(?:detail|explanation)',
                r'(?:no|without)\s+(?:implementation|algorithm)\s+details?',
                r'insufficient\s+(?:detail|information)',
                r'(?:how|why)\s+(?:is\s+)?(?:not|un)clear',
                r'(?:difficult|hard)\s+to\s+(?:understand|reproduce)'
            ],
            'sections': ['methodology', 'experiments', 'introduction'],
            'severity': 'medium',
            'description': 'Potential clarity issues in methodology',
            'explanation': 'Some aspects of the method description may benefit from additional detail or clarification for reproducibility.',
            'recommended_action': 'Add implementation details, hyperparameters, and algorithmic steps. Consider including pseudocode or diagrams.'
        },
        'limited_novelty': {
            'patterns': [
                r'(?:standard|conventional|existing|prior)\s+(?:approach|method|technique)',
                r'similar\s+to\s+(?:existing|prior)',
                r'(?:incremental|minor)\s+(?:change|improvement|contribution)',
                r'already\s+(?:exists?|proposed|known)',
                r'not\s+(?:novel|new|original)',
                r'limited\s+(?:novelty|contribution)',
                r'straightforward\s+(?:application|extension)'
            ],
            'sections': ['introduction', 'methodology', 'related_work'],
            'severity': 'medium',
            'description': 'Potential novelty concerns identified',
            'explanation': 'The contribution may need clearer positioning relative to existing work to highlight unique aspects.',
            'recommended_action': 'Explicitly articulate what is novel. Compare with most similar prior work and highlight key differences.'
        },
        'insufficient_evidence': {
            'patterns': [
                r'(?:no|without|lack\s+of)\s+(?:evidence|proof|support)',
                r'(?:un)?(?:supported|substantiated)\s+(?:claim|statement)',
                r'not\s+(?:shown|demonstrated|proven)',
                r'(?:no|without)\s+(?:experiments?|results?|data)',
                r'(?:needs?|requires?)\s+(?:more|additional)\s+(?:evidence|validation)',
                r'claim\s+(?:is\s+)?not\s+backed'
            ],
            'sections': ['results', 'discussion', 'introduction', 'conclusion'],
            'severity': 'high',
            'description': 'Potential insufficient evidence for claims',
            'explanation': 'Some claims may benefit from additional empirical support or theoretical justification.',
            'recommended_action': 'Ensure all major claims are supported by experimental results, citations, or theoretical analysis.'
        },
        'poor_clarity': {
            'patterns': [
                r'(?:unclear|confusing|ambiguous|vague)',
                r'(?:difficult|hard)\s+to\s+(?:follow|understand)',
                r'(?:poorly|badly)\s+(?:written|organized|structured)',
                r'lacks?\s+(?:clarity|coherence)',
                r'(?:no|without)\s+(?:clear\s+)?(?:structure|organization)',
                r'(?:too\s+)?(?:technical|complex|dense)'
            ],
            'sections': ['abstract', 'introduction', 'methodology', 'discussion'],
            'severity': 'low',
            'description': 'Potential clarity improvements needed',
            'explanation': 'The writing or presentation in this section could be enhanced for better reader comprehension.',
            'recommended_action': 'Review for clarity. Consider adding transitions, examples, or restructuring for better flow.'
        }
    }
    
    def __init__(self):
        pass
    
    def map_weaknesses(
        self,
        paper_text: str,
        paper_id: str = None,
        analysis_results: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Map weaknesses to paper sections.
        
        Args:
            paper_text: Full paper text
            paper_id: Optional paper identifier
            analysis_results: Optional results from other modules
            
        Returns:
            Dictionary with section-wise weakness mapping
        """
        # Extract sections from paper
        sections_text = self._extract_sections(paper_text)
        
        # Detect weaknesses in each section
        section_weaknesses = {}
        
        for section_name, section_text in sections_text.items():
            weaknesses = self._detect_weaknesses_in_section(
                section_name,
                section_text,
                paper_text
            )
            
            if weaknesses:
                section_weaknesses[section_name] = weaknesses
        
        # Integrate findings from analysis modules if available
        if analysis_results:
            section_weaknesses = self._integrate_module_findings(
                section_weaknesses,
                analysis_results,
                sections_text
            )
        
        # Calculate heat levels for each section
        heat_map = self._calculate_heat_levels(section_weaknesses)
        
        # Generate summary
        summary = self._generate_summary(section_weaknesses, heat_map)
        
        return {
            "paper_id": paper_id,
            "sections": section_weaknesses,
            "heat_map": heat_map,
            "summary": summary
        }
    
    def _extract_sections(self, text: str) -> Dict[str, str]:
        """Extract text for each paper section."""
        sections = {}
        text_lower = text.lower()
        
        # Find section boundaries
        section_positions = []
        
        for section_name, aliases in self.SECTION_ALIASES.items():
            for alias in aliases:
                # Look for section headers
                pattern = rf'(?:^|\n)\s*(?:\d+\.?\s+)?{re.escape(alias)}\s*(?:\n|$)'
                matches = list(re.finditer(pattern, text_lower, re.IGNORECASE))
                
                if matches:
                    # Use the first match for this section
                    match = matches[0]
                    section_positions.append({
                        'name': section_name,
                        'start': match.start(),
                        'end': match.end()
                    })
                    break
        
        # Sort by position
        section_positions.sort(key=lambda x: x['start'])
        
        # Extract text between sections
        for i, section in enumerate(section_positions):
            start = section['end']
            end = section_positions[i + 1]['start'] if i + 1 < len(section_positions) else len(text)
            section_text = text[start:end].strip()
            
            # Limit section length for analysis
            if len(section_text) > 5000:
                section_text = section_text[:5000] + "..."
            
            sections[section['name']] = section_text
        
        # If no sections detected, create artificial sections
        if not sections:
            # Use simple heuristics based on position
            text_len = len(text)
            sections = {
                'abstract': text[:min(500, text_len)],
                'introduction': text[500:min(2000, text_len)],
                'methodology': text[2000:min(5000, text_len)],
                'experiments': text[5000:min(8000, text_len)],
                'results': text[8000:min(10000, text_len)],
                'conclusion': text[max(0, text_len-1000):]
            }
        
        return sections
    
    def _detect_weaknesses_in_section(
        self,
        section_name: str,
        section_text: str,
        full_text: str
    ) -> List[Dict[str, Any]]:
        """Detect weaknesses in a specific section."""
        weaknesses = []
        section_lower = section_text.lower()
        
        for weakness_type, config in self.WEAKNESS_PATTERNS.items():
            # Check if this weakness applies to this section
            if section_name not in config['sections']:
                continue
            
            # Check for weakness patterns
            matches = []
            for pattern in config['patterns']:
                found = re.findall(pattern, section_lower)
                matches.extend(found)
            
            if matches:
                # Extract evidence (context around match)
                evidence = self._extract_evidence(section_text, matches[0] if matches else "")
                
                # Calculate confidence based on number of matches
                confidence = min(0.9, 0.5 + (len(matches) * 0.1))
                
                weakness = {
                    "type": weakness_type,
                    "category": weakness_type.replace('_', ' ').title(),
                    "description": config['description'],
                    "explanation": config['explanation'],
                    "severity": config['severity'],
                    "confidence": confidence,
                    "evidence": evidence,
                    "match_count": len(matches),
                    "recommended_action": config['recommended_action']
                }
                
                weaknesses.append(weakness)
        
        return weaknesses
    
    def _extract_evidence(self, text: str, match: str) -> str:
        """Extract evidence context around a match."""
        if not match:
            # Return first 200 chars as evidence
            return text[:200] + "..." if len(text) > 200 else text
        
        # Find the match in text (case-insensitive)
        text_lower = text.lower()
        match_lower = match.lower() if isinstance(match, str) else ""
        
        try:
            pos = text_lower.index(match_lower)
            # Extract context: 100 chars before and after
            start = max(0, pos - 100)
            end = min(len(text), pos + len(match_lower) + 100)
            evidence = text[start:end]
            
            # Clean up
            if start > 0:
                evidence = "..." + evidence
            if end < len(text):
                evidence = evidence + "..."
                
            return evidence.strip()
        except ValueError:
            # Match not found, return beginning of section
            return text[:200] + "..." if len(text) > 200 else text
    
    def _integrate_module_findings(
        self,
        section_weaknesses: Dict[str, List[Dict[str, Any]]],
        analysis_results: Dict[str, Any],
        sections_text: Dict[str, str]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Integrate findings from other analysis modules."""
        
        # Check weaknesses module results
        if 'weaknesses' in analysis_results:
            weakness_results = analysis_results['weaknesses']
            findings = weakness_results.get('findings', [])
            
            for finding in findings:
                weakness_type = finding.get('type', 'general')
                
                # Map to appropriate section
                target_section = self._determine_section_for_weakness(weakness_type)
                
                if target_section:
                    weakness = {
                        "type": weakness_type,
                        "category": finding.get('category', 'General'),
                        "description": f"Module detected: {finding.get('description', 'Potential issue')}",
                        "explanation": finding.get('summary', 'Detected by weakness analysis module'),
                        "severity": finding.get('severity', 'medium'),
                        "confidence": finding.get('confidence', 0.7),
                        "evidence": finding.get('evidence', 'See module results for details'),
                        "match_count": finding.get('count', 1),
                        "recommended_action": 'Review this finding from the weakness analysis module.'
                    }
                    
                    if target_section not in section_weaknesses:
                        section_weaknesses[target_section] = []
                    
                    section_weaknesses[target_section].append(weakness)
        
        # Check novelty module results
        if 'novelty' in analysis_results:
            novelty_results = analysis_results['novelty']
            findings = novelty_results.get('findings', [])
            
            for finding in findings:
                if finding.get('type') == 'novelty_analysis':
                    novelty_score = finding.get('novelty_score', 1.0)
                    
                    if novelty_score < 0.5:
                        # Add limited novelty warning
                        weakness = {
                            "type": "limited_novelty",
                            "category": "Limited Novelty",
                            "description": "Novelty module detected potential concerns",
                            "explanation": f"Analysis suggests novelty score of {novelty_score:.2f}. Consider strengthening unique contributions.",
                            "severity": "medium",
                            "confidence": 0.75,
                            "evidence": finding.get('summary', ''),
                            "match_count": 1,
                            "recommended_action": "Review novelty claims and strengthen positioning against prior work."
                        }
                        
                        for section in ['introduction', 'methodology']:
                            if section not in section_weaknesses:
                                section_weaknesses[section] = []
                            section_weaknesses[section].append(weakness)
        
        return section_weaknesses
    
    def _determine_section_for_weakness(self, weakness_type: str) -> str:
        """Determine which section a weakness type belongs to."""
        mapping = {
            'missing_baseline': 'experiments',
            'weak_evaluation': 'results',
            'unclear_method': 'methodology',
            'limited_novelty': 'introduction',
            'insufficient_evidence': 'results',
            'poor_clarity': 'abstract'
        }
        return mapping.get(weakness_type, 'methodology')
    
    def _calculate_heat_levels(
        self,
        section_weaknesses: Dict[str, List[Dict[str, Any]]]
    ) -> Dict[str, Dict[str, Any]]:
        """Calculate heat level for each section."""
        heat_map = {}
        
        for section in self.PAPER_SECTIONS:
            weaknesses = section_weaknesses.get(section, [])
            
            if not weaknesses:
                heat_level = 'none'
                heat_score = 0.0
                color = 'green'
            else:
                # Calculate heat score based on number, severity, and confidence
                severity_weights = {'high': 1.0, 'medium': 0.6, 'low': 0.3}
                
                total_score = 0.0
                for w in weaknesses:
                    severity_weight = severity_weights.get(w['severity'], 0.5)
                    confidence = w.get('confidence', 0.5)
                    total_score += severity_weight * confidence
                
                heat_score = min(1.0, total_score / 2.0)  # Normalize
                
                # Determine heat level and color
                if heat_score >= 0.7:
                    heat_level = 'high'
                    color = 'red'
                elif heat_score >= 0.4:
                    heat_level = 'medium'
                    color = 'orange'
                elif heat_score >= 0.15:
                    heat_level = 'low'
                    color = 'yellow'
                else:
                    heat_level = 'minimal'
                    color = 'green'
            
            heat_map[section] = {
                "level": heat_level,
                "score": round(heat_score, 3),
                "color": color,
                "findings_count": len(weaknesses)
            }
        
        return heat_map
    
    def _generate_summary(
        self,
        section_weaknesses: Dict[str, List[Dict[str, Any]]],
        heat_map: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate summary statistics."""
        total_findings = sum(len(weaknesses) for weaknesses in section_weaknesses.values())
        
        by_severity = {'high': 0, 'medium': 0, 'low': 0}
        by_category = {}
        
        for weaknesses in section_weaknesses.values():
            for w in weaknesses:
                severity = w.get('severity', 'medium')
                by_severity[severity] = by_severity.get(severity, 0) + 1
                
                category = w.get('category', 'General')
                by_category[category] = by_category.get(category, 0) + 1
        
        # Count sections with issues
        sections_with_issues = sum(1 for heat in heat_map.values() if heat['level'] != 'none')
        
        # Find hotspots (sections with most issues)
        hotspots = []
        for section, heat in heat_map.items():
            if heat['findings_count'] > 0:
                hotspots.append({
                    "section": section.replace('_', ' ').title(),
                    "findings_count": heat['findings_count'],
                    "heat_level": heat['level']
                })
        hotspots.sort(key=lambda x: x['findings_count'], reverse=True)
        
        return {
            "total_findings": total_findings,
            "sections_analyzed": len(self.PAPER_SECTIONS),
            "sections_with_issues": sections_with_issues,
            "by_severity": by_severity,
            "by_category": by_category,
            "hotspots": hotspots[:3],  # Top 3 sections
            "overall_health": self._calculate_overall_health(heat_map)
        }
    
    def _calculate_overall_health(self, heat_map: Dict[str, Dict[str, Any]]) -> str:
        """Calculate overall paper health status."""
        avg_score = sum(h['score'] for h in heat_map.values()) / len(heat_map)
        
        if avg_score >= 0.6:
            return "needs_attention"
        elif avg_score >= 0.3:
            return "fair"
        elif avg_score >= 0.1:
            return "good"
        else:
            return "excellent"
