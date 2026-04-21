# Trainings-App

Mobile-first PWA für strukturiertes Kraft- und Cardio-Tracking. Das Frontend läuft mit React/Vite, das Backend mit Node.js und Express. Benutzer registrieren sich mit E-Mail und Passwort, ihre Daten werden serverseitig in SQLite getrennt pro Konto gespeichert.

## Tech-Stack

- **React 18 + TypeScript + Vite** — schneller Build, einfache statische Ausgabe
- **Node.js + Express** — API, Authentifizierung und optionales Ausliefern des gebauten Frontends
- **SQLite** via `better-sqlite3` — einfache persistente Server-Datenbank pro Deployment
- **Tailwind CSS** — dichtes, konsistentes, mobile-first Design
- **Zustand** — kleine reaktive Store-Schicht
- **JWT + bcrypt** — Login, Registrierung und geschützte API-Endpunkte
- **vite-plugin-pwa** — Manifest + Service Worker für Offline / Install-to-Home

Keine schweren UI-Libraries, kein externes Tracking.

## Architektur-Überblick

```
server/
├── index.js               // Bootstrapping und Start des HTTP-Servers
├── app.js                 // Express-App, Middleware, API-Routen, statisches Hosting
├── config.js              // Umgebungsvariablen und Laufzeitkonfiguration
├── db.js                  // SQLite-Verbindung und Tabellenerstellung
├── middleware/
│   └── auth.js            // JWT-Validierung für geschützte Endpunkte
├── routes/
│   ├── authRoutes.js      // Registrierung, Login, aktueller Benutzer
│   └── dataRoutes.js      // Benutzerbezogene Trainingsdaten
└── services/
  ├── userService.js     // Benutzer- und Passwortlogik
  └── userDataService.js // Persistenz der Trainingsdaten pro Benutzer

src/
├── App.tsx                 // Router + PWA-Shell
├── main.tsx                // Entry
├── index.css               // Tailwind + Design-Tokens
├── types/                  // Domain-Typen (Exercise, Session, Settings ...)
├── data/
│   ├── exercises.ts        // Übungsbibliothek (geräte-/kabellastig, mit Alternativen)
│   └── programTemplate.ts  // 3× Ganzkörper + 2× Cardio Wochenstruktur
├── db/database.ts          // HTTP-basierte Datenzugriffe auf die Server-API
├── lib/
│   ├── volumeEngine.ts     // 12-Wochen-Blocksteuerung, Recovery-Scaling, Compliance
│   ├── progression.ts      // Double Progression + Stagnation → Variantenvorschlag
│   ├── api.ts              // gemeinsamer Fetch-Client für die API
│   ├── auth.ts             // Token-Handling, Login, Registrierung
│   └── dateUtils.ts
├── store/useStore.ts       // gesamte Session-/Settings-State-Logik
├── components/             // BottomNav, Header, RestTimer, NumberStepper, BottomSheet, Sparkline
└── pages/                  // Today, Week, ActiveSession, History, SessionDetail, Stats,
                            // ExerciseDetail, Settings, Library, CardioForm, DataTransfer, Auth
```

## Laufzeitmodell

- Im Development laufen zwei Prozesse: Vite für das Frontend auf Port 5173 und ein Node.js-Express-Server auf Port 3001.
- Im Production-Betrieb läuft der Express-Server. Er bedient die API und kann zusätzlich das gebaute Frontend aus `dist/` ausliefern.
- SQLite ist eine Datei auf dem Server, standardmäßig unter `server/data/app.sqlite`.

Der Server, der tatsächlich läuft, ist also ein normaler Node.js-Prozess mit Express, gestartet über `node server/index.js`.

### Trainingslogik

- **Wochenstruktur**: Mo Gym A · Di lockerer Lauf · Mi Gym B · Do Mobility · Fr Gym C · Sa Lauf/MTB · So Ruhe
- **Blocklogik (12 Wochen)** in `volumeEngine.ts`:
  W1–2 Re-Entry (ca. 80 % Volumen), W3–4 Aufbau, W5–6 Aufbau+, W7 Deload (~55 %),
  W8–10 Block 2, W11 Peak, W12 Reset/Deload.
- **Satzzahlen** werden pro Übung und Woche _regelbasiert_ berechnet (Hauptübung vs. Zubehör vs. Optional) — nicht hardcoded.
- **Compliance-Check**: Wurden in den letzten 14 Tagen viele Sessions verpasst, bremst die Engine das Volumen (−1 oder −2 Sätze).
- **Recovery-Check** vor der Session skaliert Volumen zusätzlich: schlechter Score → Volumenreduktion; wenig Zeit → Session wird gekürzt.
- **Quick Mode**: streicht die letzten 1–3 Zubehör-/Optional-Übungen, Hauptübungen bleiben.
- **Double Progression** pro Übung (`progression.ts`): alle Sätze am oberen Bereichsende mit ausreichend RIR → Gewicht +2,5 kg; Einbruch → halten/reduzieren; mehrfache Stagnation → Vorschlag zum Variantenwechsel.
- **Stimulus-Wechsel** kontrolliert über Alternativübungen pro Bewegungsmuster (in der Library auswählbar).

