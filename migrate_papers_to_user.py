"""
Migrate existing papers to assign them to a specific user.
This script adds user_id to papers that don't have one.
"""
import json
import os
from pathlib import Path

# Configuration
STORAGE_DIR = "storage"
DEFAULT_USER = "ps0262890"  # Assign to ps0262890@gmail.com

def migrate_papers():
    """Add user_id to all existing papers"""
    storage_path = Path(STORAGE_DIR)
    
    if not storage_path.exists():
        print(f"Storage directory '{STORAGE_DIR}' not found!")
        return
    
    paper_files = list(storage_path.glob("*.json"))
    
    if not paper_files:
        print("No paper files found.")
        return
    
    print(f"Found {len(paper_files)} paper files")
    print(f"Assigning all papers to user: {DEFAULT_USER}\n")
    
    updated_count = 0
    for paper_file in paper_files:
        try:
            # Read paper data
            with open(paper_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Check if user_id already exists
            if 'user_id' not in data or not data['user_id']:
                # Add user_id
                data['user_id'] = DEFAULT_USER
                
                # Write back
                with open(paper_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                print(f"✓ Updated: {paper_file.name} - {data.get('filename', 'Unknown')}")
                updated_count += 1
            else:
                print(f"→ Skipped: {paper_file.name} - Already has user_id: {data['user_id']}")
                
        except Exception as e:
            print(f"✗ Error processing {paper_file.name}: {e}")
    
    print(f"\n=== Migration Complete ===")
    print(f"Updated {updated_count} papers")
    print(f"All papers now belong to user: {DEFAULT_USER}")

if __name__ == "__main__":
    print("=" * 50)
    print("Paper User Migration Script")
    print("=" * 50)
    print(f"This will assign all papers to user: {DEFAULT_USER}")
    print()
    
    response = input("Continue? (yes/no): ")
    if response.lower() == 'yes':
        migrate_papers()
    else:
        print("Migration cancelled.")
