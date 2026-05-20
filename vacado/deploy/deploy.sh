#!/usr/bin/env bash
# Zero-downtime-ish deploy for Vacado. Idempotent and non-destructive:
#   * Backs up the EXISTING Vacado Postgres volume before doing anything.
#   * Never drops databases or removes volumes.
#   * Runs alongside other apps (own volumes, own WEB_PORT, no public DB ports).
#
# Run from the repo root after .env exists at vacado/.env :
#   WEB_PORT=8080 bash vacado/deploy/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."          # -> vacado/
PROJECT=vacado
COMPOSE=(docker compose -p "$PROJECT" -f docker-compose.prod.yml)
BACKUP_DIR="$HOME/vacado-backups"
mkdir -p "$BACKUP_DIR"

if [ ! -f .env ]; then
  echo "ERROR: vacado/.env is missing. Create it from .env.example first." >&2
  exit 1
fi

# ── 1. Back up the existing Vacado database (if this isn't a first deploy) ──
if docker ps -a --format '{{.Names}}' | grep -q "^${PROJECT}-postgres-1$"; then
  TS=$(date +%Y%m%d-%H%M%S)
  echo "==> Backing up existing Vacado DB -> $BACKUP_DIR/vacado-$TS.sql.gz"
  if docker exec "${PROJECT}-postgres-1" pg_isready -U vacado >/dev/null 2>&1; then
    docker exec "${PROJECT}-postgres-1" \
      pg_dump -U vacado -d vacado | gzip > "$BACKUP_DIR/vacado-$TS.sql.gz"
    echo "    Backup complete ($(du -h "$BACKUP_DIR/vacado-$TS.sql.gz" | cut -f1))."
  else
    echo "    Postgres container not ready — skipping dump (volume is preserved anyway)."
  fi
  # Keep the 14 most recent backups.
  ls -1t "$BACKUP_DIR"/vacado-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
else
  echo "==> First deploy — no existing Vacado DB to back up."
fi

# ── 2. Build and start (migrations run automatically in the backend cmd) ──
echo "==> Building images"
"${COMPOSE[@]}" build

echo "==> Starting stack on WEB_PORT=${WEB_PORT:-8080}"
# --force-recreate guarantees no stale containers survive a deploy.
"${COMPOSE[@]}" up -d --remove-orphans --force-recreate

# ── 3. Health check ──
echo "==> Waiting for API health"
for i in $(seq 1 30); do
  if docker run --rm --network "${PROJECT}_default" curlimages/curl:8.8.0 \
      -fsS http://backend:4000/api/health >/dev/null 2>&1; then
    echo "    Healthy."
    break
  fi
  [ "$i" -eq 30 ] && { echo "API did not become healthy:"; "${COMPOSE[@]}" logs --tail=40 backend; exit 1; }
  sleep 3
done

# ── 4. Clean up dangling images only (never volumes) ──
docker image prune -f >/dev/null 2>&1 || true

echo "==> Deploy complete."
echo "    App: http://$(hostname -I | awk '{print $1}'):${WEB_PORT:-8080}"
echo "    Backups: $BACKUP_DIR"
