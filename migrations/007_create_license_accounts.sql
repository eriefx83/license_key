CREATE TABLE IF NOT EXISTS license_accounts (
  id BIGSERIAL PRIMARY KEY,
  license_id BIGINT NOT NULL
    REFERENCES licenses(id) ON DELETE CASCADE,
  mt5_account_number TEXT NOT NULL
    CHECK (mt5_account_number ~ '^[0-9]{4,20}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (license_id, mt5_account_number)
);

CREATE INDEX IF NOT EXISTS license_accounts_number_index
  ON license_accounts (mt5_account_number);
