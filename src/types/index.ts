// Core domain types

export type WorkoutType = "gym_a" | "gym_b" | "gym_c" | "run_easy" | "run_long" | "mtb" | "mobility" | "rest";

export type MovementPattern =
  | "horizontal_push"
  | "vertical_pull"
  | "horizontal_pull"
  | "squat"
  | "hinge"
  | "quad_iso"
  | "hamstring_iso"
  | "lateral_delt"
  | "rear_delt"
  | "biceps"
  | "triceps"
  | "calves"
  | "core";

export type MuscleGroup =
  | "chest"
  | "back"
  | "lats"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "shoulders"
  | "rear_delts"
  | "biceps"
  | "triceps"
  | "calves"
  | "core"
  | "forearms";

export type EquipmentType = "machine" | "cable" | "smith" | "dumbbell" | "barbell" | "bodyweight";

export interface Exercise {
  id: string;
  name: string;
  shortName?: string;
  movementPattern: MovementPattern;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  equipmentType: EquipmentType;
  repRangeMin: number;
  repRangeMax: number;
  defaultRestSec: number;
  defaultSets: number;
  alternativeIds: string[];
  isIsolation: boolean;
  notes?: string;
  enabled: boolean;
}

export interface WorkoutTemplateItem {
  exerciseId: string;
  priority: "main" | "accessory" | "optional";
  baseSets: number;
  repMin: number;
  repMax: number;
  restSec: number;
  notes?: string;
}

export interface WorkoutTemplate {
  id: string;
  type: WorkoutType;
  name: string;
  description?: string;
  items: WorkoutTemplateItem[];
}

export interface WeekScheduleDay {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 1 = Monday (ISO) — we'll use 0=Mon..6=Sun internally
  workoutType: WorkoutType;
}

export interface ProgramTemplate {
  id: string;
  name: string;
  blockWeeks: number;
  schedule: WeekScheduleDay[];
  workoutTemplates: Record<string, WorkoutTemplate>; // by workoutType
}

export interface SetPerformance {
  setNumber: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetWeight: number | null;
  actualWeight: number | null;
  actualReps: number | null;
  rir: number | null;
  completed: boolean;
  restTakenSec?: number;
  timestamp?: number;
}

export interface ExercisePerformance {
  exerciseId: string;
  name: string;
  movementPattern: MovementPattern;
  variantId?: string; // if user swapped in an alternative
  priority: "main" | "accessory" | "optional";
  repMin: number;
  repMax: number;
  restSec: number;
  sets: SetPerformance[];
  skipped: boolean;
  removedByQuickMode: boolean;
  notes?: string;
}

export interface RecoveryCheck {
  sleep: number; // 1..5
  energy: number;
  soreness: number; // higher = less sore
  joints: number; // higher = better
  stress: number; // higher = less stressed
  timeAvailableMin: number;
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD (local)
  weekIndex: number; // week number within the program block
  blockIndex: number; // which block (0-based)
  workoutType: WorkoutType;
  startedAt: number; // epoch ms
  endedAt?: number;
  durationSec?: number;
  completed: boolean;
  skipped?: boolean; // Nutzer hat den Trainingstag bewusst übersprungen
  skipReason?: string;
  quickModeUsed: boolean;
  recovery?: RecoveryCheck;
  perceivedEnergy?: number; // 1-5
  notes?: string;
  exercises: ExercisePerformance[];
}

export interface CardioSession {
  id: string;
  date: string;
  type: "run_easy" | "run_long" | "mtb" | "intervals";
  durationMin: number;
  distanceKm?: number;
  avgPace?: string; // "mm:ss"
  rpe?: number; // 1-10
  notes?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  createdAt: number;
}

export interface UserProfile {
  id: "me";
  name: string;
  goal: "reentry" | "maintain" | "hypertrophy_light";
  experience: "returner" | "intermediate" | "advanced";
  weightUnit: "kg" | "lb";
  createdAt: number;
}

export interface Settings {
  id: "app";
  programId: string;
  programStartDate: string; // ISO date (Mon of week 1)
  blockWeeks: number;
  defaultRestMainSec: number;
  defaultRestIsoSec: number;
  quickModeEnabled: boolean;
  darkMode: "dark" | "light" | "auto";
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  sessionDurationTargetMin: number;
  preferredSwaps: Record<string, string>; // exerciseId -> variantId preferred for current block
  hiddenExerciseIds: string[];
  deloadMode: "auto" | "manual";
}

export interface ProgressionState {
  exerciseId: string;
  workingWeight: number | null;
  consecutiveTopOfRange: number;
  consecutiveStagnant: number;
  lastUpdated: number;
}

export interface ExportBundle {
  version: 1;
  exportedAt: number;
  settings: Settings | null;
  profile: UserProfile | null;
  sessions: Session[];
  cardio: CardioSession[];
  progression: ProgressionState[];
}
