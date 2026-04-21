#!/usr/bin/env bash
# Einmalig auf dem Hetzner-Server ausführen (als root).
# Installiert Docker, Firewall, legt /opt/training an, generiert JWT_SECRET.

set -euo pipefail

APP_DIR="/opt/training"

echo "==> Update System"
apt-get update -y
apt-get upgrade -y

echo "==> Docker Installation"
if ! command -v docker >/dev/null 2>&1; then
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  . /etc/os-release
  DOCKER_DISTRO="${ID:-debian}"
  curl -fsSL "https://download.docker.com/linux/${DOCKER_DISTRO}/gpg" \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${DOCKER_DISTRO} ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "==> Firewall (ufw)"
apt-get install -y ufw
ufw allow 22/tcp  >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
yes | ufw enable  >/dev/null || true
ufw status

echo "==> App-Verzeichnis ${APP_DIR}"
mkdir -p "${APP_DIR}/data"
chmod 700 "${APP_DIR}/data"

echo "==> .env vorbereiten"
if [ ! -f "${APP_DIR}/.env" ]; then
  JWT_SECRET="$(openssl rand -hex 48)"
  cat > "${APP_DIR}/.env" <<EOF
JWT_SECRET=${JWT_SECRET}
EOF
  chmod 600 "${APP_DIR}/.env"
  echo "   JWT_SECRET generiert."
else
  echo "   .env existiert bereits, bleibt unverändert."
fi

echo
echo "Server bereit."
echo "Jetzt lokal auf deinem Mac ausführen:  ./scripts/deploy.sh"
