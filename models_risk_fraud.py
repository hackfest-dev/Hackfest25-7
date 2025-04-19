import numpy as np
import os
import joblib
from transformers import pipeline
from threading import Lock

# --- Tabular Loan Risk Model (Random Forest/XGBoost) ---
_model_lock = Lock()
_risk_model = None
_isolation_forest = None

MODEL_PATH = os.getenv('RISK_MODEL_PATH', 'loan_risk_model.pkl')
ANOMALY_MODEL_PATH = os.getenv('ANOMALY_MODEL_PATH', 'fraud_isolation_forest.pkl')

# Load tabular risk model (Random Forest/XGBoost)
def get_risk_model():
    global _risk_model
    with _model_lock:
        if _risk_model is None:
            _risk_model = joblib.load(MODEL_PATH)
        return _risk_model

# Load Isolation Forest for anomaly detection
def get_isolation_forest():
    global _isolation_forest
    with _model_lock:
        if _isolation_forest is None:
            _isolation_forest = joblib.load(ANOMALY_MODEL_PATH)
        return _isolation_forest

# HuggingFace pipelines for text fraud detection and NLI
_spam_bert = None
_bart_mnli = None

def get_spam_bert():
    global _spam_bert
    with _model_lock:
        if _spam_bert is None:
            _spam_bert = pipeline("text-classification", model="mrm8488/bert-tiny-finetuned-sms-spam-detection")
        return _spam_bert

def get_bart_mnli():
    global _bart_mnli
    with _model_lock:
        if _bart_mnli is None:
            _bart_mnli = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        return _bart_mnli

# --- Loan Risk Scoring (Tabular) ---
import requests


