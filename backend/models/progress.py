from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, Float
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
    ease_factor = Column(Float, nullable=False, default=2.5)  # Default ease factor for SM-2 algorithm
    interval = Column(Integer, nullable=False, default=1)  # Interval in days
    streak = Column(Integer, nullable=False, default=0)  # Current streak of correct answers
    due_at = Column(DateTime(timezone=True), nullable=False)
    last_reviewed = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
