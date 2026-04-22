import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomSheet from '../components/BottomSheet';
import NumberStepper from '../components/NumberStepper';
import RestTimer from '../components/RestTimer';
import ExerciseIcon from '../components/ExerciseIcon';
import ExerciseGuide from '../components/ExerciseGuide';
import { musclesDe } from '../data/labels';
import { useStore } from '../store/useStore';
import { EXERCISE_MAP, EXERCISES } from '../data/exercises';
import { lastPerformance, suggestForNextSession } from '../lib/progression';
import { formatDuration } from '../lib/dateUtils';
import { WORKOUT_TYPE_LABEL } from '../data/programTemplate';

export default function ActiveSession() {
  const session = useStore(s => s.activeSession);
  const sessions = useStore(s => s.sessions);
  const activeIdx = useStore(s => s.activeExerciseIndex);
  const setActiveIdx = useStore(s => s.setActiveExerciseIndex);
  const updateSet = useStore(s => s.updateSet);
  const completeSet = useStore(s => s.completeSet);
  const addExtraSet = useStore(s => s.addExtraSet);
  const toggleSkipExercise = useStore(s => s.toggleSkipExercise);
  const swapExercise = useStore(s => s.swapExercise);
  const finishSession = useStore(s => s.finishSession);
  const cancelSession = useStore(s => s.cancelSession);
  const updateActiveSession = useStore(s => s.updateActiveSession);
  const nav = useNavigate();

  const [restSec, setRestSec] = useState<number | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const h = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(h);
  }, []);

  useEffect(() => {
    if (!session) nav('/', { replace: true });
  }, [session, nav]);

  const tabsRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = tabsRef.current?.querySelector<HTMLElement>(`[data-tab-idx="${activeIdx}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeIdx]);

  if (!session) return null;

  const visibleExercises = session.exercises.filter(e => !e.removedByQuickMode);
  const currentIdx = Math.min(activeIdx, visibleExercises.length - 1);
  const currentVisible = visibleExercises[currentIdx];
  const realIdx = session.exercises.indexOf(currentVisible);

  const totalSets = visibleExercises.reduce((sum, e) => sum + (e.skipped ? 0 : e.sets.length), 0);
  const doneSets = visibleExercises.reduce(
    (sum, e) => sum + (e.skipped ? 0 : e.sets.filter(s => s.completed).length),
    0
  );
  const progressPct = totalSets === 0 ? 0 : Math.round((doneSets / totalSets) * 100);
  const elapsedSec = Math.floor((now - session.startedAt) / 1000);

  const exMeta = EXERCISE_MAP[currentVisible.exerciseId];
  const otherSessions = sessions.filter(s => s.id !== session.id);
  const last = lastPerformance(currentVisible.exerciseId, otherSessions);
  const suggestion = useMemo(
    () => suggestForNextSession(
      currentVisible.exerciseId,
      currentVisible.repMin,
      currentVisible.repMax,
      otherSessions,
      undefined,
      exMeta?.isIsolation
    ),
    [currentVisible.exerciseId, currentVisible.repMin, currentVisible.repMax, otherSessions, exMeta?.isIsolation]
  );
  const firstAltName = exMeta?.alternativeIds[0] ? EXERCISE_MAP[exMeta.alternativeIds[0]]?.name : undefined;

  const onComplete = (setIdx: number, rest: number) => {
    completeSet(realIdx, setIdx, rest);
    setRestSec(rest);
  };

  const goPrev = () => setActiveIdx(Math.max(0, currentIdx - 1));
  const goNext = () => setActiveIdx(Math.min(visibleExercises.length - 1, currentIdx + 1));

  const alternatives = useMemo(() => {
    const ids = new Set<string>();
    const meta = EXERCISE_MAP[currentVisible.exerciseId];
    meta?.alternativeIds.forEach(id => ids.add(id));
    // Also include other exercises sharing the movement pattern
    EXERCISES.filter(e => e.movementPattern === meta?.movementPattern && e.id !== currentVisible.exerciseId)
      .forEach(e => ids.add(e.id));
    return Array.from(ids).map(id => EXERCISE_MAP[id]).filter(Boolean);
  }, [currentVisible.exerciseId]);

  return (
    <div className="min-h-screen pb-44">
      <Header
        title={WORKOUT_TYPE_LABEL[session.workoutType]}
        subtitle={`${formatDuration(elapsedSec)} · ${doneSets}/${totalSets} Sätze${totalSets > doneSets ? ` · ~${Math.max(0, Math.round(((totalSets - doneSets) * 150) / 60))}m übrig` : ''}`}
        onBack={() => setFinishOpen(true)}
        right={
          <button
            onClick={() => setFinishOpen(true)}
            className="text-sm font-semibold text-accent-400 px-3 py-2 rounded-lg hover:bg-white/5"
          >
            Beenden
          </button>
        }
      />

      {/* Simulation-Banner */}
      {session.isSimulation && (
        <div className="mx-5 mt-2 rounded-xl border border-warn-500/40 bg-warn-500/10 px-4 py-2.5 text-xs text-warn-500 flex items-center gap-2">
          <span className="font-semibold">Probe-Training.</span>
          <span>Nichts wird gespeichert — gefahrlos ausprobieren.</span>
        </div>
      )}

      {/* progress */}
      <div className="px-5 pt-2 pb-3">
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-accent-500 transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* exercise tabs */}
      <div ref={tabsRef} className="px-3 pb-2 overflow-x-auto scroll-smooth">
        <div className="flex gap-2 min-w-full">
          {visibleExercises.map((ex, i) => {
            const d = ex.sets.filter(s => s.completed).length;
            const t = ex.sets.length;
            const active = i === currentIdx;
            return (
              <button
                key={i}
                data-tab-idx={i}
                onClick={() => setActiveIdx(i)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-medium border transition whitespace-nowrap ${
                  active ? 'bg-accent-500 text-ink-900 border-accent-500' :
                  ex.skipped ? 'bg-white/5 text-ink-400 border-white/5 line-through' :
                  d === t ? 'bg-accent-500/10 text-accent-400 border-accent-500/30' :
                  'bg-white/5 text-ink-200 border-white/5'
                }`}
              >
                {i + 1}. {ex.name.split(' ')[0]} · {d}/{t}
              </button>
            );
          })}
        </div>
      </div>

      {/* current exercise */}
      <div className="px-5 py-3">
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <button
                onClick={() => setGuideOpen(true)}
                aria-label="Übungs-Anleitung öffnen"
                className="w-12 h-12 rounded-xl bg-accent-500/15 text-accent-400 grid place-items-center flex-shrink-0 relative active:bg-accent-500/25"
              >
                <ExerciseIcon pattern={currentVisible.movementPattern} className="w-7 h-7" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent-500 text-ink-900 text-[11px] font-bold grid place-items-center">?</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="label mb-1">
                  {currentVisible.priority === 'main' ? 'Hauptübung' : currentVisible.priority === 'accessory' ? 'Nebenübung' : 'Optional'}
                </div>
                <button onClick={() => setGuideOpen(true)} className="text-left">
                  <h2 className="text-xl sm:text-2xl font-semibold text-ink-100 tracking-tight leading-tight">{currentVisible.name}</h2>
                </button>
                {exMeta && (
                  <p className="text-sm text-ink-400 mt-1">
                    {musclesDe(exMeta.primaryMuscles)}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSwapOpen(true)}
              className="text-xs px-3 py-2 rounded-lg bg-white/5 text-ink-200 flex-shrink-0"
            >
              Tauschen
            </button>
          </div>

          {currentVisible.notes && (
            <div className="rounded-xl bg-accent-500/10 border border-accent-500/20 text-accent-400 text-xs px-3 py-2 mb-3">
              {currentVisible.notes}
            </div>
          )}

          {suggestion.shouldSuggestVariantSwap && firstAltName && (
            <div className="rounded-xl bg-warn-500/10 border border-warn-500/30 text-warn-500 text-xs px-3 py-2 mb-3 flex items-start gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M10.3 3.86l-8.15 14a1.9 1.9 0 0 0 1.65 2.84h16.4a1.9 1.9 0 0 0 1.65-2.84l-8.15-14a1.9 1.9 0 0 0-3.4 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <div className="font-semibold">Stagnation erkannt</div>
                <div>Seit mehreren Sessions keine Steigerung. Vorschlag: <button onClick={() => setSwapOpen(true)} className="underline">„{firstAltName}" probieren</button>.</div>
              </div>
            </div>
          )}

          {(() => {
            const firstSet = currentVisible.sets[0];
            const target = firstSet?.targetWeight;
            return target != null ? (
              <div className="rounded-xl bg-accent-500/15 border border-accent-500/30 px-4 py-3 mb-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-accent-400">Maschine einstellen</div>
                  <div className="text-xl font-semibold text-accent-400 tabular-nums">{target} kg</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-ink-400">Ziel-Wdh</div>
                  <div className="text-xl font-semibold text-ink-100 tabular-nums">{currentVisible.repMin}–{currentVisible.repMax}</div>
                </div>
              </div>
            ) : null;
          })()}

          {last && (
            <div className="rounded-xl bg-white/5 px-3 py-2 mb-4 flex items-center justify-between">
              <span className="text-xs text-ink-400">Letztes Training</span>
              <span className="text-xs text-ink-200">
                {last.perf.sets.filter(s => s.completed).map(s => `${s.actualWeight ?? '–'}×${s.actualReps ?? '–'}`).slice(0, 3).join(' · ')}
              </span>
            </div>
          )}

          <div className="space-y-3">
            {currentVisible.sets.map((set, i) => (
              <SetRow
                key={i}
                idx={i}
                targetMin={set.targetRepsMin}
                targetMax={set.targetRepsMax}
                weight={set.actualWeight ?? set.targetWeight}
                reps={set.actualReps ?? set.targetRepsMax}
                rir={set.rir}
                completed={set.completed}
                disabled={currentVisible.skipped}
                onWeight={v => updateSet(realIdx, i, { actualWeight: v })}
                onReps={v => updateSet(realIdx, i, { actualReps: v })}
                onRir={v => updateSet(realIdx, i, { rir: v })}
                onComplete={() => onComplete(i, currentVisible.restSec)}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button className="btn-ghost text-sm py-3 whitespace-nowrap" onClick={() => addExtraSet(realIdx)}>+ Satz</button>
            <button className="btn-ghost text-sm py-3 whitespace-nowrap" onClick={() => toggleSkipExercise(realIdx)}>
              {currentVisible.skipped ? 'Aktivieren' : 'Skip'}
            </button>
            <button className="btn-ghost text-sm py-3 whitespace-nowrap" onClick={() => setNotesOpen(true)}>Notiz</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button disabled={currentIdx === 0} onClick={goPrev} className="btn-ghost disabled:opacity-40">← Zurück</button>
          <button disabled={currentIdx >= visibleExercises.length - 1} onClick={goNext} className="btn-ghost disabled:opacity-40">Weiter →</button>
        </div>
      </div>

      {restSec != null && (
        <RestTimer initialSec={restSec} onDismiss={() => setRestSec(null)} />
      )}

      <ExerciseGuide open={guideOpen} onClose={() => setGuideOpen(false)} exerciseId={currentVisible.exerciseId} />

      <BottomSheet open={swapOpen} onClose={() => setSwapOpen(false)} title="Übung tauschen">
        <div className="space-y-2">
          {alternatives.length === 0 && <p className="text-sm text-ink-400">Keine Alternativen gefunden.</p>}
          {alternatives.map(alt => (
            <button
              key={alt.id}
              onClick={() => { swapExercise(realIdx, alt.id); setSwapOpen(false); }}
              className="w-full flex items-center justify-between rounded-xl bg-white/5 hover:bg-white/10 px-4 py-3 text-left"
            >
              <div>
                <div className="font-medium text-ink-100">{alt.name}</div>
                <div className="text-xs text-ink-400">
                  {musclesDe(alt.primaryMuscles)} · {alt.repRangeMin}–{alt.repRangeMax} Wdh
                </div>
              </div>
              <span className="text-accent-400 text-sm">Wählen</span>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={notesOpen} onClose={() => setNotesOpen(false)} title="Notiz">
        <textarea
          className="input min-h-[120px]"
          defaultValue={currentVisible.notes ?? ''}
          onBlur={e => updateActiveSession(s => ({
            ...s,
            exercises: s.exercises.map((ex, i) => i === realIdx ? { ...ex, notes: e.target.value } : ex)
          }))}
          placeholder="z. B. Technik-Check, Sitzhöhe, Griffbreite ..."
        />
        <button className="btn-primary w-full mt-4" onClick={() => setNotesOpen(false)}>Speichern</button>
      </BottomSheet>

      <BottomSheet open={finishOpen} onClose={() => setFinishOpen(false)} title="Session beenden">
        <div className="space-y-4">
          <p className="text-sm text-ink-300">Möchtest du dieses Training abschließen?</p>
          <div>
            <div className="label mb-2">Tagesform rückblickend</div>
            <div className="grid grid-cols-5 gap-2">
              {[1,2,3,4,5].map(v => (
                <button
                  key={v}
                  onClick={() => updateActiveSession(s => ({ ...s, perceivedEnergy: v }))}
                  className={`py-3 rounded-xl text-sm font-semibold ${session.perceivedEnergy === v ? 'bg-accent-500 text-ink-900' : 'bg-white/5 text-ink-200'}`}
                >{v}</button>
              ))}
            </div>
          </div>
          <textarea
            className="input min-h-[90px]"
            placeholder="Notizen zum Training"
            defaultValue={session.notes ?? ''}
            onBlur={e => updateActiveSession(s => ({ ...s, notes: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <button
              className="btn-danger"
              onClick={() => {
                setFinishOpen(false);
                nav('/', { replace: true });
                cancelSession().catch((e) => console.error('cancelSession', e));
              }}
            >Verwerfen</button>
            <button
              className="btn-primary"
              onClick={() => {
                setFinishOpen(false);
                nav('/', { replace: true });
                finishSession().catch((e) => console.error('finishSession', e));
              }}
            >Abschließen</button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

function SetRow({
  idx, targetMin, targetMax, weight, reps, rir, completed, disabled, onWeight, onReps, onRir, onComplete
}: {
  idx: number;
  targetMin: number; targetMax: number;
  weight: number | null; reps: number | null; rir: number | null;
  completed: boolean; disabled: boolean;
  onWeight: (v: number) => void;
  onReps: (v: number) => void;
  onRir: (v: number) => void;
  onComplete: () => void;
}) {
  return (
    <div className={`rounded-2xl p-3 border ${completed ? 'bg-accent-500/5 border-accent-500/20' : 'bg-ink-700/40 border-white/5'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="label">Satz {idx + 1}</span>
        <span className="text-xs text-ink-400">{targetMin}–{targetMax} Wdh</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] uppercase text-ink-400 mb-1">Gewicht (kg)</div>
          <NumberStepper
            value={weight ?? null}
            onChange={onWeight}
            step={2.5}
            ariaLabel={`Gewicht Satz ${idx + 1}`}
          />
        </div>
        <div>
          <div className="text-[10px] uppercase text-ink-400 mb-1">Wdh</div>
          <NumberStepper
            value={reps ?? null}
            onChange={onReps}
            step={1}
            ariaLabel={`Wiederholungen Satz ${idx + 1}`}
          />
        </div>
      </div>
      <div className="mt-3 space-y-2.5">
        <div className="flex items-center gap-1.5 text-[11px] text-ink-400">
          <span className="mr-1">RIR</span>
          {[0,1,2,3].map(v => (
            <button
              key={v}
              onClick={() => onRir(v)}
              className={`w-8 h-8 rounded-full text-xs font-semibold ${rir === v ? 'bg-accent-500 text-ink-900' : 'bg-white/5 text-ink-200'}`}
            >{v}</button>
          ))}
        </div>
        <button
          disabled={disabled}
          onClick={onComplete}
          className={`w-full py-3 rounded-xl text-sm font-semibold whitespace-nowrap ${completed ? 'bg-accent-500/20 text-accent-400' : 'bg-accent-500 text-ink-900'} disabled:opacity-40`}
        >
          {completed ? '✓ Abgeschlossen' : 'Satz abgeschlossen'}
        </button>
      </div>
    </div>
  );
}
