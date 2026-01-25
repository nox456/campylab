import 'dotenv/config';
import { client } from './client.js';

// 2. La función asíncrona (porque la red tarda)
async function initDB() {
  try {
    await client.connect(); // Abres la puerta
    console.log("🔗 Conectado...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS pacientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        cedula VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        telefono VARCHAR(15) NOT NULL,
        direccion VARCHAR(255) NOT NULL,
        sexo VARCHAR(1) NOT NULL,
        fecha_nacimiento DATE NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100),
        cedula VARCHAR(15) UNIQUE,
        email VARCHAR(100) UNIQUE NOT NULL,
        telefono VARCHAR(15),
        direccion VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categoria_examen (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        muestra VARCHAR(100) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS examen (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        id_categoria_examen INTEGER NOT NULL REFERENCES categoria_examen(id),
        precio DECIMAL(10, 2) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS detallado_examen (
        id SERIAL PRIMARY KEY,
        id_examen INTEGER NOT NULL REFERENCES examen(id),
        nombre VARCHAR(100) NOT NULL,
        unidad VARCHAR(50) NOT NULL,
        valor_min DECIMAL(10,2) NOT NULL,
        valor_max DECIMAL(10,2) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS consumible (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        descripcion VARCHAR(255) NOT NULL,
        unidad VARCHAR(50) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Ordenes

    await client.query(`
      CREATE TABLE IF NOT EXISTS orden (
        id SERIAL PRIMARY KEY,
        id_paciente INTEGER NOT NULL REFERENCES pacientes(id),
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        total DECIMAL(10, 2) NOT NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'pendiente'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS detalle_orden (
        id SERIAL PRIMARY KEY,
        id_orden INTEGER NOT NULL REFERENCES orden(id) ON DELETE CASCADE,
        id_examen INTEGER NOT NULL REFERENCES examen(id),
        precio DECIMAL(10, 2) NOT NULL
      );
    `);

    // Facturacion

    await client.query(`
      CREATE TABLE IF NOT EXISTS factura (
        id SERIAL PRIMARY KEY,
        nro_control INTEGER NOT NULL,
        cedula VARCHAR(15) NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        direccion VARCHAR(255) NOT NULL,
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        id_orden INTEGER UNIQUE NOT NULL REFERENCES orden(id),
        monto_exento DECIMAL(10, 2) NOT NULL,
        monto_iva DECIMAL(10, 2) NOT NULL,
        total DECIMAL(10, 2) NOT NULL
      );
    `);

    // Resultados

    await client.query(`
      CREATE TABLE IF NOT EXISTS resultado (
        id SERIAL PRIMARY KEY,
        id_orden INTEGER UNIQUE NOT NULL REFERENCES orden(id),
        id_examen INTEGER NOT NULL REFERENCES examen(id),
        id_paciente INTEGER NOT NULL REFERENCES pacientes(id),
        id_usuario INTEGER NOT NULL REFERENCES usuarios(id),
        fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS detalle_resultado (
        id SERIAL PRIMARY KEY,
        id_resultado INTEGER NOT NULL REFERENCES resultado(id),
        nombre VARCHAR(100) NOT NULL,
        unidad VARCHAR(50),
        valor VARCHAR(50) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS consumidos (
        id SERIAL PRIMARY KEY,
        id_resultado INTEGER NOT NULL REFERENCES resultado(id),
        id_consumible INTEGER NOT NULL REFERENCES consumible(id),
        cantidad INTEGER NOT NULL
      );
    `);

    console.log("✅ Tablas creadas");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.end(); // Cierras la puerta (muy importante)
  }
}

initDB();
