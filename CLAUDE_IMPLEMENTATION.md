# CLAUDE_IMPLEMENTATION.md

# Enthesis — Claude Code Implementation Instructions

## Role

You are implementing Enthesis, an NLP research assistant for students.

The authoritative product scope is the attached/project guide:

- 5 NLP modules
- 4 development phases
- 14-week research roadmap
- Dataset + baseline + score required for every module
- The system assists researchers and does not write their paper

Do not silently expand the project beyond this scope.

---

# 1. Primary Objective

Build Enthesis as a modular, research-first system that can:

1. Accept a student's paper draft.
2. Extract usable document text and sections.
3. Run five independent NLP checks.
4. Preserve evidence behind findings.
5. Let the user approve each stage before the next stage runs.
6. Produce a consolidated research-feedback report.
7. Track experiments and evaluation metrics.
8. Keep research models independent from the web application layer.

Do not fabricate model scores, datasets, citations, or research results.

---

# 2. Implementation Principles

Follow these rules throughout development:

### Rule 1 — Research before UI

Implement and validate the NLP modules before spending significant effort on visual polish.

### Rule 2 — Baseline first

Every module must first have a simple baseline.

Only then implement the improved approach.

### Rule 3 — Reproducibility

Every experiment should have:

- dataset version
- train/validation/test split
- random seed
- model configuration
- hyperparameters
- metric
- result
- experiment/run ID

### Rule 4 — Evidence first

Every user-facing finding should contain evidence whenever the module supports evidence extraction.

### Rule 5 — No invented results

If an experiment has not been run, use `TBD`, `not_evaluated`, or an equivalent explicit status.

Never create fake accuracy/F1/Recall numbers.

### Rule 6 — No autonomous paper writing

Enthesis provides guidance and feedback. It must not generate a complete research paper.

### Rule 7 — Modular architecture

Each NLP module must be independently testable and callable.

---

# 3. Build Order

Implement in this exact order:

```text
1. Project foundation
2. Dataset/config infrastructure
3. Module 1 — Related Work
4. Module 2 — Novelty
5. Module 3 — Weakness Detection
6. Module 5 — Clarity
7. Module 4 — Reviewer-style Feedback
8. Pipeline orchestration
9. Report generation
10. API
11. Frontend
12. Production infrastructure
```

The source roadmap specifically prioritizes modules 1, 2, 3, then 5, then 4 because module 4 is the riskiest and most novel.

---

# 4. Project Foundation

Create a clean repository with separate layers:

```text
modules/
pipeline/
backend/
frontend/
data/
experiments/
tests/
docs/
```

Do not put model-training code directly inside API route files.

Create shared interfaces for modules.

Example conceptual interface:

```python
class NLPModule:
    name: str

    def train(self, config):
        ...

    def evaluate(self, dataset):
        ...

    def predict(self, document):
        ...

    def get_metrics(self):
        ...
```

Use concrete implementations per module.

---

# 5. Module 1 — Related Work

## Goal

Extract methods, datasets, and claims from papers and retrieve semantically similar research.

## Required data

- SciERC
- S2ORC / Semantic Scholar

Verify licensing before downloading/processing data.

## Required models

- Fine-tuned SciBERT for extraction
- SPECTER2 embeddings
- FAISS for similarity search

## Required metrics

- F1 for extraction
- Recall@k for retrieval

## Implementation

Create:

```text
modules/related_work/
├── preprocessing.py
├── baseline.py
├── train.py
├── evaluate.py
├── embeddings.py
├── index.py
└── inference.py
```

First implement the simplest extraction baseline.

Then implement SciBERT.

Then implement SPECTER2 + FAISS.

Do not claim that retrieved papers are exhaustive.

Return paper IDs/titles and similarity/retrieval information where available.

---

# 6. Module 2 — Novelty

## Goal

Compare research claims against existing evidence.

The output categories are:

```text
supported
contradicted
already_done
```

## Dataset

SciFact.

## Model

Fine-tuned NLI model such as DeBERTa.

## Metrics

- Accuracy
- F1

## Implementation

Create:

```text
modules/novelty/
├── preprocessing.py
├── baseline.py
├── train.py
├── evaluate.py
└── inference.py
```

The module should:

1. Receive extracted claims.
2. Retrieve candidate evidence.
3. Run NLI.
4. Return the classification.
5. Attach evidence.
6. Include confidence.
7. Record limitations.

Never output an unsupported statement such as “your research is definitely novel.”

