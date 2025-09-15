// =======================================================
// 🔧 ÍNDICE DE EXPORTACIONES - GESTIÓN DE MANTENIMIENTOS
// =======================================================

// Componente principal del módulo
import GestionMantenimientos from './components/GestionMantenimientos';
export { GestionMantenimientos };

// Configuración del módulo
export const MODULO_CONFIG = {
  id: 'gestion_mantenimientos',
  nombre: 'Gestión de Mantenimientos',
  descripcion: 'Seguimiento de mantenimientos preventivos de claraboyas',
  icono: '🔧',
  ruta: '/gestion-mantenimientos',
  permisos: ['admin', 'supervisor', 'tecnico'],
  version: '1.0.0'
};

// Constantes del módulo
export const MANTENIMIENTO_CONSTANTES = {
  TIEMPO_CRITICO_DIAS: 60,
  TIEMPO_ADVERTENCIA_DIAS: 90,
  TIPOS_FILTRO: {
    TODOS: 'todos',
    CRITICOS: 'criticos', 
    ADVERTENCIA: 'advertencia',
    AL_DIA: 'al-dia',
    CON_CLARABOYAS: 'con-claraboyas'
  },
  ESTADOS: {
    CRITICO: { 
      id: 'critico', 
      label: 'Crítico', 
      color: '#E74C3C',
      icon: '🔴'
    },
    ADVERTENCIA: { 
      id: 'advertencia', 
      label: 'Advertencia', 
      color: '#F39C12',
      icon: '🟡'
    },
    AL_DIA: { 
      id: 'al-dia', 
      label: 'Al Día', 
      color: '#27AE60',
      icon: '🟢'
    }
  }
};

// Utilidades y funciones auxiliares
export const MantenimientoUtils = {
  calcularDiasDesdeUltima: (fechaUltima) => {
    if (!fechaUltima) return null;
    const ahora = new Date();
    const ultima = new Date(fechaUltima);
    const diferencia = ahora - ultima;
    return Math.floor(diferencia / (1000 * 60 * 60 * 24));
  },

  determinarEstado: (dias) => {
    if (dias === null) return MANTENIMIENTO_CONSTANTES.ESTADOS.CRITICO;
    if (dias >= MANTENIMIENTO_CONSTANTES.TIEMPO_CRITICO_DIAS) {
      return MANTENIMIENTO_CONSTANTES.ESTADOS.CRITICO;
    }
    if (dias >= MANTENIMIENTO_CONSTANTES.TIEMPO_ADVERTENCIA_DIAS) {
      return MANTENIMIENTO_CONSTANTES.ESTADOS.ADVERTENCIA;
    }
    return MANTENIMIENTO_CONSTANTES.ESTADOS.AL_DIA;
  },

  formatearFecha: (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  },

  formatearMoneda: (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  },

  contarClaraboyasEnHistorial: (remisiones) => {
    return remisiones.reduce((total, remision) => {
      const serviciosConClaraboya = (remision.servicios || []).filter(servicio =>
        servicio.toLowerCase().includes('claraboya')
      );
      return total + serviciosConClaraboya.length;
    }, 0);
  },

  filtrarPorTexto: (datos, texto) => {
    if (!texto.trim()) return datos;
    
    const textoLower = texto.toLowerCase();
    return datos.filter(item =>
      item.movil?.toLowerCase().includes(textoLower) ||
      item.conductor?.toLowerCase().includes(textoLower) ||
      item.une?.toLowerCase().includes(textoLower)
    );
  },

  filtrarPorEstado: (datos, filtro) => {
    if (filtro === MANTENIMIENTO_CONSTANTES.TIPOS_FILTRO.TODOS) {
      return datos;
    }

    return datos.filter(item => {
      const dias = MantenimientoUtils.calcularDiasDesdeUltima(item.ultimaRemision);
      const estado = MantenimientoUtils.determinarEstado(dias);

      switch (filtro) {
        case MANTENIMIENTO_CONSTANTES.TIPOS_FILTRO.CRITICOS:
          return estado.id === 'critico';
        case MANTENIMIENTO_CONSTANTES.TIPOS_FILTRO.ADVERTENCIA:
          return estado.id === 'advertencia';
        case MANTENIMIENTO_CONSTANTES.TIPOS_FILTRO.AL_DIA:
          return estado.id === 'al-dia';
        case MANTENIMIENTO_CONSTANTES.TIPOS_FILTRO.CON_CLARABOYAS:
          return item.totalClaraboyas > 0;
        default:
          return true;
      }
    });
  }
};

// Hooks personalizados del módulo (para futuras implementaciones)
export const useMantenimientoData = () => {
  // Placeholder para hook personalizado de datos
  // Se puede implementar para encapsular la lógica de Firebase
};

export const useMantenimientoFiltros = () => {
  // Placeholder para hook personalizado de filtros
  // Se puede implementar para manejar estado de filtros
};

// Metadata del módulo para el sistema
export default {
  modulo: MODULO_CONFIG,
  componente: GestionMantenimientos,
  constantes: MANTENIMIENTO_CONSTANTES,
  utils: MantenimientoUtils
};