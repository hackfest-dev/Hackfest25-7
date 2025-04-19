import numpy as np
from transformers import pipeline
from threading import Lock
import joblib
import os

_model_lock = Lock()
_isolation_forest = None

ANOMALY_MODEL_PATH = os.getenv('ANOMALY_MODEL_PATH', 'fraud_isolation_forest.pkl')

def get_isolation_forest():
    global _isolation_forest
    with _model_lock:
        if _isolation_forest is None:
            _isolation_forest = joblib.load(ANOMALY_MODEL_PATH)
        return _isolation_forest

def get_spam_bert():
    global _spam_bert
    with _model_lock:
        if not hasattr(get_spam_bert, '_spam_bert'):
            get_spam_bert._spam_bert = pipeline("text-classification", model="mrm8488/bert-tiny-finetuned-sms-spam-detection")
        return get_spam_bert._spam_bert

def get_bart_mnli():
    global _bart_mnli
    with _model_lock:
        if not hasattr(get_bart_mnli, '_bart_mnli'):
            get_bart_mnli._bart_mnli = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
        return get_bart_mnli._bart_mnli

def detect_fraud_advanced(tabular_features: dict, text_fields: dict = None):
    """
    Robust fraud detection: runs Isolation Forest if all numeric features are present and valid, otherwise skips it.
    Always returns a valid response with as much analysis as possible.
    """
    anomaly_score = None
    is_anomaly = None
    isolation_error = None
    # Try to run Isolation Forest only if all required fields are present and numeric
    try:
        required_fields = ['age', 'income', 'credit_score', 'existing_loans', 'loan_amount']
        X_vals = []
        for key in required_fields:
            val = tabular_features.get(key, None)
            if val is None:
                raise ValueError(f"Missing field: {key}")
            try:
                X_vals.append(float(val))
            except Exception:
                raise ValueError(f"Invalid value for {key}: {val}")
        X = np.array([X_vals], dtype=float)
        isolation_forest = get_isolation_forest()
        anomaly_score = -isolation_forest.decision_function(X)[0]
        is_anomaly = isolation_forest.predict(X)[0] == -1
    except Exception as e:
        isolation_error = str(e)

    # Textual fraud detection
    text_result = None
    if text_fields and 'application_text' in text_fields:
        try:
            spam_bert = get_spam_bert()
            text_result = spam_bert(text_fields['application_text'])
        except Exception as e:
            text_result = {'error': f'Text fraud model failed: {str(e)}'}

    # NLI logic validation
    nli_result = None
    if text_fields and 'application_text' in text_fields:
        try:
            bart_mnli = get_bart_mnli()
            nli_labels = ["fake", "contradictory", "real"]
            nli_result = bart_mnli(text_fields['application_text'], nli_labels)
        except Exception as e:
            nli_result = {'error': f'NLI model failed: {str(e)}'}

    return {
        'anomaly_score': float(anomaly_score) if anomaly_score is not None else None,
        'is_anomaly': bool(is_anomaly) if is_anomaly is not None else None,
        'anomaly_error': isolation_error,
        'text_fraud': text_result,
        'logic_validation': nli_result,
        'explanation': 'Scores computed by Isolation Forest (if data present) and transformer models.'
    }

from transformers import pipeline
_fraud_classifier = None
_fraud_classifier_lock = Lock()

def get_fraud_classifier():
    global _fraud_classifier
    with _fraud_classifier_lock:
        if _fraud_classifier is None:
            _fraud_classifier = pipeline("text-classification", model="ProsusAI/finbert")
        return _fraud_classifier

def detect_fraud_finchain_bert(text: str):
    """
    Fraud detection using a BERT-based model (ProsusAI/finbert).
    Accepts financial text and returns fraud probability, label, and explanation.
    """
    try:
        fraud_classifier = get_fraud_classifier()
        preds = fraud_classifier(text)
        if preds and isinstance(preds, list):
            pred = preds[0]
            label = pred.get("label", "unknown")
            score = float(pred.get("score", 0.0))
            return {
                "fraud_label": label,
                "fraud_probability": score,
                "explanation": f"Prediction by BERT-based model (ProsusAI/finbert). Higher probability means higher fraud likelihood."
            }
        else:
            return {"error": "No prediction returned from model."}
    except Exception as e:
        return {"error": f"Failed to run FinChain-BERT fraud detection: {str(e)}"}
