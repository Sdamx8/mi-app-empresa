/**
 * 🔄 useTableState Hook - Persistencia de Estado de Tabla
 * ======================================================
 * Hook personalizado que utiliza localStorage para mantener el estado 
 * de la tabla entre sesiones y navegación
 * 
 * Características:
 * - Búsqueda en todas las columnas
 * - Página actual de la tabla
 * - Ordenamiento de columnas
 * - Filtro por estado (GENERADO, PROFORMA, etc.)
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import { useState, useEffect } from "react";

export const useTableState = (key, defaultState) => {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultState;
    } catch (error) {
      console.warn(`Error loading table state from localStorage:`, error);
      return defaultState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.warn(`Error saving table state to localStorage:`, error);
    }
  }, [key, state]);

  // Función helper para actualizar el estado
  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  // Función para resetear el estado
  const resetState = () => {
    setState(defaultState);
  };

  // Función para obtener un valor específico del estado
  const getStateValue = (property) => {
    return state[property];
  };

  return [state, setState, updateState, resetState, getStateValue];
};

// Estados disponibles para filtros de remisiones
export const FILTER_STATES = {
  ALL: 'ALL',
  GENERADO: 'GENERADO',
  PENDIENTE: 'PENDIENTE',
  PROFORMA: 'PROFORMA',
  RADICADO: 'RADICADO',
  FACTURADO: 'FACTURADO',
  CANCELADO: 'CANCELADO',
  CORTESIA: 'CORTESIA',
  GARANTIA: 'GARANTIA',
  SIN_VINCULAR: 'SIN_VINCULAR'
};

// Configuración por defecto para tabla de remisiones
export const DEFAULT_TABLE_STATE = {
  search: "",
  page: 1,
  sort: null,
  filter: FILTER_STATES.ALL
};

// Hook específico para tabla de remisiones
export const useRemisionesTableState = () => {
  return useTableState("remisionesTable", DEFAULT_TABLE_STATE);
};