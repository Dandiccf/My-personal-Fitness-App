# Deploy auf einen eigenen Server (z. B. Hetzner)

Dieser Stack läuft auf jedem Ubuntu/Debian-Server mit Docker: Node-App + Caddy (Auto-HTTPS via Let's Encrypt) in einem Compose-Setup.

## Vorbereitung

1. Server anlegen (z. B. Hetzner CX22). SSH-Key hinterlegen.
2. Lokal im Projekt-Root:
   ```bash
   cp Caddyfile.example Caddyfile
   cp scripts/deploy.sh.example scripts/deploy.sh
   chmod +x scripts/deploy.sh
   ```
3. In `Caddyfile` den Hostname eintragen.
4. In `scripts/deploy.sh` `SERVER` + `URL` setzen.

> `Caddyfile`, `scripts/deploy.sh` und `.env` enthalten deploymentspezifische Werte und sind per `.gitignore` vom Repo ausgeschlossen. Nur die `.example`-Dateien werden versioniert.

## Hostname wählen

- **Reine IP ohne eigene Domain**: Nutze [sslip.io](https://sslip.io) — kostenlos. Aus IP `1.2.3.4` wird `1-2-3-4.sslip.io`, zeigt automatisch auf die IP. Caddy holt darauf ein echtes Let's-Encrypt-Zertifikat.
- **Eigene Domain**: A-Record auf Server-IP zeigen lassen. Caddy übernimmt den Rest.

## Einmaliges Server-Setup (~5 Minuten)

Vom Mac aus:

```bash
scp scripts/server-setup.sh root@YOUR_SERVER_IP:/root/
ssh root@YOUR_SERVER_IP 'bash /root/server-setup.sh'
```

Das Skript installiert Docker + Compose, aktiviert die UFW-Firewall (22/80/443), legt `/opt/training` an und generiert ein `JWT_SECRET` in `/opt/training/.env`.

## Erstes Deployment (~2 Minuten)

```bash
./scripts/deploy.sh
```

Was passiert:
1. `rsync` kopiert den Code nach `/opt/training/` (ohne `node_modules`, `dist`, `data`, `.env`)
2. Auf dem Server: `docker compose build` baut das Image (Frontend + Backend)
3. `docker compose up -d` startet App + Caddy
4. Caddy holt beim ersten Request automatisch ein Let's-Encrypt-Zertifikat (~20 Sekunden)

Der erste Build dauert ~3 Minuten wegen nativem `better-sqlite3`. Folge-Deploys sind durch Docker-Layer-Caching deutlich schneller.

## Nach jeder Code-Änderung

```bash
./scripts/deploy.sh
```

SQLite-Daten in `/opt/training/data/` bleiben zwischen Deploys erhalten.

## Logs

```bash
ssh root@YOUR_SERVER_IP 'cd /opt/training && docker compose logs -f app'
ssh root@YOUR_SERVER_IP 'cd /opt/training && docker compose logs -f caddy'
```

## Backup der SQLite-Daten

```bash
rsync -avz root@YOUR_SERVER_IP:/opt/training/data/ ./backup-$(date +%F)/
```

Empfehlung: einmal pro Woche, oder als Cron-Job auf dem Mac.

## Späteren Domain-Wechsel

1. In deinem DNS-Provider einen A-Record `training.example.com → YOUR_SERVER_IP` anlegen.
2. `Caddyfile` lokal anpassen:
   ```
   training.example.com {
       encode zstd gzip
       reverse_proxy app:3001
   }
   ```
3. `./scripts/deploy.sh` — Caddy holt automatisch ein neues Zertifikat.

## Troubleshooting

**HTTPS geht nicht sofort:** Beim ersten Aufruf braucht Caddy 10–30 Sekunden für Let's Encrypt. Seite neu laden.

**App startet nicht:**
```bash
ssh root@YOUR_SERVER_IP 'cd /opt/training && docker compose logs app | tail -50'
```

**Firewall-Status prüfen:**
```bash
ssh root@YOUR_SERVER_IP 'ufw status'
```

**Container neu starten:**
```bash
ssh root@YOUR_SERVER_IP 'cd /opt/training && docker compose restart'
```

## Sicherheits-Nachpflege (optional)

- SSH-Root-Login per Passwort deaktivieren: `PermitRootLogin prohibit-password` in `/etc/ssh/sshd_config`
- Automatische Security-Updates: `apt-get install -y unattended-upgrades`
- Nicht-Root-User anlegen und der Docker-Gruppe hinzufügen

Für eine Single-User-App ist das nicht dringend — Firewall + SSH-Key-Only ist für den Anfang ausreichend.
