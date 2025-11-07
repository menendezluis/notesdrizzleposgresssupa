-- Migration: Add Personal Notes feature and RBAC
-- This is a reference SQL file. Use `pnpm db:push` to apply schema changes.

-- Add role column to user table for RBAC
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';

-- Create notes table
CREATE TABLE IF NOT EXISTS "note" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" VARCHAR(256) NOT NULL,
  "content" TEXT NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "is_public" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "note_user_id_idx" ON "note"("user_id");
CREATE INDEX IF NOT EXISTS "note_is_public_idx" ON "note"("is_public");
CREATE INDEX IF NOT EXISTS "note_created_at_idx" ON "note"("created_at" DESC);

-- Comments for documentation
COMMENT ON TABLE "note" IS 'Personal notes with public/private visibility';
COMMENT ON COLUMN "user"."role" IS 'User role for RBAC: user, admin, moderator';
COMMENT ON COLUMN "note"."is_public" IS 'Whether the note is visible to other users';

