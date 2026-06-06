#!/usr/bin/env bash
set -euo pipefail

# Logical backup of the Supabase Postgres `public` schema (your app data).
# A free-tier DIY substitute for Supabase Pro's automated backups.
#
#   Usage:  ./scripts/backup.sh
#   Output: scripts/backups/backup_YYYYMMDD_HHMMSS.sql.gz
#
# Reads the connection string from packages/database/.env (DIRECT_URL).
#
# NOTE: this dumps the `public` schema only — your application tables and data.
# Supabase-managed schemas (auth, storage, ...) are NOT included; the
# `auth.users` accounts that power login live there and are managed by Supabase.
# For full disaster recovery you'd restore `public` into a fresh project and
# reconnect auth. For day-to-day data safety, this is the part you care about.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
OUT_DIR="$SCRIPT_DIR/backups"

# pg_dump must be >= the Postgres server version. Rather than pin a version
# (which breaks when the server is upgraded, e.g. 17 -> 18), scan the common
# install locations and pick the newest client available. Keep your client
# current with `brew upgrade libpq` (or postgresql@NN).
pick_newest() {
    local bin="$1" best="" bestver=0 cand ver
    for cand in \
        /opt/homebrew/opt/libpq/bin/"$bin" \
        /opt/homebrew/opt/postgresql@*/bin/"$bin" \
        /usr/local/opt/libpq/bin/"$bin" \
        /usr/local/opt/postgresql@*/bin/"$bin" \
        "$(command -v "$bin" 2>/dev/null)"; do
        [ -x "$cand" ] || continue
        ver="$("$cand" --version 2>/dev/null | grep -oE '[0-9]+' | head -1)"
        [ -n "$ver" ] || continue
        if [ "$ver" -gt "$bestver" ]; then bestver="$ver"; best="$cand"; fi
    done
    echo "$best"
}
PG_DUMP="$(pick_newest pg_dump)"
[ -n "$PG_DUMP" ] || { echo "No pg_dump found. Install one: brew install libpq" >&2; exit 1; }

[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE" >&2; exit 1; }
set -a; source "$ENV_FILE"; set +a
[ -n "${DIRECT_URL:-}" ] || { echo "DIRECT_URL not set in $ENV_FILE" >&2; exit 1; }

mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$OUT_DIR/backup_${STAMP}.sql.gz"

echo "Backing up public schema -> $OUT"
"$PG_DUMP" "$DIRECT_URL" \
    --schema=public \
    --no-owner --no-privileges \
    --clean --if-exists \
    | gzip > "$OUT"

echo "Done: $(du -h "$OUT" | cut -f1)  ($OUT)"

# Optional retention: keep only the 30 most recent dumps.
ls -1t "$OUT_DIR"/backup_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm -f