def score_loan_risk_tabular(features: dict):
    """
    Uses Hugging Face Inference API with mindsdb/tabular-financial-forecasting for tabular loan risk prediction.
    Expects features as a dict of tabular fields.
    """
    HF_API_TOKEN = os.getenv('HF_API_TOKEN')
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}
    api_url = "https://api-inference.huggingface.co/models/mindsdb/tabular-financial-forecasting"
    payload = {"inputs": features}
    try:
        response = requests.post(api_url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        output = response.json()
        risk_score = output.get('score') or output.get('probability') or 0.0
        if risk_score < 0.33:
            risk_level = 'Low'
        elif risk_score < 0.66:
            risk_level = 'Medium'
        else:
            risk_level = 'High'
        riskData = [
            {
                'name': risk_level,
                'value': float(risk_score) * 100,
                'color': '#FF4C4C' if risk_level == 'High' else ('#FFD700' if risk_level == 'Medium' else '#4CAF50'),
            },
            {
                'name': 'Other',
                'value': 100 - float(risk_score) * 100,
                'color': '#E0E0E0',
            }
        ]
        result = {
            'risk_score': float(risk_score),
            'riskLevel': risk_level,
            'riskData': riskData,
            'factors': [],
            'maxLoanAmount': 'N/A',
            'interestRateRange': 'N/A',
            'recommendations': [],
            'explanation': 'Score computed by Hugging Face transformer tabular model.'
        }
        return result
    except Exception as e:
        return {'error': f'Failed to score loan risk: {str(e)}'}


def score_loan_risk_hf_saifhmb(features: dict):
    """
    Uses Hugging Face Inference API for saifhmb/Credit-Card-Risk-Model (Logistic Regression).
    Returns creditworthy, default_probability, and explanation. Falls back to score_loan_risk_tabular on error.
    """
    HF_API_TOKEN = os.getenv('HF_API_TOKEN')
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}
    api_url = "https://api-inference.huggingface.co/models/saifhmb/Credit-Card-Risk-Model"
    payload = {"inputs": features}
    try:
        response = requests.post(api_url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        output = response.json()
        if 'error' in output or output is None:
            raise Exception(output.get('error', 'Unknown error from HF API'))
        creditworthy = output.get('creditworthy')
        default_prob = output.get('default_probability')
        return {
            'creditworthy': creditworthy,
            'default_probability': default_prob,
            'explanation': 'Score computed by Hugging Face saifhmb/Credit-Card-Risk-Model.',
            'used_fallback': False
        }
    except Exception as e:
        fallback_result = score_loan_risk_tabular(features)
        fallback_result['explanation'] = f"Score computed by local ML model due to Hugging Face error: {str(e)}"
        fallback_result['used_fallback'] = True
        return fallback_result


def predict_loan_risk_flan_t5(features: dict):
    """
    Real-Time Loan Risk Analysis using a custom algorithm based on credit score, salary, loan amount, and social media.
    Returns risk_level, risk_score, riskData, explanation, factors, maxLoanAmount, and interestRateRange.
    """
    # Extract features
    credit_score = float(features.get('credit_score', 0))
    salary = float(features.get('income', 0))
    loan_amount = float(features.get('loan_amount', 0))
    employment = str(features.get('employment', '')).lower()
    socials = str(features.get('socials', '')).lower()
    # Heuristic scoring
    risk_score = 0.5
    risk_factors = []
    if credit_score < 600:
        risk_score += 0.25
        risk_factors.append('Low credit score')
    elif credit_score > 750:
        risk_score -= 0.15
        risk_factors.append('Excellent credit score')
    if salary < 20000:
        risk_score += 0.15
        risk_factors.append('Low salary')
    elif salary > 100000:
        risk_score -= 0.10
        risk_factors.append('High salary')
    if loan_amount > 3 * salary:
        risk_score += 0.15
        risk_factors.append('High loan amount relative to salary')
    if 'unemployed' in employment:
        risk_score += 0.20
        risk_factors.append('Unemployed')
    if 'linkedin' in socials or 'github' in socials:
        risk_score -= 0.05
        risk_factors.append('Professional social media presence')
    risk_score = min(max(risk_score, 0.0), 1.0)
    if risk_score < 0.33:
        risk_level = 'Low'
    elif risk_score < 0.66:
        risk_level = 'Medium'
    else:
        risk_level = 'High'
    color_map = {'High': '#FF4C4C', 'Medium': '#FFD700', 'Low': '#4CAF50'}
    riskData = [
        {'name': risk_level, 'value': risk_score * 100, 'color': color_map.get(risk_level, '#FFD700')},
        {'name': 'Safe Margin', 'value': 100 - risk_score * 100, 'color': '#E0E0E0'}
    ]
    # Calculate max loan and interest rate
    if risk_level == 'Low':
        max_loan = round(salary * 5)
        interest_range = '7% - 10%'
    elif risk_level == 'Medium':
        max_loan = round(salary * 2.5)
        interest_range = '10% - 16%'
    else:
        max_loan = round(salary)
        interest_range = '16% - 25%'
    return {
        'risk_level': risk_level,
        'risk_score': risk_score,
        'riskData': riskData,
        'explanation': 'Risk computed by custom algorithm based on credit score, salary, loan amount, and social media.',
        'factors': risk_factors,
        'maxLoanAmount': f'₹{max_loan:,}',
        'interestRateRange': interest_range,
        'used_fallback': True
    }

    """
    Uses Hugging Face Inference API with mindsdb/tabular-financial-forecasting for tabular loan risk prediction.
    Expects features as a dict of tabular fields.
    """
    HF_API_TOKEN = os.getenv('HF_API_TOKEN')
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"} if HF_API_TOKEN else {}
    api_url = "https://api-inference.huggingface.co/models/mindsdb/tabular-financial-forecasting"
    payload = {"inputs": features}
    try:
        response = requests.post(api_url, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        output = response.json()
        # Example output: {'label': 'default', 'score': 0.72} or similar
        risk_score = output.get('score') or output.get('probability') or 0.0
        if risk_score < 0.33:
            risk_level = 'Low'
        elif risk_score < 0.66:
            risk_level = 'Medium'
        else:
            risk_level = 'High'
        # Compose riskData for PieChart
        riskData = [
            {
                'name': risk_level,
                'value': float(risk_score) * 100,
                'color': '#FF4C4C' if risk_level == 'High' else ('#FFD700' if risk_level == 'Medium' else '#4CAF50'),
            },
            {
                'name': 'Other',
                'value': 100 - float(risk_score) * 100,
                'color': '#E0E0E0',
            }
        ]
        # Default values for other fields
        result = {
            'risk_score': float(risk_score),
            'riskLevel': risk_level,
            'riskData': riskData,
            'factors': [],
            'maxLoanAmount': 'N/A',
            'interestRateRange': 'N/A',
            'recommendations': [],
            'explanation': 'Score computed by Hugging Face transformer tabular model.'
        }
        return result
    except Exception as e:
        return {'error': f'Failed to score loan risk: {str(e)}'}


