/**
 * 🏪 Filter Persistence Context
 * =============================
 * Contexto para mantener la persistencia de filtros en el módulo de remisiones consolidado
 * Guarda filtros, ordenamiento y paginación en localStorage para mantener estado entre navegaciones
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const FilterPersistenceContext = createContext();

// Clave para localStorage
const STORAGE_KEY = 'remisiones_consolidado_filters';

// Estado inicial de filtros
const initialFilterState = {
  globalFilter: '',
  columnFilters: [],
  sorting: [{ id: 'fecha_remision', desc: true }],
  pagination: {
    pageIndex: 0,
    pageSize: 20,
  },
  activeColumnFilter: '', // Para filtros de columna específica
  isFiltered: false, // Indicador de si hay filtros activos
};

export const FilterPersistenceProvider = ({ children }) => {
  const [filterState, setFilterState] = useState(initialFilterState);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar filtros desde localStorage al inicializar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedState = JSON.parse(saved);
        setFilterState(prev => ({
          ...prev,
          ...parsedState,
          isFiltered: hasActiveFilters(parsedState)
        }));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función auxiliar para detectar filtros activos
  const hasActiveFilters = (state) => {
    return !!(
      state.globalFilter?.trim() ||
      state.columnFilters?.length > 0 ||
      state.activeColumnFilter?.trim()
    );
  };

  // Guardar filtros en localStorage
  const saveFilters = useCallback((newState) => {
    try {
      const stateToSave = {
        ...newState,
        isFiltered: hasActiveFilters(newState)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      setFilterState(stateToSave);
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }, []);

  // Actualizar filtro global
  const updateGlobalFilter = useCallback((value) => {
    const newState = {
      ...filterState,
      globalFilter: value,
      pagination: { ...filterState.pagination, pageIndex: 0 } // Reset página
    };
    saveFilters(newState);
  }, [filterState, saveFilters]);

  // Actualizar filtros de columna
  const updateColumnFilters = useCallback((filters) => {
    const newState = {
      ...filterState,
      columnFilters: filters,
      pagination: { ...filterState.pagination, pageIndex: 0 } // Reset página
    };
    saveFilters(newState);
  }, [filterState, saveFilters]);

  // Actualizar ordenamiento
  const updateSorting = useCallback((sorting) => {
    const newState = {
      ...filterState,
      sorting
    };
    saveFilters(newState);
  }, [filterState, saveFilters]);

  // Actualizar paginación
  const updatePagination = useCallback((pagination) => {
    const newState = {
      ...filterState,
      pagination
    };
    saveFilters(newState);
  }, [filterState, saveFilters]);

  // Actualizar filtro de columna específica
  const updateActiveColumnFilter = useCallback((column, value) => {
    const newState = {
      ...filterState,
      activeColumnFilter: value,
      pagination: { ...filterState.pagination, pageIndex: 0 } // Reset página
    };
    saveFilters(newState);
  }, [filterState, saveFilters]);

  // Limpiar todos los filtros
  const clearAllFilters = useCallback(() => {
    const clearedState = {
      ...initialFilterState,
      sorting: filterState.sorting, // Mantener ordenamiento
      pagination: { ...initialFilterState.pagination } // Reset paginación
    };
    saveFilters(clearedState);
  }, [filterState.sorting, saveFilters]);

  // Limpiar filtros específicos pero mantener paginación y ordenamiento
  const clearSearchFilters = useCallback(() => {
    const clearedState = {
      ...filterState,
      globalFilter: '',
      columnFilters: [],
      activeColumnFilter: '',
      pagination: { ...filterState.pagination, pageIndex: 0 }
    };
    saveFilters(clearedState);
  }, [filterState, saveFilters]);

  // Restaurar filtros después de navegación
  const restoreFiltersAfterNavigation = useCallback(() => {
    // Los filtros ya están en el estado, solo necesitamos asegurar que se apliquen
    return filterState;
  }, [filterState]);

  const contextValue = {
    // Estado
    filterState,
    isLoading,
    isFiltered: filterState.isFiltered,
    
    // Acciones de actualización
    updateGlobalFilter,
    updateColumnFilters,
    updateSorting,
    updatePagination,
    updateActiveColumnFilter,
    
    // Acciones de limpieza
    clearAllFilters,
    clearSearchFilters,
    
    // Navegación
    restoreFiltersAfterNavigation,
    
    // Utilidades
    hasActiveFilters: () => hasActiveFilters(filterState)
  };

  return (
    <FilterPersistenceContext.Provider value={contextValue}>
      {children}
    </FilterPersistenceContext.Provider>
  );
};

// Hook para usar el contexto
export const useFilterPersistence = () => {
  const context = useContext(FilterPersistenceContext);
  if (!context) {
    throw new Error('useFilterPersistence must be used within a FilterPersistenceProvider');
  }
  return context;
};

// Hook personalizado para componentes de tabla
export const useTableFilters = () => {
  const {
    filterState,
    updateGlobalFilter,
    updateColumnFilters,
    updateSorting,
    updatePagination,
    updateActiveColumnFilter,
    clearAllFilters,
    clearSearchFilters,
    isFiltered
  } = useFilterPersistence();

  return {
    // Estados para la tabla
    globalFilter: filterState.globalFilter,
    columnFilters: filterState.columnFilters,
    sorting: filterState.sorting,
    pagination: filterState.pagination,
    activeColumnFilter: filterState.activeColumnFilter,
    
    // Setters
    setGlobalFilter: updateGlobalFilter,
    setColumnFilters: updateColumnFilters,
    setSorting: updateSorting,
    setPagination: updatePagination,
    setActiveColumnFilter: updateActiveColumnFilter,
    
    // Utilidades
    clearAllFilters,
    clearSearchFilters,
    isFiltered,
    
    // Estado de la tabla para TanStack
    tableState: {
      globalFilter: filterState.globalFilter,
      columnFilters: filterState.columnFilters,
      sorting: filterState.sorting,
      pagination: filterState.pagination,
    }
  };
};

export default FilterPersistenceContext;