#!/bin/bash
# start.sh - Launches the DW app (Vite + Convex) in WSL
# Run this from the project root to start both dev servers

echo "Starting DW app..."
echo

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Start Convex dev server in background
echo "Starting Convex dev server..."
npx convex dev &

# Wait a moment for Convex to initialize
sleep 3

# Start Vite dev server
echo "Starting Vite dev server..."
npm run dev
