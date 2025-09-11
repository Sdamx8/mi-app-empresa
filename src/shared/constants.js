// constants.js - Constantes para la aplicación

// Configuración de caché
export const CACHE_DURATION = 300000; // 5 minutos en milisegundos
export const MAX_DOCUMENTS_LIMIT = 1000;

// Estados de búsqueda
export const SEARCH_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Colores del tema
export const THEME_COLORS = {
  primary: '#007bff',
  success: '#28a745',
  warning: '#ffc107',
  danger: '#dc3545',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40'
};

// Configuración de tabla
export const TABLE_CONFIG = {
  rowsPerPage: 50,
  maxColumnWidth: '200px'
};

// Mensajes de la aplicación
export const MESSAGES = {
  NO_CRITERIA: 'Por favor ingrese al menos un criterio de búsqueda',
  NO_RESULTS: 'No se encontraron remisiones con los criterios especificados',
  LOADING: 'Buscando...',
  CACHE_UPDATED: '(usando caché actualizado)',
  ERROR_SEARCH: 'Error al buscar: ',
  LOGIN_REQUIRED: 'Necesitas iniciar sesión para acceder',
  SAVING: 'Guardando...',
  SAVE_SUCCESS: 'Remisión guardada exitosamente',
  SAVE_ERROR: 'Error al guardar la remisión: ',
  REQUIRED_FIELDS: 'Por favor complete todos los campos obligatorios',
  FORM_TITLE: 'Ingresar Nuevo Trabajo Realizado'
};

// Campos de la base de datos
export const DB_FIELDS = {
  REMISION: 'remision',
  MOVIL: 'movil',
  ESTADO: 'estado',
  FECHA_REMISION: 'fecha_remision',
  FECHA_ID_BIT: 'fecha_id-bit',
  DESCRIPCION: 'descripcion',
  SUBTOTAL: 'subtotal',
  AUTORIZO: 'autorizo',
  CARROCERIA: 'carroceria',
  NO_ORDEN: 'no_orden',
  NO_FACT_ELECT: 'no_fact_elect',
  RADICACION: 'radicacion',
  GENERO: 'genero',
  FECHA_BIT_PROF: 'fecha_bit_prof',
  FECHA_MAXIMO: 'fecha_maximo'
};

// Estados disponibles para remisiones (básicos - mantener compatibilidad)
export const ESTADOS_REMISION = [
  { value: 'pendiente', label: 'Pendiente', color: '#ffc107' },
  { value: 'en_proceso', label: 'En Proceso', color: '#17a2b8' },
  { value: 'completado', label: 'Completado', color: '#28a745' },
  { value: 'cancelado', label: 'Cancelado', color: '#dc3545' },
  { value: 'activo', label: 'Activo', color: '#007bff' }
];

// Estados específicos del proceso de remisiones (ampliados según BD)
export const ESTADOS_REMISION_PROCESO = {
  // Estados básicos del proceso
  PENDIENTE: { 
    value: 'pendiente', 
    label: 'Pendiente', 
    color: '#E74C3C', // Rojo
    description: 'Trabajo pendiente por realizar'
  },
  RADICADO: { 
    value: 'radicado', 
    label: 'Radicado', 
    color: '#27AE60', // Verde
    description: 'Radicado en el sistema'
  },
  PROFORMA: { 
    value: 'proforma', 
    label: 'Proforma', 
    color: '#F1C40F', // Amarillo
    description: 'Cotización proforma generada'
  },
  GENERADO: { 
    value: 'generado', 
    label: 'Generado', 
    color: '#3498DB', // Azul
    description: 'Documento generado'
  },
  // Estados adicionales
  CANCELADO: { 
    value: 'cancelado', 
    label: 'Cancelado', 
    color: '#95A5A6', // Gris
    description: 'Trabajo cancelado'
  },
  GARANTIA: { 
    value: 'garantia', 
    label: 'Garantía', 
    color: '#9B59B6', // Púrpura
    description: 'Trabajo en garantía'
  },
  CORTESIA: { 
    value: 'cortesia', 
    label: 'Cortesía', 
    color: '#1ABC9C', // Verde agua
    description: 'Servicio de cortesía'
  },
  SIN_VINCULAR: { 
    value: 'sin_vincular', 
    label: 'Sin Vincular', 
    color: '#34495E', // Gris oscuro
    description: 'No vinculado a proceso'
  },
  // Estados legacy para compatibilidad
  EN_PROCESO: { 
    value: 'en_proceso', 
    label: 'En Proceso', 
    color: '#F39C12', // Naranja
    description: 'Trabajo en progreso'
  },
  COMPLETADO: { 
    value: 'completado', 
    label: 'Completado', 
    color: '#27AE60', // Verde
    description: 'Trabajo completado'
  },
  ACTIVO: { 
    value: 'activo', 
    label: 'Activo', 
    color: '#3498DB', // Azul
    description: 'Estado activo'
  }
};

