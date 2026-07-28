CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role IN ('admin', 'partner', 'agent', 'customer', 'support')),
  agent_type TEXT NOT NULL DEFAULT 'limited'
    CHECK (agent_type IN ('limited', 'unlimited')),
  agent_limit INTEGER NOT NULL DEFAULT 5
    CHECK (agent_limit >= 1),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique
  ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  license_prefix TEXT NOT NULL UNIQUE
    CHECK (license_prefix ~ '^[A-Z0-9]{2,12}$'),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO products (name, code, license_prefix, status)
VALUES ('GoldTrap', 'goldtrap', 'GTEA', 'active')
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  license_prefix = EXCLUDED.license_prefix,
  status = EXCLUDED.status,
  updated_at = NOW();

CREATE TABLE IF NOT EXISTS licenses (
  id BIGSERIAL PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'revoked')),
  expires_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS licenses_customer_email_index
  ON licenses (LOWER(customer_email));

CREATE INDEX IF NOT EXISTS licenses_created_at_index
  ON licenses (created_at DESC);

CREATE INDEX IF NOT EXISTS licenses_product_id_index
  ON licenses (product_id);
