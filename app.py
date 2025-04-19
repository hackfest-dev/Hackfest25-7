from flask import Flask, request, jsonify, g
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
from functools import wraps
import os
from dotenv import load_dotenv
load_dotenv()
import logging
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
    "*"
]}}, supports_credentials=True)

logging.basicConfig(level=logging.INFO)

@app.before_request
def log_request_info():
    logging.info(f"Incoming {request.method} {request.path}")
    logging.info(f"Headers: {dict(request.headers)}")
    if request.method in ["POST", "PUT", "PATCH"]:
        logging.info(f"Body: {request.get_data()}")

# Initialize Firebase Admin SDK
import os
if not firebase_admin._apps:
    cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'firebase_service_account.json')
    if not os.path.exists(cred_path):
        # Fallback to serviceAccountKey.json if firebase_service_account.json does not exist
        alt_path = os.path.join(os.path.dirname(__file__), 'serviceAccountKey.json')
        if os.path.exists(alt_path):
            cred_path = alt_path
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)

def verify_firebase_token(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        id_token = auth_header.split('Bearer ')[-1]
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            g.user = decoded_token
        except Exception as e:
            return jsonify({'error': f'Invalid token: {str(e)}'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# Analyze Compliance Endpoint
from models import analyze_compliance, analyze_loan_risk, detect_fraud

@app.route('/api/analyze-compliance', methods=['POST'])
@verify_firebase_token
def analyze_compliance_route():
    data = request.get_json()
    if not data or 'document_text' not in data:
        return jsonify({'error': 'Missing document_text'}), 400
    try:
        result = analyze_compliance(data['document_text'])
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Compliance analysis failed: {str(e)}'}), 500

# Analyze Loan Risk Endpoint
@app.route('/api/analyze-loan-risk', methods=['POST'])
@verify_firebase_token
def analyze_loan_risk_route():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Missing input data'}), 400
    try:
        result = analyze_loan_risk(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Loan risk analysis failed: {str(e)}'}), 500

# Detect Fraud Endpoint
@app.route('/api/detect-fraud', methods=['POST'])
@verify_firebase_token
def detect_fraud_route():
    data = request.get_json()
    if not data or 'document_text' not in data:
        return jsonify({'error': 'Missing document_text'}), 400
    try:
        result = detect_fraud(data['document_text'])
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'Fraud detection failed: {str(e)}'}), 500

# Example protected endpoint
@app.route('/api/protected', methods=['GET'])
@verify_firebase_token
def protected():
    return jsonify({'message': 'You are authenticated!', 'user': g.user})

# --- Advanced ML Endpoints (do not touch existing endpoints) ---
from models_risk_fraud import score_loan_risk_tabular, score_loan_risk_hf_saifhmb, predict_loan_risk_flan_t5
from models_fraud import detect_fraud_advanced, detect_fraud_finchain_bert

@app.route('/api/detect-fraud-finchain', methods=['POST'])
@verify_firebase_token
def detect_fraud_finchain():
    data = request.get_json()
    if not data or 'document_text' not in data:
        return jsonify({'error': 'Missing document_text'}), 400
    try:
        result = detect_fraud_finchain_bert(data['document_text'])
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': f'FinChain-BERT fraud detection failed: {str(e)}'}), 500

@app.post('/api/score-loan-risk-ml')
@verify_firebase_token
def score_loan_risk_ml():
    try:
        data = request.json
        result = score_loan_risk_tabular(data)
        return jsonify(result)
    except Exception as e:
        logging.exception('Error in score_loan_risk_ml')
        return jsonify({'error': str(e)}), 500

@app.post('/api/score-loan-risk-flan')
@verify_firebase_token
def score_loan_risk_flan():
    try:
        data = request.json
        result = predict_loan_risk_flan_t5(data)
        return jsonify(result)
    except Exception as e:
        logging.exception('Error in score_loan_risk_flan')
        return jsonify({'error': str(e)}), 500

@app.post('/api/score-loan-risk-hf')
@verify_firebase_token
def score_loan_risk_hf():
    try:
        data = request.json
        result = score_loan_risk_hf_saifhmb(data)
        return jsonify(result)
    except Exception as e:
        logging.exception('Error in score_loan_risk_hf')
        return jsonify({'error': str(e)}), 500

@app.post('/api/detect-fraud-advanced')
@verify_firebase_token
def detect_fraud_adv():
    try:
        data = request.json or {}
        tabular = data.get('tabular', {})
        text = data.get('text', {})
        result = detect_fraud_advanced(tabular, text)
        return jsonify(result)
    except Exception as e:
        logging.exception('Error in detect_fraud_adv')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logging.info('Starting Flask backend on port 5001')
    app.run(host='0.0.0.0', port=5001, debug=True)

@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'status': 'pong'})
