// components/InformesTecnicos/RoleGuard.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../AuthContext';
import { obtenerTipoEmpleado } from '../../services/firestore';

/**
 * Componente de control de acceso por roles
 * Solo permite acceso a usuarios con roles Administrativo y Directivo
 */
const RoleGuard = ({ children, fallbackComponent = null }) => {
  const { user } = useAuth();
  const [tipoEmpleado, setTipoEmpleado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verificarPermisos = async () => {
      console.log('🔐 RoleGuard - Verificando permisos para usuario:', user);
      
      if (!user?.uid) {
        console.warn('❌ Usuario no autenticado');
        setCargando(false);
        setError('Usuario no autenticado');
        return;
      }

      try {
        setCargando(true);
        setError(null);
        
        console.log('👤 Datos del usuario autenticado:');
        console.log('  - UID:', user.uid);
        console.log('  - Email:', user.email);
        console.log('  - Display Name:', user.displayName);
        console.log('  - Otros datos:', { ...user });
        
        const tipo = await obtenerTipoEmpleado(user.uid, user.email);
        console.log('📝 Resultado de obtenerTipoEmpleado:', tipo);
        
        setTipoEmpleado(tipo);
        
        if (!tipo) {
          console.error('❌ No se pudo determinar el tipo de empleado');
          setError('No se pudo determinar el tipo de empleado');
        } else {
          console.log('✅ Tipo de empleado determinado:', tipo);
        }
      } catch (err) {
        console.error('💥 Error verificando permisos:', err);
        setError('Error al verificar permisos de acceso');
      } finally {
        setCargando(false);
      }
    };

    verificarPermisos();
  }, [user?.uid, user?.email]);

  // Estados de carga y error
  if (cargando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Verificando Permisos
            </h3>
            <p className="text-gray-500">
              Validando acceso al módulo de Informes Técnicos...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.118 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error de Verificación
            </h3>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Reintentar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Verificar si el usuario tiene permisos
  const rolesPermitidos = ['Administrativo', 'Directivo'];
  const tienePermiso = tipoEmpleado && rolesPermitidos.includes(tipoEmpleado);

  if (!tienePermiso) {
    // Mostrar componente de fallback personalizado si se proporciona
    if (fallbackComponent) {
      return fallbackComponent;
    }

    // Mensaje de acceso denegado por defecto
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full mx-4"
        >
          <div className="text-center">
            {/* Icono de acceso denegado */}
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Restringido
            </h2>
            
            <p className="text-gray-600 mb-2">
              No tienes permisos para acceder al módulo de <strong>Informes Técnicos</strong>.
            </p>
            
            <p className="text-sm text-gray-500 mb-6">
              Tu rol actual: <span className="font-medium">{tipoEmpleado || 'No definido'}</span>
              <br />
              Roles requeridos: <span className="font-medium">Administrativo, Directivo</span>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    ¿Necesitas acceso?
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Contacta al administrador del sistema para solicitar los permisos necesarios.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-6 rounded-md transition-colors duration-200"
            >
              Volver
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Usuario autorizado: renderizar contenido protegido
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Hook personalizado para verificar permisos en componentes
 * @returns {Object} Estado de permisos y datos del usuario
 */
export const useRoleGuard = () => {
  const { user } = useAuth();
  const [permisos, setPermisos] = useState({
    tieneAcceso: false,
    tipoEmpleado: null,
    cargando: true,
    error: null
  });

  useEffect(() => {
    const verificarPermisos = async () => {
      if (!user?.uid) {
        setPermisos({
          tieneAcceso: false,
          tipoEmpleado: null,
          cargando: false,
          error: 'Usuario no autenticado'
        });
        return;
      }

      try {
        setPermisos(prev => ({ ...prev, cargando: true, error: null }));
        
        const tipo = await obtenerTipoEmpleado(user.uid, user.email);
        const rolesPermitidos = ['Administrativo', 'Directivo'];
        const tieneAcceso = tipo && rolesPermitidos.includes(tipo);
        
        setPermisos({
          tieneAcceso,
          tipoEmpleado: tipo,
          cargando: false,
          error: !tipo ? 'Tipo de empleado no definido' : null
        });
      } catch (err) {
        console.error('Error verificando permisos:', err);
        setPermisos({
          tieneAcceso: false,
          tipoEmpleado: null,
          cargando: false,
          error: 'Error al verificar permisos'
        });
      }
    };

    verificarPermisos();
  }, [user?.uid]);

  return permisos;
};

/**
 * Componente de permiso inline para secciones específicas
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} Contenido condicional basado en permisos
 */
export const PermissionCheck = ({ 
  children, 
  fallback = null, 
  requiredRoles = ['Administrativo', 'Directivo'],
  showLoader = false 
}) => {
  const { tieneAcceso, cargando } = useRoleGuard();

  if (cargando && showLoader) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Verificando permisos...</span>
      </div>
    );
  }

  if (cargando) {
    return null;
  }

  if (!tieneAcceso) {
    return fallback;
  }

  return children;
};

export default RoleGuard;
