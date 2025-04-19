# This module provides dummy real-time dashboard data for the API.
# Replace with DB or persistent store in production.
import datetime

def get_dashboard_summary():
    now = datetime.datetime.now().strftime('%Y-%m-%dT%H:%M')
    return {
        "recent_frauds": [
            {"name": "Uday Reddy", "score": 87, "risk": "High", "time": now},
            {"name": "Neha Sharma", "score": 12, "risk": "Low", "time": now},
            {"name": "Vikram Singh", "score": 92, "risk": "High", "time": now},
            {"name": "Sanjay Patel", "score": 58, "risk": "Medium", "time": now},
        ],
        "fraud_stats": {
            "high": 3,
            "medium": 7,
            "low": 20,
            "total": 30
        },
        "compliance_pass_rate": 92.3,
        "last_updated": now
    }
