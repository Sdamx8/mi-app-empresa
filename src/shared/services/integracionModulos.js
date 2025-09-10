// services/integracionModulos.js
// Servicio para integración entre módulos de la aplicación

// Opciones de integración entre módulos
export const obtenerOpcionesIntegracion = () => {
  return {
    informesTecnicos: {
      disponible: true,
      nombre: 'Informes Técnicos',
      descripcion: 'Generar informes técnicos detallados'
    },
    reporteHistorial: {
      disponible: true,
      nombre: 'Reporte Historial',
      descripcion: 'Generar reportes históricos'
    },
    financiero: {
      disponible: true,
      nombre: 'Módulo Financiero',
      descripcion: 'Análisis financiero y costos'
    }
  };
};

// Generar PDF directo desde remisión
export const generarPDFDirecto = async () => {
  // Lógica para generar PDF
  return { success: true, url: '#' };
};

// Validar remisión para informe
export const validarRemisionParaInforme = (remision) => {
  const errores = [];
  
  if (!remision.numero) {
    errores.push('Número de remisión requerido');
  }
  
  if (!remision.descripcion) {
    errores.push('Descripción requerida');
  }
  
  if (!remision.tecnico) {
    errores.push('Técnico requerido');
  }
  
  return {
    valida: errores.length === 0,
    errores
  };
};

// Redirigir a informes técnicos
export const redirigirAInformesTecnicos = (remisionData) => {
  try {
    // Almacenar datos de la remisión para el informe
    if (remisionData) {
      sessionStorage.setItem('remisionParaInforme', JSON.stringify(remisionData));
    }
    
    // Redirigir a la ruta de informes técnicos
    window.location.hash = '#/informes-tecnicos';
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Configuración de integración
export const configuracionIntegracion = {
  pdf: {
    formato: 'A4',
    margen: 40,
    fuente: 'Helvetica'
  },
  informes: {
    plantillaDefecto: 'estandar',
    incluirImagenes: true,
    formatoFecha: 'DD/MM/YYYY'
  }
};

const integracionModulos = {
  obtenerOpcionesIntegracion,
  generarPDFDirecto,
  validarRemisionParaInforme,
  redirigirAInformesTecnicos,
  configuracionIntegracion
};

export default integracionModulos;
