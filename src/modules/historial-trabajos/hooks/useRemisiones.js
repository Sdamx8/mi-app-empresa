/**
 * Hook para gestión de remisiones con paginación cursor y filtros
 * 
 * Proporciona:
 * - Estado de remisiones con paginación
 * - Funciones para cargar primera página y páginas siguientes
 * - Gestión de filtros y loading states
 * - Reset de datos
 * - Integración con remisionesService
 */

import { useState, useCallback, useRef } from 'react';
import { fetchRemisiones, fetchHistorialRemision, fetchRemisionesByMovilSimple } from '../../../services/remisionesService';
import { useAuth } from '../../../core/auth/AuthContext';

const INITIAL_STATE = {
  remisiones: [],
  loading: false,
  error: null,
  lastDoc: null,
  hasMore: false,
  totalFiltered: 0,
  appliedFilters: {},
  page: 0
};

/**
 * Hook principal para gestión de remisiones
 * 
 * @param {Object} options - Opciones iniciales
 * @param {number} options.pageSize - Tamaño de página (default: 25)
 * @returns {Object} Estado y funciones para gestionar remisiones
 */
export const useRemisiones = ({ pageSize = 25 } = {}) => {
  const [state, setState] = useState(INITIAL_STATE);
  const currentFiltersRef = useRef({});
  const abortControllerRef = useRef(null);
  const { user } = useAuth();

  /**
   * Actualiza el estado de forma inmutable
   */
  const updateState = useCallback((updates) => {
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  /**
   * Cancela petición en curso si existe
   */
  const cancelCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Carga la primera página con filtros especificados
   * 
   * @param {Object} filtros - Filtros a aplicar
   * @returns {Promise<void>}
   */
  const fetchFirstPage = useCallback(async (filtros = {}) => {
    try {
      // Cancelar petición anterior
      cancelCurrentRequest();
      
      // Crear nuevo abort controller
      abortControllerRef.current = new AbortController();
      
      // Actualizar estado inicial
      updateState({
        loading: true,
        error: null,
        remisiones: [],
        lastDoc: null,
        hasMore: false,
        page: 0
      });

      // Guardar filtros actuales
      currentFiltersRef.current = { ...filtros };

      // Realizar consulta
      const result = await fetchRemisiones({
        filtros,
        pageSize,
        startAfterDoc: null
      });

      // Verificar si la petición no fue cancelada
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      updateState({
        loading: false,
        remisiones: result.docs,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        totalFiltered: result.totalFiltered,
        appliedFilters: result.appliedFilters,
        page: 1
      });

    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching first page:', error);
        
        // Determinar mensaje de error específico
        let errorMessage = 'Error al cargar remisiones';
        
        if (error.message.includes('index')) {
          errorMessage = 'La consulta requiere configuración adicional. Intente con filtros más simples.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'No tiene permisos para acceder a esta información.';
        } else if (error.message.includes('unavailable')) {
          errorMessage = 'Servicio temporalmente no disponible. Intente nuevamente.';
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        updateState({
          loading: false,
          error: errorMessage,
          remisiones: [],
          hasMore: false,
          totalFiltered: 0
        });
      }
    }
  }, [pageSize, updateState, cancelCurrentRequest]);

  /**
   * Carga la siguiente página manteniendo los filtros actuales
   * 
   * @returns {Promise<void>}
   */
  const fetchNextPage = useCallback(async () => {
    if (!state.hasMore || state.loading || !state.lastDoc) {
      return;
    }

    try {
      updateState({ loading: true, error: null });

      const result = await fetchRemisiones({
        filtros: currentFiltersRef.current,
        pageSize,
        startAfterDoc: state.lastDoc
      });

      updateState({
        loading: false,
        remisiones: [...state.remisiones, ...result.docs],
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
        totalFiltered: state.totalFiltered + result.totalFiltered,
        page: state.page + 1
      });

    } catch (error) {
      console.error('Error fetching next page:', error);
      
      // Determinar mensaje de error específico para paginación
      let errorMessage = 'Error al cargar más remisiones';
      
      if (error.message.includes('index')) {
        errorMessage = 'No se pueden cargar más resultados con estos filtros. Requiere configuración adicional.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'No tiene permisos para cargar más resultados.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      updateState({
        loading: false,
        error: errorMessage
      });
    }
  }, [state.hasMore, state.loading, state.lastDoc, state.remisiones, state.totalFiltered, state.page, pageSize, updateState]);

  /**
   * Actualiza una remisión específica en el estado local
   * 
   * @param {string} remisionId - ID de la remisión
   * @param {Object} updates - Campos a actualizar
   */
  const updateRemision = useCallback((remisionId, updates) => {
    setState(prevState => ({
      ...prevState,
      remisiones: prevState.remisiones.map(remision =>
        remision.id === remisionId
          ? { ...remision, ...updates }
          : remision
      )
    }));
  }, []);

  /**
   * Elimina una remisión del estado local
   * 
   * @param {string} remisionId - ID de la remisión a eliminar
   */
  const removeRemision = useCallback((remisionId) => {
    setState(prevState => ({
      ...prevState,
      remisiones: prevState.remisiones.filter(remision => remision.id !== remisionId),
      totalFiltered: Math.max(0, prevState.totalFiltered - 1)
    }));
  }, []);

  /**
   * Resetea todo el estado a valores iniciales
   */
  const reset = useCallback(() => {
    cancelCurrentRequest();
    currentFiltersRef.current = {};
    setState(INITIAL_STATE);
  }, [cancelCurrentRequest]);

  /**
   * Recarga con los filtros actuales
   */
  const reload = useCallback(() => {
    fetchFirstPage(currentFiltersRef.current);
  }, [fetchFirstPage]);

  /**
   * Obtiene estadísticas rápidas de las remisiones cargadas
   */
  const getStats = useCallback(() => {
    const stats = {
      total: state.remisiones.length,
      porEstado: {},
      porMovil: {},
      serviciosMasComunes: {},
      tecnicosMasActivos: {}
    };

    state.remisiones.forEach(remision => {
      // Por estado
      const estado = remision.estado || 'sin_estado';
      stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;

      // Por móvil
      const movil = remision.movil || 'sin_movil';
      stats.porMovil[movil] = (stats.porMovil[movil] || 0) + 1;

      // Servicios más comunes
      if (remision.servicios && Array.isArray(remision.servicios)) {
        remision.servicios.forEach(servicio => {
          const nombre = servicio.nombre || 'Sin nombre';
          stats.serviciosMasComunes[nombre] = (stats.serviciosMasComunes[nombre] || 0) + 1;
        });
      }

      // Técnicos más activos
      if (remision.tecnicos && Array.isArray(remision.tecnicos)) {
        remision.tecnicos.forEach(tecnico => {
          const nombre = tecnico.nombre || 'Sin nombre';
          stats.tecnicosMasActivos[nombre] = (stats.tecnicosMasActivos[nombre] || 0) + 1;
        });
      }
    });

    return stats;
  }, [state.remisiones]);

  // Limpiar al desmontar
  const cleanup = useCallback(() => {
    cancelCurrentRequest();
  }, [cancelCurrentRequest]);

  /**
   * Busca remisiones por número de móvil específico
   * 
   * @param {string} numeroMovil - Número del móvil a buscar
   * @returns {Promise<Array>} Lista de remisiones para el móvil
   */
  const fetchRemisionesByMovil = useCallback(async (numeroMovil) => {
    try {
      // Validar input según tipo (número o BO-)
      if (!numeroMovil) {
        throw new Error('Número de móvil inválido');
      }
      
      // Si es string BO-, validar formato
      if (typeof numeroMovil === 'string' && numeroMovil.toUpperCase().startsWith('BO-')) {
        const suffix = numeroMovil.substring(3).trim();
        if (!suffix) {
          throw new Error('Móvil BO- inválido');
        }
        // Usar directamente el string BO-
        const remisiones = await fetchRemisionesByMovilSimple(numeroMovil, 100);
        return remisiones;
      }
      
      // Para números, convertir y validar
      const movilNum = parseInt(numeroMovil);
      if (isNaN(movilNum)) {
        throw new Error('Número de móvil inválido');
      }
      
      // Usar la nueva función que no requiere índices compuestos
      const remisiones = await fetchRemisionesByMovilSimple(movilNum, 100);
      
      return remisiones;
    } catch (error) {
      console.error('Error fetching remisiones by movil:', error);
      
      // Manejo específico de errores para búsqueda por móvil
      if (error.message.includes('inválido')) {
        throw error; // Re-lanzar error de validación
      }
      
      if (error.message.includes('index')) {
        throw new Error('La búsqueda por móvil requiere configuración adicional en la base de datos');
      }
      
      if (error.message.includes('permission')) {
        throw new Error('No tiene permisos para buscar remisiones por móvil');
      }
      
      throw new Error(error.message || 'Error al buscar remisiones por móvil');
    }
  }, []);

  return {
    // Estado
    remisiones: state.remisiones,
    loading: state.loading,
    error: state.error,
    hasMore: state.hasMore,
    totalFiltered: state.totalFiltered,
    appliedFilters: state.appliedFilters,
    page: state.page,
    
    // Acciones principales
    fetchFirstPage,
    fetchNextPage,
    fetchRemisionesByMovil,
    reset,
    reload,
    
    // Acciones de manipulación
    updateRemision,
    removeRemision,
    
    // Utilidades
    getStats,
    cleanup,
    
    // Estado de paginación
    isFirstPage: state.page === 0,
    isLoadingFirstPage: state.loading && state.page === 0,
    isLoadingNextPage: state.loading && state.page > 0,
    
    // Filtros actuales
    currentFilters: currentFiltersRef.current
  };
};

/**
 * Hook para gestionar historial de una remisión específica
 * 
 * @param {string} remisionId - ID de la remisión
 * @returns {Object} Estado y funciones para gestionar historial
 */
export const useHistorialRemision = (remisionId) => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistorial = useCallback(async () => {
    if (!remisionId) return;

    try {
      setLoading(true);
      setError(null);

      const historialData = await fetchHistorialRemision(remisionId);
      setHistorial(historialData);

    } catch (error) {
      console.error('Error fetching historial:', error);
      setError(error.message || 'Error al cargar historial');
    } finally {
      setLoading(false);
    }
  }, [remisionId]);

  const addHistorialEntry = useCallback((entry) => {
    setHistorial(prevHistorial => [entry, ...prevHistorial]);
  }, []);

  const updateHistorialEntry = useCallback((entryId, updates) => {
    setHistorial(prevHistorial =>
      prevHistorial.map(entry =>
        entry.id === entryId ? { ...entry, ...updates } : entry
      )
    );
  }, []);

  const removeHistorialEntry = useCallback((entryId) => {
    setHistorial(prevHistorial =>
      prevHistorial.filter(entry => entry.id !== entryId)
    );
  }, []);

  return {
    historial,
    loading,
    error,
    fetchHistorial,
    addHistorialEntry,
    updateHistorialEntry,
    removeHistorialEntry,
    hasHistorial: historial.length > 0
  };
};

export default useRemisiones;
