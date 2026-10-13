import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcryptjs";
import { DATA_DIR, DB_FILE } from "./config.js";

// Mock directory of SSO users. In a real deployment these records would be
// synced from an identity provider rather than hard-coded.
export const SEED_USERS = [
  {
    email: "dr.elena.santos@wah4c.org",
    password: "Elena@2026",
    fullName: "Dr Elena Santos",
  },
];

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_FILE);

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    email           TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    is_locked       INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

function seed() {
  const insert = db.prepare(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES (?, ?, ?)
     ON CONFLICT(email) DO NOTHING`,
  );
  for (const user of SEED_USERS) {
    insert.run(
      user.email.toLowerCase(),
      bcrypt.hashSync(user.password, 10),
      user.fullName,
    );
  }
}

seed();

export function findUserByEmail(email) {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(String(email).trim().toLowerCase());
}

export function findUserById(userId) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
}

export function resetFailedAttempts(userId) {
  db.prepare("UPDATE users SET failed_attempts = 0 WHERE id = ?").run(userId);
}

export function recordFailedAttempt(userId) {
  db.prepare(
    "UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = ?",
  ).run(userId);
  return findUserById(userId);
}

export function lockUser(userId) {
  db.prepare("UPDATE users SET is_locked = 1 WHERE id = ?").run(userId);
}
