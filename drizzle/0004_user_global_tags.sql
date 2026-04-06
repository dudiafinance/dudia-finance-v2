-- Add global tags list to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb;
