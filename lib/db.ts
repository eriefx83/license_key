import { neon } from "@neondatabase/serverless";

let database: ReturnType<typeof neon> | null = null;
let userProductAccessReady: Promise<void> | null = null;

export function getDb() {
  if (!database) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }

    database = neon(databaseUrl);
  }

  return database;
}

export async function ensureUserProductAccessTable() {
  if (!userProductAccessReady) {
    userProductAccessReady = (async () => {
      const sql = getDb();

      await sql`
        CREATE TABLE IF NOT EXISTS user_product_access (
          user_id BIGINT NOT NULL
            REFERENCES users(id) ON DELETE CASCADE,
          product_id BIGINT NOT NULL
            REFERENCES products(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, product_id)
        )
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS user_product_access_product_id_index
          ON user_product_access (product_id)
      `;
    })().catch((error) => {
      userProductAccessReady = null;
      throw error;
    });
  }

  return userProductAccessReady;
}
