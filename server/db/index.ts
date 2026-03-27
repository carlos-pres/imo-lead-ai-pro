import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Define it in your environment to connect to PostgreSQL."
  );
}

const useSSL = process.env.PGSSLMODE === "require" || process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
});

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
export type Database = NodePgDatabase<typeof schema>;

export async function testConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    await pool.query("select 1");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";
    return { ok: false, error: message };
  }
}

export { schema, pool };
