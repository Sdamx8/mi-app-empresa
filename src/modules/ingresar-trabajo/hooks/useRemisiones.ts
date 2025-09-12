import { useState, useEffect, useCallback, useMemo } from 'react';
import { remisionesService } from '../services/remisionesService';
import type { 
  Remision, 
  RemisionFormData, 
  RemisionesFilters, 
  UseRemisionesReturn 
} from '../types';
import { useAuth } from '../../../core/auth/AuthContext';

export const useRemisiones = (): UseRemisionesReturn => {
  const [remisiones, setRemisiones] = useState<Remision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RemisionesFilters>({});
  
  const { user } = useAuth();

  const refreshRemisiones = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const remisionesData = await remisionesService.getRemisiones(filters);
      setRemisiones(remisionesData);
    } catch (err) {
      console.error('Error al cargar remisiones:', err);
      setError('Error al cargar las remisiones');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createRemision = useCallback(async (data: RemisionFormData) => {
    if (!user?.uid) {
      throw new Error('Usuario no autenticado');
    }

    try {
      setError(null);
      
      // Validar datos
      const validationErrors = remisionesService.validateRemisionData(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      await remisionesService.createRemision(data, user.uid);
      await refreshRemisiones();
    } catch (err) {
      console.error('Error al crear remisión:', err);
      setError(err instanceof Error ? err.message : 'Error al crear la remisión');
      throw err;
    }
  }, [user?.uid, refreshRemisiones]);

  const updateRemision = useCallback(async (id: string, data: Partial<RemisionFormData>) => {
    try {
      setError(null);
      await remisionesService.updateRemision(id, data);
      await refreshRemisiones();
    } catch (err) {
      console.error('Error al actualizar remisión:', err);
      setError('Error al actualizar la remisión');
      throw err;
    }
  }, [refreshRemisiones]);

  const deleteRemision = useCallback(async (id: string) => {
    try {
      setError(null);
      await remisionesService.deleteRemision(id);
      await refreshRemisiones();
    } catch (err) {
      console.error('Error al eliminar remisión:', err);
      setError('Error al eliminar la remisión');
      throw err;
    }
  }, [refreshRemisiones]);

  // Remisiones filtradas
  const filteredRemisiones = useMemo(() => {
    return remisiones; // Los filtros ya se aplican en el servicio
  }, [remisiones]);

  // Cargar remisiones al montar el componente o cambiar filtros
  useEffect(() => {
    refreshRemisiones();
  }, [refreshRemisiones]);

  return {
    remisiones,
    loading,
    error,
    filteredRemisiones,
    totalRemisiones: filteredRemisiones.length,
    filters,
    setFilters,
    refreshRemisiones,
    createRemision,
    updateRemision,
    deleteRemision,
  };
};