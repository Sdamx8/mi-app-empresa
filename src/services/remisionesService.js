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
  updateDoc,
  deleteDoc,
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
  
  if (filtros.movil !== undefined && filtros.movil !== null) {
    // Si es número, usar directamente
    if (typeof filtros.movil === 'number') {
      prepared.movil = filtros.movil;
    } else if (typeof filtros.movil === 'string' && filtros.movil.trim()) {
      const movilStr = filtros.movil.trim();
      
      // Si es un móvil BO-, mantener formato exacto (case-sensitive)
      if (movilStr.toUpperCase().startsWith('BO-')) {
        // Normalizar: BO- en mayúsculas, el resto como está
        const prefix = 'BO-';
        const suffix = movilStr.substring(3); // Después de "BO-"
        prepared.movil = prefix + suffix;
      } else {
        // Para números, convertir
        const movilNum = parseInt(movilStr);
        if (!isNaN(movilNum)) {
          prepared.movil = movilNum;
        }
      }
    }
  }
  
  if (filtros.estado && typeof filtros.estado === 'string' && filtros.estado.trim()) {
    prepared.estado = filtros.estado.toLowerCase().trim();
  }
  
  if (filtros.remision !== undefined && filtros.remision !== null) {
    // Si es número, usar directamente; si es string, trimear y convertir
    if (typeof filtros.remision === 'number') {
      prepared.remision = filtros.remision;
    } else if (typeof filtros.remision === 'string' && filtros.remision.trim()) {
      const remisionNum = parseInt(filtros.remision.trim());
      if (!isNaN(remisionNum)) {
        prepared.remision = remisionNum;
      }
    }
  }
  
  // Filtro por técnico (busca en array de técnicos)
  if (filtros.tecnico && typeof filtros.tecnico === 'string' && filtros.tecnico.trim()) {
    prepared.tecnico = filtros.tecnico.trim();
  }
  
  // Filtro por UNE
  if (filtros.une && typeof filtros.une === 'string' && filtros.une.trim()) {
    prepared.une = filtros.une.trim();
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
 * Simplificado para evitar errores de índices compuestos
 */
const buildQuery = (filtros, pageSize, startAfterDoc) => {
  let q = query(collection(db, COLLECTION_NAME));
  
  // Solo aplicar un filtro principal para evitar índices compuestos
  // Los demás filtros se aplicarán post-query en processDocuments
  
  // Priorizar filtro por fecha si existe (más común)
  if (filtros.fechaInicio) {
    q = query(q, 
      where('fecha_remision', '>=', filtros.fechaInicio),
      orderBy('fecha_remision', 'desc')
    );
  } else if (filtros.fechaFin) {
    q = query(q, 
      where('fecha_remision', '<=', filtros.fechaFin),
      orderBy('fecha_remision', 'desc')
    );
  } else if (filtros.movil) {
    // Filtro por móvil directo en query
    q = query(q, 
      where('movil', '==', filtros.movil),
      orderBy('fecha_remision', 'desc')
    );
  } else if (filtros.estado) {
    // Si no hay filtro de fecha ni móvil, usar estado
    q = query(q, 
      where('estado', '==', filtros.estado),
      orderBy('fecha_remision', 'desc')
    );
  } else if (filtros.remision) {
    // Filtro por número de remisión específico
    q = query(q, where('remision', '==', filtros.remision));
  } else {
    // Query básica sin filtros WHERE - solo ordenar
    q = query(q, orderBy('fecha_remision', 'desc'));
  }
  
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
  
  // Aplicar filtros que no se aplicaron en la query principal
  
  // Filtro por móvil (solo si no se aplicó en query)
  if (filtros.movil && !filtros.fechaInicio && !filtros.fechaFin) {
    // Ya se aplicó en query, no filtrar de nuevo
  } else if (filtros.movil) {
    // Filtrar por móvil cuando se combinó con fecha - manejar números y strings BO-
    processedDocs = processedDocs.filter(doc => {
      if (!doc.movil) return false;
      
      // Si el filtro es string BO-, comparar directamente (case-sensitive)
      if (typeof filtros.movil === 'string' && filtros.movil.startsWith('BO-')) {
        return String(doc.movil) === filtros.movil;
      }
      
      // Para números, comparación exacta
      const docMovil = typeof doc.movil === 'number' ? doc.movil : parseInt(doc.movil);
      const filtroMovil = typeof filtros.movil === 'number' ? filtros.movil : parseInt(filtros.movil);
      
      return docMovil === filtroMovil;
    });
  }
  
  // Filtro por estado (si no se aplicó en query)
  if (filtros.estado && !filtros.fechaInicio && !filtros.fechaFin) {
    // Ya se aplicó en query, no filtrar de nuevo
  } else if (filtros.estado) {
    processedDocs = processedDocs.filter(doc => 
      doc.estado === filtros.estado
    );
  }
  
  // Filtro por remisión (si no se aplicó en query)
  if (filtros.remision && filtros.fechaInicio) {
    processedDocs = processedDocs.filter(doc => {
      if (!doc.remision) return false;
      
      // Convertir ambos a string para la comparación
      const docRemision = doc.remision.toString();
      const filtroRemision = filtros.remision.toString();
      
      return docRemision.includes(filtroRemision);
    });
  }
  
  // Filtro por rango de fechas (si no se aplicó completamente en query)
  if (filtros.fechaInicio && filtros.fechaFin && !filtros.fechaInicio) {
    // Si solo se aplicó fechaInicio, aplicar fechaFin aquí
    processedDocs = processedDocs.filter(doc => {
      const docDate = doc.fecha_remision;
      return docDate <= filtros.fechaFin;
    });
  }
  
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
  
  // Filtro por texto general (búsqueda en múltiples campos)
  if (filtros.texto) {
    const textoLower = filtros.texto.toLowerCase();
    processedDocs = processedDocs.filter(doc => {
      return (
        (doc.remision && doc.remision.toString().toLowerCase().includes(textoLower)) ||
        (doc.cliente && doc.cliente.toLowerCase().includes(textoLower)) ||
        (doc.movil && doc.movil.toString().toLowerCase().includes(textoLower)) ||
        (doc.descripcion && doc.descripcion.toLowerCase().includes(textoLower)) ||
        (doc.observaciones && doc.observaciones.toLowerCase().includes(textoLower))
      );
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
    
    // Manejo específico para errores de índices faltantes
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      const errorMessage = 'Esta consulta requiere un índice en Firestore. Por favor, contacte al administrador o use filtros más simples.';
      console.error('FIRESTORE INDEX ERROR:', {
        originalError: error.message,
        filters: filtros,
        suggestion: 'Intente buscar con un solo filtro a la vez (solo fecha, solo móvil, etc.)'
      });
      throw new Error(errorMessage);
    }
    
    // Manejo para otros errores de Firebase
    if (error.code === 'permission-denied') {
      throw new Error('No tiene permisos para acceder a esta información');
    }
    
    if (error.code === 'unavailable') {
      throw new Error('Servicio temporalmente no disponible. Por favor, intente nuevamente');
    }
    
    // Error genérico con información útil para debugging
    const errorMessage = `Error al consultar remisiones: ${error.message}`;
    console.error('REMISIONES SERVICE ERROR:', {
      error: error,
      filters: filtros,
      errorCode: error.code
    });
    
    throw new Error(errorMessage);
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
 * Busca remisiones por móvil específico usando consulta simple
 * @param {number|string} numeroMovil - Número del móvil
 * @param {number} maxResults - Límite de resultados (default 50)
 * @returns {Promise<Array>} - Array de remisiones
 */
export const fetchRemisionesByMovilSimple = async (numeroMovil, maxResults = 50) => {
  try {
    console.log('🔍 Buscando remisiones por móvil:', numeroMovil);

    let valorQuery;
    
    // Determinar si es móvil BO- o numérico
    if (typeof numeroMovil === 'string' && numeroMovil.toUpperCase().startsWith('BO-')) {
      // Para móviles BO-, mantener como string normalizado
      const prefix = 'BO-';
      const suffix = numeroMovil.substring(3);
      valorQuery = prefix + suffix;
      console.log('🏷️ Búsqueda de móvil BO-:', valorQuery);
    } else {
      // Para números, convertir
      const movilNumber = typeof numeroMovil === 'string' ? parseInt(numeroMovil) : numeroMovil;
      
      if (isNaN(movilNumber)) {
        throw new Error('Número de móvil inválido');
      }
      
      valorQuery = movilNumber;
      console.log('🔢 Búsqueda de móvil numérico:', valorQuery);
    }

    // Consulta simple por móvil sin ordenamiento para evitar índice compuesto
    const remisionesRef = collection(db, COLLECTION_NAME);
    const q = query(
      remisionesRef,
      where('movil', '==', valorQuery),
      limit(maxResults)
    );

    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('📄 No se encontraron remisiones para el móvil:', valorQuery);
      return [];
    }

    const docs = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        fecha_remision: data.fecha_remision?.toDate?.() || data.fecha_remision,
        migratedAt: data.migratedAt?.toDate?.() || data.migratedAt
      };
    });

    // Ordenar en el cliente por fecha (más reciente primero)
    docs.sort((a, b) => {
      const dateA = a.fecha_remision instanceof Date ? a.fecha_remision : new Date(a.fecha_remision || 0);
      const dateB = b.fecha_remision instanceof Date ? b.fecha_remision : new Date(b.fecha_remision || 0);
      return dateB.getTime() - dateA.getTime();
    });

    console.log(`✅ ${docs.length} remisiones encontradas para móvil ${valorQuery}`);
    return docs;

  } catch (error) {
    console.error('❌ Error al buscar remisiones por móvil:', error);
    
    // Mensajes específicos para diferentes tipos de errores
    if (error.code === 'permission-denied') {
      throw new Error('No tiene permisos para consultar esta información');
    }
    
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      throw new Error('Esta consulta requiere configuración adicional en la base de datos');
    }
    
    if (error.message.includes('inválido')) {
      throw error; // Re-lanzar errores de validación
    }
    
    throw new Error(`Error al buscar remisiones por móvil: ${error.message}`);
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
    
    // Manejo específico para errores de índices faltantes en exportación
    if (error.code === 'failed-precondition' && error.message.includes('index')) {
      const errorMessage = 'No se puede exportar con esta combinación de filtros. Requiere un índice en Firestore.';
      console.error('EXPORT INDEX ERROR:', {
        originalError: error.message,
        filters: filtros,
        suggestion: 'Intente exportar con filtros más simples o sin filtros'
      });
      throw new Error(errorMessage);
    }
    
    // Otros errores de Firebase
    if (error.code === 'permission-denied') {
      throw new Error('No tiene permisos para exportar esta información');
    }
    
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

/**
 * Actualiza una remisión existente
 */
export const updateRemision = async (remisionId, updates) => {
  try {
    if (!remisionId) {
      throw new Error('ID de remisión requerido');
    }

    const remisionRef = doc(db, COLLECTION_NAME, remisionId);
    await updateDoc(remisionRef, {
      ...updates,
      updated_at: Timestamp.now()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating remision:', error);
    throw new Error(`Error al actualizar remisión: ${error.message}`);
  }
};

/**
 * Elimina una remisión
 */
export const deleteRemision = async (remisionId) => {
  try {
    if (!remisionId) {
      throw new Error('ID de remisión requerido');
    }

    const remisionRef = doc(db, COLLECTION_NAME, remisionId);
    await deleteDoc(remisionRef);

    return { success: true };
  } catch (error) {
    console.error('Error deleting remision:', error);
    throw new Error(`Error al eliminar remisión: ${error.message}`);
  }
};

// Exportar funciones adicionales
export default {
  fetchRemisiones,
  fetchRemisionById,
  fetchHistorialRemision,
  fetchAllRemisionesForExport,
  fetchRemisionesStats,
  updateRemision,
  deleteRemision
};
