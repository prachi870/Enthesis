# Enthesis — Implementation Specification

## 1. Project Overview

Enthesis is an NLP research assistant for students. A student uploads a research-paper draft, and the system provides research guidance rather than writing the paper.

The pipeline contains five independent NLP checks:

1. Find related work
2. Check novelty
3. Spot weaknesses
4. Reviewer-style feedback
5. Clarity check

The project is research-oriented: every module must have a real public dataset, a baseline, an improved model/approach, and measurable evaluation results. The system assists the researcher and does not write the paper.

Source: Enthesis Project Guide.

---

## 2. Core Research Requirements

### Golden rules

- Every module gets a dataset, baseline, and score.
- Start with the simplest baseline before improving the model.
- Enthesis assists the researcher and never writes the paper.
- Models must be evaluated on real data.
- Results must be recorded in a shared experiment/results table.

---

## 3. Recommended Repository Structure

```text
enthesis/
├── README.md
├── IMPLEMENTATION.md
├── CLAUDE_IMPLEMENTATION.md
├── .env.example
├── .gitignore
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── pipeline/
│   │
│   └── requirements.txt
│
├── frontend/
│   └── ...
│
├── modules/
│   ├── related_work/
│   │   ├── data/
│   │   ├── preprocessing/
│   │   ├── baseline/
│   │   ├── model/
│   │   ├── evaluation/
│   │   └── inference.py
│   │
│   ├── novelty/
│   │   ├── data/
│   │   ├── preprocessing/
│   │   ├── baseline/
│   │   ├── model/
│   │   ├── evaluation/
│   │   └── inference.py
│   │
│   ├── weaknesses/
│   │   ├── data/
│   │   ├── preprocessing/
│   │   ├── baseline/
│   │   ├── model/
│   │   ├── evaluation/
│   │   └── inference.py
│   │
│   ├── clarity/
│   │   ├── features/
│   │   ├── baseline/
│   │   ├── model/
│   │   ├── evaluation/
│   │   └── inference.py
│   │
│   └── reviewer_feedback/
│       ├── data/
│       ├── preprocessing/
│       ├── embeddings/
│       ├── clustering/
│       ├── lora/
│       ├── evaluation/
│       └── inference.py
│
├── pipeline/
│   ├── orchestrator.py
│   ├── stages.py
│   ├── report.py
│   └── schemas.py
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── README.md
│
├── experiments/
│   ├── configs/
│   ├── results/
│   └── notebooks/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── evaluation/
│
└── docs/
    ├── datasets.md
    ├── model_cards.md
    ├── evaluation.md
    └── limitations.md
```

---

# 4. Module 1 — Find Related Work

## Objective

Extract methods, datasets, and claims from research papers and retrieve papers that are semantically similar to the student's draft.

## Data

- SciERC
- S2ORC / Semantic Scholar

Check dataset/API licenses before use.

## Model

### Extraction

Fine-tuned SciBERT for extracting relevant scientific information.

### Retrieval

SPECTER2 embeddings with FAISS similarity search.

## Evaluation

- Extraction: F1
- Retrieval: Recall@k

## Implementation sequence

1. Prepare SciERC data.
2. Build a simple baseline.
3. Fine-tune SciBERT.
4. Evaluate extraction.
5. Generate SPECTER2 embeddings for indexed papers.
6. Build FAISS index.
7. Embed the student's draft/query.
8. Retrieve top-k similar papers.
9. Evaluate Recall@k.
10. Save model and retrieval configuration.

---

# 5. Module 2 — Check Novelty

## Objective

Compare claims such as “we are the first to...” against existing research.

The module classifies relationships as:

- Supported
- Contradicted
- Already done

## Data

SciFact.

## Model

Fine-tuned NLI model, for example DeBERTa.

## Evaluation

- Accuracy
- F1

## Implementation sequence

1. Prepare SciFact premise/claim pairs.
2. Create a simple NLI baseline.
3. Fine-tune the NLI model.
4. Evaluate on held-out data.
5. Extract claims from the uploaded draft.
6. Compare claims against retrieved research evidence.
7. Return classification plus supporting evidence.
8. Never claim novelty without evidence.

---

# 6. Module 3 — Spot Weaknesses

## Objective

Identify likely methodology problems, including:

- Missing baseline
- Weak evaluation
- Unclear method
- Limited novelty

## Data

OpenReview reviewer comments grouped into weakness categories.

## Model

Fine-tuned text classifier.

