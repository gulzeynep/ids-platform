#!/bin/bash

# Exit immediately if any command fails
set -e

echo "Waiting for PostgreSQL database to wake up..."
# Simple delay to give Postgres time to start before we hit it
sleep 5

echo "Applying Database Migrations..."
# This is the magic command that creates your tables automatically!
alembic upgrade head

echo "Seeding default Workspace for the Snort bridge..."
python seed_workspace.py

echo "Starting FastAPI Server..."
# Execute the main API server
exec uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
