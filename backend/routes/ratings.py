from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.user import User
from models.rating import DeckRating
from dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(tags=["ratings"])


class RatingRequest(BaseModel):
    rating: int


def get_deck_rating(deck_id: str, db: Session):
    result = db.query(
        func.avg(DeckRating.rating).label("average"),
        func.count(DeckRating.id).label("count")
    ).filter(DeckRating.deck_id == deck_id).first()

    return {
        "average": round(float(result.average), 1) if result.average else None,
        "count": result.count
    }


@router.get("/ratings/bulk")
def get_bulk_ratings(deck_ids: str, db: Session = Depends(get_db)):
    ids = [i.strip() for i in deck_ids.split(",") if i.strip()]
    if not ids:
        return {}

    results = db.query(
        DeckRating.deck_id,
        func.avg(DeckRating.rating).label("average"),
        func.count(DeckRating.id).label("count")
    ).filter(
        DeckRating.deck_id.in_(ids)
    ).group_by(DeckRating.deck_id).all()

    return {
        row.deck_id: {
            "average": round(float(row.average), 1) if row.average else None,
            "count": row.count
        }
        for row in results
    }


@router.post("/decks/{deck_id}/rate")
def rate_deck(
    deck_id: str,
    body: RatingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not 1 <= body.rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    existing = db.query(DeckRating).filter(
        DeckRating.deck_id == deck_id,
        DeckRating.user_id == current_user.id
    ).first()

    if existing:
        existing.rating = body.rating
    else:
        db.add(DeckRating(
            user_id=current_user.id,
            deck_id=deck_id,
            rating=body.rating
        ))

    db.commit()
    return get_deck_rating(deck_id, db)


@router.get("/decks/{deck_id}/rating")
def get_rating(deck_id: str, db: Session = Depends(get_db)):
    return get_deck_rating(deck_id, db)


@router.get("/decks/{deck_id}/myrating")
def get_my_rating(
    deck_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(DeckRating).filter(
        DeckRating.deck_id == deck_id,
        DeckRating.user_id == current_user.id
    ).first()
    return {"rating": existing.rating if existing else None}