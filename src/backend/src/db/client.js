import { Pool } from "pg";

export const client = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon requiere conexión encriptada
});
