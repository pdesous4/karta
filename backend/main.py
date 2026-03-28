from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from models import user, deck, card, progress, rating
from routes import decks, cards, progress as progress_router, ratings, audio, saved
from routes.ratings import DeckRating
from routes.saved import SavedDeck

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(decks.router)
app.include_router(cards.router)
app.include_router(progress_router.router)
app.include_router(ratings.router)
app.include_router(audio.router)
app.include_router(saved.router)


@app.get("/")
def root():
    return {"message": "Welcome to Karta API!"}
