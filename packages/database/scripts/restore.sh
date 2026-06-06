#!/usr/bin/env bash
set -euo pipefail

# Restore a dump produced by backup.sh into the database in .env (DIRECT_URL).
#
#   Usage: ./scripts/restore.sh scripts/backups/backup_YYYYMMDD_HHMMSS.sql.gz
#
# WARNING: the dump was taken with --clean --if-exists, so this DROPs and
# recreates the public-schema objects in the TARGET database. Make sure
# DIRECT_URL points at the database you actually intend to overwrite.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

# Pick the newest psql available (client should be >= the server version).
# Avoids pinning a version that breaks after a Postgres upgrade.
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
PSQL="$(pick_newest psql)"
[ -n "$PSQL" ] || { echo "No psql found. Install one: brew install libpq" >&2; exit 1; }

[ $# -ge 1 ] || { echo "Usage: $0 <backup-file.sql.gz>" >&2; exit 1; }
DUMP="$1"
[ -f "$DUMP" ] || { echo "File not found: $DUMP" >&2; exit 1; }

[ -f "$ENV_FILE" ] || { echo "Missing $ENV_FILE" >&2; exit 1; }
set -a; source "$ENV_FILE"; set +a
[ -n "${DIRECT_URL:-}" ] || { echo "DIRECT_URL not set in $ENV_FILE" >&2; exit 1; }

SAFE_URL="$(echo "$DIRECT_URL" | sed -E 's#://[^@]*@#://***@#')"
echo "Restoring $DUMP"
echo "  into: $SAFE_URL"
read -r -p "This OVERWRITES the public schema. Type 'yes' to continue: " confirm
[ "$confirm" = "yes" ] || { echo "Aborted."; exit 1; }

gunzip -c "$DUMP" | "$PSQL" "$DIRECT_URL" -v ON_ERROR_STOP=1

echo "Restore complete."
