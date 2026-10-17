#!/usr/bin/env bash
# Run both backend and frontend from the root directory
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# This ensures that when you press Ctrl+C, BOTH servers stop
trap 'kill 0' EXIT INT TERM

echo "🚀 Starting Cosmic Eye backend (FastAPI) on http://localhost:8000..."
(cd "$ROOT_DIR/backend" && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000) &

echo "🚀 Starting Cosmic Eye frontend (Vite) on http://localhost:5173..."
(cd "$ROOT_DIR/frontend" && npm run dev) &

echo "✅ Both servers are running. Press Ctrl+C to stop both."
wait
