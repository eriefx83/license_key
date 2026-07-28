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

ALTER TABLE licenses
  ADD COLUMN IF NOT EXISTS product_id BIGINT
    REFERENCES products(id) ON DELETE RESTRICT;

UPDATE licenses
SET product_id = products.id
FROM products
WHERE licenses.product_id IS NULL
  AND products.code = 'goldtrap'
  AND LOWER(licenses.product_name) IN ('goldtrap', 'goldtrap ea');

CREATE INDEX IF NOT EXISTS licenses_product_id_index
  ON licenses (product_id);
