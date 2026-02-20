import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

let pool: Pool;

if (process.env.DATABASE_URL) {
  // Modo connection string (ex: produção futura ou outro provider)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
} else {
  // Modo variáveis separadas (Railway private network)
  pool = new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });
}

export const db = drizzle(pool, { schema });