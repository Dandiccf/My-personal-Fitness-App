import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useStore } from '../store/useStore';
import { EXERCISE_MAP } from '../data/exercises';
import { startOfWeek, toISODate, addDays } from '../lib/dateUtils';
import MiniSparkline from '../components/MiniSparkline';
import { estimateCardioKcal, estimateSessionKcal, hasVitals } from '../lib/calories';
import { MUSCLE_LABEL_DE } from '../data/labels';
import type { MuscleGroup } from '../types';

export default function Stats() {
  const sessions = useStore(s => s.sessions);
  const cardio = useStore(s => s.cardio);
  const profile = useStore(s => s.profile);

  const weekly = useMemo(() => {
    const now = new Date();
    const weeks: { label: string; workouts: number; minutes: number; kcal: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const ws = addDays(startOfWeek(now), -7 * i);
      const we = addDays(ws, 7);
      const gymInRange = sessions.filter(s => {
        const d = new Date(s.startedAt);
        return s.completed && !s.skipped && d >= ws && d < we;
      });
      const cardioInRange = cardio.filter(c => {
        const d = new Date(c.date);
        return d >= ws && d < we;
      });
      const minutes = Math.round(
        gymInRange.reduce((sum, s) => sum + (s.durationSec ?? 0) / 60, 0) +
        cardioInRange.reduce((sum, c) => sum + c.durationMin, 0)
      );
      const kcal =
        gymInRange.reduce((sum, s) => sum + estimateSessionKcal(s, profile), 0) +
        cardioInRange.reduce((sum, c) => sum + estimateCardioKcal(c, profile), 0);
      const workouts = gymInRange.length + cardioInRange.length;
      weeks.push({ label: `${toISODate(ws).slice(5)}`, workouts, minutes, kcal: Math.round(kcal) });
    }
    return weeks;
  }, [sessions, cardio, profile]);

  const thisWeek = weekly[weekly.length - 1];

  const exerciseStats = useMemo(() => {
    const map = new Map<string, { count: number; bestWeight: number; lastWeight: number; volumes: number[] }>();
    for (const s of sessions) {
      if (!s.completed) continue;
      for (const e of s.exercises) {
        const best = e.sets.reduce((m, st) => (st.completed ? Math.max(m, st.actualWeight ?? 0) : m), 0);
        const vol = e.sets.reduce((t, st) => t + (st.completed ? (st.actualWeight ?? 0) * (st.actualReps ?? 0) : 0), 0);
        const cur = map.get(e.exerciseId) ?? { count: 0, bestWeight: 0, lastWeight: 0, volumes: [] };
        cur.count += 1;
        cur.bestWeight = Math.max(cur.bestWeight, best);
        cur.lastWeight = best || cur.lastWeight;
        cur.volumes.push(vol);
        map.set(e.exerciseId, cur);
      }
    }
    return Array.from(map.entries()).sort((a, b) => b[1].count - a[1].count);
  }, [sessions]);

  const streak = useMemo(() => computeStreak(sessions), [sessions]);
  const totalWorkouts = sessions.filter(s => s.completed).length;

  // Sätze pro Muskelgruppe — aktuelle Woche
  const muscleSetsThisWeek = useMemo(() => {
    const now = new Date();
    const ws = addDays(startOfWeek(now), 0);
    const we = addDays(ws, 7);
    const map = new Map<MuscleGroup, number>();
    for (const s of sessions) {
      if (!s.completed || s.skipped) continue;
      const d = new Date(s.startedAt);
      if (d < ws || d >= we) continue;
      for (const e of s.exercises) {
        const ex = EXERCISE_MAP[e.exerciseId];
        if (!ex) continue;
        const completedSets = e.sets.filter(st => st.completed).length;
        if (completedSets === 0) continue;
        for (const m of ex.primaryMuscles) {
          map.set(m, (map.get(m) ?? 0) + completedSets);
        }
        for (const m of ex.secondaryMuscles) {
          // Sekundärmuskeln werden mit halbem Satz gezählt (Standard in der Literatur)
          map.set(m, (map.get(m) ?? 0) + completedSets * 0.5);
        }
      }
    }
    return Array.from(map.entries())
      .map(([muscle, sets]) => ({ muscle, sets: Math.round(sets * 10) / 10 }))
      .sort((a, b) => b.sets - a.sets);
  }, [sessions]);

  return (
    <div>
      <Header title="Statistiken" />
      <div className="px-5 py-4 space-y-4">
        {/* Weekly sum-up */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="label">Diese Woche</div>
            {!hasVitals(profile) && (
              <Link to="/settings" className="text-[11px] text-accent-400">Gewicht setzen →</Link>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="Einheiten" value={String(thisWeek.workouts)} />
            <Kpi label="Minuten" value={String(thisWeek.minutes)} />
            <Kpi label="kcal" value={`~${thisWeek.kcal}`} />
          </div>
          {!hasVitals(profile) && (
            <p className="text-[11px] text-ink-500 mt-3">
              kcal-Werte basieren auf Default 80 kg. Trag dein Gewicht in den Einstellungen ein für genauere Zahlen.
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Kpi label="Workouts" value={String(totalWorkouts)} />
          <Kpi label="Streak" value={`${streak}d`} />
          <Kpi label="Übungen" value={String(exerciseStats.length)} />
        </div>

        <div className="card p-5">
          <div className="label mb-3">Workouts pro Woche</div>
          <div className="flex items-end gap-1.5 h-28">
            {weekly.map((w, i) => {
              const max = Math.max(1, ...weekly.map(x => x.workouts));
              const h = (w.workouts / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg bg-accent-500/60" style={{ height: `${h}%`, minHeight: w.workouts ? '6px' : '2px' }} />
                  <span className="text-[10px] text-ink-400">{w.label.replace('-', '.')}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="label mb-3">Trainingsminuten pro Woche</div>
          <div className="flex items-end gap-1.5 h-20">
            {weekly.map((w, i) => {
              const max = Math.max(1, ...weekly.map(x => x.minutes));
              const h = (w.minutes / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg bg-ink-500" style={{ height: `${h}%`, minHeight: w.minutes ? '6px' : '2px' }} />
                </div>
              );
            })}
          </div>
          <div className="text-xs text-ink-400 mt-1">Ø {Math.round(weekly.reduce((s, w) => s + w.minutes, 0) / Math.max(1, weekly.length))} Min</div>
        </div>

        <div className="card p-5">
          <div className="label mb-3">Kalorien pro Woche</div>
          <div className="flex items-end gap-1.5 h-24">
            {weekly.map((w, i) => {
              const max = Math.max(1, ...weekly.map(x => x.kcal));
              const h = (w.kcal / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t-lg bg-warn-500/70" style={{ height: `${h}%`, minHeight: w.kcal ? '6px' : '2px' }} />
                  <span className="text-[10px] text-ink-500 tabular-nums">{w.kcal ? Math.round(w.kcal / 100) * 100 : ''}</span>
                </div>
              );
            })}
          </div>
          <div className="text-xs text-ink-400 mt-1">
            Ø {Math.round(weekly.reduce((s, w) => s + w.kcal, 0) / Math.max(1, weekly.length))} kcal/Woche
          </div>
        </div>

        <div>
          <div className="label mb-3 px-1">Sätze pro Muskelgruppe · diese Woche</div>
        </div>
        <div className="card p-5">
          {muscleSetsThisWeek.length === 0 ? (
            <p className="text-sm text-ink-400 text-center">Noch keine Sätze in dieser Woche.</p>
          ) : (
            <div className="space-y-2">
              {muscleSetsThisWeek.map(({ muscle, sets }) => {
                const max = muscleSetsThisWeek[0]?.sets || 1;
                return (
                  <div key={muscle} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-ink-300 flex-shrink-0">{MUSCLE_LABEL_DE[muscle] ?? muscle}</div>
                    <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-accent-500/70" style={{ width: `${(sets / max) * 100}%` }} />
                    </div>
                    <div className="w-10 text-right text-xs text-ink-200 tabular-nums">{sets}</div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-ink-500 mt-3">Sekundärmuskeln mit halber Gewichtung gezählt.</p>
        </div>

        <div>
          <div className="label mb-3 px-1">Übungen</div>
          <div className="space-y-2">
            {exerciseStats.length === 0 && <div className="card p-6 text-center text-ink-400 text-sm">Noch keine Daten.</div>}
            {exerciseStats.map(([id, s]) => {
              const ex = EXERCISE_MAP[id];
              return (
                <Link key={id} to={`/stats/${id}`} className="card p-4 flex items-center justify-between hover:bg-ink-700/40 transition">
                  <div className="min-w-0">
                    <div className="font-semibold text-ink-100 truncate">{ex?.name ?? id}</div>
                    <div className="text-xs text-ink-400 mt-0.5">{s.count}× · Best {s.bestWeight} kg · Letzt {s.lastWeight} kg</div>
                  </div>
                  <div className="w-28">
                    <MiniSparkline values={s.volumes.slice(-10)} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-2xl font-semibold text-ink-100 tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-400 mt-0.5">{label}</div>
    </div>
  );
}

function computeStreak(sessions: { completed: boolean; date: string }[]): number {
  const done = new Set(sessions.filter(s => s.completed).map(s => s.date));
  let streak = 0;
  let d = new Date();
  for (;;) {
    const iso = d.toISOString().slice(0, 10);
    if (done.has(iso)) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  return streak;
}
