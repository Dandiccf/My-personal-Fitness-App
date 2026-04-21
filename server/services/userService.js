import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.js";
import { config } from "../config.js";

function now() {
  return Date.now();
}

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function rowToUser(row) {
  return {
    id: String(row.id),
    email: row.email,
    createdAt: row.created_at,
  };
}

export function findUserById(userId) {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  return row ? rowToUser(row) : null;
}

export function findUserRowByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}

export function createToken(user) {
  return jwt.sign({ sub: String(user.id), email: user.email }, config.jwtSecret, { expiresIn: "30d" });
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 12);
  const createdAt = now();
  const result = db
    .prepare("INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)")
    .run(email, passwordHash, createdAt);

  return rowToUser({ id: result.lastInsertRowid, email, created_at: createdAt });
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}
