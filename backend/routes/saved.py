from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from database import Base, get_db
from models.user import User
from models.deck import Deck
from dependencies import get_current_user
import uuid

class SavedDeck(Base):
    __tablename__ = "saved_decks"
    __table_args__ = (UniqueConstraint("user_id", "deck_id"),)

    id       = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id  = Column(String, ForeignKey("users.id"), nullable=False)
    deck_id  = Column(String, ForeignKey("decks.id"), nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())

router = APIRouter(tags=["saved"])

@router.post("/decks/{deck_id}/save")
def save_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(SavedDeck).filter(
        SavedDeck.deck_id == deck_id,
        SavedDeck.user_id == current_user.id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False}

    db.add(SavedDeck(user_id=current_user.id, deck_id=deck_id))
    db.commit()
    return {"saved": True}

@router.get("/decks/{deck_id}/saved")
def is_saved(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(SavedDeck).filter(
        SavedDeck.deck_id == deck_id,
        SavedDeck.user_id == current_user.id
    ).first()
    return {"saved": bool(existing)}

@router.get("/saved")
def get_saved_decks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved = db.query(SavedDeck).filter(
        SavedDeck.user_id == current_user.id
    ).all()

    deck_ids = [s.deck_id for s in saved]
    if not deck_ids:
        return []

    decks = db.query(Deck).filter(Deck.id.in_(deck_ids)).all()
    return decks