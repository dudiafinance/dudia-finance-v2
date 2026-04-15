WITH duplicate_clerk_ids AS (
  SELECT
    id,
    clerk_id,
    ROW_NUMBER() OVER (
      PARTITION BY clerk_id
      ORDER BY created_at ASC, id ASC
    ) AS row_num
  FROM users
  WHERE clerk_id IS NOT NULL
)
UPDATE users
SET clerk_id = NULL,
    updated_at = NOW()
WHERE id IN (
  SELECT id
  FROM duplicate_clerk_ids
  WHERE row_num > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_id_unique_idx
  ON users (clerk_id)
  WHERE clerk_id IS NOT NULL;
