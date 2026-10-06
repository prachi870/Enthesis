#!/usr/bin/env bash
# Render build script for Enthesis backend

set -o errexit

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "Creating storage directory..."
mkdir -p storage

echo "Build complete!"
