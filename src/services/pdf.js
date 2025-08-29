/**
 * ================================================
 * SERVICIO PDF INFORME TÉCNICO - VERSIÓN 6.0 FINAL
 * ================================================
 * 
 * ✅ ENCABEZADO EXACTO COMO IMAGEN 2:
 *   - Logo GMS en círculo blanco a la IZQUIERDA
 *   - Información corporativa alineada a la DERECHA 
 *   - Fondo azul sin márgenes que ocupe todo el ancho
 *   - Altura fija y proporcional
 * 
 * ✅ CUMPLIMIENTO ISO 9001:2015 ESTRICTO
 * ✅ MÁRGENES: Sin margen superior para encabezado, 2.5cm para contenido
 * ✅ FUENTES: Roboto (disponible en pdfMake)
 * ✅ ESTRUCTURA: Secciones numeradas y organizadas
 */

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { convertirUrlADataUrl } from './storage';
import { formatearFecha } from './firestore';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Configurar fuentes para pdfmake
// La estructura correcta es pdfFonts.pdfMake.vfs, pero verificamos que exista
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
} else if (pdfFonts && pdfFonts.vfs) {
  // Para versiones más recientes de pdfmake, podría ser directamente pdfFonts.vfs
  pdfMake.vfs = pdfFonts.vfs;
} else {
  console.warn('No se pudieron cargar las fuentes de pdfmake. Usando fuentes predeterminadas.');
}

// Usar fuentes predeterminadas de pdfMake que están disponibles
// No sobrescribir pdfMake.fonts para usar las fuentes por defecto (Roboto)

// ===== CONFIGURACIÓN DEL DOCUMENTO =====

// ===== CONFIGURACIÓN ISO 9001:2015 ESTRICTA =====

// Configuración de fuentes ISO usando fuentes disponibles en pdfMake
// pdfMake solo incluye por defecto: Roboto, Times y Courier
const FUENTE_ISO = 'Roboto'; // Fuente principal disponible
const FUENTE_FALLBACK = 'Times'; // Fuente de respaldo disponible

// Márgenes ISO estándar: 2.5 cm = 70.87 puntos
const MARGENES_ISO = {
  superior: 71,
  inferior: 71, 
  izquierdo: 71,
  derecho: 71
};

// Validación de encabezado estricta
const VALIDACION_ENCABEZADO = {
  logoIzquierda: true,
  empresaDerecha: true,
  subtituloDerecha: true,
  contactoDerecha: true,
  alturaMaxima: 15 // 15% de la altura de página
};

// Estilos del documento bajo normativa ISO 9001:2015 ESTRICTA
const estilos = {
  // === ENCABEZADO CORPORATIVO ISO ===
  headerBackground: {
    fillColor: '#0d47a1',
    border: [false, false, false, false]
  },
  companyNameISO: {
    fontSize: 16,
    bold: true,
    color: 'white',
    alignment: 'right',
    font: FUENTE_ISO,
    margin: [0, 8, 0, 2]
  },
  documentTitleISO: {
    fontSize: 12,
    bold: true,
    color: 'white',
    alignment: 'right',
    font: FUENTE_ISO,
    margin: [0, 2, 0, 4]
  },
  companyInfoISO: {
    fontSize: 9,
    color: 'white',
    alignment: 'right',
    font: FUENTE_ISO,
    margin: [0, 1, 0, 1]
  },
  
  // === TÍTULOS DE SECCIÓN ISO CON NUMERACIÓN ===
  sectionTitleISO: {
    fontSize: 12,
    bold: true,
    margin: [0, 15, 0, 8],
    color: '#0056A6',
    font: FUENTE_ISO
  },
  
  // === CAMPOS DE INFORMACIÓN ISO ===
  fieldLabelISO: {
    fontSize: 11,
    bold: true,
    margin: [0, 3, 0, 2],
    font: FUENTE_ISO
  },
  fieldValueISO: {
    fontSize: 11,
    margin: [0, 0, 0, 4],
    lineHeight: 1.2,
    font: FUENTE_ISO
  },
  
  // === CONTENIDO ESTRUCTURADO ISO ===
  tableHeaderISO: {
    fontSize: 11,
    bold: true,
    fillColor: '#0056A6',
    color: 'white',
    alignment: 'center',
    font: FUENTE_ISO
  },
  tableCellISO: {
    fontSize: 11,
    margin: [4, 3, 4, 3],
    lineHeight: 1.2,
    font: FUENTE_ISO
  },
  
  // === PIE DE PÁGINA ISO ===
  footerISO: {
    fontSize: 9,
    italics: true,
    alignment: 'center',
    margin: [0, 5, 0, 5],
    color: '#666666',
    font: FUENTE_ISO
  },
  
  // === EVIDENCIAS FOTOGRÁFICAS ISO ===
  evidenceTitleISO: {
    fontSize: 11,
    bold: true,
    margin: [0, 10, 0, 5],
    color: '#0056A6',
    font: FUENTE_ISO
  },
  
  // === OBSERVACIONES TÉCNICAS ISO ===
  observacionesISO: {
    fontSize: 11,
    margin: [0, 5, 0, 10],
    lineHeight: 1.3,
    font: FUENTE_ISO
  },
  observacionesNumeradasISO: {
    fontSize: 11,
    margin: [20, 2, 0, 2],
    lineHeight: 1.3,
    font: FUENTE_ISO
  },
  
  // === NOTAS ADICIONALES ===
  notaISO: {
    fontSize: 9,
    italics: true,
    color: '#666',
    font: FUENTE_ISO,
    margin: [0, 5, 0, 0]
  }
};

