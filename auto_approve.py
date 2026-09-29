"""Auto-approve all stages for the latest paper"""
from pipeline.orchestrator import Orchestrator
from backend.app.services.store import LocalRunStore
from backend.app.config import settings
from pipeline.stages import Stage
import time

# Load papers
store = LocalRunStore(settings.STORAGE_DIR)
papers = store.list_all()

# Find the paper that was started
started_papers = [p for p in papers if p.started]
if not started_papers:
    print("No started papers found!")
    exit(1)

# Get the most recent one
run = started_papers[-1]
print(f"Paper: {run.paper_id} - {run.filename}")
print(f"Started: {run.started}")
print(f"\nCurrent states:")
for key, state in run.states.items():
    print(f"  {key}: {state}")

# Create orchestrator
orch = Orchestrator()

# Approve stages in order
stages_to_approve = [Stage.RELATED_WORK, Stage.NOVELTY, Stage.WEAKNESSES, Stage.CLARITY, Stage.REVIEWER_FEEDBACK]

for stage in stages_to_approve:
    state = run.states[stage.value]
    
    if state.value == "done":
        print(f"\n✅ Approving {stage.value}...")
        try:
            orch.approve(run, stage)
            store.save(run)
            time.sleep(2)  # Give module time to run
            
            # Reload to see updates
            run = store.get(run.paper_id)
            print(f"   Approved! State is now: {run.states[stage.value]}")
            
            # Show all states
            print(f"   All states:")
            for k, v in run.states.items():
                if k != "parse":
                    print(f"     {k}: {v}")
        except Exception as e:
            print(f"   Error: {e}")
            import traceback
            traceback.print_exc()
            break
    elif state.value == "pending":
        print(f"\n⏳ {stage.value} is pending (waiting for previous approval)")
        break
    elif state.value == "approved":
        print(f"\n✓ {stage.value} already approved, skipping")
        continue

print("\n\n=== FINAL RESULTS ===")
run = store.get(run.paper_id)
for key, state in run.states.items():
    result_exists = "✓ Has results" if key in run.results else "✗ No results"
    print(f"  {key}: {state} - {result_exists}")