## Evaluation

Precision and recall per category.

## Implementation sequence

1. Obtain reviewer comments through the approved OpenReview source/API.
2. Create or validate weakness categories.
3. Prepare labeled training data.
4. Build a simple classifier baseline.
5. Fine-tune the selected classifier.
6. Evaluate precision and recall for every category.
7. Run inference on sections of the student's draft.
8. Return weakness category, evidence span, confidence, and explanation.

---

# 7. Module 4 — Reviewer-Style Feedback

## Objective

Generate feedback that reflects styles of real reviewer comments without pretending to be an actual reviewer.

## Data

OpenReview.

Use held-out papers for testing.

## Approach

1. Create embeddings of real reviews.
2. Cluster review styles using HDBSCAN.
3. Use the resulting groups as reviewer-style representations.
4. Fine-tune a small LLM using LoRA.
5. Generate feedback conditioned on the detected style/category.

## Evaluation

Measure overlap with issues raised by real reviewers.

This is the riskiest and most novel module and should receive the most research time.

## Important implementation constraint

The generated feedback must be clearly labeled as model-generated guidance. It must not be represented as a real review or as a guarantee of acceptance.

---

# 8. Module 5 — Clarity Check

## Objective

Identify unclear or repetitive writing using measurable style features.

## Data

Accepted vs. rejected papers from one subfield.

## Features

At minimum investigate:

- Sentence-length variation
- Hedging
- Vague phrases
- Repetition

## Model

- Style feature extractors
- Simple classifier

## Evaluation

Correlation with accept/reject labels.

## Implementation sequence

1. Select one subfield.
2. Build a clean accepted/rejected dataset.
3. Extract style features.
4. Train a simple classifier.
5. Evaluate correlation.
6. Apply features to uploaded draft sections.
7. Flag unclear/repetitive passages.
8. Give concrete editing guidance without rewriting the paper.

---

# 9. Pipeline Architecture

The complete pipeline should follow:

```text
Paper Upload
    |
    v
Document Parsing
    |
    v
Section / Claim Extraction
    |
    +--> Module 1: Related Work
    |
    +--> Module 2: Novelty
    |
    +--> Module 3: Weaknesses
    |
    +--> Module 5: Clarity
    |
    +--> Module 4: Reviewer Feedback
    |
    v
Evidence + Module Results
    |
    v
Final Research Feedback Report
```

The research guide specifies that users should be able to approve each stage before the next stage runs.

---

# 10. Phase 1 — Setup and Baselines

Weeks 1–3.

## Tasks

- Read 15–20 core papers covering SciBERT, SPECTER, SciFact, SciERC and OpenReview review analysis.
- Download SciERC.
- Download SciFact.
- Obtain OpenReview data through its API.
- Obtain S2ORC / Semantic Scholar data.
- Check licenses.
- Set up GitHub.
- Set up Weights & Biases.
- Build a simple baseline for each module.

## Completion criterion

Every module has a documented baseline score.

---

# 11. Phase 2 — Build and Test

Weeks 4–10.

Build in this order:

1. Related work
2. Novelty
3. Weaknesses
4. Clarity
5. Reviewer-style feedback

For every module:

```text
Dataset
  -> preprocessing
  -> baseline
  -> improved model
  -> evaluation
  -> result recording
```

All five modules must have a score in the shared results table.

---

# 12. Phase 3 — Connect, Test, and Write

Weeks 11–14.

## Integration

- Upload draft.
- Run module 1.
- Allow user approval.
- Run module 2.
- Allow user approval.
- Continue through the pipeline.
- Generate a consolidated report.

## End-to-end test

Use held-out OpenReview papers.

Run the system before reading their real reviews, then measure how many real reviewer issues the system identified.

## User study

Conduct a small study with 10–20 students.

Collect ratings about usefulness of Enthesis feedback.

## Research output

Document:

- Dataset details
- Baselines
- Model configurations
- Metrics
- Final results
- Ablations where applicable
- Limitations
- User-study findings

---

# 13. Phase 4 — Launch

Only after the research pipeline is validated.

## Backend

FastAPI with Celery + Redis for long-running model jobs.

## Frontend

Next.js or React.

## Storage

- PostgreSQL for reports
- S3 for uploaded drafts

## Serving

- Docker
- GPU hosting
- vLLM
- Caching

## Privacy

Define privacy rules for uploaded research drafts before real users use the application.

## Launch completion criterion

A student can upload a draft and receive a feedback report in the browser.

