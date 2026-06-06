#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
  cp "$ROOT/.env.example" "$ENV_FILE"
  echo "[WARN] Created .env from .env.example"
  echo "[INFO] Edit $ENV_FILE with your domain, email, and production secrets, then run again."
  exit 0
fi

docker compose -f "$ROOT/docker-compose.yml" --env-file "$ENV_FILE" up -d --build
docker compose -f "$ROOT/docker-compose.yml" --env-file "$ENV_FILE" ps
