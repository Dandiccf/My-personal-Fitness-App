// Volumen-/Blocksteuerung.
// Berechnet pro Woche die effektive Satzzahl pro Übung und ob Deload gilt.

import type { MuscleGroup, ProgramTemplate, WorkoutTemplate, WorkoutTemplateItem, Session, ExercisePerformance } from '../types';
import { EXERCISE_MAP } from '../data/exercises';

// Muskelgruppen, die laut Spec im Block bevorzugt aufgestockt werden
// ("Rücken und Beine dürfen solide priorisiert sein").
const PRIORITY_MUSCLES: MuscleGroup[] = ['back', 'lats', 'quads', 'hamstrings', 'glutes'];

/** Ob eine Übung zu einer priorisierten Muskelgruppe gehört. */
export function isPrioritizedExercise(exerciseId: string): boolean {
  const ex = EXERCISE_MAP[exerciseId];
  if (!ex) return false;
  return ex.primaryMuscles.some((m) => PRIORITY_MUSCLES.includes(m));
}

export interface WeekContext {
  blockIndex: number;
  weekInBlock: number; // 1..blockWeeks
  isDeload: boolean;
  phaseLabel: string;
  volumeMultiplier: number; // relative volume (1.0 = nominal baseline)
  description: string;
}

export interface ScheduledSet {
  exerciseId: string;
  priority: 'main' | 'accessory' | 'optional';
  setIndex: number;
  repMin: number;
  repMax: number;
  restSec: number;
}

const WEEK_MS = 7 * 86_400_000;

export function computeWeekContext(programStartISO: string, today: Date, blockWeeks: number): WeekContext {
  const [y, m, d] = programStartISO.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setHours(0, 0, 0, 0);
  // Anker auf Montag der Startwoche — sonst Off-by-one bei künftigen Wochen,
  // wenn programStart nicht selbst ein Montag ist.
  const startDow = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - startDow);

  const mondayOfToday = new Date(today);
  mondayOfToday.setHours(0, 0, 0, 0);
  const dow = (mondayOfToday.getDay() + 6) % 7;
  mondayOfToday.setDate(mondayOfToday.getDate() - dow);

  const diffWeeks = Math.floor((mondayOfToday.getTime() - start.getTime()) / WEEK_MS);
  const absoluteWeek = Math.max(0, diffWeeks);

  const blockIndex = Math.floor(absoluteWeek / blockWeeks);
  const weekInBlock = (absoluteWeek % blockWeeks) + 1;

  return phaseForWeek(weekInBlock, blockIndex);
}

function phaseForWeek(weekInBlock: number, blockIndex: number): WeekContext {
  // Standard 12-week block.
  // W1-2: Re-Entry, W3-4: leichte Steigerung, W5-6: weiter hoch, W7: Deload,
  // W8-10: Aufbau (mit Variation), W11: Peak, W12: Deload/Reset.
  let phaseLabel = '';
  let description = '';
  let isDeload = false;
  let mult = 1.0;

  switch (weekInBlock) {
    case 1:
    case 2:
      phaseLabel = 'Re-Entry';
      description = 'Konservativ einsteigen. Technik vor Last.';
      mult = 0.8;
      break;
    case 3:
    case 4:
      phaseLabel = 'Aufbau';
      description = 'Leichte Volumensteigerung.';
      mult = 1.0;
      break;
    case 5:
    case 6:
      phaseLabel = 'Aufbau+';
      description = 'Hauptübungen priorisieren, weiter kontrolliert steigern.';
      mult = 1.1;
      break;
    case 7:
      phaseLabel = 'Deload';
      description = 'Erholungswoche. Volumen ca. 55 %, Intensität leicht reduziert.';
      isDeload = true;
      mult = 0.55;
      break;
    case 8:
    case 9:
    case 10:
      phaseLabel = 'Aufbau Block 2';
      description = 'Sinnvolles Arbeitsvolumen, ggf. leichte Übungsvariation.';
      mult = 1.05;
      break;
    case 11:
      phaseLabel = 'Peak';
      description = 'Höchstes sinnvolles Volumen – nur wenn Erholung gut.';
      mult = 1.15;
      break;
    case 12:
      phaseLabel = 'Reset / Deload';
      description = 'Reset und Re-Plan. Nächster Block startet danach.';
      isDeload = true;
      mult = 0.5;
      break;
    default:
      phaseLabel = 'Aufbau';
      description = 'Kontrollierte Steigerung.';
      mult = 1.0;
  }

  return {
    blockIndex,
    weekInBlock,
    isDeload,
    phaseLabel,
    volumeMultiplier: mult,
    description
  };
}

