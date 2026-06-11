CREATE INDEX IF NOT EXISTS "events_session_id_timestamp_id_idx" ON "events" USING btree ("session_id","timestamp","id");
