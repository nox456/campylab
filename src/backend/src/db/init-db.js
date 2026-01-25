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
        fecha_nacimiento DATE NOT NULL,
        activo BOOLEAN NOT NULL DEFAULT TRUE
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
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        codigo_barras VARCHAR(100) UNIQUE,
        unidad_medida VARCHAR(50) NOT NULL,
        descripcion VARCHAR(255),
        stock_minimo INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lotes (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
        codigo_lote VARCHAR(100),
        fecha_entrada DATE NOT NULL DEFAULT CURRENT_DATE,
        fecha_vencimiento DATE,
        cantidad_inicial INTEGER NOT NULL,
        cantidad_actual INTEGER NOT NULL,
        costo_unitario DECIMAL(10, 2)
      );
    `);

    // Ordenes

    await client.query(`
      CREATE TABLE IF NOT EXISTS orden (
        id SERIAL PRIMARY KEY,
        id_paciente INTEGER NOT NULL REFERENCES pacientes(id),
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        total DECIMAL(10, 2) NOT NULL,
        estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
        prioridad VARCHAR(50) DEFAULT 'rutina',
        observaciones TEXT,
        activo BOOLEAN DEFAULT TRUE
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
        id_orden INTEGER NOT NULL REFERENCES orden(id),
        id_examen INTEGER NOT NULL REFERENCES examen(id),
        id_paciente INTEGER NOT NULL REFERENCES pacientes(id),
        id_usuario INTEGER NOT NULL REFERENCES usuarios(id),
        fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(id_orden, id_examen)
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
        id_lote INTEGER NOT NULL REFERENCES lotes(id),
        cantidad INTEGER NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS movimientos_inventario (
        id SERIAL PRIMARY KEY,
        producto_id INTEGER NOT NULL REFERENCES productos(id),
        lote_id INTEGER REFERENCES lotes(id),
        tipo VARCHAR(50) NOT NULL,
        cantidad INTEGER NOT NULL,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        referencia VARCHAR(255),
        usuario_id INTEGER REFERENCES usuarios(id)
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
