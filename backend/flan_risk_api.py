# Flask API for Loan Risk Prediction using FLAN-T5
# Requirements: transformers, torch, flask
# Run: pip install transformers torch flask

from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

# Load FLAN-T5 model and tokenizer (google/flan-t5-base)
MODEL_ID = "google/flan-t5-base"
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID)

def build_prompt(profile):
    """Format applicant data into a prompt for FLAN-T5."""
    return (
        "Predict the loan risk (Low, Medium, High) for the following applicant:\n"
        f"- Age: {profile.get('age', '')}\n"
        f"- Annual Income: ₹{profile.get('income', '')}\n"
        f"- Employment Status: {profile.get('employment', '')}\n"
        f"- Credit Score: {profile.get('credit_score', '')}\n"
        f"- Existing Loans: {profile.get('existing_loans', '')}\n"
        f"- Loan Amount Requested: ₹{profile.get('loan_amount', '')}\n"
        f"- Loan Purpose: {profile.get('purpose', '')}\n"
        f"- Social Media Presence: {profile.get('socials', '')}"
    )

def predict_risk(profile):
    """Run the FLAN-T5 model and decode the risk prediction."""
    prompt = build_prompt(profile)
    inputs = tokenizer(prompt, return_tensors="pt")
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=20)
    result = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
    return result

# Flask app setup
app = Flask(__name__)

@app.route('/predict-risk', methods=['POST'])
def predict_risk_api():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400
    result = predict_risk(data)
    return jsonify({"risk_prediction": result})

def test_accuracy(test_profiles):
    """
    Utility: Takes a list of dicts with 'profile' and 'expected' keys.
    Runs each through the model, compares output to expected, returns accuracy.
    """
    correct = 0
    for entry in test_profiles:
        pred = predict_risk(entry['profile'])
        # Normalize prediction for comparison
        pred_class = 'Low' if 'low' in pred.lower() else ('Medium' if 'medium' in pred.lower() else ('High' if 'high' in pred.lower() else 'Unknown'))
        if pred_class == entry['expected']:
            correct += 1
        print(f"Input: {entry['profile']}, Prediction: {pred}, Expected: {entry['expected']}")
    accuracy = correct / len(test_profiles)
    print(f"Accuracy: {accuracy:.2%}")
    return accuracy

if __name__ == '__main__':
    # Example test set (replace with your 12 test profiles)
    test_profiles = [
        # 4 Low Risk
        {"profile": {"age": 35, "income": 1200000, "employment": "Govt Job", "credit_score": 800, "existing_loans": "Single", "loan_amount": 200000, "purpose": "medical", "socials": "LinkedIn, Instagram"}, "expected": "Low"},
        {"profile": {"age": 29, "income": 900000, "employment": "Salaried", "credit_score": 780, "existing_loans": "None", "loan_amount": 150000, "purpose": "education", "socials": "LinkedIn"}, "expected": "Low"},
        {"profile": {"age": 41, "income": 1500000, "employment": "Salaried", "credit_score": 810, "existing_loans": "Cleared loans", "loan_amount": 500000, "purpose": "home renovation", "socials": "LinkedIn, Twitter"}, "expected": "Low"},
        {"profile": {"age": 27, "income": 750000, "employment": "Self-Employed", "credit_score": 765, "existing_loans": "None", "loan_amount": 300000, "purpose": "business", "socials": "Twitter"}, "expected": "Low"},
        # 4 Medium Risk
        {"profile": {"age": 24, "income": 450000, "employment": "Freelancer", "credit_score": 690, "existing_loans": "None", "loan_amount": 350000, "purpose": "travel", "socials": "Instagram"}, "expected": "Medium"},
        {"profile": {"age": 33, "income": 600000, "employment": "Salaried", "credit_score": 710, "existing_loans": "Active loan", "loan_amount": 500000, "purpose": "car loan", "socials": "None"}, "expected": "Medium"},
        {"profile": {"age": 39, "income": 800000, "employment": "Business Owner", "credit_score": 700, "existing_loans": "Single", "loan_amount": 1000000, "purpose": "business expansion", "socials": "LinkedIn"}, "expected": "Medium"},
        {"profile": {"age": 30, "income": 550000, "employment": "Startup Employee", "credit_score": 680, "existing_loans": "Cleared loan", "loan_amount": 400000, "purpose": "personal loan", "socials": "Instagram, Twitter"}, "expected": "Medium"},
        # 4 High Risk
        {"profile": {"age": 22, "income": 200000, "employment": "Self-Employed", "credit_score": 500, "existing_loans": "Single", "loan_amount": 500000, "purpose": "personal loan", "socials": "LinkedIn, Twitter, Instagram"}, "expected": "High"},
        {"profile": {"age": 26, "income": 250000, "employment": "Unemployed", "credit_score": 550, "existing_loans": "Existing loans", "loan_amount": 300000, "purpose": "crypto investment", "socials": "None"}, "expected": "High"},
        {"profile": {"age": 31, "income": 300000, "employment": "Freelance", "credit_score": 520, "existing_loans": "2 loans", "loan_amount": 600000, "purpose": "wedding", "socials": "Instagram"}, "expected": "High"},
        {"profile": {"age": 45, "income": 220000, "employment": "Daily Wage", "credit_score": 480, "existing_loans": "Loan default", "loan_amount": 200000, "purpose": "agriculture", "socials": "None"}, "expected": "High"}
    ]
    print("--- Running Test Accuracy ---")
    test_accuracy(test_profiles)
    print("--- Starting Flask API ---")
    app.run(host='0.0.0.0', port=5000)
