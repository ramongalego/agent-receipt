CREATE INDEX IF NOT EXISTS "team_members_team_id_idx" ON "team_members" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "team_members_user_id_idx" ON "team_members" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "projects_team_id_idx" ON "projects" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "api_keys_key_hash_idx" ON "api_keys" USING btree ("key_hash");
CREATE INDEX IF NOT EXISTS "agent_sessions_project_id_idx" ON "agent_sessions" USING btree ("project_id");
CREATE INDEX IF NOT EXISTS "events_session_id_idx" ON "events" USING btree ("session_id");
