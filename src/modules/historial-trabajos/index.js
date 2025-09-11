/**
 * Módulo de Historial de Trabajos
 * 
 * Este módulo proporciona funcionalidades para:
 * - Consultar historial de remisiones
 * - Administrar remisiones por estados y roles
 * - Filtrar y buscar trabajos realizados
 * - Ver detalles y timeline de trabajos
 * - Exportar datos de trabajos
 * 
 * Estructura del módulo:
 * - HistorialTrabajosOptimizado: Componente principal de consulta
 * - AdministrarRemisiones: Componente para administración de remisiones
 * - useRemisiones: Hook para gestión de estado
 * - useEmpleadoAuth: Hook para autenticación de empleados
 * 
 * @version 2.0.0
 * @author Sistema ERP
 */

// Exportación por defecto del componente principal
export { default } from './components/HistorialTrabajosOptimizado';

// Exportaciones adicionales de componentes
export { default as AdministrarRemisiones } from './components/AdministrarRemisiones';
export { default as HistorialTrabajosOptimizado } from './components/HistorialTrabajosOptimizado';
export { default as ConsultarTrabajo } from './components/HistorialTrabajosOptimizado'; // Compatibilidad

// Exportaciones de hooks
export { useRemisiones, useHistorialRemision } from './hooks/useRemisiones';
export { useEmpleadoAuth } from './hooks/useEmpleadoAuth';

// Re-exportaciones de constantes desde shared
export { 
  ESTADOS_REMISION_PROCESO, 
  SUPER_ADMIN, 
  PERIODOS_FECHA 
} from '../../shared/constants';

/**
 * Configuración del módulo
 */
export const moduleConfig = {
  name: 'Historial de Trabajos',
  version: '1.0.0',
  description: 'Gestión y consulta de historial de trabajos realizados',
  requiredRoles: ['tecnico', 'administrativo', 'directivo'],
  features: [
    'Consulta de remisiones',
    'Filtros avanzados',
    'Timeline de trabajos',
    'Exportación de datos',
    'Búsqueda optimizada'
  ]
};

/**
 * Rutas del módulo
 */
export const moduleRoutes = {
  main: '/historial-trabajos',
  legacy: '/buscar-historial' // Ruta de compatibilidad
};
