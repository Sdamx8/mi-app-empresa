import { useState, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';

/**
 * Hook optimizado para búsquedas en remisiones
 * Incluye cache, paginación y filtros avanzados
 */
export const useHistorialOptimizado = () => {
  const [estado, setEstado] = useState({
    remisiones: [],
    loading: false,
    error: null,
    totalCargadas: 0,
    hayMas: true,
    ultimoDoc: null
  });

  const cacheRef = useRef(new Map());
  const LIMITE_POR_PAGINA = 20;

  // Generar clave de cache
  const generarClaveCache = (filtros) => {
    return JSON.stringify(filtros);
  };

  // Limpiar cache
  const limpiarCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Buscar con filtros optimizados
  const buscarRemisiones = useCallback(async (filtros = {}, opciones = {}) => {
    const { concatenar = false, forzarRecarga = false } = opciones;
    
    setEstado(prev => ({
      ...prev,
      loading: true,
      error: null
    }));

    try {
      // Verificar cache si no es recarga forzada
      const claveCache = generarClaveCache(filtros);
      if (!forzarRecarga && !concatenar && cacheRef.current.has(claveCache)) {
        const resultadoCache = cacheRef.current.get(claveCache);
        setEstado(prev => ({
          ...prev,
          ...resultadoCache,
          loading: false
        }));
        return resultadoCache.remisiones;
      }

      // Construir query
      let queryRef = collection(db, 'remisiones');
      let condiciones = [];

      // Aplicar filtros específicos
      if (filtros.remision) {
        condiciones.push(where('remision', '==', parseInt(filtros.remision)));
      }

      if (filtros.movil) {
        condiciones.push(where('movil', '==', parseInt(filtros.movil)));
      }

      if (filtros.estado) {
        condiciones.push(where('estado', '==', filtros.estado));
      }

      if (filtros.fechaDesde || filtros.fechaHasta) {
        // Para rangos de fecha, usaremos filtros en el cliente
        // Firestore requiere índices compuestos para múltiples where con rangos
      }

      // Aplicar condiciones al query
      if (condiciones.length > 0) {
        queryRef = query(queryRef, ...condiciones);
      }

      // Ordenamiento
      queryRef = query(queryRef, orderBy('fecha_remision', 'desc'));

      // Paginación
      if (concatenar && estado.ultimoDoc) {
        queryRef = query(queryRef, startAfter(estado.ultimoDoc));
      }

      // Límite
      queryRef = query(queryRef, limit(LIMITE_POR_PAGINA));

      // Ejecutar query
      const querySnapshot = await getDocs(queryRef);
      const nuevasRemisiones = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _doc: doc // Guardamos referencia para paginación
      }));

      // Filtros adicionales en el cliente
      let remisionesFiltradas = nuevasRemisiones;

      // Filtro de búsqueda general
      if (filtros.busquedaGeneral) {
        const busqueda = filtros.busquedaGeneral.toLowerCase();
        remisionesFiltradas = remisionesFiltradas.filter(remision => {
          const campos = [
            remision.remision?.toString(),
            remision.movil?.toString(),
            remision.autorizo,
            remision.carroceria,
            remision.genero,
            remision.no_orden,
            remision.une,
            remision.tecnico1,
            remision.tecnico2,
            remision.tecnico3,
            remision.servicio1,
            remision.servicio2,
            remision.servicio3,
            remision.servicio4,
            remision.servicio5
          ];
          
          return campos.some(campo => 
            campo?.toString().toLowerCase().includes(busqueda)
          );
        });
      }

      // Filtro de rango de fechas
      if (filtros.fechaDesde || filtros.fechaHasta) {
        remisionesFiltradas = remisionesFiltradas.filter(remision => {
          const fechaRemision = remision.fecha_remision?.toDate?.() || new Date(remision.fecha_remision);
          
          if (filtros.fechaDesde) {
            const fechaDesde = new Date(filtros.fechaDesde);
            if (fechaRemision < fechaDesde) return false;
          }
          
          if (filtros.fechaHasta) {
            const fechaHasta = new Date(filtros.fechaHasta);
            fechaHasta.setHours(23, 59, 59);
            if (fechaRemision > fechaHasta) return false;
          }
          
          return true;
        });
      }

      // Filtro de técnico
      if (filtros.tecnico) {
        const tecnicoBusqueda = filtros.tecnico.toLowerCase();
        remisionesFiltradas = remisionesFiltradas.filter(remision => {
          const tecnicos = [remision.tecnico1, remision.tecnico2, remision.tecnico3];
          return tecnicos.some(tecnico => 
            tecnico?.toLowerCase().includes(tecnicoBusqueda)
          );
        });
      }

      const ultimoDoc = querySnapshot.docs[querySnapshot.docs.length - 1] || null;
      const hayMas = querySnapshot.docs.length === LIMITE_POR_PAGINA;

      const nuevoEstado = {
        remisiones: concatenar ? [...estado.remisiones, ...remisionesFiltradas] : remisionesFiltradas,
        loading: false,
        error: null,
        totalCargadas: concatenar ? estado.totalCargadas + remisionesFiltradas.length : remisionesFiltradas.length,
        hayMas,
        ultimoDoc
      };

      setEstado(nuevoEstado);

      // Guardar en cache solo si no es concatenación
      if (!concatenar) {
        cacheRef.current.set(claveCache, nuevoEstado);
      }

      return nuevoEstado.remisiones;

    } catch (error) {
      console.error('❌ Error en búsqueda de remisiones:', error);
      const errorState = {
        loading: false,
        error: 'Error al buscar remisiones. Intente nuevamente.'
      };
      setEstado(prev => ({ ...prev, ...errorState }));
      throw error;
    }
  }, [estado.remisiones, estado.totalCargadas, estado.ultimoDoc]);

  // Cargar más resultados (paginación)
  const cargarMas = useCallback(async (filtros = {}) => {
    if (!estado.hayMas || estado.loading) return;
    
    return buscarRemisiones(filtros, { concatenar: true });
  }, [buscarRemisiones, estado.hayMas, estado.loading]);

  // Buscar por remisión específica
  const buscarPorRemision = useCallback(async (numeroRemision) => {
    return buscarRemisiones({ remision: numeroRemision }, { forzarRecarga: true });
  }, [buscarRemisiones]);

  // Buscar por móvil específico
  const buscarPorMovil = useCallback(async (numeroMovil) => {
    return buscarRemisiones({ movil: numeroMovil }, { forzarRecarga: true });
  }, [buscarRemisiones]);

  // Obtener estadísticas
  const obtenerEstadisticas = useCallback(() => {
    const { remisiones } = estado;
    
    if (remisiones.length === 0) {
      return {
        total: 0,
        porEstado: {},
        totalFacturado: 0,
        promediaFacturacion: 0
      };
    }

    const estadisticas = {
      total: remisiones.length,
      porEstado: {},
      totalFacturado: 0,
      promediaFacturacion: 0
    };

    // Calcular estadísticas
    remisiones.forEach(remision => {
      // Estados
      const estado = remision.estado || 'PENDIENTE';
      estadisticas.porEstado[estado] = (estadisticas.porEstado[estado] || 0) + 1;
      
      // Facturación
      const total = remision.total || 0;
      estadisticas.totalFacturado += total;
    });

    estadisticas.promediaFacturacion = estadisticas.totalFacturado / remisiones.length;

    return estadisticas;
  }, [estado.remisiones]);

  // Limpiar resultados
  const limpiarResultados = useCallback(() => {
    setEstado({
      remisiones: [],
      loading: false,
      error: null,
      totalCargadas: 0,
      hayMas: true,
      ultimoDoc: null
    });
  }, []);

  return {
    // Estado
    remisiones: estado.remisiones,
    loading: estado.loading,
    error: estado.error,
    totalCargadas: estado.totalCargadas,
    hayMas: estado.hayMas,
    
    // Funciones de búsqueda
    buscarRemisiones,
    cargarMas,
    buscarPorRemision,
    buscarPorMovil,
    
    // Utilidades
    obtenerEstadisticas,
    limpiarResultados,
    limpiarCache
  };
};

export default useHistorialOptimizado;
