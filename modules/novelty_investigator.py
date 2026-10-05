"""
Novelty Investigator - Detailed NLI-style analysis of research claims

Analyzes each claim against existing literature to detect:
- Support (claim is backed by existing work)
- Contradiction (claim conflicts with existing evidence)
- Potential overlap (similar claims already established)
- Novel contribution (claim appears unique)

Uses cautious language and never makes definitive judgments.
"""
import re
from typing import List, Dict, Any


class NoveltyInvestigator:
    """Investigate novelty of research claims using NLI-style analysis."""
    
    def __init__(self):
        # Keywords indicating different NLI relationships
        self.support_indicators = [
            r'consistent\s+with',
            r'aligns?\s+with',
            r'confirms?',
            r'validates?',
            r'supports?',
            r'in\s+agreement\s+with',
            r'corroborates?',
            r'similar\s+to',
            r'as\s+(?:shown|demonstrated|reported)\s+by',
        ]
        
        self.contradiction_indicators = [
            r'(?:contrary|opposite)\s+to',
            r'contradicts?',
            r'disagrees?\s+with',
            r'conflicts?\s+with',
            r'challenges?',
            r'refutes?',
            r'unlike',
            r'in\s+contrast\s+to',
            r'different\s+from',
        ]
        
        self.overlap_indicators = [
            r'(?:previous|prior|existing)\s+(?:work|research|studies)',
            r'already\s+(?:established|known|shown)',
            r'well-known',
            r'common\s+(?:practice|approach|knowledge)',
            r'standard\s+(?:method|technique|approach)',
            r'established\s+in',
            r'builds?\s+(?:on|upon)',
            r'extends?',
            r'based\s+on',
        ]
        
        self.novelty_indicators = [
            r'(?:first|novel|new|original|unique|innovative)',
            r'to\s+(?:our|the\s+best\s+of\s+our)\s+knowledge',
            r'previously\s+(?:unexplored|unstudied|unknown)',
            r'has\s+not\s+been\s+(?:investigated|studied|explored)',
            r'no\s+(?:previous|prior)\s+work',
        ]
    
    def investigate_claims(
        self, 
        claims: List[Dict[str, Any]], 
        paper_text: str,
        related_papers: List[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Investigate novelty of multiple claims.
        
        Args:
            claims: List of claim dicts from ClaimExtractor
            paper_text: Full paper text
            related_papers: Related papers from Related Work module
            
        Returns:
            List of investigation results for each claim
        """
        results = []
        
        for claim in claims:
            investigation = self._investigate_single_claim(
                claim, 
                paper_text, 
                related_papers or []
            )
            results.append(investigation)
        
        return results
    
    def _investigate_single_claim(
        self,
        claim: Dict[str, Any],
        paper_text: str,
        related_papers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Investigate a single claim for novelty."""
        
        claim_text = claim.get('claim_text', '')
        claim_lower = claim_text.lower()
        evidence_text = claim.get('evidence', '')
        
        # Step 1: Analyze claim against existing literature indicators
        nli_scores = self._analyze_nli_indicators(claim_lower, evidence_text)
        
        # Step 2: Find relevant existing research
        relevant_research = self._find_relevant_research(
            claim, 
            related_papers
        )
        
        # Step 3: Extract supporting/contradicting evidence
        evidence = self._extract_evidence(
            claim_text,
            evidence_text,
            paper_text,
            relevant_research
        )
        
        # Step 4: Determine NLI classification
        classification = self._classify_nli(nli_scores, relevant_research, claim)
        
        # Step 5: Generate detailed explanation
        explanation = self._generate_explanation(
            classification,
            claim,
            evidence,
            relevant_research,
            nli_scores
        )
        
        return {
            "claim_id": claim.get('claim_id'),
            "claim_text": claim_text,
            "claim_type": claim.get('claim_type'),
            "relevant_research": relevant_research,
            "evidence": evidence,
            "nli_result": classification,
            "explanation": explanation,
            "confidence": self._calculate_investigation_confidence(
                classification, 
                evidence, 
                relevant_research
            ),
            "requires_verification": self._requires_manual_verification(
                classification,
                nli_scores
            )
        }
    
    def _analyze_nli_indicators(self, claim_text: str, evidence_text: str) -> Dict[str, float]:
        """Analyze text for NLI relationship indicators."""
        combined_text = f"{claim_text} {evidence_text}".lower()
        
        scores = {
            'support': 0.0,
            'contradiction': 0.0,
            'overlap': 0.0,
            'novelty': 0.0
        }
        
        # Count support indicators
        for pattern in self.support_indicators:
            matches = re.findall(pattern, combined_text)
            scores['support'] += len(matches) * 0.2
        
        # Count contradiction indicators
        for pattern in self.contradiction_indicators:
            matches = re.findall(pattern, combined_text)
            scores['contradiction'] += len(matches) * 0.25
        
        # Count overlap indicators
        for pattern in self.overlap_indicators:
            matches = re.findall(pattern, combined_text)
            scores['overlap'] += len(matches) * 0.15
        
        # Count novelty indicators
        for pattern in self.novelty_indicators:
            matches = re.findall(pattern, combined_text)
            scores['novelty'] += len(matches) * 0.2
        
        # Normalize scores (cap at 1.0)
        for key in scores:
            scores[key] = min(1.0, scores[key])
        
        return scores
    
    def _find_relevant_research(
        self,
        claim: Dict[str, Any],
        related_papers: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Find related papers most relevant to this claim."""
        
        if not related_papers:
            return []
        
        claim_text = claim.get('claim_text', '').lower()
        claim_type = claim.get('claim_type', '')
        
        # Score each paper for relevance to this claim
        scored_papers = []
        
        for paper in related_papers[:10]:  # Consider top 10 related papers
            relevance_score = 0.0
            
            # Base relevance from similarity
            paper_sim = paper.get('similarity', 0.5)
            relevance_score += paper_sim * 0.5
            
            # Check if paper title overlaps with claim
            title = paper.get('title', '').lower()
            claim_words = set(re.findall(r'\b\w{4,}\b', claim_text))
            title_words = set(re.findall(r'\b\w{4,}\b', title))
            overlap = len(claim_words & title_words)
            relevance_score += min(0.3, overlap * 0.05)
            
            # Check methods/datasets overlap
            paper_methods = [m.lower() for m in paper.get('methods', [])]
            paper_datasets = [d.lower() for d in paper.get('datasets', [])]
            
            for method in paper_methods:
                if method in claim_text:
                    relevance_score += 0.1
            
            for dataset in paper_datasets:
                if dataset in claim_text:
                    relevance_score += 0.1
            
            scored_papers.append({
                **paper,
                'relevance_to_claim': min(1.0, relevance_score)
            })
        
        # Sort by relevance and return top 5
        scored_papers.sort(key=lambda x: x['relevance_to_claim'], reverse=True)
        return scored_papers[:5]
    
    def _extract_evidence(
        self,
        claim_text: str,
        claim_evidence: str,
        paper_text: str,
        relevant_research: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Extract evidence supporting or contradicting the claim."""
        
        evidence = {
            "from_paper": claim_evidence or "No local evidence available",
            "from_literature": [],
            "strength": "moderate"
        }
        
        # Extract evidence from related papers
        for paper in relevant_research[:3]:
            paper_evidence = {
                "paper_id": paper.get('paper_id'),
                "paper_title": paper.get('title'),
                "relevance": paper.get('relevance_to_claim', 0.5),
                "retrieval_reason": paper.get('retrieval_reason', 'Similar research area'),
                "relationship": self._determine_relationship(claim_text, paper)
            }
            evidence["from_literature"].append(paper_evidence)
        
        # Determine evidence strength
        if len(evidence["from_literature"]) >= 3:
            evidence["strength"] = "strong"
        elif len(evidence["from_literature"]) >= 1:
            evidence["strength"] = "moderate"
        else:
            evidence["strength"] = "weak"
        
        return evidence
    
    def _determine_relationship(self, claim_text: str, paper: Dict[str, Any]) -> str:
        """Determine relationship between claim and related paper."""
        
        claim_lower = claim_text.lower()
        title = paper.get('title', '').lower()
        
        # Check for strong indicators
        if any(word in title for word in ['novel', 'new', 'first']):
            if any(word in claim_lower for word in ['novel', 'new', 'first']):
                return "potential_overlap"
        
        if paper.get('similarity', 0) > 0.8:
            return "highly_related"
        elif paper.get('similarity', 0) > 0.6:
            return "related"
        else:
            return "tangentially_related"
    
    def _classify_nli(
        self,
        nli_scores: Dict[str, float],
        relevant_research: List[Dict[str, Any]],
        claim: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Classify the NLI relationship."""
        
        # Determine primary classification
        max_score = max(nli_scores.values())
        
        if max_score < 0.2:
            # Insufficient evidence
            classification_type = "insufficient_evidence"
            confidence = "low"
        elif nli_scores['contradiction'] > 0.4:
            classification_type = "contradicted"
            confidence = "moderate" if nli_scores['contradiction'] > 0.6 else "low"
        elif nli_scores['overlap'] > 0.4:
            classification_type = "potentially_overlapping"
            confidence = "moderate" if len(relevant_research) > 2 else "low"
        elif nli_scores['support'] > 0.3:
            classification_type = "supported"
            confidence = "moderate" if nli_scores['support'] > 0.5 else "low"
        elif nli_scores['novelty'] > 0.3:
            classification_type = "potentially_novel"
            confidence = "moderate" if nli_scores['novelty'] > 0.5 else "low"
        else:
            classification_type = "uncertain"
            confidence = "low"
        
        return {
            "type": classification_type,
            "confidence": confidence,
            "scores": nli_scores,
            "related_papers_count": len(relevant_research)
        }
    
    def _generate_explanation(
        self,
        classification: Dict[str, Any],
        claim: Dict[str, Any],
        evidence: Dict[str, Any],
        relevant_research: List[Dict[str, Any]],
        nli_scores: Dict[str, float]
    ) -> str:
        """Generate detailed explanation of the classification."""
        
        class_type = classification['type']
        confidence = classification['confidence']
        claim_type = claim.get('claim_type', 'research')
        
        explanations = {
            "supported": self._explain_supported,
            "contradicted": self._explain_contradicted,
            "potentially_overlapping": self._explain_overlapping,
            "potentially_novel": self._explain_novel,
            "insufficient_evidence": self._explain_insufficient,
            "uncertain": self._explain_uncertain
        }
        
        explain_func = explanations.get(class_type, self._explain_uncertain)
        return explain_func(claim, evidence, relevant_research, nli_scores, confidence)
    
    def _explain_supported(self, claim, evidence, research, scores, confidence):
        """Explain 'supported' classification."""
        explanation = (
            f"This {claim['claim_type']} claim appears to be **supported by existing work**. "
            f"Evidence suggests that similar findings or approaches have been reported in the literature. "
        )
        
        if len(research) > 0:
            explanation += (
                f"We found {len(research)} related paper(s) that report similar results or methods. "
            )
        
        explanation += (
            "This does not necessarily indicate lack of novelty - the claim may represent an extension, "
            "improvement, or validation of prior work. **Further verification recommended** to assess "
            "the specific contribution beyond existing research."
        )
        
        return explanation
    
    def _explain_contradicted(self, claim, evidence, research, scores, confidence):
        """Explain 'contradicted' classification."""
        explanation = (
            f"This {claim['claim_type']} claim shows **potential contradiction with existing evidence**. "
            f"Language patterns suggest findings that may differ from or challenge prior work. "
        )
        
        if len(research) > 0:
            explanation += (
                f"Found {len(research)} related paper(s) that may present conflicting results. "
            )
        
        explanation += (
            "This could indicate: (1) a genuine disagreement requiring further investigation, "
            "(2) different experimental conditions or datasets, or (3) misalignment in terminology. "
            "**Careful verification required** to understand the nature of the contradiction."
        )
        
        return explanation
    
    def _explain_overlapping(self, claim, evidence, research, scores, confidence):
        """Explain 'potentially overlapping' classification."""
        explanation = (
            f"**Potential overlap detected** with existing work. This {claim['claim_type']} claim "
            f"contains language suggesting that similar ideas, methods, or findings may have been "
            f"previously established in the literature. "
        )
        
        if len(research) > 0:
            explanation += (
                f"Analysis identified {len(research)} related paper(s) with overlapping content. "
            )
        
        explanation += (
            "This does not definitively indicate that the claim is non-novel. The contribution may lie in: "
            "(1) novel application to a different domain, (2) improved methodology, (3) extended evaluation, "
            "or (4) deeper analysis. **Detailed comparison recommended** to clarify the unique contribution."
        )
        
        return explanation
    
    def _explain_novel(self, claim, evidence, research, scores, confidence):
        """Explain 'potentially novel' classification."""
        explanation = (
            f"This {claim['claim_type']} claim **appears to present novel contributions**. "
            f"The language used suggests new ideas, methods, or findings not widely established "
            f"in prior work. "
        )
        
        if len(research) == 0:
            explanation += (
                "No closely related papers were found in the analysis. "
            )
        elif len(research) < 3:
            explanation += (
                f"Only {len(research)} loosely related paper(s) identified, suggesting "
                f"this may be a relatively unexplored area. "
            )
        
        explanation += (
            "However, absence of evidence is not definitive proof of novelty. "
            "**Comprehensive literature review recommended** to confirm that this contribution "
            "is genuinely new and has not been explored in adjacent research areas or recent publications."
        )
        
        return explanation
    
    def _explain_insufficient(self, claim, evidence, research, scores, confidence):
        """Explain 'insufficient evidence' classification."""
        explanation = (
            f"**Insufficient evidence** to make a confident assessment of this {claim['claim_type']} claim. "
            f"The analysis did not identify strong indicators of support, contradiction, or overlap. "
        )
        
        if len(research) == 0:
            explanation += (
                "No related papers were found, which may indicate either genuine novelty or gaps "
                "in the retrieval process. "
            )
        
        explanation += (
            "This classification suggests that the claim would benefit from: "
            "(1) more explicit positioning relative to prior work, (2) clearer articulation of the contribution, "
            "or (3) additional context about related research. **Manual expert review strongly recommended**."
        )
        
        return explanation
    
    def _explain_uncertain(self, claim, evidence, research, scores, confidence):
        """Explain 'uncertain' classification."""
        explanation = (
            f"The novelty status of this {claim['claim_type']} claim is **uncertain**. "
            f"Mixed signals from the analysis make it difficult to provide a clear assessment. "
        )
        
        explanation += (
            "This may occur when: (1) the claim has elements of both novelty and overlap, "
            "(2) the claim is stated ambiguously, or (3) there is conflicting evidence from related work. "
            "**Careful manual review required** to determine the true novelty and contribution of this claim."
        )
        
        return explanation
    
    def _calculate_investigation_confidence(
        self,
        classification: Dict[str, Any],
        evidence: Dict[str, Any],
        relevant_research: List[Dict[str, Any]]
    ) -> float:
        """Calculate confidence in the investigation result."""
        
        base_confidence = 0.6
        
        # Adjust based on evidence strength
        strength = evidence.get('strength', 'weak')
        if strength == 'strong':
            base_confidence += 0.15
        elif strength == 'moderate':
            base_confidence += 0.08
        
        # Adjust based on number of related papers
        if len(relevant_research) >= 3:
            base_confidence += 0.1
        elif len(relevant_research) >= 1:
            base_confidence += 0.05
        
        # Adjust based on classification confidence
        class_confidence = classification.get('confidence', 'low')
        if class_confidence == 'high':
            base_confidence += 0.1
        elif class_confidence == 'moderate':
            base_confidence += 0.05
        
        return min(0.9, max(0.4, base_confidence))
    
    def _requires_manual_verification(
        self,
        classification: Dict[str, Any],
        nli_scores: Dict[str, float]
    ) -> bool:
        """Determine if manual verification is required."""
        
        class_type = classification['type']
        confidence = classification['confidence']
        
        # Always require verification for uncertain or insufficient
        if class_type in ['uncertain', 'insufficient_evidence']:
            return True
        
        # Require verification for low confidence
        if confidence == 'low':
            return True
        
        # Require verification for contradictions
        if class_type == 'contradicted':
            return True
        
        # Require verification when scores are close
        scores_list = list(nli_scores.values())
        max_score = max(scores_list)
        second_max = sorted(scores_list, reverse=True)[1] if len(scores_list) > 1 else 0
        
        if max_score - second_max < 0.2:
            return True
        
        return False
    
    def get_investigation_summary(self, investigations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get summary statistics of all investigations."""
        
        if not investigations:
            return {
                "total_claims": 0,
                "by_classification": {},
                "requires_verification_count": 0,
                "average_confidence": 0.0
            }
        
        by_classification = {}
        verification_count = 0
        total_confidence = 0.0
        
        for inv in investigations:
            class_type = inv['nli_result']['type']
            by_classification[class_type] = by_classification.get(class_type, 0) + 1
            
            if inv.get('requires_verification', False):
                verification_count += 1
            
            total_confidence += inv.get('confidence', 0.5)
        
        return {
            "total_claims": len(investigations),
            "by_classification": by_classification,
            "requires_verification_count": verification_count,
            "average_confidence": round(total_confidence / len(investigations), 3)
        }
