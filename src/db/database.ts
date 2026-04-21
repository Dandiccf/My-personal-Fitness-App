import { openDB, type IDBPDatabase } from 'idb';
import type { Session, CardioSession, Settings, UserProfile, ProgressionState, ExportBundle } from '../types';

const DB_NAME = 'training_db';
const DB_VERSION = 1;

interface Schema {
  sessions: { key: string; value: Session; indexes: { 'by-date': string } };
  cardio: { key: string; value: CardioSession; indexes: { 'by-date': string } };
  progression: { key: string; value: ProgressionState };
  settings: { key: 'app'; value: Settings };
  profile: { key: 'me'; value: UserProfile };
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<Schema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('cardio')) {
          const store = db.createObjectStore('cardio', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('progression')) {
          db.createObjectStore('progression', { keyPath: 'exerciseId' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
      }
    });
  }
  return dbPromise;
}

// --- sessions ---
export async function putSession(s: Session) {
  const db = await getDB();
  await db.put('sessions', s);
}

export async function getSession(id: string): Promise<Session | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function deleteSession(id: string) {
  const db = await getDB();
  await db.delete('sessions', id);
}

export async function getAllSessions(): Promise<Session[]> {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.sort((a, b) => a.startedAt - b.startedAt);
}

// --- cardio ---
export async function putCardio(c: CardioSession) {
  const db = await getDB();
  await db.put('cardio', c);
}

export async function deleteCardio(id: string) {
  const db = await getDB();
  await db.delete('cardio', id);
}

export async function getAllCardio(): Promise<CardioSession[]> {
  const db = await getDB();
  return (await db.getAll('cardio')).sort((a, b) => a.date.localeCompare(b.date));
}

// --- progression ---
export async function putProgression(p: ProgressionState) {
  const db = await getDB();
  await db.put('progression', p);
}

export async function getAllProgression(): Promise<ProgressionState[]> {
  const db = await getDB();
  return db.getAll('progression');
}

// --- settings ---
export async function putSettings(s: Settings) {
  const db = await getDB();
  await db.put('settings', s);
}

export async function getSettings(): Promise<Settings | null> {
  const db = await getDB();
  const s = await db.get('settings', 'app');
  return s ?? null;
}

// --- profile ---
export async function putProfile(p: UserProfile) {
  const db = await getDB();
  await db.put('profile', p);
}

export async function getProfile(): Promise<UserProfile | null> {
  const db = await getDB();
  const p = await db.get('profile', 'me');
  return p ?? null;
}

// --- export / import ---
export async function exportAll(): Promise<ExportBundle> {
  const [sessions, cardio, progression, settings, profile] = await Promise.all([
    getAllSessions(),
    getAllCardio(),
    getAllProgression(),
    getSettings(),
    getProfile()
  ]);
  return {
    version: 1,
    exportedAt: Date.now(),
    sessions,
    cardio,
    progression,
    settings,
    profile
  };
}

export async function importAll(bundle: ExportBundle, { replace }: { replace: boolean }) {
  const db = await getDB();
  const tx = db.transaction(['sessions', 'cardio', 'progression', 'settings', 'profile'], 'readwrite');

  if (replace) {
    await Promise.all([
      tx.objectStore('sessions').clear(),
      tx.objectStore('cardio').clear(),
      tx.objectStore('progression').clear(),
      tx.objectStore('settings').clear(),
      tx.objectStore('profile').clear()
    ]);
  }

  for (const s of bundle.sessions ?? []) await tx.objectStore('sessions').put(s);
  for (const c of bundle.cardio ?? []) await tx.objectStore('cardio').put(c);
  for (const p of bundle.progression ?? []) await tx.objectStore('progression').put(p);
  if (bundle.settings) await tx.objectStore('settings').put(bundle.settings);
  if (bundle.profile) await tx.objectStore('profile').put(bundle.profile);

  await tx.done;
}

export async function wipeAll() {
  const db = await getDB();
  const tx = db.transaction(['sessions', 'cardio', 'progression', 'settings', 'profile'], 'readwrite');
  await Promise.all([
    tx.objectStore('sessions').clear(),
    tx.objectStore('cardio').clear(),
    tx.objectStore('progression').clear(),
    tx.objectStore('settings').clear(),
    tx.objectStore('profile').clear()
  ]);
  await tx.done;
}
