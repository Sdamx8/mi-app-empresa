/**
 * Servicio para gestión de remisiones con Firestore
 * 
 * Proporciona funciones para:
 * - Consulta paginada con cursor
 * - Filtrado por múltiples criterios
 * - Gestión de errores y loading states
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  startAfter, 
  limit, 
  getDocs,
  doc,
  getDoc,
  Timestamp
} from 'firebase/firestore';

import { db } from '../core/config/firebaseConfig';

// Constantes
const COLLECTION_NAME = 'remisiones';
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

/**
 * Convierte filtros de string a formato Firestore
 */
const prepareFilters = (filtros) => {
  const prepared = {};
  
  if (filtros.movil && filtros.movil.trim()) {
    prepared.movil = filtros.movil.trim();
  }
  
  if (filtros.estado && filtros.estado.trim()) {
    prepared.estado = filtros.estado.toLowerCase().trim();
  }
  
  if (filtros.remision && filtros.remision.trim()) {
    const remisionNum = parseInt(filtros.remision.trim());
    if (!isNaN(remisionNum)) {
      prepared.remision = remisionNum;
    }
  }
  
  // Filtro por técnico (busca en array de técnicos)
  if (filtros.tecnico && filtros.tecnico.trim()) {
    prepared.tecnico = filtros.tecnico.trim();
  }
  
  // Filtros de fecha
  if (filtros.fechaInicio) {
    prepared.fechaInicio = filtros.fechaInicio instanceof Date 
      ? Timestamp.fromDate(filtros.fechaInicio)
      : Timestamp.fromDate(new Date(filtros.fechaInicio));
  }
  
  if (filtros.fechaFin) {
    prepared.fechaFin = filtros.fechaFin instanceof Date 
      ? Timestamp.fromDate(filtros.fechaFin)
      : Timestamp.fromDate(new Date(filtros.fechaFin));
  }
  
  return prepared;
};

/**
 * Construye query de Firestore con filtros aplicados
 */
const buildQuery = (filtros, pageSize, startAfterDoc) => {
  let q = query(collection(db, COLLECTION_NAME));
  
  // Aplicar filtros simples
  if (filtros.movil) {
    q = query(q, where('movil', '==', filtros.movil));
  }
  
  if (filtros.estado) {
    q = query(q, where('estado', '==', filtros.estado));
  }
  
  if (filtros.remision) {
    q = query(q, where('remision', '==', filtros.remision));
  }
  
  // Filtro por rango de fechas
  if (filtros.fechaInicio && filtros.fechaFin) {
    q = query(q, 
      where('fecha_remision', '>=', filtros.fechaInicio),
      where('fecha_remision', '<=', filtros.fechaFin)
    );
  } else if (filtros.fechaInicio) {
    q = query(q, where('fecha_remision', '>=', filtros.fechaInicio));
  } else if (filtros.fechaFin) {
    q = query(q, where('fecha_remision', '<=', filtros.fechaFin));
  }
  
  // Ordenar por fecha de remisión (descendente) - más recientes primero
  q = query(q, orderBy('fecha_remision', 'desc'));
  
  // Paginación con cursor
  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }
  
  // Limitar resultados
  q = query(q, limit(pageSize));
  
  return q;
};

/**
 * Procesa documentos obtenidos y aplica filtros post-query
 */
const processDocuments = (docs, filtros) => {
  let processedDocs = docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    // Convertir timestamps a fechas legibles
    fecha_remision: doc.data().fecha_remision?.toDate?.() || doc.data().fecha_remision,
    migratedAt: doc.data().migratedAt?.toDate?.() || doc.data().migratedAt
  }));
  
  // Filtro por técnico (post-query porque requiere array-contains-any o lógica compleja)
  if (filtros.tecnico) {
    processedDocs = processedDocs.filter(doc => {
      // Buscar en array de técnicos (nueva estructura)
      if (doc.tecnicos && Array.isArray(doc.tecnicos)) {
        return doc.tecnicos.some(tecnico => 
          tecnico.nombre && tecnico.nombre.toLowerCase().includes(filtros.tecnico.toLowerCase())
        );
      }
      
      // Fallback: buscar en campos legacy tecnico1, tecnico2, etc.
      for (let i = 1; i <= 10; i++) {
        const tecnicoField = doc[`tecnico${i}`];
        if (tecnicoField && 
            typeof tecnicoField === 'string' && 
            tecnicoField.toLowerCase().includes(filtros.tecnico.toLowerCase())) {
          return true;
        }
      }
      
      return false;
    });
  }
  
  return processedDocs;
};

/**
 * Obtiene remisiones con paginación cursor-based
 * 
 * @param {Object} options - Opciones de consulta
 * @param {Object} options.filtros - Filtros a aplicar
 * @param {number} options.pageSize - Tamaño de página (default: 25)
 * @param {DocumentSnapshot} options.startAfterDoc - Documento después del cual iniciar
 * @returns {Promise<{docs: Array, lastDoc: DocumentSnapshot, hasMore: boolean, totalFiltered: number}>}
 */
