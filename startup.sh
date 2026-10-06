#!/bin/bash

# Azure App Service startup script for Enthesis backend

echo "Starting Enthesis backend..."

# Install dependencies
pip install -r requirements.txt

# Initialize database (if needed)
python -c "from backend.app.database import init_db; init_db()" || true

# Start the application
gunicorn --bind 0.0.0.0:8000 --workers 4 --worker-class uvicorn.workers.UvicornWorker backend.app.main:app
