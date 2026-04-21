#!/usr/bin/env bash
# Lokaler Dev-Start: Frontend (Vite, :5173) + Backend (Express, :3001).
# Prüft Abhängigkeiten, .env und SQLite-Verzeichnis, startet dann beides parallel.

set -euo pipefail
cd "$(dirname "$0")"

# --- Node / npm vorhanden? ---
if ! command -v node >/dev/null 2>&1; then
  echo "✗ node nicht gefunden. Installiere Node 20+ (z. B. via 'brew install node')."
  exit 1
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "✗ Node $(node -v) zu alt. Bitte Node 20+ nutzen."
  exit 1
fi

# --- Dependencies ---
if [ ! -d node_modules ] || [ package.json -nt node_modules ]; then
  echo "→ npm install"
  npm install
fi

# --- .env ---
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
  else
    touch .env
  fi
  # Starken JWT-Secret generieren
  if command -v openssl >/dev/null 2>&1; then
    SECRET=$(openssl rand -hex 32)
    if grep -q '^JWT_SECRET=' .env; then
      # BSD sed (macOS) vs GNU sed
      if sed --version >/dev/null 2>&1; then
        sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${SECRET}|" .env
      else
        sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${SECRET}|" .env
      fi
    else
      echo "JWT_SECRET=${SECRET}" >> .env
    fi
    echo "→ .env erstellt, JWT_SECRET generiert"
  fi
fi

# --- SQLite-Verzeichnis ---
mkdir -p server/data

# --- Starten ---
echo
echo "─────────────────────────────────────────"
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:3001"
echo "  Stoppen mit Ctrl+C"
echo "─────────────────────────────────────────"
echo

exec npm run dev