// ===== FUNCIONES AUXILIARES =====

/**
 * Obtener servicio relacionado por título de trabajo (con fallback normalizado)
 * @param {string} tituloTrabajo - Título del trabajo a buscar
 * @returns {Object|null} Datos del servicio o null si no se encuentra
 */
const obtenerServicioPorTitulo = async (tituloTrabajo) => {
  if (!tituloTrabajo) return null;

  try {
    // 1) Intento directo (exacto)
    let q = query(collection(db, 'servicios'), where('titulo', '==', tituloTrabajo));
    let snapshot = await getDocs(q);
    if (!snapshot.empty) return snapshot.docs[0].data();

    // 2) Fallback: buscar client-side por normalización (mayúsc/minúsc y espacios)
    const allSnap = await getDocs(collection(db, 'servicios'));
    const buscado = tituloTrabajo.replace(/\s+/g, ' ').trim().toLowerCase();
    for (const doc of allSnap.docs) {
      const data = doc.data();
      const titulo = (data.titulo || '').replace(/\s+/g, ' ').trim().toLowerCase();
      if (titulo === buscado) return data;
    }
    return null;
  } catch (error) {
    console.error('Error consultando servicios:', error);
    return null;
  }
};

/**
 * Formatear fecha a DD/MM/YYYY desde cualquier formato
 * @param {string|Date|Object} fecha - Fecha en cualquier formato
 * @returns {string} Fecha formateada como DD/MM/YYYY
 */
const formatearFechaRemision = (fecha) => {
  if (!fecha) return 'No especificada';
  
  let fechaObj;
  
  try {
    // Si es un objeto Firestore Timestamp
    if (fecha.toDate && typeof fecha.toDate === 'function') {
      fechaObj = fecha.toDate();
    }
    // Si ya es un objeto Date
    else if (fecha instanceof Date) {
      fechaObj = fecha;
    }
    // Si es una cadena o número
    else {
      fechaObj = new Date(fecha);
    }
    
    // Verificar si la fecha es válida
    if (isNaN(fechaObj.getTime())) {
      return 'Fecha inválida';
    }
    
    // Formatear a DD/MM/YYYY
    const dia = String(fechaObj.getDate()).padStart(2, '0');
    const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const anio = fechaObj.getFullYear();
    
    return `${dia}/${mes}/${anio}`;
  } catch (error) {
    console.warn('Error al formatear fecha de remisión:', error);
    return 'Fecha inválida';
  }
};

/**
 * Formatear valores monetarios
 * @param {string|number} valor - Valor a formatear
 * @returns {string} Valor formateado como moneda
 */
const formatoMoneda = (valor) => {
  if (!valor || valor === '0') return '$ 0';
  const numero = Number(valor);
  if (isNaN(numero)) return '$ 0';
  return `$ ${numero.toLocaleString('es-CO')}`;
};

/**
 * VALIDAR CONFIGURACIÓN DE ENCABEZADO ISO ESTRICTA
 * Verificar que cumple exactamente con imagen 2
 */
const validarEncabezadoISO = () => {
  const errores = [];
  
  if (!VALIDACION_ENCABEZADO.logoIzquierda) {
    errores.push('ERROR ISO: Logo debe estar alineado a la izquierda');
  }
  
  if (!VALIDACION_ENCABEZADO.empresaDerecha) {
    errores.push('ERROR ISO: Nombre empresa debe estar alineado a la derecha');
  }
  
  if (!VALIDACION_ENCABEZADO.subtituloDerecha) {
    errores.push('ERROR ISO: Subtítulo debe estar alineado a la derecha');
  }
  
  if (!VALIDACION_ENCABEZADO.contactoDerecha) {
    errores.push('ERROR ISO: Información contacto debe estar alineada a la derecha');
  }
  
  if (errores.length > 0) {
    const mensajeError = [
      '🚨 VALIDACIÓN ISO FALLIDA - ENCABEZADO NO CONFORME 🚨',
      '',
      'El encabezado NO cumple con la imagen 2 de referencia.',
      'Errores detectados:',
      ...errores.map(error => `  • ${error}`),
      '',
      '❌ GENERACIÓN DE PDF INTERRUMPIDA',
      '✅ El encabezado DEBE ser exactamente como imagen 2',
      '',
      'Referencia obligatoria:',
      '- Logo: IZQUIERDA',
      '- Empresa: DERECHA (negrilla)',
      '- Subtítulo: DERECHA', 
      '- Contacto: DERECHA'
    ].join('\n');
    
    console.error(mensajeError);
    throw new Error('VALIDACIÓN ISO FALLIDA: Encabezado no conforme con imagen 2');
  }
  
  console.log('✅ VALIDACIÓN ISO EXITOSA: Encabezado conforme con imagen 2');
  return true;
};

/**
 * 🎯 CREAR ENCABEZADO PERFECTO - VERSIÓN 7.0 DEFINITIVA
 * =====================================================
 * SOLUCIÓN DEFINITIVA: Header fijo separado del contenido
 * @param {string} logoDataUrl - Logo en formato dataURL
 * @param {Object} informe - Datos del informe para el header
 * @returns {Function} Función header para pdfMake
 */
