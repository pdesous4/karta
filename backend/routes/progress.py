from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.progress import Progress
from models.user import User
from dependencies import get_current_user
from services.srs import calculate_next_review
from pydantic import BaseModel
from datetime import datetime, timezone
from models.card import Card
from models.deck import Deck

router = APIRouter(tags=["progress"])


class AnswerRequest(BaseModel):
    card_id: str
    grade: int  # 0=Again, 1=Hard, 2=Good, 3=Easy


@router.post("/progress")
def update_progress(
    body: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.grade not in [0, 1, 2, 3]:
        raise HTTPException(status_code=400, detail="Grade must be 0, 1, 2, or 3")

    progress = db.query(Progress).filter(
        Progress.card_id == body.card_id,
        Progress.user_id == current_user.id,
    ).first()

    if not progress:
        progress = Progress(
            user_id=current_user.id,
            card_id=body.card_id,
            correct=0,
            wrong=0,
            streak=0,
            ease_factor=2.5,
            interval=1,
            state="new",
            learning_step=0,
            due_at=datetime.now(timezone.utc),
        )
        db.add(progress)

    next_review = calculate_next_review(
        grade=body.grade,
        state=progress.state,
        learning_step=progress.learning_step,
        interval=progress.interval,
        ease_factor=progress.ease_factor,
    )

    if body.grade == 0:
        progress.wrong  += 1
        progress.streak  = 0
    else:
        progress.correct += 1
        progress.streak  += 1

    progress.state         = next_review["state"]
    progress.learning_step = next_review["learning_step"]
    progress.interval      = next_review["interval"]
    progress.ease_factor   = next_review["ease_factor"]
    progress.due_at        = next_review["due_at"]
    progress.last_grade    = body.grade

    db.commit()
    return progress


@router.get("/progress/due")
def get_due_cards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    due = (
        db.query(Progress)
        .filter(
            Progress.user_id == current_user.id,
            Progress.due_at <= datetime.now(timezone.utc),
        )
        .all()
    )
    return due


@router.get("/progress")
def get_all_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    progress = db.query(Progress).filter(Progress.user_id == current_user.id).all()
    return progress

@router.get("/progress/due/by-deck")
def get_due_cards_by_deck(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from sqlalchemy import func
    results = (
        db.query(Card.deck_id, func.count(Progress.id))
        .join(Progress, Progress.card_id == Card.id)
        .join(Deck, Deck.id == Card.deck_id)
        .filter(
            Progress.user_id == current_user.id,
            Progress.due_at <= datetime.now(timezone.utc),
            Deck.user_id == current_user.id,
        )
        .group_by(Card.deck_id)
        .all()
    )
    return {deck_id: count for deck_id, count in results}