from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from database import Base
import uuid

DEFAULT_TEMPLATE = {
    "show_romanization":   True,
    "show_context":        True,
    "show_definition":     False,
    "show_example":        False,
    "show_image":          False,
    "front_audio":         False,
    "back_audio":          True,
    "back_audio_slow":     True,
}

class Deck(Base):
    __tablename__ = "decks"

    id          = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id     = Column(String, ForeignKey("users.id"), nullable=False)
    title       = Column(String, nullable=False)
    description = Column(String, nullable=True)
    language    = Column(String, nullable=False)
    is_public   = Column(Boolean, default=False)
    template    = Column(JSONB, default=DEFAULT_TEMPLATE)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())