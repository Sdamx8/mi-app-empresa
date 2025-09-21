/**
 * 🔥 Hook para obtener remisiones en tiempo real desde Firestore
 * ============================================================
 * Proporciona datos de remisiones con actualización automática usando onSnapshot
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';

const COLLECTION_NAME = 'remisiones';

/**
 * Estados disponibles para las remisiones
 */
export const ESTADOS_REMISION = [
  'GENERADO',
  'PENDIENTE', 
  'PROFORMA',
  'RADICADO',
  'FACTURADO',
  'CANCELADO',
  'CORTESIA',
  'GARANTIA',
  'SIN_VINCULAR'
];

/**
 * Estados que requieren justificación
 */
export const ESTADOS_CON_JUSTIFICACION = [
  'CANCELADO',
  'CORTESIA', 
  'GARANTIA',
  'SIN_VINCULAR'
];

/**
 * Hook principal para gestionar remisiones en tiempo real
 */
export const useRealTimeRemisiones = () => {
  const [remisiones, setRemisiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Configurar listener en tiempo real
  useEffect(() => {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const remisionesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Convertir timestamps a Date objects
          fecha_remision: doc.data().fecha_remision?.toDate?.() || new Date(),
          fecha_maximo: doc.data().fecha_maximo?.toDate?.() || new Date(),
          fecha_bit_prof: doc.data().fecha_bit_prof?.toDate?.() || new Date(),
          radicacion: doc.data().radicacion?.toDate?.() || new Date(),
          created_at: doc.data().created_at?.toDate?.() || new Date(),
          updated_at: doc.data().updated_at?.toDate?.() || new Date()
        }));
        
        setRemisiones(remisionesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching remisiones:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Contadores por estado
  const contadores = useMemo(() => {
    return remisiones.reduce((acc, remision) => {
      const estado = remision.estado || 'GENERADO';
      acc[estado] = (acc[estado] || 0) + 1;
      return acc;
    }, {});
  }, [remisiones]);

  // Funciones CRUD
  const updateRemision = async (remisionId, data) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, remisionId);
      await updateDoc(docRef, {
        ...data,
        updated_at: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating remision:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteRemision = async (remisionId) => {
    try {
      const docRef = doc(db, COLLECTION_NAME, remisionId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting remision:', error);
      return { success: false, error: error.message };
    }
  };

  const createRemision = async (data) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...data,
        estado: data.estado || 'GENERADO',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating remision:', error);
      return { success: false, error: error.message };
    }
  };

  const changeEstado = async (remisionId, nuevoEstado, justificacion = null) => {
    try {
      const updateData = {
        estado: nuevoEstado,
        updated_at: serverTimestamp()
      };

      // Agregar justificación si es requerida
      if (ESTADOS_CON_JUSTIFICACION.includes(nuevoEstado) && justificacion) {
        updateData.justificacion_estado = justificacion;
      }

      // Agregar timestamp específico del estado
      if (nuevoEstado === 'RADICADO') {
        updateData.fecha_radicacion = serverTimestamp();
      } else if (nuevoEstado === 'FACTURADO') {
        updateData.fecha_facturacion = serverTimestamp();
      }

      const docRef = doc(db, COLLECTION_NAME, remisionId);
      await updateDoc(docRef, updateData);
      
      return { success: true };
    } catch (error) {
      console.error('Error changing estado:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    remisiones,
    loading,
    error,
    contadores,
    updateRemision,
    deleteRemision, 
    createRemision,
    changeEstado,
    // Estados disponibles
    ESTADOS_REMISION,
    ESTADOS_CON_JUSTIFICACION
  };
};

/**
 * Hook para filtrar y paginar remisiones
 */
export const useFilteredRemisiones = (remisiones, filters = {}) => {
  return useMemo(() => {
    let filtered = [...remisiones];

    // Filtro por texto global
    if (filters.globalFilter) {
      const searchTerm = filters.globalFilter.toLowerCase();
      filtered = filtered.filter(remision => 
        Object.values(remision).some(value => 
          String(value).toLowerCase().includes(searchTerm)
        )
      );
    }

    // Filtro por estado
    if (filters.estado && filters.estado !== 'ALL') {
      filtered = filtered.filter(remision => remision.estado === filters.estado);
    }

    // Filtro por móvil
    if (filters.movil) {
      filtered = filtered.filter(remision => 
        String(remision.movil).toLowerCase().includes(filters.movil.toLowerCase())
      );
    }

    // Filtro por rango de fechas
    if (filters.fechaDesde) {
      filtered = filtered.filter(remision => 
        new Date(remision.fecha_remision) >= new Date(filters.fechaDesde)
      );
    }

    if (filters.fechaHasta) {
      filtered = filtered.filter(remision => 
        new Date(remision.fecha_remision) <= new Date(filters.fechaHasta)
      );
    }

    return filtered;
  }, [remisiones, filters]);
};