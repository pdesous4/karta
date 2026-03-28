#!/bin/bash
echo "Starting scraper..."
python scraper.py

echo "Starting audio download..."
python generate_tts.py

echo "All done!"
