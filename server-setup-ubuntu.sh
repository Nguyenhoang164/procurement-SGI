#!/usr/bin/env bash
set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
  echo "[ERROR] Run as root: sudo bash server-setup-ubuntu.sh"
  exit 1
fi

if [ -z "${REPO_URL:-}" ]; then
  echo "[ERROR] Set REPO_URL before running. Example:"
  echo "REPO_URL=git@github.com:owner/repo.git DOMAIN=example.com ACME_EMAIL=admin@example.com bash server-setup-ubuntu.sh"
  exit 1
fi

if [ -z "${DOMAIN:-}" ]; then
  echo "[ERROR] Set DOMAIN before running."
  exit 1
fi

if [ -z "${ACME_EMAIL:-}" ]; then
  echo "[ERROR] Set ACME_EMAIL before running."
  exit 1
fi

APP_DIR="${APP_DIR:-/opt/procurement-SGI}"

apt-get update
apt-get install -y ca-certificates curl git openssl

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  cat >/etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull
elif [ -e "$APP_DIR" ]; then
  echo "[ERROR] $APP_DIR already exists but is not a git repository."
  echo "[INFO] Move or remove it manually, then run this script again."
  exit 1
else
  git clone "$REPO_URL" "$APP_DIR"
fi

cd "$APP_DIR"

if [ ! -f .env ]; then
  cp .env.example .env
fi

MYSQL_ROOT_PASSWORD="$(openssl rand -base64 32 | tr -d '\n')"
DB_PASSWORD="$(openssl rand -base64 32 | tr -d '\n')"
JWT_SECRET="$(openssl rand -base64 64 | tr -d '\n')"

cat >.env <<EOF
DOMAIN=$DOMAIN
ACME_EMAIL=$ACME_EMAIL

MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
DB_USERNAME=sgi_user
DB_PASSWORD=$DB_PASSWORD

JWT_SECRET=$JWT_SECRET
JWT_EXPIRATION=86400000

CORS_ALLOWED_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
EOF

docker compose --env-file .env up -d --build
docker compose --env-file .env ps
