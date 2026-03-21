-- Create teams table
CREATE TABLE IF NOT EXISTS "teams" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL DEFAULT 'Main Workspace',
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS "team_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  "invited_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create invite_tokens table
CREATE TABLE IF NOT EXISTS "invite_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "role" text NOT NULL,
  "token" text NOT NULL UNIQUE,
  "invited_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "accepted_at" timestamp,
  "expires_at" timestamp NOT NULL
);

-- Add team_id column to projects (nullable initially for migration)
ALTER TABLE "projects" ADD COLUMN "team_id" uuid;

-- Backfill: create a team and membership for every user who owns projects
-- For each distinct user_id in projects, create a team and link projects to it
DO $$
DECLARE
  r RECORD;
  new_team_id uuid;
BEGIN
  FOR r IN SELECT DISTINCT "user_id" FROM "projects" WHERE "user_id" IS NOT NULL
  LOOP
    new_team_id := gen_random_uuid();
    INSERT INTO "teams" ("id", "name", "owner_id") VALUES (new_team_id, 'Main Workspace', r."user_id");
    INSERT INTO "team_members" ("team_id", "user_id", "role", "invited_by") VALUES (new_team_id, r."user_id", 'owner', r."user_id");
    UPDATE "projects" SET "team_id" = new_team_id WHERE "user_id" = r."user_id";
  END LOOP;
END $$;

-- Also create teams for users who have no projects yet
DO $$
DECLARE
  r RECORD;
  new_team_id uuid;
BEGIN
  FOR r IN SELECT "id" FROM "users" WHERE "id" NOT IN (SELECT DISTINCT "owner_id" FROM "teams")
  LOOP
    new_team_id := gen_random_uuid();
    INSERT INTO "teams" ("id", "name", "owner_id") VALUES (new_team_id, 'Main Workspace', r."id");
    INSERT INTO "team_members" ("team_id", "user_id", "role", "invited_by") VALUES (new_team_id, r."id", 'owner', r."id");
  END LOOP;
END $$;

-- Make team_id NOT NULL and add foreign key
ALTER TABLE "projects" ALTER COLUMN "team_id" SET NOT NULL;
ALTER TABLE "projects" ADD CONSTRAINT "projects_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE;

-- Drop the old user_id column from projects
ALTER TABLE "projects" DROP COLUMN "user_id";
