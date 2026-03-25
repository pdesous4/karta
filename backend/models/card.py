from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from database import Base
import uuid

class Card(Base):
    __tablename__ = "cards"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deck_id = Column(String, ForeignKey("decks.id"), nullable=False)
    front = Column(String, nullable=False)
    back = Column(String, nullable=False)
    romanization = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
