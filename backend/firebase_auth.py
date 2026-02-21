"""
Firebase Admin SDK initialization and authentication utilities
"""
import os
import json
import logging
from functools import lru_cache
from typing import Optional
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


@lru_cache()
def get_firebase_app():
    """
    Initialize Firebase Admin SDK using service account credentials.
    Supports two methods:
    1. FIREBASE_SERVICE_ACCOUNT_PATH - path to JSON file
    2. FIREBASE_SERVICE_ACCOUNT_JSON - JSON string (for environments without file access)
    """
    if firebase_admin._apps:
        return firebase_admin.get_app()

    # Try path first
    service_account_path = os.environ.get("FIREBASE_SERVICE_ACCOUNT_PATH")
    if service_account_path and os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        logger.info(f"Firebase initialized from file: {service_account_path}")
        return firebase_admin.initialize_app(cred)

    # Try JSON string
    service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
    if service_account_json:
        try:
            service_account_dict = json.loads(service_account_json)
            cred = credentials.Certificate(service_account_dict)
            logger.info("Firebase initialized from JSON environment variable")
            return firebase_admin.initialize_app(cred)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON: {e}")
            raise RuntimeError("Invalid Firebase service account JSON")

    logger.warning("Firebase not configured - authentication will not work")
    return None


def verify_firebase_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.
    """
    app = get_firebase_app()
    if not app:
        raise HTTPException(
            status_code=503,
            detail="Authentication service not configured"
        )

    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token revoked")
    except auth.InvalidIdTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    FastAPI dependency to get the current authenticated user.
    Returns decoded Firebase token claims.
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )

    return verify_firebase_token(credentials.credentials)


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[dict]:
    """
    FastAPI dependency for optional authentication.
    Returns None if no token provided, or decoded claims if valid.
    """
    if not credentials:
        return None

    try:
        return verify_firebase_token(credentials.credentials)
    except HTTPException:
        return None
