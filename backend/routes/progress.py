from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.card import Card
from models.progress import Progress
from models.user import User
from dependencies import get_current_user
from services.srs import calculate_next_review
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(tags=["progress"])


class AnswerRequest(BaseModel):
    card_id: str
    grade: int # 0=Again, 1=Hard, 2=Good, 3=Easy


@router.post("/progress")
def update_progress(
    body: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    card = db.query(Card).filter(Card.id == body.card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    if body.grade not in [0, 1, 2, 3]:
        raise HTTPException(status_code=400, detail="Grade must be 0, 1, 2, or 3")

    progress = db.query(Progress).filter(
        Progress.card_id == body.card_id,
        Progress.user_id == current_user.id
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
            due_at=datetime.utcnow()
        )
        db.add(progress)

    next_review = calculate_next_review(
        grade=body.grade,
        interval=progress.interval,
        ease_factor=progress.ease_factor
    )

    if body.grade == 0:
        progress.wrong  += 1
        progress.streak  = 0
    else:
        progress.correct += 1
        progress.streak  += 1

    progress.interval    = next_review["interval"]
    progress.ease_factor = next_review["ease_factor"]
    progress.due_at      = next_review["due_at"]
    progress.last_grade  = body.grade

    db.commit()
    db.refresh(progress)
    return progress


@router.get("/progress/due")
def get_due_cards(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    due = (
        db.query(Progress)
        .filter(
            Progress.user_id == current_user.id, Progress.due_at <= datetime.utcnow()
        )
        .all()
    )
    return due


@router.get("/progress")
def get_all_progress(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    progress = db.query(Progress).filter(Progress.user_id == current_user.id).all()
    return progress
