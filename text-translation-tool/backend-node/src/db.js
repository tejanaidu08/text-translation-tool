/**
 * PostgreSQL client + table bootstrap.
 * Creates translations and favorites tables on first run (mirrors SRS Section 5).
 */
import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

export async function initDB() {
  const client = await pool.connect()
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS translations (
        translation_id  VARCHAR(36)   PRIMARY KEY,
        session_id      VARCHAR(36)   NOT NULL,
        source_text     TEXT          NOT NULL,
        translated_text TEXT          NOT NULL,
        source_language VARCHAR(64)   NOT NULL,
        target_language VARCHAR(64)   NOT NULL,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        history_visible BOOLEAN       NOT NULL DEFAULT TRUE
      );

      CREATE INDEX IF NOT EXISTS idx_translations_session
        ON translations (session_id);

      CREATE TABLE IF NOT EXISTS favorites (
        favorite_id     VARCHAR(36)   PRIMARY KEY,
        translation_id  VARCHAR(36)   NOT NULL UNIQUE
          REFERENCES translations(translation_id) ON DELETE CASCADE,
        created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      );
    `)
    console.log('✅ Database tables ready.')
  } finally {
    client.release()
  }
}
