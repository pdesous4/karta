from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Float, Index
from sqlalchemy.sql import func
from database import Base
import uuid

class Progress(Base):
    __tablename__ = "progress"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    card_id = Column(String, ForeignKey("cards.id"), nullable=False)
    correct = Column(Integer, nullable=False, default=0)
    wrong = Column(Integer, nullable=False, default=0)
    last_grade = Column(Integer, nullable=True)
    ease_factor = Column(Float, nullable=False, default=2.5)
    interval = Column(Integer, nullable=False, default=1)
    streak = Column(Integer, nullable=False, default=0)
    state = Column(String, nullable=False, default="new")  # new | learning | review | relearning
    learning_step = Column(Integer, nullable=False, default=0)
    due_at = Column(DateTime(timezone=True), nullable=False)
    last_reviewed = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("ix_progress_user_card", "user_id", "card_id"),
        Index("ix_progress_user_due",  "user_id", "due_at"),
    )
