import os
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from loguru import logger

from app.firebase.db import init_firestore
from app.firebase.auth import verify_firebase_token
from app.firebase.storage import init_storage

# Load environment variables
load_dotenv()

app = FastAPI(title="Loan Shield Fintech Guard API")

# Allow CORS for frontend
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    "http://localhost:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:8081",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase services
firestore_client = init_firestore()
storage_client = init_storage()

# Import routers from api modules
from app.api.analyze_compliance import router as analyze_compliance_router
from app.api.analyze_loan_risk import router as analyze_loan_risk_router
from app.api.detect_fraud import router as detect_fraud_router
from app.api.generate_report import router as generate_report_router
from app.api.rbi_api import router as rbi_api_router

# Register API routers
app.include_router(analyze_compliance_router, prefix="/api", tags=["compliance"])
app.include_router(analyze_loan_risk_router, prefix="/api", tags=["loan-risk"])
app.include_router(detect_fraud_router, prefix="/api", tags=["fraud"])
app.include_router(generate_report_router, prefix="/api", tags=["report"])
app.include_router(rbi_api_router, prefix="/api", tags=["rbi"])

@app.get("/health")
def health():
    return {"status": "ok"}

# Example protected route
@app.get("/protected")
def protected_route(user=Depends(verify_firebase_token)):
    return {"message": f"Authenticated as {user['uid']}"}
