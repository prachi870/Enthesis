"""Test what analytics are currently provided"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

# Login to get token
print("Logging in...")
r = requests.post(f"{BASE_URL}/auth/login", json={
    "username": "testflow",
    "password": "test123"
})
token = r.json()['access_token']
headers = {"Authorization": f"Bearer {token}"}

# Get a paper from the list
print("\nFetching papers...")
r = requests.get(f"{BASE_URL}/papers/list", headers=headers)
papers = r.json()['papers']

if not papers:
    print("No papers found. Upload a paper first.")
    exit(0)

paper_id = papers[0]['paper_id']
print(f"\nAnalyzing paper: {papers[0]['filename']} ({paper_id})")

# Get results
r = requests.get(f"{BASE_URL}/papers/{paper_id}/results", headers=headers)
results = r.json()

print("\n" + "="*80)
print("CURRENT ANALYTICS OUTPUT:")
print("="*80)

# Check what's in results
for module, data in results.get('results', {}).items():
    print(f"\n📊 MODULE: {module}")
    print(f"   Status: {data.get('status', 'unknown')}")
    print(f"   Confidence: {data.get('confidence', 0)}")
    
    # Check for scores
    findings = data.get('findings', [])
    print(f"   Findings: {len(findings)} items")
    
    # Show first finding structure
    if findings:
        print(f"\n   Sample Finding Structure:")
        print(f"   {json.dumps(findings[0], indent=6)[:500]}...")

# Get report
print("\n" + "="*80)
print("REPORT OUTPUT:")
print("="*80)

r = requests.get(f"{BASE_URL}/papers/{paper_id}/report", headers=headers)
report = r.json()

# Check module feedback structure
for key, module_data in report.get('module_feedback', {}).items():
    print(f"\n📋 {key.upper()}")
    print(f"   Status: {module_data.get('status')}")
    print(f"   Confidence: {module_data.get('confidence')}")
    print(f"   Findings keys: {list(module_data.get('findings', {}).keys())}")

print("\n" + "="*80)
print("\nCURRENT ISSUES:")
print("="*80)
print("❌ No clear SCORES per category")
print("❌ No 'what's missing' summary")
print("❌ No 'what's wrong' summary")
print("❌ No quantitative metrics displayed")
print("❌ No severity breakdown")
print("❌ No actionable recommendations")
