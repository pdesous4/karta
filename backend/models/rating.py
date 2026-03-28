from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from database import Base
import uuid

class DeckRating(Base):
    __tablename__ = "deck_ratings"
    __table_args__ = (UniqueConstraint("user_id", "deck_id"),)

    id         = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id    = Column(String, ForeignKey("users.id"), nullable=False)
    deck_id    = Column(String, ForeignKey("decks.id"), nullable=False)
    rating     = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())