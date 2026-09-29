#!/usr/bin/env python3
"""Collect reviewer comments from OpenReview for Modules 3 & 4.

This script collects public reviews from OpenReview venues.
Only uses publicly available data from accepted papers.

Before running:
1. Review Terms of Service: https://openreview.net/legal/terms
2. Install: pip install openreview-py
"""
import json
from pathlib import Path
from typing import List, Dict
import time


def collect_reviews(venue_id: str, max_papers: int = 100) -> List[Dict]:
    """Collect reviews from a specific OpenReview venue.
    
    Args:
        venue_id: OpenReview venue ID (e.g., 'ICLR.cc/2022/Conference')
        max_papers: Maximum number of papers to collect reviews from
        
    Returns:
        List of review dictionaries
    """
    try:
        import openreview
    except ImportError:
        print("❌ Error: openreview-py not installed")
        print("   Install with: pip install openreview-py")
        return []
    
    print(f"\nConnecting to OpenReview API...")
    client = openreview.Client(baseurl='https://api.openreview.net')
    
    print(f"Fetching papers from {venue_id}...")
    
    try:
        # Get submissions
        submissions = client.get_all_notes(
            invitation=f'{venue_id}/-/Blind_Submission',
            details='replies'
        )
        
        print(f"Found {len(submissions)} submissions")
        
        reviews_data = []
        papers_processed = 0
        
        for paper in submissions[:max_papers]:
            if papers_processed >= max_papers:
                break
            
            papers_processed += 1
            
            # Extract reviews from replies
            reviews = [
                reply for reply in paper.details.get('replies', [])
                if 'Official_Review' in reply.get('invitation', '')
            ]
            
            if not reviews:
                continue
            
            print(f"  Paper {papers_processed}: {paper.content.get('title', 'Untitled')[:60]}... ({len(reviews)} reviews)")
            
            for review in reviews:
                content = review.get('content', {})
                
                # Extract structured review data
                review_data = {
                    'paper_id': paper.id,
                    'paper_title': paper.content.get('title', ''),
                    'review_id': review.get('id', ''),
                    'rating': content.get('rating', ''),
                    'confidence': content.get('confidence', ''),
                    'summary': content.get('summary', ''),
                    'strengths': content.get('strengths', ''),
                    'weaknesses': content.get('weaknesses', ''),
                    'questions': content.get('questions', ''),
                    'correctness': content.get('correctness', ''),
                    'technical_novelty': content.get('technical_novelty_and_significance', ''),
                    'empirical_novelty': content.get('empirical_novelty_and_significance', ''),
                }
                
                # Only add if weaknesses field exists (needed for Module 3)
                if review_data['weaknesses']:
                    reviews_data.append(review_data)
            
            # Be nice to the API
            time.sleep(0.5)
        
        print(f"\n✅ Collected {len(reviews_data)} reviews from {papers_processed} papers")
        return reviews_data
        
    except Exception as e:
        print(f"❌ Error collecting reviews: {e}")
        return []


def save_reviews(reviews: List[Dict], venue_name: str):
    """Save reviews to JSON file."""
    if not reviews:
        print("No reviews to save")
        return
    
    output_dir = Path('data/raw/openreview')
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_file = output_dir / f'reviews_{venue_name}.json'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(reviews, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Saved to {output_file}")
    
    # Print summary
    print("\nReview Summary:")
    print(f"  Total reviews: {len(reviews)}")
    print(f"  Unique papers: {len(set(r['paper_id'] for r in reviews))}")
    
    # Count non-empty weakness sections
    with_weaknesses = sum(1 for r in reviews if r['weaknesses'])
    print(f"  Reviews with weaknesses: {with_weaknesses}")


def main():
    """Main collection workflow."""
    print("="*70)
    print("OPENREVIEW REVIEW COLLECTOR")
    print("="*70)
    
    print("\n⚠️  IMPORTANT: Before proceeding, ensure you have:")
    print("  1. Read OpenReview Terms of Service: https://openreview.net/legal/terms")
    print("  2. Understand you're collecting PUBLIC reviews only")
    print("  3. Will use data ethically for research purposes")
    
    response = input("\nHave you reviewed the terms and agree to ethical use? (yes/no): ").lower()
    if response != 'yes':
        print("❌ Cancelled. Please review terms first.")
        return
    
    print("\n" + "="*70)
    print("VENUE SELECTION")
    print("="*70)
    print("\nRecommended venues (complete data available):")
    print("  1. ICLR.cc/2022/Conference (Machine Learning)")
    print("  2. ICLR.cc/2021/Conference (Machine Learning)")
    print("  3. aclweb.org/ACL/2022/Conference (NLP) - if available")
    
    venues = {
        '1': ('ICLR.cc/2022/Conference', 'iclr2022'),
        '2': ('ICLR.cc/2021/Conference', 'iclr2021'),
        '3': ('aclweb.org/ACL/2022/Conference', 'acl2022'),
    }
    
    choice = input("\nSelect venue (1-3) or enter custom venue ID: ").strip()
    
    if choice in venues:
        venue_id, venue_name = venues[choice]
    else:
        venue_id = choice
        venue_name = venue_id.replace('/', '_').replace('.', '_')
    
    max_papers = input("How many papers to collect from? (recommended: 50-100): ").strip()
    try:
        max_papers = int(max_papers)
    except ValueError:
        print("Invalid number, using default: 100")
        max_papers = 100
    
    print(f"\n{'='*70}")
    print(f"Collecting from: {venue_id}")
    print(f"Max papers: {max_papers}")
    print(f"{'='*70}")
    
    # Collect reviews
    reviews = collect_reviews(venue_id, max_papers)
    
    if reviews:
        # Save to file
        save_reviews(reviews, venue_name)
        
        # Show example
        print("\nExample review (first weakness section):")
        print("-" * 70)
        for review in reviews[:1]:
            print(f"Paper: {review['paper_title'][:60]}...")
            print(f"Rating: {review['rating']}")
            print(f"Weaknesses:\n{review['weaknesses'][:300]}...")
            print("-" * 70)
        
        print("\n✅ Collection complete!")
        print("\nNext steps:")
        print("  1. Verify data in data/raw/openreview/")
        print("  2. Run weakness categorization on collected reviews")
        print("  3. Evaluate Module 3 baseline on this data")
    else:
        print("\n❌ No reviews collected. Check venue ID and try again.")
    
    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    main()
