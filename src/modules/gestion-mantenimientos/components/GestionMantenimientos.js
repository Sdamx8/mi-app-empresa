/**
 * 🔧 GLOBAL MOBILITY SOLUTIONS - GESTIÓN DE MANTENIMIENTOS
 * =========================================================
 * Módulo para gestionar y visualizar mantenimientos preventivos de claraboyas
 * Incluye filtros por UNE, vista en lista y modal de detalles
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../core/auth/AuthContext';
import { useRole } from '../../../core/auth/RoleContext';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';
import NavigationBar from '../../../shared/components/NavigationBar';
import './GestionMantenimientos.css';

const GestionMantenimientos = () => {
  // Hooks de autenticación
  const { user } = useAuth();
  const { userRole } = useRole();

  // Estados principales
  const [todosLosMoviles, setTodosLosMoviles] = useState([]);
  const [movilesFiltrados, setMovilesFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [unesDisponibles, setUnesDisponibles] = useState(['TODAS']);
  const [uneSeleccionada, setUneSeleccionada] = useState('TODAS');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // TODOS, PENDIENTES, AL_DIA
  const [ordenamiento, setOrdenamiento] = useState('urgencia'); // urgencia, movil, une
  
  // Estados para modal
  const [modalAbierto, setModalAbierto] = useState(false);
  const [movilSeleccionado, setMovilSeleccionado] = useState(null);
  const [historialMovil, setHistorialMovil] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  
  // Estado para búsqueda
  const [busquedaMovil, setBusquedaMovil] = useState('');
  
  // Estados para navegación
  const [navigationHistory, setNavigationHistory] = useState(['gestion-mantenimientos']);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  // Efecto para cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && modalAbierto) {
        cerrarModal();
      }
    };

    if (modalAbierto) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevenir scroll del body
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset'; // Restaurar scroll
    };
  }, [modalAbierto]);

  // Función para verificar si es mantenimiento de claraboya
  const esMantenimientoClaraboya = useCallback((servicio) => {
    if (!servicio) return false;
    const servicioUpper = servicio.toUpperCase();
    return (
      servicioUpper.includes('MANTENIMIENTO PREVENTIVO CLARABOYA NTC SENIOR 5206') ||
      servicioUpper.includes('MANTENIMIENTO PREVENTIVO CLARABOYA BUSSCAR')
    );
  }, []);

  // Función para formatear fecha
  const formatearFecha = useCallback((fecha) => {
    if (!fecha) return 'N/A';
    
    try {
      let fechaObj;
      if (fecha && typeof fecha === 'object' && fecha.seconds !== undefined) {
        fechaObj = new Date(fecha.seconds * 1000);
      } else if (fecha instanceof Date) {
        fechaObj = fecha;
      } else {
        fechaObj = new Date(fecha);
      }
      
      if (isNaN(fechaObj.getTime())) {
        return 'Fecha inválida';
      }
      
      const day = String(fechaObj.getDate()).padStart(2, '0');
      const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const year = fechaObj.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Fecha inválida';
    }
  }, []);

  // Función para calcular tiempo sin mantenimiento
  const calcularTiempoSinMantenimiento = useCallback((fecha) => {
    if (!fecha) return { texto: 'Nunca realizado', meses: 999 };
    
    try {
      let fechaObj;
      if (fecha && typeof fecha === 'object' && fecha.seconds !== undefined) {
        fechaObj = new Date(fecha.seconds * 1000);
      } else {
        fechaObj = new Date(fecha);
      }
      
      const ahora = new Date();
      const diferenciaMeses = (ahora.getFullYear() - fechaObj.getFullYear()) * 12 + 
                             (ahora.getMonth() - fechaObj.getMonth());
      
      let texto = '';
      if (diferenciaMeses === 0) texto = 'Este mes';
      else if (diferenciaMeses === 1) texto = '1 mes';
      else if (diferenciaMeses < 12) texto = `${diferenciaMeses} meses`;
      else {
        const años = Math.floor(diferenciaMeses / 12);
        const meses = diferenciaMeses % 12;
        if (meses === 0) texto = `${años} año${años > 1 ? 's' : ''}`;
        else texto = `${años} año${años > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
      }
      
      return { texto, meses: diferenciaMeses };
    } catch (error) {
      return { texto: 'Error calculando', meses: 0 };
    }
  }, []);

  // Función para obtener el estado del mantenimiento
  const obtenerEstadoMantenimiento = useCallback((meses) => {
    if (meses === 999) { // Nunca realizado
      return { tipo: 'critico', color: '#E74C3C', icono: '🔴' };
    } else if (meses >= 12) {
      return { tipo: 'critico', color: '#E74C3C', icono: '🔴' };
    } else if (meses >= 6) {
      return { tipo: 'advertencia', color: '#F39C12', icono: '🟡' };
    } else {
      return { tipo: 'aldia', color: '#27AE60', icono: '🟢' };
    }
  }, []);

  // Función para obtener UNEs disponibles
  const obtenerUnesDisponibles = useCallback(async () => {
    try {
      const remisionesRef = collection(db, 'remisiones');
      const querySnapshot = await getDocs(remisionesRef);
      
      const unesSet = new Set();
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.une && data.une.trim() !== '') {
          unesSet.add(data.une.toUpperCase());
        }
      });
      
      const unesArray = Array.from(unesSet).sort();
      setUnesDisponibles(['TODAS', ...unesArray]);
      console.log(`✅ UNEs encontradas: ${unesArray.length}`);
    } catch (error) {
      console.error('Error obteniendo UNEs:', error);
      setError('Error al cargar las ubicaciones');
    }
  }, []);

  // Función principal para analizar todos los móviles
  const analizarMoviles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Analizando móviles...');
      const remisionesRef = collection(db, 'remisiones');
      const q = query(remisionesRef, orderBy('fecha_remision', 'desc'));
      const querySnapshot = await getDocs(q);
      
      // Agrupar datos por móvil
      const movilesDatos = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const movil = data.movil;
        
        // Validar que móvil sea una cadena válida
        if (!movil || typeof movil !== 'string' || movil.trim() === '') return;
        
        // Inicializar datos del móvil si no existe
        if (!movilesDatos[movil]) {
          movilesDatos[movil] = {
            movil: movil,
            une: data.une || 'SIN UNE',
            ultimoMantenimientoClaraboya: null,
            ultimaRemision: data.remision,
            ultimoTecnico: data.tecnico1 || data.genero || 'N/A',
            totalTrabajos: 0,
            trabajosConClaraboya: 0,
            historial: []
          };
        }
        
        // Contar trabajos totales
        movilesDatos[movil].totalTrabajos++;
        
        // Agregar al historial
        movilesDatos[movil].historial.push({
          remision: data.remision,
          fecha: data.fecha_remision,
          servicios: [data.servicio1, data.servicio2, data.servicio3, data.servicio4, data.servicio5].filter(Boolean),
          tecnico: data.tecnico1 || data.genero,
          total: data.total,
          une: data.une
        });
        
        // Verificar si tiene mantenimiento de claraboya
        const tieneMantenimientoClaraboya = [
          data.servicio1,
          data.servicio2,
          data.servicio3,
          data.servicio4,
          data.servicio5
        ].some(servicio => esMantenimientoClaraboya(servicio));
        
        if (tieneMantenimientoClaraboya) {
          movilesDatos[movil].trabajosConClaraboya++;
          
          // Actualizar fecha del último mantenimiento de claraboya
          if (!movilesDatos[movil].ultimoMantenimientoClaraboya || 
              data.fecha_remision > movilesDatos[movil].ultimoMantenimientoClaraboya) {
            movilesDatos[movil].ultimoMantenimientoClaraboya = data.fecha_remision;
            movilesDatos[movil].ultimoTecnicoClaraboya = data.tecnico1 || data.genero;
          }
        }
      });
      
      // Convertir a array y agregar información de tiempo
      const movilesArray = Object.values(movilesDatos).map(movil => {
        const tiempoInfo = calcularTiempoSinMantenimiento(movil.ultimoMantenimientoClaraboya);
        const estadoInfo = obtenerEstadoMantenimiento(tiempoInfo.meses);
        
        return {
          ...movil,
          tiempoSinMantenimiento: tiempoInfo.texto,
          mesesSinMantenimiento: tiempoInfo.meses,
          estadoMantenimiento: estadoInfo
        };
      });
      
      // Ordenar por defecto por urgencia
      movilesArray.sort((a, b) => b.mesesSinMantenimiento - a.mesesSinMantenimiento);
      
      setTodosLosMoviles(movilesArray);
      setMovilesFiltrados(movilesArray);
      
      console.log(`✅ Total de móviles analizados: ${movilesArray.length}`);
      
    } catch (error) {
      console.error('Error al analizar móviles:', error);
      setError('Error al cargar los datos de mantenimiento');
    } finally {
      setLoading(false);
    }
  }, [esMantenimientoClaraboya, calcularTiempoSinMantenimiento, obtenerEstadoMantenimiento]);

  // Función para aplicar filtros
  const aplicarFiltros = useCallback(() => {
    let filtrados = [...todosLosMoviles];
    
    // Filtrar por UNE
    if (uneSeleccionada !== 'TODAS') {
      filtrados = filtrados.filter(movil => 
        movil.une && movil.une.toUpperCase() === uneSeleccionada
      );
    }
    
    // Filtrar por estado
    if (filtroEstado === 'PENDIENTES') {
      filtrados = filtrados.filter(movil => movil.mesesSinMantenimiento >= 6);
    } else if (filtroEstado === 'AL_DIA') {
      filtrados = filtrados.filter(movil => movil.mesesSinMantenimiento < 6 && movil.mesesSinMantenimiento !== 999);
    }
    
    // Filtrar por búsqueda
    if (busquedaMovil) {
      const busqueda = busquedaMovil.toLowerCase();
      filtrados = filtrados.filter(movil => 
        movil.movil && typeof movil.movil === 'string' && movil.movil.toLowerCase().includes(busqueda)
      );
    }
    
    // Aplicar ordenamiento
    filtrados.sort((a, b) => {
      switch (ordenamiento) {
        case 'urgencia':
          return b.mesesSinMantenimiento - a.mesesSinMantenimiento;
        case 'movil':
          return a.movil.localeCompare(b.movil);
        case 'une':
          return (a.une || 'ZZZ').localeCompare(b.une || 'ZZZ');
        default:
          return 0;
      }
    });
    
    setMovilesFiltrados(filtrados);
  }, [todosLosMoviles, uneSeleccionada, filtroEstado, busquedaMovil, ordenamiento]);

  // Función para abrir modal con detalles
  const abrirModalDetalles = useCallback(async (movil) => {
    setMovilSeleccionado(movil);
    setModalAbierto(true);
    setLoadingHistorial(true);
    
    try {
      // Aquí puedes cargar más detalles si es necesario
      setHistorialMovil(movil.historial || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoadingHistorial(false);
    }
  }, []);

  // Función para cerrar modal
  const cerrarModal = useCallback(() => {
    setModalAbierto(false);
    setMovilSeleccionado(null);
    setHistorialMovil([]);
  }, []);

  // Efectos
  useEffect(() => {
    obtenerUnesDisponibles();
    analizarMoviles();
  }, [obtenerUnesDisponibles, analizarMoviles]);

  useEffect(() => {
    aplicarFiltros();
  }, [aplicarFiltros]);

  // Funciones de navegación
  const handleNavigateBack = useCallback(() => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(prev => prev - 1);
    }
  }, [currentHistoryIndex]);

  const handleNavigateForward = useCallback(() => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      setCurrentHistoryIndex(prev => prev + 1);
    }
  }, [currentHistoryIndex, navigationHistory.length]);

  return (
    <div className="gestion-mantenimientos">
      {/* Barra de navegación */}
      <NavigationBar
        onBack={handleNavigateBack}
        onForward={handleNavigateForward}
        canGoBack={currentHistoryIndex > 0}
        canGoForward={currentHistoryIndex < navigationHistory.length - 1}
        currentPath="mantenimiento/gestion-mantenimientos"
        title="Gestión de Mantenimientos"
        showBreadcrumbs={true}
      />
      
      {/* Header */}
      <motion.div 
        className="gm-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="gm-title-section">
          <h1 className="gm-title">
            🔧 Gestión de Mantenimientos Preventivos
          </h1>
          <p className="gm-subtitle">
            Control de mantenimientos de claraboyas NTC Senior 5206 y Busscar
          </p>
        </div>
        <div className="gm-user-info">
          <span className="gm-user-role">{userRole?.toUpperCase()}</span>
          <span className="gm-user-email">{user?.email}</span>
        </div>
      </motion.div>

      {/* Panel de filtros */}
      <motion.div 
        className="gm-filters-panel"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="gm-filters-row">
          {/* Búsqueda rápida */}
          <div className="gm-filter-group">
            <label className="gm-filter-label">🔍 Buscar móvil</label>
            <input
              type="text"
              className="gm-search-input"
              placeholder="Ej: 7361, BO-1234..."
              value={busquedaMovil}
              onChange={(e) => setBusquedaMovil(e.target.value)}
            />
          </div>

          {/* Filtro por UNE */}
          <div className="gm-filter-group">
            <label className="gm-filter-label">📍 UNE</label>
            <select
              className="gm-filter-select"
              value={uneSeleccionada}
              onChange={(e) => setUneSeleccionada(e.target.value)}
            >
              {unesDisponibles.map(une => (
                <option key={une} value={une}>
                  {une === 'TODAS' ? 'Todas las UNEs' : une}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <div className="gm-filter-group">
            <label className="gm-filter-label">📊 Estado</label>
            <select
              className="gm-filter-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="PENDIENTES">Pendientes (6+ meses)</option>
              <option value="AL_DIA">Al día</option>
            </select>
          </div>

          {/* Ordenamiento */}
          <div className="gm-filter-group">
            <label className="gm-filter-label">↕️ Ordenar por</label>
            <select
              className="gm-filter-select"
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value)}
            >
              <option value="urgencia">Urgencia</option>
              <option value="movil">Móvil</option>
              <option value="une">UNE</option>
            </select>
          </div>

          {/* Botón actualizar */}
          <button 
            className="gm-btn-refresh"
            onClick={analizarMoviles}
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Estadísticas */}
        <div className="gm-stats-row">
          <div className="gm-stat-card">
            <span className="gm-stat-label">Total móviles</span>
            <span className="gm-stat-value">{todosLosMoviles.length}</span>
          </div>
          <div className="gm-stat-card critical">
            <span className="gm-stat-label">Críticos (12+ meses)</span>
            <span className="gm-stat-value">
              {todosLosMoviles.filter(m => m.mesesSinMantenimiento >= 12).length}
            </span>
          </div>
          <div className="gm-stat-card warning">
            <span className="gm-stat-label">Pendientes (6-12 meses)</span>
            <span className="gm-stat-value">
              {todosLosMoviles.filter(m => m.mesesSinMantenimiento >= 6 && m.mesesSinMantenimiento < 12).length}
            </span>
          </div>
          <div className="gm-stat-card success">
            <span className="gm-stat-label">Al día</span>
            <span className="gm-stat-value">
              {todosLosMoviles.filter(m => m.mesesSinMantenimiento < 6 && m.mesesSinMantenimiento !== 999).length}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Tabla de móviles */}
      <motion.div 
        className="gm-table-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {loading ? (
          <div className="gm-loading">
            <div className="gm-loading-spinner">🔄</div>
            <p>Cargando datos de mantenimiento...</p>
          </div>
        ) : error ? (
          <div className="gm-error">
            <p>❌ {error}</p>
            <button onClick={analizarMoviles} className="gm-btn-retry">
              Reintentar
            </button>
          </div>
        ) : movilesFiltrados.length === 0 ? (
          <div className="gm-no-results">
            <p>📭 No se encontraron móviles con los filtros seleccionados</p>
          </div>
        ) : (
          <table className="gm-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Móvil</th>
                <th>UNE</th>
                <th>Último Mantenimiento</th>
                <th>Tiempo Sin Mantenimiento</th>
                <th>Último Técnico</th>
                <th>Total Trabajos</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {movilesFiltrados.map((movil, index) => (
                <motion.tr
                  key={movil.movil || `movil-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  className={`gm-table-row ${movil.estadoMantenimiento.tipo}`}
                >
                  <td>
                    <span className="gm-estado-icon">
                      {movil.estadoMantenimiento.icono}
                    </span>
                  </td>
                  <td className="gm-movil-cell">
                    <strong>
                      {movil.movil && typeof movil.movil === 'string' && movil.movil.startsWith('BO-') 
                        ? movil.movil 
                        : `Z70-${movil.movil || 'SIN CÓDIGO'}`
                      }
                    </strong>
                  </td>
                  <td>{movil.une || 'SIN UNE'}</td>
                  <td>
                    {movil.ultimoMantenimientoClaraboya ? 
                      formatearFecha(movil.ultimoMantenimientoClaraboya) : 
                      'Nunca'
                    }
                  </td>
                  <td>
                    <span className={`gm-tiempo-badge ${movil.estadoMantenimiento.tipo}`}>
                      {movil.tiempoSinMantenimiento}
                    </span>
                  </td>
                  <td>{movil.ultimoTecnicoClaraboya || movil.ultimoTecnico || 'N/A'}</td>
                  <td className="gm-center">
                    <span className="gm-badge-count">{movil.totalTrabajos}</span>
                    {movil.trabajosConClaraboya > 0 && (
                      <span className="gm-badge-claraboya">{movil.trabajosConClaraboya} 🔧</span>
                    )}
                  </td>
                  <td>
                    <button 
                      className="gm-btn-details"
                      onClick={() => abrirModalDetalles(movil)}
                    >
                      Ver detalles
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Modal de detalles */}
      <AnimatePresence>
        {modalAbierto && movilSeleccionado && (
          <motion.div
            className="gm-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cerrarModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '50px',
              overflowY: 'auto'
            }}
          >
            {/* Modal */}
            <motion.div
              className="gm-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: 'calc(100vh - 100px)',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                margin: '0 auto'
              }}
            >
              <div 
                className="gm-modal-header"
                style={{
                  padding: '20px',
                  borderBottom: '1px solid #E0E0E0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'linear-gradient(135deg, #5DADE2, #3498DB)',
                  borderRadius: '12px 12px 0 0',
                  flexShrink: 0
                }}
              >
                <h2 style={{ margin: 0, fontSize: '20px', color: 'white' }}>
                  🚐 Móvil {movilSeleccionado.movil && typeof movilSeleccionado.movil === 'string' && movilSeleccionado.movil.startsWith('BO-') ? 
                    movilSeleccionado.movil : 
                    `Z70-${movilSeleccionado.movil || 'SIN CÓDIGO'}`}
                </h2>
                <button 
                  className="gm-modal-close" 
                  onClick={cerrarModal}
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease'
                  }}
                >✕</button>
              </div>
              
              <div 
                className="gm-modal-body"
                style={{
                  padding: '20px',
                  overflowY: 'auto',
                  flex: 1
                }}
              >
                {/* Resumen del móvil */}
                <div className="gm-modal-summary">
                  <div className="gm-summary-item">
                    <span className="label">UNE:</span>
                    <span className="value">{movilSeleccionado.une || 'SIN UNE'}</span>
                  </div>
                  <div className="gm-summary-item">
                    <span className="label">Estado:</span>
                    <span className={`value estado-${movilSeleccionado.estadoMantenimiento.tipo}`}>
                      {movilSeleccionado.estadoMantenimiento.icono} {movilSeleccionado.tiempoSinMantenimiento}
                    </span>
                  </div>
                  <div className="gm-summary-item">
                    <span className="label">Último mantenimiento:</span>
                    <span className="value">
                      {movilSeleccionado.ultimoMantenimientoClaraboya ? 
                        formatearFecha(movilSeleccionado.ultimoMantenimientoClaraboya) : 
                        'Nunca realizado'}
                    </span>
                  </div>
                  <div className="gm-summary-item">
                    <span className="label">Total trabajos:</span>
                    <span className="value">{movilSeleccionado.totalTrabajos}</span>
                  </div>
                  <div className="gm-summary-item">
                    <span className="label">Mantenimientos claraboya:</span>
                    <span className="value">{movilSeleccionado.trabajosConClaraboya}</span>
                  </div>
                </div>

                {/* Historial de trabajos */}
                <div className="gm-modal-historial">
                  <h3>📋 Historial de trabajos</h3>
                  
                  {loadingHistorial ? (
                    <div className="gm-loading-historial">
                      Cargando historial...
                    </div>
                  ) : (
                    <div className="gm-historial-list">
                      {historialMovil.map((trabajo, index) => {
                        const tieneClaraboya = trabajo.servicios.some(s => esMantenimientoClaraboya(s));
                        
                        return (
                          <div 
                            key={index} 
                            className={`gm-historial-item ${tieneClaraboya ? 'con-claraboya' : ''}`}
                          >
                            <div className="gm-historial-header">
                              <span className="gm-historial-remision">
                                #{trabajo.remision}
                              </span>
                              <span className="gm-historial-fecha">
                                {formatearFecha(trabajo.fecha)}
                              </span>
                              {tieneClaraboya && (
                                <span className="gm-badge-claraboya-small">
                                  🔧 Claraboya
                                </span>
                              )}
                            </div>
                            <div className="gm-historial-body">
                              <p className="gm-historial-tecnico">
                                👤 {trabajo.tecnico || 'N/A'}
                              </p>
                              <div className="gm-historial-servicios">
                                {trabajo.servicios.map((servicio, idx) => (
                                  <div 
                                    key={idx} 
                                    className={`gm-servicio ${esMantenimientoClaraboya(servicio) ? 'servicio-claraboya' : ''}`}
                                  >
                                    • {servicio}
                                  </div>
                                ))}
                              </div>
                              {trabajo.total && (
                                <p className="gm-historial-total">
                                  💰 ${parseFloat(trabajo.total).toLocaleString('es-CO')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              
              <div 
                className="gm-modal-footer"
                style={{
                  padding: '15px 20px',
                  borderTop: '1px solid #E0E0E0',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  flexShrink: 0
                }}
              >
                <button 
                  className="gm-btn-close" 
                  onClick={cerrarModal}
                  style={{
                    background: '#95A5A6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionMantenimientos;