import { useState, useEffect, useCallback, useMemo } from 'react';
import { empleadosService } from '../services/empleadosService';
import type { 
  Empleado, 
  EmpleadoFormData, 
  EmpleadosFilters, 
  UseEmpleadosReturn 
} from '../types';
import { useAuth } from '../../../core/auth/AuthContext';

export const useEmpleados = (): UseEmpleadosReturn => {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<EmpleadosFilters>({});
  
  const { user } = useAuth();

  const refreshEmpleados = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const empleadosData = await empleadosService.getEmpleados(filters);
      setEmpleados(empleadosData);
    } catch (err) {
      console.error('Error al cargar empleados:', err);
      setError('Error al cargar los empleados');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createEmpleado = useCallback(async (data: EmpleadoFormData) => {
    if (!user?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setError(null);
      
      // Validar datos
      const validationErrors = empleadosService.validateEmpleadoData(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      await empleadosService.createEmpleado(data, user.uid);
      await refreshEmpleados();
    } catch (err) {
      console.error('Error al crear empleado:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el empleado');
      throw err;
    }
  }, [user?.uid, refreshEmpleados]);

  const updateEmpleado = useCallback(async (id: string, data: Partial<EmpleadoFormData>) => {
    try {
      setError(null);
      await empleadosService.updateEmpleado(id, data);
      await refreshEmpleados();
    } catch (err) {
      console.error('Error al actualizar empleado:', err);
      setError('Error al actualizar el empleado');
      throw err;
    }
  }, [refreshEmpleados]);

  const deleteEmpleado = useCallback(async (id: string) => {
    try {
      setError(null);
      await empleadosService.deleteEmpleado(id);
      await refreshEmpleados();
    } catch (err) {
      console.error('Error al eliminar empleado:', err);
      setError('Error al eliminar el empleado');
      throw err;
    }
  }, [refreshEmpleados]);

  // Empleados filtrados
  const filteredEmpleados = useMemo(() => {
    return empleados; // Los filtros ya se aplican en el servicio
  }, [empleados]);

  // Cargar empleados al montar el componente o cambiar filtros
  useEffect(() => {
    refreshEmpleados();
  }, [refreshEmpleados]);

  return {
    empleados,
    loading,
    error,
    filteredEmpleados,
    totalEmpleados: filteredEmpleados.length,
    filters,
    setFilters,
    refreshEmpleados,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado,
  };
};