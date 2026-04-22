import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PROGRAM, WORKOUT_TYPE_LABEL } from '../data/programTemplate';
import { EXERCISE_MAP } from '../data/exercises';
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
  const skipToday = useStore(s => s.skipToday);
  const deleteSession = useStore(s => s.deleteSession);
  const nav = useNavigate();

  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [pendingType, setPendingType] = useState<WorkoutType | null>(null);
  const [quickMode, setQuickMode] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideType, setOverrideType] = useState<WorkoutType | null>(null);

  const today = new Date();
  const ctx = useMemo(
    () => computeWeekContext(settings!.programStartDate, today, settings!.blockWeeks),
    [settings?.programStartDate, settings?.blockWeeks]
  );
  const compliance = useMemo(
    () => complianceFromHistory(sessions, PROGRAM, today, settings?.programStartDate),
    [sessions, settings?.programStartDate]
  );
  const penalty = compliancePenalty(compliance);

  const dow = weekdayIndex(today);
  const scheduled = PROGRAM.schedule.find(d => d.dayOfWeek === dow)!;
  const scheduledType = scheduled.workoutType;
  const workoutType: WorkoutType = overrideType ?? scheduledType;
  const isOverridden = overrideType != null && overrideType !== scheduledType;
  const template = PROGRAM.workoutTemplates[workoutType];
  const scheduledSets = useMemo(() => buildScheduledSets(template, ctx, penalty), [template, ctx, penalty]);
  const estimatedMin = estimateDurationMin(scheduledSets.length);

  // Quick Mode Preview — welche Übungen fallen weg
  const quickModeCuts = useMemo(() => {
    if (!quickMode || !workoutType.startsWith('gym')) return [] as string[];
    const items = template.items;
    // analog zum Store: bis zu 3 entfernen, beginnend mit optional, dann accessory vom Ende
    const cuts: string[] = [];
    const optionals = items.filter(i => i.priority === 'optional');
    const accessories = items.filter(i => i.priority === 'accessory');
    for (const i of optionals.slice().reverse()) { if (cuts.length < 3) cuts.push(i.exerciseId); }
    for (const i of accessories.slice().reverse()) { if (cuts.length < 3) cuts.push(i.exerciseId); }
    return cuts.slice(0, 3).map(id => EXERCISE_MAP[id]?.name ?? id);
  }, [quickMode, workoutType, template]);

  // Block-Wechsel: Hinweis in W1 eines neuen Blocks und W8 (Start Block-2-Aufbau)
  const showBlockVariationHint = (ctx.blockIndex > 0 && ctx.weekInBlock === 1) || ctx.weekInBlock === 8;

  const isGym = workoutType === 'gym_a' || workoutType === 'gym_b' || workoutType === 'gym_c';
  const isCardio = workoutType === 'run_easy' || workoutType === 'run_long' || workoutType === 'mtb';
  const isRestDay = workoutType === 'rest' || workoutType === 'mobility';

  const todayIso = todayISO();
  const todaysSkipped = sessions.find(s => s.date === todayIso && s.skipped);

  const onSkip = async () => {
    const label = WORKOUT_TYPE_LABEL[workoutType];
    if (!confirm(`„${label}" heute wirklich überspringen?`)) return;
    await skipToday(workoutType);
  };

  const onUndoSkip = async () => {
    if (!todaysSkipped) return;
    if (!confirm('Skip rückgängig machen?')) return;
    await deleteSession(todaysSkipped.id);
  };

  const lastSession = sessions.filter(s => s.completed && !s.skipped).slice(-1)[0];
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

        {/* Hinweis-Banner */}
        {ctx.isDeload && (
          <div className="rounded-2xl border border-warn-500/30 bg-warn-500/5 px-4 py-3 flex items-start gap-3">
            <span className="text-warn-500 text-xl leading-none">↓</span>
            <div className="text-sm text-warn-500/90">
              <span className="font-semibold">Deload-Woche.</span> Weniger Sätze, ~5–10 % leichteres Gewicht. Ziel ist Erholung, nicht PR.
            </div>
          </div>
        )}
        {!ctx.isDeload && penalty > 0 && (
          <div className="rounded-2xl border border-danger-500/30 bg-danger-500/5 px-4 py-3 flex items-start gap-3">
            <span className="text-danger-500 text-xl leading-none">!</span>
            <div className="text-sm text-danger-500/90">
              <span className="font-semibold">Heute reduziert trainieren.</span> Volumen gebremst wegen geringer Compliance. Regelmäßig trainieren, dann zieht die App wieder an.
            </div>
          </div>
        )}
        {showBlockVariationHint && (
          <div className="rounded-2xl border border-accent-500/30 bg-accent-500/5 px-4 py-3 flex items-start gap-3">
            <span className="text-accent-400 text-xl leading-none">◆</span>
            <div className="text-sm text-accent-400 flex-1">
              <span className="font-semibold">Neuer Block-Abschnitt.</span> Guter Moment für kontrollierte Übungsvariation.{' '}
              <Link to="/library" className="underline">Alternativen in der Bibliothek →</Link>
            </div>
          </div>
        )}

        {/* Main today card */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0">
              <div className="label mb-1 flex items-center gap-2">
                Heutiges Training
                {isOverridden && <span className="chip-accent">geändert</span>}
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-ink-100">
                {WORKOUT_TYPE_LABEL[workoutType]}
              </h2>
              {template.description && <p className="text-sm text-ink-300 mt-1">{template.description}</p>}
              {isOverridden && (
                <button className="text-[11px] text-ink-400 mt-1 underline" onClick={() => setOverrideType(null)}>
                  Zurück auf Plan ({WORKOUT_TYPE_LABEL[scheduledType]})
                </button>
              )}
            </div>
            <div className="w-10 h-10 rounded-full grid place-items-center bg-accent-500/15 text-accent-400">
              {isGym ? <DumbellIcon /> : isCardio ? <RunIcon /> : <MoonIcon />}
            </div>
          </div>

          {todaysSkipped ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-warn-500/10 border border-warn-500/30 px-4 py-3 text-sm text-warn-500">
                Heute als übersprungen markiert.
              </div>
              <button className="btn-ghost w-full" onClick={onUndoSkip}>Skip rückgängig machen</button>
            </div>
          ) : (
            <>
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
                        <span>Quick Mode (Nebenübung streichen)</span>
                        <Toggle checked={quickMode} onChange={setQuickMode} />
                      </label>
                      {quickMode && quickModeCuts.length > 0 && (
                        <div className="rounded-xl bg-white/5 px-3 py-2 text-[11px] text-ink-300">
                          <div className="text-ink-400 uppercase tracking-wider text-[10px] mb-1">Quick Mode streicht</div>
                          {quickModeCuts.join(' · ')}
                        </div>
                      )}
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

              {isRestDay && (
                <div className="space-y-3">
                  <p className="text-sm text-ink-300">Erholung ist Teil des Plans. Beweglichkeit, Spaziergang, Familie.</p>
                  <Link to="/cardio/new" className="btn-ghost w-full">Locker bewegt? Trotzdem loggen</Link>
                </div>
              )}

              {!activeSession && (
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-white/5">
                  <button
                    className="flex-1 text-sm text-ink-400 hover:text-ink-200 py-2"
                    onClick={() => setOverrideOpen(true)}
                  >
                    Anders trainieren
                  </button>
                  {!isRestDay && (
                    <>
                      <span className="text-ink-600">·</span>
                      <button
                        className="flex-1 text-sm text-ink-400 hover:text-ink-200 py-2"
                        onClick={onSkip}
                      >
                        Heute überspringen
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
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

      <BottomSheet open={overrideOpen} onClose={() => setOverrideOpen(false)} title="Was möchtest du heute machen?">
        <p className="text-sm text-ink-300 mb-3">Geplant war: <span className="text-ink-100">{WORKOUT_TYPE_LABEL[scheduledType]}</span>. Du kannst heute etwas anderes trainieren — dein Block-Plan bleibt dabei erhalten.</p>
        <div className="grid grid-cols-1 gap-2">
          {(['gym_a','gym_b','gym_c','run_easy','run_long','mtb','mobility','rest'] as WorkoutType[]).map(t => (
            <button
              key={t}
              onClick={() => { setOverrideType(t); setOverrideOpen(false); }}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-left border transition ${
                (overrideType ?? scheduledType) === t
                  ? 'bg-accent-500/15 border-accent-500/30 text-accent-400'
                  : 'bg-white/5 border-white/5 text-ink-200 hover:bg-white/10'
              }`}
            >
              <span className="font-medium">{WORKOUT_TYPE_LABEL[t]}</span>
              {t === scheduledType && <span className="chip">geplant</span>}
            </button>
          ))}
        </div>
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
