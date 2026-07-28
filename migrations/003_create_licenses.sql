CREATE TABLE IF NOT EXISTS licenses (
  id BIGSERIAL PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  expires_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS licenses_customer_email_index
  ON licenses (LOWER(customer_email));

CREATE INDEX IF NOT EXISTS licenses_created_at_index
  ON licenses (created_at DESC);
