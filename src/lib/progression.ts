// Double progression:
// - If all working sets hit top-of-range with good technique (RIR >= 1 or null), increase weight next time.
// - If reps drop sharply compared to last session, keep or reduce weight.
// - If multiple sessions stagnate, suggest variant swap.

import type { Session, ExercisePerformance, ProgressionState, SetPerformance } from '../types';

export interface ProgressionSuggestion {
  exerciseId: string;
  suggestedWeight: number | null;
  suggestedReps: { min: number; max: number };
  reason: string;
  shouldSuggestVariantSwap: boolean;
  lastWeight: number | null;
  lastBestReps: number | null;
}

const MIN_INCREMENT_KG = 2.5;
const ISO_INCREMENT_KG = 2.5;

export function lastPerformance(
  exerciseId: string,
  sessions: Session[]
): { session: Session; perf: ExercisePerformance } | null {
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    const p = s.exercises.find(e => e.exerciseId === exerciseId && e.sets.some(st => st.completed));
    if (p) return { session: s, perf: p };
  }
  return null;
}

export function allCompletedPerformances(exerciseId: string, sessions: Session[]): ExercisePerformance[] {
  const out: ExercisePerformance[] = [];
  for (const s of sessions) {
    const p = s.exercises.find(e => e.exerciseId === exerciseId && e.sets.some(st => st.completed));
    if (p) out.push(p);
  }
  return out;
}

export function suggestForNextSession(
  exerciseId: string,
  repMin: number,
  repMax: number,
  sessions: Session[],
  state?: ProgressionState,
  isIsolation = false
): ProgressionSuggestion {
  const last = lastPerformance(exerciseId, sessions);

  if (!last) {
    return {
      exerciseId,
      suggestedWeight: state?.workingWeight ?? null,
      suggestedReps: { min: repMin, max: repMax },
      reason: 'Erste Session – mit sauberer Technik einsteigen. RIR ~2.',
      shouldSuggestVariantSwap: false,
      lastWeight: state?.workingWeight ?? null,
      lastBestReps: null
    };
  }

  const completed = last.perf.sets.filter(s => s.completed && s.actualWeight != null && s.actualReps != null);
  if (completed.length === 0) {
    return {
      exerciseId,
      suggestedWeight: state?.workingWeight ?? null,
      suggestedReps: { min: repMin, max: repMax },
      reason: 'Letzte Session ohne Daten.',
      shouldSuggestVariantSwap: false,
      lastWeight: null,
      lastBestReps: null
    };
  }

  const lastWeight = maxBy(completed, s => s.actualWeight ?? 0)?.actualWeight ?? null;
  const bestReps = Math.max(...completed.map(s => s.actualReps ?? 0));
  const allAtTop = completed.every(s => (s.actualReps ?? 0) >= repMax && (s.rir == null || s.rir >= 1));
  const bigDrop = completed.some(s => (s.actualReps ?? 0) < repMin);

  // Check stagnation across the previous 3 logged performances.
  const recent = allCompletedPerformances(exerciseId, sessions).slice(-3);
  const stagnant = recent.length >= 3 && recent.every((p, i, arr) => {
    if (i === 0) return true;
    const prev = bestCompletedWeight(arr[i - 1]);
    const cur = bestCompletedWeight(p);
    return prev != null && cur != null && cur <= prev;
  });

  let nextWeight = lastWeight;
  let reason = 'Gewicht halten und Wiederholungen innerhalb des Bereichs steigern.';
  if (allAtTop && lastWeight != null) {
    const inc = isIsolation ? ISO_INCREMENT_KG : MIN_INCREMENT_KG;
    nextWeight = lastWeight + inc;
    reason = `Alle Sätze oben im Bereich geschafft – Gewicht +${inc} kg.`;
  } else if (bigDrop && lastWeight != null) {
    nextWeight = Math.max(0, lastWeight - MIN_INCREMENT_KG);
    reason = 'Wiederholungen unterhalb Ziel – Gewicht leicht reduzieren und Form prüfen.';
  }

  return {
    exerciseId,
    suggestedWeight: nextWeight,
    suggestedReps: { min: repMin, max: repMax },
    reason,
    shouldSuggestVariantSwap: stagnant,
    lastWeight,
    lastBestReps: bestReps
  };
}

function bestCompletedWeight(p: ExercisePerformance): number | null {
  const weights = p.sets.filter(s => s.completed && s.actualWeight != null).map(s => s.actualWeight as number);
  if (weights.length === 0) return null;
  return Math.max(...weights);
}

function maxBy<T>(arr: T[], f: (t: T) => number): T | null {
  if (arr.length === 0) return null;
  let best = arr[0];
  let bestV = f(best);
  for (let i = 1; i < arr.length; i++) {
    const v = f(arr[i]);
    if (v > bestV) { best = arr[i]; bestV = v; }
  }
  return best;
}

/** Aggregate stats for an exercise across full history. */
export function exerciseHistory(exerciseId: string, sessions: Session[]) {
  const perfs = allCompletedPerformances(exerciseId, sessions);
  const points = perfs.map((p, i) => {
    const sess = sessions.filter(s => s.exercises.includes(p))[0];
    const bestSet = p.sets
      .filter(s => s.completed && s.actualWeight != null && s.actualReps != null)
      .reduce<SetPerformance | null>((best, s) => (!best || (s.actualWeight ?? 0) > (best.actualWeight ?? 0) ? s : best), null);
    return {
      index: i,
      date: sess?.date,
      bestWeight: bestSet?.actualWeight ?? 0,
      bestReps: bestSet?.actualReps ?? 0,
      volume: p.sets.reduce((sum, s) => sum + (s.completed ? (s.actualWeight ?? 0) * (s.actualReps ?? 0) : 0), 0)
    };
  });
  const bestWeightEver = points.reduce((m, p) => Math.max(m, p.bestWeight), 0);
  return { points, bestWeightEver };
}
