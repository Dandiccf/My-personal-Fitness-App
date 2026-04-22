// Deutsche Labels für Anzeige.

import type { EquipmentType, MovementPattern, MuscleGroup } from '../types';

export const MUSCLE_LABEL_DE: Record<MuscleGroup, string> = {
  chest: 'Brust',
  back: 'Rücken',
  lats: 'Latissimus',
  quads: 'Quadrizeps',
  hamstrings: 'Beinbeuger',
  glutes: 'Gesäß',
  shoulders: 'Schultern',
  rear_delts: 'hintere Schultern',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  calves: 'Waden',
  core: 'Rumpf',
  forearms: 'Unterarme'
};

export const EQUIPMENT_LABEL_DE: Record<EquipmentType, string> = {
  machine: 'Maschine',
  cable: 'Kabel',
  smith: 'Multipresse',
  dumbbell: 'Kurzhantel',
  barbell: 'Langhantel',
  bodyweight: 'Körpergewicht'
};

export const PATTERN_LABEL_DE: Record<MovementPattern, string> = {
  horizontal_push: 'Drücken horizontal',
  vertical_pull: 'Ziehen vertikal',
  horizontal_pull: 'Ziehen horizontal',
  squat: 'Kniebeuge-Muster',
  hinge: 'Hüftstreckung',
  quad_iso: 'Quadrizeps-Isolation',
  hamstring_iso: 'Beinbeuger-Isolation',
  lateral_delt: 'Seitliche Schulter',
  rear_delt: 'Hintere Schulter',
  biceps: 'Bizeps',
  triceps: 'Trizeps',
  calves: 'Waden',
  core: 'Rumpf'
};

export function musclesDe(m: MuscleGroup[]): string {
  return m.map(x => MUSCLE_LABEL_DE[x] ?? x).join(' · ');
}
