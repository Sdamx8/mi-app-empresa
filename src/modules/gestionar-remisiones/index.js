/**
 * 📋 MÓDULO GESTIONAR REMISIONES
 * ===============================
 * Exportador principal del módulo rediseñado
 * 
 * Estructura del módulo:
 * - GestionarRemisiones: Componente principal con dashboard de submódulos
 * - Submódulos integrados: Consultar Móvil, Ingresar Trabajo, Administrar Remisiones
 * - Aplicación del Manual de Identidad Corporativa
 * 
 * @version 3.0.0
 * @author Global Mobility Solutions
 */

// Exportación por defecto del componente principal
export { default } from './components/GestionarRemisiones';

// Exportaciones adicionales de componentes
export { default as GestionarRemisiones } from './components/GestionarRemisiones';

// Configuración del módulo
export const moduleConfig = {
  name: 'Gestionar Remisiones',
  version: '3.0.0',
  description: 'Sistema integral para la gestión de remisiones de trabajo',
  
  // Submódulos disponibles
  submodules: {
    consultar: {
      name: 'Consultar Móvil',
      description: 'Buscar y consultar remisiones por número de móvil',
      icon: '🔍'
    },
    ingresar: {
      name: 'Ingresar Trabajo',
      description: 'Registrar nuevas remisiones de trabajo realizado',
      icon: '📝'
    },
    administrar: {
      name: 'Administrar Remisiones',
      description: 'Gestionar y editar remisiones existentes',
      icon: '⚙️'
    }
  },
  
  // Características del módulo
  features: [
    'Dashboard unificado de gestión de remisiones',
    'Navegación por submódulos con lazy loading',
    'Diseño responsive según manual de marca',
    'Microinteracciones con Framer Motion',
    'Estadísticas en tiempo real',
    'Breadcrumb navigation',
    'Aplicación de tokens de diseño corporativo'
  ],
  
  // Permisos requeridos
  permissions: {
    view: ['directivo', 'administrativo', 'tecnico'],
    edit: ['directivo', 'administrativo'],
    delete: ['directivo'],
    export: ['directivo', 'administrativo']
  }
};

/**
 * Rutas del módulo
 */
export const moduleRoutes = {
  main: '/gestionar-remisiones',
  submodules: {
    consultar: '/gestionar-remisiones/consultar-movil',
    ingresar: '/gestionar-remisiones/ingresar-trabajo', 
    administrar: '/gestionar-remisiones/administrar-remisiones'
  },
  // Compatibilidad con rutas anteriores
  legacy: {
    historial: '/historial-trabajos',
    ingresar: '/ingresar-trabajo'
  }
};