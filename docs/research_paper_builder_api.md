# Research Paper Builder API

The builder is available at `/api/v1/builder`. The existing Research Paper Builder client is also supported at `/api/v1/research-papers`; both prefixes use the same persisted drafts and version history.

## Drafts

- `POST /drafts` — create and scaffold a draft; returns `201`.
- `GET /drafts/{draft_id}` — retrieve a saved draft.
- `PUT /drafts/{draft_id}` — update supplied details/section text and save an immutable next version.
- `GET /drafts/{draft_id}/versions` — list snapshots.
- `GET /drafts/{draft_id}/versions/{version_number}` — retrieve a snapshot.
- `GET /drafts/{draft_id}/export?format=pdf|docx|latex|markdown` — download the saved document.
- `GET /` — list saved drafts (also exposed at the research-papers prefix).

The request accepts title, authors, institution, abstract, keywords, problem statement, objectives, introduction, related work, methodology, dataset, technologies, experiment/results, discussion, limitations, future work, conclusion, citations, and references. `sections` and `generated_content` accept user-provided section text. Formats are `imrad`, `conference`, `thesis`, `ieee`, `generic`, or `university`; they only determine section order/headings. Missing sections are marked in the returned document. No facts, results, citations, or references are created.

Responses include `draft_id`/`id`, `version`, `format`, `details`, `generated_content`, `missing_items`, and the complete `document`. Updates increment the version and retain prior snapshots.

## Existing Enthesis analysis

- `GET /papers/{paper_id}/findings` — findings extracted only from completed results in the existing Enthesis paper run.
- `GET /papers/{paper_id}/quality` — per-module status, finding counts, and actual metrics/confidence; no aggregate quality score is inferred.

At the research-papers prefix, `POST /{draft_id}/analyze` returns an existing analysis linked by the supplied `paper_id` (or by draft ID). It returns `404` when no such existing analysis exists. `POST /{draft_id}/sections/{section_key}/regenerate` returns the current supplied text or explicit missing marker without inventing new prose. Version creation/comparison and export-status calls used by the client are also supported.
