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
  NO_ID_BIT: 'no_id_bit',
  DESCRIPCION: 'descripcion',
  SUBTOTAL: 'subtotal',
  TOTAL: 'total',
  TECNICO: 'tecnico',
  UNE: 'une',
  AUTORIZO: 'autorizo',
  CARROCERIA: 'carroceria',
  NO_ORDEN: 'no_orden',
  NO_FACT_ELECT: 'no_fact_elect',
  RADICACION: 'radicacion',
  GENERO: 'genero',
  FECHA_BIT_PROF: 'fecha_bit_prof',
  FECHA_MAXIMO: 'fecha_maximo'
};

// Estados disponibles para remisiones
export const ESTADOS_REMISION = [
  { value: 'CANCELADO', label: 'Cancelado', color: '#dc3545' },
  { value: 'CORTECIA', label: 'Cortesía', color: '#17a2b8' },
  { value: 'GARANTIA', label: 'Garantía', color: '#28a745' },
  { value: 'GENERADO', label: 'Generado', color: '#007bff' },
  { value: 'PENDIENTE', label: 'Pendiente', color: '#ffc107' },
  { value: 'PROFORMA', label: 'Proforma', color: '#6f42c1' },
  { value: 'RADICADO', label: 'Radicado', color: '#17a2b8' },
  { value: 'SIN VINCULAR', label: 'Sin Vincular', color: '#6c757d' }
];

// Opciones de UNE disponibles
export const OPCIONES_UNE = [
  { value: 'ALIMENTADORES', label: 'Alimentadores' },
  { value: 'AUTOSUR', label: 'Autosur' },
  { value: 'GALICIA', label: 'Galicia' },
  { value: 'SANBERNARDINO', label: 'San Bernardino' },
  { value: 'SANJOSE1', label: 'San José 1' },
  { value: 'SANJOSE2', label: 'San José 2' },
  { value: 'SEVILLANA', label: 'Sevillana' }
];

// Opciones de carrocería disponibles
export const OPCIONES_CARROCERIA = [
  { value: 'AGRALE-MA8.7', label: 'Agrale MA8.7' },
  { value: 'CHEVROLET-NPR', label: 'Chevrolet NPR' },
  { value: 'MERCEDES-ATEGO-1016', label: 'Mercedes Atego 1016' },
  { value: 'MERCEDES-LO-915', label: 'Mercedes LO 915' },
  { value: 'MERCEDES-OF 1724', label: 'Mercedes OF 1724' },
  { value: 'SCANIA - K250 B4X2', label: 'Scania K250 B4X2' },
  { value: 'THOMAS-EF1723', label: 'Thomas EF1723' },
  { value: 'VOLVO-B215RH', label: 'Volvo B215RH' }
];

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
  OPCIONES_UNE,
  OPCIONES_CARROCERIA,
  ESTADOS_HERRAMIENTA,
  ESTADOS_HERRAMIENTA_MANUAL,
  TIPOS_EMPLEADO,
  ESTADOS_EMPLEADO,
  FORM_CONFIG
};

export default APP_CONSTANTS;
