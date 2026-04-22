// Konservative Startgewicht-Schätzung für das erste Training pro Übung.
//
// Quelle: allgemein anerkannte Anfänger-/Wiedereinsteiger-Ratios relativ zum
// Körpergewicht, bewusst um ~20 % reduziert damit Technik und Kontrolle im
// Vordergrund stehen. Nutzer kann beim ersten Satz nachjustieren — ab dem
// zweiten Training übernimmt die Double-Progression automatisch.

import type { Exercise, MovementPattern, UserProfile } from '../types';

const DEFAULT_BW = 80; // Fallback wenn kein Gewicht gesetzt

// Mittlere Richtwerte (Moderate-Intermediate, für Wiedereinsteiger danach konservativ skaliert)
const RATIO_BY_PATTERN: Record<MovementPattern, number> = {
  horizontal_push: 0.50,
  vertical_pull:   0.50,
  horizontal_pull: 0.45,
  squat:           1.00,
  hinge:           0.50,
  quad_iso:        0.35,
  hamstring_iso:   0.30,
  lateral_delt:    0.08,
  rear_delt:       0.15,
  biceps:          0.20,
  triceps:         0.22,
  calves:          0.60,
  core:            0.15
};

// Kabel-/Isolationsgeräte haben oft anderes Scaling
const EQUIPMENT_ADJUSTMENT: Record<string, number> = {
  machine: 1.0,
  cable:   0.9,
  smith:   1.0,
  dumbbell: 0.45, // je Hantel
  barbell:  1.0,
  bodyweight: 0.0
};

const REENTRY_FACTOR = 0.80;

/** Liefert ein konservatives Startgewicht auf 2,5 kg gerundet. null wenn kein BW. */
export function estimateStartingWeight(
  exercise: Exercise,
  profile: UserProfile | null | undefined
): number | null {
  const bw = profile?.weightKg && profile.weightKg > 0 ? profile.weightKg : DEFAULT_BW;
  if (exercise.equipmentType === 'bodyweight') return null;

  const ratio = RATIO_BY_PATTERN[exercise.movementPattern] ?? 0.3;
  const adjust = EQUIPMENT_ADJUSTMENT[exercise.equipmentType] ?? 1.0;
  const raw = bw * ratio * adjust * REENTRY_FACTOR;

  // Auf 2,5 kg runden, Minimum 2,5 kg
  const rounded = Math.max(2.5, Math.round(raw / 2.5) * 2.5);
  return rounded;
}
