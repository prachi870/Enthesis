#!/usr/bin/env python3
"""Simple dataset downloader using direct downloads (no HuggingFace Datasets dependency)."""
import json
import urllib.request
from pathlib import Path


def download_file(url: str, output_path: Path, description: str = ""):
    """Download a file from URL to output path."""
    try:
        print(f"  Downloading {description}...")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with urllib.request.urlopen(url) as response:
            data = response.read()
            with open(output_path, 'wb') as f:
                f.write(data)
        
        size_kb = len(data) / 1024
        print(f"  ✅ Saved {output_path} ({size_kb:.1f} KB)")
        return True
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def download_scifact():
    """Download SciFact directly from GitHub."""
    print("\n" + "="*70)
    print("DOWNLOADING SCIFACT (Module 2 - Novelty)")
    print("="*70)
    print("License: Apache 2.0 ✅")
    print("Source: https://github.com/allenai/scifact")
    
    base_url = "https://raw.githubusercontent.com/allenai/scifact/master/data"
    output_dir = Path("data/raw/scifact")
    
    files = {
        "claims_train.jsonl": f"{base_url}/claims_train.jsonl",
        "claims_dev.jsonl": f"{base_url}/claims_dev.jsonl",
        "corpus.jsonl": f"{base_url}/corpus.jsonl"
    }
    
    print("\nDownloading SciFact files from GitHub...")
    success = True
    for filename, url in files.items():
        output_path = output_dir / filename
        if not download_file(url, output_path, filename):
            success = False
    
    if success:
        # Count records
        try:
            with open(output_dir / "claims_train.jsonl") as f:
                train_count = sum(1 for _ in f)
            with open(output_dir / "corpus.jsonl") as f:
                corpus_count = sum(1 for _ in f)
            
            print(f"\n✅ SciFact downloaded successfully!")
            print(f"   Training claims: {train_count}")
            print(f"   Corpus documents: {corpus_count}")
            return True
        except Exception as e:
            print(f"\n✅ Files downloaded but error counting: {e}")
            return True
    else:
        print("\n❌ SciFact download had errors")
        return False


def download_scierc():
    """Download SciERC directly from GitHub."""
    print("\n" + "="*70)
    print("DOWNLOADING SCIERC (Module 1 - Related Work)")
    print("="*70)
    print("⚠️  License: AI2 License - MUST BE VERIFIED")
    print("   Please read: https://github.com/allenai/sciERC/blob/master/LICENSE")
    
    response = input("\nHave you read and accepted the license? (yes/no): ").lower()
    if response != 'yes':
        print("❌ Skipping SciERC download. Please verify license first.")
        return False
    
    base_url = "https://raw.githubusercontent.com/allenai/sciERC/master/processed_data/json"
    output_dir = Path("data/raw/scierc")
    
    files = {
        "train.json": f"{base_url}/train.json",
        "dev.json": f"{base_url}/dev.json",
        "test.json": f"{base_url}/test.json"
    }
    
    print("\nDownloading SciERC files from GitHub...")
    success = True
    for filename, url in files.items():
        output_path = output_dir / filename
        if not download_file(url, output_path, filename):
            success = False
    
    if success:
        # Count documents
        try:
            with open(output_dir / "train.json") as f:
                train_data = json.load(f)
            
            print(f"\n✅ SciERC downloaded successfully!")
            print(f"   Training documents: {len(train_data)}")
            return True
        except Exception as e:
            print(f"\n✅ Files downloaded but error counting: {e}")
            return True
    else:
        print("\n❌ SciERC download had errors")
        return False


def main():
    """Main download workflow."""
    print("\n" + "="*70)
    print("ENTHESIS SIMPLE DATASET DOWNLOADER")
    print("="*70)
    print("\nThis script downloads datasets directly from GitHub.")
    print("No HuggingFace Datasets library needed!")
    
    print("\n" + "="*70)
    print("DOWNLOAD PLAN")
    print("="*70)
    print("\n1. SciFact (automatic) - Apache 2.0 ✅")
    print("2. SciERC (automatic with license confirmation) - AI2 License ⚠️")
    print("\nNote: PeerRead and OpenReview require separate steps:")
    print("  - PeerRead: git clone https://github.com/allenai/PeerRead.git data/raw/peerread")
    print("  - OpenReview: python scripts/collect_openreview.py")
    
    response = input("\nProceed with automatic downloads? (yes/no): ").lower()
    if response != 'yes':
        print("Cancelled.")
        return
    
    # Download datasets
    results = {}
    results['scifact'] = download_scifact()
    results['scierc'] = download_scierc()
    
    # Summary
    print("\n" + "="*70)
    print("DOWNLOAD SUMMARY")
    print("="*70)
    
    for name, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        print(f"{status}: {name}")
    
    # Next steps
    print("\n" + "="*70)
    print("NEXT STEPS")
    print("="*70)
    print("\n1. Download PeerRead:")
    print("   git clone https://github.com/allenai/PeerRead.git data/raw/peerread")
    print("\n2. Collect OpenReview data:")
    print("   python scripts/collect_openreview.py")
    print("\n3. Verify all datasets:")
    print("   python scripts/verify_datasets.py")
    print("\n4. Run baseline evaluations and complete Phase 1!")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