export interface EffectiveSetsOptions {
  /** Übung gehört zur priorisierten Muskelgruppe (Rücken/Beine) */
  prioritized?: boolean;
  /** Nutzer ist gut erholt/compliant → W11 Peak-Bump erlauben */
  recoveryGood?: boolean;
}

/**
 * Satzanzahl pro Woche für eine Übung gemäß dem 12-Wochen-Block:
 *
 *  W1       Re-Entry           Main 2  · Accessory 1  · Optional 1
 *  W2       Re-Entry           Main 2  · Accessory max(1,base-1) · Optional 1
 *  W3-4     Aufbau             Main 3  · Accessory base · Optional 1
 *  W5-6     Aufbau+            priorisierte Hauptübungen +1 Satz (Rücken/Beine)
 *                              priorisierte Accessory +1 Satz, Rest bleibt
 *  W7       Deload ~55 %       Main 2  · Accessory 1  · Optional 0
 *  W8-10    Aufbau Block 2     Main 3  · Accessory base · Optional 1
 *  W11      Peak               nur bei guter Erholung Hauptübung +1 (priorisiert)
 *  W12      Reset              Main 2  · Accessory 1  · Optional 0
 */
export function effectiveSets(
  item: WorkoutTemplateItem,
  ctx: WeekContext,
  compliancePenalty = 0,
  options: EffectiveSetsOptions = {}
): number {
  const wk = ctx.weekInBlock;
  const prioritized = options.prioritized ?? isPrioritizedExercise(item.exerciseId);
  const recoveryGood = options.recoveryGood ?? (compliancePenalty === 0);

  let base = item.baseSets;

  if (item.priority === 'main') {
    if (wk <= 2) base = 2;
    else if (wk <= 4) base = 3;
    else if (wk <= 6) base = prioritized ? 4 : 3;
    else if (wk === 7) base = 2;
    else if (wk <= 10) base = 3;
    else if (wk === 11) base = (recoveryGood && prioritized) ? 4 : 3;
    else base = 2; // W12 Reset
  } else if (item.priority === 'accessory') {
    // Spec: priorisierter Volumen-Bump gilt nur für Hauptübungen, nicht für Nebenübung.
    if (wk <= 1) base = Math.max(1, item.baseSets - 1);
    else if (wk <= 6) base = item.baseSets;
    else if (wk === 7) base = Math.max(1, Math.floor(item.baseSets / 2));
    else if (wk <= 10) base = item.baseSets;
    else if (wk === 11) base = item.baseSets;
    else base = Math.max(1, Math.floor(item.baseSets / 2)); // W12 Reset
  } else {
    // optional
    if (wk === 7 || wk === 12) base = 0;
    else if (wk === 11) base = Math.max(2, item.baseSets);
    else base = 1;
  }

  // Compliance-Strafe: Hauptübungen bleiben bei mind. 1 Satz, Accessory/Optional dürfen auf 0 fallen.
  if (compliancePenalty > 0) {
    const floor = item.priority === 'main' ? 1 : 0;
    base = Math.max(floor, base - compliancePenalty);
  }

  // Nicht-negative Grenze
  const floor = item.priority === 'main' ? 1 : 0;
  return Math.max(floor, base);
}

/** Recovery-based scaling applied right before a session. */
export function applyRecoveryScaling(
  scheduled: ScheduledSet[],
  recoveryScore: number, // 0..1 (higher = better)
  timeAvailableMin: number,
  targetDurationMin: number
): { sets: ScheduledSet[]; note: string | null } {
  let note: string | null = null;
  let sets = [...scheduled];

  if (recoveryScore < 0.35) {
    // cut one accessory set across the board, down-weight optionals first
    sets = reduceSets(sets, 0.65);
    note = 'Erholung niedrig – Volumen reduziert.';
  } else if (recoveryScore < 0.55) {
    sets = reduceSets(sets, 0.85);
    note = 'Leicht reduziertes Volumen wegen Tagesform.';
  }

  if (timeAvailableMin > 0 && timeAvailableMin < targetDurationMin * 0.8) {
    // time pressure → remove last optional/accessory sets
    const ratio = Math.max(0.5, timeAvailableMin / targetDurationMin);
    sets = reduceSets(sets, ratio);
    note = note ? note + ' Zeit knapp, Session gekürzt.' : 'Zeit knapp, Session gekürzt.';
  }

  return { sets, note };
}

