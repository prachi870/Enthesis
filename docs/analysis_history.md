# Analysis History

## Overview

The Analysis History page provides a complete, permanent record of every analysis run performed on a research paper. Each run is preserved with full reproducibility metadata, ensuring you can always trace back to understand exactly what was analyzed, when, and with which models.

## Purpose

Analysis History solves critical research needs:
- **Reproducibility**: Know exactly which model/dataset versions produced which results
- **Comparison**: Track how analysis evolved across paper revisions
- **Debugging**: Understand why results changed between runs
- **Accountability**: Maintain audit trail of all analyses
- **Learning**: See patterns in successful vs failed runs

## Key Features

### 1. Complete Run Records

Every analysis run records:
- **Date & Time**: Exact timestamp of execution
- **Paper Version**: Which version was analyzed
- **Pipeline Status**: completed, failed, partial, running
- **Completed Modules**: Which modules finished successfully
- **Failed Modules**: Which modules failed (with error details)
- **Findings Count**: Number of findings per module
- **Model Versions**: Exact model identifiers used
- **Dataset Versions**: Dataset versions for each module
- **Report Status**: Whether report was generated
- **Duration**: How long the analysis took
- **Trigger**: How it was started (manual, auto, scheduled, reanalysis)
- **User**: Who initiated the run
- **Notes**: Optional notes about the run

### 2. Statistics Overview

Dashboard shows:
- Total number of runs
- Successful runs count
- Failed runs count
- Partial runs count
- Average analysis duration
- Module-by-module success rates

### 3. Reproducibility Metadata

Each run preserves:
```json
{
  "model_versions": {
    "related_work": "OpenReview_baseline_v1.0",
    "novelty": "NLI_baseline_v1.0",
    "weaknesses": "OpenReview_classifier_baseline_v1.0",
    "clarity": "Readability_baseline_v1.0",
    "reviewer_feedback": "ReviewerStyle_baseline_v1.0"
  },
  "dataset_versions": {
    "related_work": "S2ORC_citations_v1",
    "novelty": "NLI_training_v1",
    "weaknesses": "OpenReview_papers_v1",
    "clarity": "Academic_corpus_v1",
    "reviewer_feedback": "OpenReview_reviews_v1"
  }
}
```

### 4. Filter & Search

Filter runs by:
- All runs
- Completed only
- Partial only
- Failed only
- Running only

### 5. Open Previous Analysis

Click "Open" on any run to:
- Load that exact analysis result
- View findings as they were at that time
- Compare with current analysis
- Verify reproducibility

## How to Use

### Accessing History

1. Navigate to any analyzed paper
2. Click the **"History"** tab in navigation
3. View complete list of analysis runs

### Understanding Run Status

**✅ Completed (Green)**
- All 5 modules finished successfully
- Full analysis results available
- Report generated (if applicable)

**⚠️ Partial (Yellow)**
- Some modules completed
- Others failed or were skipped
- Partial results available

**❌ Failed (Red)**
- Analysis encountered critical error
- No usable results produced
- Check failed modules for details

**🔄 Running (Blue)**
- Analysis currently in progress
- Check back later for results

### Viewing Run Details

1. **Click the expand arrow (⌄)** on any run
2. View detailed information:
   - Model versions used
   - Dataset versions used
   - Findings breakdown by module
   - Report generation status
   - Notes and metadata

### Opening a Previous Run

1. Click **"Open"** button on any run
2. System loads that historical analysis
3. View results exactly as they were
4. All visualization tools show historical data

### Comparing Runs

To compare two analysis runs:
1. Note the findings counts for each run
2. Check model/dataset versions for differences
3. Look at dates to understand timeline
4. Open each run individually to examine details
5. Use Version Comparison tools for structured comparison

## Understanding the Data

### Model Versions

Model versions identify which ML model was used:
- Format: `ModelName_variant_v1.0`
- Example: `OpenReview_baseline_v1.0`
- Different versions may produce different results
- Critical for reproducibility

### Dataset Versions

Dataset versions identify training/reference data:
- Format: `DatasetName_subset_v1`
- Example: `S2ORC_citations_v1`
- Changes affect what the model learned from
- Important for understanding model behavior

### Findings Count

Shows number of findings per module:
```
{
  "weaknesses": 5,
  "clarity": 7,
  "novelty": 2,
  "reviewer_feedback": 4,
  "related_work": 3
}
```

Higher counts mean more issues detected (not necessarily bad - could indicate thorough analysis or actual problems).

### Duration

Analysis duration helps:
- Identify performance issues
- Estimate time for future runs
- Detect unusual slowdowns
- Track improvements over time

## Reproducibility

### Why It Matters

Academic research requires reproducibility:
- Results must be verifiable
- Others need to replicate findings
- Changes must be traceable
- Methods must be transparent

### How Enthesis Ensures It

1. **Immutable Records**: Once created, run records never change
2. **Complete Metadata**: All versions captured
3. **Full Results**: Entire analysis output preserved
4. **Timestamp Accuracy**: Exact execution time recorded
5. **User Attribution**: Who ran it is tracked

### Using History for Reproducibility

**Scenario**: Someone questions your results

1. Go to Analysis History
2. Find the relevant run by date
3. Show the model versions used
4. Display the dataset versions
5. Open the actual results
6. Demonstrate consistency

**Scenario**: Results changed unexpectedly

1. Compare two runs side-by-side
2. Check model versions - did they change?
3. Check dataset versions - any updates?
4. Look at paper versions - did content change?
5. Examine findings differences
6. Understand the root cause

## Best Practices

### 1. Add Notes to Important Runs

