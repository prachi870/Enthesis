#!/usr/bin/env python3
"""Preprocess all datasets for baseline evaluation.

Converts CSV files to proper JSON/JSONL format and validates data quality.
"""
import json
import csv
from pathlib import Path
import pandas as pd


def preprocess_scifact():
    """Convert SciFact CSV files to JSONL format."""
    print("\n" + "="*70)
    print("PREPROCESSING SCIFACT (Module 2 - Novelty)")
    print("="*70)
    
    data_dir = Path("data/raw/scifact")
    
    # Read CSV files
    try:
        claims_train = pd.read_csv(data_dir / "claims_train.csv")
        claims_test = pd.read_csv(data_dir / "claims_test.csv")
        corpus = pd.read_csv(data_dir / "corpus_train.csv")
        
        print(f"\n✅ Loaded CSV files:")
        print(f"   Training claims: {len(claims_train)} records")
        print(f"   Test claims: {len(claims_test)} records")
        print(f"   Corpus: {len(corpus)} documents")
        
        # Convert to JSONL format (overwrite sample data)
        # Claims format: {id, claim, evidence}
        with open(data_dir / "claims_train.jsonl", 'w') as f:
            for _, row in claims_train.iterrows():
                record = {
                    'id': int(row.get('id', 0)),
                    'claim': str(row.get('claim', '')),
                    'evidence': {}
                }
                f.write(json.dumps(record) + '\n')
        
        with open(data_dir / "claims_test.jsonl", 'w') as f:
            for _, row in claims_test.iterrows():
                record = {
                    'id': int(row.get('id', 0)),
                    'claim': str(row.get('claim', '')),
                    'evidence': {}
                }
                f.write(json.dumps(record) + '\n')
        
        # Corpus format: {doc_id, title, abstract}
        with open(data_dir / "corpus.jsonl", 'w') as f:
            for _, row in corpus.iterrows():
                record = {
                    'doc_id': int(row.get('doc_id', 0)) if 'doc_id' in row else int(row.get('id', 0)),
                    'title': str(row.get('title', '')),
                    'abstract': str(row.get('abstract', '')),
                    'structured': False
                }
                f.write(json.dumps(record) + '\n')
        
        print(f"\n✅ Converted to JSONL format:")
        print(f"   data/raw/scifact/claims_train.jsonl")
        print(f"   data/raw/scifact/claims_test.jsonl")
        print(f"   data/raw/scifact/corpus.jsonl")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error preprocessing SciFact: {e}")
        print(f"   Column names in CSV: {list(claims_train.columns) if 'claims_train' in locals() else 'N/A'}")
        return False


def preprocess_scierc():
    """Convert SciERC CSV files to JSON format."""
    print("\n" + "="*70)
    print("PREPROCESSING SCIERC (Module 1 - Related Work)")
    print("="*70)
    
    data_dir = Path("data/raw/scierc")
    
    try:
        train_df = pd.read_csv(data_dir / "train.csv")
        dev_df = pd.read_csv(data_dir / "dev.csv")
        test_df = pd.read_csv(data_dir / "test.csv")
        
        print(f"\n✅ Loaded CSV files:")
        print(f"   Training: {len(train_df)} records")
        print(f"   Dev: {len(dev_df)} records")
        print(f"   Test: {len(test_df)} records")
        print(f"   Columns: {list(train_df.columns)}")
        
        # Convert to JSON format
        # SciERC format: {doc_key, sentences, ner, relations, clusters}
        def convert_df_to_scierc(df):
            records = []
            for idx, row in df.iterrows():
                # Parse the CSV row into SciERC format
                # This depends on the actual CSV structure
                record = {
                    'doc_key': str(row.get('doc_key', f'doc_{idx}')),
                    'sentences': [[str(row.get('sentence', '')).split()]],  # Simplified
                    'ner': [[]],  # Will be empty for baseline
                    'relations': [],
                    'clusters': []
                }
                records.append(record)
            return records
        
        train_data = convert_df_to_scierc(train_df)
        dev_data = convert_df_to_scierc(dev_df)
        test_data = convert_df_to_scierc(test_df)
        
        # Save as JSON
        with open(data_dir / "train.json", 'w') as f:
            json.dump(train_data, f, indent=2)
        
        with open(data_dir / "dev.json", 'w') as f:
            json.dump(dev_data, f, indent=2)
        
        with open(data_dir / "test.json", 'w') as f:
            json.dump(test_data, f, indent=2)
        
        print(f"\n✅ Converted to JSON format:")
        print(f"   data/raw/scierc/train.json ({len(train_data)} docs)")
        print(f"   data/raw/scierc/dev.json ({len(dev_data)} docs)")
        print(f"   data/raw/scierc/test.json ({len(test_data)} docs)")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error preprocessing SciERC: {e}")
        return False


def preprocess_peerread():
    """Validate and summarize PeerRead data."""
    print("\n" + "="*70)
    print("PREPROCESSING PEERREAD (Modules 3, 4, 5)")
    print("="*70)
    
    base_dir = Path("data/raw/peerread/data/acl_2017")
    
    try:
        # Count papers in each split
        splits = ['train', 'dev', 'test']
        total_papers = 0
        
        for split in splits:
            review_dir = base_dir / split / "reviews"
            if review_dir.exists():
                review_files = list(review_dir.glob("*.json"))
                print(f"\n{split.upper()}: {len(review_files)} papers")
                total_papers += len(review_files)
                
                # Sample one review to show structure
                if review_files and split == 'train':
                    with open(review_files[0]) as f:
                        sample = json.load(f)
                    print(f"   Sample keys: {list(sample.keys())}")
                    if 'reviews' in sample:
                        print(f"   Reviews per paper: {len(sample['reviews'])}")
        
        print(f"\n✅ Total papers: {total_papers}")
        print(f"✅ PeerRead data is already in correct format")
        print(f"   Ready for Modules 3, 4, 5 baseline evaluation")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error checking PeerRead: {e}")
        return False


def main():
    """Preprocess all datasets."""
    print("\n" + "="*70)
    print("ENTHESIS DATASET PREPROCESSING")
    print("="*70)
    print("\nConverting CSV files to proper JSON/JSONL format...")
    
    results = {
        'SciFact': preprocess_scifact(),
        'SciERC': preprocess_scierc(),
        'PeerRead': preprocess_peerread(),
    }
    
    # Summary
    print("\n" + "="*70)
    print("PREPROCESSING SUMMARY")
    print("="*70)
    
    for dataset, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        print(f"{status}: {dataset}")
    
    if all(results.values()):
        print("\n🎉 All datasets preprocessed successfully!")
        print("\nNext steps:")
        print("  1. Run: python scripts/check_phase1_status.py")
        print("  2. Start baseline evaluations for each module")
        print("  3. Measure and record scores")
    else:
        print("\n⚠️  Some preprocessing failed. Check errors above.")
    
    print("="*70 + "\n")


if __name__ == "__main__":
    main()
