from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from dotenv import load_dotenv
from jose import jwt, JWTError
from datetime import datetime, timezone, timedelta
import os
import urllib.request
import json

load_dotenv('.env.local')
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

bearer_scheme = HTTPBearer()

_jwks: list | None = None
_user_cache: dict = {}  # user_id -> (User, expiry)
_USER_CACHE_TTL = timedelta(minutes=5)


def get_jwks() -> list:
    global _jwks
    if _jwks is None:
        try:
            url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
            with urllib.request.urlopen(url) as resp:
                _jwks = json.loads(resp.read()).get("keys", [])
        except Exception:
            _jwks = []
    return _jwks


def _get_user(user_id: str, email: str | None, db: Session) -> User:
    now = datetime.now(timezone.utc)
    entry = _user_cache.get(user_id)
    if entry:
        user, expires = entry
        if now < expires:
            return user

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            email=email,
            username=email.split("@")[0] if email else user_id,
            hashed_password="",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    db.expunge(user)
    _user_cache[user_id] = (user, now + _USER_CACHE_TTL)
    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")

        if alg == "HS256":
            payload = jwt.decode(
                token,
                SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            keys = get_jwks()
            kid = header.get("kid")
            key = next((k for k in keys if k.get("kid") == kid), None) or (keys[0] if keys else None)
            if not key:
                raise HTTPException(status_code=401, detail="Invalid token")
            payload = jwt.decode(
                token,
                key,
                algorithms=[alg],
                options={"verify_aud": False},
            )

        user_id = payload.get("sub")
        email = payload.get("email")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return _get_user(user_id, email, db)
