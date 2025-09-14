/**
 * 🚀 GLOBAL MOBILITY SOLUTIONS - ADMINISTRAR REMISIONES
 * ==================================================
 * Componente mejorado para administrar remisiones con formularios completos
 * Incluye todos los campos de la colección y diseño optimizado
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../core/auth/AuthContext';
import { useRole } from '../../../core/auth/RoleContext';
import { useRemisiones } from '../hooks/useRemisiones';
import { updateRemision, deleteRemision } from '../../../services/remisionesService';
import { ESTADOS_REMISION_PROCESO, SUPER_ADMIN, PERIODOS_FECHA } from '../../../shared/constants';
import NavigationBar from '../../../shared/components/NavigationBar';
import { toast } from 'react-toastify';
import FormularioRemisionPlano from './FormularioRemisionPlano';
import './AdministrarRemisiones.css';

// Configuración de permisos por rol
const PERMISOS_POR_ROL = {
  directivo: {
    ver: true,
    editar: true,
    eliminar: true,
    verTodos: true,
    exportar: true,
    estados: Object.keys(ESTADOS_REMISION_PROCESO)
  },
  administrativo: {
    ver: true,
    editar: true,
    eliminar: false,
    verTodos: true,
    exportar: true,
    estados: ['PENDIENTE', 'RADICADO', 'PROFORMA', 'GENERADO', 'GARANTIA', 'CORTESIA']
  },
  tecnico: {
    ver: true,
    editar: false,
    eliminar: false,
    verTodos: false,
    exportar: false,
    estados: ['PENDIENTE', 'EN_PROCESO', 'GARANTIA', 'CORTESIA']
  }
};

// Función para verificar si es super admin
const esSuperAdmin = (userEmail) => {
  return userEmail === SUPER_ADMIN.EMAIL;
};

// Permisos especiales para super admin
const PERMISOS_SUPER_ADMIN = {
  ver: true,
  editar: true,
  eliminar: true,
  verTodos: true,
  exportar: true,
  administrarPermisos: true,
  estados: Object.keys(ESTADOS_REMISION_PROCESO)
};

const AdministrarRemisiones = () => {
  // Hooks de autenticación y roles
  const { user } = useAuth();
  const { userRole } = useRole();

  // Estados locales
  const [filtros, setFiltros] = useState({
    remision: '',
    movil: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    tecnico: '',
    une: ''
  });
  
  const [ordenamiento, setOrdenamiento] = useState({
    campo: 'fecha_remision',
    direccion: 'desc' // 'asc' o 'desc'
  });
  
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [remisionSeleccionada, setRemisionSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  // Estados para navegación
  const [navigationHistory, setNavigationHistory] = useState(['consultar-trabajos']);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  // Hook para gestión de remisiones
  const {
    remisiones,
    loading: loadingRemisiones,
    error,
    fetchFirstPage,
    hasMore,
    fetchNextPage
  } = useRemisiones({ pageSize: 50 });

  // Permisos del usuario actual
  const permisos = useMemo(() => {
    if (!user) return null;
    
    if (esSuperAdmin(user.email)) {
      return PERMISOS_SUPER_ADMIN;
    }
    
    return PERMISOS_POR_ROL[userRole] || PERMISOS_POR_ROL.tecnico;
  }, [user, userRole]);

  // Estados disponibles según el rol
  const estadosDisponibles = useMemo(() => {
    if (!permisos) return [];
    return permisos.estados.map(key => ESTADOS_REMISION_PROCESO[key]).filter(Boolean);
  }, [permisos]);

  // Configurar filtros por defecto
  useEffect(() => {
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    setFiltros(prev => ({
      ...prev,
      fechaDesde: hace30Dias.toISOString().split('T')[0],
      fechaHasta: hoy.toISOString().split('T')[0]
    }));
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    if (filtros.fechaDesde && filtros.fechaHasta) {
      buscarRemisiones();
    }
  }, [filtros.fechaDesde, filtros.fechaHasta]);

  // Función para buscar remisiones
  const buscarRemisiones = useCallback(async () => {
    // Sanitizar y convertir el filtro de móvil - permitir BO- y números
    let movilFinal;
    if (filtros.movil && filtros.movil.trim()) {
      const movilInput = String(filtros.movil).trim();
      
      // Si comienza con BO-, mantener como string normalizado
      if (movilInput.toUpperCase().startsWith('BO-')) {
        // Normalizar: BO- en mayúsculas, resto como está
        const prefix = 'BO-';
        const suffix = movilInput.substring(3);
        movilFinal = prefix + suffix;
      } else {
        // Para números, sanitizar y convertir
        const movilSanitizado = movilInput.replace(/\D/g, '');
        movilFinal = movilSanitizado ? Number(movilSanitizado) : undefined;
      }
    }
    
    // Sanitizar número de remisión
    const remisionSanitizada = filtros.remision ? String(filtros.remision).trim().replace(/\D/g, '') : '';
    const remisionFinal = remisionSanitizada ? Number(remisionSanitizada) : undefined;
    
    const filtrosQuery = {
      fechaInicio: filtros.fechaDesde ? new Date(filtros.fechaDesde) : null,
      fechaFin: filtros.fechaHasta ? new Date(filtros.fechaHasta) : null,
      estado: filtros.estado && filtros.estado.trim() ? filtros.estado.trim() : undefined,
      remision: remisionFinal,
      movil: movilFinal,
      tecnico: filtros.tecnico && filtros.tecnico.trim() ? filtros.tecnico.trim() : (!permisos?.verTodos ? user?.email : undefined),
      une: filtros.une && filtros.une.trim() ? filtros.une.trim() : undefined
    };

    // Log para depuración
    console.log('🔍 Filtros aplicados en AdministrarRemisiones:', filtrosQuery);

    await fetchFirstPage(filtrosQuery);
  }, [filtros, permisos?.verTodos, user?.email, fetchFirstPage]);

  // Función para ordenar remisiones
  const remisionesOrdenadas = useMemo(() => {
    if (!remisiones || remisiones.length === 0) return [];
    
    const sorted = [...remisiones].sort((a, b) => {
      let valorA = a[ordenamiento.campo];
      let valorB = b[ordenamiento.campo];
      
      // Manejar fechas especialmente
      if (ordenamiento.campo.includes('fecha')) {
        if (valorA && typeof valorA === 'object' && valorA.seconds) {
          valorA = new Date(valorA.seconds * 1000);
        } else if (valorA) {
          valorA = new Date(valorA);
        } else {
          valorA = new Date(0);
        }
        
        if (valorB && typeof valorB === 'object' && valorB.seconds) {
          valorB = new Date(valorB.seconds * 1000);
        } else if (valorB) {
          valorB = new Date(valorB);
        } else {
          valorB = new Date(0);
        }
      }
      
      // Manejar valores nulos
      if (!valorA && !valorB) return 0;
      if (!valorA) return 1;
      if (!valorB) return -1;
      
      // Comparar valores
      if (valorA < valorB) return ordenamiento.direccion === 'asc' ? -1 : 1;
      if (valorA > valorB) return ordenamiento.direccion === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [remisiones, ordenamiento]);

  // Función para cambiar ordenamiento
  const handleOrdenar = useCallback((campo) => {
    setOrdenamiento(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Manejar cambio de filtros
  const handleFiltroChange = useCallback((campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  }, []);

  // Manejar eliminación
  const handleEliminar = useCallback(async (remision) => {
    if (!permisos?.eliminar) {
      alert('No tiene permisos para eliminar remisiones');
      return;
    }

    const confirmar = window.confirm(
      `¿Está seguro de que desea eliminar la remisión ${remision.remision}?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    setLoading(true);
    try {
      await deleteRemision(remision.id);
      buscarRemisiones();
      alert('Remisión eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar remisión:', error);
      alert(`Error al eliminar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [permisos?.eliminar, buscarRemisiones]);

  // Manejar guardar edición
  const handleGuardarEdicion = useCallback(async (datosActualizados) => {
    if (!remisionSeleccionada) return;

    setLoading(true);
    try {
      await updateRemision(remisionSeleccionada.id, datosActualizados);
      setShowModalEditar(false);
      setRemisionSeleccionada(null);
      buscarRemisiones();
      alert('Remisión actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar remisión:', error);
      alert(`Error al actualizar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [remisionSeleccionada, buscarRemisiones]);

  // Formatear fecha - maneja objetos Timestamp de Firestore
  const formatearFecha = useCallback((fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      let fechaObj;
      
      // Si es un Timestamp de Firestore (tiene seconds y nanoseconds)
      if (fecha && typeof fecha === 'object' && fecha.seconds !== undefined) {
        fechaObj = new Date(fecha.seconds * 1000);
      }
      // Si ya es un objeto Date
      else if (fecha instanceof Date) {
        fechaObj = fecha;
      }
      // Si es una cadena o número
      else {
        fechaObj = new Date(fecha);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
      }
      
      return fechaObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error, fecha);
      return 'Error en fecha';
    }
  }, []);

  // Obtener información del estado
  const getEstadoInfo = useCallback((estado) => {
    return Object.values(ESTADOS_REMISION_PROCESO).find(e => e.value === estado) || 
           { value: estado, label: estado, color: '#6c757d', description: 'Estado desconocido' };
  }, []);

  // Funciones de navegación
  const handleNavigateBack = useCallback(() => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(prev => prev - 1);
      // Cerrar modales si están abiertos
      if (showModalDetalle || showModalEditar) {
        setShowModalDetalle(false);
        setShowModalEditar(false);
        setRemisionSeleccionada(null);
      }
    }
  }, [currentHistoryIndex, showModalDetalle, showModalEditar]);

  const handleNavigateForward = useCallback(() => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      setCurrentHistoryIndex(prev => prev + 1);
    }
  }, [currentHistoryIndex, navigationHistory.length]);

  const addToNavigationHistory = useCallback((page) => {
    setNavigationHistory(prev => {
      const newHistory = prev.slice(0, currentHistoryIndex + 1);
      newHistory.push(page);
      return newHistory;
    });
    setCurrentHistoryIndex(prev => prev + 1);
  }, [currentHistoryIndex]);

  // Manejar ver detalle (modificado para navegación)
  const handleVerDetalle = useCallback((remision) => {
    setRemisionSeleccionada(remision);
    setShowModalDetalle(true);
    addToNavigationHistory(`detalle-${remision.remision}`);
  }, [addToNavigationHistory]);

  // Manejar edición (modificado para navegación)
  const handleEditar = useCallback((remision) => {
    if (!permisos?.editar) {
      alert('No tiene permisos para editar remisiones');
      return;
    }
    setRemisionSeleccionada(remision);
    setShowModalEditar(true);
    addToNavigationHistory(`editar-${remision.remision}`);
  }, [permisos?.editar, addToNavigationHistory]);

  return (
    <div className="administrar-remisiones">
      {/* Barra de navegación */}
      <NavigationBar
        onBack={handleNavigateBack}
        onForward={handleNavigateForward}
        canGoBack={currentHistoryIndex > 0}
        canGoForward={currentHistoryIndex < navigationHistory.length - 1}
        currentPath="historial-trabajos/administrar-remisiones"
        title="Consultar Trabajos"
        showBreadcrumbs={true}
      />
      
      {/* Header */}
      <motion.div 
        className="header-section"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="page-title">
          📋 Consultar Trabajos
        </h1>
        <div className="user-info">
          {esSuperAdmin(user?.email) ? (
            <span className="super-admin-badge">⭐ SUPER ADMIN</span>
          ) : (
            <span className="user-role-badge">{userRole?.toUpperCase()}</span>
          )}
          <span className="user-email">{user?.email}</span>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div 
        className="filters-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="filters-grid">
          <div className="filter-group">
            <label>Número de Remisión</label>
            <input
              type="text"
              placeholder="Ej: 1001"
              value={filtros.remision}
              onChange={(e) => handleFiltroChange('remision', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Móvil</label>
            <input
              type="text"
              placeholder="Ej: 7361, BO-1234"
              value={filtros.movil}
              onChange={(e) => {
                // Permitir números y móviles BO-
                const valor = e.target.value.trim();
                if (valor === '' || valor.match(/^(\d+|BO-[\w\d]*)$/i)) {
                  handleFiltroChange('movil', valor);
                }
              }}
            />
          </div>
          
          <div className="filter-group">
            <label>Técnico</label>
            <input
              type="text"
              placeholder="Ej: Danny Gil"
              value={filtros.tecnico}
              onChange={(e) => handleFiltroChange('tecnico', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>UNE</label>
            <input
              type="text"
              placeholder="Ej: SANJOSE1"
              value={filtros.une}
              onChange={(e) => handleFiltroChange('une', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Estado</label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
            >
              <option value="">Todos los estados</option>
              {estadosDisponibles.map(estado => (
                <option key={estado.value} value={estado.value}>
                  {estado.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Desde</label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>Hasta</label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
            />
          </div>
          
          <div className="filter-group">
            <label>&nbsp;</label>
            <motion.button
              className="btn-search"
              onClick={buscarRemisiones}
              disabled={loadingRemisiones}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {loadingRemisiones ? '🔄' : '🔍'} Buscar
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Resultados */}
      <motion.div 
        className="results-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            ❌ {error}
          </motion.div>
        )}

        {loadingRemisiones && (
          <motion.div 
            className="loading-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            🔄 Cargando trabajos...
          </motion.div>
        )}

        {!loadingRemisiones && !error && remisiones.length === 0 && (
          <motion.div 
            className="no-results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            📭 No se encontraron trabajos con los criterios especificados
          </motion.div>
        )}

        {!loadingRemisiones && !error && remisionesOrdenadas.length > 0 && (
          <>
            <div className="results-header">
              <span className="results-count">
                📊 {remisionesOrdenadas.length} trabajo(s) encontrado(s)
              </span>
              {permisos?.exportar && (
                <motion.button
                  className="btn-export"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => alert('Función de exportar en desarrollo')}
                >
                  📤 Exportar
                </motion.button>
              )}
            </div>

            {/* Tabla de resultados */}
            <motion.div 
              className="tabla-remisiones"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <table className="remisiones-table">
                <thead>
                  <tr>
                    <th 
                      className={`sortable ${ordenamiento.campo === 'remision' ? ordenamiento.direccion : ''}`}
                      onClick={() => handleOrdenar('remision')}
                    >
                      # Remisión
                      {ordenamiento.campo === 'remision' && (
                        <span className="sort-indicator">
                          {ordenamiento.direccion === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`sortable ${ordenamiento.campo === 'movil' ? ordenamiento.direccion : ''}`}
                      onClick={() => handleOrdenar('movil')}
                    >
                      Móvil
                      {ordenamiento.campo === 'movil' && (
                        <span className="sort-indicator">
                          {ordenamiento.direccion === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`sortable ${ordenamiento.campo === 'fecha_remision' ? ordenamiento.direccion : ''}`}
                      onClick={() => handleOrdenar('fecha_remision')}
                    >
                      Fecha
                      {ordenamiento.campo === 'fecha_remision' && (
                        <span className="sort-indicator">
                          {ordenamiento.direccion === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`sortable ${ordenamiento.campo === 'tecnico1' ? ordenamiento.direccion : ''}`}
                      onClick={() => handleOrdenar('tecnico1')}
                    >
                      Técnico
                      {ordenamiento.campo === 'tecnico1' && (
                        <span className="sort-indicator">
                          {ordenamiento.direccion === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`sortable ${ordenamiento.campo === 'une' ? ordenamiento.direccion : ''}`}
                      onClick={() => handleOrdenar('une')}
                    >
                      UNE
                      {ordenamiento.campo === 'une' && (
                        <span className="sort-indicator">
                          {ordenamiento.direccion === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`sortable ${ordenamiento.campo === 'estado' ? ordenamiento.direccion : ''}`}
                      onClick={() => handleOrdenar('estado')}
                    >
                      Estado
                      {ordenamiento.campo === 'estado' && (
                        <span className="sort-indicator">
                          {ordenamiento.direccion === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th 
                      className={`sortable ${ordenamiento.campo === 'total' ? ordenamiento.direccion : ''}`}
                      onClick={() => handleOrdenar('total')}
                    >
                      Total
                      {ordenamiento.campo === 'total' && (
                        <span className="sort-indicator">
                          {ordenamiento.direccion === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {remisionesOrdenadas.map((remision, index) => {
                    const estadoInfo = getEstadoInfo(remision.estado);
                    return (
                      <motion.tr
                        key={remision.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        whileHover={{ backgroundColor: '#f8f9fa' }}
                      >
                        <td className="remision-number">
                          <strong>{remision.remision || 'N/A'}</strong>
                        </td>
                        <td className="movil-number">
                          {remision.movil || 'N/A'}
                        </td>
                        <td className="fecha-cell">
                          {formatearFecha(remision.fecha_remision)}
                        </td>
                        <td className="tecnico-cell">
                          {remision.tecnico1 || remision.genero || 'No asignado'}
                        </td>
                        <td className="une-cell">
                          {remision.une || 'N/A'}
                        </td>
                        <td className="estado-cell">
                          <span 
                            className="estado-badge-table"
                            style={{ backgroundColor: estadoInfo.color }}
                            title={estadoInfo.description}
                          >
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td className="total-cell">
                          <strong className="price-table">
                            {remision.total ? 
                              `$${parseFloat(remision.total).toLocaleString('es-CO')}` : 
                              'N/A'
                            }
                          </strong>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <motion.button
                              className="btn-action-table btn-view"
                              onClick={() => handleVerDetalle(remision)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Ver detalle"
                            >
                              👁️
                            </motion.button>
                            
                            {permisos?.editar && (
                              <motion.button
                                className="btn-action-table btn-edit"
                                onClick={() => handleEditar(remision)}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Editar"
                              >
                                ✏️
                              </motion.button>
                            )}
                            
                            {permisos?.eliminar && (
                              <motion.button
                                className="btn-action-table btn-delete"
                                onClick={() => handleEliminar(remision)}
                                disabled={loading}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Eliminar"
                              >
                                🗑️
                              </motion.button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>

            {hasMore && (
              <motion.div 
                className="load-more-section"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.button
                  className="btn-load-more"
                  onClick={fetchNextPage}
                  disabled={loadingRemisiones}
                  whileHover={{ scale: 1.05 }}
                >
                  {loadingRemisiones ? '🔄 Cargando...' : '📄 Cargar más'}
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {/* Modales */}
      {showModalDetalle && remisionSeleccionada && (
        <ModalDetalleRemision
          remision={remisionSeleccionada}
          onClose={() => {
            setShowModalDetalle(false);
            setRemisionSeleccionada(null);
            handleNavigateBack(); // Navegación automática al cerrar
          }}
        />
      )}

      {showModalEditar && remisionSeleccionada && (
        <FormularioRemisionPlano
          remision={remisionSeleccionada}
          estadosDisponibles={estadosDisponibles}
          onSave={handleGuardarEdicion}
          onClose={() => {
            setShowModalEditar(false);
            setRemisionSeleccionada(null);
            handleNavigateBack(); // Navegación automática al cerrar
          }}
        />
      )}
    </div>
  );
};

// Componente Modal para ver detalle completo de remisión
const ModalDetalleRemision = ({ remision, onClose }) => {
  const getEstadoInfo = (estado) => {
    return Object.values(ESTADOS_REMISION_PROCESO).find(e => e.value === estado) || 
           { value: estado, label: estado, color: '#6c757d', description: 'Estado desconocido' };
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      let fechaObj;
      
      // Si es un Timestamp de Firestore (tiene seconds y nanoseconds)
      if (fecha && typeof fecha === 'object' && fecha.seconds !== undefined) {
        fechaObj = new Date(fecha.seconds * 1000);
      }
      // Si ya es un objeto Date
      else if (fecha instanceof Date) {
        fechaObj = fecha;
      }
      // Si es un timestamp UNIX (número)
      else if (typeof fecha === 'number') {
        fechaObj = new Date(fecha);
      }
      // Si es una cadena
      else if (typeof fecha === 'string') {
        fechaObj = new Date(fecha);
      }
      // Si es un objeto con toDate() (Firestore Timestamp)
      else if (fecha && typeof fecha.toDate === 'function') {
        fechaObj = fecha.toDate();
      }
      // Último recurso
      else {
        console.warn('⚠️ Tipo de fecha no reconocido:', fecha);
        fechaObj = new Date(fecha);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        console.error('❌ Fecha inválida después de conversión:', fechaObj, 'original:', fecha);
        return 'Fecha inválida';
      }
      
      const fechaFormateada = fechaObj.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      return fechaFormateada;
    } catch (error) {
      console.error('❌ Error al formatear fecha:', error, fecha);
      return 'Error en fecha';
    }
  };

  const estadoInfo = getEstadoInfo(remision.estado);

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => {
        // Solo cerrar si se hace clic directamente en el overlay, no en el contenido
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-content modal-detalle"
        onClick={(e) => e.stopPropagation()} // Prevenir que se propague el click al overlay
      >
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-icon">
              📋
            </div>
            <div className="modal-title-info">
              <h2>Detalle de Remisión {remision.remision}</h2>
              <div className="modal-subtitle">
                {remision.movil ? `Móvil: ${remision.movil}` : 'Sin móvil asignado'} • 
                <span 
                  style={{ 
                    color: getEstadoInfo(remision.estado).color,
                    fontWeight: 'bold',
                    marginLeft: '8px'
                  }}
                >
                  {remision.estado || 'Sin estado'}
                </span>
              </div>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Información General */}
          <div className="detalle-section">
            <h3>📄 Información General</h3>
            <div className="detalle-grid">
              <div className="detalle-item">
                <span className="label">🔢 Remisión:</span>
                <span className="value">{remision.remision || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">🚐 Móvil:</span>
                <span className="value">{remision.movil || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">📝 No. Orden:</span>
                <span className="value">{remision.no_orden || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">⚡ Estado:</span>
                <span 
                  className="value estado-badge"
                  style={{ backgroundColor: estadoInfo.color }}
                >
                  {estadoInfo.label}
                </span>
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="detalle-section">
            <h3>🔧 Servicios Realizados</h3>
            <div className="servicios-list">
              {[
                remision.servicio1,
                remision.servicio2,
                remision.servicio3,
                remision.servicio4,
                remision.servicio5
              ].filter(Boolean).map((servicio, index) => (
                <div key={index} className="servicio-item">
                  • {servicio}
                </div>
              )) || <span className="no-data">No hay servicios registrados</span>}
            </div>
          </div>

          {/* Fechas */}
          <div className="detalle-section">
            <h3>📅 Fechas</h3>
            <div className="detalle-grid">
              <div className="detalle-item">
                <span className="label">📝 Fecha Remisión:</span>
                <span className="value">{formatearFecha(remision.fecha_remision)}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">⏰ Fecha Máximo:</span>
                <span className="value">{formatearFecha(remision.fecha_maximo)}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">🔧 Fecha BIT Prof:</span>
                <span className="value">{formatearFecha(remision.fecha_bit_prof)}</span>
              </div>
            </div>
          </div>

          {/* Personal */}
          <div className="detalle-section">
            <h3>👥 Personal</h3>
            <div className="detalle-grid">
              <div className="detalle-item">
                <span className="label">🔧 Técnico 1:</span>
                <span className="value">{remision.tecnico1 || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">⚡ Técnico 2:</span>
                <span className="value">{remision.tecnico2 || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">🛠️ Técnico 3:</span>
                <span className="value">{remision.tecnico3 || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">✅ Autorizó:</span>
                <span className="value">{remision.autorizo || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">👤 Generó:</span>
                <span className="value">{remision.genero || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Información Técnica */}
          <div className="detalle-section">
            <h3>⚙️ Información Técnica</h3>
            <div className="detalle-grid">
              <div className="detalle-item">
                <span className="label">🏢 UNE:</span>
                <span className="value">{remision.une || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">🚐 Carrocería:</span>
                <span className="value">{remision.carroceria || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">📋 Radicación:</span>
                <span className="value">{formatearFecha(remision.radicacion)}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">🔢 No. ID BIT:</span>
                <span className="value">{remision.no_id_bit || 'N/A'}</span>
              </div>
              
              <div className="detalle-item">
                <span className="label">🧾 No. Fact. Elect:</span>
                <span className="value">{remision.no_fact_elect || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Información Financiera */}
          <div className="detalle-section">
            <h3>💰 Información Financiera</h3>
            <div className="detalle-grid">
              <div className="detalle-item">
                <span className="label">💵 Subtotal:</span>
                <span className="value price">
                  {remision.subtotal ? `$${parseFloat(remision.subtotal).toLocaleString('es-CO')}` : 'N/A'}
                </span>
              </div>
              
              <div className="detalle-item total-destacado">
                <span className="label">💸 Total:</span>
                <span className="value price">
                  {remision.total ? `$${parseFloat(remision.total).toLocaleString('es-CO')}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-close-modal"
            onClick={onClose}
          >
            ✕ Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdministrarRemisiones;
