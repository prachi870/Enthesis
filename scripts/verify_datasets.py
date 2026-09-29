#!/usr/bin/env python3
"""Verify all required datasets are downloaded and accessible."""
from pathlib import Path
import json


def check_file(path: Path, description: str) -> bool:
    """Check if a file exists and is readable."""
    if not path.exists():
        print(f"  ❌ NOT FOUND: {path}")
        return False
    
    try:
        # Try to read and parse if JSON
        if path.suffix == '.json':
            with open(path) as f:
                data = json.load(f)
            size = len(data) if isinstance(data, (list, dict)) else "unknown"
            print(f"  ✅ FOUND: {path} ({size} records)")
        else:
            size = path.stat().st_size // 1024  # KB
            print(f"  ✅ FOUND: {path} ({size} KB)")
        return True
    except Exception as e:
        print(f"  ⚠️  FOUND but error reading: {path}")
        print(f"     Error: {e}")
        return False


def verify_scifact():
    """Verify SciFact dataset (Module 2)."""
    print("\n" + "="*70)
    print("MODULE 2: SciFact (Novelty Check)")
    print("="*70)
    
    base_dir = Path("data/raw/scifact")
    files = [
        (base_dir / "claims_train.json", "Training claims"),
        (base_dir / "claims_validation.json", "Validation claims"),
        (base_dir / "corpus.json", "Evidence corpus"),
    ]
    
    results = []
    for file_path, description in files:
        print(f"\n{description}:")
        results.append(check_file(file_path, description))
    
    if all(results):
        print("\n✅ SciFact is ready for baseline evaluation!")
        return True
    else:
        print("\n❌ SciFact incomplete. Run: python scripts/download_datasets.py")
        return False


def verify_scierc():
    """Verify SciERC dataset (Module 1)."""
    print("\n" + "="*70)
    print("MODULE 1: SciERC (Related Work)")
    print("="*70)
    
    base_dir = Path("data/raw/scierc")
    files = [
        (base_dir / "train.json", "Training data"),
        (base_dir / "validation.json", "Validation data"),
        (base_dir / "test.json", "Test data"),
    ]
    
    results = []
    for file_path, description in files:
        print(f"\n{description}:")
        results.append(check_file(file_path, description))
    
    if all(results):
        print("\n✅ SciERC is ready for baseline evaluation!")
        return True
    else:
        print("\n❌ SciERC incomplete. Run: python scripts/download_datasets.py")
        return False


def verify_openreview():
    """Verify OpenReview data (Modules 3 & 4)."""
    print("\n" + "="*70)
    print("MODULES 3 & 4: OpenReview (Weaknesses & Reviewer Feedback)")
    print("="*70)
    
    base_dir = Path("data/raw/openreview")
    
    # Check for any reviews file
    if not base_dir.exists():
        print("\n❌ OpenReview directory not found")
        print("   Run: python scripts/collect_openreview.py")
        return False
    
    review_files = list(base_dir.glob("reviews_*.json"))
    
    if not review_files:
        print("\n❌ No review files found")
        print("   Run: python scripts/collect_openreview.py")
        return False
    
    print(f"\nFound {len(review_files)} review file(s):")
    for file_path in review_files:
        check_file(file_path, file_path.name)
    
    # Check if reviews have required fields
    try:
        with open(review_files[0]) as f:
            reviews = json.load(f)
        
        if len(reviews) < 50:
            print(f"\n⚠️  Warning: Only {len(reviews)} reviews found (recommend 100+)")
            print("   Consider collecting more with: python scripts/collect_openreview.py")
        else:
            print(f"\n✅ OpenReview data looks good ({len(reviews)} reviews)")
        
        # Check for weaknesses field (needed for Module 3)
        with_weaknesses = sum(1 for r in reviews if r.get('weaknesses'))
        print(f"   Reviews with weaknesses section: {with_weaknesses}")
        
        if with_weaknesses < 30:
            print("   ⚠️  Warning: Few reviews have weaknesses. May need more data.")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error reading reviews: {e}")
        return False


def verify_clarity_corpus():
    """Verify clarity corpus (Module 5)."""
    print("\n" + "="*70)
    print("MODULE 5: Clarity Corpus (Accepted/Rejected Papers)")
    print("="*70)
    
    # Check for PeerRead
    peerread_dir = Path("data/raw/peerread/data/acl_2017")
    
    if peerread_dir.exists():
        print("\n✅ PeerRead/ACL 2017 directory found:")
        print(f"   {peerread_dir}")
        
        # Count papers
        subdirs = ['train', 'dev', 'test']
        total_papers = 0
        for subdir in subdirs:
            subdir_path = peerread_dir / subdir
            if subdir_path.exists():
                review_files = list(subdir_path.glob("*.json"))
                print(f"   {subdir}: {len(review_files)} papers")
                total_papers += len(review_files)
        
        if total_papers > 0:
            print(f"\n✅ Clarity corpus ready ({total_papers} total papers)")
            return True
        else:
            print("\n⚠️  PeerRead directory exists but no papers found")
            return False
    else:
        print("\n❌ PeerRead/Clarity corpus not found")
        print("   Run: git clone https://github.com/allenai/PeerRead.git data/raw/peerread")
        return False


def main():
    """Run all verification checks."""
    print("="*70)
    print("ENTHESIS DATASET VERIFICATION")
    print("="*70)
    print("\nChecking all required datasets...")
    
    results = {
        'SciFact (Module 2)': verify_scifact(),
        'SciERC (Module 1)': verify_scierc(),
        'OpenReview (Modules 3 & 4)': verify_openreview(),
        'Clarity Corpus (Module 5)': verify_clarity_corpus(),
    }
    
    # Summary
    print("\n" + "="*70)
    print("VERIFICATION SUMMARY")
    print("="*70)
    
    for dataset, status in results.items():
        status_str = "✅ Ready" if status else "❌ Missing"
        print(f"{status_str:12s} {dataset}")
    
    ready_count = sum(results.values())
    total_count = len(results)
    
    print(f"\nDatasets ready: {ready_count}/{total_count}")
    
    if ready_count == total_count:
        print("\n🎉 All datasets ready!")
        print("\nNext steps:")
        print("  1. Run baseline evaluations")
        print("  2. Measure scores on real data")
        print("  3. Update experiments/results/results_table.md")
        print("  4. Complete Phase 1!")
    else:
        print("\n⚠️  Some datasets missing")
        print("\nDownload missing datasets:")
        print("  python scripts/download_datasets.py")
        print("  python scripts/collect_openreview.py")
        print("  git clone https://github.com/allenai/PeerRead.git data/raw/peerread")
    
    print("="*70 + "\n")
    
    # Exit code
    return 0 if ready_count == total_count else 1


if __name__ == "__main__":
    exit(main())
