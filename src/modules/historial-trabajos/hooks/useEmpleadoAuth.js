// Hook personalizado para obtener información del empleado y su rol
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';
import { useAuth } from '../../../core/auth/AuthContext';

/**
 * Hook para obtener información del empleado autenticado desde Firestore
 * @returns {Object} { empleado, rol, loading, error }
 */
export const useEmpleadoAuth = () => {
  const { user } = useAuth();
  const [empleado, setEmpleado] = useState(null);
  const [rol, setRol] = useState('tecnico'); // rol por defecto
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const obtenerEmpleado = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar empleado por email o UID
        // Primero intentamos con el UID del usuario autenticado
        let empleadoDoc = null;
        
        // Opción 1: Buscar por UID si coincide con la identificación
        try {
          const docRef = doc(db, 'EMPLEADOS', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            empleadoDoc = { id: docSnap.id, ...docSnap.data() };
          }
        } catch (err) {
          console.log('No se encontró empleado por UID, intentando por email...');
        }

        // Opción 2: Si no se encuentra por UID, buscar por email
        if (!empleadoDoc) {
          // Obtener todos los empleados y buscar por email
          const { collection, getDocs, query, where } = await import('firebase/firestore');
          const empleadosRef = collection(db, 'EMPLEADOS');
          const q = query(empleadosRef, where('contacto.correo', '==', user.email));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            empleadoDoc = { id: doc.id, ...doc.data() };
          }
        }

        if (empleadoDoc) {
          setEmpleado(empleadoDoc);
          
          // Extraer el rol del empleado
          const tipoEmpleado = empleadoDoc.tipo_empleado?.toLowerCase() || 'tecnico';
          
          // Mapear tipos de empleado a roles del sistema
          const mapeoRoles = {
            'directivo': 'directivo',
            'gerente': 'directivo',
            'administrador': 'administrativo', 
            'administrativo': 'administrativo',
            'tecnico': 'tecnico',
            'operario': 'tecnico'
          };
          
          const rolSistema = mapeoRoles[tipoEmpleado] || 'tecnico';
          setRol(rolSistema);
          
          console.log(`[useEmpleadoAuth] Usuario autenticado:`, {
            nombre: empleadoDoc.nombre_completo,
            email: user.email,
            tipo_empleado: tipoEmpleado,
            rol_sistema: rolSistema,
            cargo: empleadoDoc.cargo
          });
          
        } else {
          console.warn(`[useEmpleadoAuth] No se encontró empleado para el email: ${user.email}`);
          setError('No se encontró información del empleado');
        }

      } catch (err) {
        console.error('[useEmpleadoAuth] Error al obtener empleado:', err);
        setError('Error al cargar información del empleado');
      } finally {
        setLoading(false);
      }
    };

    obtenerEmpleado();
  }, [user]);

  return {
    empleado,
    rol,
    loading,
    error,
    user,
    // Información adicional útil
    isDirectivo: rol === 'directivo',
    isAdministrativo: rol === 'administrativo', 
    isTecnico: rol === 'tecnico',
    nombre: empleado?.nombre_completo || 'Usuario',
    cargo: empleado?.cargo || 'Sin cargo',
    identificacion: empleado?.identificacion || empleado?.id
  };
};

export default useEmpleadoAuth;
