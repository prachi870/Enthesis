"""
Claim Extractor - Extract and categorize research claims from papers.

This module extracts claims from research papers and categorizes them by type:
- Novelty claims
- Performance claims
- Method claims
- Dataset claims
- Comparison claims

Only extracts claims that are actually present in the paper text.
"""
import re
from typing import List, Dict, Any


class ClaimExtractor:
    """Extract and categorize research claims from paper text."""
    
    # Claim type patterns with context windows
    CLAIM_PATTERNS = {
        "novelty": [
            (r'we\s+are\s+the\s+first\s+to\s+[^.]{10,150}', "First-to-do statement"),
            (r'(?:novel|new|original)\s+(?:approach|method|framework|technique|model|architecture)\s+[^.]{10,150}', "Novel method introduction"),
            (r'we\s+(?:propose|present|introduce)\s+(?:a|an)\s+(?:novel|new)[^.]{10,150}', "Proposal of novelty"),
            (r'to\s+(?:our|the\s+best\s+of\s+our)\s+knowledge[^.]{10,150}', "Knowledge gap claim"),
            (r'(?:no\s+)?previous\s+(?:work|study|research)\s+has[^.]{10,150}', "Prior work comparison"),
            (r'(?:first|pioneering|unprecedented)\s+(?:work|study|attempt|effort)[^.]{10,150}', "First work claim"),
        ],
        "performance": [
            (r'(?:achieve|achieves|achieved|reaching|obtains?)\s+(?:state-of-the-art|sota|best|superior|highest|record)[^.]{10,150}', "State-of-the-art claim"),
            (r'(?:outperforms?|better\s+than|exceeds?|surpasses?|improves?\s+(?:over|upon))[^.]{10,150}', "Outperformance claim"),
            (r'(?:improves?|improvement|gain|increase)\s+(?:of|by|in)\s+\d+[^.]{10,150}', "Quantitative improvement"),
            (r'reduces?\s+(?:by|to)\s+\d+[^.]{10,150}', "Reduction claim"),
            (r'(?:\d+(?:\.\d+)?%|factor\s+of\s+\d+)\s+(?:better|improvement|faster|more\s+accurate)[^.]{10,150}', "Percentage improvement"),
            (r'shows?\s+(?:significant|substantial|considerable|dramatic)\s+improvements?[^.]{10,150}', "Qualitative improvement"),
        ],
        "method": [
            (r'we\s+(?:use|employ|apply|adopt|utilize)\s+[^.]{10,150}', "Method application"),
            (r'(?:based\s+on|building\s+on|extending|adapting)\s+[^.]{10,150}', "Method derivation"),
            (r'(?:algorithm|model|architecture|framework|approach)\s+(?:consists\s+of|comprises|includes)[^.]{10,150}', "Method composition"),
            (r'we\s+(?:design|develop|implement|construct)\s+[^.]{10,150}', "Method development"),
            (r'(?:training|optimization|learning)\s+(?:procedure|process|strategy)[^.]{10,150}', "Training method"),
        ],
        "dataset": [
            (r'we\s+(?:evaluate|test|experiment|validate)\s+on\s+[^.]{10,150}', "Dataset usage"),
            (r'(?:trained|evaluated|tested)\s+(?:on|using|with)\s+(?:the\s+)?[A-Z][A-Za-z0-9\-]+\s+(?:dataset|corpus|benchmark)[^.]{10,150}', "Named dataset"),
            (r'we\s+(?:collect|gathered|compiled|curated)\s+[^.]{10,150}', "Dataset collection"),
            (r'dataset\s+(?:consists\s+of|contains|comprises)\s+[^.]{10,150}', "Dataset description"),
            (r'(?:\d+[,\d]*)\s+(?:examples|samples|instances|pairs|documents)[^.]{10,150}', "Dataset size"),
        ],
        "comparison": [
            (r'compared?\s+(?:to|against|with)\s+[^.]{10,150}', "Direct comparison"),
            (r'(?:versus|vs\.?)\s+[^.]{10,150}', "Versus comparison"),
            (r'(?:baseline|previous|prior|existing)\s+(?:methods?|approaches?|models?|systems?)[^.]{10,150}', "Baseline comparison"),
            (r'unlike\s+(?:previous|prior|existing)[^.]{10,150}', "Contrast comparison"),
            (r'in\s+contrast\s+to[^.]{10,150}', "Contrast statement"),
        ]
    }
    
    def __init__(self):
        pass
    
    def extract_claims(self, text: str, paper_id: str = None) -> List[Dict[str, Any]]:
        """
        Extract all claims from paper text.
        
        Args:
            text: Full paper text
            paper_id: Optional paper identifier
            
        Returns:
            List of claim dictionaries with metadata
        """
        claims = []
        claim_id = 0
        
        # Split text into sentences for section detection
        sentences = self._split_sentences(text)
        
        for claim_type, patterns in self.CLAIM_PATTERNS.items():
            for pattern, description in patterns:
                matches = re.finditer(pattern, text, re.IGNORECASE | re.DOTALL)
                
                for match in matches:
                    claim_id += 1
                    claim_text = match.group(0)
                    
                    # Clean up the claim text
                    claim_text = self._clean_claim(claim_text)
                    
                    # Skip if too short or too long
                    if len(claim_text) < 20 or len(claim_text) > 500:
                        continue
                    
                    # Find the section this claim appears in
                    section = self._find_section(match.start(), text)
                    
                    # Extract evidence context (surrounding sentences)
                    evidence = self._extract_evidence(match.start(), match.end(), text, sentences)
                    
                    # Find related numbers/metrics if present
                    metrics = self._extract_metrics(claim_text)
                    
                    # Calculate confidence based on claim clarity
                    confidence = self._calculate_confidence(claim_text, claim_type)
                    
                    claims.append({
                        "claim_id": f"{paper_id or 'paper'}_{claim_type}_{claim_id}",
                        "claim_text": claim_text,
                        "claim_type": claim_type,
                        "description": description,
                        "section": section,
                        "evidence": evidence,
                        "metrics": metrics,
                        "confidence": confidence,
                        "position": match.start(),
                        "related_patterns": self._find_related_patterns(claim_text, claim_type),
                    })
        
        # Sort by position in document
        claims.sort(key=lambda x: x["position"])
        
        # Remove duplicates (similar claims)
        claims = self._deduplicate_claims(claims)
        
        return claims
    
    def _split_sentences(self, text: str) -> List[tuple]:
        """Split text into sentences with positions."""
        # Simple sentence splitting
        sentence_pattern = r'([^.!?]+[.!?]+)'
        sentences = []
        for match in re.finditer(sentence_pattern, text):
            sentences.append((match.start(), match.end(), match.group(0)))
        return sentences
    
    def _clean_claim(self, claim: str) -> str:
        """Clean up claim text."""
        # Remove extra whitespace
        claim = re.sub(r'\s+', ' ', claim)
        # Trim
        claim = claim.strip()
        # Capitalize first letter
        if claim:
            claim = claim[0].upper() + claim[1:]
        return claim
    
    def _find_section(self, position: int, text: str) -> str:
        """Find which section of the paper this claim appears in."""
        # Look backwards for section headers
        preceding_text = text[:position]
        
        # Common section patterns
        sections = [
            (r'(?:^|\n)\s*(?:abstract|ABSTRACT)\s*(?:\n|$)', "Abstract"),
            (r'(?:^|\n)\s*(?:\d+\.?\s+)?(?:introduction|INTRODUCTION)\s*(?:\n|$)', "Introduction"),
            (r'(?:^|\n)\s*(?:\d+\.?\s+)?(?:related\s+work|RELATED\s+WORK|background|BACKGROUND)\s*(?:\n|$)', "Related Work"),
            (r'(?:^|\n)\s*(?:\d+\.?\s+)?(?:method|METHOD|methodology|METHODOLOGY|approach|APPROACH)\s*(?:\n|$)', "Methodology"),
            (r'(?:^|\n)\s*(?:\d+\.?\s+)?(?:experiment|EXPERIMENT|evaluation|EVALUATION|results|RESULTS)\s*(?:\n|$)', "Experiments"),
            (r'(?:^|\n)\s*(?:\d+\.?\s+)?(?:discussion|DISCUSSION)\s*(?:\n|$)', "Discussion"),
            (r'(?:^|\n)\s*(?:\d+\.?\s+)?(?:conclusion|CONCLUSION)\s*(?:\n|$)', "Conclusion"),
        ]
        
        last_section = "Unknown"
        last_position = 0
        
        for pattern, section_name in sections:
            matches = list(re.finditer(pattern, preceding_text))
            if matches:
                match = matches[-1]  # Get the last match
                if match.start() > last_position:
                    last_position = match.start()
                    last_section = section_name
        
        return last_section
    
    def _extract_evidence(self, start: int, end: int, text: str, sentences: List[tuple]) -> str:
        """Extract surrounding context as evidence."""
        # Find sentences that overlap with claim
        relevant_sentences = []
        for s_start, s_end, s_text in sentences:
            # Include sentences that contain or are near the claim
            if (s_start <= end and s_end >= start) or \
               (abs(s_start - end) < 100) or \
               (abs(start - s_end) < 100):
                relevant_sentences.append(s_text.strip())
        
        # Return up to 3 surrounding sentences
        evidence = ' '.join(relevant_sentences[:3])
        if len(evidence) > 500:
            evidence = evidence[:497] + "..."
        
        return evidence or "Evidence unavailable"
    
    def _extract_metrics(self, claim_text: str) -> List[str]:
        """Extract numerical metrics from claim."""
        metrics = []
        
        # Find percentages
        percentages = re.findall(r'\d+(?:\.\d+)?%', claim_text)
        metrics.extend(percentages)
        
        # Find numbers with units
        numbers = re.findall(r'\d+(?:\.\d+)?\s*(?:points?|pp|percent|×|times|factors?)', claim_text, re.I)
        metrics.extend(numbers)
        
        # Find metric names with values
        metric_patterns = re.findall(r'(?:accuracy|precision|recall|f1|score|error|loss|bleu|rouge)\s*(?:of|:)?\s*\d+(?:\.\d+)?', claim_text, re.I)
        metrics.extend(metric_patterns)
        
        return list(set(metrics))[:5]  # Return unique metrics, max 5
    
    def _calculate_confidence(self, claim_text: str, claim_type: str) -> float:
        """Calculate confidence in claim extraction."""
        confidence = 0.7  # Base confidence
        
        # Increase confidence if claim has specific markers
        if re.search(r'\d+(?:\.\d+)?%', claim_text):
            confidence += 0.1  # Has percentage
        
        if re.search(r'(?:significantly|substantially|considerably)', claim_text, re.I):
            confidence += 0.05  # Has strong language
        
        if len(claim_text) > 50 and len(claim_text) < 200:
            confidence += 0.05  # Good length
        
        # Decrease confidence for hedging language
        if re.search(r'(?:might|may|possibly|perhaps|potentially)', claim_text, re.I):
            confidence -= 0.1
        
        return min(0.95, max(0.5, confidence))
    
    def _find_related_patterns(self, claim_text: str, claim_type: str) -> List[str]:
        """Find what patterns matched this claim."""
        patterns = []
        for pattern, description in self.CLAIM_PATTERNS[claim_type]:
            if re.search(pattern, claim_text, re.IGNORECASE):
                patterns.append(description)
        return patterns[:2]  # Return top 2 matching patterns
    
    def _deduplicate_claims(self, claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate or very similar claims."""
        if not claims:
            return claims
        
        unique_claims = []
        seen_texts = set()
        
        for claim in claims:
            # Create a normalized version for comparison
            normalized = claim["claim_text"].lower()
            normalized = re.sub(r'\s+', ' ', normalized)
            normalized = re.sub(r'[^\w\s]', '', normalized)
            
            # Check if we've seen something very similar
            is_duplicate = False
            for seen in seen_texts:
                # Calculate simple similarity (word overlap)
                words1 = set(normalized.split())
                words2 = set(seen.split())
                if len(words1) > 0 and len(words2) > 0:
                    overlap = len(words1 & words2) / len(words1 | words2)
                    if overlap > 0.7:  # 70% word overlap = duplicate
                        is_duplicate = True
                        break
            
            if not is_duplicate:
                unique_claims.append(claim)
                seen_texts.add(normalized)
        
        return unique_claims
    
    def get_claims_summary(self, claims: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get summary statistics of extracted claims."""
        if not claims:
            return {
                "total_claims": 0,
                "by_type": {},
                "by_section": {},
                "average_confidence": 0.0,
                "high_confidence_claims": 0
            }
        
        by_type = {}
        by_section = {}
        
        for claim in claims:
            # Count by type
            claim_type = claim["claim_type"]
            by_type[claim_type] = by_type.get(claim_type, 0) + 1
            
            # Count by section
            section = claim["section"]
            by_section[section] = by_section.get(section, 0) + 1
        
        avg_confidence = sum(c["confidence"] for c in claims) / len(claims)
        high_confidence = sum(1 for c in claims if c["confidence"] > 0.8)
        
        return {
            "total_claims": len(claims),
            "by_type": by_type,
            "by_section": by_section,
            "average_confidence": round(avg_confidence, 3),
            "high_confidence_claims": high_confidence
        }
