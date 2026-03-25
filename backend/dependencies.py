from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials

    # Verify token with Supabase
    try:
        response = supabase.auth.get_user(token)
        supabase_user = response.user
        if not supabase_user:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    # Find or create user in our database
    user = db.query(User).filter(User.email == supabase_user.email).first()

    if not user:
        user = User(
            id=supabase_user.id,
            email=supabase_user.email,
            username=supabase_user.email.split("@")[0],
            hashed_password="",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