// Estados disponibles para herramientas eléctricas
export const ESTADOS_HERRAMIENTA = [
  { value: 'operativo', label: 'Operativo', color: '#28a745' },
  { value: 'mantenimiento', label: 'En Mantenimiento', color: '#ffc107' },
  { value: 'fuera_servicio', label: 'Fuera de Servicio', color: '#dc3545' },
  { value: 'revision', label: 'En Revisión', color: '#17a2b8' },
  { value: 'reparacion', label: 'En Reparación', color: '#fd7e14' }
];

// Estados disponibles para herramientas manuales
export const ESTADOS_HERRAMIENTA_MANUAL = [
  { value: 'disponible', label: 'Disponible', color: '#28a745' },
  { value: 'asignada', label: 'Asignada', color: '#007bff' },
  { value: 'mantenimiento', label: 'En Mantenimiento', color: '#ffc107' },
  { value: 'perdida', label: 'Perdida', color: '#dc3545' },
  { value: 'dañada', label: 'Dañada', color: '#6c757d' },
  { value: 'baja', label: 'Dada de Baja', color: '#343a40' }
];

// Estados y tipos para empleados
export const TIPOS_EMPLEADO = [
  { value: 'tecnico', label: 'Técnico', color: '#007bff' },
  { value: 'administrativo', label: 'Administrativo', color: '#28a745' },
  { value: 'directivo', label: 'Directivo', color: '#dc3545' }
];

export const ESTADOS_EMPLEADO = [
  { value: 'activo', label: 'Activo', color: '#28a745' },
  { value: 'inactivo', label: 'Inactivo', color: '#ffc107' },
  { value: 'retirado', label: 'Retirado', color: '#6c757d' }
];

// Configuración de super administrador
export const SUPER_ADMIN = {
  EMAIL: 'Davian.ayala7@gmail.com',
  PERMISSIONS: {
    MANAGE_ALL_USERS: true,
    MANAGE_PERMISSIONS: true,
    ASSIGN_ROLES: true,
    REMOVE_ROLES: true,
    VIEW_ALL_DATA: true,
    DELETE_ANY_RECORD: true,
    EXPORT_ALL_DATA: true,
    SYSTEM_ADMINISTRATION: true
  }
};

// Períodos predefinidos para filtros de fecha
export const PERIODOS_FECHA = {
  ULTIMOS_7_DIAS: {
    label: '🗓️ Últimos 7 días',
    value: 7,
    description: 'Datos de la última semana'
  },
  ULTIMOS_15_DIAS: {
    label: '📅 Últimos 15 días', 
    value: 15,
    description: 'Datos de las últimas 2 semanas'
  },
  ULTIMOS_30_DIAS: {
    label: '📊 Últimos 30 días',
    value: 30,
    description: 'Datos del último mes (por defecto)'
  },
  ULTIMOS_60_DIAS: {
    label: '📈 Últimos 60 días',
    value: 60, 
    description: 'Datos de los últimos 2 meses'
  },
  ULTIMOS_90_DIAS: {
    label: '📋 Últimos 90 días',
    value: 90,
    description: 'Datos del último trimestre'
  },
  PERSONALIZADO: {
    label: '⚙️ Rango personalizado',
    value: 'custom',
    description: 'Seleccionar fechas específicas'
  }
};

// Configuración del formulario
export const FORM_CONFIG = {
  MODAL_WIDTH: '800px',
  MODAL_MAX_HEIGHT: '90vh',
  ANIMATION_DURATION: '300ms'
};

const APP_CONSTANTS = {
  CACHE_DURATION,
  MAX_DOCUMENTS_LIMIT,
  SEARCH_STATES,
  THEME_COLORS,
  TABLE_CONFIG,
  MESSAGES,
  DB_FIELDS,
  ESTADOS_REMISION,
  ESTADOS_REMISION_PROCESO,
  ESTADOS_HERRAMIENTA,
  ESTADOS_HERRAMIENTA_MANUAL,
  TIPOS_EMPLEADO,
  ESTADOS_EMPLEADO,
  SUPER_ADMIN,
  PERIODOS_FECHA,
  FORM_CONFIG
};

export default APP_CONSTANTS;
