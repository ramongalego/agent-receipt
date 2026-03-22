import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read DATABASE_URL from .env manually
const envFile = readFileSync(resolve(__dirname, "../.env"), "utf-8");
const match = envFile.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("DATABASE_URL not found in .env");
  process.exit(1);
}

const sql = neon(match[1].trim());

try {
  await sql`DO $$ BEGIN CREATE TYPE feedback_type AS ENUM('feedback', 'bug', 'support'); EXCEPTION WHEN duplicate_object THEN null; END $$`;
  console.log("Created feedback_type enum (or already exists)");

  await sql`CREATE TABLE IF NOT EXISTS feedback (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type feedback_type NOT NULL,
    message text NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL
  )`;
  console.log("Created feedback table (or already exists)");

  console.log("Done");
} catch (e) {
  console.error("Migration failed:", e.message);
  process.exit(1);
}
