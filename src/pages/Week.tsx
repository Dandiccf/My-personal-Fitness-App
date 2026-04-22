import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { PROGRAM, WEEKDAY_LONG_DE, WORKOUT_TYPE_LABEL } from '../data/programTemplate';
import { addDays, parseISO, startOfWeek, toISODate } from '../lib/dateUtils';
import { buildScheduledSets, computeWeekContext, complianceFromHistory, compliancePenalty, effectiveSets } from '../lib/volumeEngine';
import { EXERCISE_MAP } from '../data/exercises';
import { MUSCLE_LABEL_DE } from '../data/labels';
import type { MuscleGroup } from '../types';

export default function Week() {
  const settings = useStore(s => s.settings)!;
  const sessions = useStore(s => s.sessions);
  const [offset, setOffset] = useState(0); // 0 = current week

  const today = new Date();
  const todayISOStr = toISODate(today);
  const currentStart = startOfWeek(today);
  const viewedStart = useMemo(() => addDays(currentStart, offset * 7), [currentStart, offset]);

  const compliance = useMemo(
    () => complianceFromHistory(sessions, PROGRAM, today, settings.programStartDate),
    [sessions, settings.programStartDate]
  );
  const penalty = compliancePenalty(compliance);

  const ctx = useMemo(
    () => computeWeekContext(settings.programStartDate, viewedStart, settings.blockWeeks),
    [settings.programStartDate, settings.blockWeeks, viewedStart]
  );

  const todayCtx = useMemo(
    () => computeWeekContext(settings.programStartDate, today, settings.blockWeeks),
    [settings.programStartDate, settings.blockWeeks]
  );

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(viewedStart, i);
    const iso = toISODate(d);
    const entry = PROGRAM.schedule.find(s => s.dayOfWeek === i)!;
    const session = sessions.find(s => s.date === iso);
    const completed = !!(session?.completed);
    const skipped = !!(session?.skipped);
    const tpl = PROGRAM.workoutTemplates[entry.workoutType];
    const projectedSets = (entry.workoutType.startsWith('gym') && offset >= 0)
      ? buildScheduledSets(tpl, ctx, penalty).length
      : 0;
    return {
      i, iso, sessionId: session?.id,
      workoutType: entry.workoutType,
      completed, skipped,
      isToday: todayISOStr === iso,
      isPast: iso < todayISOStr,
      projectedSets
    };
  }), [viewedStart, sessions, offset, ctx, penalty, todayISOStr]);

  // Block overview — compute phase for each week of the current block
  const blockWeeks = settings.blockWeeks;
  const programStart = parseISO(settings.programStartDate);
  const blockFirstMonday = addDays(startOfWeek(programStart), ctx.blockIndex * blockWeeks * 7);

  const blockOverview = useMemo(
    () => Array.from({ length: blockWeeks }, (_, i) => {
      const weekMonday = addDays(blockFirstMonday, i * 7);
      const wctx = computeWeekContext(settings.programStartDate, weekMonday, blockWeeks);
      return { week: i + 1, ctx: wctx };
    }),
    [settings.programStartDate, blockWeeks, blockFirstMonday]
  );

  // Sätze pro Muskelgruppe für die angezeigte Woche (geplant + erledigt)
  const musclesPerWeek = useMemo(() => {
    const planned = new Map<MuscleGroup, number>();
    const done = new Map<MuscleGroup, number>();
    const addTo = (map: Map<MuscleGroup, number>, m: MuscleGroup, n: number) =>
      map.set(m, (map.get(m) ?? 0) + n);

    for (const d of days) {
      if (!d.workoutType.startsWith('gym')) continue;

      // Geplant — Template + effectiveSets
      const template = PROGRAM.workoutTemplates[d.workoutType];
      for (const item of template.items) {
        const effectiveId = settings.preferredSwaps[item.exerciseId] ?? item.exerciseId;
        const ex = EXERCISE_MAP[effectiveId] ?? EXERCISE_MAP[item.exerciseId];
        if (!ex) continue;
        const n = effectiveSets(item, ctx, penalty);
        if (n <= 0) continue;
        ex.primaryMuscles.forEach(m => addTo(planned, m, n));
        ex.secondaryMuscles.forEach(m => addTo(planned, m, n * 0.5));
      }

      // Erledigt — Session des Tages
      const session = sessions.find(s => s.date === d.iso && s.completed && !s.skipped);
      if (session) {
        for (const e of session.exercises) {
          const ex = EXERCISE_MAP[e.exerciseId];
          if (!ex) continue;
          const completedSets = e.sets.filter(st => st.completed).length;
          if (completedSets === 0) continue;
          ex.primaryMuscles.forEach(m => addTo(done, m, completedSets));
          ex.secondaryMuscles.forEach(m => addTo(done, m, completedSets * 0.5));
        }
      }
    }

    const allMuscles = new Set<MuscleGroup>([...planned.keys(), ...done.keys()]);
    return Array.from(allMuscles)
      .map(muscle => ({
        muscle,
        planned: Math.round((planned.get(muscle) ?? 0) * 10) / 10,
        done: Math.round((done.get(muscle) ?? 0) * 10) / 10
      }))
      .sort((a, b) => b.planned - a.planned || b.done - a.done);
  }, [days, sessions, settings.preferredSwaps, ctx, penalty]);

  const jumpToBlockWeek = (targetWeek: number) => {
    setOffset(targetWeek - todayCtx.weekInBlock);
  };

  const weekLabel = offset === 0 ? 'Diese Woche'
    : offset === -1 ? 'Letzte Woche'
    : offset === 1 ? 'Nächste Woche'
    : offset < 0 ? `Vor ${-offset} Wochen`
    : `In ${offset} Wochen`;

  const dateRange = `${toISODate(viewedStart).slice(5).replace('-', '.')} – ${toISODate(addDays(viewedStart, 6)).slice(5).replace('-', '.')}`;

  return (
    <div>
      <Header
        title="Wochenplan"
        subtitle={`Block ${ctx.blockIndex + 1} · Woche ${ctx.weekInBlock}/${blockWeeks} · ${ctx.phaseLabel}`}
      />
      <div className="px-5 py-4 space-y-3">

        {/* Week navigator */}
        <div className="card p-3 flex items-center gap-2">
          <button
            aria-label="Vorherige Woche"
            onClick={() => setOffset(o => o - 1)}
            className="w-10 h-10 rounded-xl bg-white/5 active:bg-white/10 grid place-items-center text-ink-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <div className="text-sm font-semibold text-ink-100">{weekLabel}</div>
            <div className="text-xs text-ink-400">{dateRange}</div>
          </div>
          <button
            aria-label="Nächste Woche"
            onClick={() => setOffset(o => o + 1)}
            className="w-10 h-10 rounded-xl bg-white/5 active:bg-white/10 grid place-items-center text-ink-100"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {offset !== 0 && (
            <button
              onClick={() => setOffset(0)}
              className="text-xs px-3 py-2 rounded-lg bg-accent-500/15 text-accent-400"
            >Heute</button>
          )}
        </div>

        {ctx.isDeload && (
          <div className="card p-4 border-warn-500/30 bg-warn-500/5">
            <div className="flex items-center gap-3">
              <span className="chip-warn">Deload</span>
              <p className="text-sm text-ink-200">{ctx.description}</p>
            </div>
          </div>
        )}

        {/* Days */}
        {days.map(d => <DayRow key={d.iso} {...d} />)}

        {/* Sätze pro Muskelgruppe für die angezeigte Woche */}
        {musclesPerWeek.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="label">Sätze pro Muskelgruppe</div>
              <span className="text-[11px] text-ink-400">erledigt · geplant</span>
            </div>
            <div className="space-y-2.5">
              {musclesPerWeek.map(({ muscle, planned, done }) => {
                const max = Math.max(1, ...musclesPerWeek.map(x => Math.max(x.planned, x.done)));
                const donePct = Math.min(100, (done / max) * 100);
                const planPct = Math.min(100, (planned / max) * 100);
                const met = planned > 0 && done >= planned;
                const overshoot = done > planned;
                return (
                  <div key={muscle} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-ink-200 flex-shrink-0 truncate">{MUSCLE_LABEL_DE[muscle] ?? muscle}</div>
                    <div className="flex-1 relative h-2.5 rounded-full bg-white/5 overflow-hidden">
                      {/* geplant als heller Balken */}
                      <div className="absolute inset-y-0 left-0 bg-white/10" style={{ width: `${planPct}%` }} />
                      {/* erledigt überlagert */}
                      <div
                        className={`absolute inset-y-0 left-0 ${overshoot ? 'bg-accent-400' : met ? 'bg-accent-500' : 'bg-accent-500/70'}`}
                        style={{ width: `${donePct}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-[11px] tabular-nums">
                      <span className={done >= planned && planned > 0 ? 'text-accent-400 font-semibold' : 'text-ink-200'}>{done}</span>
                      <span className="text-ink-500"> / {planned}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-ink-500 mt-3">
              Sekundärmuskeln mit halber Gewichtung. Richtwert für sinnvolles Wachstum: ~10–18 gewichtete Sätze pro Muskelgruppe pro Woche.
            </p>
          </div>
        )}

        {/* Block overview */}
        <div className="card p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="label">Block {ctx.blockIndex + 1} – Phasenübersicht</div>
            <span className="text-xs text-ink-400">{blockWeeks} Wochen</span>
          </div>
          <div className="space-y-1">
            {blockOverview.map(w => {
              const isViewed = w.week === ctx.weekInBlock;
              const isCurrentRealWeek = w.week === todayCtx.weekInBlock;
              return (
                <button
                  key={w.week}
                  onClick={() => jumpToBlockWeek(w.week)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                    isViewed
                      ? 'bg-accent-500/15 border border-accent-500/30 text-accent-400'
                      : 'bg-white/5 hover:bg-white/10 text-ink-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="tabular-nums text-xs text-ink-400 w-7 flex-shrink-0">W{w.week}</span>
                    <span className="font-medium truncate">{w.ctx.phaseLabel}</span>
                    {isCurrentRealWeek && <span className="chip-accent flex-shrink-0">aktuell</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {w.ctx.isDeload && <span className="chip-warn">Deload</span>}
                    <span className="text-xs text-ink-400 tabular-nums">
                      {Math.round(w.ctx.volumeMultiplier * 100)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-ink-500 mt-3">
            Tippe eine Woche an, um den Plan dort anzuzeigen.
          </p>
        </div>
      </div>
    </div>
  );
}

interface DayRowProps {
  i: number;
  iso: string;
  sessionId?: string;
  workoutType: string;
  completed: boolean;
  skipped: boolean;
  isToday: boolean;
  isPast: boolean;
  projectedSets: number;
}

function DayRow(d: DayRowProps) {
  const tpl = PROGRAM.workoutTemplates[d.workoutType];
  const isGym = d.workoutType.startsWith('gym');
  const isCardio = d.workoutType.startsWith('run') || d.workoutType === 'mtb';
  const isRest = d.workoutType === 'rest' || d.workoutType === 'mobility';

  // Destination — this is what makes the whole card clickable
  let href: string | null = null;
  if (d.sessionId && (d.completed || d.skipped)) {
    href = `/history/${d.sessionId}`;
  } else if (d.isToday && isGym) {
    href = '/';
  } else if (d.isToday && isCardio) {
    href = '/cardio/new';
  } else if (isCardio && !d.isPast) {
    href = '/cardio/new';
  } else if (isGym) {
    // future or past-not-completed gym day → open preview
    href = `/preview/${d.iso}`;
  }

  const cardClasses = `card p-4 block ${d.isToday ? 'border-accent-500/40 ring-1 ring-accent-500/20' : ''} ${d.isPast && !d.completed && !d.skipped ? 'opacity-60' : ''} ${href ? 'hover:bg-ink-700/40 active:bg-ink-700/60 transition' : ''}`;

  const inner = (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="label">{WEEKDAY_LONG_DE[d.i]}</span>
          {d.isToday && <span className="chip-accent">heute</span>}
          {d.completed && <span className="chip-accent">erledigt</span>}
          {d.skipped && !d.completed && <span className="chip-warn">übersprungen</span>}
        </div>
        <div className="text-lg font-semibold text-ink-100 mt-0.5">{WORKOUT_TYPE_LABEL[d.workoutType]}</div>
        {tpl.description && <div className="text-xs text-ink-400 mt-0.5 truncate">{tpl.description}</div>}
        {isGym && d.projectedSets > 0 && !d.isToday && (
          <div className="text-[11px] text-ink-400 mt-1">~{d.projectedSets} Sätze geplant</div>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <div className="text-xs text-ink-400">{d.iso.slice(5).replace('-', '.')}</div>
        {href && <span className="text-accent-400 text-lg">›</span>}
      </div>
    </div>
  );

  if (href) {
    return <Link to={href} className={cardClasses}>{inner}</Link>;
  }
  return <div className={cardClasses}>{inner}</div>;
}
