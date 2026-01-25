import 'dotenv/config';
import { client } from './src/backend/src/db/client.js';

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to DB...");
    await client.query("ALTER TABLE categoria_examen ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;");
    await client.query("ALTER TABLE examen ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;");
    console.log("Migration complete: Added 'activo' columns.");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await client.end();
  }
}

migrate();
