import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

// Auth.js tables

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  stripeCustomerId: text("stripe_customer_id"),
  stripePriceId: text("stripe_price_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCurrentPeriodEnd: timestamp("stripe_current_period_end", {
    mode: "date",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = pgTable("auth_sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").unique().notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

// Domain tables

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  lastUsedAt: timestamp("last_used_at", { mode: "date" }),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const agentSessions = pgTable("agent_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .references(() => projects.id, { onDelete: "cascade" })
    .notNull(),
  externalId: text("external_id"),
  name: text("name"),
  status: text("status", { enum: ["running", "completed", "failed"] })
    .default("running")
    .notNull(),
  metadata: jsonb("metadata"),
  receiptHash: text("receipt_hash"),
  summary: text("summary"),
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .references(() => agentSessions.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type", {
    enum: ["llm_call", "tool_call", "decision", "error", "custom"],
  }).notNull(),
  name: text("name").notNull(),
  input: jsonb("input"),
  output: jsonb("output"),
  metadata: jsonb("metadata"),
  durationMs: integer("duration_ms"),
  hash: text("hash").notNull(),
  previousHash: text("previous_hash"),
  timestamp: timestamp("timestamp", { mode: "date" }).defaultNow().notNull(),
});
