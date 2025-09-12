// Tipos para el módulo de ingresar trabajo / remisiones

export interface Remision {
  id: string;
  numeroRemision: string;
  fecha: string;
  cliente: string;
  ubicacion: string;
  tipoTrabajo: TipoTrabajo;
  descripcionTrabajo: string;
  equiposUtilizados: EquipoUtilizado[];
  materialesUtilizados: MaterialUtilizado[];
  observaciones: string;
  tecnicoResponsable: string;
  tiempoTrabajo: string;
  estado: EstadoRemision;
  // Campos de auditoría
  creadoEn: Date;
  actualizadoEn: Date;
  creadoPor: string;
  // Archivos e imágenes
  imagenes?: string[];
  archivosAdjuntos?: ArchivoAdjunto[];
}

export type TipoTrabajo = 
  | 'Instalación'
  | 'Mantenimiento'
  | 'Reparación'
  | 'Inspección'
  | 'Calibración'
  | 'Otro';

export type EstadoRemision = 
  | 'borrador'
  | 'enviada'
  | 'en_proceso'
  | 'completada'
  | 'cancelada';

export interface EquipoUtilizado {
  id: string;
  nombre: string;
  modelo?: string;
  serie?: string;
  cantidad: number;
  unidad: string;
  estado: 'bueno' | 'regular' | 'malo';
  observaciones?: string;
}

export interface MaterialUtilizado {
  id: string;
  nombre: string;
  descripcion?: string;
  cantidad: number;
  unidad: string;
  precio?: number;
  proveedor?: string;
}

export interface ArchivoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  tamaño: number;
  fechaSubida: Date;
}

// Formulario de remisión
export interface RemisionFormData {
  numeroRemision: string;
  fecha: string;
  cliente: string;
  ubicacion: string;
  tipoTrabajo: TipoTrabajo;
  descripcionTrabajo: string;
  equiposUtilizados: EquipoUtilizado[];
  materialesUtilizados: MaterialUtilizado[];
  observaciones: string;
  tecnicoResponsable: string;
  tiempoTrabajo: string;
  estado: EstadoRemision;
  imagenes?: string[];
  archivosAdjuntos?: ArchivoAdjunto[];
}

// Filtros
export interface RemisionesFilters {
  tipoTrabajo?: TipoTrabajo;
  estado?: EstadoRemision;
  fechaDesde?: string;
  fechaHasta?: string;
  cliente?: string;
  tecnico?: string;
  busqueda?: string;
}

// Opciones para selects
export interface TipoTrabajoOption {
  value: TipoTrabajo;
  label: string;
  color: string;
}

export interface EstadoRemisionOption {
  value: EstadoRemision;
  label: string;
  color: string;
}

// Hooks
export interface UseRemisionesReturn {
  remisiones: Remision[];
  loading: boolean;
  error: string | null;
  filteredRemisiones: Remision[];
  totalRemisiones: number;
  filters: RemisionesFilters;
  setFilters: (filters: RemisionesFilters) => void;
  refreshRemisiones: () => Promise<void>;
  createRemision: (data: RemisionFormData) => Promise<void>;
  updateRemision: (id: string, data: Partial<RemisionFormData>) => Promise<void>;
  deleteRemision: (id: string) => Promise<void>;
}