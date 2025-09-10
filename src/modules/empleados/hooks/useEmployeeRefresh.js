// hooks/useEmployeeRefresh.js - Hook para refrescar datos de empleado
import { useContext } from 'react';
import { clearEmployeeCache } from '../services/employeeService';

// Este hook puede ser usado para forzar la actualización de datos del empleado
export const useEmployeeRefresh = () => {
  const refreshEmployeeData = () => {
    // Limpiar el cache para forzar una nueva consulta
    clearEmployeeCache();
    
    // Recargar la página para actualizar el contexto
    // En una implementación más sofisticada, podrías usar un estado global
    window.location.reload();
  };

  return { refreshEmployeeData };
};
