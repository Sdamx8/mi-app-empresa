/**
 * 🏷️ Active Filters Indicator Component
 * =====================================
 * Componente para mostrar filtros activos y permitir limpiarlos
 * Muestra badges visuales de los filtros aplicados
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import React from 'react';
import { useFilterPersistence } from '../context/FilterPersistenceContext';
import './ActiveFiltersIndicator.css';

const ActiveFiltersIndicator = ({ className = '' }) => {
  const { 
    filterState, 
    isFiltered, 
    clearAllFilters, 
    clearSearchFilters,
    updateGlobalFilter,
    updateActiveColumnFilter
  } = useFilterPersistence();

  const { globalFilter, columnFilters, activeColumnFilter } = filterState;

  // No mostrar nada si no hay filtros activos
  if (!isFiltered) return null;

  // Función para obtener el nombre amigable de las columnas
  const getColumnDisplayName = (columnId) => {
    const columnNames = {
      remision: 'Remisión',
      movil: 'Móvil',
      no_orden: 'No. Orden',
      estado: 'Estado',
      cliente: 'Cliente',
      fecha_remision: 'Fecha Remisión',
      valor_total: 'Valor Total',
      concepto: 'Concepto'
    };
    return columnNames[columnId] || columnId;
  };

  // Función para limpiar filtro específico
  const clearSpecificFilter = (type, columnId = null) => {
    switch (type) {
      case 'global':
        updateGlobalFilter('');
        break;
      case 'column':
        if (columnId) {
          const newFilters = columnFilters.filter(filter => filter.id !== columnId);
          // Actualizar usando el contexto
          const newState = {
            ...filterState,
            columnFilters: newFilters,
            pagination: { ...filterState.pagination, pageIndex: 0 }
          };
          // Esto se podría mejorar con una función más específica en el contexto
        }
        break;
      case 'activeColumn':
        updateActiveColumnFilter('', '');
        break;
      default:
        break;
    }
  };

  return (
    <div className={`active-filters-indicator ${className}`}>
      <div className="filters-header">
        <h4 className="filters-title">
          🔍 Filtros Activos
        </h4>
        <div className="filters-actions">
          <button 
            onClick={clearSearchFilters}
            className="btn-clear-search"
            title="Limpiar solo filtros de búsqueda"
          >
            🧹 Limpiar Búsquedas
          </button>
          <button 
            onClick={clearAllFilters}
            className="btn-clear-all"
            title="Limpiar todos los filtros"
          >
            ❌ Limpiar Todo
          </button>
        </div>
      </div>

      <div className="active-filters-list">
        {/* Filtro global */}
        {globalFilter && (
          <div className="filter-badge global-filter">
            <span className="filter-label">Búsqueda Global:</span>
            <span className="filter-value">"{globalFilter}"</span>
            <button 
              className="filter-remove"
              onClick={() => clearSpecificFilter('global')}
              title="Quitar este filtro"
            >
              ×
            </button>
          </div>
        )}

        {/* Filtros de columna */}
        {columnFilters.map(filter => (
          <div key={filter.id} className="filter-badge column-filter">
            <span className="filter-label">
              {getColumnDisplayName(filter.id)}:
            </span>
            <span className="filter-value">"{filter.value}"</span>
            <button 
              className="filter-remove"
              onClick={() => clearSpecificFilter('column', filter.id)}
              title="Quitar este filtro"
            >
              ×
            </button>
          </div>
        ))}

        {/* Filtro de columna activa */}
        {activeColumnFilter && (
          <div className="filter-badge active-column-filter">
            <span className="filter-label">Filtro de Estado:</span>
            <span className="filter-value">"{activeColumnFilter}"</span>
            <button 
              className="filter-remove"
              onClick={() => clearSpecificFilter('activeColumn')}
              title="Quitar este filtro"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <div className="filters-summary">
        <small className="text-muted">
          💡 Los filtros se mantienen al navegar entre páginas
        </small>
      </div>
    </div>
  );
};

export default ActiveFiltersIndicator;