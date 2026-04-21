import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PROGRAM, WORKOUT_TYPE_LABEL } from '../data/programTemplate';
import { computeWeekContext, buildScheduledSets, complianceFromHistory, compliancePenalty } from '../lib/volumeEngine';
import { formatMinutes, weekdayIndex, formatFullDate, todayISO } from '../lib/dateUtils';
import type { RecoveryCheck, WorkoutType } from '../types';
import BottomSheet from '../components/BottomSheet';
import Header from '../components/Header';

function estimateDurationMin(setCount: number): number {
  // ~ 2.5 min pro Satz inkl. Pausen. Rundung auf 5er.
  return Math.max(25, Math.round((setCount * 2.6) / 5) * 5);
}

export default function Today() {
  const settings = useStore(s => s.settings);
  const sessions = useStore(s => s.sessions);
  const activeSession = useStore(s => s.activeSession);
  const startSession = useStore(s => s.startSession);
  const nav = useNavigate();

  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [pendingType, setPendingType] = useState<WorkoutType | null>(null);
  const [quickMode, setQuickMode] = useState(false);

  const today = new Date();
  const ctx = useMemo(
    () => computeWeekContext(settings!.programStartDate, today, settings!.blockWeeks),
    [settings?.programStartDate, settings?.blockWeeks]
  );
  const compliance = useMemo(() => complianceFromHistory(sessions, PROGRAM, today), [sessions]);
  const penalty = compliancePenalty(compliance);

  const dow = weekdayIndex(today);
  const scheduled = PROGRAM.schedule.find(d => d.dayOfWeek === dow)!;
  const workoutType = scheduled.workoutType;
  const template = PROGRAM.workoutTemplates[workoutType];
  const scheduledSets = useMemo(() => buildScheduledSets(template, ctx, penalty), [template, ctx, penalty]);
  const estimatedMin = estimateDurationMin(scheduledSets.length);

  const isGym = workoutType === 'gym_a' || workoutType === 'gym_b' || workoutType === 'gym_c';
  const isCardio = workoutType === 'run_easy' || workoutType === 'run_long' || workoutType === 'mtb';

  const lastSession = sessions.filter(s => s.completed).slice(-1)[0];
  const weeklyDone = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    start.setHours(0, 0, 0, 0);
    return sessions.filter(s => s.completed && new Date(s.startedAt) >= start).length;
  }, [sessions]);

  const startGym = async (recovery?: RecoveryCheck) => {
    await startSession(workoutType, recovery, quickMode);
    nav('/session');
  };

  return (
    <div>
      <Header title="Heute" subtitle={formatFullDate(todayISO())} />
      <div className="px-5 py-4 space-y-5">
        {/* Phase banner */}
        <div className="card px-5 py-4 flex items-center justify-between">
          <div>
            <div className="label mb-1">Block {ctx.blockIndex + 1} · Woche {ctx.weekInBlock}/{settings!.blockWeeks}</div>
            <div className="text-base font-semibold text-ink-100">{ctx.phaseLabel}</div>
            <div className="text-xs text-ink-400 mt-0.5">{ctx.description}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {ctx.isDeload && <span className="chip-warn">Deload</span>}
            {penalty > 0 && <span className="chip-danger">Volumen gebremst</span>}
            <span className="chip">{Math.round(compliance * 100)}% Compliance</span>
          </div>
        </div>

        {/* Main today card */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="label mb-1">Heutiges Training</div>
              <h2 className="text-3xl font-semibold tracking-tight text-ink-100">
                {WORKOUT_TYPE_LABEL[workoutType]}
              </h2>
              {template.description && <p className="text-sm text-ink-300 mt-1">{template.description}</p>}
            </div>
            <div className="w-10 h-10 rounded-full grid place-items-center bg-accent-500/15 text-accent-400">
              {isGym ? <DumbellIcon /> : isCardio ? <RunIcon /> : <MoonIcon />}
            </div>
          </div>

          {isGym && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <Stat value={String(template.items.filter(i => i.priority !== 'optional').length)} label="Übungen" />
                <Stat value={String(scheduledSets.length)} label="Sätze" />
                <Stat value={`~${estimatedMin}m`} label="Dauer" />
              </div>
              {activeSession ? (
                <Link to="/session" className="btn-primary w-full text-lg">Session fortsetzen</Link>
              ) : (
                <div className="space-y-3">
                  <button className="btn-primary w-full text-lg" onClick={() => { setPendingType(workoutType); setRecoveryOpen(true); }}>
                    Workout starten
                  </button>
                  <label className="flex items-center justify-between text-sm text-ink-300 px-2">
                    <span>Quick Mode (Zubehör streichen)</span>
                    <Toggle checked={quickMode} onChange={setQuickMode} />
                  </label>
                </div>
              )}
            </>
          )}

          {isCardio && (
            <div className="space-y-3">
              <p className="text-sm text-ink-300">{workoutType === 'run_long' ? '40–60 Min locker Zone 2' : workoutType === 'mtb' ? '60–90 Min locker' : '30–40 Min locker Zone 2'}</p>
              <Link to="/cardio/new" className="btn-primary w-full text-lg">Cardio loggen</Link>
            </div>
          )}

          {!isGym && !isCardio && (
            <div className="space-y-3">
              <p className="text-sm text-ink-300">Erholung ist Teil des Plans. Beweglichkeit, Spaziergang, Familie.</p>
              <Link to="/cardio/new" className="btn-ghost w-full">Locker bewegt? Trotzdem loggen</Link>
            </div>
          )}
        </div>

        {/* Weekly progress */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="label">Diese Woche</div>
            <Link to="/week" className="text-sm text-accent-400">Wochenplan →</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-accent-500" style={{ width: `${Math.min(100, (weeklyDone / 5) * 100)}%` }} />
            </div>
            <span className="text-sm text-ink-200 tabular-nums">{weeklyDone}/5</span>
          </div>
        </div>

        {lastSession && (
          <div className="card p-5">
            <div className="label mb-1">Letzte Session</div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-ink-100">{WORKOUT_TYPE_LABEL[lastSession.workoutType]}</div>
                <div className="text-sm text-ink-400">
                  {lastSession.date} · {formatMinutes(Math.round((lastSession.durationSec ?? 0) / 60))}
                </div>
              </div>
              <Link to={`/history/${lastSession.id}`} className="text-sm text-accent-400">Details →</Link>
            </div>
          </div>
        )}
      </div>

      <BottomSheet open={recoveryOpen} onClose={() => setRecoveryOpen(false)} title="Tagesform">
        <RecoveryForm
          targetMin={settings!.sessionDurationTargetMin}
          onCancel={() => setRecoveryOpen(false)}
          onStart={(rec) => { setRecoveryOpen(false); startGym(rec); }}
          onSkip={() => { setRecoveryOpen(false); startGym(undefined); }}
        />
      </BottomSheet>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-3">
      <div className="text-xl font-semibold text-ink-100 tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-ink-400 mt-0.5">{label}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full flex items-center transition ${checked ? 'bg-accent-500' : 'bg-ink-600'}`}
    >
      <span className={`w-5 h-5 bg-white rounded-full shadow transform transition ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function DumbellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M3 10v4M7 7v10M17 7v10M21 10v4M7 12h10" strokeLinecap="round" />
    </svg>
  );
}
function RunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <circle cx="17" cy="4" r="2" />
      <path d="M7 19l2-5 3 2-2 4M13 13l-2-4 4-3 3 2-1 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RecoveryForm({
  targetMin,
  onStart,
  onCancel,
  onSkip
}: {
  targetMin: number;
  onStart: (rec: RecoveryCheck) => void;
  onCancel: () => void;
  onSkip: () => void;
}) {
  const [sleep, setSleep] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [soreness, setSoreness] = useState(3);
  const [joints, setJoints] = useState(3);
  const [stress, setStress] = useState(3);
  const [timeAvail, setTimeAvail] = useState(targetMin);

  return (
    <div className="space-y-5">
      <p className="text-sm text-ink-300">Ein kurzer Check für heute. Das beeinflusst Volumen und ob ein Deload vorgeschlagen wird.</p>
      <Scale label="Schlaf"       value={sleep}    onChange={setSleep}    labels={['sehr schlecht', 'mäßig', 'okay', 'gut', 'top']} />
      <Scale label="Energie"      value={energy}   onChange={setEnergy}   labels={['leer', 'flach', 'okay', 'gut', 'top']} />
      <Scale label="Muskelkater"  value={soreness} onChange={setSoreness} labels={['stark', 'merklich', 'okay', 'wenig', 'keiner']} />
      <Scale label="Gelenke"      value={joints}   onChange={setJoints}   labels={['zwickt', 'etwas', 'okay', 'gut', 'top']} />
      <Scale label="Stress"       value={stress}   onChange={setStress}   labels={['hoch', 'erhöht', 'okay', 'ruhig', 'entspannt']} />

      <div>
        <div className="label mb-2">Zeit heute (Min)</div>
        <div className="grid grid-cols-5 gap-2">
          {[30, 45, 55, 70, 90].map(v => (
            <button
              key={v}
              onClick={() => setTimeAvail(v)}
              className={`py-3 rounded-xl text-sm font-medium ${timeAvail === v ? 'bg-accent-500 text-ink-900' : 'bg-white/5 text-ink-200'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button className="btn-ghost" onClick={onSkip}>Überspringen</button>
        <button className="btn-primary" onClick={() => onStart({ sleep, energy, soreness, joints, stress, timeAvailableMin: timeAvail })}>
          Starten
        </button>
      </div>
      <button className="w-full text-center text-sm text-ink-400" onClick={onCancel}>Abbrechen</button>
    </div>
  );
}

function Scale({ label, value, onChange, labels }: { label: string; value: number; onChange: (v: number) => void; labels?: string[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="label">{label}</span>
        {labels && <span className="text-xs text-ink-400">{labels[value - 1]}</span>}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            aria-label={`${label} ${v}`}
            onClick={() => onChange(v)}
            className={`py-3 rounded-xl text-sm font-semibold transition ${value === v ? 'bg-accent-500 text-ink-900' : 'bg-white/5 text-ink-200'}`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
