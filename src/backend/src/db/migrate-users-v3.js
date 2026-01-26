import 'dotenv/config';
import { client } from './client.js';

async function migrate() {
  try {
    await client.connect();
    console.log("🔗 Conectado para migración v3...");

    // 1. Check if column exists
    const checkRes = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'usuarios' AND column_name = 'username'
    `);

    if (checkRes.rows.length === 0) {
      console.log("⚠️ Columna 'username' no encontrada. Agregándola...");

      // 2. Add column as nullable
      await client.query(`ALTER TABLE usuarios ADD COLUMN username VARCHAR(255);`);
      console.log("✅ Columna 'username' agregada.");

      // 3. Update existing users with a default username (part before @ of email)
      await client.query(`
        UPDATE usuarios
        SET username = SPLIT_PART(email, '@', 1)
        WHERE username IS NULL;
      `);
      console.log("✅ Usuarios existentes actualizados con username por defecto.");

       // 4. Handle duplicates - append ID to duplicates
      await client.query(`
        UPDATE usuarios
        SET username = username || id
        WHERE username IN (
          SELECT username
          FROM usuarios
          GROUP BY username
          HAVING COUNT(*) > 1
        );
      `);
      console.log("✅ Duplicados potenciales resueltos.");


      // 5. Add NOT NULL and UNIQUE constraints
      await client.query(`ALTER TABLE usuarios ALTER COLUMN username SET NOT NULL;`);
      await client.query(`ALTER TABLE usuarios ADD CONSTRAINT usuarios_username_unique UNIQUE (username);`);

      console.log("✅ Restricciones NOT NULL y UNIQUE aplicadas.");

    } else {
      console.log("ℹ️ La columna 'username' ya existe.");
    }

  } catch (error) {
    console.error("❌ Error en migración:", error);
  } finally {
    await client.end();
  }
}

migrate();
