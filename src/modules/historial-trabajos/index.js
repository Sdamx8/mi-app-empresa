/**
 * Módulo de Historial de Trabajos
 * 
 * Este módulo proporciona funcionalidades para:
 * - Consultar historial de remisiones
 * - Filtrar y buscar trabajos realizados
 * - Ver detalles y timeline de trabajos
 * - Exportar datos de trabajos
 * 
 * Estructura del módulo:
 * - HistorialTrabajosOptimizado: Componente principal
 * - useRemisiones: Hook para gestión de estado
 * - BuscarHistorialOptimizado: Componente de búsqueda legacy (si existe)
 * 
 * @version 1.0.0
 * @author Sistema ERP
 */

// Exportación por defecto del componente principal
export { default } from './components/HistorialTrabajosOptimizado';

// Exportaciones nombradas para acceso directo
export { default as HistorialTrabajosOptimizado } from './components/HistorialTrabajosOptimizado';
export { default as ConsultarTrabajo } from './components/HistorialTrabajosOptimizado'; // Compatibilidad
export { default as useRemisiones } from './hooks/useRemisiones';

// Hooks de autenticación
export { default as useEmpleadoAuth } from './hooks/useEmpleadoAuth';

// Re-exportar BuscarHistorialOptimizado si existe (compatibilidad)
export { default as BuscarHistorialOptimizado } from './BuscarHistorialOptimizado';

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
