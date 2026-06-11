ALTER TABLE "agent_sessions" ADD COLUMN IF NOT EXISTS "share_token" text UNIQUE;
ALTER TABLE "agent_sessions" ADD COLUMN IF NOT EXISTS "share_token_created_at" timestamp;
