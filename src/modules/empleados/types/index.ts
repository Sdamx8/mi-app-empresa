// Tipos para el módulo de empleados

export interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
  fechaIngreso: string;
  tipo: TipoEmpleado;
  estado: EstadoEmpleado;
  nivelAcademico: NivelAcademico;
  cargo: string;
  salario?: number;
  // Campos de auditoría
  creadoEn: Date;
  actualizadoEn: Date;
  creadoPor: string;
}

export type TipoEmpleado = 'tecnico' | 'administrativo' | 'directivo';
export type EstadoEmpleado = 'activo' | 'inactivo' | 'retirado';
export type NivelAcademico = 
  | 'Primaria' 
  | 'Bachillerato' 
  | 'Técnico' 
  | 'Tecnólogo' 
  | 'Profesional' 
  | 'Especialización' 
  | 'Maestría' 
  | 'Doctorado';

export interface TipoEmpleadoOption {
  value: TipoEmpleado;
  label: string;
  color: string;
}

export interface EstadoEmpleadoOption {
  value: EstadoEmpleado;
  label: string;
  color: string;
}

// Formulario de empleado
export interface EmpleadoFormData {
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
  fechaIngreso: string;
  tipo: TipoEmpleado;
  estado: EstadoEmpleado;
  nivelAcademico: NivelAcademico;
  cargo: string;
  salario?: number;
}

// Filtros
export interface EmpleadosFilters {
  tipo?: TipoEmpleado;
  estado?: EstadoEmpleado;
  busqueda?: string;
}

// Hooks
export interface UseEmpleadosReturn {
  empleados: Empleado[];
  loading: boolean;
  error: string | null;
  filteredEmpleados: Empleado[];
  totalEmpleados: number;
  filters: EmpleadosFilters;
  setFilters: (filters: EmpleadosFilters) => void;
  refreshEmpleados: () => Promise<void>;
  createEmpleado: (data: EmpleadoFormData) => Promise<void>;
  updateEmpleado: (id: string, data: Partial<EmpleadoFormData>) => Promise<void>;
  deleteEmpleado: (id: string) => Promise<void>;
}