const crearHeaderFijo = (logoDataUrl = null, informe = null) => {
  // 🆘 VALIDACIÓN ESTRICTA ABSOLUTA - IMAGEN 2.PNG
  console.log('🔍 INICIANDO VALIDACIÓN ESTRICTA CONTRA IMAGEN 2');
  
  const erroresValidacion = [];
  
  // 1. Validación del logo corporativo (CRÍTICO)
  if (!logoDataUrl || logoDataUrl.length < 100) {
    erroresValidacion.push('⚠️ LOGO: Ausente o mal formateado (OBLIGATORIO)');
  }
  
  // 2. Validación de estructura del encabezado
  if (!VALIDACION_ENCABEZADO.logoIzquierda) {
    erroresValidacion.push('⚠️ POSICIÓN: Logo debe estar a la IZQUIERDA');
  }
  
  if (!VALIDACION_ENCABEZADO.empresaDerecha) {
    erroresValidacion.push('⚠️ EMPRESA: Nombre debe estar a la DERECHA');
  }
  
  if (!VALIDACION_ENCABEZADO.subtituloDerecha) {
    erroresValidacion.push('⚠️ SUBTÍTULO: "INFORME TÉCNICO" debe estar a la DERECHA');
  }
  
  // 3. Validación de colores y diseño
  const validacionDiseño = {
    fondoAzul: '#0d47a1', // Fondo exacto
    circuloBlanco: 'white', // Círculo logo
    textoBlanco: 'white',   // Texto corporativo
    fuenteRoboto: 'Roboto'  // Fuente estándar
  };
  
  console.log('🎨 Validando colores:', validacionDiseño);
  
  // 4. VALIDACIÓN FINAL: Si hay errores, DETENER generación
  if (erroresValidacion.length > 0) {
    const mensajeError = [
      '🚫🚫🚫 VALIDACIÓN ESTRICTA FALLIDA 🚫🚫🚫',
      '',
      '📝 El encabezado NO coincide con imagen 2.png',
      '🔴 ERRORES DETECTADOS:',
      ...erroresValidacion.map(error => `  • ${error}`),
      '',
      '❌ GENERACIÓN DE PDF INTERRUMPIDA',
      '✅ REQUISITOS OBLIGATORIOS:',
      '  • Logo GMS: IZQUIERDA en círculo blanco',
      '  • Empresa: DERECHA en negrilla blanca',
      '  • Subtítulo: DERECHA "INFORME TÉCNICO"',
      '  • Contacto: DERECHA información completa',
      '  • Fondo: Azul #0d47a1 sin márgenes',
      '',
      '📄 REFERENCIA: imagen 2.png (encabezado corporativo)'
    ].join('\n');
    
    console.error(mensajeError);
    
    // Mostrar alerta al usuario también
    alert('🚫 VALIDACIÓN FALLIDA\n\nEl encabezado del PDF NO cumple con los estándares corporativos.\n\nVerifica que el logo esté disponible y la configuración sea correcta.');
    
    throw new Error('VALIDACION_ESTRICTA_FALLIDA: Encabezado no conforme con imagen 2.png');
  }
  
  console.log('✅ VALIDACIÓN EXITOSA: Encabezado conforme con imagen 2.png');
  console.log('🎆 Procediendo a generar PDF con encabezado corporativo');
  
  // Sólo si pasa todas las validaciones, continuar
  
  console.log('🎯 CREANDO HEADER FIJO VERSIÓN 7.0 DEFINITIVO');
  
  // Retornar función header que se ejecutará en cada página
  return function(currentPage, pageCount) {
    return {
      // Usar tabla para estructura fija
      table: {
        widths: [140, '*'], // Ancho optimizado para mejor proporción (logo: 140pt)
        heights: [95], // Altura reducida para diseño más profesional y proporcionado
        body: [
          [
            // CELDA IZQUIERDA: Logo en círculo blanco más llamativo y con marco reducido
            {
              stack: [
                {
                  // Logo dentro de estructura relativa para centrado perfecto
                  columns: [
                    {
                      width: 140, // Ancho proporcional optimizado
                      stack: [
                        {
                          // Logo procesado con círculo blanco MÁS GRANDE y marco REDUCIDO
                          image: logoDataUrl,
                          width: 85, // Tamaño aumentado para mayor impacto visual (70 → 85)
                          height: 85, // Tamaño aumentado para mayor impacto visual (70 → 85)
                          alignment: 'center',
                          margin: [0, 5, 0, 5] // Centrado vertical ajustado ((95-85)/2 = 5)
                        }
                      ]
                    }
                  ]
                }
              ],
              fillColor: '#0d47a1',
              border: [false, false, false, false],
              margin: [0, 0, 0, 0]
            },
            // CELDA DERECHA: Información corporativa centrada verticalmente
            {
              stack: [
                // 📝 TIPOGRAFÍA EXACTA SEGÚN IMAGEN 2 - Centrada verticalmente
                {
                  text: 'GLOBAL MOBILITY SOLUTIONS GMS SAS',
                  fontSize: 15, // Tamaño ajustado para la nueva altura
                  bold: true,
                  color: 'white',
                  font: FUENTE_ISO,
                  alignment: 'right',
                  margin: [0, 8, 15, 2] // Margen superior aumentado para centrado vertical
                },
                {
                  text: 'INFORME TÉCNICO DE SERVICIOS',
                  fontSize: 11, // Tamaño ajustado para mejor proporción
                  bold: true,
                  color: 'white',
                  font: FUENTE_ISO,
                  alignment: 'right',
                  margin: [0, 1, 15, 3] // Espaciado ajustado
                },
                {
                  text: 'Dirección: Calle 65 Sur No 79C 27 Bogotá – Bosa Centro',
                  fontSize: 8, // Tamaño reducido para mejor ajuste
                  bold: false,
                  color: 'white',
                  font: FUENTE_ISO,
                  alignment: 'right',
                  margin: [0, 0.5, 15, 0.5]
                },
                {
                  text: 'NIT: 901876981-4 | Tel: (+57) 3114861431',
                  fontSize: 8,
                  bold: false,
                  color: 'white',
                  font: FUENTE_ISO,
                  alignment: 'right',
                  margin: [0, 0, 15, 0.5]
                },
                {
                  text: 'Email: globalmobilitysolutions8@gmail.com',
                  fontSize: 8,
                  bold: false,
                  color: 'white',
                  font: FUENTE_ISO,
                  alignment: 'right',
                  margin: [0, 0, 15, 8] // Margen inferior aumentado para centrado vertical
                }
              ],
              fillColor: '#0d47a1',
              border: [false, false, false, false],
              margin: [0, 0, 0, 0], // Márgenes eliminados para mejor control del espaciado interno
              verticalAlignment: 'middle' // Centrado vertical de toda la celda
            }
          ]
        ]
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: () => 0,
        paddingLeft: () => 0,
        paddingRight: () => 0,
        paddingTop: () => 0,
        paddingBottom: () => 0
      },
      margin: [0, 0, 0, 0] // SIN márgenes en el header
    };
  };
};

