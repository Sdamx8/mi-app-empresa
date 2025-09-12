import type { TipoEmpleadoOption, EstadoEmpleadoOption, NivelAcademico } from '../types';

export const TIPOS_EMPLEADO: TipoEmpleadoOption[] = [
  { value: 'tecnico', label: 'Técnico', color: '#007bff' },
  { value: 'administrativo', label: 'Administrativo', color: '#28a745' },
  { value: 'directivo', label: 'Directivo', color: '#dc3545' }
];

export const ESTADOS_EMPLEADO: EstadoEmpleadoOption[] = [
  { value: 'activo', label: 'Activo', color: '#28a745' },
  { value: 'inactivo', label: 'Inactivo', color: '#ffc107' },
  { value: 'retirado', label: 'Retirado', color: '#6c757d' }
];

export const NIVELES_ACADEMICOS: NivelAcademico[] = [
  'Primaria', 
  'Bachillerato', 
  'Técnico', 
  'Tecnólogo', 
  'Profesional', 
  'Especialización', 
  'Maestría', 
  'Doctorado'
];

export const TIPOS_DOCUMENTO = [
  'Cédula', 
  'Hoja de Vida', 
  'Certificados', 
  'Exámenes Médicos', 
  'Contrato', 
  'Otros'
];

// Configuración de validación
export const VALIDATION_RULES = {
  NOMBRE_MIN_LENGTH: 2,
  CEDULA_LENGTH: 10,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TELEFONO_MIN_LENGTH: 7,
  SALARIO_MIN: 0,
} as const;