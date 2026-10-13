import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const IS_SERVERLESS = Boolean(process.env.VERCEL);

export const PROJECT_ROOT = path.resolve(__dirname, "..");

// Serverless platforms (Vercel) mount the project read-only; only /tmp is
// writable. Locally we keep the SQLite file in ./data.
export const DATA_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), "wahrden")
  : path.join(PROJECT_ROOT, "data");

export const DB_FILE = path.join(DATA_DIR, "wahrden.sqlite");

export const PORT = Number(process.env.PORT) || 3001;

export const SESSION_SECRET =
  process.env.SESSION_SECRET || "wah4c-dev-session-secret-change-me";

export const WAH4C_URL = process.env.WAH4C_URL || "https://wah4c.vercel.app/";

export const MAX_FAILED_ATTEMPTS = 3;
