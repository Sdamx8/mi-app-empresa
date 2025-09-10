// employeeService.js - Servicio para gestión de empleados
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

// Cache para evitar múltiples consultas
let employeeCache = null; // Limpiar cache
let lastFetch = null; // Limpiar timestamp
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getAllEmployees = async () => {
  // Verificar autenticación
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }

  // Verificar si tenemos cache válido
  if (employeeCache && lastFetch && (Date.now() - lastFetch < CACHE_DURATION)) {
    return employeeCache;
  }

  try {
    // Consultar empleados por correo del usuario autenticado
    const empleadosQuery = query(
      collection(db, 'EMPLEADOS'),
      where('contacto.correo', '==', currentUser.email)
    );
    const snapshot = await getDocs(empleadosQuery);
    
    const empleados = [];
    snapshot.forEach((doc) => {
      empleados.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Actualizar cache
    employeeCache = empleados;
    lastFetch = Date.now();
    
    // Empleados obtenidos exitosamente (log removido para producción)
    return empleados;
  } catch (error) {
    // Si hay error, devolver cache si existe
    return employeeCache || [];
  }
};

export const getEmployeeByEmail = async (email) => {
  if (!email) return null;
  
  try {
    // Obtener todos los empleados
    const empleados = await getAllEmployees();
    
    // Buscar por email (comparación case-insensitive)
    // Primero intentar con contacto.correo, luego con email directo
    let empleado = empleados.find(emp => 
      emp.contacto?.correo?.toLowerCase() === email.toLowerCase()
    );
    
    if (!empleado) {
      empleado = empleados.find(emp => 
        emp.email?.toLowerCase() === email.toLowerCase()
      );
    }
    
    if (empleado) {
      // Normalizar el tipo_empleado para que sea compatible con el sistema
      // Manejar las tildes y convertir a minúsculas
      let tipoNormalizado = 'tecnico'; // valor por defecto
      
      if (empleado.tipo_empleado) {
        const tipo = empleado.tipo_empleado.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''); // Remover tildes
        
        if (tipo === 'directivo') tipoNormalizado = 'directivo';
        else if (tipo === 'administrativo') tipoNormalizado = 'administrativo';
        else if (tipo === 'tecnico') tipoNormalizado = 'tecnico';
      }
      
      return {
        ...empleado,
        tipo_empleado: tipoNormalizado
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

export const getEmployeeRole = async (email) => {
  const empleado = await getEmployeeByEmail(email);
  return empleado?.tipo_empleado || null;
};

// Función para limpiar el cache (útil cuando se actualiza un empleado)
export const clearEmployeeCache = () => {
  employeeCache = null;
  lastFetch = null;
};

// Función para mapear tipos de empleado a roles del sistema
export const mapEmployeeTypeToRole = (tipoEmpleado) => {
  if (!tipoEmpleado) return 'tecnico';
  
  // Normalizar removiendo tildes y convirtiendo a minúsculas
  const tipoNormalizado = tipoEmpleado.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  const roleMap = {
    'tecnico': 'tecnico',
    'administrativo': 'administrativo', 
    'directivo': 'directivo'
  };
  
  return roleMap[tipoNormalizado] || 'tecnico'; // Por defecto técnico
};

// Función para obtener datos completos del empleado para el contexto
export const getEmployeeContextData = async (email) => {
  const empleado = await getEmployeeByEmail(email);
  
  if (!empleado) {
    return {
      tipo_empleado: 'tecnico',
      nombre: 'Usuario No Encontrado',
      email: email
    };
  }
  
  // Normalizar el tipo de empleado removiendo tildes
  const tipoNormalizado = mapEmployeeTypeToRole(empleado.tipo_empleado);
  
  return {
    tipo_empleado: tipoNormalizado,
    nombre: empleado.nombre_completo || 'Usuario',
    email: empleado.contacto?.correo || email,
    id: empleado.id,
    cargo: empleado.cargo,
    estado: empleado.estado
  };
};
