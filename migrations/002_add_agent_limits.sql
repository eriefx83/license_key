ALTER TABLE users
  ADD COLUMN IF NOT EXISTS agent_type TEXT NOT NULL DEFAULT 'limited',
  ADD COLUMN IF NOT EXISTS agent_limit INTEGER NOT NULL DEFAULT 5;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_agent_type_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_agent_type_check
      CHECK (agent_type IN ('limited', 'unlimited'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_agent_limit_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_agent_limit_check
      CHECK (agent_limit >= 1);
  END IF;
END
$$;
