/**
 * 📊 MÓDULO REPORTES E INFORMES
 * ==================================================
 * Módulo completo para análisis y visualización de datos de remisiones
 * con dashboard, gráficos, tablas y exportación de datos.
 * 
 * Características:
 * - Dashboard con métricas en tiempo real
 * - Filtros avanzados y búsqueda
 * - Visualizaciones gráficas (barras y dona)
 * - Tabla detallada con paginación y ordenamiento
 * - Exportación a CSV
 * - Animaciones y estilos basados en el módulo CRM
 * - Responsive design con TailwindCSS
 * 
 * Basado en el estilo y animaciones del módulo CRM
 * Compatible con BuscarHistorialOptimizado
 */

// Componente principal
export { default } from './ReportesInformes';
export { default as ReportesInformes } from './ReportesInformes';

// Componentes individuales
export { default as MetricasReportes } from './components/MetricasReportes';
export { default as FiltrosReportes } from './components/FiltrosReportes';
export { default as TablaReportes } from './components/TablaReportes';
export { default as VisualizadorGraficos } from './components/VisualizadorGraficos';

// Hook personalizado
export { useReportesData } from './hooks/useReportesData';

// Utilidades
export * from './utils/reportesUtils';

/**
 * INSTRUCCIONES DE USO:
 * 
 * 1. Importar el componente principal:
 * ```jsx
 * import ReportesInformes from './components/ReportesInformes';
 * // o
 * import { ReportesInformes } from './components/ReportesInformes';
 * ```
 * 
 * 2. Usar en tu aplicación:
 * ```jsx
 * function App() {
 *   return (
 *     <div>
 *       <ReportesInformes />
 *     </div>
 *   );
 * }
 * ```
 * 
 * 3. Para usar componentes individuales:
 * ```jsx
 * import { MetricasReportes, useReportesData } from './components/ReportesInformes';
 * 
 * function CustomReports() {
 *   const { metricas, datosGraficos, cargando } = useReportesData();
 *   
 *   return (
 *     <MetricasReportes 
 *       metricas={metricas} 
 *       datosGraficos={datosGraficos} 
 *       cargando={cargando} 
 *     />
 *   );
 * }
 * ```
 * 
 * 4. Para usar utilidades:
 * ```jsx
 * import { formatearMoneda, exportarAFormato } from './components/ReportesInformes';
 * 
 * const precio = formatearMoneda(125000); // "$125.000"
 * exportarAFormato(datos, 'csv', 'mi_reporte'); // Exporta CSV
 * ```
 * 
 * DEPENDENCIAS REQUERIDAS:
 * - React 16.8+ (hooks)
 * - Firebase/Firestore (para datos de remisiones)
 * - TailwindCSS (estilos)
 * - App.css (animaciones del CRM)
 * - CorporateLogo component
 * - remisionesService
 * 
 * ESTRUCTURA DE ARCHIVOS:
 * src/components/ReportesInformes/
 * ├── index.js (este archivo)
 * ├── ReportesInformes.jsx (componente principal)
 * ├── components/
 * │   ├── MetricasReportes.jsx
 * │   ├── FiltrosReportes.jsx
 * │   ├── TablaReportes.jsx
 * │   └── VisualizadorGraficos.jsx
 * ├── hooks/
 * │   └── useReportesData.js
 * └── utils/
 *     └── reportesUtils.js
 */
