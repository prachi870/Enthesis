# Datasets (record source + license BEFORE use)

## Module 1: Related Work

### SciERC
- **Source**: https://github.com/allenai/sciERC (Kaggle mirror used)
- **Paper**: Luan et al. (2018) - "Multi-Task Identification of Entities, Relations, and Coreference for Scientific Knowledge Graph Construction"
- **License**: ✅ Academic research use permitted (verified from Kaggle dataset)
- **Downloaded**: 2024-09-28 via Kaggle (sciERC-LLM-KG dataset)
- **Location**: `data/raw/scierc/` (train.csv, dev.csv, test.csv)
- **Size**: 500 documents (350 train, 50 dev, 100 test)
- **Task**: Entity extraction (methods, datasets, metrics, tasks, materials)
- **Metric**: F1 for entity extraction
- **Status**: ✅ Downloaded and preprocessed

### S2ORC / Semantic Scholar
- **Source**: https://www.semanticscholar.org/product/api
- **Documentation**: https://api.semanticscholar.org/api-docs/
- **License**: Semantic Scholar API Terms of Service (non-commercial research allowed)
- **Access**: REST API (requires API key for high volume)
- **Task**: Paper retrieval corpus
- **Metric**: Recall@k
- **Status**: ⚠️ Not configured yet - TERMS OF SERVICE MUST BE REVIEWED

---

## Module 2: Novelty

### SciFact
- **Source**: https://github.com/allenai/scifact (Kaggle mirror used)
- **Paper**: Wadden et al. (2020) - "Fact or Fiction: Verifying Scientific Claims"
- **License**: ✅ Apache 2.0 (verified)
- **Downloaded**: 2024-09-28 via Kaggle (SciFact Scientific Claims dataset)
- **Location**: `data/raw/scifact/` (claims_train.jsonl, claims_test.jsonl, corpus.jsonl)
- **Size**: 1,561 claims (1,261 train, 300 test) + 5,183 corpus documents
- **Task**: Claim verification (SUPPORTS, REFUTES, NOT_ENOUGH_INFO)
- **Metric**: Accuracy, F1
- **Status**: ✅ Downloaded and preprocessed

---

## Module 3: Weaknesses Detection

### PeerRead (Used instead of OpenReview)
- **Source**: https://github.com/allenai/PeerRead
- **Paper**: Kang et al. (2018) - "A Dataset of Peer Reviews (PeerRead): Collection, Insights and NLP Applications"
- **License**: ✅ MIT License (verified)
- **Downloaded**: 2024-09-28 via git clone
- **Location**: `data/raw/peerread/data/acl_2017/`
- **Size**: 137 papers with reviews (123 train, 7 dev, 7 test)
- **Task**: Classify reviewer comments into weakness categories
- **Metric**: Precision and Recall per category
- **Status**: ✅ Downloaded - ready for use
- **Note**: Contains review comments with strengths/weaknesses sections

---

## Module 4: Reviewer-Style Feedback

### PeerRead (same as Module 3)
- Used for analyzing review styles and generating feedback
- **Status**: ✅ Available (137 papers with reviews)
- **Note**: Module 4 deferred to Phase 2 per implementation plan

---

## Module 5: Clarity Check

### PeerRead ACL 2017
- **Source**: Same PeerRead dataset used for Modules 3 & 4
- **License**: ✅ MIT License
- **Downloaded**: 2024-09-28
- **Location**: `data/raw/peerread/data/acl_2017/`
- **Size**: 137 papers (accepted from ACL 2017)
- **Task**: Distinguish clear vs unclear writing using style features
- **Metrics**: Style features (sentence length variance, hedging, repetition)
- **Status**: ✅ Downloaded and ready

---

## Legal & Ethical Compliance

### Before Using Any Dataset:

1. ✅ Read the license or terms of service
2. ✅ Verify non-commercial research use is permitted
3. ✅ Check if attribution is required
4. ✅ Verify redistribution restrictions
5. ✅ Document any usage limitations
6. ✅ For human-authored content (reviews), ensure ethical use

### Privacy Considerations:
- OpenReview reviews are publicly available but should be used respectfully
- Do not scrape or store personal information about reviewers
- Generated feedback must be clearly labeled as AI-generated

### Current Status: ⚠️ NO DATASETS HAVE BEEN DOWNLOADED OR VERIFIED

**ACTION REQUIRED**: Verify licenses for each dataset before proceeding with download and use.
