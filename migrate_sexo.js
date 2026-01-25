import { client } from './src/backend/src/db/client.js';

async function migrate() {
  try {
    await client.connect();
    console.log('Connected to DB');
    await client.query("ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS sexo VARCHAR(1) NOT NULL DEFAULT 'M';");
    console.log('Migration successful: Added column sexo');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
