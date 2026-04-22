import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useStore } from "../store/useStore";
import { todayISO } from "../lib/dateUtils";
import type { Settings as SettingsType, UserProfile, WorkoutType } from "../types";
import { WORKOUT_TYPE_LABEL } from "../data/programTemplate";

export default function Settings() {
  const currentUser = useStore((s) => s.currentUser)!;
  const settings = useStore((s) => s.settings)!;
  const profile = useStore((s) => s.profile)!;
  const saveSettingsStore = useStore((s) => s.saveSettings);
  const saveProfileStore = useStore((s) => s.saveProfile);
  const logout = useStore((s) => s.logout);
  const startSimulation = useStore((s) => s.startSimulation);
  const nav = useNavigate();

  const simulate = (t: WorkoutType) => {
    startSimulation(t);
    nav('/session');
  };

  const [toast, setToast] = useState(false);
  const toastTimer = useRef<number | null>(null);
  const showSaved = () => {
    setToast(true);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(false), 1400);
  };
  useEffect(() => () => { if (toastTimer.current) window.clearTimeout(toastTimer.current); }, []);

  const save = async (patch: Partial<SettingsType>) => { await saveSettingsStore(patch); showSaved(); };
  const saveProfile = async (patch: Partial<UserProfile>) => { await saveProfileStore(patch); showSaved(); };

  return (
    <div>
      <Header title="Einstellungen" />
      <div className="px-5 py-4 space-y-5">
        <div className="rounded-xl bg-accent-500/10 border border-accent-500/20 px-4 py-2.5 text-xs text-accent-400">
          Änderungen werden automatisch gespeichert.
        </div>
        <Section title="Konto">
          <Row>
            <span>E-Mail</span>
            <span className="text-sm text-ink-300 break-all text-right">{currentUser.email}</span>
          </Row>
          <div className="px-4 py-3">
            <button className="btn-danger w-full" onClick={logout}>
              Abmelden
            </button>
          </div>
        </Section>

        <Section title="Probe-Training">
          <div className="p-4 space-y-3">
            <p className="text-sm text-ink-300">
              Starte eine Simulation, um die Trainings-Ansicht komplett durchzuspielen. Nichts wird gespeichert, nichts landet im Verlauf oder in den Statistiken.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => simulate('gym_a')} className="btn-ghost py-3 text-sm">{WORKOUT_TYPE_LABEL.gym_a}</button>
              <button onClick={() => simulate('gym_b')} className="btn-ghost py-3 text-sm">{WORKOUT_TYPE_LABEL.gym_b}</button>
              <button onClick={() => simulate('gym_c')} className="btn-ghost py-3 text-sm">{WORKOUT_TYPE_LABEL.gym_c}</button>
            </div>
          </div>
        </Section>

        <Section title="Profil">
          <Row>
            <span>Name</span>
            <input
              className="input max-w-[60%] text-right"
              defaultValue={profile.name}
              onBlur={(e) => saveProfile({ name: e.target.value })}
            />
          </Row>
          <Row>
            <span>Ziel</span>
            <select
              className="input max-w-[60%]"
              value={profile.goal}
              onChange={(e) => saveProfile({ goal: e.target.value as any })}
            >
              <option value="reentry">Wiedereinstieg</option>
              <option value="maintain">Erhalt</option>
              <option value="hypertrophy_light">Leichter Muskelaufbau</option>
            </select>
          </Row>
          <Row>
            <span>Geschlecht</span>
            <select
              className="input max-w-[60%]"
              value={profile.sex ?? ''}
              onChange={(e) => saveProfile({ sex: e.target.value ? (e.target.value as 'male' | 'female') : undefined })}
            >
              <option value="">—</option>
              <option value="male">männlich</option>
              <option value="female">weiblich</option>
            </select>
          </Row>
          <Row>
            <span>Alter</span>
            <input
              type="number" inputMode="numeric" className="input max-w-[30%] text-right"
              min={10} max={120} placeholder="Jahre"
              defaultValue={profile.age ?? ''}
              onBlur={(e) => saveProfile({ age: e.target.value ? Number(e.target.value) : undefined })}
            />
          </Row>
          <Row>
            <span>Gewicht (kg)</span>
            <input
              type="number" inputMode="decimal" step="0.1" className="input max-w-[30%] text-right"
              min={30} max={250} placeholder="kg"
              defaultValue={profile.weightKg ?? ''}
              onBlur={(e) => saveProfile({ weightKg: e.target.value ? Number(e.target.value) : undefined })}
            />
          </Row>
          <Row>
            <span>Größe (cm)</span>
            <input
              type="number" inputMode="numeric" className="input max-w-[30%] text-right"
              min={100} max={230} placeholder="cm"
              defaultValue={profile.heightCm ?? ''}
              onBlur={(e) => saveProfile({ heightCm: e.target.value ? Number(e.target.value) : undefined })}
            />
          </Row>
          <div className="px-4 py-2 text-[11px] text-ink-400">
            Wird für die Kalorien-Schätzung genutzt.
          </div>
        </Section>

        <Section title="Programm">
          <Row>
            <span>Block-Länge (Wochen)</span>
            <input
              type="number"
              className="input max-w-[30%] text-right"
              min={4}
              max={16}
              defaultValue={settings.blockWeeks}
              onBlur={(e) => save({ blockWeeks: Math.max(4, Math.min(16, Number(e.target.value) || 12)) })}
            />
          </Row>
          <Row>
            <span>Programmstart</span>
            <input
              type="date"
              className="input max-w-[60%] text-right"
              value={settings.programStartDate}
              onChange={(e) => save({ programStartDate: e.target.value })}
            />
          </Row>
          <Row>
            <span>Deload</span>
            <select
              className="input max-w-[50%]"
              value={settings.deloadMode}
              onChange={(e) => save({ deloadMode: e.target.value as any })}
            >
              <option value="auto">Automatisch</option>
              <option value="manual">Manuell</option>
            </select>
          </Row>
          <Row>
            <span>Ziel-Dauer (Min)</span>
            <input
              type="number"
              className="input max-w-[30%] text-right"
              min={25}
              max={120}
              defaultValue={settings.sessionDurationTargetMin}
              onBlur={(e) => save({ sessionDurationTargetMin: Number(e.target.value) })}
            />
          </Row>
          <button className="text-sm text-accent-400 mt-2" onClick={() => save({ programStartDate: todayISO() })}>
            Programm jetzt neu starten
          </button>
        </Section>

        <Section title="Pausen">
          <Row>
            <span>Pause Hauptübungen (Sek)</span>
            <input
              type="number"
              className="input max-w-[30%] text-right"
              defaultValue={settings.defaultRestMainSec}
              onBlur={(e) => save({ defaultRestMainSec: Number(e.target.value) || 110 })}
            />
          </Row>
          <Row>
            <span>Pause Iso-Übungen (Sek)</span>
            <input
              type="number"
              className="input max-w-[30%] text-right"
              defaultValue={settings.defaultRestIsoSec}
              onBlur={(e) => save({ defaultRestIsoSec: Number(e.target.value) || 75 })}
            />
          </Row>
        </Section>

        <Section title="Benachrichtigung">
          <Row>
            <span>Ton bei Pausenende</span>
            <Toggle checked={settings.soundEnabled} onChange={(v) => save({ soundEnabled: v })} />
          </Row>
          <Row>
            <span>Vibration</span>
            <Toggle checked={settings.vibrationEnabled} onChange={(v) => save({ vibrationEnabled: v })} />
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

      {/* Saved toast */}
      <div
        aria-live="polite"
        className={`fixed left-1/2 -translate-x-1/2 bottom-24 pointer-events-none transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        <div className="rounded-full bg-accent-500 text-ink-900 px-4 py-2 text-sm font-semibold shadow-soft flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
            <path d="M5 12l5 5 9-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Gespeichert
        </div>
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
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full flex items-center transition ${checked ? "bg-accent-500" : "bg-ink-600"}`}
    >
      <span
        className={`w-5 h-5 bg-white rounded-full shadow transform transition ${checked ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}
