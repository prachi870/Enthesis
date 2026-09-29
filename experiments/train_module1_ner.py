"""
Module 1: Entity Extraction Training Script
Fine-tune SciBERT on SciERC dataset for Named Entity Recognition
Target: F1 >= 0.70 (Baseline: 0.000)
"""

import json
import torch
import numpy as np
from pathlib import Path
from transformers import (
    AutoTokenizer,
    AutoModelForTokenClassification,
    TrainingArguments,
    Trainer,
    DataCollatorForTokenClassification
)
from datasets import Dataset
from sklearn.metrics import precision_recall_fscore_support, classification_report
import sys
sys.path.append(str(Path(__file__).parent.parent))
from experiments.wandb_utils import EnthesisExperiment, load_baseline_scores

# Entity types in SciERC
ENTITY_LABELS = [
    "O",  # Outside
    "B-Method", "I-Method",
    "B-Task", "I-Task", 
    "B-Material", "I-Material",
    "B-Metric", "I-Metric",
    "B-OtherScientificTerm", "I-OtherScientificTerm",
    "B-Generic", "I-Generic"
]

label2id = {label: idx for idx, label in enumerate(ENTITY_LABELS)}
id2label = {idx: label for label, idx in label2id.items()}

def load_scierc_data(split="train"):
    """Load SciERC data and convert to NER format."""
    data_path = Path(f"data/raw/scierc/{split}.json")
    
    with open(data_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    examples = []
    for doc in data:
        doc_key = doc['doc_key']
        sentences = doc['sentences']
        ner_labels = doc.get('ner', [])
        
        for sent_idx, (sentence, ner_spans) in enumerate(zip(sentences, ner_labels)):
            # Flatten nested sentence structure if needed
            if isinstance(sentence[0], list):
                sentence = sentence[0]
            
            # Initialize all tokens as "O"
            labels = ["O"] * len(sentence)
            
            # Fill in entity labels
            for start, end, entity_type in ner_spans:
                labels[start] = f"B-{entity_type}"
                for i in range(start + 1, end + 1):
                    labels[i] = f"I-{entity_type}"
            
            examples.append({
                "doc_key": doc_key,
                "tokens": sentence,
                "ner_tags": [label2id.get(label, 0) for label in labels]
            })
    
    return examples

def tokenize_and_align_labels(examples, tokenizer):
    """Tokenize and align labels with subword tokens."""
    tokenized_inputs = tokenizer(
        examples["tokens"],
        truncation=True,
        is_split_into_words=True,
        padding=False,
        max_length=512
    )
    
    labels = []
    for i, label in enumerate(examples["ner_tags"]):
        word_ids = tokenized_inputs.word_ids(batch_index=i)
        previous_word_idx = None
        label_ids = []
        
        for word_idx in word_ids:
            if word_idx is None:
                # Special tokens get -100
                label_ids.append(-100)
            elif word_idx != previous_word_idx:
                # First subword gets the label
                label_ids.append(label[word_idx])
            else:
                # Other subwords get -100 (ignore in loss)
                label_ids.append(-100)
            previous_word_idx = word_idx
        
        labels.append(label_ids)
    
    tokenized_inputs["labels"] = labels
    return tokenized_inputs

def compute_metrics(pred):
    """Compute precision, recall, F1 for NER."""
    predictions, labels = pred
    predictions = np.argmax(predictions, axis=2)
    
    # Remove ignored index (special tokens)
    true_predictions = [
        [id2label[p] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]
    true_labels = [
        [id2label[l] for (p, l) in zip(prediction, label) if l != -100]
        for prediction, label in zip(predictions, labels)
    ]
    
    # Flatten for sklearn metrics
    flat_preds = [item for sublist in true_predictions for item in sublist]
    flat_labels = [item for sublist in true_labels for item in sublist]
    
    # Calculate metrics (ignoring "O" label for entity-level metrics)
    entity_labels = [l for l in ENTITY_LABELS if l != "O"]
    precision, recall, f1, _ = precision_recall_fscore_support(
        flat_labels, 
        flat_preds, 
        labels=entity_labels,
        average='micro',
        zero_division=0
    )
    
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1
    }

def main():
    print("=" * 70)
    print("MODULE 1: ENTITY EXTRACTION TRAINING")
    print("=" * 70)
    
    # Set device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"\nDevice: {device}")
    
    # Load data
    print("\n1. Loading SciERC data...")
    train_examples = load_scierc_data("train")
    dev_examples = load_scierc_data("dev")
    test_examples = load_scierc_data("test")
    
    print(f"   Train: {len(train_examples)} examples")
    print(f"   Dev: {len(dev_examples)} examples")
    print(f"   Test: {len(test_examples)} examples")
    print(f"   Entity types: {len(ENTITY_LABELS)} labels")
    
    # Load tokenizer and model
    print("\n2. Loading SciBERT model...")
    model_name = "allenai/scibert_scivocab_uncased"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForTokenClassification.from_pretrained(
        model_name,
        num_labels=len(ENTITY_LABELS),
        id2label=id2label,
        label2id=label2id
    )
    print(f"   Model: {model_name}")
    print(f"   Parameters: {model.num_parameters():,}")
    
    # Convert to HF datasets
    print("\n3. Tokenizing data...")
    train_dataset = Dataset.from_list(train_examples)
    dev_dataset = Dataset.from_list(dev_examples)
    test_dataset = Dataset.from_list(test_examples)
    
    train_dataset = train_dataset.map(
        lambda x: tokenize_and_align_labels(x, tokenizer),
        batched=True,
        remove_columns=train_dataset.column_names
    )
    dev_dataset = dev_dataset.map(
        lambda x: tokenize_and_align_labels(x, tokenizer),
        batched=True,
        remove_columns=dev_dataset.column_names
    )
    test_dataset = test_dataset.map(
        lambda x: tokenize_and_align_labels(x, tokenizer),
        batched=True,
        remove_columns=test_dataset.column_names
    )
    
    # Initialize W&B tracking
    print("\n4. Initializing W&B tracking...")
    baseline_scores = load_baseline_scores(module_number=1)
    
    exp = EnthesisExperiment(
        module_number=1,
        model_name="SciBERT-NER",
        config={
            "model": model_name,
            "task": "entity_extraction",
            "learning_rate": 2e-5,
            "batch_size": 16,
            "epochs": 5,
            "max_length": 512,
            "warmup_ratio": 0.1,
            "baseline_f1": baseline_scores.get("entity_f1", 0.0)
        },
        tags=["entity-extraction", "ner", "scierc", "phase2"],
        notes="Fine-tuning SciBERT for entity extraction on SciERC dataset"
    )
    
    # Training arguments
    output_dir = Path("models/module1_ner")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    training_args = TrainingArguments(
        output_dir=str(output_dir),
        eval_strategy="epoch",
        save_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=16,
        per_device_eval_batch_size=32,
        num_train_epochs=5,
        weight_decay=0.01,
        warmup_steps=100,  # Changed from warmup_ratio
        logging_steps=50,
        save_total_limit=2,
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        report_to="wandb",
        run_name=exp.run.name
    )
    
    # Data collator
    data_collator = DataCollatorForTokenClassification(tokenizer)
    
    # Trainer
    print("\n5. Setting up trainer...")
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=dev_dataset,
        tokenizer=tokenizer,
        data_collator=data_collator,
        compute_metrics=compute_metrics
    )
    
    # Train
    print("\n6. Starting training...")
    print("=" * 70)
    trainer.train()
    
    # Evaluate on test set
    print("\n7. Evaluating on test set...")
    test_results = trainer.evaluate(test_dataset)
    
    print("\n" + "=" * 70)
    print("TEST SET RESULTS")
    print("=" * 70)
    print(f"Precision: {test_results['eval_precision']:.4f}")
    print(f"Recall: {test_results['eval_recall']:.4f}")
    print(f"F1 Score: {test_results['eval_f1']:.4f}")
    
    # Log comparison with baseline
    current_scores = {
        "entity_f1": test_results['eval_f1'],
        "entity_precision": test_results['eval_precision'],
        "entity_recall": test_results['eval_recall']
    }
    
    baseline_comparison = {
        "entity_f1": baseline_scores.get("entity_f1", 0.0),
    }
    
    exp.log_baseline_comparison(baseline_comparison, current_scores)
    
    # Save final model
    print("\n8. Saving model...")
    final_model_path = output_dir / "final"
    trainer.save_model(str(final_model_path))
    tokenizer.save_pretrained(str(final_model_path))
    
    # Save as W&B artifact
    exp.save_model_artifact(final_model_path)
    
    # Check if baseline beaten
    baseline_f1 = baseline_scores.get("entity_f1", 0.0)
    improvement = test_results['eval_f1'] - baseline_f1
    
    print("\n" + "=" * 70)
    print("BASELINE COMPARISON")
    print("=" * 70)
    print(f"Baseline F1: {baseline_f1:.4f}")
    print(f"Current F1: {test_results['eval_f1']:.4f}")
    print(f"Improvement: {improvement:+.4f}")
    
    if test_results['eval_f1'] >= 0.70:
        print("✅ TARGET ACHIEVED: F1 >= 0.70")
    else:
        print(f"⚠ Target not reached. Need {0.70 - test_results['eval_f1']:.4f} more F1")
    
    # Finish W&B run
    exp.finish()
    
    print("\n" + "=" * 70)
    print("TRAINING COMPLETE!")
    print("=" * 70)
    
    return test_results

if __name__ == "__main__":
    results = main()