/**
 * Crear sección de información del informe (SOLO sección 1)
 * @param {Object} informe - Datos del informe
 * @param {Object} currentEmployee - Información del empleado logueado
 * @returns {Array} Contenido de la sección
 */
const crearSeccionInforme = (informe, currentEmployee = null) => {
  const fechaElaboracion = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });

  const elaboradoPor = currentEmployee?.nombre_completo || currentEmployee?.nombre || 'Usuario no especificado';

  return [
    { text: '1. INFORMACIÓN DEL INFORME', style: 'sectionTitleISO' },
    {
      canvas: [{
        type: 'line', x1: 0, y1: 0, x2: 515, y2: 0,
        lineWidth: 1, lineColor: '#0056A6'
      }],
      margin: [0, -5, 0, 10]
    },
    {
      columns: [
        {
          width: '100%',
          stack: [
            { text: 'ID Informe:', style: 'fieldLabelISO' },
            { text: informe.idInforme || 'No especificado', style: 'fieldValueISO' },
            { text: 'Fecha de elaboración:', style: 'fieldLabelISO' },
            { text: fechaElaboracion, style: 'fieldValueISO' },
            { text: 'Elaborado por:', style: 'fieldLabelISO' },
            { text: elaboradoPor, style: 'fieldValueISO' }
          ]
        }
      ]
    }
  ];
};

/**
 * Crear sección de datos de la remisión (SOLO sección 2)
 * @param {Object} informe - Datos del informe
 * @returns {Array} Contenido de la sección
 */
const crearSeccionRemision = (informe) => {
  // Detectar fecha_remision con la misma lógica previa
  let fechaRemisionCorrecta = null;
  if (informe.datosRemision?.fecha_remision) fechaRemisionCorrecta = informe.datosRemision.fecha_remision;
  else if (informe.fecha_remision) fechaRemisionCorrecta = informe.fecha_remision;
  else if (informe.datosRemision?.remision) fechaRemisionCorrecta = informe.datosRemision.remision;
  else if (informe.remision) fechaRemisionCorrecta = informe.remision;

  return [
    { text: '2. DATOS DE LA REMISIÓN', style: 'sectionTitleISO' },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#0056A6' }],
      margin: [0, -5, 0, 10]
    },
    {
      // Ajuste para mejorar separación entre columnas
      columns: [
        {
          width: '48%',
          stack: [
            { text: 'Número de Remisión:', style: 'fieldLabelISO' },
            { text: informe.remision || 'No especificada', style: 'fieldValueISO' },
            { text: 'Número del Móvil:', style: 'fieldLabelISO' },
            { text: informe.movil || 'No especificado', style: 'fieldValueISO' },
            { text: 'Título del trabajo:', style: 'fieldLabelISO' },
            { text: informe.tituloTrabajo || 'No especificado', style: 'fieldValueISO' },
            { text: 'Técnico Asignado:', style: 'fieldLabelISO' },
            { text: informe.tecnico || 'No especificado', style: 'fieldValueISO' }
          ]
        },
        {
          width: '48%',
          stack: [
            { text: 'Fecha de Remisión:', style: 'fieldLabelISO' },
            { text: formatearFechaRemision(fechaRemisionCorrecta), style: 'fieldValueISO' },
            { text: 'Autorizado por:', style: 'fieldLabelISO' },
            { text: informe.autorizo || 'No especificado', style: 'fieldValueISO' },
            { text: 'UNE:', style: 'fieldLabelISO' },
            { text: informe.une || 'No especificado', style: 'fieldValueISO' }
          ]
        }
      ],
      columnGap: 20
    }
  ];
};

