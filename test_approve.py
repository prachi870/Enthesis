"""Quick test to approve stages and see analysis continue"""
import requests
import time
import json

API_URL = "http://localhost:8000/api/v1"

# Login first (use your credentials)
login_response = requests.post(f"{API_URL}/auth/login", json={
    "username": "test",  # Change to your username
    "password": "test123"  # Change to your password
})

if login_response.status_code != 200:
    print("Login failed:", login_response.text)
    exit(1)

token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Get latest paper
papers = requests.get(f"{API_URL}/papers/list", headers=headers).json()
if not papers["papers"]:
    print("No papers found")
    exit(1)

paper_id = papers["papers"][0]["paper_id"]
print(f"Working with paper: {paper_id}")

# Check current status
status = requests.get(f"{API_URL}/papers/{paper_id}/results", headers=headers).json()
print(f"\nCurrent states:")
for module, state in status["states"].items():
    print(f"  {module}: {state}")

# Approve stages in order
stages = ["related_work", "novelty", "weaknesses", "clarity", "reviewer_feedback"]

for stage in stages:
    current_state = status["states"].get(stage)
    
    if current_state == "done":
        print(f"\n✅ Approving {stage}...")
        approve_response = requests.post(
            f"{API_URL}/papers/{paper_id}/stages/{stage}/approve",
            headers=headers
        )
        
        if approve_response.status_code == 200:
            print(f"   Approved! Next module should run now...")
            time.sleep(2)  # Wait for next module to run
            
            # Check status again
            status = requests.get(f"{API_URL}/papers/{paper_id}/results", headers=headers).json()
            print(f"\n   Updated states:")
            for m, s in status["states"].items():
                print(f"     {m}: {s}")
        else:
            print(f"   Error: {approve_response.text}")
            break
    elif current_state == "pending":
        print(f"\n⏳ {stage} is pending (waiting for previous approvals)")
        break
    elif current_state in ["approved", "running"]:
        print(f"\n⏩ {stage} is {current_state}, checking next...")
        continue

print("\n✨ Done! Check the results.")
