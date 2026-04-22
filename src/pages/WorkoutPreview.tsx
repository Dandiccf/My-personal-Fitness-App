import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { EXERCISE_MAP } from '../data/exercises';
import { PROGRAM, WORKOUT_TYPE_LABEL } from '../data/programTemplate';
import { parseISO, formatFullDate, weekdayIndex } from '../lib/dateUtils';
import {
  buildScheduledSets,
  complianceFromHistory,
  compliancePenalty,
  computeWeekContext,
  effectiveSets,
  isPrioritizedExercise
} from '../lib/volumeEngine';
import { lastPerformance } from '../lib/progression';
import { useState } from 'react';
import ExerciseIcon from '../components/ExerciseIcon';
import ExerciseGuide from '../components/ExerciseGuide';
import { musclesDe } from '../data/labels';

export default function WorkoutPreview() {
  const { iso } = useParams();
  const settings = useStore(s => s.settings)!;
  const sessions = useStore(s => s.sessions);
  const [guideId, setGuideId] = useState<string | null>(null);

  const date = useMemo(() => (iso ? parseISO(iso) : new Date()), [iso]);
  const dow = weekdayIndex(date);
  const entry = PROGRAM.schedule.find(s => s.dayOfWeek === dow);
  const workoutType = entry?.workoutType ?? 'rest';
  const template = PROGRAM.workoutTemplates[workoutType];

  const ctx = useMemo(
    () => computeWeekContext(settings.programStartDate, date, settings.blockWeeks),
    [settings.programStartDate, settings.blockWeeks, date]
  );

  const compliance = useMemo(
    () => complianceFromHistory(sessions, PROGRAM, new Date(), settings.programStartDate),
    [sessions, settings.programStartDate]
  );
  const penalty = compliancePenalty(compliance);
  const totalSets = useMemo(() => buildScheduledSets(template, ctx, penalty).length, [template, ctx, penalty]);

  const estimatedMin = Math.max(25, Math.round((totalSets * 2.6) / 5) * 5);

  if (!workoutType.startsWith('gym')) {
    return (
      <div>
        <Header title={WORKOUT_TYPE_LABEL[workoutType]} subtitle={formatFullDate(iso!)} onBack />
        <div className="px-5 py-6">
          <div className="card p-6 text-sm text-ink-300">
            Kein Krafttraining vorgesehen. {template.description ?? ''}
          </div>
        </div>
      </div>
    );
  }

  // Build per-exercise view with effective set count for this week
  const items = template.items.map(item => {
    // resolve preferred swap (user picked alternative in Library)
    const effectiveId = settings.preferredSwaps[item.exerciseId] ?? item.exerciseId;
    const ex = EXERCISE_MAP[effectiveId] ?? EXERCISE_MAP[item.exerciseId];
    const sets = effectiveSets(item, ctx, penalty);
    const last = lastPerformance(effectiveId, sessions);
    const lastBest = last?.perf.sets
      .filter(s => s.completed && s.actualWeight != null)
      .reduce((m, s) => Math.max(m, s.actualWeight ?? 0), 0) ?? 0;
    return {
      item, ex, sets, lastBest,
      swapped: effectiveId !== item.exerciseId,
      originalName: EXERCISE_MAP[item.exerciseId]?.name,
      prioritized: isPrioritizedExercise(item.exerciseId)
    };
  });

  return (
    <div>
      <Header title={WORKOUT_TYPE_LABEL[workoutType]} subtitle={formatFullDate(iso!)} onBack />
      <div className="px-5 py-4 space-y-4">
        {/* Summary card */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="label">Phase</div>
              <div className="text-lg font-semibold text-ink-100 mt-0.5">{ctx.phaseLabel}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              {ctx.isDeload && <span className="chip-warn">Deload</span>}
              <span className="chip">Woche {ctx.weekInBlock}/{settings.blockWeeks}</span>
            </div>
          </div>
          <p className="text-sm text-ink-300 mb-4">{ctx.description}</p>
          <div className="grid grid-cols-3 gap-3">
            <Stat value={String(items.filter(i => i.item.priority !== 'optional').length)} label="Übungen" />
            <Stat value={String(totalSets)} label="Sätze" />
            <Stat value={`~${estimatedMin}m`} label="Dauer" />
          </div>
        </div>

        {/* Exercises */}
        {items.filter(i => i.sets > 0).map((it, idx) => (
          <button
            key={idx}
            onClick={() => it.ex && setGuideId(it.ex.id)}
            className="card p-4 text-left w-full hover:bg-ink-700/40 transition active:scale-[0.99]"
          >
            <div className="flex items-start gap-3 mb-2">
              {it.ex && (
                <div className="w-11 h-11 rounded-xl bg-accent-500/10 text-accent-400 grid place-items-center flex-shrink-0 relative">
                  <ExerciseIcon pattern={it.ex.movementPattern} className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-500 text-ink-900 text-[9px] font-bold grid place-items-center">?</span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="label">
                    {it.item.priority === 'main' ? 'Hauptübung' : it.item.priority === 'accessory' ? 'Nebenübung' : 'Optional'}
                  </span>
                  {it.prioritized && (ctx.weekInBlock === 5 || ctx.weekInBlock === 6 || ctx.weekInBlock === 11) && (
                    <span className="chip-accent">priorisiert</span>
                  )}
                  {it.swapped && <span className="chip-accent">Variante gewählt</span>}
                </div>
                <div className="font-semibold text-ink-100 text-base">{it.ex?.name ?? it.item.exerciseId}</div>
                {it.swapped && it.originalName && (
                  <div className="text-[11px] text-ink-400 mt-0.5">statt „{it.originalName}"</div>
                )}
                {it.ex && (
                  <div className="text-xs text-ink-400 mt-1">{musclesDe(it.ex.primaryMuscles)}</div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-semibold text-ink-100 tabular-nums">{it.sets}</div>
                <div className="text-[10px] uppercase tracking-wider text-ink-400">Sätze</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <span className="chip">{it.item.repMin}–{it.item.repMax} Wdh</span>
              <span className="chip">{it.item.restSec}s Pause</span>
              {it.lastBest > 0 && <span className="chip">Letzt: {it.lastBest} kg</span>}
            </div>
          </button>
        ))}

        <p className="text-[11px] text-ink-500 text-center pt-2">
          Tap auf eine Übung → Ausführung mit Bildern ansehen. Am Trainingstag gibt es vor dem Start noch einen Tagesform-Check, der das Volumen ggf. anpasst.
        </p>
      </div>

      <ExerciseGuide open={guideId !== null} onClose={() => setGuideId(null)} exerciseId={guideId ?? ''} />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-2.5">
      <div className="text-lg font-semibold text-ink-100 tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-400 mt-0.5">{label}</div>
    </div>
  );
}
