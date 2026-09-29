#!/usr/bin/env python3
"""Download all required datasets for Enthesis Phase 1.

Run this script to automatically download the easiest datasets.
Manual steps required for OpenReview and Clarity corpus.
"""
from pathlib import Path
import json
import sys


def download_scifact():
    """Download SciFact dataset (Apache 2.0 license - verified)."""
    print("\n" + "="*70)
    print("DOWNLOADING SCIFACT (Module 2 - Novelty)")
    print("="*70)
    print("License: Apache 2.0 ✅")
    print("Source: https://github.com/allenai/scifact")
    
    try:
        import requests
        import zipfile
        from io import BytesIO
        
        print("\nDownloading SciFact from GitHub...")
        # Download directly from GitHub repo
        base_url = "https://raw.githubusercontent.com/allenai/scifact/master/data"
        files = {
            "claims_train.jsonl": f"{base_url}/claims_train.jsonl",
            "claims_dev.jsonl": f"{base_url}/claims_dev.jsonl",
            "corpus.jsonl": f"{base_url}/corpus.jsonl"
        }
        
        # Save locally
        output_dir = Path("data/raw/scifact")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save as JSON for easier inspection
        for split in claims_dataset.keys():
            output_file = output_dir / f"claims_{split}.json"
            with open(output_file, 'w') as f:
                json.dump(claims_dataset[split].to_dict(), f, indent=2)
            print(f"  ✅ Saved {output_file}")
        
        # Save corpus
        corpus_file = output_dir / "corpus.json"
        with open(corpus_file, 'w') as f:
            json.dump(corpus_dataset['train'].to_dict(), f, indent=2)
        print(f"  ✅ Saved {corpus_file}")
        
        print(f"\n✅ SciFact downloaded successfully!")
        print(f"   Training claims: {len(claims_dataset['train'])}")
        print(f"   Validation claims: {len(claims_dataset['validation'])}")
        print(f"   Corpus documents: {len(corpus_dataset['train'])}")
        
        return True
        
    except ImportError:
        print("❌ Error: 'datasets' package not installed")
        print("   Install with: pip install datasets")
        return False
    except Exception as e:
        print(f"❌ Error downloading SciFact: {e}")
        return False


def download_scierc():
    """Download SciERC dataset (license must be verified first)."""
    print("\n" + "="*70)
    print("DOWNLOADING SCIERC (Module 1 - Related Work)")
    print("="*70)
    print("⚠️  License: AI2 License - MUST BE VERIFIED")
    print("   Please read: https://github.com/allenai/sciERC/blob/master/LICENSE")
    
    response = input("\nHave you read and accepted the license? (yes/no): ").lower()
    if response != 'yes':
        print("❌ Skipping SciERC download. Please verify license first.")
        return False
    
    try:
        from datasets import load_dataset
        
        print("\nDownloading SciERC dataset...")
        dataset = load_dataset("DFKI-SLT/scierc")
        
        # Save locally
        output_dir = Path("data/raw/scierc")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        for split in dataset.keys():
            output_file = output_dir / f"{split}.json"
            with open(output_file, 'w') as f:
                json.dump(dataset[split].to_dict(), f, indent=2)
            print(f"  ✅ Saved {output_file}")
        
        print(f"\n✅ SciERC downloaded successfully!")
        print(f"   Training documents: {len(dataset['train'])}")
        print(f"   Validation documents: {len(dataset['validation'])}")
        print(f"   Test documents: {len(dataset['test'])}")
        
        return True
        
    except ImportError:
        print("❌ Error: 'datasets' package not installed")
        print("   Install with: pip install datasets")
        return False
    except Exception as e:
        print(f"❌ Error downloading SciERC: {e}")
        return False


def download_peerread():
    """Instructions for downloading PeerRead (for clarity corpus)."""
    print("\n" + "="*70)
    print("DOWNLOADING PEERREAD (Module 5 - Clarity)")
    print("="*70)
    print("License: MIT ✅")
    print("Source: https://github.com/allenai/PeerRead")
    
    print("\nPeerRead is best downloaded via git clone:")
    print("  git clone https://github.com/allenai/PeerRead.git data/raw/peerread")
    print("\nOr download manually from the GitHub releases.")
    
    response = input("\nWould you like instructions to download now? (yes/no): ").lower()
    if response == 'yes':
        print("\nDownload instructions:")
        print("1. Open terminal in the enthesis directory")
        print("2. Run: git clone https://github.com/allenai/PeerRead.git data/raw/peerread")
        print("3. After download, use data from: data/raw/peerread/data/acl_2017/")
        print("4. This contains accepted/rejected papers with labels")
    
    return False  # Manual download required


