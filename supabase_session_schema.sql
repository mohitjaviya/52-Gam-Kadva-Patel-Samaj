-- Run this in your Supabase SQL Editor to enable persistent sessions

CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Optional: Create an index on expire for faster lookups during cleanup
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- Disable Row Level Security (RLS) since backend uses service key
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
