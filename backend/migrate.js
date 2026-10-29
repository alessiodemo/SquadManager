import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './db.js'

const migrationsDirectory = join(dirname(fileURLToPath(import.meta.url)), 'migrations')

export async function runMigrations() {
  const client = await pool.connect()

  try {
    await client.query('SELECT pg_advisory_lock($1)', [738291])
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    const migrations = (await readdir(migrationsDirectory))
      .filter((file) => file.endsWith('.sql'))
      .sort()

    for (const migration of migrations) {
      const { rowCount } = await client.query(
        'SELECT 1 FROM schema_migrations WHERE version = $1',
        [migration],
      )

      if (rowCount > 0) continue

      const sql = await readFile(join(migrationsDirectory, migration), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [migration],
        )
        await client.query('COMMIT')
        console.info(`[migrations] Applied ${migration}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw new Error(`Migration ${migration} failed: ${error.message}`, { cause: error })
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [738291]).catch(() => {})
    client.release()
  }
}
