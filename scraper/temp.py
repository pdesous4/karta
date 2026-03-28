import asyncio
import os
import tempfile
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from supabase import create_client
import edge_tts


load_dotenv(".env.local")
load_dotenv()

print("DATABASE_URL:", os.getenv("DATABASE_URL"))
print("SUPABASE_URL:", os.getenv("SUPABASE_URL"))
