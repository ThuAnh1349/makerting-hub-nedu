/**
 * PostgreSQL connection pool via the `pg` library.
 * Exports a `db` object with `query` and `getClient` helpers.
 */

import pg from "pg";
import { env } from "../config/env.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // Conservative pool defaults — tune in production via env vars if needed.
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  // SSL required for hosted Postgres (e.g. Supabase, RDS).
  ssl:
    env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

// Surface pool-level errors without crashing the process.
pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

// Verify the connection at startup so misconfiguration fails fast.
pool
  .query("SELECT 1")
  .then(() => console.log("[DB] PostgreSQL connection pool established."))
  .catch((err: Error) => {
    console.error("[DB] Failed to connect to PostgreSQL:", err.message);
    // Crash intentionally — the server is useless without a DB.
    process.exit(1);
  });

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number | null;
  command: string;
}

export const db = {
  /**
   * Execute a parameterised SQL query against the pool.
   *
   * @example
   * const { rows } = await db.query<{ id: string }>(
   *   'SELECT id FROM persons WHERE supabase_uid = $1',
   *   [uid]
   * );
   */
  async query<T = Record<string, unknown>>(
    text: string,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    if (env.NODE_ENV !== "production") {
      console.debug(
        `[DB] query executed in ${duration}ms | rows: ${result.rowCount ?? 0}`
      );
    }

    return {
      rows: result.rows,
      rowCount: result.rowCount,
      command: result.command,
    };
  },

  /**
   * Acquire a dedicated client from the pool for manual transaction control.
   * ALWAYS release the client in a `finally` block.
   *
   * @example
   * const client = await db.getClient();
   * try {
   *   await client.query('BEGIN');
   *   await client.query('INSERT INTO ...');
   *   await client.query('COMMIT');
   * } catch (err) {
   *   await client.query('ROLLBACK');
   *   throw err;
   * } finally {
   *   client.release();
   * }
   */
  async getClient(): Promise<pg.PoolClient> {
    return pool.connect();
  },

  /**
   * Gracefully drain the pool. Call on process shutdown.
   */
  async end(): Promise<void> {
    await pool.end();
    console.log("[DB] Connection pool closed.");
  },
};

export type Db = typeof db;
