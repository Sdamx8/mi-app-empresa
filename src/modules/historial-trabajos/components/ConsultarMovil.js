/**
 * 🚀 GLOBAL MOBILITY SOLUTIONS - CONSULTAR MÓVIL
 * ================================================
 * Componente básico para consultar remisiones por móvil
 * Muestra resultados en formato card con alertas de 6 meses
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../core/auth/AuthContext';
import { useRole } from '../../../core/auth/RoleContext';
import { useRemisiones } from '../hooks/useRemisiones';
import { ESTADOS_REMISION_PROCESO } from '../../../shared/constants';
import NavigationBar from '../../../shared/components/NavigationBar';
import './ConsultarMovil.css';

const ConsultarMovil = () => {
  // Hooks de autenticación y roles
  const { user } = useAuth();
  const { userRole } = useRole();

  // Estados locales
  const [busquedaMovil, setBusquedaMovil] = useState('');
  const [loading, setLoading] = useState(false);
  const [remisiones, setRemisiones] = useState([]);
  const [error, setError] = useState(null);

  // Estados para navegación
  const [navigationHistory, setNavigationHistory] = useState(['consultar-movil']);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0);

  // Hook para gestión de remisiones
  const { fetchRemisionesByMovil } = useRemisiones();

  // Función para buscar remisiones por móvil
  const buscarPorMovil = useCallback(async () => {
    if (!busquedaMovil.trim()) {
      setError('Por favor ingrese un número de móvil');
      return;
    }

    const input = busquedaMovil.trim();
    let valorBusqueda;

    // Verificar si es un móvil con prefijo BO-
    if (input.toUpperCase().startsWith('BO-')) {
      // Para móviles BO-, validar que el sufijo no esté vacío
      const suffix = input.substring(3).trim(); // Después de "BO-" o "bo-"
      if (!suffix) {
        setError('Por favor ingrese un móvil BO- completo (ej: BO-1234)');
        return;
      }
      const prefix = 'BO-';
      valorBusqueda = prefix + suffix;
    } else {
      // Para móviles numéricos, validar y convertir
      const numeroMovil = parseInt(input);
      if (isNaN(numeroMovil)) {
        setError('Por favor ingrese un número de móvil válido (ej: 7361) o un móvil BO- (ej: BO-1234)');
        return;
      }
      valorBusqueda = numeroMovil;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Pasar el valor procesado (número o string BO-)
      const resultados = await fetchRemisionesByMovil(valorBusqueda);
      setRemisiones(resultados || []);
      
      if (!resultados || resultados.length === 0) {
        setError(`No se encontraron trabajos para el móvil ${valorBusqueda}`);
      } else {
        console.log(`✅ Encontradas ${resultados.length} remisiones para móvil ${valorBusqueda}`);
      }
    } catch (err) {
      console.error('Error al buscar remisiones:', err);
      
      // Manejo específico de errores en componente ConsultarMovil
      let errorMessage = 'Error al buscar trabajos';
      
      if (err.message.includes('inválido')) {
        errorMessage = 'Por favor, ingrese un número de móvil válido (ej: 7361) o un móvil BO- (ej: BO-1234)';
      } else if (err.message.includes('configuración adicional') || err.message.includes('index')) {
        errorMessage = 'La búsqueda por móvil requiere configuración adicional. Contacte al administrador.';
      } else if (err.message.includes('permisos')) {
        errorMessage = 'No tiene permisos para realizar esta búsqueda';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setRemisiones([]);
    } finally {
      setLoading(false);
    }
  }, [busquedaMovil, fetchRemisionesByMovil]);

  // Función para manejar Enter en el input
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      buscarPorMovil();
    }
  }, [buscarPorMovil]);

  // Formatear fecha - maneja objetos Timestamp de Firestore correctamente
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
      
      // Usar la fecha tal como viene de Firestore sin ajustes de zona horaria
      const year = fechaObj.getFullYear();
      const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const day = String(fechaObj.getDate()).padStart(2, '0');
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error al formatear fecha:', error, fecha);
      // Proporcionar información más detallada sobre el error de fecha
      console.warn('FECHA PROBLEMATICA:', {
        fecha: fecha,
        tipo: typeof fecha,
        esObjeto: fecha instanceof Date,
        tieneSeconds: fecha && fecha.seconds
      });
      return 'Fecha inválida';
    }
  }, []);

  // Función para formatear número de móvil con prefijo
  const formatearMovil = useCallback((movil) => {
    if (!movil) return 'N/A';
    
    const movilStr = movil.toString();
    
    // Si ya tiene prefijo BO-, no agregar Z70-
    if (movilStr.startsWith('BO-')) {
      return movilStr;
    }
    
    // Agregar prefijo Z70- si no lo tiene
    return `Z70-${movilStr}`;
  }, []);

  // Función para verificar alerta de 6 meses
  const verificarAlerta6Meses = useCallback((fechaRemision) => {
    if (!fechaRemision) return { mostrarAlerta: false, tipo: 'sin-fecha' };
    
    try {
      let fechaObj;
      
      if (fechaRemision && typeof fechaRemision === 'object' && fechaRemision.seconds !== undefined) {
        fechaObj = new Date(fechaRemision.seconds * 1000);
      } else {
        fechaObj = new Date(fechaRemision);
      }
      
      if (isNaN(fechaObj.getTime())) {
        return { mostrarAlerta: false, tipo: 'fecha-invalida' };
      }
      
      const ahora = new Date();
      const diferenciaMeses = (ahora.getFullYear() - fechaObj.getFullYear()) * 12 + 
                             (ahora.getMonth() - fechaObj.getMonth());
      
      if (diferenciaMeses >= 6) {
        return { 
          mostrarAlerta: true, 
          tipo: 'mas-6-meses', 
          meses: diferenciaMeses,
          color: '#27AE60', // Verde para más de 6 meses
          mensaje: `✅ ${diferenciaMeses} meses sin trabajo`
        };
      } else {
        return { 
          mostrarAlerta: true, 
          tipo: 'menos-6-meses', 
          meses: diferenciaMeses,
          color: '#E74C3C', // Rojo para menos de 6 meses
          mensaje: `⚠️ Solo ${diferenciaMeses} meses sin trabajo`
        };
      }
    } catch (error) {
      console.error('Error al verificar alerta:', error);
      // Logging detallado para debugging de alertas
      console.warn('ERROR EN CALCULO DE ALERTA:', {
        fechaRemision: fechaRemision,
        tipoFecha: typeof fechaRemision,
        error: error.message
      });
      return { mostrarAlerta: false, tipo: 'error' };
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
    }
  }, [currentHistoryIndex]);

  const handleNavigateForward = useCallback(() => {
    if (currentHistoryIndex < navigationHistory.length - 1) {
      setCurrentHistoryIndex(prev => prev + 1);
    }
  }, [currentHistoryIndex, navigationHistory.length]);

  return (
    <div className="consultar-movil">
      {/* Barra de navegación */}
      <NavigationBar
        onBack={handleNavigateBack}
        onForward={handleNavigateForward}
        canGoBack={currentHistoryIndex > 0}
        canGoForward={currentHistoryIndex < navigationHistory.length - 1}
        currentPath="historial-trabajos/consultar-movil"
        title="Consultar Móvil"
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
          🔍 Consultar Móvil
        </h1>
        <div className="user-info">
          <span className="user-role-badge">{userRole?.toUpperCase()}</span>
          <span className="user-email">{user?.email}</span>
        </div>
      </motion.div>

      {/* Búsqueda */}
      <motion.div 
        className="search-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="search-container">
          <div className="search-group">
            <label>Número de Móvil</label>
            <div className="search-input-container">
              <input
                type="text"
                placeholder="Ej: 7399, 4133, BO-1234, etc."
                value={busquedaMovil}
                onChange={(e) => setBusquedaMovil(e.target.value)}
                onKeyPress={handleKeyPress}
                className="search-input"
              />
              <motion.button
                className="btn-search-movil"
                onClick={buscarPorMovil}
                disabled={loading || !busquedaMovil.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {loading ? '🔄' : '🔍'} Buscar
              </motion.button>
            </div>
          </div>
        </div>
        
        <div className="search-info">
          <p>💡 <strong>Instrucciones:</strong> Ingrese el número del móvil (ej: 7361) o móviles con prefijo BO- (ej: BO-1234). 
             Los resultados mostrarán el móvil tal como está guardado en la base de datos.</p>
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

        {loading && (
          <motion.div 
            className="loading-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            🔄 Buscando trabajos...
          </motion.div>
        )}

        {!loading && !error && remisiones.length === 0 && busquedaMovil && (
          <motion.div 
            className="no-results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            📭 No se encontraron trabajos para el móvil {formatearMovil(busquedaMovil)}
          </motion.div>
        )}

        {!loading && !error && remisiones.length > 0 && (
          <>
            <div className="results-header">
              <span className="results-count">
                📊 {remisiones.length} trabajo(s) encontrado(s) para el móvil {formatearMovil(busquedaMovil)}
              </span>
            </div>

            <div className="remisiones-cards-grid">
              {remisiones.map((remision, index) => {
                const estadoInfo = getEstadoInfo(remision.estado);
                const alertaInfo = verificarAlerta6Meses(remision.fecha_remision);
                
                return (
                  <motion.div
                    key={remision.id}
                    className="remision-card-busqueda"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
                  >
                    {/* Alerta de 6 meses */}
                    {alertaInfo.mostrarAlerta && (
                      <div 
                        className="alerta-6-meses"
                        style={{ backgroundColor: alertaInfo.color }}
                      >
                        {alertaInfo.mensaje}
                      </div>
                    )}

                    {/* Header del card */}
                    <div className="card-header">
                      <div className="remision-info">
                        <div className="remision-number">
                          <strong>#{remision.remision || 'N/A'}</strong>
                        </div>
                        <div className="movil-display">
                          🚐 {formatearMovil(remision.movil)}
                        </div>
                      </div>
                      <div 
                        className="estado-badge"
                        style={{ backgroundColor: estadoInfo.color }}
                        title={estadoInfo.description}
                      >
                        {estadoInfo.label}
                      </div>
                    </div>

                    {/* Contenido del card */}
                    <div className="card-content">
                      <div className="info-row">
                        <span className="label">📅 Fecha de Remisión:</span>
                        <span className="value fecha-destacada">
                          {formatearFecha(remision.fecha_remision)}
                        </span>
                      </div>
                      
                      <div className="info-row">
                        <span className="label">👤 Técnico:</span>
                        <span className="value">{remision.tecnico1 || remision.genero || 'No asignado'}</span>
                      </div>
                      
                      <div className="info-row">
                        <span className="label">📍 UNE:</span>
                        <span className="value une-destacada">{remision.une || 'N/A'}</span>
                      </div>
                      
                      <div className="info-row">
                        <span className="label">✅ Autorizó:</span>
                        <span className="value">{remision.autorizo || 'N/A'}</span>
                      </div>
                      
                      <div className="info-row servicios-row">
                        <span className="label">🔧 Servicios:</span>
                        <div className="servicios-list">
                          {[remision.servicio1, remision.servicio2, remision.servicio3, remision.servicio4, remision.servicio5]
                            .filter(Boolean)
                            .map((servicio, idx) => (
                              <div key={idx} className="servicio-item">
                                • {servicio}
                              </div>
                            ))
                          }
                          {![remision.servicio1, remision.servicio2, remision.servicio3, remision.servicio4, remision.servicio5]
                            .filter(Boolean).length && (
                            <div className="servicio-item">No hay servicios registrados</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer del card */}
                    <div className="card-footer">
                      <div className="total-info">
                        <span className="total-label">💰 Total:</span>
                        <span className="total-value">
                          {remision.total ? 
                            `$${parseFloat(remision.total).toLocaleString('es-CO')}` : 
                            'N/A'
                          }
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ConsultarMovil;
