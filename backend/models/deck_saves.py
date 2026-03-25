from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base
import uuid

class DeckSave(Base):
    __tablename__ = "deck_saves"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    deck_id = Column(String, ForeignKey("decks.id"), nullable=False)
    saved_at = Column(DateTime(timezone=True), server_default=func.now())
