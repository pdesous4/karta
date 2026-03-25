from fastapi import FastAPI
from database import engine, Base
from models import user, deck, card, progress
from routes import auth

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "Welcome to Karta API!"}
