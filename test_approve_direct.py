"""Direct approval test bypassing auth"""
from pipeline.orchestrator import Orchestrator
from backend.app.services.store import LocalRunStore
from backend.app.config import settings
from pipeline.stages import Stage
import time

# Load the paper
store = LocalRunStore(settings.STORAGE_DIR)
papers = store.list_all()

if not papers:
    print("No papers found!")
    exit(1)

run = papers[0]
print(f"Paper: {run.paper_id} - {run.filename}")
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
            print(f"   Approved! State is now: {run.states[stage.value]}")
            
            # Check next stage
            time.sleep(1)
            next_idx = stages_to_approve.index(stage) + 1
            if next_idx < len(stages_to_approve):
                next_stage = stages_to_approve[next_idx]
                print(f"   Next stage ({next_stage.value}): {run.states[next_stage.value]}")
        except Exception as e:
            print(f"   Error: {e}")
            break
    elif state.value == "pending":
        print(f"\n⏳ {stage.value} is pending")
        break
    elif state.value == "approved":
        print(f"\n✓ {stage.value} already approved")
        continue

print("\n\n=== FINAL STATES ===")
for key, state in run.states.items():
    result_exists = "✓" if key in run.results else "✗"
    print(f"  {key}: {state} {result_exists}")
