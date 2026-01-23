import { Client } from "pg";

export const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon requiere conexión encriptada
});
