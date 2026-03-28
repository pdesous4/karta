from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from dependencies import get_current_user
from models.user import User
from supabase import create_client
from dotenv import load_dotenv
import edge_tts
import tempfile
import asyncio
import uuid
import os

load_dotenv(".env.local")
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

router = APIRouter(tags=["audio"])

VOICES = {
    "greek":    "el-GR-AthinaNeural",
    "spanish":  "es-ES-ElviraNeural",
    "french":   "fr-FR-DeniseNeural",
    "german":   "de-DE-KatjaNeural",
    "italian":  "it-IT-ElsaNeural",
    "japanese": "ja-JP-NanamiNeural",
}

async def generate_tts(text, language, rate="+0%"):
    voice = VOICES.get(language.lower(), "el-GR-AthinaNeural")
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        tmp_path = f.name
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(tmp_path)
    with open(tmp_path, "rb") as f:
        audio_data = f.read()
    os.unlink(tmp_path)
    return audio_data

def upload_audio(audio_data, path):
    try:
        supabase.storage.from_("audio").upload(
            path=path,
            file=audio_data,
            file_options={"content-type": "audio/mpeg"}
        )
    except Exception:
        pass
    return supabase.storage.from_("audio").get_public_url(path)

from pydantic import BaseModel

class GenerateAudioRequest(BaseModel):
    text:     str
    language: str

@router.post("/audio/generate")
async def generate_audio(
    body: GenerateAudioRequest,
    current_user: User = Depends(get_current_user)
):
    if not body.text.strip():
        raise HTTPException(status_code=400, detail="Text is required")

    file_id      = str(uuid.uuid4())
    normal_path  = f"tts/{body.language.lower()}/{file_id}.mp3"
    slow_path    = f"tts/{body.language.lower()}/{file_id}_slow.mp3"

    try:
        normal_audio = await generate_tts(body.text, body.language, rate="+0%")
        slow_audio   = await generate_tts(body.text, body.language, rate="-40%")

        normal_url = upload_audio(normal_audio, normal_path)
        slow_url   = upload_audio(slow_audio,   slow_path)

        return {
            "audio_url":      normal_url,
            "audio_slow_url": slow_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))