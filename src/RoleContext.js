import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getEmployeeByEmail } from './services/employeeService';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Definición de permisos por tipo de empleado
const ROLE_PERMISSIONS = {
  directivo: {
    modules: ['perfil', 'crm', 'historial_trabajos', 'ingresar_trabajo', 'herramientas_electricas', 'herramientas_manuales', 'empleados', 'informes_tecnicos', 'reportes_informes', 'financiero'],
    permissions: {
      // Historial
      canViewHistorial: true,
      canEditHistorial: true,
      canDeleteHistorial: true,
      // Reportes
      canViewReportes: true,
      canExportReportes: true,
      canAccessAllTechnicians: true,
      // CRM
      canViewCRM: true,
      canManageCRM: true,
      // Empleados
      canViewEmpleados: true,
      canManageEmpleados: true,
      // Herramientas
      canViewHerramientas: true,
      canManageHerramientas: true,
      // Trabajos
      canCreateTrabajo: true,
      canEditTrabajo: true,
      canDeleteTrabajo: true,
      // Perfil
      canViewProfile: true,
      canEditProfile: true,
      // Informes Técnicos - removed
      // Admin
      hasAdminAccess: true
    }
  },
  administrativo: {
    modules: ['perfil', 'crm', 'historial_trabajos', 'ingresar_trabajo', 'herramientas_electricas', 'herramientas_manuales', 'empleados', 'informes_tecnicos', 'reportes_informes', 'financiero'],
    permissions: {
      // Historial
      canViewHistorial: true,
      canEditHistorial: true,
      canDeleteHistorial: true,
      // Reportes
      canViewReportes: true,
      canExportReportes: true,
      canAccessAllTechnicians: true,
      // CRM
      canViewCRM: true,
      canManageCRM: true,
      // Empleados
      canViewEmpleados: true,
      canManageEmpleados: true,
      // Herramientas
      canViewHerramientas: true,
      canManageHerramientas: true,
      // Trabajos
      canCreateTrabajo: true,
      canEditTrabajo: true,
      canDeleteTrabajo: false, // Solo directivos pueden eliminar
      // Perfil
      canViewProfile: true,
      canEditProfile: true,
      // Informes Técnicos - removed
      // Admin
      hasAdminAccess: false
    }
  },
  tecnico: {
    modules: ['perfil', 'historial_trabajos'],
    permissions: {
      // Historial (solo ver, sin editar/eliminar)
      canViewHistorial: true,
      canEditHistorial: false,
      canDeleteHistorial: false,
      // Reportes (solo sus propios trabajos)
      canViewReportes: true,
      canExportReportes: false,
      canAccessAllTechnicians: false,
      // CRM
      canViewCRM: false,
      canManageCRM: false,
      // Empleados
      canViewEmpleados: false,
      canManageEmpleados: false,
      // Herramientas
      canViewHerramientas: false,
      canManageHerramientas: false,
      // Trabajos
      canCreateTrabajo: false,
      canEditTrabajo: false,
      canDeleteTrabajo: false,
      // Perfil
      canViewProfile: true,
      canEditProfile: true,
      // Informes Técnicos - removed
      // Admin
      hasAdminAccess: false
    }
  }
};

