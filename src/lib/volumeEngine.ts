// Volumen-/Blocksteuerung.
// Berechnet pro Woche die effektive Satzzahl pro Übung und ob Deload gilt.

import type { ProgramTemplate, WorkoutTemplate, WorkoutTemplateItem, Session, ExercisePerformance } from '../types';

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
  // anchor to Monday of start week
  start.setHours(0, 0, 0, 0);

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

/** Compute how many sets to actually perform for a template item in this week. */
export function effectiveSets(item: WorkoutTemplateItem, ctx: WeekContext, compliancePenalty = 0): number {
  // base progression per priority:
  // main:      W1:2, W2:2, W3:3, W4:3, W5:3, W6:3, W7:2(deload), W8-10:3, W11:4, W12:2
  // accessory: W1:1, W2:2, W3:2, W4:2, W5:2, W6:3 (selectively), W7:1, W8-10:2-3, W11:3, W12:1
  // optional:  always 1, deload 1, peak 2
  const wk = ctx.weekInBlock;
  let base = item.baseSets;

  if (item.priority === 'main') {
    base = wk <= 2 ? 2
         : wk <= 4 ? 3
         : wk <= 6 ? 3
         : wk === 7 ? 2
         : wk <= 10 ? 3
         : wk === 11 ? Math.max(3, item.baseSets + 1)
         : 2;
  } else if (item.priority === 'accessory') {
    base = wk <= 1 ? Math.max(1, item.baseSets - 1)
         : wk <= 4 ? item.baseSets
         : wk <= 6 ? item.baseSets // (wir bevorzugen gezieltes Hochfahren über die Regel-Engine unten)
         : wk === 7 ? Math.max(1, item.baseSets - 1)
         : wk <= 10 ? item.baseSets
         : wk === 11 ? item.baseSets + 1
         : Math.max(1, item.baseSets - 1);
  } else {
    base = wk === 7 || wk === 12 ? 1
         : wk === 11 ? Math.max(2, item.baseSets)
         : 1;
  }

  // Compliance penalty: if user missed several sessions recently, don't raise volume.
  if (compliancePenalty > 0) {
    base = Math.max(1, base - compliancePenalty);
  }

  return Math.max(1, base);
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

/** Compliance = #gym-sessions completed in the last 2 full weeks / expected. */
export function complianceFromHistory(sessions: Session[], program: ProgramTemplate, today: Date): number {
  const expectedPerWeek = program.schedule.filter(d =>
    d.workoutType === 'gym_a' || d.workoutType === 'gym_b' || d.workoutType === 'gym_c'
  ).length;
  const twoWeeksAgo = new Date(today.getTime() - 14 * 86_400_000);
  const done = sessions.filter(s => s.completed && new Date(s.startedAt) >= twoWeeksAgo).length;
  const expected = expectedPerWeek * 2;
  if (expected === 0) return 1;
  return Math.min(1, done / expected);
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
