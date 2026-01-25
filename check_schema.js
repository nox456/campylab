import { client } from './src/backend/src/db/client.js';

async function checkSchema() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pacientes';
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await client.end();
  }
}

checkSchema();
