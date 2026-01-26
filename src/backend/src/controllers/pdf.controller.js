import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { ordersStorage } from '../storage/orders.storage.js';
import { configStorage } from '../storage/config.storage.js';
import { usersStorage } from '../storage/users.storage.js';

export const pdfController = {
  async generateResultPDF(req, res) {
    try {
      const { id } = req.params;
      // Get full user data for signature
      const tokenUser = req.user;
      let currentUser = null;
      if (tokenUser && tokenUser.userId) {
        currentUser = await usersStorage.findById(tokenUser.userId);
      }

      // Fetch order with all details
      const order = await ordersStorage.findById(id);
      if (!order) {
        return res.status(404).json({ error: 'Orden no encontrada' });
      }

      // Fetch company info
      const companyName = await configStorage.get('empresa_nombre') || 'Laboratorio Clínico';
      const companyAddress = await configStorage.get('empresa_direccion') || '';
      const companyPhone = await configStorage.get('empresa_telefono') || '';
      const companyRIF = await configStorage.get('empresa_rif') || '';
      const companyCode = await configStorage.get('empresa_codigo') || '';

      // Create PDF document
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

      // Format date for filename (YYYY-MM-DD)
      const dateForFilename = new Date(order.fecha).toISOString().split('T')[0];
      const sanitizedPatientName = order.paciente_nombre.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
      
      const filename = `Reporte_${sanitizedPatientName}_${dateForFilename}.pdf`;

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      // Pipe PDF to response
      doc.pipe(res);

      await buildPDFContent(doc, order, { companyName, companyAddress, companyPhone, companyRIF, companyCode }, currentUser);

      // Finalize PDF
      doc.end();

    } catch (e) {
      console.error('Error generating PDF:', e);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error generando PDF' });
      }
    }
  },

  async emailResultPDF(req, res) {
    try {
      const { id } = req.params;
      const { targetEmail } = req.body; // Optional override
      
      // Get full user data for signature
      const tokenUser = req.user;
      let currentUser = null;
      if (tokenUser && tokenUser.userId) {
        currentUser = await usersStorage.findById(tokenUser.userId);
      }

      const order = await ordersStorage.findById(id);
      if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

      // Determine recipient
      const recipient = targetEmail || order.paciente_email;
      if (!recipient) {
          return res.status(400).json({ error: 'El paciente no tiene correo registrado y no se proporcionó uno alternativo.' });
      }

      // Fetch company info
      const companyName = await configStorage.get('empresa_nombre') || 'Laboratorio Clínico';
      const companyAddress = await configStorage.get('empresa_direccion') || '';
      const companyPhone = await configStorage.get('empresa_telefono') || '';
      const companyRIF = await configStorage.get('empresa_rif') || '';
      const companyCode = await configStorage.get('empresa_codigo') || '';

      // SMTP Config
      const host = await configStorage.get('smtp_host');
      const port = await configStorage.get('smtp_port');
      const user = await configStorage.get('smtp_user');
      const pass = await configStorage.get('smtp_pass');
      
      if (!host || !user || !pass) {
          return res.status(500).json({ error: 'Configuración SMTP incompleta en el sistema.' });
      }

      // Generate PDF to Buffer
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      
      const pdfBufferPromise = new Promise((resolve, reject) => {
          doc.on('end', () => {
              const pdfData = Buffer.concat(buffers);
              resolve(pdfData);
          });
          doc.on('error', reject);
      });

      // --- LOGIC reused (simplified duplicate for now to avoid breaking existing flow, ideally helper) ---
      // For speed in this interaction, I will duplicate the drawing logic inside a helper if I could, 
      // but to ensure reliability I will just paste the logic here or create a helper above.
      
      // Actually, let's use a helper function to avoid massive duplication.
      await buildPDFContent(doc, order, { companyName, companyAddress, companyPhone, companyRIF, companyCode }, currentUser);
      
      doc.end();
      const pdfBuffer = await pdfBufferPromise;

      // Send Email
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
          host,
          port: parseInt(port) || 587,
          secure: (parseInt(port) === 465), // true for 465, false for others usually
          auth: { user, pass }
      });

      const dateForFilename = new Date(order.fecha).toISOString().split('T')[0];
      const sanitizedPatientName = order.paciente_nombre.replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_');
      const filename = `Resultados_${sanitizedPatientName}_${dateForFilename}.pdf`;

      await transporter.sendMail({
          from: `"${companyName}" <${user}>`,
          to: recipient,
          subject: `Resultados de Laboratorio - Orden #${order.id}`,
          text: `Estimado(a) ${order.paciente_nombre},\n\nAdjunto encontrará los resultados de sus exámenes de laboratorio correspondientes a la orden #${order.id} de fecha ${order.fecha}.\n\nAtentamente,\n${companyName}`,
          attachments: [
              {
                  filename: filename,
                  content: pdfBuffer
              }
          ]
      });

      res.json({ success: true, message: `Correo enviado a ${recipient}` });

    } catch (e) {
      // Handle known Nodemailer errors without spamming console
      if (e.code === 'EAUTH') {
          return res.status(502).json({ 
              error: 'Error de autenticación SMTP. Revise el usuario y contraseña en Configuración. (Recuerde usar App Password para Gmail)' 
          });
      }
      if (e.code === 'ESOCKET') {
           return res.status(502).json({
               error: 'Error de conexión con el servidor de correo. Revise el Host y Puerto.'
           });
      }

      // Log only unexpected errors
      console.error('Error emailing PDF:', e);
      res.status(500).json({ error: 'Error enviando correo: ' + e.message });
    }
  }
};

