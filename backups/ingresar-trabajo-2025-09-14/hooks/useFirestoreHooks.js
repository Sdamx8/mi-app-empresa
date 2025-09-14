/**
 * 🔥 FIRESTORE HOOKS - Remisiones Spreadsheet
 * ===========================================
 * Custom hooks para manejo de datos de Firestore
 * Servicios, Empleados, y Remisiones
 */

import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  query, 
  where,
  orderBy,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';

// Hook para cargar servicios desde Firestore
export const useServicios = () => {
  const [servicios, setServicios] = useState([]);
  const [serviciosForSelect, setServiciosForSelect] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadServicios = async () => {
      try {
        setLoading(true);
        const serviciosSnapshot = await getDocs(collection(db, 'servicios'));
        const serviciosData = serviciosSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Estructura para compatibilidad con el código existente
            rawData: data
          };
        });
        
        // Datos originales para otros usos
        setServicios(serviciosData);
        
        // Datos formateados para los selects (usando título como label Y value)
        const serviciosForSelectData = serviciosData.map(servicio => {
          const titulo = servicio.título || servicio.titulo || 'Servicio sin nombre';
          return {
            value: titulo, // Guardar el título completo como valor (según estructura Firestore)
            label: titulo, // Mostrar el título en el dropdown
            costo: servicio.costo || 0,
            id_servicio: servicio.id_servicio || servicio.id, // Mantener ID para referencia
            // Mantener referencia completa para cálculos
            fullData: servicio
          };
        });
        
        setServiciosForSelect(serviciosForSelectData);
      } catch (err) {
        console.error('Error loading servicios:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadServicios();
  }, []);

  // Función helper para encontrar un servicio por título
  const findServicioByTitulo = (titulo) => {
    return serviciosForSelect.find(s => s.value === titulo);
  };

  // Función helper para obtener el costo de un servicio por título
  const getCostoByTitulo = (titulo) => {
    const servicio = findServicioByTitulo(titulo);
    return servicio ? servicio.costo : 0;
  };

  return { 
    servicios, 
    serviciosForSelect, 
    loading, 
    error, 
    findServicioByTitulo, 
    getCostoByTitulo 
  };
};

// Hook para cargar empleados técnicos desde Firestore  
export const useEmpleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [empleadosForSelect, setEmpleadosForSelect] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEmpleados = async () => {
      try {
        setLoading(true);
        const empleadosQuery = query(
          collection(db, 'EMPLEADOS'),
          where('tipo_empleado', '==', 'tecnico')
        );
        const empleadosSnapshot = await getDocs(empleadosQuery);
        const empleadosData = empleadosSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Datos originales
        setEmpleados(empleadosData);
        
        // Datos formateados para selects (usando nombre_completo como value y label)
        const empleadosForSelectData = empleadosData.map(empleado => {
          const nombreCompleto = empleado.nombre_completo || 'Empleado sin nombre';
          return {
            value: nombreCompleto, // Guardar nombre completo como valor (según estructura Firestore)
            label: nombreCompleto, // Mostrar nombre completo en dropdown
            id: empleado.id, // Mantener ID para referencia
            fullData: empleado
          };
        });
        
        setEmpleadosForSelect(empleadosForSelectData);
      } catch (err) {
        console.error('Error loading empleados:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEmpleados();
  }, []);

  return { empleados, empleadosForSelect, loading, error };
};

// Hook para obtener información del usuario actual
export const useCurrentUser = (userEmail) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        setLoading(true);
        const userQuery = query(
          collection(db, 'EMPLEADOS'),
          where('email', '==', userEmail)
        );
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserData(userData);
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userEmail]);

  return { userData, loading, error };
};

