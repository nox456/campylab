import 'dotenv/config';
import { client } from './client.js';
import bcrypt from 'bcrypt';

async function populateDB() {
  try {
    await client.connect();
    console.log("🔗 Conectado para poblar DB...");

    // 1. Limpiar tablas operacionales
    console.log("🧹 Limpiando tablas operacionales...");
    const tables = [
      'detalle_resultado', 'consumidos', 'resultado', 'pagos',
      'detalle_orden', 'orden', 'movimientos_inventario', 'lotes',
      'productos', 'detallado_examen', 'examen', 'categoria_examen', 'pacientes'
    ];
    await client.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);

    // 2. Gestionar Usuarios (Upsert)
    console.log("👥 Gestionando usuarios clave...");
    const requiredUsers = [
      ['cdeabreu', 'Cristian De Abreu', 'cdeabreu@campylab.com', 'admin', '12345678'],
      ['bioanalista', 'Bioanalista Prueba', 'bio@test.com', 'bioanalista', '12345678'],
      ['asistente', 'Asistente Prueba', 'asistente@test.com', 'asistente', '12345678']
    ];

    const userIds = {}; 

    for (const u of requiredUsers) {
      const [username, nombre, email, role, passwordInput] = u;
      let res = await client.query('SELECT id FROM usuarios WHERE username = $1', [username]);
      
      if (res.rows.length > 0) {
        userIds[username] = res.rows[0].id;
        userIds[role] = res.rows[0].id; // Fallback mapping
      } else {
        const hashedPassword = passwordInput.startsWith('$2b$') ? passwordInput : await bcrypt.hash(passwordInput, 10);
        res = await client.query(
          `INSERT INTO usuarios (username, nombre, email, role, password, activo, telefono, direccion) 
           VALUES ($1, $2, $3, $4, $5, true, '0000', 'Direccion Prueba') RETURNING id`,
          [username, nombre, email, role, hashedPassword]
        );
        userIds[username] = res.rows[0].id;
        userIds[role] = res.rows[0].id;
      }
    }
    
    // Asignar IDs especificos para lógica posterior
    const adminId = userIds['cdeabreu'];
    const bioId = userIds['bioanalista'];
    const asistId = userIds['asistente'];

    // 3. Crear Categorías y Examenes
    console.log("🧪 Creando exámenes...");
    await client.query(`INSERT INTO categoria_examen (nombre, muestra) VALUES 
      ('Hematología', 'Sangre Total'), ('Química Sanguínea', 'Suero'), ('Uroanálisis', 'Orina'),
      ('Inmunología', 'Suero'), ('Heces', 'Heces')`);

    const exams = [
      ['Hematología Completa', 1, 15.00, [
        ['Hemoglobina', 'g/dL', 12, 16], ['Hematocrito', '%', 36, 48],
        ['Glóbulos Blancos', 'x10^3/µL', 4.5, 11], ['Neutrófilos', '%', 40, 70],
        ['Linfocitos', '%', 20, 50], ['Plaquetas', 'x10^3/µL', 150, 450]
      ]],
      ['Glicemia', 2, 5.00, [['Glucosa', 'mg/dL', 70, 100]]],
      ['Perfil Lipídico', 2, 25.00, [
        ['Colesterol Total', 'mg/dL', 0, 200], ['Triglicéridos', 'mg/dL', 0, 150],
        ['HDL', 'mg/dL', 40, 60], ['LDL', 'mg/dL', 0, 100]
      ]],
      ['Urea y Creatinina', 2, 10.00, [['Urea', 'mg/dL', 10, 50], ['Creatinina', 'mg/dL', 0.6, 1.2]]],
      ['Examen de Orina', 3, 5.00, [
        ['Color', '', 0, 0], ['Aspecto', '', 0, 0], ['pH', '', 5, 8], ['Densidad', '', 1.010, 1.030]
      ]],
      ['VDRL', 4, 8.00, [['VDRL', '', 0, 0]]],
      ['Perfil Tiroideo', 4, 35.00, [['TSH', 'uIU/mL', 0.4, 4.0], ['T3 Libre', 'pg/mL', 2.0, 4.4], ['T4 Libre', 'ng/dL', 0.9, 1.7]]],
      ['Examen de Heces', 5, 5.00, [['Color', '', 0, 0], ['Consistencia', '', 0, 0], ['Parásitos', '', 0, 0]]]
    ];

    const examIds = {};
    const examDetails = {}; // Map examId -> details array
    const examPrice = {}; // Map examId -> price
    const examKeys = ['hema', 'glicemia', 'lipidos', 'renal', 'orina', 'vdrl', 'tiroides', 'heces'];

    let i = 0;
    for (const e of exams) {
      const res = await client.query('INSERT INTO examen (nombre, id_categoria_examen, precio) VALUES ($1, $2, $3) RETURNING id', [e[0], e[1], e[2]]);
      const examId = res.rows[0].id;
      examIds[examKeys[i]] = examId;
      examIds[i] = examId; // Index access
      examPrice[examId] = e[2];
      examDetails[examId] = e[3]; // guardar detalles para generar resultados
      
      for (const d of e[3]) {
        await client.query('INSERT INTO detallado_examen (id_examen, nombre, unidad, valor_min, valor_max) VALUES ($1, $2, $3, $4, $5)', [examId, d[0], d[1], d[2], d[3]]);
      }
      i++;
    }

    // 4. Crear Pacientes (Mas variados)
    console.log("🏥 Creando pacientes...");
    const nombres = ['Juan', 'Maria', 'Carlos', 'Laura', 'Pedro', 'Ana', 'Luis', 'Elena', 'Jose', 'Sofia', 'Miguel', 'Lucia', 'David', 'Carmen', 'Roberto', 'Isabel'];
    const apellidos = ['Perez', 'Rodriguez', 'Gomez', 'Diaz', 'Ruiz', 'Lopez', 'Torres', 'Martinez', 'Sanchez', 'Romero', 'Fernandez', 'Navarro', 'Gil', 'Serrano', 'Molina'];
    
    const pacienteIds = [];
    const numPacientes = 25; // Generar 25 pacientes

    for (let k = 0; k < numPacientes; k++) {
      const nombre = `${nombres[Math.floor(Math.random() * nombres.length)]} ${apellidos[Math.floor(Math.random() * apellidos.length)]}`;
      // Cedula 10M - 30M
      const cedulaNum = Math.floor(Math.random() * (30000000 - 10000000) + 10000000);
      const cedula = `V-${cedulaNum}`;
      const sexo = Math.random() > 0.5 ? 'M' : 'F';
      // Edad variada (1950 - 2005)
      const year = Math.floor(Math.random() * (2005 - 1950) + 1950);
      const month = Math.floor(Math.random() * 12) + 1;
      const day = Math.floor(Math.random() * 28) + 1;
      const dob = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      try {
        const res = await client.query(`
          INSERT INTO pacientes (nombre, cedula, email, telefono, direccion, sexo, fecha_nacimiento)
          VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [nombre, cedula, `p${cedulaNum}@mail.com`, '0412-0000000', 'Valencia', sexo, dob]
        );
        pacienteIds.push(res.rows[0].id);
      } catch (e) {
        // Ignorar duplicados de cedula generada random
      }
    }

    // 5. Inventario
    console.log("📦 Creando inventario...");
    const prods = [
      ['Tubos Lila (EDTA)', 'TUB-LILA', 'Unidad', 'Para hematología', 100],
      ['Tubos Rojo (Seco)', 'TUB-ROJO', 'Unidad', 'Para química', 100],
      ['Reactivo Glicemia', 'REACT-GLU', 'mL', 'Kit Glicemia', 50],
      ['Reactivo Colesterol', 'REACT-CHOL', 'mL', 'Kit Colesterol', 50],
      ['Tiras Orina', 'TIRAS-URI', 'Unidad', 'Frasco 100 tiras', 20],
      ['Alcohol', 'ALC-90', 'Litro', 'Antiséptico', 5]
    ];

    for (const p of prods) {
      const res = await client.query('INSERT INTO productos (nombre, codigo_barras, unidad_medida, descripcion, stock_minimo) VALUES ($1, $2, $3, $4, $5) RETURNING id', p);
      const prodId = res.rows[0].id;
      const loteCode = 'LOTE-' + prodId + '-2026';
      await client.query('INSERT INTO lotes (producto_id, codigo_lote, cantidad_inicial, cantidad_actual, fecha_vencimiento, costo_unitario) VALUES ($1, $2, $3, $4, $5, $6)',
        [prodId, loteCode, 500, 480, '2026-12-31', 2.50]);
    }

    // 6. Ordenes Variadas (Logica Estricta: creado, resultados_cargados, pagado, entregado, cancelado)
    console.log("📝 Generando 50 órdenes variadas...");
    
    // Statuses permitidos
    const statuses = ['creado', 'resultados_cargados', 'pagado', 'entregado', 'cancelado'];
    const priorities = ['rutina', 'urgente'];

    for (let i = 0; i < 50; i++) {
        const pId = pacienteIds[Math.floor(Math.random() * pacienteIds.length)];
        let status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        
        // Examenes
        const numExams = Math.floor(Math.random() * 3) + 1;
        const selectedExams = [];
        for (let j = 0; j < numExams; j++) {
            const keys = Object.keys(examIds).filter(k=> isNaN(k));
            const randomKey = keys[Math.floor(Math.random() * keys.length)];
            if (!selectedExams.includes(randomKey)) selectedExams.push(randomKey);
        }
        if(selectedExams.length === 0) selectedExams.push('hema');

        // Calcular total
        let total = 0;
        const examIdList = [];
        for (const k of selectedExams) {
            const eid = examIds[k];
            total += parseFloat(examPrice[eid]);
            examIdList.push(eid);
        }

        const daysAgo = Math.floor(Math.random() * 30);

        const resOrd = await client.query(`
            INSERT INTO orden (id_paciente, fecha, total, estado, prioridad)
            VALUES ($1, CURRENT_DATE - $2::int, $3, $4, $5)
            RETURNING id`,
            [pId, daysAgo, total, status, priority]
        );
        const orderId = resOrd.rows[0].id;

        // Detalles
        for (const eid of examIdList) {
            await client.query('INSERT INTO detalle_orden (id_orden, id_examen, precio) VALUES ($1, $2, $3)',
            [orderId, eid, examPrice[eid]]);
        }

        // --- LÓGICA DE NEGOCIO ---
        // 'creado': Puede estar pagado o no, pero NO tiene resultados.
        // 'resultados_cargados': TIENE resultados, pero NO está pagado completo (o logica de negocio dice q falta confirmar pago).
        // 'pagado': TIENE resultados Y TIENE pago.
        // 'entregado': TIENE resultados Y TIENE pago.

        let hasResults = false;
        let hasPayment = false;

        if (status === 'creado') {
             // Randomly pay it, but keep status creado because results match logic
             if (Math.random() > 0.5) hasPayment = true; 
        } else if (status === 'resultados_cargados') {
             hasResults = true;
             // No payment, or partial? Lets say No payment to distinguish from pagado
        } else if (status === 'pagado') {
             hasResults = true;
             hasPayment = true;
        } else if (status === 'entregado') {
             hasResults = true;
             hasPayment = true;
        }

        // Insertar Pagos
        if (hasPayment) {
            await client.query('INSERT INTO pagos (orden_id, monto, metodo, referencia, usuario_id) VALUES ($1, $2, $3, $4, $5)',
            [orderId, total, 'Efectivo', `REF-${Math.floor(Math.random()*10000)}`, asistId]);
        }

        // Insertar Resultados
        if (hasResults) {
            for (const eid of examIdList) {
                const results = examDetails[eid];
                if (!results) continue;
                
                const rRes = await client.query(`INSERT INTO resultado (id_orden, id_examen, id_paciente, id_usuario) VALUES ($1, $2, $3, $4) RETURNING id`, 
                    [orderId, eid, pId, bioId]);
                const resultId = rRes.rows[0].id;

                for (const detail of results) {
                    let val = 0;
                    if (detail[2] > 0 && detail[3] > 0) {
                        const min = detail[2]; 
                        const max = detail[3];
                        val = (Math.random() * (max - min) + min).toFixed(2);
                    } else {
                        const options = ['Normal', 'Negativo', 'No se observa', 'Amarillo', 'Claro'];
                        val = options[Math.floor(Math.random() * options.length)];
                    }
                    await client.query(`INSERT INTO detalle_resultado (id_resultado, nombre, unidad, valor) VALUES ($1, $2, $3, $4)`,
                        [resultId, detail[0], detail[1], val.toString()]);
                }
            }
        }
    }

    console.log("✅ Base de datos poblada exitosamente (50 Ordenes variadas).");

  } catch (error) {
    console.error("❌ Error poblando DB:", error);
  } finally {
    await client.end();
  }
}

populateDB();
