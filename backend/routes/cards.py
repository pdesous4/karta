from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.card import Card
from models.deck import Deck
from models.progress import Progress
from models.user import User
from dependencies import get_current_user
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, timezone

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
    return db.query(Card).filter(Card.deck_id == deck_id).all()


def _card_with_srs(card, progress=None):
    d = {c.name: getattr(card, c.name) for c in card.__table__.columns}
    d["srs_interval"] = progress.interval if progress else 1
    d["srs_ease_factor"] = progress.ease_factor if progress else 2.5
    return d


@router.get("/decks/{deck_id}/study-cards")
def get_study_cards(
    deck_id: str,
    mode: str = "normal",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deck = db.query(Deck).filter(Deck.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")

    all_cards = db.query(Card).filter(Card.deck_id == deck_id).all()
    card_ids = [c.id for c in all_cards]

    progress_records = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.card_id.in_(card_ids),
    ).all()
    seen_card_ids = {p.card_id for p in progress_records}
    progress_map  = {p.card_id: p for p in progress_records}

    # Review mode — all studied cards
    if mode == "review":
        studied = [c for c in all_cards if c.id in seen_card_ids]
        return {
            "due": [_card_with_srs(c, progress_map.get(c.id)) for c in studied],
            "new": [],
            "daily_limit": deck.daily_new_cards or 10,
            "new_today": 0,
        }

    now = datetime.now(timezone.utc)
    due_card_ids = {p.card_id for p in progress_records if p.due_at <= now}
    due_cards = [c for c in all_cards if c.id in due_card_ids]

    new_cards_all = [c for c in all_cards if c.id not in seen_card_ids]
    daily_limit = deck.daily_new_cards or 10

    # Force mode — ignore daily limit, just load next batch of new cards
    if mode == "force":
        new_cards = new_cards_all[:daily_limit]
        return {
            "due": [_card_with_srs(c, progress_map.get(c.id)) for c in due_cards],
            "new": [_card_with_srs(c) for c in new_cards],
            "daily_limit": daily_limit,
            "new_today": 0,
        }

    # Normal mode
    today_start = datetime.combine(date.today(), datetime.min.time(), tzinfo=timezone.utc)
    new_today = db.query(Progress).filter(
        Progress.user_id == current_user.id,
        Progress.card_id.in_(card_ids),
        Progress.created_at >= today_start,
    ).count()

    remaining_new = max(0, daily_limit - new_today)
    new_cards = new_cards_all[:remaining_new]

    return {
        "due": [_card_with_srs(c, progress_map.get(c.id)) for c in due_cards],
        "new": [_card_with_srs(c) for c in new_cards],
        "daily_limit": daily_limit,
        "new_today": new_today,
    }


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