---

# 7. Module 3 — Weakness Detection

## Goal

Detect methodology weaknesses.

Initial categories:

```text
missing_baseline
weak_evaluation
unclear_method
limited_novelty
```

## Data

OpenReview reviewer comments grouped into weakness categories.

## Model

Fine-tuned text classifier.

## Metrics

- Precision per category
- Recall per category

## Implementation

Create:

```text
modules/weaknesses/
├── preprocessing.py
├── taxonomy.py
├── baseline.py
├── train.py
├── evaluate.py
└── inference.py
```

Return:

```json
{
  "category": "...",
  "confidence": 0.0,
  "evidence_span": "...",
  "explanation": "..."
}
```

---

# 8. Module 5 — Clarity

## Goal

Identify unclear or repetitive writing.

## Data

Accepted vs rejected papers in one selected subfield.

## Required style signals

- sentence length variance
- hedging
- vague phrases
- repetition

## Model

Style feature extractors + simple classifier.

## Metric

Correlation with accept/reject labels.

Do not assume that the model proves why a paper was accepted or rejected. Report this as a statistical/modeling signal.

---

# 9. Module 4 — Reviewer-style Feedback

Implement this after the first four modules.

## Goal

Generate feedback reflecting patterns in real reviewer comments.

## Data

OpenReview.

## Approach

```text
Reviewer comments
      |
      v
Embeddings
      |
      v
HDBSCAN clustering
      |
      v
Reviewer-style groups
      |
      v
LoRA fine-tuned small LLM
      |
      v
Generated feedback
```

## Evaluation

Measure overlap with issues raised by real reviewers.

Use held-out papers for evaluation.

This module receives extra research attention because the guide identifies it as the riskiest and most novel module.

Generated output must be labeled as model-generated feedback.

---

# 10. Pipeline

Implement an explicit staged pipeline:

```text
UPLOAD
  |
PARSE
  |
RELATED_WORK
  |
APPROVAL
  |
NOVELTY
  |
APPROVAL
  |
WEAKNESSES
  |
APPROVAL
  |
CLARITY
  |
APPROVAL
  |
REVIEWER_FEEDBACK
  |
REPORT
```

The user must be able to approve each stage.

Create persistent stage states:

```text
pending
running
completed
failed
approved
```

Do not automatically skip approval gates.

---

# 11. Report Format

Create a structured report:

```text
Enthesis Research Feedback
--------------------------

Paper
Author
Run ID

1. Related Work
   - Related papers
   - Extracted methods
   - Extracted datasets
   - Retrieval evidence
   - Metrics

2. Novelty
   - Claims
   - Evidence
   - NLI classifications
   - Confidence
   - Limitations

3. Weaknesses
   - Category
   - Evidence
   - Confidence
   - Suggested investigation

4. Clarity
   - Flagged passages
   - Style signals
   - Repetition indicators

5. Reviewer-style Feedback
   - Generated feedback
   - Reviewer-style cluster
   - Supporting issues
   - Limitations

Research integrity notice:
This report provides model-generated research guidance and does not predict paper acceptance.
```

---

# 12. Backend

Use FastAPI.

Suggested architecture:

```text
backend/app/
├── main.py
├── config.py
├── api/
├── schemas/
├── services/
└── pipeline/
```

API responsibilities:

- Upload documents.
- Create paper/run records.
- Start jobs.
- Approve stages.
- Retrieve results.
- Generate final report.

Do not place model training inside request handlers.

Long-running tasks should eventually use Celery + Redis.

---

# 13. Storage

For the launch architecture:

- PostgreSQL → reports and metadata
- S3 → uploaded paper drafts
- Redis → job queue/cache

During research development, local storage may be used where appropriate, but keep storage interfaces abstract so production storage can be substituted later.

---

# 14. Frontend

Use React or Next.js.

Minimum screens:

```text
Dashboard
Upload Paper
Pipeline Progress
Stage Review
Evidence Viewer
Final Report
Experiment/Research Status
```

The UI should make the staged pipeline obvious.

For every result, distinguish:

- evidence
- model prediction
- confidence
- limitation

Do not use visual language that implies certainty when the model is uncertain.

---

# 15. Experiment Tracking

Use Weights & Biases.

Every training/evaluation script should accept configuration instead of hard-coded values.

Example:

```text
experiments/
├── configs/
│   ├── related_work.yaml
│   ├── novelty.yaml
│   ├── weaknesses.yaml
│   ├── clarity.yaml
│   └── reviewer_feedback.yaml
└── results/
```

