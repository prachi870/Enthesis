"""
Module 1: Paper Retrieval Training Script
Train Sentence-BERT for semantic paper retrieval with FAISS indexing
Target: Recall@5 >= 0.50 (Baseline: 0.280)
"""

import json
import torch
import numpy as np
import faiss
from pathlib import Path
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader
from sklearn.metrics.pairwise import cosine_similarity
import sys
sys.path.append(str(Path(__file__).parent.parent))
from experiments.wandb_utils import EnthesisExperiment, load_baseline_scores

def load_scierc_for_retrieval(split="train"):
    """Load SciERC data for retrieval task."""
    data_path = Path(f"data/raw/scierc/{split}.json")
    
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    documents = []
    for doc in data:
        doc_key = doc['doc_key']
        sentences = doc['sentences']
        
        # Concatenate all sentences in document
        text = []
        for sent in sentences:
            if isinstance(sent[0], list):
                sent = sent[0]
            text.append(" ".join(sent))
        
        full_text = " ".join(text)
        
        documents.append({
            "doc_key": doc_key,
            "text": full_text,
            "sentences": text
        })
    
    return documents

def create_retrieval_pairs(documents):
    """Create positive pairs for contrastive learning."""
    # For SciERC, we'll use sentences from same document as positives
    pairs = []
    
    for doc in documents:
        sentences = doc['sentences']
        if len(sentences) < 2:
            continue
        
        # Pairs of sentences from same document
        for i in range(len(sentences) - 1):
            for j in range(i + 1, min(i + 3, len(sentences))):  # Nearby sentences
                pairs.append(InputExample(texts=[sentences[i], sentences[j]]))
    
    return pairs

def build_faiss_index(embeddings):
    """Build FAISS index for efficient retrieval."""
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)  # Inner product (cosine similarity)
    
    # Normalize embeddings for cosine similarity
    faiss.normalize_L2(embeddings)
    index.add(embeddings)
    
    return index

def evaluate_retrieval(model, test_documents, k_values=[5, 10]):
    """Evaluate retrieval performance."""
    # Create corpus embeddings
    corpus_texts = [doc['text'] for doc in test_documents]
    corpus_embeddings = model.encode(corpus_texts, convert_to_numpy=True, show_progress_bar=True)
    
    # Build FAISS index
    index = build_faiss_index(corpus_embeddings.astype('float32'))
    
    # For each document, use first sentence as query
    recalls = {f"recall@{k}": [] for k in k_values}
    
    for i, doc in enumerate(test_documents):
        if len(doc['sentences']) < 2:
            continue
        
        # Query is first sentence
        query = doc['sentences'][0]
        query_embedding = model.encode([query], convert_to_numpy=True)
        query_embedding = query_embedding.astype('float32')
        faiss.normalize_L2(query_embedding)
        
        # Search
        for k in k_values:
            _, indices = index.search(query_embedding, k)
            
            # Check if correct document is in top-k
            if i in indices[0]:
                recalls[f"recall@{k}"].append(1.0)
            else:
                recalls[f"recall@{k}"].append(0.0)
    
    # Average recalls
    results = {key: np.mean(values) if values else 0.0 for key, values in recalls.items()}
    
    return results, index