function reduceSets(sets: ScheduledSet[], ratio: number): ScheduledSet[] {
  // Remove from optional first, then accessory, never main.
  const targetCount = Math.max(1, Math.round(sets.length * ratio));
  let current = [...sets];
  const order: Array<'optional' | 'accessory' | 'main'> = ['optional', 'accessory'];

  for (const priority of order) {
    while (current.length > targetCount) {
      const idx = [...current].map((s, i) => ({ s, i })).reverse().find(x => x.s.priority === priority);
      if (!idx) break;
      current.splice(idx.i, 1);
    }
    if (current.length <= targetCount) break;
  }
  return current;
}

/** Build the list of scheduled sets for a workout this week. */
export function buildScheduledSets(
  template: WorkoutTemplate,
  ctx: WeekContext,
  compliancePenalty: number
): ScheduledSet[] {
  const sets: ScheduledSet[] = [];
  for (const item of template.items) {
    const n = effectiveSets(item, ctx, compliancePenalty);
    for (let i = 0; i < n; i++) {
      sets.push({
        exerciseId: item.exerciseId,
        priority: item.priority,
        setIndex: i,
        repMin: item.repMin,
        repMax: item.repMax,
        restSec: item.restSec
      });
    }
  }
  return sets;
}

/** Faktor für das Ziel-Arbeitsgewicht — in Deload-Wochen etwas reduzieren. */
export function deloadWeightMultiplier(ctx: WeekContext): number {
  return ctx.isDeload ? 0.9 : 1.0;
}

/**
 * Compliance = tatsächlich absolvierte Gym-Sessions / erwartete Sessions seit Programmstart,
 * begrenzt auf die letzten 14 Tage. Für brandneue Nutzer gibt es eine 7-tägige Schonfrist.
 */
export function complianceFromHistory(
  sessions: Session[],
  program: ProgramTemplate,
  today: Date,
  programStartISO?: string
): number {
  const expectedPerWeek = program.schedule.filter(d =>
    d.workoutType === 'gym_a' || d.workoutType === 'gym_b' || d.workoutType === 'gym_c'
  ).length;
  if (expectedPerWeek === 0) return 1;

  const twoWeeksAgoMs = today.getTime() - 14 * 86_400_000;
  let effectiveStartMs = twoWeeksAgoMs;

  // Wenn Programm weniger als 14 Tage läuft, nur ab Start messen
  if (programStartISO) {
    const [y, m, d] = programStartISO.split('-').map(Number);
    const startMs = new Date(y, m - 1, d).getTime();
    if (startMs > effectiveStartMs) effectiveStartMs = startMs;
  }

  // Schonfrist: erste Woche immer 100 %
  const daysSinceEffectiveStart = Math.max(0, (today.getTime() - effectiveStartMs) / 86_400_000);
  if (daysSinceEffectiveStart < 7) return 1;

  const done = sessions.filter(
    s => s.completed && !s.skipped && s.startedAt >= effectiveStartMs
  ).length;
  const expectedInPeriod = expectedPerWeek * (daysSinceEffectiveStart / 7);
  if (expectedInPeriod <= 0) return 1;
  return Math.min(1, done / expectedInPeriod);
}

/** 0 = perfect compliance, 1 = penalty one set, 2 = penalty two sets */
export function compliancePenalty(compliance: number): number {
  if (compliance >= 0.8) return 0;
  if (compliance >= 0.5) return 1;
  return 2;
}

/** Merge scheduled sets into exercise-level performance templates. */
export function scheduledToExercises(
  sets: ScheduledSet[],
  exerciseNameLookup: (id: string) => string,
  movementLookup: (id: string) => string
): ExercisePerformance[] {
  const byId = new Map<string, ExercisePerformance>();
  for (const s of sets) {
    let ex = byId.get(s.exerciseId);
    if (!ex) {
      ex = {
        exerciseId: s.exerciseId,
        name: exerciseNameLookup(s.exerciseId),
        movementPattern: movementLookup(s.exerciseId) as ExercisePerformance['movementPattern'],
        priority: s.priority,
        repMin: s.repMin,
        repMax: s.repMax,
        restSec: s.restSec,
        sets: [],
        skipped: false,
        removedByQuickMode: false
      };
      byId.set(s.exerciseId, ex);
    }
    ex.sets.push({
      setNumber: ex.sets.length + 1,
      targetRepsMin: s.repMin,
      targetRepsMax: s.repMax,
      targetWeight: null,
      actualWeight: null,
      actualReps: null,
      rir: null,
      completed: false
    });
  }
  return Array.from(byId.values());
}
