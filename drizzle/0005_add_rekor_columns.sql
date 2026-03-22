ALTER TABLE "agent_sessions" ADD COLUMN "rekor_uuid" text;
ALTER TABLE "agent_sessions" ADD COLUMN "rekor_log_index" integer;
ALTER TABLE "agent_sessions" ADD COLUMN "rekor_anchored_at" timestamp;
ALTER TABLE "agent_sessions" ADD COLUMN "rekor_status" text;