### UX-Entscheidungen

- Dark Mode, ruhige Typo (Inter), hoher Kontrast.
- Große Touch-Ziele (`min-height: 48px` überall) und dicke Stepper für Gewicht/Wdh.
- Sticky Bottom-Nav, im Session-Screen deaktiviert für Fokus.
- Pausentimer als Bottom-Sheet-Pille mit +15/+30/Pause/Reset, Pulsring während Countdown, Vibration + Sound bei Ende.
- Satzzeile: Gewicht links, Wdh rechts, RIR-Chips, großer „Satz abgeschlossen"-Button — einhändig bedienbar.
- Swap und Notiz pro Übung als Bottom-Sheet, immer einen Tap entfernt.

## Setup

```bash
npm install
cp .env.example .env
```

Danach mindestens `JWT_SECRET` in `.env` setzen.

## Dev-Server

```bash
npm run dev
# startet Backend auf http://localhost:3001 und Frontend auf http://localhost:5173
```

Nur Frontend separat starten:

```bash
npm run dev:client
```

Nur Backend separat starten:

```bash
npm run dev:server
```

## Production Build

```bash
npm run build
```

Danach den Server starten:

```bash
npm start
```

Das Frontend-Bundle liegt in `dist/`. Der Express-Server kann dieses Bundle direkt mit ausliefern.

Lokal testen:

```bash
npm start
```

## Deploy

Dieses Projekt ist nicht mehr rein statisch deploybar. Du brauchst einen Host, auf dem Node.js läuft und der Schreibzugriff auf die SQLite-Datei hat.

- **Render / Railway / Fly.io / VPS**: geeignet, weil dort ein Node-Prozess plus SQLite-Datei laufen kann.
- **GitHub Pages**: ungeeignet, weil nur statisches Hosting und kein Node/SQLite.
- **Netlify / klassisches Vercel Static Hosting**: ungeeignet für dieses Setup ohne separates Backend.
- **nginx + Node auf VPS**: gut geeignet, nginx als Reverse Proxy vor dem Express-Server.

Beispiel mit nginx vor Node:

```
server {
  listen 80;
  server_name training.example.com;
  location / {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

- **Apple „Zum Home-Bildschirm"**: App im Safari öffnen → Teilen → Zum Home-Bildschirm. Manifest + Apple-Touch-Icon sind vorhanden.

### SPA-Fallback (wichtig)

Alle Routen liegen hinter React Router. Der Express-Server übernimmt den SPA-Fallback beim Ausliefern von `dist/`.

## Datenexport / Datenimport

Unter **Einstellungen → Daten Export / Import**:

- **Export**: lädt `training-export-YYYY-MM-DD.json` herunter (Sessions, Cardio, Progression, Settings, Profil).
- **Import (zusammenführen)**: Bestehende Daten bleiben erhalten, Import überschreibt gleiche IDs.
- **Import (ersetzen)**: Alle bestehenden Daten werden gelöscht und durch den Import ersetzt.
- **Reset**: Alle Daten löschen, Standardwerte werden neu gesetzt.

Die JSON-Datei ist offenes Format — bei Bedarf per Texteditor prüfbar.

## Umgebungsvariablen

Die Beispielkonfiguration liegt in `.env.example`.

- `PORT`: Port des Express-Servers
- `JWT_SECRET`: Pflichtwert für Login-Token
- `SQLITE_DB_PATH`: Pfad zur SQLite-Datei
- `CORS_ORIGIN`: optional, nötig wenn Frontend und Backend auf verschiedenen Origins laufen
- `VITE_API_BASE_URL`: Basis-URL für das Frontend, standardmäßig `/api`

## Standard-Daten

Beim ersten Start ist das 12-Wochen-Programm direkt aktiv, Startdatum = heute. In den Einstellungen lässt sich:

- Programmstart zurücksetzen,
- Block-Länge anpassen (4–16 Wochen),
- Deload-Modus (auto/manuell) umstellen,
- Pausen-Defaults für Haupt- und Isolationsübungen setzen,
- Ton/Vibration für den Pausentimer steuern.

Unter **Übungsbibliothek** lässt sich pro Übung eine bevorzugte Alternative auswählen, die ab dem nächsten Workout als Standard verwendet wird (kontrollierter Stimulus-Wechsel ohne Chaos).

## Lizenz

Privat. Mach damit was du willst.
