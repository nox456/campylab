import 'dotenv/config';
import { client } from './src/backend/src/db/client.js';

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to DB...");
    
    await client.query("ALTER TABLE consumible ADD COLUMN IF NOT EXISTS stock_minimo INTEGER DEFAULT 0;");
    await client.query("ALTER TABLE consumible ADD COLUMN IF NOT EXISTS lote VARCHAR(50);");
    await client.query("ALTER TABLE consumible ADD COLUMN IF NOT EXISTS fecha_vencimiento DATE;");
    
    console.log("Migration complete: Added inventory columns.");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await client.end();
  }
}

migrate();