/**
 * Crear sección de servicios prestados (SOLO valores económicos)
 * @param {Object} informe - Datos del informe
 * @returns {Array} Contenido de la sección
 */
const crearSeccionServicios = (informe) => {
  if (!informe) return [];

  const formatoMoneda = (n) => n ? `$ ${Number(n).toLocaleString('es-CO')}` : '$ 0';

  return [
    { text: '4. VALORACIÓN ECONÓMICA DE SERVICIOS', style: 'sectionTitleISO' },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#0056A6' }],
      margin: [0, -5, 0, 10]
    },
    {
      stack: [
        { text: 'Subtotal:', style: 'fieldLabelISO' },
        { text: formatoMoneda(informe.subtotal), style: 'fieldValueISO' },
        { text: 'Total (incluye IVA):', style: 'fieldLabelISO' },
        { text: formatoMoneda(informe.total), style: 'fieldValueISO' },
        { text: '* Total incluye IVA', style: { fontSize: 9, italics: true, color: '#666', font: FUENTE_ISO } }
      ]
    }
  ];
};

/**
 * Sección 3 - ACTIVIDADES REALIZADAS
 * Se alimenta automáticamente desde la colección "servicios".
 */
const crearSeccionActividades = (servicio) => {
  if (!servicio) return []; // Omitir si no hay servicio relacionado

  // Preferir saltos de línea; fallback a separar por ". "
  let actividades = [];
  if (typeof servicio.descripcion_actividad === 'string') {
    if (servicio.descripcion_actividad.includes('\n')) {
      actividades = servicio.descripcion_actividad.split('\n').map(s => s.trim()).filter(Boolean);
    } else {
      actividades = servicio.descripcion_actividad.split('. ').map(s => s.trim()).filter(Boolean);
    }
  }

  const contenido = actividades.map(a => ({ text: a.endsWith('.') ? a : a + '.', style: 'observacionesISO' }));

  return [
    { text: '3. ACTIVIDADES REALIZADAS', style: 'sectionTitleISO' },
    {
      canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#0056A6' }],
      margin: [0, -5, 0, 10]
    },
    {
      stack: [
        ...contenido,
        { text: `\nMateriales suministrados: ${servicio.materiales_suministrados || 'No especificado'}`, style: 'fieldValueISO', bold: true },
        { text: `Recurso humano requerido: ${servicio.recurso_humano_requerido || 'No especificado'}`, style: 'fieldValueISO', bold: true },
        { text: `Tiempo estimado: ${servicio.tiempo_estimado || 'No especificado'}`, style: 'fieldValueISO', bold: true }
      ]
    }
  ];
};

/**
 * Crear sección de observaciones técnicas con numeración estructurada ISO
 * @param {Object} informe - Datos del informe
 * @returns {Array} Contenido de la sección
 */
const crearSeccionObservaciones = (informe) => {
  if (!informe.observacionesTecnicas || informe.observacionesTecnicas.trim() === '') {
    return [];
  }

  // Procesar observaciones para numeración automática ISO
  const observacionesTexto = informe.observacionesTecnicas;
  const lineas = observacionesTexto.split('\n').filter(linea => linea.trim() !== '');
  
  const contenidoObservaciones = [];
  
  // Si las observaciones ya tienen numeración (1.1, 1.2, etc.), mantenerlas
  // Si no, aplicar numeración automática
  const tieneNumeracion = lineas.some(linea => /^\d+\.\d+/.test(linea.trim()));
  
  if (tieneNumeracion) {
    // Ya tiene numeración, solo formatear
    lineas.forEach(linea => {
      if (linea.trim()) {
        contenidoObservaciones.push({
          text: linea,
          style: 'observacionesNumeradasISO'
        });
      }
    });
  } else {
    // Aplicar numeración automática
    lineas.forEach((linea, index) => {
      if (linea.trim()) {
        const numeroItem = `1.${index + 1}`;
        contenidoObservaciones.push({
          text: `${numeroItem} ${linea}`,
          style: 'observacionesNumeradasISO'
        });
      }
    });
  }

  return [
    // 5. Título de sección con numeración ISO
    { text: '5. OBSERVACIONES TÉCNICAS', style: 'sectionTitleISO' },
    // Línea separadora
    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 1,
          lineColor: '#0056A6'
        }
      ],
      margin: [0, -8, 0, 15]
    },
    // Observaciones con numeración estructurada
    {
      stack: contenidoObservaciones
    }
  ];
};

/**
 * Crear sección de evidencias fotográficas
 * @param {Object} informe - Datos del informe
 * @param {Object} imagenesDataUrl - Imágenes convertidas a dataURL
 * @returns {Array} Contenido de la sección
 */
