// services/integracionModulos.js
// Servicio para integración entre módulos de la aplicación

// Opciones de integración entre módulos
export const obtenerOpcionesIntegracion = () => {
  return {
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
  configuracionIntegracion
};

export default integracionModulos;
