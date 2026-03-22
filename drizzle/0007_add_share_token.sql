ALTER TABLE "agent_sessions" ADD COLUMN "share_token" text UNIQUE;
ALTER TABLE "agent_sessions" ADD COLUMN "share_token_created_at" timestamp;
