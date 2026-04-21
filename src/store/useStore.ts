import { create } from 'zustand';
import type {
  Session,
  CardioSession,
  Settings,
  UserProfile,
  ProgressionState,
  RecoveryCheck,
  ExercisePerformance,
  SetPerformance,
  WorkoutType
} from '../types';
import * as db from '../db/database';
import { PROGRAM } from '../data/programTemplate';
import { EXERCISE_MAP } from '../data/exercises';
import {
  computeWeekContext,
  buildScheduledSets,
  scheduledToExercises,
  complianceFromHistory,
  compliancePenalty,
  applyRecoveryScaling
} from '../lib/volumeEngine';
import { suggestForNextSession } from '../lib/progression';
import { todayISO } from '../lib/dateUtils';

interface StoreState {
  ready: boolean;
  settings: Settings | null;
  profile: UserProfile | null;
  sessions: Session[];
  cardio: CardioSession[];
  progression: ProgressionState[];
  activeSession: Session | null;
  activeExerciseIndex: number;

  init: () => Promise<void>;
  saveSettings: (patch: Partial<Settings>) => Promise<void>;
  saveProfile: (patch: Partial<UserProfile>) => Promise<void>;
  setPreferredSwap: (exerciseId: string, variantId: string | null) => Promise<void>;

  // session flow
  startSession: (workoutType: WorkoutType, recovery?: RecoveryCheck, quickMode?: boolean) => Promise<Session>;
  updateActiveSession: (updater: (s: Session) => Session) => Promise<void>;
  updateSet: (exerciseIndex: number, setIndex: number, patch: Partial<SetPerformance>) => Promise<void>;
  completeSet: (exerciseIndex: number, setIndex: number, restTakenSec?: number) => Promise<void>;
  addExtraSet: (exerciseIndex: number) => Promise<void>;
  toggleSkipExercise: (exerciseIndex: number) => Promise<void>;
  swapExercise: (exerciseIndex: number, newExerciseId: string) => Promise<void>;
  setActiveExerciseIndex: (i: number) => void;
  finishSession: () => Promise<void>;
  cancelSession: () => Promise<void>;