def main():
    print("=" * 70)
    print("MODULE 1: PAPER RETRIEVAL TRAINING")
    print("=" * 70)
    
    # Set device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"\nDevice: {device}")
    
    # Load data
    print("\n1. Loading SciERC data for retrieval...")
    train_docs = load_scierc_for_retrieval("train")
    dev_docs = load_scierc_for_retrieval("dev")
    test_docs = load_scierc_for_retrieval("test")
    
    print(f"   Train: {len(train_docs)} documents")
    print(f"   Dev: {len(dev_docs)} documents")
    print(f"   Test: {len(test_docs)} documents")
    
    # Create training pairs
    print("\n2. Creating training pairs...")
    train_pairs = create_retrieval_pairs(train_docs)
    print(f"   Training pairs: {len(train_pairs)}")
    
    # Load pre-trained model
    print("\n3. Loading Sentence-BERT model...")
    model_name = "sentence-transformers/allenai-specter"  # Scientific paper embeddings
    model = SentenceTransformer(model_name)
    print(f"   Model: {model_name}")
    
    # Initialize W&B tracking
    print("\n4. Initializing W&B tracking...")
    baseline_scores = load_baseline_scores(module_number=1)
    
    exp = EnthesisExperiment(
        module_number=1,
        model_name="SPECTER-Retrieval",
        config={
            "model": model_name,
            "task": "paper_retrieval",
            "batch_size": 32,
            "epochs": 3,
            "warmup_steps": 100,
            "baseline_recall@5": baseline_scores.get("retrieval_recall@5", 0.0)
        },
        tags=["retrieval", "sentence-bert", "scierc", "phase2"],
        notes="Fine-tuning SPECTER for paper retrieval on SciERC"
    )
    
    # Training
    if len(train_pairs) > 0:
        print("\n5. Fine-tuning model...")
        train_dataloader = DataLoader(train_pairs, shuffle=True, batch_size=32)
        
        # Use MultipleNegativesRankingLoss
        train_loss = losses.MultipleNegativesRankingLoss(model)
        
        # Train
        model.fit(
            train_objectives=[(train_dataloader, train_loss)],
            epochs=3,
            warmup_steps=100,
            output_path="models/module1_retrieval",
            show_progress_bar=True
        )
        
        print("   ✓ Fine-tuning complete")
    else:
        print("\n5. Skipping fine-tuning (using pre-trained model)")
    
    # Evaluate on dev set
    print("\n6. Evaluating on dev set...")
    dev_results, _ = evaluate_retrieval(model, dev_docs)
    
    print("   Dev Results:")
    for metric, value in dev_results.items():
        print(f"   {metric}: {value:.4f}")
        exp.log_metrics({f"dev_{metric}": value})
    
    # Evaluate on test set
    print("\n7. Evaluating on test set...")
    test_results, faiss_index = evaluate_retrieval(model, test_docs)
    
    print("\n" + "=" * 70)
    print("TEST SET RESULTS")
    print("=" * 70)
    for metric, value in test_results.items():
        print(f"{metric}: {value:.4f}")
    
    # Log comparison with baseline
    current_scores = {
        "retrieval_recall@5": test_results['recall@5'],
        "retrieval_recall@10": test_results.get('recall@10', 0.0)
    }
    
    baseline_comparison = {
        "retrieval_recall@5": baseline_scores.get("retrieval_recall@5", 0.0),
    }
    
    exp.log_baseline_comparison(baseline_comparison, current_scores)
    
    # Save model
    print("\n8. Saving model...")
    model_path = Path("models/module1_retrieval/final")
    model_path.mkdir(parents=True, exist_ok=True)
    model.save(str(model_path))
    
    # Save FAISS index
    faiss_path = model_path / "faiss_index.bin"
    faiss.write_index(faiss_index, str(faiss_path))
    print(f"   ✓ Model saved to {model_path}")
    print(f"   ✓ FAISS index saved to {faiss_path}")
    
    # Save as W&B artifact
    exp.save_model_artifact(model_path)
    
    # Check if baseline beaten
    baseline_recall = baseline_scores.get("retrieval_recall@5", 0.0)
    improvement = test_results['recall@5'] - baseline_recall
    
    print("\n" + "=" * 70)
    print("BASELINE COMPARISON")
    print("=" * 70)
    print(f"Baseline Recall@5: {baseline_recall:.4f}")
    print(f"Current Recall@5: {test_results['recall@5']:.4f}")
    print(f"Improvement: {improvement:+.4f}")
    
    if test_results['recall@5'] >= 0.50:
        print("✅ TARGET ACHIEVED: Recall@5 >= 0.50")
    else:
        print(f"⚠ Target not reached. Need {0.50 - test_results['recall@5']:.4f} more")
    
    # Finish W&B run
    exp.finish()
    
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE!")
    print("=" * 70)
    
    return test_results

if __name__ == "__main__":
    results = main()
