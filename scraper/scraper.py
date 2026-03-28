import requests
import re
import json
import os
import time
import uuid
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from supabase import create_client
from languages import (
    LANGUAGES,
    TOPICS,
    FREQUENCY_RANGES,
    build_url,
    build_frequency_url,
)

load_dotenv('.env.local') 
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SYSTEM_EMAIL = os.getenv("SYSTEM_USER_EMAIL", "system@karta.app")
SYSTEM_PASSWORD = os.getenv("SYSTEM_USER_PASSWORD", "karta-system-password")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── System user ───────────────────────────────────────────
def get_or_create_system_user(db):
    result = db.execute(
        text("SELECT id FROM users WHERE email = :email"), {"email": SYSTEM_EMAIL}
    ).fetchone()

    if result:
        print(f"  System user exists: {result[0]}")
        return result[0]

    user_id = str(uuid.uuid4())
    db.execute(
        text("""
        INSERT INTO users (id, email, username, hashed_password)
        VALUES (:id, :email, :username, :password)
    """),
        {
            "id": user_id,
            "email": SYSTEM_EMAIL,
            "username": "karta",
            "password": pwd_context.hash(SYSTEM_PASSWORD),
        },
    )
    db.commit()
    print(f"  Created system user: {user_id}")
    return user_id


# ── Scraping ──────────────────────────────────────────────
def scrape_deck(url):
    response = requests.get(url)
    html = response.text
    match = re.search(r"var cards = (\[.*?\]);", html)
    if not match:
        print(f"  No cards found at {url}")
        return []
    return json.loads(match.group(1))


# ── Database ──────────────────────────────────────────────
def get_or_create_deck(db, system_user_id, language, deck_name):
    result = db.execute(
        text("""
        SELECT id FROM decks
        WHERE user_id = :user_id
        AND language = :language
        AND title = :title
    """),
        {
            "user_id": system_user_id,
            "language": language.capitalize(),
            "title": deck_name.capitalize(),
        },
    ).fetchone()

    if result:
        return result[0]

    deck_id = str(uuid.uuid4())
    db.execute(
        text("""
        INSERT INTO decks (id, user_id, title, language, is_public)
        VALUES (:id, :user_id, :title, :language, :is_public)
    """),
        {
            "id": deck_id,
            "user_id": system_user_id,
            "title": deck_name.capitalize(),
            "language": language.capitalize(),
            "is_public": True,
        },
    )
    db.commit()
    return deck_id


def card_exists(db, deck_id, original_id):
    result = db.execute(
        text("""
        SELECT id FROM cards
        WHERE deck_id = :deck_id
        AND audio_url LIKE :audio_pattern
    """),
        {"deck_id": deck_id, "audio_pattern": f"%/c_{original_id}.mp3"},
    ).fetchone()
    return result is not None


def insert_card(db, deck_id, card):
    #audio_url = f"https://flashcardo.com/audio/{card['sid_audio']}/{card['audio']}.mp3"
    audio_url = ""
    card_id = str(uuid.uuid4())
    db.execute(text("""
        INSERT INTO cards (id, deck_id, front, back, romanization, audio_url, context)
        VALUES (:id, :deck_id, :front, :back, :romanization, :audio_url, :context)
    """), {
        "id": card_id,
        "deck_id": deck_id,
        "front": card["from"],
        "back": card["word"],
        "romanization": card["postw"],
        "audio_url": audio_url,
        "context": card.get("fromhint") or None
    })


# ── Main ──────────────────────────────────────────────────
def main():
    print("=" * 50)
    print("  Karta Scraper")
    print("=" * 50)

    db = Session()

    try:
        print("\nSetting up system user...")
        system_user_id = get_or_create_system_user(db)

        total_cards = 0

        for language in LANGUAGES:
            print(f"\n=== {language.upper()} ===")

            # ── Topic decks ───────────────────────────────
            for topic in TOPICS:
                url = build_url(language, topic)
                print(f"  Scraping {topic}...")

                deck_id = get_or_create_deck(db, system_user_id, language, topic)
                cards = scrape_deck(url)
                new_cards = 0

                for card in cards:
                    if not card_exists(db, deck_id, card["id"]):
                        insert_card(db, deck_id, card)
                        new_cards += 1

                db.commit()
                total_cards += new_cards
                print(f"  {new_cards} new cards added ({len(cards)} scraped)")
                time.sleep(1)

            # ── Frequency decks ───────────────────────────
            print(f"\n  --- Top 1000 Most Common Words ---")
            for range_str in FREQUENCY_RANGES:
                url = build_frequency_url(language, range_str)
                deck_name = f"top-1000-{range_str}"
                print(f"  Scraping {deck_name}...")

                deck_id = get_or_create_deck(db, system_user_id, language, deck_name)
                cards = scrape_deck(url)
                new_cards = 0

                for card in cards:
                    if not card_exists(db, deck_id, card["id"]):
                        insert_card(db, deck_id, card)
                        new_cards += 1

                db.commit()
                total_cards += new_cards
                print(f"  {new_cards} new cards added ({len(cards)} scraped)")
                time.sleep(1)

        print(f"\n{'=' * 50}")
        print(f"  Done — {total_cards} total cards added")
        print(f"{'=' * 50}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