def setup_openreview():
    """Instructions for setting up OpenReview access."""
    print("\n" + "="*70)
    print("OPENREVIEW SETUP (Modules 3 & 4 - Weaknesses & Reviewer Feedback)")
    print("="*70)
    print("⚠️  Terms of Service must be reviewed")
    print("   Please read: https://openreview.net/legal/terms")
    
    print("\nOpenReview requires custom collection script:")
    print("1. Install: pip install openreview-py")
    print("2. Review Terms of Service")
    print("3. Run: python scripts/collect_openreview.py")
    print("4. This will collect ~100 reviews from ICLR 2022")
    
    return False  # Manual setup required


def verify_downloads():
    """Verify which datasets have been downloaded."""
    print("\n" + "="*70)
    print("DATASET VERIFICATION")
    print("="*70)
    
    datasets = {
        'SciFact': {
            'path': Path('data/raw/scifact/claims_train.json'),
            'module': 'Module 2 (Novelty)',
            'required': True,
        },
        'SciERC': {
            'path': Path('data/raw/scierc/train.json'),
            'module': 'Module 1 (Related Work)',
            'required': True,
        },
        'PeerRead/Clarity': {
            'path': Path('data/raw/peerread/data/acl_2017'),
            'module': 'Module 5 (Clarity)',
            'required': True,
        },
        'OpenReview': {
            'path': Path('data/raw/openreview/reviews.json'),
            'module': 'Modules 3 & 4 (Weaknesses, Feedback)',
            'required': True,
        },
    }
    
    print("\nDataset Status:")
    downloaded = 0
    total = len(datasets)
    
    for name, info in datasets.items():
        exists = info['path'].exists()
        status = "✅ Downloaded" if exists else "❌ Not found"
        print(f"\n{name}:")
        print(f"  Status: {status}")
        print(f"  Module: {info['module']}")
        print(f"  Path:   {info['path']}")
        
        if exists:
            downloaded += 1
    
    print(f"\n{'='*70}")
    print(f"Progress: {downloaded}/{total} datasets downloaded")
    
    if downloaded == total:
        print("✅ All datasets ready! You can now run baseline evaluations.")
    else:
        print("⚠️  Some datasets missing. Follow instructions above to download.")
    
    print("="*70)


def main():
    """Main download workflow."""
    print("\n" + "="*70)
    print("ENTHESIS DATASET DOWNLOADER")
    print("="*70)
    print("\nThis script will help you download all required datasets.")
    print("Some datasets require manual steps (license verification, API setup).")
    
    # Check if datasets library is installed
    try:
        import datasets
    except ImportError:
        print("\n❌ Error: 'datasets' library not installed")
        print("   Install with: pip install datasets")
        print("\nRun this command first, then rerun this script.")
        sys.exit(1)
    
    print("\n" + "="*70)
    print("DOWNLOAD PLAN")
    print("="*70)
    print("\n1. SciFact (automatic) - Apache 2.0 ✅")
    print("2. SciERC (automatic with license confirmation) - AI2 License ⚠️")
    print("3. PeerRead (manual git clone) - MIT ✅")
    print("4. OpenReview (custom script) - Terms of Service ⚠️")
    
    response = input("\nProceed with automatic downloads? (yes/no): ").lower()
    if response != 'yes':
        print("Cancelled. Run this script again when ready.")
        sys.exit(0)
    
    # Download datasets
    results = {}
    results['scifact'] = download_scifact()
    results['scierc'] = download_scierc()
    
    # Manual instructions
    download_peerread()
    setup_openreview()
    
    # Verify all downloads
    print("\n")
    verify_downloads()
    
    # Next steps
    print("\n" + "="*70)
    print("NEXT STEPS")
    print("="*70)
    print("\n1. Complete manual downloads (PeerRead, OpenReview)")
    print("2. Verify all licenses documented in docs/datasets.md")
    print("3. Run baseline evaluations:")
    print("   - python experiments/evaluate_module1.py")
    print("   - python experiments/evaluate_module2.py")
    print("   - python experiments/evaluate_module3.py")
    print("   - python experiments/evaluate_module5.py")
    print("4. Update experiments/results/results_table.md with scores")
    print("\nThen Phase 1 is complete! 🎉")
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
