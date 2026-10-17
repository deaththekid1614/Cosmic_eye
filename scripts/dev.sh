#!/usr/bin/env bash
# Run backend + frontend together. Ctrl+C to stop both.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

trap 'kill 0' EXIT INT TERM

( cd "$ROOT/backend" && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000 ) &
( cd "$ROOT/frontend" && npm run dev ) &
wait
