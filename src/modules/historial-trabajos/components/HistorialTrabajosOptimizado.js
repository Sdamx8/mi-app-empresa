/**
 * Componente principal del módulo Historial de Trabajos
 * 
 * Características:
 * - Diseño ERP profesional con Material Design
 * - Búsqueda avanzada con filtros múltiples
 * - Tabla paginada con cursor-based pagination
 * - Vista detalle con timeline de historial
 * - Skeleton loaders y states de loading
 * - Integración con useRemisiones hook
 * - Data-cy attributes para testing
 * - Exportación a Excel/PDF
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRemisiones, useHistorialRemision } from '../hooks/useRemisiones';
import { useEmpleadoAuth } from '../hooks/useEmpleadoAuth';
import './Historial.css';

// Componente de Skeleton Loader
const SkeletonCard = () => (
  <div className="skeleton-card">
    <div className="skeleton-header">
      <div className="skeleton-line skeleton-title"></div>
      <div className="skeleton-line skeleton-subtitle"></div>
    </div>
    <div className="skeleton-body">
      <div className="skeleton-line skeleton-text"></div>
      <div className="skeleton-line skeleton-text"></div>
      <div className="skeleton-line skeleton-text short"></div>
    </div>
  </div>
);

// Componente de filtros avanzados
const FiltrosAvanzados = ({ onFilter, loading, appliedFilters }) => {
  const [filtros, setFiltros] = useState({
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    movil: '',
    tecnico: '',
    remision: ''
  });

  const [expanded, setExpanded] = useState(false);

  const handleInputChange = (field, value) => {
    setFiltros(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filtrar campos vacíos
    const filtrosLimpios = Object.fromEntries(
      Object.entries(filtros).filter(([key, value]) => value && value.trim())
    );
    onFilter(filtrosLimpios);
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: '',
      fechaFin: '',
      estado: '',
      movil: '',
      tecnico: '',
      remision: ''
    });
    onFilter({});
  };

  const hayFiltrosAplicados = Object.keys(appliedFilters).length > 0;

  return (
    <div className="filtros-container" data-cy="filtros-container">
      <div className="filtros-header" onClick={() => setExpanded(!expanded)}>
        <div className="filtros-title">
          <span className="filtros-icon">🔍</span>
          <h3>Filtros de Búsqueda</h3>
          {hayFiltrosAplicados && (
            <span className="filtros-badge">{Object.keys(appliedFilters).length}</span>
          )}
        </div>
        <button 
          type="button" 
          className={`expand-button ${expanded ? 'expanded' : ''}`}
          aria-label={expanded ? 'Contraer filtros' : 'Expandir filtros'}
        >
          <span className="expand-icon">▼</span>
        </button>
      </div>

      {expanded && (
        <form onSubmit={handleSubmit} className="filtros-form">
          <div className="filtros-grid">
            {/* Filtros de fecha */}
            <div className="filtro-group">
              <label htmlFor="fechaInicio">Fecha Inicio</label>
              <input
                id="fechaInicio"
                type="date"
                value={filtros.fechaInicio}
                onChange={(e) => handleInputChange('fechaInicio', e.target.value)}
                className="filtro-input"
                data-cy="filtro-fecha-inicio"
              />
            </div>

            <div className="filtro-group">
              <label htmlFor="fechaFin">Fecha Fin</label>
              <input
                id="fechaFin"
                type="date"
                value={filtros.fechaFin}
                onChange={(e) => handleInputChange('fechaFin', e.target.value)}
                className="filtro-input"
                data-cy="filtro-fecha-fin"
              />
            </div>

            {/* Filtro de estado */}
            <div className="filtro-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                value={filtros.estado}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="filtro-select"
                data-cy="filtro-estado"
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En Proceso</option>
                <option value="completado">Completado</option>
                <option value="finalizado">Finalizado</option>
                <option value="facturado">Facturado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Filtro de móvil */}
            <div className="filtro-group">
              <label htmlFor="movil">Móvil</label>
              <input
                id="movil"
                type="text"
                placeholder="Ej: 001, 002"
                value={filtros.movil}
                onChange={(e) => handleInputChange('movil', e.target.value)}
                className="filtro-input"
                data-cy="filtro-movil"
              />
            </div>

            {/* Filtro de técnico */}
            <div className="filtro-group">
              <label htmlFor="tecnico">Técnico</label>
              <input
                id="tecnico"
                type="text"
                placeholder="Nombre del técnico"
                value={filtros.tecnico}
                onChange={(e) => handleInputChange('tecnico', e.target.value)}
                className="filtro-input"
                data-cy="filtro-tecnico"
              />
            </div>

            {/* Filtro de número de remisión */}
            <div className="filtro-group">
              <label htmlFor="remision">N° Remisión</label>
              <input
                id="remision"
                type="number"
                placeholder="Número de remisión"
                value={filtros.remision}
                onChange={(e) => handleInputChange('remision', e.target.value)}
                className="filtro-input"
                data-cy="filtro-remision"
              />
            </div>
          </div>

          <div className="filtros-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              data-cy="btn-aplicar-filtros"
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Buscando...
                </>
              ) : (
                <>
                  <span className="btn-icon">🔍</span>
                  Buscar
                </>
              )}
            </button>

            <button
              type="button"
              onClick={limpiarFiltros}
              className="btn btn-secondary"
              data-cy="btn-limpiar-filtros"
            >
              <span className="btn-icon">🗑️</span>
              Limpiar
            </button>
          </div>

          {hayFiltrosAplicados && (
            <div className="filtros-aplicados">
              <span className="filtros-aplicados-label">Filtros activos:</span>
              <div className="filtros-tags">
                {Object.entries(appliedFilters).map(([key, value]) => (
                  <span key={key} className="filtro-tag">
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

// Componente de tarjeta de remisión profesional
const RemisionCard = ({ remision, onVerDetalle, onExport }) => {
  const renderTextoSeguro = (valor) => {
    if (typeof valor === 'object' && valor !== null) {
      return JSON.stringify(valor);
    }
    return valor || 'N/A';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
      return fechaObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const getEstadoClass = (estado) => {
    const estadoLower = estado?.toLowerCase() || '';
    switch (estadoLower) {
      case 'pendiente': return 'estado-pendiente';
      case 'en_proceso': return 'estado-proceso';
      case 'completado': return 'estado-completado';
      case 'finalizado': return 'estado-finalizado';
      case 'facturado': return 'estado-facturado';
      case 'cancelado': return 'estado-cancelado';
      default: return 'estado-default';
    }
  };

  const formatServicios = (remision) => {
    if (remision.servicios && Array.isArray(remision.servicios)) {
      return remision.servicios.map(s => s.nombre).join(', ');
    }
    // Fallback a estructura legacy
    const servicios = [];
    for (let i = 1; i <= 10; i++) {
      if (remision[`servicio${i}`]) {
        servicios.push(remision[`servicio${i}`]);
      }
    }
    return servicios.join(', ') || 'Sin servicios';
  };

  const formatTecnicos = (remision) => {
    if (remision.tecnicos && Array.isArray(remision.tecnicos)) {
      return remision.tecnicos.map(t => t.nombre).join(', ');
    }
    // Fallback a estructura legacy
    const tecnicos = [];
    for (let i = 1; i <= 10; i++) {
      if (remision[`tecnico${i}`]) {
        tecnicos.push(remision[`tecnico${i}`]);
      }
    }
    return tecnicos.join(', ') || 'Sin técnicos';
  };

  return (
    <div className="remision-card" data-cy="remision-card">
      <div className="card-header">
        <div className="card-title-section">
          <h3 className="card-title">
            Remisión #{renderTextoSeguro(remision.remision)}
          </h3>
          <div className="card-metadata">
            <span className="card-fecha">{formatFecha(remision.fecha_remision)}</span>
            <span className="card-movil">Móvil: {renderTextoSeguro(remision.movil)}</span>
          </div>
        </div>
        <div className="card-estado-section">
          <span className={`estado-badge ${getEstadoClass(remision.estado)}`}>
            {renderTextoSeguro(remision.estado)}
          </span>
        </div>
      </div>

      <div className="card-body">
        <div className="card-info-grid">
          <div className="info-item">
            <span className="info-label">Cliente:</span>
            <span className="info-value">{renderTextoSeguro(remision.cliente)}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Dirección:</span>
            <span className="info-value">{renderTextoSeguro(remision.direccion)}</span>
          </div>

          <div className="info-item span-full">
            <span className="info-label">Servicios:</span>
            <span className="info-value">{formatServicios(remision)}</span>
          </div>

          <div className="info-item span-full">
            <span className="info-label">Técnicos:</span>
            <span className="info-value">{formatTecnicos(remision)}</span>
          </div>

          {remision.total && (
            <div className="info-item">
              <span className="info-label">Total:</span>
              <span className="info-value total-value">
                ${parseFloat(remision.total).toLocaleString('es-CO')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="card-actions">
        <button
          onClick={() => onVerDetalle(remision)}
          className="btn btn-outline btn-sm"
          data-cy="btn-ver-detalle"
        >
          <span className="btn-icon">👁️</span>
          Ver Detalle
        </button>

        <button
          onClick={() => onExport(remision)}
          className="btn btn-outline btn-sm"
          data-cy="btn-exportar"
        >
          <span className="btn-icon">📊</span>
          Exportar
        </button>
      </div>
    </div>
  );
};

// Componente de timeline para historial
const HistorialTimeline = ({ remisionId, onClose }) => {
  const { historial, loading, error, fetchHistorial } = useHistorialRemision(remisionId);

  useEffect(() => {
    if (remisionId) {
      fetchHistorial();
    }
  }, [remisionId, fetchHistorial]);

  const formatFechaHora = (fecha) => {
    if (!fecha) return 'N/A';
    try {
      const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
      return fechaObj.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="historial-loading">
        <div className="spinner-large"></div>
        <p>Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="historial-error">
        <p>Error al cargar historial: {error}</p>
        <button onClick={fetchHistorial} className="btn btn-primary btn-sm">
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="historial-timeline" data-cy="historial-timeline">
      <div className="timeline-header">
        <h3>Historial de Actividades</h3>
        <button onClick={onClose} className="btn-close">×</button>
      </div>

      {historial.length === 0 ? (
        <div className="timeline-empty">
          <p>No hay actividades registradas para esta remisión.</p>
        </div>
      ) : (
        <div className="timeline-container">
          {historial.map((actividad, index) => (
            <div key={actividad.id || index} className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-header-item">
                  <span className="timeline-fecha">
                    {formatFechaHora(actividad.fechaActividad)}
                  </span>
                  {actividad.tecnico && (
                    <span className="timeline-tecnico">
                      {actividad.tecnico}
                    </span>
                  )}
                </div>
                <div className="timeline-actividad">
                  {actividad.actividad || 'Actividad sin descripción'}
                </div>
                {actividad.descripcion && (
                  <div className="timeline-descripcion">
                    {actividad.descripcion}
                  </div>
                )}
                {actividad.materiales && actividad.materiales.length > 0 && (
                  <div className="timeline-materiales">
                    <strong>Materiales:</strong> {actividad.materiales.join(', ')}
                  </div>
                )}
                {actividad.tiempoMinutos && (
                  <div className="timeline-tiempo">
                    <strong>Tiempo:</strong> {actividad.tiempoMinutos} minutos
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente principal
const HistorialTrabajosOptimizado = () => {
  const { empleado, rol } = useEmpleadoAuth();
  const {
    remisiones,
    loading,
    error,
    hasMore,
    totalFiltered,
    appliedFilters,
    fetchFirstPage,
    fetchNextPage,
    reset,
    isFirstPage,
    isLoadingFirstPage,
    isLoadingNextPage
  } = useRemisiones({ pageSize: 25 });

  const [remisionSeleccionada, setRemisionSeleccionada] = useState(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  // Manejar filtros
  const handleFiltrar = useCallback((filtros) => {
    setBusquedaRealizada(true);
    fetchFirstPage(filtros);
  }, [fetchFirstPage]);

  // Manejar ver detalle
  const handleVerDetalle = useCallback((remision) => {
    setRemisionSeleccionada(remision);
    // Disparar evento personalizado para modal
    window.dispatchEvent(new CustomEvent('ui:modal', {
      detail: {
        type: 'historial-remision',
        data: remision
      }
    }));
  }, []);

  // Manejar exportar
  const handleExportar = useCallback((remision) => {
    // Disparar evento personalizado para exportación
    window.dispatchEvent(new CustomEvent('export:remision', {
      detail: {
        remisionId: remision.id,
        filtros: { remision: remision.remision }
      }
    }));
  }, []);

  // Cerrar detalle
  const handleCerrarDetalle = useCallback(() => {
    setRemisionSeleccionada(null);
  }, []);

  return (
    <div className="historial-container" data-cy="historial-container">
      {/* Header profesional */}
      <div className="module-header">
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="module-title">
              <span className="title-icon">📋</span>
              Historial de Trabajos
            </h1>
            <p className="module-description">
              Consulta y gestión de remisiones con filtros avanzados
            </p>
          </div>
          
          {empleado && (
            <div className="header-user-info">
              <div className="user-badge">
                <span className="user-name">{empleado.identificacion}</span>
                <span className="user-role">{rol}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filtros */}
      <FiltrosAvanzados 
        onFilter={handleFiltrar}
        loading={isLoadingFirstPage}
        appliedFilters={appliedFilters}
      />

      {/* Área de resultados */}
      <div className="results-container">
        {/* Estado inicial - sin búsqueda */}
        {!busquedaRealizada && (
          <div className="initial-state" data-cy="initial-state">
            <div className="initial-state-content">
              <span className="initial-state-icon">🔍</span>
              <h3>Buscar Remisiones</h3>
              <p>
                Use los filtros para buscar remisiones específicas.<br/>
                Puede filtrar por fecha, estado, móvil, técnico o número de remisión.
              </p>
            </div>
          </div>
        )}

        {/* Loading primera página */}
        {isLoadingFirstPage && (
          <div className="loading-container">
            <div className="skeleton-grid">
              {[...Array(6)].map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-container" data-cy="error-container">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <h3>Error al cargar remisiones</h3>
              <p>{error}</p>
              <button 
                onClick={() => fetchFirstPage(appliedFilters)}
                className="btn btn-primary"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Resultados */}
        {busquedaRealizada && !isLoadingFirstPage && !error && (
          <div className="results-section">
            {/* Header de resultados */}
            <div className="results-header">
              <div className="results-info">
                <h3>Resultados de búsqueda</h3>
                <p>
                  {totalFiltered > 0 
                    ? `${remisiones.length} de ${hasMore ? 'más de ' : ''}${totalFiltered} remisiones encontradas`
                    : 'No se encontraron remisiones con los filtros aplicados'
                  }
                </p>
              </div>
              
              {remisiones.length > 0 && (
                <div className="results-actions">
                  <button
                    onClick={() => handleExportar({ filtros: appliedFilters })}
                    className="btn btn-secondary btn-sm"
                    data-cy="btn-exportar-todo"
                  >
                    <span className="btn-icon">📊</span>
                    Exportar Todo
                  </button>
                </div>
              )}
            </div>

            {/* Grid de tarjetas */}
            {remisiones.length > 0 ? (
              <div className="remisiones-grid" data-cy="remisiones-grid">
                {remisiones.map((remision) => (
                  <RemisionCard
                    key={remision.id}
                    remision={remision}
                    onVerDetalle={handleVerDetalle}
                    onExport={handleExportar}
                  />
                ))}
              </div>
            ) : (
              <div className="no-results" data-cy="no-results">
                <span className="no-results-icon">📄</span>
                <h3>No hay resultados</h3>
                <p>No se encontraron remisiones con los filtros aplicados.</p>
                <button 
                  onClick={() => handleFiltrar({})}
                  className="btn btn-outline"
                >
                  Ver todas las remisiones
                </button>
              </div>
            )}

            {/* Botón cargar más */}
            {hasMore && (
              <div className="load-more-container">
                <button
                  onClick={fetchNextPage}
                  disabled={isLoadingNextPage}
                  className="btn btn-secondary load-more-btn"
                  data-cy="btn-cargar-mas"
                >
                  {isLoadingNextPage ? (
                    <>
                      <span className="spinner"></span>
                      Cargando más...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">⬇️</span>
                      Cargar más resultados
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de historial */}
      {remisionSeleccionada && (
        <div className="modal-overlay" onClick={handleCerrarDetalle}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <HistorialTimeline
              remisionId={remisionSeleccionada.id}
              onClose={handleCerrarDetalle}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialTrabajosOptimizado;
