/**
 * Cloud Function para exportar remisiones a Excel/PDF
 * 
 * Endpoint: POST /exportRemisiones
 * Auth: Requiere Firebase ID token con custom claim 'role'
 * 
 * Body:
 * {
 *   "filtros": {
 *     "fechaInicio": "2024-01-01",
 *     "fechaFin": "2024-12-31", 
 *     "estado": "pendiente",
 *     "movil": "001",
 *     "tecnico": "Juan Pérez"
 *   },
 *   "tipo": "excel" | "pdf",
 *   "incluirHistorial": boolean
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "downloadUrl": "https://storage.googleapis.com/...",
 *   "filename": "remisiones_2024-01-15.xlsx",
 *   "totalRecords": 156,
 *   "expiresAt": "2024-01-16T10:30:00Z"
 * }
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const XLSX = require('xlsx');
const PdfPrinter = require('pdfmake');
const cors = require('cors')({ origin: true });

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const storage = new Storage();

// Configuración
const BUCKET_NAME = functions.config()?.storage?.bucket || 'mi-app-empresa-exports';
const SIGNED_URL_EXPIRES = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Valida el token de Firebase y extrae claims
 */
const validateAuth = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token de autorización requerido');
  }
  
  const token = authHeader.split('Bearer ')[1];
  const decodedToken = await admin.auth().verifyIdToken(token);
  
  // Verificar que el usuario tiene rol válido
  const role = decodedToken.role;
  if (!role || !['tecnico', 'administrativo', 'directivo'].includes(role)) {
    throw new Error('Rol de usuario no autorizado para exportar');
  }
  
  return { uid: decodedToken.uid, role, email: decodedToken.email };
};

/**
 * Convierte filtros de string a formato Firestore
 */
const prepareFilters = (filtros) => {
  const prepared = {};
  
  if (filtros.movil?.trim()) {
    prepared.movil = filtros.movil.trim();
  }
  
  if (filtros.estado?.trim()) {
    prepared.estado = filtros.estado.toLowerCase().trim();
  }
  
  if (filtros.remision?.trim()) {
    const remisionNum = parseInt(filtros.remision.trim());
    if (!isNaN(remisionNum)) {
      prepared.remision = remisionNum;
    }
  }
  
  if (filtros.fechaInicio) {
    prepared.fechaInicio = admin.firestore.Timestamp.fromDate(new Date(filtros.fechaInicio));
  }
  
  if (filtros.fechaFin) {
    prepared.fechaFin = admin.firestore.Timestamp.fromDate(new Date(filtros.fechaFin));
  }
  
  if (filtros.tecnico?.trim()) {
    prepared.tecnico = filtros.tecnico.trim();
  }
  
  return prepared;
};

/**
 * Obtiene remisiones de Firestore aplicando filtros
 */
const fetchRemisiones = async (filtros) => {
  let query = db.collection('remisiones');
  
  // Aplicar filtros
  if (filtros.movil) {
    query = query.where('movil', '==', filtros.movil);
  }
  
  if (filtros.estado) {
    query = query.where('estado', '==', filtros.estado);
  }
  
  if (filtros.remision) {
    query = query.where('remision', '==', filtros.remision);
  }
  
  // Filtros de fecha
  if (filtros.fechaInicio && filtros.fechaFin) {
    query = query
      .where('fecha_remision', '>=', filtros.fechaInicio)
      .where('fecha_remision', '<=', filtros.fechaFin);
  } else if (filtros.fechaInicio) {
    query = query.where('fecha_remision', '>=', filtros.fechaInicio);
  } else if (filtros.fechaFin) {
    query = query.where('fecha_remision', '<=', filtros.fechaFin);
  }
  
  query = query.orderBy('fecha_remision', 'desc');
  
  const snapshot = await query.get();
  let docs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    fecha_remision: doc.data().fecha_remision?.toDate?.() || doc.data().fecha_remision
  }));
  
  // Filtro post-query por técnico (porque requiere lógica compleja)
  if (filtros.tecnico) {
    docs = docs.filter(doc => {
      if (doc.tecnicos && Array.isArray(doc.tecnicos)) {
        return doc.tecnicos.some(tecnico =>
          tecnico.nombre?.toLowerCase().includes(filtros.tecnico.toLowerCase())
        );
      }
      
      // Fallback a campos legacy
      for (let i = 1; i <= 10; i++) {
        const tecnicoField = doc[`tecnico${i}`];
        if (tecnicoField?.toLowerCase?.().includes(filtros.tecnico.toLowerCase())) {
          return true;
        }
      }
      return false;
    });
  }
  
  return docs;
};

