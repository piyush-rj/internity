#!/usr/bin/env bash
set -euo pipefail

# Run any prisma command against the LOCAL Docker dev database -- never prod.
#
#   ./scripts/prisma-dev.sh migrate dev
#   ./scripts/prisma-dev.sh migrate reset
#   ./scripts/prisma-dev.sh studio
#
# The local connection string is non-secret (localhost). prisma.config.ts loads
# .env via dotenv with override=false, so these exported values take precedence
# and the PRODUCTION urls in .env are ignored for this command. That's the
# guardrail: dev/reset commands physically cannot reach prod through this path.

DB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DB_DIR"

LOCAL_URL="postgresql://postgres:postgres@localhost:5433/internity_dev"
export DATABASE_URL="$LOCAL_URL"
export DIRECT_URL="$LOCAL_URL"

echo "[prisma-dev] target: $LOCAL_URL"
exec bunx prisma "$@"