  addCardio: (c: Omit<CardioSession, 'id'>) => Promise<void>;
  deleteCardio: (id: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  resetData: () => Promise<void>;
}

function newId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultSettings(): Settings {
  return {
    id: 'app',
    programId: PROGRAM.id,
    programStartDate: todayISO(),
    blockWeeks: PROGRAM.blockWeeks,
    defaultRestMainSec: 110,
    defaultRestIsoSec: 75,
    quickModeEnabled: false,
    darkMode: 'dark',
    soundEnabled: true,
    vibrationEnabled: true,
    sessionDurationTargetMin: 55,
    preferredSwaps: {},
    hiddenExerciseIds: [],
    deloadMode: 'auto'
  };
}

function defaultProfile(): UserProfile {
  return {
    id: 'me',
    name: '',
    goal: 'reentry',
    experience: 'returner',
    weightUnit: 'kg',
    createdAt: Date.now()
  };
}

export const useStore = create<StoreState>((set, get) => ({
  ready: false,
  settings: null,
  profile: null,
  sessions: [],
  cardio: [],
  progression: [],
  activeSession: null,
  activeExerciseIndex: 0,

  async init() {
    let [settings, profile, sessions, cardio, progression] = await Promise.all([
      db.getSettings(),
      db.getProfile(),
      db.getAllSessions(),
      db.getAllCardio(),
      db.getAllProgression()
    ]);
    if (!settings) {
      settings = defaultSettings();
      await db.putSettings(settings);
    }
    if (!profile) {
      profile = defaultProfile();
      await db.putProfile(profile);
    }
    set({ ready: true, settings, profile, sessions, cardio, progression });
  },

  async saveSettings(patch) {
    const cur = get().settings ?? defaultSettings();
    const next = { ...cur, ...patch };
    await db.putSettings(next);
    set({ settings: next });
  },

  async saveProfile(patch) {
    const cur = get().profile ?? defaultProfile();
    const next = { ...cur, ...patch };
    await db.putProfile(next);
    set({ profile: next });
  },

  async setPreferredSwap(exerciseId, variantId) {
    const cur = get().settings ?? defaultSettings();
    const swaps = { ...cur.preferredSwaps };
    if (variantId == null) delete swaps[exerciseId];
    else swaps[exerciseId] = variantId;
    await get().saveSettings({ preferredSwaps: swaps });
  },

  async startSession(workoutType, recovery, quickMode = false) {
    const { settings, sessions } = get();
    const s = settings ?? defaultSettings();
    const ctx = computeWeekContext(s.programStartDate, new Date(), s.blockWeeks);
    const compliance = complianceFromHistory(sessions, PROGRAM, new Date());
    const penalty = compliancePenalty(compliance);

    const template = PROGRAM.workoutTemplates[workoutType];
    let scheduled = buildScheduledSets(template, ctx, penalty);

    // Apply preferred swaps: replace exerciseId with user-preferred variant.
    scheduled = scheduled.map(set => {
      const pref = s.preferredSwaps[set.exerciseId];
      if (pref && EXERCISE_MAP[pref]) return { ...set, exerciseId: pref };
      return set;
    });

    // Recovery scaling: map 1-5 scores to 0..1
    let appliedNote: string | null = null;
    if (recovery) {
      const score = (
        (recovery.sleep - 1) + (recovery.energy - 1) +
        (recovery.soreness - 1) + (recovery.joints - 1) + (recovery.stress - 1)
      ) / 20;
      const res = applyRecoveryScaling(scheduled, score, recovery.timeAvailableMin, s.sessionDurationTargetMin);
      scheduled = res.sets;
      appliedNote = res.note;
    }

    let exercises: ExercisePerformance[] = scheduledToExercises(
      scheduled,
      id => EXERCISE_MAP[id]?.name ?? id,
      id => EXERCISE_MAP[id]?.movementPattern ?? 'core'
    );

    // Apply progression suggestions as "target weight"
    for (const ex of exercises) {
      const exMeta = EXERCISE_MAP[ex.exerciseId];
      const suggestion = suggestForNextSession(
        ex.exerciseId, ex.repMin, ex.repMax, sessions, undefined, exMeta?.isIsolation
      );
      const tw = suggestion.suggestedWeight;
      ex.sets = ex.sets.map(st => ({ ...st, targetWeight: tw }));
      if (suggestion.reason) {
        ex.notes = suggestion.reason;
      }
    }

    if (quickMode) {
      // drop last 1-3 optional/accessory exercises
      const dropOrder: Array<'optional' | 'accessory'> = ['optional', 'accessory'];
      let removed = 0;
      for (const p of dropOrder) {
        for (let i = exercises.length - 1; i >= 0 && removed < 3; i--) {
          if (exercises[i].priority === p) {
            exercises[i] = { ...exercises[i], removedByQuickMode: true };
            removed++;
          }
        }
        if (removed >= 2) break;
      }
    }

    const newSession: Session = {
      id: newId('sess'),
      date: todayISO(),
      weekIndex: ctx.weekInBlock,
      blockIndex: ctx.blockIndex,
      workoutType,
      startedAt: Date.now(),
      completed: false,
      quickModeUsed: quickMode,
      recovery,
      exercises,
      notes: appliedNote ?? undefined
    };

    await db.putSession(newSession);
    set(state => ({
      activeSession: newSession,
      activeExerciseIndex: 0,
      sessions: [...state.sessions, newSession]
    }));
    return newSession;
  },

  async updateActiveSession(updater) {
    const active = get().activeSession;
    if (!active) return;
    const next = updater(active);
    await db.putSession(next);
    set(state => ({
      activeSession: next,
      sessions: state.sessions.map(s => (s.id === next.id ? next : s))
    }));
  },

  async updateSet(exerciseIndex, setIndex, patch) {
    await get().updateActiveSession(s => {
      const exercises = s.exercises.map((ex, i) => {
        if (i !== exerciseIndex) return ex;
        const sets = ex.sets.map((st, j) => (j === setIndex ? { ...st, ...patch } : st));
        return { ...ex, sets };
      });
      return { ...s, exercises };
    });
  },

  async completeSet(exerciseIndex, setIndex, restTakenSec) {
    await get().updateActiveSession(s => {
      const exercises = s.exercises.map((ex, i) => {
        if (i !== exerciseIndex) return ex;
        const sets = ex.sets.map((st, j) =>
          j === setIndex
            ? {
                ...st,
                completed: true,
                timestamp: Date.now(),
                restTakenSec,
                actualWeight: st.actualWeight ?? st.targetWeight,
                actualReps: st.actualReps ?? st.targetRepsMax
              }
            : st
        );
        return { ...ex, sets };
      });
      return { ...s, exercises };
    });
  },

  async addExtraSet(exerciseIndex) {
    await get().updateActiveSession(s => {
      const exercises = s.exercises.map((ex, i) => {
        if (i !== exerciseIndex) return ex;
        const last = ex.sets[ex.sets.length - 1];
        const newSet: SetPerformance = {
          setNumber: ex.sets.length + 1,
          targetRepsMin: ex.repMin,
          targetRepsMax: ex.repMax,
          targetWeight: last?.actualWeight ?? last?.targetWeight ?? null,
          actualWeight: null,
          actualReps: null,
          rir: null,
          completed: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { ...s, exercises };
    });
  },

  async toggleSkipExercise(exerciseIndex) {
    await get().updateActiveSession(s => {
      const exercises = s.exercises.map((ex, i) =>
        i === exerciseIndex ? { ...ex, skipped: !ex.skipped } : ex
      );
      return { ...s, exercises };
    });
  },

  async swapExercise(exerciseIndex, newExerciseId) {
    const exMeta = EXERCISE_MAP[newExerciseId];
    if (!exMeta) return;
    await get().updateActiveSession(s => {
      const exercises = s.exercises.map((ex, i) => {
        if (i !== exerciseIndex) return ex;
        return {
          ...ex,
          exerciseId: newExerciseId,
          name: exMeta.name,
          movementPattern: exMeta.movementPattern,
          restSec: exMeta.defaultRestSec,
          variantId: newExerciseId,
          sets: ex.sets.map(st => ({
            ...st,
            targetWeight: null,
            actualWeight: null,
            actualReps: null,
            completed: false
          }))
        };
      });
      return { ...s, exercises };
    });
  },

  setActiveExerciseIndex(i) {
    set({ activeExerciseIndex: i });
  },

  async finishSession() {
    const active = get().activeSession;
    if (!active) return;
    const done: Session = {
      ...active,
      completed: true,
      endedAt: Date.now(),
      durationSec: Math.round((Date.now() - active.startedAt) / 1000)
    };
    await db.putSession(done);
    set(state => ({
      activeSession: null,
      activeExerciseIndex: 0,
      sessions: state.sessions.map(s => (s.id === done.id ? done : s))
    }));
  },

  async cancelSession() {
    const active = get().activeSession;
    if (!active) return;
    // If no sets were completed, delete the draft; otherwise save as incomplete.
    const anyCompleted = active.exercises.some(e => e.sets.some(s => s.completed));
    if (!anyCompleted) {
      await db.deleteSession(active.id);
      set(state => ({
        activeSession: null,
        activeExerciseIndex: 0,
        sessions: state.sessions.filter(s => s.id !== active.id)
      }));
    } else {
      const done: Session = { ...active, completed: false, endedAt: Date.now() };
      await db.putSession(done);
      set(state => ({
        activeSession: null,
        activeExerciseIndex: 0,
        sessions: state.sessions.map(s => (s.id === done.id ? done : s))
      }));
    }
  },

  async addCardio(c) {
    const entry: CardioSession = { ...c, id: newId('cardio') };
    await db.putCardio(entry);
    set(state => ({ cardio: [...state.cardio, entry] }));
  },

  async deleteCardio(id) {
    await db.deleteCardio(id);
    set(state => ({ cardio: state.cardio.filter(c => c.id !== id) }));
  },

  async deleteSession(id) {
    await db.deleteSession(id);
    set(state => ({ sessions: state.sessions.filter(s => s.id !== id) }));
  },

  async resetData() {
    await db.wipeAll();
    await get().init();
  }
}));
