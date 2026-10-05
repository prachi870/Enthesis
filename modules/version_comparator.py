"""
Version Comparator - Compare analysis results across paper versions

Shows measurable detected changes between versions:
- Findings added
- Findings removed
- Findings still present
- Changes in novelty, weaknesses, clarity, reviewer concerns

IMPORTANT: Never claims paper "improved" unless based on measurable detected changes.
Uses cautious language: "detected fewer issues", "detected changes", "appears to address".
"""
from typing import List, Dict, Any
from datetime import datetime


class VersionComparator:
    """Compare analysis results across paper versions."""
    
    def __init__(self):
        pass
    
    def compare_versions(
        self,
        version1_results: Dict[str, Any],
        version2_results: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Compare two paper versions' analysis results.
        
        Args:
            version1_results: Earlier version analysis results
            version2_results: Later version analysis results
            
        Returns:
            Detailed comparison showing measurable changes
        """
        comparison = {
            "findings_changes": {
                "added": [],
                "removed": [],
                "persistent": []
            },
            "novelty_changes": None,
            "weakness_changes": None,
            "clarity_changes": None,
            "reviewer_changes": None
        }
        
        # Extract all findings from both versions
        v1_findings = self._extract_all_findings(version1_results)
        v2_findings = self._extract_all_findings(version2_results)
        
        # Create finding signatures
        v1_sigs = {self._finding_signature(f): f for f in v1_findings}
        v2_sigs = {self._finding_signature(f): f for f in v2_findings}
        
        # Find changes
        added_sigs = set(v2_sigs.keys()) - set(v1_sigs.keys())
        removed_sigs = set(v1_sigs.keys()) - set(v2_sigs.keys())
        persistent_sigs = set(v1_sigs.keys()) & set(v2_sigs.keys())
        
        for sig in added_sigs:
            comparison["findings_changes"]["added"].append(v2_sigs[sig])
        
        for sig in removed_sigs:
            comparison["findings_changes"]["removed"].append(v1_sigs[sig])
        
        for sig in persistent_sigs:
            comparison["findings_changes"]["persistent"].append(v1_sigs[sig])
        
        # Compare module scores
        comparison["novelty_changes"] = self._compare_module_score(
            version1_results.get('novelty', {}),
            version2_results.get('novelty', {})
        )
        
        comparison["weakness_changes"] = self._compare_module_score(
            version1_results.get('weaknesses', {}),
            version2_results.get('weaknesses', {})
        )
        
        comparison["clarity_changes"] = self._compare_module_score(
            version1_results.get('clarity', {}),
            version2_results.get('clarity', {})
        )
        
        comparison["reviewer_changes"] = self._compare_module_score(
            version1_results.get('reviewer_feedback', {}),
            version2_results.get('reviewer_feedback', {})
        )
        
        return comparison
    
    def _extract_all_findings(self, results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract all findings from all modules."""
        all_findings = []
        
        for module_name, module_data in results.items():
            if isinstance(module_data, dict) and 'findings' in module_data:
                findings = module_data['findings']
                if isinstance(findings, list):
                    # Add module name to each finding
                    for finding in findings:
                        finding_copy = finding.copy()
                        finding_copy['module'] = module_name
                        all_findings.append(finding_copy)
        
        return all_findings
    
    def _compare_module_score(self, v1_module: Dict, v2_module: Dict) -> Dict[str, Any]:
        """Compare overall scores for a module."""
        v1_score = v1_module.get('overall_confidence', 0.5)
        v2_score = v2_module.get('overall_confidence', 0.5)
        
        if isinstance(v1_score, (int, float)) and isinstance(v2_score, (int, float)):
            return {
                "v1_score": float(v1_score),
                "v2_score": float(v2_score),
                "change": float(v2_score - v1_score)
            }
        
        return {
            "v1_score": 0.5,
            "v2_score": 0.5,
            "change": 0.0
        }
    
    def _compare_module(
        self,
        module_name: str,
        v1_data: Dict[str, Any],
        v2_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Compare a specific module between versions."""
        
        comparison = {
            "module": module_name,
            "findings_added": [],
            "findings_removed": [],
            "findings_changed": [],
            "findings_unchanged": [],
            "metrics_comparison": {}
        }
        
        # Get findings from both versions
        v1_findings = self._extract_findings(v1_data)
        v2_findings = self._extract_findings(v2_data)
        
        # Create finding signatures for comparison
        v1_signatures = {self._finding_signature(f): f for f in v1_findings}
        v2_signatures = {self._finding_signature(f): f for f in v2_findings}
        
        # Find added findings
        added_sigs = set(v2_signatures.keys()) - set(v1_signatures.keys())
        for sig in added_sigs:
            comparison['findings_added'].append({
                "finding": v2_signatures[sig],
                "description": self._describe_finding(v2_signatures[sig])
            })
        
        # Find removed findings
        removed_sigs = set(v1_signatures.keys()) - set(v2_signatures.keys())
        for sig in removed_sigs:
            comparison['findings_removed'].append({
                "finding": v1_signatures[sig],
                "description": self._describe_finding(v1_signatures[sig])
            })
        
        # Find unchanged findings
        unchanged_sigs = set(v1_signatures.keys()) & set(v2_signatures.keys())
        for sig in unchanged_sigs:
            v1_finding = v1_signatures[sig]
            v2_finding = v2_signatures[sig]
            
            # Check if values changed
            if self._finding_values_changed(v1_finding, v2_finding):
                comparison['findings_changed'].append({
                    "finding_v1": v1_finding,
                    "finding_v2": v2_finding,
                    "changes": self._describe_finding_changes(v1_finding, v2_finding)
                })
            else:
                comparison['findings_unchanged'].append({
                    "finding": v1_finding,
                    "description": self._describe_finding(v1_finding)
                })
        
        # Compare metrics
        comparison['metrics_comparison'] = self._compare_metrics(
            v1_data.get('metrics', {}),
            v2_data.get('metrics', {})
        )
        
        # Module-specific comparisons
        if module_name == 'novelty':
            comparison['novelty_score_change'] = self._compare_novelty_scores(v1_data, v2_data)
        elif module_name == 'weaknesses':
            comparison['weakness_counts'] = self._compare_weakness_counts(v1_data, v2_data)
        elif module_name == 'clarity':
            comparison['clarity_metrics'] = self._compare_clarity_metrics(v1_data, v2_data)
        
        return comparison
    
    def _extract_findings(self, module_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract findings from module data."""
        findings = []
        
        # Check different possible structures
        if 'findings' in module_data:
            findings.extend(module_data['findings'])
        
        if 'evidence' in module_data and isinstance(module_data['evidence'], list):
            findings.extend(module_data['evidence'])
        
        return findings
    
    def _finding_signature(self, finding: Dict[str, Any]) -> str:
        """Create a signature for a finding to match across versions."""
        # Use type + description/summary to identify same finding
        finding_type = finding.get('type', '')
        description = finding.get('description', finding.get('summary', finding.get('feedback', '')))
        module = finding.get('module', '')
        
        # Create a simple hash of key components
        sig_text = f"{module}:{finding_type}:{description[:100]}"
        return sig_text
    
    def _finding_values_changed(self, v1: Dict[str, Any], v2: Dict[str, Any]) -> bool:
        """Check if finding values changed between versions."""
        # Compare key numeric/string values
        keys_to_compare = ['count', 'score', 'confidence', 'severity', 'novelty_score']
        
        for key in keys_to_compare:
            if key in v1 and key in v2:
                if v1[key] != v2[key]:
                    return True
        
        return False
    
    def _describe_finding(self, finding: Dict[str, Any]) -> str:
        """Generate human-readable description of a finding."""
        finding_type = finding.get('type', 'finding')
        
        # Try to get descriptive text
        description = finding.get('description', '')
        summary = finding.get('summary', '')
        feedback = finding.get('feedback', '')
        
        text = description or summary or feedback or finding_type
        
        # Add count/score if present
        if 'count' in finding:
            text += f" (count: {finding['count']})"
        if 'novelty_score' in finding:
            text += f" (score: {finding['novelty_score']:.2f})"
        if 'confidence' in finding:
            text += f" (confidence: {finding['confidence']:.2f})"
        
        return text[:200]  # Limit length
    
    def _describe_finding_changes(self, v1: Dict[str, Any], v2: Dict[str, Any]) -> str:
        """Describe what changed in a finding."""
        changes = []
        
        # Check numeric changes
        if 'count' in v1 and 'count' in v2 and v1['count'] != v2['count']:
            changes.append(f"count changed from {v1['count']} to {v2['count']}")
        
        if 'novelty_score' in v1 and 'novelty_score' in v2:
            if abs(v1['novelty_score'] - v2['novelty_score']) > 0.01:
                changes.append(f"score changed from {v1['novelty_score']:.2f} to {v2['novelty_score']:.2f}")
        
        if 'confidence' in v1 and 'confidence' in v2:
            if abs(v1['confidence'] - v2['confidence']) > 0.01:
                changes.append(f"confidence changed from {v1['confidence']:.2f} to {v2['confidence']:.2f}")
        
        if 'severity' in v1 and 'severity' in v2 and v1['severity'] != v2['severity']:
            changes.append(f"severity changed from {v1['severity']} to {v2['severity']}")
        
        return "; ".join(changes) if changes else "Values changed"
    
    def _compare_metrics(self, v1_metrics: Dict, v2_metrics: Dict) -> Dict[str, Any]:
        """Compare metrics between versions."""
        comparison = {}
        
        all_keys = set(v1_metrics.keys()) | set(v2_metrics.keys())
        
        for key in all_keys:
            v1_val = v1_metrics.get(key)
            v2_val = v2_metrics.get(key)
            
            if v1_val != v2_val:
                comparison[key] = {
                    "version1": v1_val,
                    "version2": v2_val,
                    "changed": True
                }
        
        return comparison
    
    def _compare_novelty_scores(self, v1: Dict, v2: Dict) -> Dict[str, Any]:
        """Compare novelty scores specifically."""
        v1_findings = v1.get('findings', [])
        v2_findings = v2.get('findings', [])
        
        v1_score = None
        v2_score = None
        
        # Extract novelty scores
        for finding in v1_findings:
            if finding.get('type') == 'novelty_analysis':
                v1_score = finding.get('novelty_score')
        
        for finding in v2_findings:
            if finding.get('type') == 'novelty_analysis':
                v2_score = finding.get('novelty_score')
        
        if v1_score is not None and v2_score is not None:
            change = v2_score - v1_score
            return {
                "version1_score": v1_score,
                "version2_score": v2_score,
                "change": change,
                "interpretation": self._interpret_novelty_change(change)
            }
        
        return {}
    
    def _interpret_novelty_change(self, change: float) -> str:
        """Interpret novelty score change (cautious language)."""
        if abs(change) < 0.05:
            return "Novelty score remained essentially unchanged"
        elif change > 0:
            return f"Detected increase in novelty indicators (+{change:.2f})"
        else:
            return f"Detected decrease in novelty indicators ({change:.2f})"
    
    def _compare_weakness_counts(self, v1: Dict, v2: Dict) -> Dict[str, Any]:
        """Compare weakness counts."""
        v1_findings = self._extract_findings(v1)
        v2_findings = self._extract_findings(v2)
        
        # Count by severity/type
        v1_counts = self._count_by_attribute(v1_findings, 'severity')
        v2_counts = self._count_by_attribute(v2_findings, 'severity')
        
        return {
            "version1": v1_counts,
            "version2": v2_counts,
            "interpretation": self._interpret_weakness_change(v1_counts, v2_counts)
        }
    
    def _count_by_attribute(self, findings: List[Dict], attr: str) -> Dict[str, int]:
        """Count findings by attribute."""
        counts = {}
        for finding in findings:
            value = finding.get(attr, 'unknown')
            counts[value] = counts.get(value, 0) + 1
        return counts
    
    def _interpret_weakness_change(self, v1: Dict, v2: Dict) -> str:
        """Interpret weakness count changes (cautious language)."""
        v1_total = sum(v1.values())
        v2_total = sum(v2.values())
        
        if v2_total < v1_total:
            return f"Detected {v1_total - v2_total} fewer weakness indicators"
        elif v2_total > v1_total:
            return f"Detected {v2_total - v1_total} additional weakness indicators"
        else:
            return "Weakness count remained the same"
    
    def _compare_clarity_metrics(self, v1: Dict, v2: Dict) -> Dict[str, Any]:
        """Compare clarity metrics."""
        v1_findings = v1.get('findings', [])
        v2_findings = v2.get('findings', [])
        
        # Extract clarity scores if present
        v1_score = None
        v2_score = None
        
        for finding in v1_findings:
            if 'clarity_score' in finding:
                v1_score = finding['clarity_score']
        
        for finding in v2_findings:
            if 'clarity_score' in finding:
                v2_score = finding['clarity_score']
        
        if v1_score is not None and v2_score is not None:
            return {
                "version1_score": v1_score,
                "version2_score": v2_score,
                "change": v2_score - v1_score,
                "interpretation": self._interpret_clarity_change(v2_score - v1_score)
            }
        
        return {}
    
    def _interpret_clarity_change(self, change: float) -> str:
        """Interpret clarity score change (cautious language)."""
        if abs(change) < 0.02:
            return "Clarity metrics remained essentially unchanged"
        elif change > 0:
            return f"Detected improvement in clarity indicators (+{change:.2f})"
        else:
            return f"Detected decline in clarity indicators ({change:.2f})"
    
    def _generate_comparison_summary(self, changes: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of all changes."""
        summary = {
            "total_modules_compared": len(changes),
            "total_findings_added": 0,
            "total_findings_removed": 0,
            "total_findings_changed": 0,
            "total_findings_unchanged": 0,
            "modules_with_changes": []
        }
        
        for module, module_changes in changes.items():
            added = len(module_changes.get('findings_added', []))
            removed = len(module_changes.get('findings_removed', []))
            changed = len(module_changes.get('findings_changed', []))
            unchanged = len(module_changes.get('findings_unchanged', []))
            
            summary['total_findings_added'] += added
            summary['total_findings_removed'] += removed
            summary['total_findings_changed'] += changed
            summary['total_findings_unchanged'] += unchanged
            
            if added > 0 or removed > 0 or changed > 0:
                summary['modules_with_changes'].append({
                    "module": module,
                    "added": added,
                    "removed": removed,
                    "changed": changed
                })
        
        return summary
    
    def _generate_overall_assessment(self, summary: Dict[str, Any]) -> str:
        """Generate overall assessment with cautious language."""
        added = summary.get('total_findings_added', 0)
        removed = summary.get('total_findings_removed', 0)
        changed = summary.get('total_findings_changed', 0)
        unchanged = summary.get('total_findings_unchanged', 0)
        
        total_detected = added + removed + changed
        
        if total_detected == 0:
            return "No measurable changes detected between versions. Analysis results remained essentially the same."
        
        parts = []
        
        if removed > 0:
            parts.append(f"detected {removed} fewer issue indicator(s)")
        
        if added > 0:
            parts.append(f"detected {added} new issue indicator(s)")
        
        if changed > 0:
            parts.append(f"detected changes in {changed} existing finding(s)")
        
        if unchanged > 0:
            parts.append(f"{unchanged} finding(s) remained unchanged")
        
        assessment = f"Comparison detected measurable differences: {', '.join(parts)}. "
        
        # Add cautious interpretation
        if removed > added:
            assessment += "The revision appears to address some previously detected concerns. "
        elif added > removed:
            assessment += "The revision detected additional concerns that may require attention. "
        
        assessment += "Note: Changes reflect detected patterns only and should be manually verified."
        
        return assessment
