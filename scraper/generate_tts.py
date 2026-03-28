import asyncio
import os
import tempfile
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from supabase import create_client
import edge_tts

load_dotenv('.env.local') 
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

VOICES = {
    "greek": "el-GR-AthinaNeural",
    "spanish": "es-ES-ElviraNeural",
    "french": "fr-FR-DeniseNeural",
    "german": "de-DE-KatjaNeural",
    "italian": "it-IT-ElsaNeural",
    "japanese": "ja-JP-NanamiNeural",
}


async def generate_audio(text_content, language, rate="+0%"):
    """Generate MP3 audio from text using Edge TTS.
    rate: '+0%' normal, '-30%' slow, '-50%' very slow
    """
    voice = VOICES.get(language.lower(), "el-GR-AthinaNeural")

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        tmp_path = f.name

    communicate = edge_tts.Communicate(text_content, voice, rate=rate)
    await communicate.save(tmp_path)

    with open(tmp_path, "rb") as f:
        audio_data = f.read()

    os.unlink(tmp_path)
    return audio_data


def upload_to_supabase(audio_data, storage_path):
    """Upload audio bytes to Supabase Storage."""
    try:
        supabase.storage.from_("audio").upload(
            path=storage_path,
            file=audio_data,
            file_options={"content-type": "audio/mpeg"},
        )
    except Exception:
        pass  # File might already exist

    return supabase.storage.from_("audio").get_public_url(storage_path)


async def process_cards(db):
    results = db.execute(
        text("""
        SELECT c.id, c.back, d.language
        FROM cards c
        JOIN decks d ON c.deck_id = d.id
        WHERE c.audio_url IS NULL
        OR c.audio_url = ''
        ORDER BY d.language, c.id
    """)
    ).fetchall()

    total = len(results)
    print(f"Found {total} cards without audio")

    if total == 0:
        print("Nothing to process")
        return

    updated = 0
    failed = 0

    for i, (card_id, back_text, language) in enumerate(results):
        if not back_text or not back_text.strip():
            continue

        print(f"  [{i + 1}/{total}] {language}: {back_text[:40]}...")

        try:
            # Normal speed
            normal_path = f"tts/{language.lower()}/{card_id}.mp3"
            normal_audio = await generate_audio(back_text, language.lower(), rate="+0%")
            normal_url = upload_to_supabase(normal_audio, normal_path)

            # Slow speed
            slow_path = f"tts/{language.lower()}/{card_id}_slow.mp3"
            slow_audio = await generate_audio(back_text, language.lower(), rate="-40%")
            slow_url = upload_to_supabase(slow_audio, slow_path)

            db.execute(
                text("""
                UPDATE cards 
                SET audio_url = :url, audio_slow_url = :slow_url 
                WHERE id = :id
            """),
                {"url": normal_url, "slow_url": slow_url, "id": card_id},
            )

            updated += 1

            if updated % 20 == 0:
                db.commit()
                print(f"    Committed {updated} so far...")

        except Exception as e:
            print(f"    Failed: {e}")
            failed += 1

        await asyncio.sleep(0.2)

    db.commit()
    print(f"\n  Updated: {updated} · Failed: {failed}")


async def main():
    db = Session()
    try:
        await process_cards(db)
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
