import { sql, relations } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";

export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Personal Notes Schema
export const Note = pgTable("note", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  isPublic: t.boolean().notNull().default(false),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreateNoteSchema = createInsertSchema(Note, {
  title: z.string().min(1, "Title is required").max(256),
  content: z.string().min(1, "Content is required"),
  isPublic: z.boolean().optional(),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateNoteSchema = createInsertSchema(Note, {
  title: z.string().min(1, "Title is required").max(256).optional(),
  content: z.string().min(1, "Content is required").optional(),
  isPublic: z.boolean().optional(),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

// Relations
export const noteRelations = relations(Note, ({ one }) => ({
  user: one(user, {
    fields: [Note.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  notes: many(Note),
}));

export * from "./auth-schema";
