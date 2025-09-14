import type { TipoTrabajoOption, EstadoRemisionOption, TipoTrabajo, RemisionFormData } from '../types';

export const TIPOS_TRABAJO: TipoTrabajoOption[] = [
  { value: 'Instalación', label: 'Instalación', color: '#007bff' },
  { value: 'Mantenimiento', label: 'Mantenimiento', color: '#28a745' },
  { value: 'Reparación', label: 'Reparación', color: '#ffc107' },
  { value: 'Inspección', label: 'Inspección', color: '#17a2b8' },
  { value: 'Calibración', label: 'Calibración', color: '#6f42c1' },
  { value: 'Otro', label: 'Otro', color: '#6c757d' }
];

export const ESTADOS_REMISION: EstadoRemisionOption[] = [
  { value: 'borrador', label: 'Borrador', color: '#6c757d' },
  { value: 'enviada', label: 'Enviada', color: '#007bff' },
  { value: 'en_proceso', label: 'En Proceso', color: '#ffc107' },
  { value: 'completada', label: 'Completada', color: '#28a745' },
  { value: 'cancelada', label: 'Cancelada', color: '#dc3545' }
];

export const UNIDADES_MEDIDA = [
  'Unidad',
  'Metro',
  'Metro cuadrado',
  'Metro cúbico',
  'Kilogramo',
  'Litro',
  'Hora',
  'Día',
  'Pieza',
  'Rollo',
  'Caja',
  'Paquete'
];

export const ESTADOS_EQUIPO = [
  { value: 'bueno', label: 'Bueno', color: '#28a745' },
  { value: 'regular', label: 'Regular', color: '#ffc107' },
  { value: 'malo', label: 'Malo', color: '#dc3545' }
];

// Configuración de validación
export const VALIDATION_RULES = {
  NUMERO_REMISION_MIN_LENGTH: 3,
  CLIENTE_MIN_LENGTH: 2,
  DESCRIPCION_MIN_LENGTH: 10,
  TIEMPO_TRABAJO_PATTERN: /^([0-9]+):([0-5][0-9])$/,
  MAX_IMAGENES: 10,
  MAX_ARCHIVO_SIZE: 5 * 1024 * 1024, // 5MB
  TIPOS_ARCHIVO_PERMITIDOS: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'],
} as const;

// Valores por defecto
export const DEFAULT_REMISION_DATA: RemisionFormData = {
  numeroRemision: '',
  fecha: new Date().toISOString().split('T')[0],
  cliente: '',
  ubicacion: '',
  tipoTrabajo: 'Mantenimiento' as TipoTrabajo,
  descripcionTrabajo: '',
  equiposUtilizados: [],
  materialesUtilizados: [],
  observaciones: '',
  tecnicoResponsable: '',
  tiempoTrabajo: '00:00',
  estado: 'borrador' as const,
  imagenes: [],
  archivosAdjuntos: [],
};