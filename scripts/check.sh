#!/usr/bin/env bash
# Lint + test all packages. Only app/ and tests/ are linted — stage0_*.py is evidence, not product code.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> backend: ruff"
( cd "$ROOT/backend" && source .venv/bin/activate && ruff check app tests )

echo "==> backend: pytest"
( cd "$ROOT/backend" && source .venv/bin/activate && pytest -q )

echo "==> frontend: typecheck"
( cd "$ROOT/frontend" && npm run typecheck )

echo "All checks passed."