---

# 14. Technology Stack

## Research / ML

- Python
- PyTorch
- Hugging Face
- SciBERT
- SPECTER2
- Sentence-BERT
- LoRA
- spaCy
- scikit-learn
- FAISS
- HDBSCAN
- Weights & Biases
- GitHub

## Application

- FastAPI
- Celery
- Redis
- PostgreSQL
- Next.js or React
- Docker
- vLLM
- S3

---

# 15. API Design

Suggested endpoints:

```text
POST /api/v1/papers/upload
GET  /api/v1/papers/{paper_id}
POST /api/v1/papers/{paper_id}/pipeline/start
POST /api/v1/papers/{paper_id}/stages/{stage}/approve
GET  /api/v1/papers/{paper_id}/results
GET  /api/v1/papers/{paper_id}/report

GET  /api/v1/modules/related-work
GET  /api/v1/modules/novelty
GET  /api/v1/modules/weaknesses
GET  /api/v1/modules/clarity
GET  /api/v1/modules/reviewer-feedback
```

These endpoints are an implementation proposal; the source guide specifies the pipeline behavior but does not prescribe exact API routes.

---

# 16. Result Schema

Each module result should contain:

```json
{
  "module": "related_work",
  "status": "completed",
  "model": "model-name",
  "confidence": 0.0,
  "findings": [],
  "evidence": [],
  "metrics": {},
  "limitations": []
}
```

The final report should preserve evidence and module-level findings instead of presenting unsupported conclusions.

---

# 17. Experiment Tracking

Every experiment should record:

- Dataset version
- Dataset split
- Preprocessing version
- Baseline
- Model
- Hyperparameters
- Training seed
- Hardware
- Training time
- Evaluation metrics
- Checkpoint/version
- W&B run ID
- Notes and limitations

Recommended shared result table:

| Module | Dataset | Baseline | Improved Model | Metric | Baseline Score | Final Score |
|---|---|---|---|---|---:|---:|
| Related Work | SciERC / S2ORC | TBD | SciBERT + SPECTER2 | F1 / Recall@k | TBD | TBD |
| Novelty | SciFact | TBD | DeBERTa NLI | Accuracy / F1 | TBD | TBD |
| Weaknesses | OpenReview | TBD | Fine-tuned classifier | Precision / Recall | TBD | TBD |
| Clarity | Accepted/Rejected papers | TBD | Feature classifier | Correlation | TBD | TBD |
| Reviewer Feedback | OpenReview | TBD | HDBSCAN + LoRA LLM | Issue overlap | TBD | TBD |

Do not fabricate scores. Populate them only after experiments are actually run.

---

# 18. Testing Strategy

## Unit tests

Test:

- Document parsing
- Text segmentation
- Claim extraction
- Feature extraction
- Retrieval
- Classifier output schemas
- Report generation

## Integration tests

Test:

- Upload → parse
- Parse → module
- Module → evidence
- Module → report
- Pipeline approval gates

## Research evaluation tests

Each model must be evaluated on held-out data.

Avoid evaluating only on training data.

---

# 19. Research Safety and Integrity

Enthesis is an assistant, not an autonomous paper-writing system.

It should:

- Show evidence behind findings.
- Distinguish model confidence from factual certainty.
- Preserve limitations.
- Avoid claiming that a paper will be accepted.
- Avoid presenting generated feedback as an actual review.
- Never silently invent papers, citations, datasets, or experimental scores.

---

# 20. Compute Strategy

The project guide states that free Colab or Kaggle GPUs are sufficient for the small models and that LoRA can reduce fine-tuning cost.

Start with the smallest practical model and scale only when experiments justify it.

---

# 21. Definition of Done

### Research

- [ ] Dataset acquired and license checked for each module
- [ ] Baseline implemented for each module
- [ ] Improved model implemented
- [ ] Evaluation completed
- [ ] Results recorded
- [ ] Held-out evaluation completed
- [ ] Limitations documented

### Integration

- [ ] Paper upload works
- [ ] Parsing works
- [ ] Each module can run independently
- [ ] Stage approval works
- [ ] Final report is generated
- [ ] Evidence is visible

### Launch

- [ ] FastAPI backend
- [ ] Celery + Redis job queue
- [ ] PostgreSQL report storage
- [ ] S3 draft storage
- [ ] React/Next.js frontend
- [ ] Docker deployment
- [ ] GPU/vLLM serving where required
- [ ] Privacy rules documented

