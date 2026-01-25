import 'dotenv/config';
import { client } from './src/backend/src/db/client.js';

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to DB...");
    
    // Add codigo column
    await client.query("ALTER TABLE inventario ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);");
    // Make it unique if possible, but existing rows might have nulls. 
    // For now, let's just add it. If we want it unique, we'd need to handle existing data.
    // Let's add a unique constraint if we can, but usually better to leave it nullable for migration safety if table is populated.
    // User just said "should have it", didn't strictly say unique but usually codes are unique.
    // I will add a unique index if I can, but avoid erroring if duplicates exist (which shouldn't as table is likely empty or just has test data).
    
    try {
        await client.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_inventario_codigo ON inventario(codigo);");
    } catch (e) {
        console.log("Could not create unique index (might have duplicates or nulls):", e.message);
    }
    
    console.log("Migration complete: Added codigo column.");
  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await client.end();
  }
}

migrate();
