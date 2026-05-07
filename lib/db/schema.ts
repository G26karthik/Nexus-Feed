import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ─── Users ──────────────────────────────────────────
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── Sessions ───────────────────────────────────────
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

// ─── Interest Nodes (per user) ──────────────────────
export const interestNodes = sqliteTable("interest_nodes", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  breadcrumb: text("breadcrumb").notNull(),
  parentId: text("parent_id"),
  depth: integer("depth").notNull().default(0),
  isLeaf: integer("is_leaf", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── Daily Digests ──────────────────────────────────
export const digests = sqliteTable("digests", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nodeId: text("node_id")
    .notNull()
    .references(() => interestNodes.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ─── Digest Items ───────────────────────────────────
export const digestItems = sqliteTable("digest_items", {
  id: text("id").primaryKey(),
  digestId: text("digest_id")
    .notNull()
    .references(() => digests.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  sourceUrl: text("source_url").notNull(),
  sourceName: text("source_name"),
  relevanceScore: integer("relevance_score"),
  position: integer("position").notNull(),
});
