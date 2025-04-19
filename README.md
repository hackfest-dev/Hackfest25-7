# ⚖️ RiskIQ — AI-Powered Compliance & Risk Intelligence for Indian Fintechs

RiskIQ is an AI-driven RegTech application designed to help **NBFCs and fintech startups** in India stay **RBI-compliant**, reduce fraud, and assess risk in real-time. Built for India's digital lending revolution, RiskIQ acts as a **compliance copilot**, automating clause-level legal analysis, RBI reporting, and fraud detection.

---

## 🚀 Key Features

### 🧠 NLP-Based Compliance Checker
- Upload loan agreements in `.pdf` or `.docx`
- Scans each clause and flags non-compliance based on RBI’s digital lending guidelines
- Suggests compliant rewrites using LLMs (e.g. T5)

### 📊 Risk-Based Loan Scoring
- Input borrower details like age, income, credit score, etc.
- Returns a risk score (0–1) with risk category (Low/Med/High)
- Based on trained Random Forest model on financial behavior patterns

### 🚨 Fraud Detection Engine
- Uses behavioral data (IP address, typing speed, device fingerprint)
- Detects anomaly patterns and flags potential fraud
- Powered by Isolation Forest & custom heuristics

### 📄 RBI Compliance Report Generator
- Generates audit-ready JSON & PDF reports
- Maps all clauses to internal RBI rule codes
- Simulates RBI sandbox submission endpoint

---

## 🧱 Tech Stack

| Layer       | Technology                          |
|------------|-------------------------------------|
| **Frontend** | React.js + TypeScript + Tailwind CSS |
| **Backend**  | Flask+fastapi (Python)                   |
| **Auth**     | Firebase Authentication            |
| **Database** | Firebase Firestore / PostgreSQL    |
| **Storage**  | Firebase Storage                   |
| **AI Models**| Hugging Face Transformers (LegalBERT, T5, BART) |
| **ML Models**| Scikit-learn (Random Forest, Isolation Forest) |

---

## 🛠️ API Endpoints (FastAPI)

- `POST /analyze-compliance` – Check document compliance
- `POST /analyze-loan-risk` – Predict borrower risk
- `POST /detect-fraud` – Fraud prediction
- `POST /generate-report` – Generate RBI audit report
- `GET /rbi/report/status/{id}` – Check mock submission status

---

## 🧪 How It Works

1. Upload loan document → Extract & tokenize clauses
2. Classify each clause → Compliant / Non-compliant
3. Suggest rewrites using LLM → Return flagged clauses
4. Combine compliance + risk + fraud → Generate full RBI audit report

---

## 📈 Business Use Cases

- ✅ Digital lending startups  
- ✅ NBFC compliance teams  
- ✅ Legal/audit firms serving fintech clients  
- ✅ RegTech integrations with banks and AA networks  

---

## 🔐 Security

- Firebase Auth for role-based access
- Firestore rules to protect sensitive documents
- Secure file handling with signed URLs in Firebase Storage

---

## 🧾 Built with ❤️ by Team Laser Hamsters

This project was built as part of a national-level hackathon at Hackfest to solve real-world regulatory challenges in India’s booming fintech landscape.