Record baseline and improved results separately.

---

# 16. Testing

Create three layers.

## Unit

Test:

- parsers
- preprocessors
- feature extraction
- retrieval
- classifiers
- result schemas

## Integration

Test:

```text
upload -> parse -> module -> result
```

and:

```text
module -> approval -> next module
```

## Research evaluation

Use held-out data.

Never evaluate only against training data.

---

# 17. Phase Gates

Claude must not declare a phase complete until its criteria are met.

## Phase 1 complete when

Every module has a baseline score.

## Phase 2 complete when

All five modules have measured results in the shared results table.

## Phase 3 complete when

- Modules are connected.
- End-to-end testing is completed on held-out papers.
- A small 10–20 student user study is completed.
- Research paper draft contains results and limitations.

## Phase 4 complete when

A student can upload a draft and receive a feedback report in the browser.

---

# 18. Development Workflow

For every implementation step:

1. Inspect the repository.
2. Identify existing files and architecture.
3. Do not overwrite working code unnecessarily.
4. Implement the smallest complete change.
5. Run tests.
6. Report failures honestly.
7. Fix failures.
8. Re-run tests.
9. Update documentation.
10. Only then proceed to the next module.

Before changing architecture, inspect existing implementation and explain why the change is required.

---

# 19. Data and License Requirements

Before downloading or using any dataset:

1. Identify the official source.
2. Read the license/terms.
3. Record the source and license in `docs/datasets.md`.
4. Do not redistribute restricted data.
5. Store only metadata or instructions when redistribution is not permitted.

Do not fabricate access to unavailable datasets.

---

# 20. Model and Experiment Requirements

For every module create:

```text
baseline
improved_model
evaluation
inference
model_card
```

A model card should include:

- purpose
- dataset
- training approach
- evaluation metrics
- known limitations
- intended use
- non-intended use

---

# 21. What Claude Must NOT Do

Do not:

- invent evaluation scores
- invent dataset records
- invent citations
- claim novelty without evidence
- claim acceptance probability
- claim that a generated review is written by a real reviewer
- automatically write a complete research paper
- skip evaluation
- silently remove failed tests
- replace research models with an LLM-only shortcut without documenting the deviation
- mark unfinished modules as production-ready

---

# 22. First Task

Before writing implementation code:

1. Inspect the existing repository.
2. Produce a concise architecture assessment.
3. Identify what already exists.
4. Identify missing components.
5. Identify the first module that can be implemented safely.
6. Create the project structure only where needed.
7. Do not implement all five modules in one step.

Then proceed sequentially.

The first implementation target should be Module 1 — Find Related Work.

---

# 23. Final Acceptance Checklist

```text
[ ] Repository architecture is modular
[ ] SciERC/S2ORC data pipeline exists
[ ] Related-work baseline exists
[ ] SciBERT extraction exists
[ ] SPECTER2 retrieval exists
[ ] FAISS index exists
[ ] Related-work metrics are measured

[ ] SciFact pipeline exists
[ ] NLI baseline exists
[ ] DeBERTa NLI exists
[ ] Accuracy/F1 measured

[ ] OpenReview weakness dataset exists
[ ] Weakness baseline exists
[ ] Weakness classifier exists
[ ] Per-category precision/recall measured

[ ] Clarity dataset exists
[ ] Style features exist
[ ] Classifier exists
[ ] Correlation measured

[ ] Reviewer embeddings exist
[ ] HDBSCAN clustering exists
[ ] LoRA model exists
[ ] Held-out evaluation exists

[ ] Staged pipeline exists
[ ] Approval gates exist
[ ] Evidence is preserved
[ ] Final report exists
[ ] API exists
[ ] Frontend exists
[ ] Background jobs exist
[ ] PostgreSQL integration exists
[ ] S3 integration exists
[ ] Docker setup exists
[ ] Privacy rules documented

[ ] No fabricated results
[ ] Research limitations documented
[ ] Tests pass
```

## Source

This implementation specification is derived from the provided Enthesis Project Guide. The guide defines Enthesis as a research assistant with five NLP checks and requires every module to have a dataset, baseline, and measurable score. fileciteturn0file0L9-L15

The guide specifies the datasets/models/metrics for the five modules and the order in which they should be built. fileciteturn0file0L66-L108

The guide specifies the integration, held-out evaluation, student study, and launch architecture. fileciteturn0file0L113-L146
