from fastapi import APIRouter, Depends, HTTPException
from dependencies import get_current_user
from models.user import User
from supabase import create_client
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import edge_tts
import tempfile
import asyncio
import uuid
import os

load_dotenv(".env.local")
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
ELEVENLABS_KEY = os.getenv("ELEVENLABS_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(tags=["audio"])

ELEVENLABS_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"

EDGE_VOICES = {
    "greek":    "el-GR-AthinaNeural",
    "spanish":  "es-ES-ElviraNeural",
    "french":   "fr-FR-DeniseNeural",
    "german":   "de-DE-KatjaNeural",
    "italian":  "it-IT-ElsaNeural",
    "japanese": "ja-JP-NanamiNeural",
}

ELEVENLABS_LANGUAGE_CODES = {
    "greek":    "el",
    "spanish":  "es",
    "french":   "fr",
    "german":   "de",
    "italian":  "it",
    "japanese": "ja",
}

async def generate_tts_elevenlabs(text, language, slow=False):
    print("top of generate_tts_elevenlabs")
    lang_code = ELEVENLABS_LANGUAGE_CODES.get(language.lower())
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    headers = {
        "xi-api-key": ELEVENLABS_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.85,
            "similarity_boost": 0.5,
            "speed": 0.8 if slow else 1.0,
        },
    }
    
    if lang_code:
        payload["language_code"] = lang_code

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload, headers=headers, timeout=30)
        if response.status_code != 200:
            print(f"[ElevenLabs Error] Status: {response.status_code}")
            print(f"[ElevenLabs Error] Body: {response.text}")
            response.raise_for_status()

    print("returning elevenlabs audio")
    return response.content


async def generate_tts_edge(text, language, rate="+0%"):
    voice = EDGE_VOICES.get(language.lower(), "el-GR-AthinaNeural")
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        tmp_path = f.name
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(tmp_path)
    with open(tmp_path, "rb") as f:
        audio_data = f.read()
    os.unlink(tmp_path)
    return audio_data


async def generate_tts(text, language, slow=False):
    if ELEVENLABS_KEY:
        try:
            audio = await generate_tts_elevenlabs(text, language, slow=slow)
            print(f"[TTS] ElevenLabs ({'slow' if slow else 'normal'}) — {language}: {text[:30]}")
            return audio
        except Exception as e:
            print(f"[TTS] ElevenLabs failed, falling back to Edge: {e}")

    # rate = "-40%" if slow else "+0%"
    # audio = await generate_tts_edge(text, language, rate=rate)
    # print(f"[TTS] Edge ({'slow' if slow else 'normal'}) — {language}: {text[:30]}")
    # return audio


def upload_audio(audio_data, path):
    print(f"[Upload] Uploading to {path} ({len(audio_data)} bytes)")
    try:
        supabase.storage.from_("audio").upload(
            path=path,
            file=audio_data,
            file_options={"content-type": "audio/mpeg"},
        )
    except Exception as e:
        print(f"[Upload Error] {path}: {e}")
    url = supabase.storage.from_("audio").get_public_url(path)
    print(f"[Upload] URL: {url}")
    return url


class GenerateAudioRequest(BaseModel):
    text: str
    language: str


@router.post("/audio/generate")
async def generate_audio(
    body: GenerateAudioRequest,
    current_user: User = Depends(get_current_user),
):
    print("AUDIO ENDPOINT HIT")
    print(f"ELEVENLABS_KEY set: {bool(ELEVENLABS_KEY)}")
    print(f"Text: {body.text[:50]}, Language: {body.language}")
    
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    file_id     = str(uuid.uuid4())
    normal_path = f"tts/{body.language.lower()}/{file_id}.mp3"
    slow_path   = f"tts/{body.language.lower()}/{file_id}_slow.mp3"

    try:
        normal_audio, slow_audio = await asyncio.gather(
            generate_tts(body.text, body.language, slow=False),
            generate_tts(body.text, body.language, slow=True),
        )

        print(f"[Audio] normal_audio size: {len(normal_audio)}")
        print(f"[Audio] slow_audio size: {len(slow_audio)}")

        normal_url = upload_audio(normal_audio, normal_path)
        slow_url   = upload_audio(slow_audio, slow_path)

        print(f"[Audio] normal_url: {normal_url}")
        print(f"[Audio] slow_url: {slow_url}")

        return {"audio_url": normal_url, "audio_slow_url": slow_url}
    except Exception as e:
        print(f"[Audio] Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))