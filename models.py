import os
import requests

HF_API_TOKEN = os.getenv('HF_API_TOKEN')
HF_API_URL = "https://api-inference.huggingface.co/models/"

HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}

def hf_inference(model: str, payload: dict):
    url = HF_API_URL + model
    response = requests.post(url, headers=HEADERS, json=payload, timeout=60)
    response.raise_for_status()
    return response.json()

# --- Compliance Analysis ---
import re

from transformers import pipeline
from functools import lru_cache

@lru_cache(maxsize=1)
def get_legalbert_pipeline():
    return pipeline("text-classification", model="nlpaueb/legal-bert-base-uncased")

@lru_cache(maxsize=1)
def get_flan_t5_pipeline():
    return pipeline("text2text-generation", model="google/flan-t5-base")

@lru_cache(maxsize=1)
def get_distilbart_pipeline():
    return pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

def analyze_compliance(document_text):
    import re
    clause_results = []
    compliant_count = 0
    non_compliant_count = 0
    legalbert = get_legalbert_pipeline()
    flan_t5 = get_flan_t5_pipeline()
    distilbart = get_distilbart_pipeline()
    # Split the document into clauses (heuristic: split by double newlines or numbered headings)
    clauses = re.split(r'\n{2,}|(?=Clause \d+)', document_text)
    for idx, clause in enumerate([c.strip() for c in clauses if c.strip()]):
        try:
            compliance_result = legalbert(clause)
            label = compliance_result[0]['label']
            score = compliance_result[0].get('score', 0.8)
            compliant = label in ['LABEL_1', 'POSITIVE', 'COMPLIANT']
            suggestion = None
            if not compliant:
                try:
                    rewrite_result = flan_t5(f"Rewrite this clause to be RBI compliant: {clause}")
                    suggestion = rewrite_result[0]['generated_text'] if isinstance(rewrite_result, list) and 'generated_text' in rewrite_result[0] else None
                except Exception as e:
                    suggestion = f"Error generating suggestion: {str(e)}"
            rule = "General RBI Guidelines for Digital Lending"
            if not compliant and 'penalty' in clause.lower():
                rule = "RBI/2022-23/45 - Penalty and Late Payment Guidelines"
            if compliant:
                compliant_count += 1
            else:
                non_compliant_count += 1
            clause_results.append({
                'id': idx+1,
                'text': clause,
                'status': 'compliant' if compliant else 'non-compliant',
                'confidence': score,
                'rule': rule,
                'suggestion': suggestion
            })
        except Exception as e:
            clause_results.append({
                'id': idx+1,
                'text': clause,
                'status': 'error',
                'confidence': 0.0,
                'rule': None,
                'suggestion': f'Error analyzing clause: {str(e)}'
            })
    overall = 'Compliant' if non_compliant_count == 0 else ('Partial' if compliant_count > 0 else 'Non-compliant')
    try:
        summary_result = distilbart(document_text)
        summary = summary_result[0]['summary_text'] if isinstance(summary_result, list) and 'summary_text' in summary_result[0] else None
    except Exception as e:
        summary = f'Error generating summary: {str(e)}'
    return {
        'overallCompliance': overall,
        'compliantClauses': compliant_count,
        'nonCompliantClauses': non_compliant_count,
        'clauses': clause_results,
        'summary': summary
    }


def get_bart_mnli():
    global _bart_mnli
    with _model_lock:
        if _bart_mnli is None:
            _bart_mnli = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        return _bart_mnli

def get_spam_bert():
    global _spam_bert
    with _model_lock:
        if _spam_bert is None:
            _spam_bert = pipeline("text-classification", model="mrm8488/bert-tiny-finetuned-sms-spam-detection")
        return _spam_bert

# --- Compliance Analysis Logic ---


# --- Placeholder for Loan Risk ---
def analyze_loan_risk(input_data):
    # TODO: Replace with real model
    score = (input_data.get('credit_score', 0) / 850) * 0.5 + (input_data.get('income', 0) / (input_data.get('amount_requested', 1) + 1)) * 0.5
    risk_score = min(max(score, 0), 1)
    if risk_score > 0.7:
        risk_level = "LOW"
        explanation = "Applicant has high credit score and/or sufficient income."
    elif risk_score > 0.4:
        risk_level = "MEDIUM"
        explanation = "Applicant has moderate risk factors."
    else:
        risk_level = "HIGH"
        explanation = "Applicant has low credit score and/or insufficient income."
    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "explanation": explanation
    }

# --- Fraud Detection ---
def detect_fraud(text):
    bart_mnli = get_bart_mnli()
    spam_bert = get_spam_bert()
    nli_labels = ["fake", "contradictory", "real"]
    nli_result = bart_mnli(text, nli_labels)
    spam_result = spam_bert(text)
    return {
        "nli_result": nli_result,
        "spam_result": spam_result
    }