// Hook para guardar remisiones en Firestore
export const useRemisionSaver = () => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const saveRemision = async (remisionData, userEmail) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Preparar datos para Firestore con tipos exactos de la estructura mostrada
      const firestoreData = {
        // Campos numéricos
        remision: parseInt(remisionData.remision) || 0,
        subtotal: parseFloat(remisionData.subtotal) || 0,
        total: parseFloat(remisionData.total) || 0,
        
        // Campos de texto (strings) - todos como strings, no null
        autorizo: String(remisionData.autorizo || ''),
        carroceria: String(remisionData.carroceria || ''),
        estado: String(remisionData.estado || 'PENDIENTE'),
        genero: String(remisionData.genero || ''),
        movil: String(remisionData.movil || ''), // String como en el ejemplo
        no_fact_elect: String(remisionData.no_fact_elect || ''),
        no_id_bit: String(remisionData.no_id_bit || ''),
        no_orden: String(remisionData.no_orden || ''),
        une: String(remisionData.une || ''),
        
        // Servicios (strings) - vacíos como strings, no null
        servicio1: String(remisionData.servicio1 || ''),
        servicio2: String(remisionData.servicio2 || ''),
        servicio3: String(remisionData.servicio3 || ''),
        servicio4: String(remisionData.servicio4 || ''),
        servicio5: String(remisionData.servicio5 || ''),
        
        // Técnicos (strings) - vacíos como strings, no null
        tecnico1: String(remisionData.tecnico1 || ''),
        tecnico2: String(remisionData.tecnico2 || ''),
        tecnico3: String(remisionData.tecnico3 || ''),
        
        // Fechas como Timestamps
        fecha_remision: remisionData.fecha_remision instanceof Date ? 
          Timestamp.fromDate(remisionData.fecha_remision) : 
          Timestamp.fromDate(new Date(remisionData.fecha_remision)),
        fecha_maximo: remisionData.fecha_maximo instanceof Date ? 
          Timestamp.fromDate(remisionData.fecha_maximo) : 
          Timestamp.fromDate(new Date(remisionData.fecha_maximo)),
        fecha_bit_prof: remisionData.fecha_bit_prof instanceof Date ? 
          Timestamp.fromDate(remisionData.fecha_bit_prof) : 
          Timestamp.fromDate(new Date(remisionData.fecha_bit_prof)),
        radicacion: remisionData.radicacion instanceof Date ? 
          Timestamp.fromDate(remisionData.radicacion) : 
          Timestamp.fromDate(new Date(remisionData.radicacion))
      };

      // Usar el número de remisión como ID del documento
      const documentId = String(firestoreData.remision);
      
      // Agregar metadatos
      firestoreData.created_at = Timestamp.now();
      firestoreData.updated_at = Timestamp.now();
      firestoreData.created_by = userEmail || 'system';
      
      // Usar setDoc en lugar de addDoc para especificar el ID
      const docRef = doc(db, 'remisiones', documentId);
      await setDoc(docRef, firestoreData);
      
      setSuccess(true);
      
      return { id: documentId, ...firestoreData };
    } catch (err) {
      console.error('Error saving remision:', err);
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const saveMultipleRemisiones = async (remisionesArray, userEmail) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const results = [];
      
      for (const remision of remisionesArray) {
        // Validar datos requeridos
        if (!remision.remision || !remision.movil) {
          throw new Error('Remisión y móvil son campos obligatorios');
        }

        const result = await saveRemision(remision, userEmail);
        results.push(result);
      }

      setSuccess(true);
      return results;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    saveRemision,
    saveMultipleRemisiones,
    saving,
    error,
    success
  };
};

// Hook para calcular totales de servicios
export const useCalculateTotals = (getCostoByTitulo) => {
  const calculateRowTotals = (row) => {
    let subtotal = 0;
    
    // Sumar costos de servicios seleccionados usando títulos
    ['servicio1', 'servicio2', 'servicio3', 'servicio4', 'servicio5'].forEach(key => {
      const servicioTitulo = row[key];
      if (servicioTitulo && getCostoByTitulo) {
        const costo = getCostoByTitulo(servicioTitulo);
        subtotal += parseFloat(costo) || 0;
      }
    });

    // Permitir override manual del subtotal
    if (row.subtotal && parseFloat(row.subtotal) > subtotal) {
      subtotal = parseFloat(row.subtotal) || 0;
    }

    const total = subtotal * 1.19; // Agregar 19% IVA

    return { subtotal, total };
  };

  return { calculateRowTotals };
};

export default {
  useServicios,
  useEmpleados, 
  useCurrentUser,
  useRemisionSaver,
  useCalculateTotals
};