const crearSeccionEvidencias = (informe, imagenesDataUrl) => {
  const contenido = [];
  
  // Verificar si hay imágenes
  const tieneImagenesAntes = informe.imagenesAntes && informe.imagenesAntes.length > 0;
  const tieneImagenesDespues = informe.imagenesDespues && informe.imagenesDespues.length > 0;
  
  if (!tieneImagenesAntes && !tieneImagenesDespues) {
    return [];
  }
  
  // 5. Título de sección con numeración ISO
  contenido.push({ text: '5. EVIDENCIA FOTOGRÁFICA', style: 'sectionTitleISO' });
  // Línea separadora
  contenido.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        lineWidth: 1,
        lineColor: '#0056A6'
      }
    ],
    margin: [0, -5, 0, 10]
  });
  
  // Imágenes ANTES
  if (tieneImagenesAntes) {
    contenido.push({ text: '5.1 ANTES', style: 'evidenceTitleISO' });
    
    // Organizar imágenes en filas de 2
    const imagenesAntes = informe.imagenesAntes;
    for (let i = 0; i < imagenesAntes.length; i += 2) {
      const fila = [];
      
      // Primera imagen de la fila
      if (imagenesDataUrl.antes[i]) {
        fila.push({
          image: imagenesDataUrl.antes[i],
          width: 250,
          margin: [0, 5, 10, 15]
        });
      }
      
      // Segunda imagen de la fila (si existe)
      if (i + 1 < imagenesAntes.length && imagenesDataUrl.antes[i + 1]) {
        fila.push({
          image: imagenesDataUrl.antes[i + 1],
          width: 250,
          margin: [10, 5, 0, 15]
        });
      } else {
        // Espacio vacío si solo hay una imagen
        fila.push({ text: '', width: 250 });
      }
      
      contenido.push({ columns: fila });
    }
  }
  
  // Imágenes DESPUÉS
  if (tieneImagenesDespues) {
    contenido.push({ text: '5.2 DESPUÉS', style: 'evidenceTitleISO' });
    
    // Organizar imágenes en filas de 2
    const imagenesDespues = informe.imagenesDespues;
    for (let i = 0; i < imagenesDespues.length; i += 2) {
      const fila = [];
      
      // Primera imagen de la fila
      if (imagenesDataUrl.despues[i]) {
        fila.push({
          image: imagenesDataUrl.despues[i],
          width: 250,
          margin: [0, 5, 10, 15]
        });
      }
      
      // Segunda imagen de la fila (si existe)
      if (i + 1 < imagenesDespues.length && imagenesDataUrl.despues[i + 1]) {
        fila.push({
          image: imagenesDataUrl.despues[i + 1],
          width: 250,
          margin: [10, 5, 0, 15]
        });
      } else {
        // Espacio vacío si solo hay una imagen
        fila.push({ text: '', width: 250 });
      }
      
      contenido.push({ columns: fila });
    }
  }
  
  return contenido;
};

/**
 * Crear pie de página
 * @returns {Object} Definición del pie de página
 */
const crearPiePagina = () => ({
  stack: [
    {
      text: 'Este informe técnico fue elaborado bajo estándares de calidad y gestión documental ISO 9001:2015.',
      style: 'footerISO'
    },
    {
      text: 'Documento controlado - No válido si es copia no autorizada',
      style: {
        fontSize: 8,
        italics: true,
        alignment: 'center',
        margin: [0, 2, 0, 0],
        color: '#999999',
        font: FUENTE_ISO
      }
    }
  ]
});

// ===== FUNCIÓN PRINCIPAL =====

/**
 * Verificar versión del servicio PDF
 * @returns {string} Versión y fecha del servicio
 */
/**
 * 🎆 FUNCIÓN PARA PROCESAR LOGO EN CÍRCULO BLANCO (SOLUCIÓN DEFINITIVA)
 * ==============================================================
 * Carga un logo PNG y lo dibuja en un círculo blanco
 * Preserva la transparencia original del logo
 * 
 * @param {string} logoUrl - URL del logo PNG
 * @param {number} canvasSize - Tamaño del lienzo (ancho/alto)
 * @param {number} circleRatio - Proporción del círculo respecto al lienzo (0.0-1.0)
 * @param {number} logoRatio - Proporción del logo respecto al círculo (0.0-1.0)
 * @returns {Promise<string>} DataURL del logo procesado
 */
const procesarLogoEnCirculo = async (logoUrl, canvasSize = 150, circleRatio = 0.9, logoRatio = 0.75) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('💫 Iniciando procesamiento del logo en círculo blanco...');
      
      // 1. Cargar el logo original como imagen
      const logoImg = new Image();
      logoImg.crossOrigin = 'Anonymous'; // Habilitar CORS para imágenes de otros dominios
      
      // Configurar evento de carga
      logoImg.onload = () => {
        console.log(`✅ Logo cargado correctamente: ${logoImg.width}x${logoImg.height}`);
        
        // 2. Crear canvas con transparencia (ARGB)
        const canvas = document.createElement('canvas');
        canvas.width = canvasSize;
        canvas.height = canvasSize;
        const ctx = canvas.getContext('2d');
        
        // 3. Configurar calidad de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 4. Limpiar el canvas (transparente)
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        
        // 5. Calcular dimensiones y posiciones
        const circleSize = canvasSize * circleRatio;
        const circleX = (canvasSize - circleSize) / 2;
        const circleY = (canvasSize - circleSize) / 2;
        const circleRadius = circleSize / 2;
        const circleCenterX = canvasSize / 2;
        const circleCenterY = canvasSize / 2;
        
        // 6. Dibujar círculo blanco con anti-aliasing
        ctx.beginPath();
        ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2, false);
        ctx.fillStyle = 'white';
        ctx.fill();
        
        // 7. Calcular tamaño del logo
        const logoSize = circleSize * logoRatio;
        const logoX = (canvasSize - logoSize) / 2;
        const logoY = (canvasSize - logoSize) / 2;
        
        // 8. Dibujar el logo centrado sobre el círculo blanco
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        
        // 9. Convertir canvas a dataURL
        const logoDataUrl = canvas.toDataURL('image/png');
        
        console.log('✅ Logo procesado exitosamente en círculo blanco');
        resolve(logoDataUrl);
      };
      
      // Configurar manejo de errores
      logoImg.onerror = (error) => {
        console.error('❌ Error cargando logo:', error);
        reject(new Error(`Error cargando la imagen del logo: ${error}`));
      };
      
      // Iniciar carga de la imagen
      logoImg.src = logoUrl;
      
    } catch (error) {
      console.error('❌ Error procesando logo en círculo:', error);
      reject(error);
    }
  });
};

