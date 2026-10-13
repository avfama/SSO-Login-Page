import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const PROJECT_ROOT = path.resolve(__dirname, "..");
export const DATA_DIR = path.join(PROJECT_ROOT, "data");
export const DB_FILE = path.join(DATA_DIR, "wahrden.sqlite");

export const PORT = Number(process.env.PORT) || 3001;

export const SESSION_SECRET =
  process.env.SESSION_SECRET || "wah4c-dev-session-secret-change-me";

export const WAH4C_URL = process.env.WAH4C_URL || "https://wah4c.vercel.app/";

export const MAX_FAILED_ATTEMPTS = 3;
