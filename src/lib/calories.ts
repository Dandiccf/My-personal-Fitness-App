// Kcal-Schätzung via MET-Methode (ACSM-Standard).
//
//   kcal/min = (MET × 3.5 × weight_kg) / 200
//
// MET-Werte aus dem Compendium of Physical Activities (Ainsworth et al.).
// Leicht konservative Defaults, weil Ziel-RIR 1-2 und keine Intervalle.

import type { CardioSession, Session, UserProfile, WorkoutType } from '../types';

const DEFAULT_WEIGHT_KG = 80; // Fallback falls Profil noch leer

const MET_BY_WORKOUT: Record<WorkoutType, number> = {
  gym_a: 5.5,
  gym_b: 5.5,
  gym_c: 5.5,
  run_easy: 7.5,
  run_long: 7.0,
  mtb: 7.5,
  mobility: 3.0,
  rest: 0
};

const MET_BY_CARDIO: Record<CardioSession['type'], number> = {
  run_easy: 7.5,
  run_long: 7.0,
  mtb: 7.5,
  intervals: 9.5
};

export function kcalFromMet(met: number, weightKg: number, durationMin: number): number {
  if (met <= 0 || weightKg <= 0 || durationMin <= 0) return 0;
  return (met * 3.5 * weightKg * durationMin) / 200;
}

function profileWeight(profile: UserProfile | null | undefined): number {
  const w = profile?.weightKg;
  return typeof w === 'number' && w > 0 ? w : DEFAULT_WEIGHT_KG;
}

/** Kalorienverbrauch einer Krafttraining-Session. */
export function estimateSessionKcal(session: Session, profile: UserProfile | null | undefined): number {
  if (session.skipped) return 0;
  const durationMin = (session.durationSec ?? 0) / 60;
  if (durationMin <= 0) return 0;
  const met = MET_BY_WORKOUT[session.workoutType] ?? 5.0;
  // Für aktive Trainings mit viel Pause: nimm ca. 75 % der Zeit als "active"
  const activeMin = session.workoutType.startsWith('gym') ? durationMin * 0.75 : durationMin;
  return Math.round(kcalFromMet(met, profileWeight(profile), activeMin));
}

/** Kalorienverbrauch einer Cardio-Einheit. */
export function estimateCardioKcal(c: CardioSession, profile: UserProfile | null | undefined): number {
  const met = MET_BY_CARDIO[c.type] ?? 7.0;
  return Math.round(kcalFromMet(met, profileWeight(profile), c.durationMin));
}

/** BMR nach Mifflin–St Jeor (optional, für spätere Erweiterungen). */
export function bmr(profile: UserProfile | null | undefined): number | null {
  if (!profile?.weightKg || !profile.heightCm || !profile.age) return null;
  const { weightKg, heightCm, age, sex } = profile;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === 'female' ? base - 161 : base + 5);
}

export function hasVitals(profile: UserProfile | null | undefined): boolean {
  return !!(profile?.weightKg && profile.weightKg > 0);
}