// Helper function to draw content
async function buildPDFContent(doc, order, company, currentUser) {
      // --- LOGO ---
      const logoPathBase = path.join(process.cwd(), 'assets', 'logo');
      let logoFile = null;
      try {
        if (fs.existsSync(logoPathBase)) {
          const logoFiles = fs.readdirSync(logoPathBase);
          logoFile = logoFiles.find(f => f.startsWith('logo.') && (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')));
          
          if (logoFile) {
            doc.image(path.join(logoPathBase, logoFile), 50, 45, { width: 80 });
          }
        }
      } catch (imgError) {
        // console.error("Error cargando logo", imgError.message);
      }

      // HEADER
      const headerY = logoFile ? 55 : 50;
      doc.y = headerY;
      
      doc.fontSize(18).font('Helvetica-Bold').text(company.companyName, { align: 'center' });
      doc.moveDown(0.5);

      const rightX = doc.page.width - 50 - 200;
      doc.fontSize(9).font('Helvetica');
      if (company.companyAddress) doc.text(`Dirección: ${company.companyAddress}`, rightX, doc.y, { width: 200, align: 'right' });
      if (company.companyPhone) doc.text(`Teléfono: ${company.companyPhone}`, rightX, doc.y, { width: 200, align: 'right' });
      if (company.companyRIF) doc.text(`RIF: ${company.companyRIF}`, rightX, doc.y, { width: 200, align: 'right' });

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(1);

      // PATIENT
      doc.x = 50; 
      doc.fontSize(11).font('Helvetica-Bold').text('DATOS DEL PACIENTE', 50, doc.y, { 
        width: doc.page.width - 100, align: 'center', underline: true 
      });
      doc.moveDown(1);

      doc.fontSize(10).font('Helvetica');
      const dataY = doc.y;
      doc.text(`Nombre: ${order.paciente_nombre}`, 50, dataY);
      doc.text(`CI: ${order.paciente_cedula}`, 50, dataY + 15);
      
      const birthDate = new Date(order.paciente_nacimiento);
      const age = Math.floor((new Date() - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
      doc.text(`Edad: ${age} años`, 250, dataY);
      doc.text(`Sexo: ${order.paciente_sexo}`, 250, dataY + 15);

      const orderDate = new Date(order.fecha).toLocaleDateString('es-VE', { timeZone: 'UTC' });
      doc.text(`Fecha: ${orderDate}`, 400, dataY);

      doc.y = dataY + 40;
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown(1);

      // RESULTS
      if (order.exams && order.exams.length > 0) {
        for (const exam of order.exams) {
          doc.x = 50;
          doc.fontSize(12).font('Helvetica-Bold').text(exam.examen_nombre.toUpperCase(), 50, doc.y, { align: 'left' });
          doc.moveDown(0.3);
          
          if (exam.muestra) {
            doc.x = 50;
            doc.fontSize(9).font('Helvetica').text(`Muestra: ${exam.muestra}`, 50, doc.y, { oblique: true });
            doc.moveDown(0.5);
          }

          const tableTop = doc.y;
          const col1X = 50; const col2X = 250; const col3X = 380; const col4X = 450;

          doc.fontSize(9).font('Helvetica-Bold');
          doc.text('Parámetro', col1X, tableTop);
          doc.text('Resultado', col2X, tableTop);
          doc.text('Unidades', col3X, tableTop);
          doc.text('Rango Normal', col4X, tableTop);

          doc.moveDown(0.3);
          doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
          doc.moveDown(0.3);

          doc.font('Helvetica');
          if (exam.resultados && exam.resultados.length > 0) {
            for (const param of exam.resultados) {
              const rowY = doc.y;
              doc.text(param.nombre, col1X, rowY, { width: 180 });
              doc.text(param.valor || '-', col2X, rowY, { width: 110 });
              doc.text(param.unidad || '', col3X, rowY, { width: 60 });
              const rangoText = param.min && param.max ? `${param.min} - ${param.max}` : '-';
              doc.text(rangoText, col4X, rowY, { width: 100 });
              doc.moveDown(0.8);
            }
          } else {
            doc.x = 50; doc.text('Sin resultados cargados', 50, doc.y, { oblique: true });
            doc.moveDown();
          }
          doc.moveDown(1.5);
        }
      } else {
        doc.x = 50; doc.fontSize(10).text('No hay exámenes asociados.', 50, doc.y, { oblique: true });
      }

      // SIGNATURE
      doc.moveDown(3);
      if (currentUser && currentUser.username) {
          const sigPath = path.join(process.cwd(), 'assets', 'firmas', `firma_${currentUser.username}.png`);
          try {
            if (fs.existsSync(sigPath)) {
                doc.image(sigPath, 50, doc.y, { width: 150 });
                doc.y += 80; 
            } else { doc.moveDown(4); }
          } catch (e) { doc.moveDown(4); }
      } else { doc.moveDown(4); }

      doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
      doc.moveDown(0.3);
      doc.x = 50;
      doc.fontSize(9).font('Helvetica').text('Firma del Bioanalista', 50, doc.y, { align: 'left' });
}