// Simulación de datos de empleado para fallback cuando no se encuentra en Firebase
const FALLBACK_EMPLOYEE_DATA = {
  // Usuarios de prueba con diferentes roles (solo como fallback)
  'admin@gms.com': { tipo_empleado: 'administrativo', nombre: 'Ana Rodríguez - Administradora' },
  'director@gms.com': { tipo_empleado: 'directivo', nombre: 'Carlos Mendoza - Director' },
  'sergio@gms.com': { tipo_empleado: 'directivo', nombre: 'Sergio Dabian Ayala Mondragón', nombre_completo: 'Sergio Dabian Ayala Mondragón' },
  'tecnico@gms.com': { tipo_empleado: 'tecnico', nombre: 'Miguel Torres - Técnico' },
  'tecnico2@gms.com': { tipo_empleado: 'tecnico', nombre: 'Laura Jiménez - Técnica' },
  'admin2@gms.com': { tipo_empleado: 'administrativo', nombre: 'Sofia Vargas - Coordinadora' },
  // Email por defecto para pruebas - actualizado a directivo para mayor funcionalidad
  'user@example.com': { tipo_empleado: 'directivo', nombre: 'Sergio Dabian Ayala Mondragón', nombre_completo: 'Sergio Dabian Ayala Mondragón' }
};

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [availableModules, setAvailableModules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEmployeeData = async () => {
      if (user?.email) {
        setLoading(true);
        try {
          // Intentar obtener datos del empleado desde Firebase
          const employee = await getEmployeeByEmail(user.email);
          
          // Si no se encuentra en Firebase, usar datos de fallback
          if (!employee || employee.nombre === 'Usuario No Encontrado') {
            const fallbackData = FALLBACK_EMPLOYEE_DATA[user.email] || FALLBACK_EMPLOYEE_DATA['user@example.com'];
            setCurrentEmployee({
              ...fallbackData,
              email: user.email
            });
            setUserRole(fallbackData.tipo_empleado);
          } else {
            // Usar datos reales del empleado
            const normalizedEmployee = {
              ...employee,
              nombre: employee.nombre_completo || employee.nombre || 'Empleado'
            };
            setCurrentEmployee(normalizedEmployee);
            setUserRole(employee.tipo_empleado);
          }
          
        } catch (error) {
          console.error('Error al cargar datos del empleado:', error);
          // En caso de error, usar datos de fallback
          const fallbackData = FALLBACK_EMPLOYEE_DATA[user.email] || FALLBACK_EMPLOYEE_DATA['user@example.com'];
          setCurrentEmployee({
            ...fallbackData,
            email: user.email,
            error: true
          });
          setUserRole(fallbackData.tipo_empleado);
        }
      } else {
        setCurrentEmployee(null);
        setUserRole(null);
      }
      setLoading(false);
    };

    // Envolver en try-catch adicional para capturar errores síncronos
    try {
      loadEmployeeData();
    } catch (error) {
      console.error('Error síncrono en loadEmployeeData:', error);
      setLoading(false);
      // Establecer estado de error
      setCurrentEmployee({ error: true, nombre: 'Error al cargar' });
      setUserRole('tecnico'); // rol por defecto seguro
    }
  }, [user]);

  // Actualizar permisos cuando cambie el rol
  useEffect(() => {
    try {
      if (userRole && ROLE_PERMISSIONS[userRole]) {
        setPermissions(ROLE_PERMISSIONS[userRole].permissions);
        setAvailableModules(ROLE_PERMISSIONS[userRole].modules);
      } else {
        // Establecer permisos por defecto seguros
        setPermissions(ROLE_PERMISSIONS.tecnico.permissions);
        setAvailableModules(ROLE_PERMISSIONS.tecnico.modules);
      }
    } catch (error) {
      console.error('Error al configurar permisos:', error);
      // Permisos seguros por defecto
      setPermissions(ROLE_PERMISSIONS.tecnico.permissions);
      setAvailableModules(['perfil']);
    }
  }, [userRole]);

  const hasPermission = (permission) => {
    return permissions[permission] || false;
  };

  const hasModuleAccess = (moduleId) => {
    return availableModules.includes(moduleId);
  };

  const getRoleDisplayName = () => {
    const roleNames = {
      directivo: 'Directivo',
      administrativo: 'Administrativo', 
      tecnico: 'Técnico'
    };
    return roleNames[userRole] || 'Usuario';
  };

  const value = {
    currentEmployee,
    userRole,
    permissions,
    userPermissions: permissions, // Agregar alias para compatibilidad
    availableModules,
    loading,
    hasPermission,
    hasModuleAccess,
    getRoleDisplayName,
    // Datos útiles para mostrar en la interfaz
    canViewHistorial: hasPermission('canViewHistorial'),
    canEditHistorial: hasPermission('canEditHistorial'),
    canDeleteHistorial: hasPermission('canDeleteHistorial'),
    canViewCRM: hasPermission('canViewCRM'),
    canManageCRM: hasPermission('canManageCRM'),
    canViewEmpleados: hasPermission('canViewEmpleados'),
    canManageEmpleados: hasPermission('canManageEmpleados'),
    canViewHerramientas: hasPermission('canViewHerramientas'),
    canManageHerramientas: hasPermission('canManageHerramientas'),
    canCreateTrabajo: hasPermission('canCreateTrabajo'),
    canEditTrabajo: hasPermission('canEditTrabajo'),
    canDeleteTrabajo: hasPermission('canDeleteTrabajo'),
    hasAdminAccess: hasPermission('hasAdminAccess')
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
