import os
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

load_dotenv()

_firestore_client = None

def init_firestore():
    global _firestore_client
    if _firestore_client:
        return _firestore_client
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path or not os.path.exists(cred_path):
        raise RuntimeError("Firebase service account key not found. Set GOOGLE_APPLICATION_CREDENTIALS in .env.")
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
    _firestore_client = firestore.client()
    return _firestore_client
