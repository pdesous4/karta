from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.deck import Deck
from models.user import User
from dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/decks", tags=["decks"])


# ── Schemas ──────────────────────────────────────────────
class DeckCreate(BaseModel):
    title: str
    description: Optional[str] = None
    language: str
    is_public: bool = False


class DeckUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    is_public: Optional[bool] = None


# ── Routes ───────────────────────────────────────────────
@router.get("/")
def get_public_decks(db: Session = Depends(get_db)):
    decks = db.query(Deck).filter(Deck.is_public == True).all()
    return decks


@router.get("/mine")
def get_my_decks(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    decks = db.query(Deck).filter(Deck.user_id == current_user.id).all()
    return decks


@router.get("/{deck_id}")
def get_deck(deck_id: str, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


@router.post("/")
def create_deck(
    body: DeckCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = Deck(
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        language=body.language,
        is_public=body.is_public,
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    return deck


@router.put("/{deck_id}")
def update_deck(
    deck_id: str,
    body: DeckUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your deck")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(deck, key, value)

    db.commit()
    db.refresh(deck)
    return deck


@router.delete("/{deck_id}")
def delete_deck(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your deck")

    db.delete(deck)
    db.commit()
    return {"message": "Deck deleted"}