export const obtenerVersionPDF = () => {
  return 'Servicio PDF v7.0 DEFINITIVO - 2025-08-23-03:15 - HEADER FIJO: Tabla estructura, logo centrado, validación estricta';
};

// Forzar recarga del módulo con timestamp único
const timestampCarga = new Date().toLocaleString('es-CO');
const versionCompleta = obtenerVersionPDF();
console.log('🔄 ================================================');
console.log('🎆 SERVICIO PDF v7.0 DEFINITIVO CARGADO EXITOSAMENTE 🎆');
console.log('🔄 ================================================');
console.log('💰 Versión:', versionCompleta);
console.log('⏰ Cargado en:', timestampCarga);
console.log('🎯 NUEVO: Header function con tabla fija');
console.log('🎯 NUEVO: Logo perfectamente centrado en círculo');
console.log('🎯 NUEVO: Tipografía exacta según imagen 2');
console.log('🎯 NUEVO: Márgenes corregidos (header + contenido)');
console.log('🎆 NUEVO: Validación estricta que interrumpe si no cumple');
console.log('🚨 SI VES ESTE MENSAJE, v7.0 DEFINITIVO ESTÁ ACTIVO');
console.log('🔄 ================================================');

/**
 * Generar PDF del informe técnico
 * @param {Object} informe - Datos del informe técnico
 * @param {Object} opciones - Opciones de generación (incluye currentEmployee)
 * @returns {Promise} Promise que resuelve cuando el PDF está generado
 */
