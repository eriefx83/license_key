ALTER TABLE products
  ADD COLUMN IF NOT EXISTS license_prefix TEXT;

UPDATE products
SET license_prefix = 'GTEA',
    updated_at = NOW()
WHERE code = 'goldtrap';

ALTER TABLE products
  ALTER COLUMN license_prefix SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_license_prefix_unique
  ON products (license_prefix);
