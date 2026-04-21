import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { todayISO } from '../lib/dateUtils';

export default function Settings() {
  const settings = useStore(s => s.settings)!;
  const profile = useStore(s => s.profile)!;
  const save = useStore(s => s.saveSettings);
  const saveProfile = useStore(s => s.saveProfile);

  return (
    <div>
      <Header title="Einstellungen" />
      <div className="px-5 py-4 space-y-5">
        <Section title="Profil">
          <Row>
            <span>Name</span>
            <input
              className="input max-w-[60%] text-right"
              defaultValue={profile.name}
              onBlur={e => saveProfile({ name: e.target.value })}
            />
          </Row>
          <Row>
            <span>Ziel</span>
            <select
              className="input max-w-[60%]"
              value={profile.goal}
              onChange={e => saveProfile({ goal: e.target.value as any })}
            >
              <option value="reentry">Wiedereinstieg</option>
              <option value="maintain">Erhalt</option>
              <option value="hypertrophy_light">Leichter Muskelaufbau</option>
            </select>
          </Row>
        </Section>

        <Section title="Programm">
          <Row>
            <span>Block-Länge (Wochen)</span>
            <input
              type="number" className="input max-w-[30%] text-right"
              min={4} max={16}
              defaultValue={settings.blockWeeks}
              onBlur={e => save({ blockWeeks: Math.max(4, Math.min(16, Number(e.target.value) || 12)) })}
            />
          </Row>
          <Row>
            <span>Programmstart</span>
            <input
              type="date" className="input max-w-[60%] text-right"
              value={settings.programStartDate}
              onChange={e => save({ programStartDate: e.target.value })}
            />
          </Row>
          <Row>
            <span>Deload</span>
            <select
              className="input max-w-[50%]"
              value={settings.deloadMode}
              onChange={e => save({ deloadMode: e.target.value as any })}
            >
              <option value="auto">Automatisch</option>
              <option value="manual">Manuell</option>
            </select>
          </Row>
          <Row>
            <span>Ziel-Dauer (Min)</span>
            <input type="number" className="input max-w-[30%] text-right"
              min={25} max={120}
              defaultValue={settings.sessionDurationTargetMin}
              onBlur={e => save({ sessionDurationTargetMin: Number(e.target.value) })}
            />
          </Row>
          <button className="text-sm text-accent-400 mt-2" onClick={() => save({ programStartDate: todayISO() })}>Programm jetzt neu starten</button>
        </Section>

        <Section title="Pausen">
          <Row>
            <span>Pause Hauptübungen (Sek)</span>
            <input type="number" className="input max-w-[30%] text-right"
              defaultValue={settings.defaultRestMainSec}
              onBlur={e => save({ defaultRestMainSec: Number(e.target.value) || 110 })}
            />
          </Row>
          <Row>
            <span>Pause Iso-Übungen (Sek)</span>
            <input type="number" className="input max-w-[30%] text-right"
              defaultValue={settings.defaultRestIsoSec}
              onBlur={e => save({ defaultRestIsoSec: Number(e.target.value) || 75 })}
            />
          </Row>
        </Section>

        <Section title="Benachrichtigung">
          <Row>
            <span>Ton bei Pausenende</span>
            <Toggle checked={settings.soundEnabled} onChange={v => save({ soundEnabled: v })} />
          </Row>
          <Row>
            <span>Vibration</span>
            <Toggle checked={settings.vibrationEnabled} onChange={v => save({ vibrationEnabled: v })} />
          </Row>
        </Section>

        <Section title="Mehr">
          <Link to="/library" className="block">
            <Row>
              <span>Übungsbibliothek</span>
              <span className="text-accent-400">›</span>
            </Row>
          </Link>
          <Link to="/settings/data" className="block">
            <Row>
              <span>Daten Export / Import</span>
              <span className="text-accent-400">›</span>
            </Row>
          </Link>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label mb-2 px-1">{title}</div>
      <div className="card divide-y divide-white/5">{children}</div>
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 px-4 py-3 text-ink-100">{children}</div>;
}
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full flex items-center transition ${checked ? 'bg-accent-500' : 'bg-ink-600'}`}
    >
      <span className={`w-5 h-5 bg-white rounded-full shadow transform transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
