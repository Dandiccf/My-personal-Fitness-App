# Trainings-App

Mobile-first PWA für den strukturierten Wiedereinstieg ins Gerätetraining. Läuft komplett offline, speichert alle Daten lokal (IndexedDB), kein Backend nötig. Deploybar als statisches Bundle.

## Tech-Stack

- **React 18 + TypeScript + Vite** — schneller Build, einfache statische Ausgabe
- **Tailwind CSS** — dichtes, konsistentes, mobile-first Design
- **Zustand** — kleine reaktive Store-Schicht
- **IndexedDB** via `idb` — saubere strukturierte Persistenz mit Export/Import
- **vite-plugin-pwa** — Manifest + Service Worker für Offline / Install-to-Home

Keine schweren UI-Libraries, kein Backend, kein Tracking.

## Architektur-Überblick

```
src/
├── App.tsx                 // Router + PWA-Shell
├── main.tsx                // Entry
├── index.css               // Tailwind + Design-Tokens
├── types/                  // Domain-Typen (Exercise, Session, Settings ...)
├── data/
│   ├── exercises.ts        // Übungsbibliothek (geräte-/kabellastig, mit Alternativen)
│   └── programTemplate.ts  // 3× Ganzkörper + 2× Cardio Wochenstruktur
├── db/database.ts          // IndexedDB (sessions, cardio, progression, settings, profile)
├── lib/
│   ├── volumeEngine.ts     // 12-Wochen-Blocksteuerung, Recovery-Scaling, Compliance
│   ├── progression.ts      // Double Progression + Stagnation → Variantenvorschlag
│   └── dateUtils.ts
├── store/useStore.ts       // gesamte Session-/Settings-State-Logik
├── components/             // BottomNav, Header, RestTimer, NumberStepper, BottomSheet, Sparkline
└── pages/                  // Today, Week, ActiveSession, History, SessionDetail, Stats,
                            // ExerciseDetail, Settings, Library, CardioForm, DataTransfer
```

### Trainingslogik

- **Wochenstruktur**: Mo Gym A · Di lockerer Lauf · Mi Gym B · Do Mobility · Fr Gym C · Sa Lauf/MTB · So Ruhe
- **Blocklogik (12 Wochen)** in `volumeEngine.ts`:
  W1–2 Re-Entry (ca. 80 % Volumen), W3–4 Aufbau, W5–6 Aufbau+, W7 Deload (~55 %),
  W8–10 Block 2, W11 Peak, W12 Reset/Deload.
- **Satzzahlen** werden pro Übung und Woche *regelbasiert* berechnet (Hauptübung vs. Zubehör vs. Optional) — nicht hardcoded.
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
```

## Dev-Server

```bash
npm run dev
# öffnet http://localhost:5173
```

Mit Handy im gleichen WLAN: Dev-Server mit Host binden:
```bash
npm run dev -- --host
```

## Production Build

```bash
npm run build
```

Das fertige Bundle liegt in `dist/` — einfach als statische Dateien hosten. `dist/manifest.webmanifest`, `dist/sw.js` und Icons sind enthalten.

Lokal testen:
```bash
npm run preview -- --host
```

## Deploy

Alle Varianten: Inhalt von `dist/` veröffentlichen.

- **Netlify**: Drop `dist/` Ordner, oder `netlify deploy --dir=dist --prod`. `vite` liefert SPA-Fallback via `_redirects` wenn gewünscht (siehe unten).
- **Vercel**: `vercel --prod`, Framework-Preset „Vite". Build Command `npm run build`, Output `dist`.
- **GitHub Pages**: Auf einem Subpfad hosten — `base` in `vite.config.ts` von `'./'` auf `'/repo-name/'` setzen, dann `dist/` ins `gh-pages` Branch pushen.
- **nginx (selbst gehostet)**: `dist/` in `/var/www/training/`, Konfig:
  ```
  server {
    listen 80;
    server_name training.example.com;
    root /var/www/training;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }
    # Service Worker darf nicht endlos gecached werden:
    location = /sw.js { add_header Cache-Control "no-cache"; }
  }
  ```
- **Apple „Zum Home-Bildschirm"**: App im Safari öffnen → Teilen → Zum Home-Bildschirm. Manifest + Apple-Touch-Icon sind vorhanden.

### SPA-Fallback (wichtig)
Alle Routen liegen hinter React Router. Hosts ohne Fallback liefern für `/history` o. ä. sonst 404 beim Reload.
- Netlify: `public/_redirects` mit `/* /index.html 200`
- Vercel: funktioniert automatisch mit dem Vite-Preset
- nginx: `try_files $uri $uri/ /index.html;` (siehe oben)

## Datenexport / Datenimport

Unter **Einstellungen → Daten Export / Import**:
- **Export**: lädt `training-export-YYYY-MM-DD.json` herunter (Sessions, Cardio, Progression, Settings, Profil).
- **Import (zusammenführen)**: Bestehende Daten bleiben erhalten, Import überschreibt gleiche IDs.
- **Import (ersetzen)**: Alle bestehenden Daten werden gelöscht und durch den Import ersetzt.
- **Reset**: Alle Daten löschen, Standardwerte werden neu gesetzt.

Die JSON-Datei ist offenes Format — bei Bedarf per Texteditor prüfbar.

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