When running analysis:
- Note why you're running it ("After addressing baseline concern")
- Record what changed ("Updated method section")
- Mark milestones ("Pre-submission version")
- Document experiments ("Testing new model")

### 2. Keep Model Versions Stable

For consistency:
- Use same model version across revisions
- Only upgrade when intentional
- Document why you upgraded
- Compare before/after upgrade

### 3. Regular Analysis

Run analysis:
- After every significant revision
- Before submission
- After peer review feedback
- When models/datasets update

### 4. Review Failure Patterns

If runs keep failing:
- Check which modules fail most
- Review error messages
- Look for patterns in timing
- Consult technical support

### 5. Compare Across Time

Track improvement:
- Initial draft vs final paper
- Pre-review vs post-review
- Version 1 vs Version N
- Early models vs latest models

## Statistics Interpretation

### Total Runs
- High count = active iteration
- Low count = stable paper or just started
- No judgment on quality

### Success Rate
- 100% = reliable pipeline
- <80% = investigate issues
- Occasional failures are normal

### Average Duration
- Baseline: ~5 seconds per module
- Longer: complex paper or slow modules
- Shorter: small paper or efficient run

### Module Success Rates
- 100% = module is stable
- <90% = module may have issues
- Check specific failures

## Troubleshooting

### "No analysis runs found"

**Possible causes:**
- Paper was just uploaded (no runs yet)
- Database connection issue
- Wrong paper selected

**Solutions:**
- Upload and analyze paper first
- Check network connection
- Verify paper ID

### Run shows "failed" status

**Check:**
1. Failed modules section for errors
2. Paper content for unusual formatting
3. System logs for technical issues
4. Network connectivity during run

### Can't open previous run

**Possible issues:**
- Database connection lost
- Analysis results corrupted
- Browser cache problem

**Solutions:**
- Refresh page
- Clear browser cache
- Check backend is running

### Model versions all show "unknown"

**Causes:**
- Legacy run (before version tracking)
- Migration issue
- Recording failure

**Impact:**
- Results are still valid
- Just can't verify exact model used
- Future runs will track correctly

## Privacy & Security

### What's Stored

- Analysis metadata (dates, versions, counts)
- Complete analysis results
- User who ran it
- Notes added by user

### What's NOT Stored

- Paper content (stored separately)
- API keys or credentials
- Personal information beyond user ID
- Browser session data

### Data Retention

- Runs stored indefinitely by default
- Can be deleted by user or admin
- Deletion is permanent
- Consider backing up important runs

### Access Control

- Only authenticated users can view history
- Users see their own runs
- Admins may see all runs (depending on config)
- API requires valid JWT token

## Advanced Usage

### Programmatic Access

API endpoint:
```
GET /api/v1/papers/{paper_id}/history
Authorization: Bearer {token}
```

Returns JSON array of all runs.

### Filtering by Date

While not in UI yet, API supports:
```
GET /api/v1/papers/{paper_id}/history?after=2024-01-01&before=2024-12-31
```

### Export for Analysis

Future feature: Export history to CSV/JSON for:
- Statistical analysis
- Performance tracking
- Report generation
- Data visualization

### Integration with CI/CD

Run analysis automatically:
- On git push
- On PR creation
- On schedule
- Record results in history
- Track quality over time

## FAQ

**Q: Can I delete old runs?**
A: Yes, but consider carefully. Historical data is valuable for comparison.

**Q: Do runs affect storage?**
A: Yes, each run stores complete results. Very old runs can be archived.

**Q: Can I edit a run's notes after creation?**
A: Not yet, but this is a planned feature.

**Q: What if model versions change?**
A: New runs use new versions. Old runs preserve what they used.

**Q: How long does history go back?**
A: Since history feature was added. Earlier runs may not have complete metadata.

**Q: Can I compare runs from different papers?**
A: Not directly, but you can view them separately.

**Q: What if I run analysis twice on same version?**
A: Both runs are recorded. Useful for testing or verifying consistency.

**Q: Do failed runs count against anything?**
A: No, they're just informational. Helpful for debugging.

---

## Related Features

- **Version Management**: Track paper versions
- **Before vs After**: Compare versions visually
- **Detailed Compare**: Technical version comparison
- **Action Center**: Track tasks from findings

## Technical Details

### Database Schema

```sql
CREATE TABLE analysis_runs (
    id SERIAL PRIMARY KEY,
    paper_id VARCHAR NOT NULL,
    version_id INTEGER,
    run_date TIMESTAMP NOT NULL,
    pipeline_status VARCHAR NOT NULL,
    model_versions JSON NOT NULL,
    dataset_versions JSON,
    completed_modules JSON NOT NULL,
    failed_modules JSON,
    findings_count JSON NOT NULL,
    analysis_results JSON NOT NULL,
    report_generated VARCHAR NOT NULL,
    report_path VARCHAR,
    duration_seconds INTEGER,
    trigger VARCHAR NOT NULL,
    user_id INTEGER,
    notes TEXT
);
```

### API Endpoints

- `GET /api/v1/papers/{paper_id}/history` - List all runs
- `GET /api/v1/papers/{paper_id}/history/{run_id}` - Get specific run
- `POST /api/v1/papers/{paper_id}/history/record` - Record new run
- `GET /api/v1/papers/{paper_id}/history/statistics/summary` - Get stats
- `DELETE /api/v1/papers/{paper_id}/history/{run_id}` - Delete run

---

**Remember**: Analysis History is your research audit trail. Use it to maintain reproducibility, track progress, and ensure scientific rigor in your paper improvement process.
