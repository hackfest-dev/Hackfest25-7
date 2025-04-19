import os
from google.cloud import storage
from dotenv import load_dotenv

load_dotenv()

_storage_client = None

def init_storage():
    global _storage_client
    if _storage_client:
        return _storage_client
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not cred_path or not os.path.exists(cred_path):
        raise RuntimeError("Firebase service account key not found. Set GOOGLE_APPLICATION_CREDENTIALS in .env.")
    _storage_client = storage.Client.from_service_account_json(cred_path)
    return _storage_client
