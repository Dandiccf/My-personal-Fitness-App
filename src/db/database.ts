import { apiFetch } from "../lib/api";
import type { Session, CardioSession, Settings, UserProfile, ProgressionState, ExportBundle } from "../types";

let bundleCache: ExportBundle | null = null;

function createEmptyBundle(): ExportBundle {
  return {
    version: 1,
    exportedAt: Date.now(),
    settings: null,
    profile: null,
    sessions: [],
    cardio: [],
    progression: [],
  };
}

function cloneBundle(bundle: ExportBundle): ExportBundle {
  return JSON.parse(JSON.stringify(bundle)) as ExportBundle;
}

async function readBundle(force = false): Promise<ExportBundle> {
  if (!bundleCache || force) {
    bundleCache = await apiFetch<ExportBundle>("/data");
  }
  return cloneBundle(bundleCache);
}

async function writeBundle(bundle: ExportBundle): Promise<ExportBundle> {
  bundleCache = await apiFetch<ExportBundle>("/data", {
    method: "PUT",
    body: JSON.stringify({
      ...bundle,
      version: 1,
      exportedAt: Date.now(),
    }),
  });
  return cloneBundle(bundleCache);
}

function upsertById<T extends { id: string }>(items: T[], nextItem: T) {
  return [...items.filter((item) => item.id !== nextItem.id), nextItem];
}

function upsertByKey<T>(items: T[], nextItem: T, getKey: (item: T) => string) {
  const key = getKey(nextItem);
  return [...items.filter((item) => getKey(item) !== key), nextItem];
}

export function clearCache() {
  bundleCache = null;
}

export async function putSession(session: Session) {
  const bundle = await readBundle();
  await writeBundle({ ...bundle, sessions: upsertById(bundle.sessions, session) });
}

export async function getSession(id: string): Promise<Session | undefined> {
  const bundle = await readBundle();
  return bundle.sessions.find((session) => session.id === id);
}

export async function deleteSession(id: string) {
  const bundle = await readBundle();
  await writeBundle({ ...bundle, sessions: bundle.sessions.filter((session) => session.id !== id) });
}

export async function getAllSessions(): Promise<Session[]> {
  const bundle = await readBundle();
  return bundle.sessions.sort((a, b) => a.startedAt - b.startedAt);
}

export async function putCardio(cardio: CardioSession) {
  const bundle = await readBundle();
  await writeBundle({ ...bundle, cardio: upsertById(bundle.cardio, cardio) });
}

export async function deleteCardio(id: string) {
  const bundle = await readBundle();
  await writeBundle({ ...bundle, cardio: bundle.cardio.filter((entry) => entry.id !== id) });
}

export async function getAllCardio(): Promise<CardioSession[]> {
  const bundle = await readBundle();
  return bundle.cardio.sort((a, b) => a.date.localeCompare(b.date));
}

export async function putProgression(state: ProgressionState) {
  const bundle = await readBundle();
  await writeBundle({
    ...bundle,
    progression: upsertByKey(bundle.progression, state, (item) => item.exerciseId),
  });
}

export async function getAllProgression(): Promise<ProgressionState[]> {
  const bundle = await readBundle();
  return bundle.progression;
}

export async function putSettings(settings: Settings) {
  const bundle = await readBundle();
  await writeBundle({ ...bundle, settings });
}

export async function getSettings(): Promise<Settings | null> {
  const bundle = await readBundle();
  return bundle.settings ?? null;
}

export async function putProfile(profile: UserProfile) {
  const bundle = await readBundle();
  await writeBundle({ ...bundle, profile });
}

export async function getProfile(): Promise<UserProfile | null> {
  const bundle = await readBundle();
  return bundle.profile ?? null;
}

export async function exportAll(): Promise<ExportBundle> {
  return readBundle(true);
}

export async function importAll(bundle: ExportBundle, { replace }: { replace: boolean }) {
  if (replace) {
    await writeBundle({
      version: 1,
      exportedAt: Date.now(),
      settings: bundle.settings ?? null,
      profile: bundle.profile ?? null,
      sessions: bundle.sessions ?? [],
      cardio: bundle.cardio ?? [],
      progression: bundle.progression ?? [],
    });
    return;
  }

  const current = await readBundle();

  const mergedSessions = [...current.sessions];
  for (const session of bundle.sessions ?? []) {
    const index = mergedSessions.findIndex((item) => item.id === session.id);
    if (index >= 0) mergedSessions[index] = session;
    else mergedSessions.push(session);
  }

  const mergedCardio = [...current.cardio];
  for (const cardio of bundle.cardio ?? []) {
    const index = mergedCardio.findIndex((item) => item.id === cardio.id);
    if (index >= 0) mergedCardio[index] = cardio;
    else mergedCardio.push(cardio);
  }

  const mergedProgression = [...current.progression];
  for (const state of bundle.progression ?? []) {
    const index = mergedProgression.findIndex((item) => item.exerciseId === state.exerciseId);
    if (index >= 0) mergedProgression[index] = state;
    else mergedProgression.push(state);
  }

  await writeBundle({
    version: 1,
    exportedAt: Date.now(),
    settings: bundle.settings ?? current.settings,
    profile: bundle.profile ?? current.profile,
    sessions: mergedSessions,
    cardio: mergedCardio,
    progression: mergedProgression,
  });
}

export async function wipeAll() {
  await apiFetch<void>("/data", { method: "DELETE" });
  clearCache();
}
