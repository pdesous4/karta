import requests
import os
import time
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from supabase import create_client
from languages import LANGUAGES

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


def backfill_audio(db, language):
    """Upload audio for cards that still have flashcardo URLs."""
    print(f"\n  Backfilling audio for {language}...")

    results = db.execute(
        text("""
        SELECT c.id, c.audio_url
        FROM cards c
        JOIN decks d ON c.deck_id = d.id
        WHERE d.language = :language
        AND c.audio_url LIKE 'https://flashcardo.com%'
    """),
        {"language": language.capitalize()},
    ).fetchall()

    print(f"  Found {len(results)} cards needing audio upload")

    for i, (card_id, audio_url) in enumerate(results):
        filename = audio_url.split("/")[-1]
        storage_path = f"{language}/{filename}"

        response = requests.get(audio_url)
        if response.status_code != 200:
            print(f"    Failed: {audio_url}")
            continue

        try:
            supabase.storage.from_("audio").upload(
                path=storage_path,
                file=response.content,
                file_options={"content-type": "audio/mpeg"},
            )
        except Exception:
            pass  # Already exists in storage

        public_url = supabase.storage.from_("audio").get_public_url(storage_path)

        db.execute(
            text("""
            UPDATE cards SET audio_url = :url WHERE id = :id
        """),
            {"url": public_url, "id": card_id},
        )

        if (i + 1) % 10 == 0:
            db.commit()
            print(f"    {i + 1}/{len(results)} done")

        time.sleep(0.3)

    db.commit()
    print(f"  Audio backfill complete for {language}")


def main():
    db = Session()
    try:
        for language in LANGUAGES:
            backfill_audio(db, language)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
