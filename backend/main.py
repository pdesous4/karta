from fastapi import FastAPI
from database import engine, Base
from models import user, deck, card
from routes import auth, decks, cards, progress

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)
app.include_router(decks.router)
app.include_router(cards.router)
app.include_router(progress.router)


@app.get("/")
def root():
    return {"message": "Welcome to Karta API!"}