/**
 * Obtiene historial de una remisión específica
 */
const fetchHistorial = async (remisionId) => {
  const historialRef = db.collection('remisiones').doc(remisionId).collection('historial');
  const snapshot = await historialRef.orderBy('fechaActividad', 'desc').get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    fechaActividad: doc.data().fechaActividad?.toDate?.() || doc.data().fechaActividad
  }));
};

/**
 * Formatea datos para exportación
 */
const formatDataForExport = (remisiones, incluirHistorial = false) => {
  const rows = [];
  
  remisiones.forEach(remision => {
    // Formatear servicios y técnicos
    const servicios = remision.servicios?.map(s => s.nombre).join(', ') || 
                     [1,2,3,4,5].map(i => remision[`servicio${i}`]).filter(Boolean).join(', ');
    
    const tecnicos = remision.tecnicos?.map(t => t.nombre).join(', ') || 
                     [1,2,3,4,5].map(i => remision[`tecnico${i}`]).filter(Boolean).join(', ');
    
    const baseRow = {
      'ID': remision.id,
      'Remisión': remision.remision || '',
      'Fecha': remision.fecha_remision instanceof Date 
        ? remision.fecha_remision.toLocaleDateString('es-CO')
        : remision.fecha_remision,
      'Móvil': remision.movil || '',
      'Estado': remision.estado || '',
      'Cliente': remision.cliente || '',
      'Dirección': remision.direccion || '',
      'Servicios': servicios,
      'Técnicos': tecnicos,
      'Subtotal': remision.subtotal || 0,
      'IVA': remision.iva || 0,
      'Total': remision.total || 0,
      'Observaciones': remision.observaciones || '',
      'Autorizado por': remision.autorizo || '',
      'Migrado en': remision.migratedAt instanceof Date 
        ? remision.migratedAt.toLocaleDateString('es-CO')
        : remision.migratedAt || ''
    };
    
    rows.push(baseRow);
  });
  
  return rows;
};

/**
 * Genera archivo Excel
 */
const generateExcel = (data, filename) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Configurar ancho de columnas
  const columnWidths = [
    { wch: 15 }, // ID
    { wch: 12 }, // Remisión
    { wch: 12 }, // Fecha
    { wch: 8 },  // Móvil
    { wch: 12 }, // Estado
    { wch: 25 }, // Cliente
    { wch: 30 }, // Dirección
    { wch: 40 }, // Servicios
    { wch: 25 }, // Técnicos
    { wch: 12 }, // Subtotal
    { wch: 10 }, // IVA
    { wch: 12 }, // Total
    { wch: 30 }, // Observaciones
    { wch: 20 }, // Autorizado por
    { wch: 12 }  // Migrado en
  ];
  
  worksheet['!cols'] = columnWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Remisiones');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Genera archivo PDF
 */
