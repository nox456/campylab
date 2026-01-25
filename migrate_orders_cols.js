import 'dotenv/config';
import { client } from './src/backend/src/db/client.js';

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to DB...");
    
    // Add columns to orden table
    await client.query("ALTER TABLE orden ADD COLUMN IF NOT EXISTS prioridad VARCHAR(50) DEFAULT 'rutina';");
    await client.query("ALTER TABLE orden ADD COLUMN IF NOT EXISTS observaciones TEXT;");
    await client.query("ALTER TABLE orden ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE;");
    
    console.log("Migration complete: Added columns to orden table.");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await client.end();
  }
}

migrate();
