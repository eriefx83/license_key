CREATE TABLE IF NOT EXISTS user_product_access (
  user_id BIGINT NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL
    REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS user_product_access_product_id_index
  ON user_product_access (product_id);
