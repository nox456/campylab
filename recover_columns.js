import { client } from './src/backend/src/db/client.js';

async function migrate() {
  console.log('Starting migration...');
  try {
    await client.connect();
    console.log('Connected to DB.');
    
    // Add sexo
    await client.query("ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS sexo VARCHAR(1) NOT NULL DEFAULT 'M';");
    console.log('Processed column: sexo');
    
    // Add fecha_nacimiento
    // We default to '2000-01-01' to avoid errors with existing rows if any, then we can drop default if needed
    // But since it's dev, a default value is fine for existing rows.
    await client.query("ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE NOT NULL DEFAULT '2000-01-01';");
    console.log('Processed column: fecha_nacimiento');

    console.log('MIGRATION_COMPLETE');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
    process.exit(0);
  }
}

migrate();
