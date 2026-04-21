import { useRef, useState } from 'react';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { exportAll, importAll } from '../db/database';
import type { ExportBundle } from '../types';

export default function DataTransfer() {
  const init = useStore(s => s.init);
  const reset = useStore(s => s.resetData);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doExport = async () => {
    const data = await exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    setMsg('Export erstellt.');
  };

  const doImport = async (file: File, replace: boolean) => {
    try {
      const text = await file.text();
      const bundle = JSON.parse(text) as ExportBundle;
      if (!bundle || bundle.version !== 1) throw new Error('Ungültiges Format');
      await importAll(bundle, { replace });
      await init();
      setMsg(replace ? 'Import abgeschlossen (Daten ersetzt).' : 'Import abgeschlossen (zusammengeführt).');
    } catch (e: any) {
      setMsg(`Fehler: ${e?.message ?? 'Unbekannt'}`);
    }
  };

  return (
    <div>
      <Header title="Daten Export / Import" onBack />
      <div className="px-5 py-4 space-y-4">
        <div className="card p-5 space-y-3">
          <div className="label">Export</div>
          <p className="text-sm text-ink-300">Alle Sessions, Cardio, Progression und Einstellungen als JSON sichern.</p>
          <button className="btn-primary w-full" onClick={doExport}>Als JSON exportieren</button>
        </div>

        <div className="card p-5 space-y-3">
          <div className="label">Import</div>
          <p className="text-sm text-ink-300">Datei auswählen und entweder zusammenführen oder ersetzen.</p>
          <input type="file" accept="application/json" ref={fileRef} className="input" />
          <div className="grid grid-cols-2 gap-3">
            <button
              className="btn-ghost"
              onClick={() => { const f = fileRef.current?.files?.[0]; if (f) doImport(f, false); }}
            >Zusammenführen</button>
            <button
              className="btn-danger"
              onClick={() => { const f = fileRef.current?.files?.[0]; if (f && confirm('Alle bestehenden Daten ersetzen?')) doImport(f, true); }}
            >Ersetzen</button>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <div className="label text-danger-500">Reset</div>
          <p className="text-sm text-ink-300">Löscht lokale Daten vollständig und setzt Standardwerte.</p>
          <button
            className="btn-danger w-full"
            onClick={async () => {
              if (confirm('Wirklich alle Daten löschen?')) { await reset(); setMsg('Daten gelöscht.'); }
            }}
          >Alles löschen</button>
        </div>

        {msg && <div className="card p-4 text-sm text-ink-200">{msg}</div>}
      </div>
    </div>
  );
}
