# Paper Version Management

## Overview

Enthesis now supports tracking multiple versions of the same research paper and comparing their analysis results. This feature helps researchers understand how their revisions affect the system's analysis.

## Features

### 1. Version Upload
- Upload multiple versions of the same paper (PDF format)
- Each version is automatically numbered (Version 1, Version 2, Version 3, etc.)
- Each version stores its own analysis results independently

### 2. Version Listing
- View all versions of a paper
- See upload date and filename for each version
- Track which versions have been analyzed

### 3. Version Comparison
- Select any two versions to compare
- View detailed differences between analysis results
- Compare findings, metrics, and scores across versions

## How to Use

### Uploading a New Version

1. Navigate to a paper that already exists in the system
2. Click on the "Versions" tab in the navigation bar
3. Click "Upload New Version"
4. Select your PDF file
5. The new version will be created and numbered automatically

### Comparing Versions

1. Go to the "Versions" tab
2. Click on two different versions to select them
3. Click "Compare Selected" button
4. View the comparison results in three tabs:
   - **Findings**: Shows added, removed, and persistent findings
   - **Metrics**: Displays changes in novelty, weakness, clarity, and reviewer scores
   - **Summary**: Provides an overview of all changes

## Comparison Results

### Findings Tab
- **Added Findings**: Issues detected in the new version but not in the old version
- **Removed Findings**: Issues that were present in the old version but not detected in the new version
- **Persistent Findings**: Issues that remain present in both versions

### Metrics Tab
Shows score changes for each analysis module:
- **Novelty Metrics**: Changes in novelty indicators
- **Weakness Metrics**: Changes in weakness detection
- **Clarity Metrics**: Changes in clarity assessment
- **Reviewer Feedback**: Changes in simulated reviewer concerns

### Summary Tab
- Total counts of added/removed/persistent findings
- Overall statistics across all modules
- Important notes about interpretation

## Important Notes

### Cautious Language
The comparison system uses **cautious language** throughout:
- Reports "detected changes" rather than "improvements"
- Shows "measurable differences" rather than value judgments
- Uses phrases like "appears to" and "may indicate"

### Never Claims "Improvement"
The system **NEVER** claims that a paper "improved" unless it can point to specific measurable detected changes. Changes in metrics are presented neutrally as "increase" or "decrease" without implying quality.

### Manual Verification Required
All detected changes should be **manually verified** by the researcher:
- The system detects patterns, not truth
- False positives and false negatives are possible
- Context and intent matter more than raw metrics

## Technical Details

### Database Structure
- Each version stores: paper_id, version_number, content, filename, uploaded_at
- Analysis results are stored as JSON in the `analysis_results` field
- Versions are linked to papers via `paper_id`

### API Endpoints
- `POST /api/v1/papers/{paper_id}/versions/upload` - Upload new version
- `GET /api/v1/papers/{paper_id}/versions` - List all versions
- `PUT /api/v1/papers/{paper_id}/versions/{version_id}/analysis` - Update analysis
- `GET /api/v1/papers/{paper_id}/versions/compare` - Compare two versions

### Comparison Algorithm
1. Extracts all findings from both versions
2. Creates signatures for each finding based on type and content
3. Identifies added, removed, and persistent findings
4. Compares module-level scores
5. Generates summary with cautious language

## Best Practices

1. **Version Naming**: Use clear, descriptive filenames (e.g., "paper_v1_initial.pdf", "paper_v2_after_review.pdf")
2. **Complete Analysis**: Ensure both versions have complete analysis results before comparing
3. **Sequential Versions**: Upload versions in chronological order for clearer tracking
4. **Review Context**: Always review the actual paper changes alongside the analysis comparison
5. **Multiple Comparisons**: Compare Version 1→2, then 2→3 to track progression over time

## Limitations

- Only supports PDF files
- Comparison requires both versions to have analysis results
- Finding signatures are approximate - similar issues may not match perfectly
- Does not track in-document changes (use git or Word track changes for that)
- Comparison is analysis-focused, not content-focused

## Future Enhancements

Potential future features:
- Side-by-side PDF viewing
- Diff highlighting in the paper viewer
- Automated re-analysis when new version uploaded
- Export comparison reports
- Version branching and merging
- Collaborative annotations per version
