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
        
        // Datos formateados para los selects (usando ID único como key y título como label)
        const serviciosForSelectData = serviciosData.map((servicio, index) => {
          const titulo = servicio.título || servicio.titulo || 'Servicio sin nombre';
          const uniqueId = servicio.id_servicio || servicio.id || `servicio_${index}`;
          return {
            value: titulo, // Guardar el título completo como valor (según estructura Firestore)
            label: titulo, // Mostrar el título en el dropdown
            costo: servicio.costo || 0,
            id_servicio: uniqueId, // Usar ID único para evitar duplicados
            key: uniqueId, // Key único para React
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
        console.log('🔍 useCurrentUser - Buscando contacto.correo:', userEmail);
        
        const userQuery = query(
          collection(db, 'EMPLEADOS'),
          where('contacto.correo', '==', userEmail)
        );
        const userSnapshot = await getDocs(userQuery);
        
        console.log('🔍 useCurrentUser - Documentos encontrados:', userSnapshot.docs.length);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          console.log('✅ useCurrentUser - Datos del usuario:', userData);
          console.log('✅ useCurrentUser - nombre_completo:', userData.nombre_completo);
          setUserData(userData);
        } else {
          console.log('❌ useCurrentUser - No se encontró usuario con contacto.correo:', userEmail);
          
          // TEMPORAL: Crear usuario de prueba si no existe
          console.log('🔧 Creando usuario temporal para pruebas...');
          const tempUserData = {
            nombre_completo: 'Usuario de Prueba Global Mobility Solutions',
            contacto: {
              correo: userEmail,
              telefono: '',
              direccion: ''
            },
            cargo: 'Administrativo',
            tipo_empleado: 'administrativo',
            estado: 'activo',
            fecha_actualizacion: Timestamp.now()
          };
          
          // Agregar documento temporal
          try {
            const { addDoc } = await import('firebase/firestore');
            await addDoc(collection(db, 'EMPLEADOS'), tempUserData);
            console.log('✅ Usuario temporal creado');
            setUserData(tempUserData);
          } catch (addErr) {
            console.error('❌ Error creando usuario temporal:', addErr);
            setUserData(null);
          }
        }
      } catch (err) {
        console.error('❌ Error loading user data:', err);
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
        subtotal: parseFloat(remisionData.subtotal) || 0,
        total: parseFloat(remisionData.total) || 0,
        
        // Campos de texto (strings) - todos como strings, no null
        remision: String(remisionData.remision || ''), // String - permite formato libre
        autorizo: String(remisionData.autorizo || ''),
        carroceria: String(remisionData.carroceria || ''),
        estado: String(remisionData.estado || 'GENERADO'),
        genero: String(remisionData.genero || ''),
        movil: String(remisionData.movil || ''), // String - permite formato libre
        no_fact_elect: String(remisionData.no_fact_elect || ''),
        no_id_bit: parseInt(remisionData.no_id_bit) || 0, // Mantener como number
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
        
        // Helper function para fechas seguras
        ...(function() {
          const convertToTimestamp = (dateValue) => {
            if (!dateValue || dateValue === '') return null;
            try {
              if (dateValue instanceof Date) {
                return isNaN(dateValue.getTime()) ? null : Timestamp.fromDate(dateValue);
              }
              const parsedDate = new Date(dateValue);
              return isNaN(parsedDate.getTime()) ? null : Timestamp.fromDate(parsedDate);
            } catch (error) {
              console.warn('Error parsing date:', dateValue, error);
              return null;
            }
          };
          
          const result = {};
          const fecha_remision = convertToTimestamp(remisionData.fecha_remision);
          const fecha_maximo = convertToTimestamp(remisionData.fecha_maximo);
          const fecha_bit_prof = convertToTimestamp(remisionData.fecha_bit_prof);
          const radicacion = convertToTimestamp(remisionData.radicacion);
          
          if (fecha_remision !== null) result.fecha_remision = fecha_remision;
          if (fecha_maximo !== null) result.fecha_maximo = fecha_maximo;
          if (fecha_bit_prof !== null) result.fecha_bit_prof = fecha_bit_prof;
          if (radicacion !== null) result.radicacion = radicacion;
          
          return result;
        })()
      };

      // Usar la remisión como ID del documento o generar uno para órdenes de trabajo
      const documentId = firestoreData.remision && firestoreData.remision.trim() !== '' 
        ? firestoreData.remision 
        : 'orden-' + Date.now();
      
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