const generatePdf = (data, filtros) => {
  const fonts = {
    Roboto: {
      normal: 'fonts/Roboto-Regular.ttf',
      bold: 'fonts/Roboto-Medium.ttf',
      italics: 'fonts/Roboto-Italic.ttf',
      bolditalics: 'fonts/Roboto-MediumItalic.ttf'
    }
  };
  
  const printer = new PdfPrinter(fonts);
  
  // Encabezado del reporte
  const docDefinition = {
    content: [
      {
        text: 'Reporte de Remisiones',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      {
        text: `Generado el: ${new Date().toLocaleDateString('es-CO')}`,
        alignment: 'right',
        margin: [0, 0, 0, 10]
      },
      {
        text: 'Filtros aplicados:',
        style: 'subheader',
        margin: [0, 10, 0, 5]
      },
      {
        ul: [
          filtros.fechaInicio ? `Fecha inicio: ${new Date(filtros.fechaInicio.toDate()).toLocaleDateString('es-CO')}` : null,
          filtros.fechaFin ? `Fecha fin: ${new Date(filtros.fechaFin.toDate()).toLocaleDateString('es-CO')}` : null,
          filtros.estado ? `Estado: ${filtros.estado}` : null,
          filtros.movil ? `Móvil: ${filtros.movil}` : null,
          filtros.tecnico ? `Técnico: ${filtros.tecnico}` : null
        ].filter(Boolean),
        margin: [0, 0, 0, 20]
      },
      {
        table: {
          headerRows: 1,
          widths: ['auto', 'auto', 'auto', '*', 'auto', 'auto'],
          body: [
            ['Remisión', 'Fecha', 'Móvil', 'Cliente', 'Estado', 'Total'],
            ...data.map(row => [
              row['Remisión'],
              row['Fecha'],
              row['Móvil'],
              row['Cliente'],
              row['Estado'],
              `$${(row['Total'] || 0).toLocaleString('es-CO')}`
            ])
          ]
        },
        layout: 'lightHorizontalLines'
      }
    ],
    styles: {
      header: {
        fontSize: 18,
        bold: true
      },
      subheader: {
        fontSize: 14,
        bold: true
      }
    },
    defaultStyle: {
      fontSize: 10
    }
  };
  
  return printer.createPdfKitDocument(docDefinition);
};

/**
 * Sube archivo a Cloud Storage y genera URL firmada
 */
const uploadToStorage = async (buffer, filename, contentType) => {
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(`exports/${filename}`);
  
  await file.save(buffer, {
    metadata: {
      contentType,
      cacheControl: 'no-cache'
    }
  });
  
  // Generar URL firmada válida por 24 horas
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + SIGNED_URL_EXPIRES
  });
  
  return signedUrl;
};

/**
 * Cloud Function principal
 */
exports.exportRemisiones = functions.https.onRequest(async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Validar método
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
      }
      
      // Validar autenticación
      const user = await validateAuth(req);
      
      // Extraer parámetros del body
      const { filtros = {}, tipo = 'excel', incluirHistorial = false } = req.body;
      
      if (!['excel', 'pdf'].includes(tipo)) {
        return res.status(400).json({ error: 'Tipo de exportación no válido. Use "excel" o "pdf"' });
      }
      
      console.log(`Export request by ${user.email} (${user.role}): ${tipo}, filters:`, filtros);
      
      // Preparar filtros y obtener datos
      const preparedFilters = prepareFilters(filtros);
      const remisiones = await fetchRemisiones(preparedFilters);
      
      if (remisiones.length === 0) {
        return res.status(404).json({ 
          error: 'No se encontraron remisiones con los filtros especificados' 
        });
      }
      
      // TODO: Implementar incluirHistorial si se requiere
      if (incluirHistorial) {
        console.log('Nota: incluirHistorial no implementado en esta versión');
      }
      
      // Formatear datos
      const formattedData = formatDataForExport(remisiones, incluirHistorial);
      
      // Generar archivo según tipo
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const filename = `remisiones_${timestamp}.${tipo === 'excel' ? 'xlsx' : 'pdf'}`;
      
      let fileBuffer;
      let contentType;
      
      if (tipo === 'excel') {
        fileBuffer = generateExcel(formattedData, filename);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        // Para PDF necesitaríamos configurar las fuentes primero
        return res.status(501).json({ error: 'Exportación PDF en desarrollo' });
      }
      
      // Subir a Cloud Storage
      const downloadUrl = await uploadToStorage(fileBuffer, filename, contentType);
      
      // Respuesta exitosa
      const response = {
        success: true,
        downloadUrl,
        filename,
        totalRecords: remisiones.length,
        appliedFilters: preparedFilters,
        generatedBy: user.email,
        generatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SIGNED_URL_EXPIRES).toISOString()
      };
      
      console.log(`Export completed: ${filename}, ${remisiones.length} records`);
      
      res.status(200).json(response);
      
    } catch (error) {
      console.error('Export error:', error);
      
      if (error.message.includes('Token') || error.message.includes('autorizado')) {
        return res.status(401).json({ error: error.message });
      }
      
      res.status(500).json({ 
        error: 'Error interno del servidor al generar exportación',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
});