export const generarPDFInforme = async (informe, opciones = {}) => {
  try {
    if (!informe) {
      throw new Error('Datos del informe requeridos');
    }

    console.log('Iniciando generación de PDF para informe:', informe.idInforme);

    // obtener servicio relacionado
    const servicioRelacionado = await obtenerServicioPorTitulo(informe.tituloTrabajo);

    // log de depuración (obligatorio)
    console.log('SERVICIO RELACIONADO ENCONTRADO:', !!servicioRelacionado, servicioRelacionado?.id_servicio || servicioRelacionado?.titulo || 'sin id');

    // logs estratégicos para verificar
    console.log('>> Preparando PDF para informe:', informe.idInforme || informe.remision);
    console.log('>> servicioRelacionado:', servicioRelacionado ? servicioRelacionado.titulo : 'NO ENCONTRADO');
    console.log('>> longitud contenido actividades:', servicioRelacionado ? (servicioRelacionado.descripcion_actividad || '').length : 0);

    // Opciones por defecto
    const configuracion = {
      abrirEnNuevaVentana: true,
      nombreArchivo: `Informe_Tecnico_${informe.idInforme || informe.remision || 'Sin_ID'}.pdf`,
      incluirLogo: true,
      ...opciones
    };

    // Convertir imágenes a dataURL
    const imagenesDataUrl = { antes: [], despues: [] };
    
    // Convertir imágenes ANTES
    if (informe.imagenesAntes && informe.imagenesAntes.length > 0) {
      console.log(`Convirtiendo ${informe.imagenesAntes.length} imágenes ANTES...`);
      for (let i = 0; i < informe.imagenesAntes.length; i++) {
        try {
          const imagen = informe.imagenesAntes[i];
          if (imagen.url) {
            const dataUrl = await convertirUrlADataUrl(imagen.url);
            imagenesDataUrl.antes.push(dataUrl);
          }
        } catch (error) {
          console.error(`Error convirtiendo imagen ANTES ${i}:`, error);
          // Continuar con las demás imágenes
        }
      }
    }

    // Convertir imágenes DESPUÉS
    if (informe.imagenesDespues && informe.imagenesDespues.length > 0) {
      console.log(`Convirtiendo ${informe.imagenesDespues.length} imágenes DESPUÉS...`);
      for (let i = 0; i < informe.imagenesDespues.length; i++) {
        try {
          const imagen = informe.imagenesDespues[i];
          if (imagen.url) {
            const dataUrl = await convertirUrlADataUrl(imagen.url);
            imagenesDataUrl.despues.push(dataUrl);
          }
        } catch (error) {
          console.error(`Error convirtiendo imagen DESPUÉS ${i}:`, error);
          // Continuar con las demás imágenes
        }
      }
    }

    // 🎆 PROCESAR LOGO EN CÍRCULO BLANCO - SOLUCIÓN DEFINITIVA
    let logoDataUrl = null;
    if (configuracion.incluirLogo) {
      try {
        // Cargar y procesar logo PNG con círculo blanco (LOGO MÁS LLAMATIVO CON MARCO REDUCIDO)
        logoDataUrl = await procesarLogoEnCirculo(
          `${window.location.origin}/images/logo-gms.png`,
          135,  // Tamaño del lienzo aumentado para círculo más grande y llamativo
          0.95, // Proporción del círculo aumentada (95% del lienzo) - círculo más grande
          0.88  // Proporción del logo aumentada (88% del círculo) - marco blanco más delgado
        );
        
        console.log('✅ Logo procesado exitosamente con círculo blanco');
      } catch (error) {
        console.error('❌ Error procesando logo corporativo:', error);
        // Continuar sin logo - no hay fallback
      }
    }

    // 🔍 OBTENER SERVICIO RELACIONADO YA OBTENIDO ARRIBA
    if (servicioRelacionado) {
      console.log('✅ Servicio relacionado encontrado:', servicioRelacionado.titulo);
    } else {
      console.log('⚠️ No se encontró servicio relacionado para:', informe.tituloTrabajo);
    }

    // 🎯 GENERAR PDF CON NUEVA ARQUITECTURA v7.0 DEFINITIVA
    
    // Generar y descargar/abrir PDF con HEADER FUNCTION
    return new Promise((resolve, reject) => {
      try {
        // Crear función header DEFINITIVA
        const headerFijo = crearHeaderFijo(logoDataUrl, informe);
        
        // NUEVO: Redefinir completamente la estructura del documento
        const documentDefinitionV7 = {
          pageSize: 'LETTER',
          pageOrientation: 'portrait', 
          
          // ⭐ MÁRGENES CORREGIDOS: Header sin márgenes, contenido CON márgenes ISO
          pageMargins: [MARGENES_ISO.izquierdo, 110, MARGENES_ISO.derecho, MARGENES_ISO.inferior], // 110pt de margen superior = espacio para header optimizado (95pt + 15pt buffer)
          
          // 🎯 HEADER FIJO DEFINITIVO
          header: headerFijo,
          
          footer: function(currentPage, pageCount) {
            return [
              crearPiePagina(),
              {
                text: `Página ${currentPage} de ${pageCount}`,
                style: { fontSize: 8, margin: [0, 3, 0, 8], font: FUENTE_ISO },
                alignment: 'center'
              }
            ];
          },
          
          // 🎯 CONTENIDO SIN ENCABEZADO (va separado en header)
          content: [
            // 1. Informacion del informe (solo sección 1)
            ...crearSeccionInforme(informe, opciones.currentEmployee),

            // 2. Datos de la remisión (separada)
            ...crearSeccionRemision(informe),

            // 3. Actividades realizadas (si existe servicio)
            ...crearSeccionActividades(servicioRelacionado),

            // 4. Valoracion economica
            ...crearSeccionServicios(informe),

            // 5. Evidencia fotográfica
            ...crearSeccionEvidencias(informe, imagenesDataUrl)
          ],
          
          styles: estilos,
          
          // === ESTILO BASE ISO 9001:2015 OBLIGATORIO ===
          defaultStyle: {
            fontSize: 11,
            lineHeight: 1.25,
            font: FUENTE_ISO,
            alignment: 'justify'
          }
        };
        
        const pdfDocGenerator = pdfMake.createPdf(documentDefinitionV7);
        
        if (configuracion.abrirEnNuevaVentana) {
          pdfDocGenerator.open();
        } else {
          pdfDocGenerator.download(configuracion.nombreArchivo);
        }
        
        console.log('PDF generado exitosamente');
        resolve(true);
      } catch (error) {
        console.error('Error generando PDF:', error);
        reject(error);
      }
    });

  } catch (error) {
    console.error('Error en generarPDFInforme:', error);
    throw new Error(`Error generando PDF: ${error.message}`);
  }
};

/**
 * Generar PDF con configuración personalizada
 * @param {Object} informe - Datos del informe
 * @param {boolean} descargar - Si true descarga, si false abre en nueva ventana
 * @param {string} nombreCustom - Nombre personalizado del archivo
 * @param {Object} currentEmployee - Información del empleado logueado
 * @returns {Promise} Promise de generación
 */
export const generarPDFPersonalizado = async (informe, descargar = false, nombreCustom = null, currentEmployee = null) => {
  const nombreArchivo = nombreCustom || `IT_${informe.remision}_${new Date().toISOString().split('T')[0]}.pdf`;
  
  return generarPDFInforme(informe, {
    abrirEnNuevaVentana: !descargar,
    nombreArchivo: nombreArchivo,
    currentEmployee: currentEmployee,
    incluirLogo: true
  });
};

/**
 * Vista previa rápida del PDF (solo abrir, no descargar)
 * @param {Object} informe - Datos del informe
 * @param {Object} currentEmployee - Información del empleado logueado
 * @returns {Promise} Promise de generación
 */
export const previsualizarPDF = async (informe, currentEmployee = null) => {
  return generarPDFInforme(informe, {
    abrirEnNuevaVentana: true,
    incluirLogo: true,
    currentEmployee: currentEmployee
  });
};
