import type { ProgramTemplate, WorkoutTemplate } from '../types';

const gymA: WorkoutTemplate = {
  id: 'wt_gym_a',
  type: 'gym_a',
  name: 'Gym A',
  description: 'Ganzkörper – Push-Schwerpunkt, Beine quad-dominant',
  items: [
    { exerciseId: 'chest_press_machine', priority: 'main',      baseSets: 3, repMin: 6,  repMax: 10, restSec: 110 },
    { exerciseId: 'lat_pulldown_wide',   priority: 'main',      baseSets: 3, repMin: 8,  repMax: 12, restSec: 90  },
    { exerciseId: 'leg_press',           priority: 'main',      baseSets: 3, repMin: 8,  repMax: 12, restSec: 110 },
    { exerciseId: 'leg_extension',       priority: 'accessory', baseSets: 2, repMin: 10, repMax: 15, restSec: 75  },
    { exerciseId: 'triceps_machine',     priority: 'accessory', baseSets: 2, repMin: 10, repMax: 15, restSec: 75  },
    { exerciseId: 'lateral_raise_machine', priority: 'accessory', baseSets: 2, repMin: 12, repMax: 15, restSec: 60 },
    { exerciseId: 'calf_raise_seated',   priority: 'accessory', baseSets: 2, repMin: 10, repMax: 15, restSec: 60  },
    { exerciseId: 'crunch_machine',      priority: 'optional',  baseSets: 2, repMin: 10, repMax: 15, restSec: 60  }
  ]
};

const gymB: WorkoutTemplate = {
  id: 'wt_gym_b',
  type: 'gym_b',
  name: 'Gym B',
  description: 'Ganzkörper – Pull-Schwerpunkt, Beine hamstring-/glute-dominant',
  items: [
    { exerciseId: 'row_machine_low',     priority: 'main',      baseSets: 3, repMin: 8,  repMax: 12, restSec: 90  },
    { exerciseId: 'incline_press_machine', priority: 'main',    baseSets: 2, repMin: 8,  repMax: 12, restSec: 90  },
    { exerciseId: 'leg_curl_lying',      priority: 'main',      baseSets: 3, repMin: 10, repMax: 15, restSec: 75  },
    { exerciseId: 'glute_drive',         priority: 'accessory', baseSets: 2, repMin: 8,  repMax: 12, restSec: 90  },
    { exerciseId: 'reverse_pec_deck',    priority: 'accessory', baseSets: 2, repMin: 10, repMax: 15, restSec: 60  },
    { exerciseId: 'biceps_machine',      priority: 'accessory', baseSets: 2, repMin: 10, repMax: 15, restSec: 75  },
    { exerciseId: 'rope_pushdown',       priority: 'accessory', baseSets: 2, repMin: 10, repMax: 15, restSec: 60  },
    { exerciseId: 'plank',               priority: 'optional',  baseSets: 2, repMin: 30, repMax: 60, restSec: 45  }
  ]
};

const gymC: WorkoutTemplate = {
  id: 'wt_gym_c',
  type: 'gym_c',
  name: 'Gym C',
  description: 'Ganzkörper – Variation & Fein-Schliff',
  items: [
    { exerciseId: 'lat_pulldown_neutral', priority: 'main',     baseSets: 3, repMin: 8,  repMax: 12, restSec: 90  },
    { exerciseId: 'chest_supported_row', priority: 'main',      baseSets: 3, repMin: 8,  repMax: 12, restSec: 90  },
    { exerciseId: 'hack_squat',          priority: 'main',      baseSets: 3, repMin: 8,  repMax: 12, restSec: 120 },
    { exerciseId: 'leg_curl_seated',     priority: 'accessory', baseSets: 2, repMin: 10, repMax: 15, restSec: 75  },
    { exerciseId: 'cable_chest_press',   priority: 'accessory', baseSets: 2, repMin: 10, repMax: 12, restSec: 90  },
    { exerciseId: 'cable_lateral_raise', priority: 'accessory', baseSets: 2, repMin: 12, repMax: 15, restSec: 60  },
    { exerciseId: 'calf_raise_standing', priority: 'accessory', baseSets: 2, repMin: 10, repMax: 15, restSec: 60  },
    { exerciseId: 'cable_crunch',        priority: 'optional',  baseSets: 2, repMin: 10, repMax: 15, restSec: 60  }
  ]
};

const runEasy: WorkoutTemplate = {
  id: 'wt_run_easy',
  type: 'run_easy',
  name: 'Lockerer Lauf',
  description: '30–40 Min Zone 2, sprechen möglich',
  items: []
};

const runLong: WorkoutTemplate = {
  id: 'wt_run_long',
  type: 'run_long',
  name: 'Lockerer langer Lauf',
  description: '40–60 Min Zone 2',
  items: []
};

const mtb: WorkoutTemplate = {
  id: 'wt_mtb',
  type: 'mtb',
  name: 'MTB locker',
  description: '60–90 Min locker',
  items: []
};

const mobility: WorkoutTemplate = {
  id: 'wt_mobility',
  type: 'mobility',
  name: 'Mobility / Spaziergang',
  description: 'Aktive Erholung',
  items: []
};

const rest: WorkoutTemplate = {
  id: 'wt_rest',
  type: 'rest',
  name: 'Ruhetag',
  description: 'Frei',
  items: []
};

export const PROGRAM: ProgramTemplate = {
  id: 'prog_v1',
  name: 'Gerätefokus – Wiedereinstieg',
  blockWeeks: 12,
  // 0 = Mo, 1 = Di, 2 = Mi, 3 = Do, 4 = Fr, 5 = Sa, 6 = So
  schedule: [
    { dayOfWeek: 0, workoutType: 'gym_a' },
    { dayOfWeek: 1, workoutType: 'run_easy' },
    { dayOfWeek: 2, workoutType: 'gym_b' },
    { dayOfWeek: 3, workoutType: 'mobility' },
    { dayOfWeek: 4, workoutType: 'gym_c' },
    { dayOfWeek: 5, workoutType: 'run_long' },
    { dayOfWeek: 6, workoutType: 'rest' }
  ],
  workoutTemplates: {
    gym_a: gymA,
    gym_b: gymB,
    gym_c: gymC,
    run_easy: runEasy,
    run_long: runLong,
    mtb: mtb,
    mobility: mobility,
    rest: rest
  }
};

export const WORKOUT_TYPE_LABEL: Record<string, string> = {
  gym_a: 'Gym A',
  gym_b: 'Gym B',
  gym_c: 'Gym C',
  run_easy: 'Lauf locker',
  run_long: 'Langer Lauf',
  mtb: 'MTB',
  mobility: 'Mobility',
  rest: 'Ruhetag'
};

export const WEEKDAY_LABEL_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const WEEKDAY_LONG_DE = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
