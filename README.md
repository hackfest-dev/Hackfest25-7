# Loan Shield Fintech Guard Backend (FastAPI + Firebase)

## Setup Instructions

1. Clone repository and navigate to backend directory.
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Obtain Firebase service account JSON and set `GOOGLE_APPLICATION_CREDENTIALS` in `.env`.
4. Set `FRONTEND_URL` and `FIREBASE_STORAGE_BUCKET` in `.env`.
5. Run the server:
   ```
   uvicorn app.main:app --reload
   ```

## Structure
- `app/main.py`: FastAPI entrypoint, initializes Firebase
- `app/firebase/`: Firebase Auth, Firestore, Storage helpers
- `app/api/`: API endpoints (to be implemented)
- `.env.example`: Example env file

## Next Steps
- Implement endpoints in `app/api/`
- Migrate Supabase logic to FastAPI endpoints
