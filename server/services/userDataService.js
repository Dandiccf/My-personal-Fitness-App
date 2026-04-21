import { db } from "../db.js";

function now() {
  return Date.now();
}

export function sanitizeBundle(input) {
  const source = input && typeof input === "object" ? input : {};
  return {
    version: 1,
    exportedAt: Number(source.exportedAt) || now(),
    settings: source.settings ?? null,
    profile: source.profile ?? null,
    sessions: Array.isArray(source.sessions) ? source.sessions : [],
    cardio: Array.isArray(source.cardio) ? source.cardio : [],
    progression: Array.isArray(source.progression) ? source.progression : [],
  };
}

export function emptyBundle() {
  return sanitizeBundle({});
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function ensureUserData(userId) {
  const existing = db.prepare("SELECT user_id FROM user_data WHERE user_id = ?").get(userId);
  if (!existing) {
    db.prepare(
      `
      INSERT INTO user_data (user_id, settings_json, profile_json, sessions_json, cardio_json, progression_json, updated_at)
      VALUES (?, NULL, NULL, '[]', '[]', '[]', ?)
    `,
    ).run(userId, now());
  }
}

export function getUserData(userId) {
  ensureUserData(userId);
  const row = db.prepare("SELECT * FROM user_data WHERE user_id = ?").get(userId);
  return sanitizeBundle({
    settings: parseJson(row.settings_json, null),
    profile: parseJson(row.profile_json, null),
    sessions: parseJson(row.sessions_json, []),
    cardio: parseJson(row.cardio_json, []),
    progression: parseJson(row.progression_json, []),
    exportedAt: row.updated_at,
  });
}

export function saveUserData(userId, bundle) {
  const next = sanitizeBundle(bundle);
  db.prepare(
    `
    INSERT INTO user_data (user_id, settings_json, profile_json, sessions_json, cardio_json, progression_json, updated_at)
    VALUES (@user_id, @settings_json, @profile_json, @sessions_json, @cardio_json, @progression_json, @updated_at)
    ON CONFLICT(user_id) DO UPDATE SET
      settings_json = excluded.settings_json,
      profile_json = excluded.profile_json,
      sessions_json = excluded.sessions_json,
      cardio_json = excluded.cardio_json,
      progression_json = excluded.progression_json,
      updated_at = excluded.updated_at
  `,
  ).run({
    user_id: userId,
    settings_json: next.settings == null ? null : JSON.stringify(next.settings),
    profile_json: next.profile == null ? null : JSON.stringify(next.profile),
    sessions_json: JSON.stringify(next.sessions),
    cardio_json: JSON.stringify(next.cardio),
    progression_json: JSON.stringify(next.progression),
    updated_at: now(),
  });

  return getUserData(userId);
}

export function resetUserData(userId) {
  return saveUserData(userId, emptyBundle());
}
