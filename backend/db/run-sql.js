// Cross-platform runner for .sql files. Loads DB creds from .env and pipes each
// file through `psql`, so the npm scripts work the same on Windows and Unix
// (no shell-specific $VAR / %VAR% expansion). Requires `psql` on your PATH.
//
//   node db/run-sql.js db/schema.sql [db/seed.sql ...]

import { spawnSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node db/run-sql.js <file.sql> [more.sql ...]");
  process.exit(1);
}

const {
  DB_USER = "postgres",
  DB_PASSWORD = "",
  DB_HOST = "localhost",
  DB_PORT = "5432",
  DB_DATABASE = "moviebooking",
} = process.env;

// psql reads the password from PGPASSWORD, avoiding an interactive prompt.
const env = { ...process.env, PGPASSWORD: DB_PASSWORD };

for (const file of files) {
  console.log(`\n▶ Running ${file} on ${DB_DATABASE}@${DB_HOST}:${DB_PORT}`);
  const result = spawnSync(
    "psql",
    [
      "-h", DB_HOST,
      "-p", DB_PORT,
      "-U", DB_USER,
      "-d", DB_DATABASE,
      "-v", "ON_ERROR_STOP=1", // abort (non-zero exit) on the first SQL error
      "-f", file,
    ],
    { stdio: "inherit", env }
  );

  if (result.error) {
    console.error(`Could not launch psql — is it installed and on your PATH? (${result.error.message})`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\n✗ ${file} failed (exit code ${result.status})`);
    process.exit(result.status);
  }
}

console.log("\n✓ Done.");
