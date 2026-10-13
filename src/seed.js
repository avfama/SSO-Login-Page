import fs from "node:fs";
import { DB_FILE } from "./config.js";

for (const suffix of ["", "-wal", "-shm", "-journal"]) {
  fs.rmSync(`${DB_FILE}${suffix}`, { force: true });
}

const { db, SEED_USERS } = await import("./db.js");

console.log("Database reset. Seeded users:");
for (const user of SEED_USERS) {
  console.log(`  - ${user.fullName} <${user.email}>`);
}

db.close();
