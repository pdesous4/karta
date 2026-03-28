from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.card import Card
from models.deck import Deck
from models.user import User
from dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["cards"])

class CardCreate(BaseModel):
    front:               str
    back:                str
    romanization:        Optional[str] = None
    context:             Optional[str] = None
    definition:          Optional[str] = None
    example:             Optional[str] = None
    example_translation: Optional[str] = None
    example_audio_url:   Optional[str] = None
    audio_url:           Optional[str] = None
    audio_slow_url:      Optional[str] = None
    image_url:           Optional[str] = None
    notes:               Optional[str] = None


class CardUpdate(BaseModel):
    front:               Optional[str] = None
    back:                Optional[str] = None
    romanization:        Optional[str] = None
    context:             Optional[str] = None
    definition:          Optional[str] = None
    example:             Optional[str] = None
    example_translation: Optional[str] = None
    example_audio_url:   Optional[str] = None
    audio_url:           Optional[str] = None
    audio_slow_url:      Optional[str] = None
    image_url:           Optional[str] = None
    notes:               Optional[str] = None


@router.get("/decks/{deck_id}/cards")
def get_cards(deck_id: str, db: Session = Depends(get_db)):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    cards = db.query(Card).filter(Card.deck_id == deck_id).all()
    return cards


@router.post("/decks/{deck_id}/cards")
def add_card(
    deck_id: str,
    body: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your deck")

    card = Card(**body.model_dump(), deck_id=deck_id)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/cards/{card_id}")
def update_card(
    card_id: str,
    body: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    deck = db.query(Deck).filter(Deck.id == card.deck_id).first()
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your deck")

    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(card, key, value)

    db.commit()
    db.refresh(card)
    return card


@router.delete("/cards/{card_id}")
def delete_card(
    card_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    deck = db.query(Deck).filter(Deck.id == card.deck_id).first()
    if deck.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your deck")

    db.delete(card)
    db.commit()
    return {"message": "Card deleted"}