export const fetchRemisiones = async ({ filtros = {}, pageSize = DEFAULT_PAGE_SIZE, startAfterDoc = null }) => {
  try {
    // Validar tamaño de página
    const validPageSize = Math.min(Math.max(pageSize, 1), MAX_PAGE_SIZE);
    
    // Preparar filtros
    const preparedFilters = prepareFilters(filtros);
    
    // Construir y ejecutar query
    const q = buildQuery(preparedFilters, validPageSize, startAfterDoc);
    const snapshot = await getDocs(q);
    
    // Procesar documentos
    const processedDocs = processDocuments(snapshot.docs, preparedFilters);
    
    // Obtener último documento para paginación
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    
    // Verificar si hay más resultados
    const hasMore = snapshot.docs.length === validPageSize;
    
    return {
      docs: processedDocs,
      lastDoc,
      hasMore,
      totalFiltered: processedDocs.length,
      appliedFilters: preparedFilters
    };
    
  } catch (error) {
    console.error('Error fetching remisiones:', error);
    throw new Error(`Error al consultar remisiones: ${error.message}`);
  }
};

/**
 * Obtiene una remisión específica por ID
 * 
 * @param {string} remisionId - ID de la remisión
 * @returns {Promise<Object|null>}
 */
export const fetchRemisionById = async (remisionId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, remisionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        fecha_remision: data.fecha_remision?.toDate?.() || data.fecha_remision,
        migratedAt: data.migratedAt?.toDate?.() || data.migratedAt
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching remision by ID:', error);
    throw new Error(`Error al obtener remisión ${remisionId}: ${error.message}`);
  }
};

/**
 * Obtiene historial de una remisión específica
 * 
 * @param {string} remisionId - ID de la remisión
 * @returns {Promise<Array>}
 */
export const fetchHistorialRemision = async (remisionId) => {
  try {
    const historialRef = collection(db, COLLECTION_NAME, remisionId, 'historial');
    const q = query(historialRef, orderBy('fechaActividad', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaActividad: doc.data().fechaActividad?.toDate?.() || doc.data().fechaActividad
    }));
    
  } catch (error) {
    console.error('Error fetching historial:', error);
    throw new Error(`Error al obtener historial de remisión ${remisionId}: ${error.message}`);
  }
};

/**
 * Construye filtros para exportación (sin límites de paginación)
 * 
 * @param {Object} filtros - Filtros de búsqueda
 * @returns {Promise<Array>} - Todas las remisiones que coinciden con los filtros
 */
export const fetchAllRemisionesForExport = async (filtros = {}) => {
  try {
    const preparedFilters = prepareFilters(filtros);
    
    // Query sin límite para exportación
    let q = query(collection(db, COLLECTION_NAME));
    
    // Aplicar mismo lógica de filtros que fetchRemisiones pero sin limit
    if (preparedFilters.movil) {
      q = query(q, where('movil', '==', preparedFilters.movil));
    }
    
    if (preparedFilters.estado) {
      q = query(q, where('estado', '==', preparedFilters.estado));
    }
    
    if (preparedFilters.remision) {
      q = query(q, where('remision', '==', preparedFilters.remision));
    }
    
    // Filtros de fecha
    if (preparedFilters.fechaInicio && preparedFilters.fechaFin) {
      q = query(q, 
        where('fecha_remision', '>=', preparedFilters.fechaInicio),
        where('fecha_remision', '<=', preparedFilters.fechaFin)
      );
    } else if (preparedFilters.fechaInicio) {
      q = query(q, where('fecha_remision', '>=', preparedFilters.fechaInicio));
    } else if (preparedFilters.fechaFin) {
      q = query(q, where('fecha_remision', '<=', preparedFilters.fechaFin));
    }
    
    q = query(q, orderBy('fecha_remision', 'desc'));
    
    const snapshot = await getDocs(q);
    
    // Procesar todos los documentos
    const allDocs = processDocuments(snapshot.docs, preparedFilters);
    
    return allDocs;
    
  } catch (error) {
    console.error('Error fetching all remisiones for export:', error);
    throw new Error(`Error al obtener remisiones para exportar: ${error.message}`);
  }
};

/**
 * Obtiene estadísticas rápidas de remisiones
 * 
 * @param {Object} filtros - Filtros a aplicar  
 * @returns {Promise<Object>} - Estadísticas básicas
 */
export const fetchRemisionesStats = async (filtros = {}) => {
  try {
    const allDocs = await fetchAllRemisionesForExport(filtros);
    
    const stats = {
      total: allDocs.length,
      porEstado: {},
      porMovil: {},
      serviciosMasComunes: {},
      tecnicosMasActivos: {}
    };
    
    allDocs.forEach(doc => {
      // Estadísticas por estado
      const estado = doc.estado || 'sin_estado';
      stats.porEstado[estado] = (stats.porEstado[estado] || 0) + 1;
      
      // Estadísticas por móvil
      const movil = doc.movil || 'sin_movil';
      stats.porMovil[movil] = (stats.porMovil[movil] || 0) + 1;
      
      // Servicios más comunes
      if (doc.servicios && Array.isArray(doc.servicios)) {
        doc.servicios.forEach(servicio => {
          const nombre = servicio.nombre || 'Sin nombre';
          stats.serviciosMasComunes[nombre] = (stats.serviciosMasComunes[nombre] || 0) + 1;
        });
      }
      
      // Técnicos más activos
      if (doc.tecnicos && Array.isArray(doc.tecnicos)) {
        doc.tecnicos.forEach(tecnico => {
          const nombre = tecnico.nombre || 'Sin nombre';
          stats.tecnicosMasActivos[nombre] = (stats.tecnicosMasActivos[nombre] || 0) + 1;
        });
      }
    });
    
    return stats;
    
  } catch (error) {
    console.error('Error fetching remisiones stats:', error);
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }
};

// Exportar funciones adicionales
export default {
  fetchRemisiones,
  fetchRemisionById,
  fetchHistorialRemision,
  fetchAllRemisionesForExport,
  fetchRemisionesStats
};
