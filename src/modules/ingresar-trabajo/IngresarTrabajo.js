// IngresarTrabajo.js - Módulo principal para ingresar trabajo realizado
import React, { useState, useCallback } from 'react';
import { useAuth } from '../../core/auth/AuthContext';
import LoginComponent from '../../shared/components/LoginComponent';
import FormularioRemisionCorregido from './components/FormularioRemision';
import { THEME_COLORS } from '../../shared/constants';
import { motion } from 'framer-motion';
import './components/IngresarTrabajo.css'; // CSS del manual de identidad
import { 
  obtenerOpcionesIntegracion, 
  generarPDFDirecto,
  validarRemisionParaInforme,
  redirigirAInformesTecnicos
} from '../../shared/services/integracionModulos';
import { remisionesService } from './services/remisionesService';
import { db } from '../../core/config/firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';

const IngresarTrabajo = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [recentRemisiones, setRecentRemisiones] = useState([]);
  const [opcionesIntegracion, setOpcionesIntegracion] = useState([]);
  const [ultimaRemisionGuardada, setUltimaRemisionGuardada] = useState(null);
  const [mostrandoOpciones, setMostrandoOpciones] = useState(false);
  const [editingRemision, setEditingRemision] = useState(null);

  // Estado para historial de remisiones (desde la BD)
  const [historialRemisiones, setHistorialRemisiones] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState(null);

  const openModal = useCallback(() => {
    setEditingRemision(null);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // Cargar historial de remisiones
  const cargarHistorialRemisiones = useCallback(async (limite = 20) => {
    try {
      setCargandoHistorial(true);
      setErrorHistorial(null);
      const remisiones = await remisionesService.obtenerRemisiones(limite);
      setHistorialRemisiones(remisiones);
    } catch (error) {
      console.error('❌ Error cargando historial de remisiones:', error);
      setErrorHistorial(error.message || 'Error al cargar el historial');
    } finally {
      setCargandoHistorial(false);
    }
  }, []);

  // Acciones de tabla: Editar / Eliminar
  const handleEditarRemision = useCallback((remision) => {
    setEditingRemision(remision);
    setShowModal(true);
  }, []);

  const handleEliminarRemision = useCallback(async (remision) => {
    try {
      if (!remision?.id) return;
      const ok = window.confirm(`¿Eliminar la remisión ${remision.remision || remision.id}? Esta acción no se puede deshacer.`);
      if (!ok) return;
      await deleteDoc(doc(db, 'remisiones', remision.id));
      setNotification({ type: 'success', message: `Remisión ${remision.remision || ''} eliminada.` });
      await cargarHistorialRemisiones(20);
    } catch (e) {
      console.error('Error eliminando remisión:', e);
      setNotification({ type: 'error', message: `Error eliminando: ${e.message}` });
    }
  }, [cargarHistorialRemisiones]);

  // Cargar historial al montar
  React.useEffect(() => {
    cargarHistorialRemisiones(20);
  }, [cargarHistorialRemisiones]);

  const handleSaveSuccess = useCallback(async (result) => {
    // Extraer número de remisión del mensaje o resultado
    const numeroRemision = result.numeroRemision || result.message?.match(/\\d+/)?.[0] || null;
    
    console.log('🎉 Remisión guardada exitosamente:', { result, numeroRemision });
    
    // CERRAR EL MODAL inmediatamente después de guardar exitosamente
    setShowModal(false);
    
    // Agregar a la lista de remisiones recientes
    const newRemision = {
      id: result.id,
      timestamp: new Date().toISOString(),
      message: result.message,
      numeroRemision: numeroRemision
    };
    
    setRecentRemisiones(prev => [newRemision, ...prev.slice(0, 4)]); // Mantener solo las últimas 5
    
    // Verificar si se solicitó redirección automática a Informes Técnicos
    if (result.redirectToReports && numeroRemision) {
      console.log('🚀 Redirección automática a Informes Técnicos solicitada');
      
      // Mostrar notificación de redirección
      setNotification({
        type: 'success',
        message: `📝 Remisión ${numeroRemision} guardada. Redirigiendo a Informes Técnicos...`,
        id: result.id,
        numeroRemision: numeroRemision
      });
      
      // Ejecutar redirección tras breve pausa
      setTimeout(async () => {
        try {
          await redirigirAInformesTecnicos(numeroRemision);
        } catch (error) {
          console.error('❌ Error en redirección:', error);
          // Mostrar las opciones de integración como fallback
          mostrarOpcionesIntegracion(numeroRemision);
        }
      }, 1500);
      
      return; // Salir temprano para evitar mostrar opciones normales
    }
    
    // Mostrar notificación de éxito normal
    setNotification({
      type: 'success',
      message: result.message,
      id: result.id,
      numeroRemision: numeroRemision
    });
    
    // Si tenemos número de remisión, preparar opciones de integración
    if (numeroRemision) {
      mostrarOpcionesIntegracion(numeroRemision);
    }

    // Ocultar notificación después de 8 segundos (más tiempo por las opciones)
    setTimeout(() => {
      setNotification(null);
      setMostrandoOpciones(false);
      setOpcionesIntegracion([]);
    }, 8000);
  }, []);

  // Función auxiliar para mostrar opciones de integración
  const mostrarOpcionesIntegracion = async (numeroRemision) => {
    setUltimaRemisionGuardada(numeroRemision);
    
    try {
      // Validar que la remisión es apta para generar informe
      const validacion = await validarRemisionParaInforme(numeroRemision);
      
      if (validacion.valida) {
        const opciones = obtenerOpcionesIntegracion(numeroRemision);
        setOpcionesIntegracion(opciones);
        setMostrandoOpciones(true);
        
        console.log('✅ Opciones de integración preparadas:', opciones);
      } else {
        console.warn('⚠️ Remisión no válida para informe:', validacion.error);
      }
    } catch (error) {
      console.error('❌ Error validando remisión para informe:', error);
    }
  };

  const dismissNotification = useCallback(() => {
    setNotification(null);
    setMostrandoOpciones(false);
    setOpcionesIntegracion([]);
  }, []);
  
  // Manejar acción de integración
  const handleOpcionIntegracion = useCallback(async (opcion) => {
    try {
      console.log(`🚀 Ejecutando opción: ${opcion.titulo}`);
      
      if (opcion.tipo === 'pdf') {
        // Mostrar loading en la notificación
        setNotification(prev => ({
          ...prev,
          generandoPDF: true
        }));
        
        // Ejecutar generación de PDF
        await opcion.accion();
        
        // Actualizar notificación de éxito
        setNotification(prev => ({
          ...prev,
          generandoPDF: false,
          pdfGenerado: true
        }));
      } else {
        // Para navegación, ejecutar directamente
        await opcion.accion();
      }
    } catch (error) {
      console.error('❌ Error ejecutando opción de integración:', error);
      
      setNotification(prev => ({
        ...prev,
        generandoPDF: false,
        error: `Error: ${error.message}`
      }));
    }
  }, []);
  
  // Generar PDF directamente
  const generarPDFDirectamente = useCallback(async (numeroRemision) => {
    try {
      await generarPDFDirecto(numeroRemision, {
        observaciones: 'Informe técnico generado automáticamente desde el registro de trabajo.',
        empleadoActual: user
      });
    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      alert(`Error generando PDF: ${error.message}`);
    }
  }, [user]);

  // Si no hay usuario autenticado, mostrar login
  if (!user) {
    return <LoginComponent />;
  }

  return (
    <motion.div 
      className="ingresar-trabajo"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.3 }}
    >
      {/* Header Section - Estructura según manual */}
      <div className="header-section">
        <div>
          <h1 className="page-title">Ingresar Trabajo Realizado</h1> {/* Nombre estándar según manual */}
          <p style={{ color: '#95A5A6', fontSize: '14px', margin: '8px 0 0 0', lineHeight: 1.5 }}>
            Registre los trabajos y servicios realizados en las unidades móviles
          </p>
        </div>
        <motion.button 
          onClick={openModal} 
          className="nueva-remision-button"
          whileHover={{ scale: 1.05 }} // Escala suave según manual
          whileTap={{ scale: 0.98 }}
        >
          <span>📝</span> Nueva Remisión
        </motion.button>
      </div>

      {/* Notificación con opciones de integración */}
      {notification && (
        <NotificationConIntegracion
          type={notification.type}
          message={notification.message}
          id={notification.id}
          numeroRemision={notification.numeroRemision}
          opcionesIntegracion={opcionesIntegracion}
          mostrandoOpciones={mostrandoOpciones}
          onDismiss={dismissNotification}
          onOpcionSeleccionada={handleOpcionIntegracion}
          generandoPDF={notification.generandoPDF}
          pdfGenerado={notification.pdfGenerado}
          error={notification.error}
        />
      )}

      {/* Contenido principal */}
      <div style={contentStyle}>
        {/* Estadísticas rápidas - Dashboard Cards según manual */}
        <div className="dashboard-cards">
          <StatCard
            icon="📝"
            title="Remisiones Hoy"
            value="8"
            subtitle="3 pendientes"
            color="#5DADE2"
          />
          <StatCard
            icon="✅"
            title="Completadas"
            value="15"
            subtitle="Esta semana"
            color="#27AE60"
          />
          <StatCard
            icon="🔄"
            title="En Proceso"
            value="5"
            subtitle="Requieren atención"
            color="#F1C40F"
          />
          <StatCard
            icon="💰"
            title="Total Facturado"
            value="$2.4M"
            subtitle="Este mes"
            color="#3498DB"
          />
        </div>

        {/* Acciones rápidas según manual */}
        <div className="actions-section">
          <h3 className="section-title">⚡ Acciones Rápidas</h3>
          <div className="actions-grid">
            <motion.div 
              className="action-card highlighted"
              onClick={openModal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="action-icon">📝</span>
              <div className="action-title">Nueva Remisión</div>
              <div className="action-description">Crear una nueva remisión de trabajo</div>
            </motion.div>
            <motion.div 
              className="action-card"
              onClick={() => window.location.hash = '#historial'}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="action-icon">🔍</span>
              <div className="action-title">Buscar Remisiones</div>
              <div className="action-description">Consultar historial de trabajos</div>
            </motion.div>
            <motion.div 
              className="action-card"
              onClick={() => alert('Función próximamente disponible')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="action-icon">📊</span>
              <div className="action-title">Generar Reporte</div>
              <div className="action-description">Exportar datos para análisis</div>
            </motion.div>
            <motion.div 
              className="action-card"
              onClick={() => alert('Función próximamente disponible')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="action-icon">⚙️</span>
              <div className="action-title">Configuración</div>
              <div className="action-description">Ajustar parámetros del sistema</div>
            </motion.div>
          </div>
        </div>

        {/* Historial de últimas remisiones según manual */}
        <div className="historial-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 className="section-title">📚 Historial de últimas remisiones</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#95A5A6', fontSize: '14px' }}>
                {cargandoHistorial ? 'Cargando…' : `Mostrando ${historialRemisiones.length} remisiones`}
              </span>
              <motion.button
                onClick={() => cargarHistorialRemisiones(20)}
                className="nueva-remision-button"
                style={{ padding: '8px 16px', fontSize: '12px', minHeight: '32px' }}
                disabled={cargandoHistorial}
                title="Refrescar historial"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                🔄 Refrescar
              </motion.button>
            </div>
          </div>

          {errorHistorial && (
            <div className="error-message">
              ❌ {errorHistorial}
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="historial-table">
              <thead>
                <tr>
                  <th>Remisión</th>
                  <th>Móvil</th>
                  <th>Técnico</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargandoHistorial ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="loading-message">
                        <span>🔄</span> Cargando historial…
                      </div>
                    </td>
                  </tr>
                ) : (
                  historialRemisiones.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="empty-state">
                          <span className="empty-state-icon">📋</span>
                          <div>No hay remisiones registradas aún.</div>
                          <small>Haz clic en "Nueva Remisión" para comenzar.</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    historialRemisiones.map((r, index) => (
                      <motion.tr 
                        key={r.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                      >
                        <td><strong>{r.remision || '—'}</strong></td>
                        <td>{r.movil || '—'}</td>
                        <td>{r.tecnico1 || r.autorizo || '—'}</td>
                        <td>{formatearFechaBasica(r.fecha_remision)}</td>
                        <td style={{ textAlign: 'right' }}><strong style={{ color: '#27AE60' }}>{formatearMoneda(r.total)}</strong></td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <motion.button
                              className="btn-action"
                              onClick={() => redirigirAInformesTecnicos(r.remision)}
                              title="Crear/Completar Informe Técnico"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              📝
                            </motion.button>
                            <motion.button
                              className="btn-action btn-edit"
                              onClick={() => handleEditarRemision(r)}
                              title="Editar remisión"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              ✏️
                            </motion.button>
                            <motion.button
                              className="btn-action btn-delete"
                              onClick={() => handleEliminarRemision(r)}
                              title="Eliminar remisión"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              🗑️
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remisiones recientes (esta sesión) */}
        {recentRemisiones.length > 0 && (
          <div style={recentContainerStyle}>
            <h3 style={sectionTitleStyle}>📋 Remisiones Creadas Recientemente</h3>
            <div style={recentListStyle}>
              {recentRemisiones.map((remision, index) => (
                <div key={remision.id} style={recentItemStyle}>
                  <div style={recentIconStyle}>✅</div>
                  <div style={recentContentStyle}>
                    <div style={recentMessageStyle}>{remision.message}</div>
                    <div style={recentTimeStyle}>
                      ID: {remision.id.substring(0, 8)}... • {new Date(remision.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal del formulario */}
      <FormularioRemisionCorregido
        isOpen={showModal}
        onClose={closeModal}
        onSave={handleSaveSuccess}
        initialData={editingRemision}
      />
    </motion.div>
  );
};

// Componente de notificación con integración
const NotificationConIntegracion = ({ 
  type, 
  message, 
  id, 
  numeroRemision,
  opcionesIntegracion = [],
  mostrandoOpciones = false,
  onDismiss, 
  onOpcionSeleccionada,
  generandoPDF = false,
  pdfGenerado = false,
  error = null
}) => {
  return (
    <div style={{
      ...notificationStyleIntegrado,
      backgroundColor: type === 'success' ? THEME_COLORS.success : THEME_COLORS.danger,
      minHeight: mostrandoOpciones && opcionesIntegracion.length > 0 ? '200px' : 'auto'
    }}>
      <div style={notificationContentStyleIntegrado}>
        {/* Header de la notificación */}
        <div style={notificationHeaderStyle}>
          <span style={notificationIconStyle}>
            {type === 'success' ? '✅' : '❌'}
          </span>
          <div style={{ flex: 1 }}>
            <div style={notificationMessageStyle}>{message}</div>
            {id && (
              <div style={notificationIdStyle}>
                ID: {id.substring(0, 12)}...
              </div>
            )}
            {numeroRemision && (
              <div style={notificationRemisionStyle}>
                Remisión: {numeroRemision}
              </div>
            )}
          </div>
          <button onClick={onDismiss} style={notificationCloseStyle}>
            ✕
          </button>
        </div>
        
        {/* Estados especiales */}
        {generandoPDF && (
          <div style={loadingContainerStyle}>
            <div style={spinnerStyle}></div>
            <span style={loadingTextStyle}>Generando PDF...</span>
          </div>
        )}
        
        {pdfGenerado && (
          <div style={successContainerStyle}>
            🎉 ¡PDF generado exitosamente!
          </div>
        )}
        
        {error && (
          <div style={errorContainerStyle}>
            ❌ {error}
          </div>
        )}
        
        {/* Opciones de integración */}
        {mostrandoOpciones && opcionesIntegracion.length > 0 && !generandoPDF && (
          <div style={opcionesContainerStyle}>
            <div style={opcionesTitleStyle}>
              🚀 ¿Qué quieres hacer ahora?
            </div>
            <div style={opcionesListStyle}>
              {opcionesIntegracion.map((opcion) => (
                <button
                  key={opcion.id}
                  onClick={() => onOpcionSeleccionada(opcion)}
                  style={opcionButtonStyle}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <div style={opcionIconStyle}>{opcion.icono}</div>
                  <div>
                    <div style={opcionTitleStyle}>{opcion.titulo}</div>
                    <div style={opcionDescStyle}>{opcion.descripcion}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de tarjeta estadística según manual
const StatCard = ({ icon, title, value, subtitle, color }) => (
  <motion.div 
    className="dashboard-card"
    whileHover={{ scale: 1.02 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <div className="card-header">
      <div className="card-icon" style={{ background: `linear-gradient(135deg, ${color}, #3498DB)` }}>
        {icon}
      </div>
      <div className="card-title">{title}</div>
    </div>
    <div className="card-value" style={{ color }}>{value}</div>
    <div className="card-subtitle">{subtitle}</div>
  </motion.div>
);

// Componente de tarjeta de acción
const ActionCard = ({ icon, title, description, onClick, primary = false }) => (
  <div
    style={{
      ...actionCardStyle,
      borderColor: primary ? THEME_COLORS.primary : '#e9ecef'
    }}
    onClick={onClick}
  >
    <div style={actionIconStyle}>{icon}</div>
    <div style={actionTitleStyle}>{title}</div>
    <div style={actionDescriptionStyle}>{description}</div>
  </div>
);

// Utilidades locales
const formatearFechaBasica = (fecha) => {
  if (!fecha) return '—';
  try {
    let d = null;
    if (typeof fecha === 'string') {
      d = new Date(fecha);
    } else if (fecha?.toDate && typeof fecha.toDate === 'function') {
      d = fecha.toDate();
    } else if (fecha instanceof Date) {
      d = fecha;
    }
    if (!d || isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-CO');
  } catch {
    return '—';
  }
};

const formatearMoneda = (valor) => {
  const n = Number(valor);
  if (isNaN(n)) return '—';
  try {
    return n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  } catch {
    return `$${n.toLocaleString('es-CO')}`;
  }
};

// Estilos del componente
const containerStyle = {
  padding: '20px',
  maxWidth: '1200px',
  margin: '0 auto',
  minHeight: '100vh',
  backgroundColor: '#f8f9fa'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '30px',
  padding: '20px',
  backgroundColor: 'white',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const titleStyle = {
  margin: 0,
  color: THEME_COLORS.dark,
  fontSize: '2rem',
  fontWeight: '700'
};

const subtitleStyle = {
  margin: '8px 0 0 0',
  color: '#6c757d',
  fontSize: '1.1rem'
};

const primaryButtonStyle = {
  backgroundColor: THEME_COLORS.primary,
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 0.2s',
  boxShadow: '0 2px 8px rgba(0,123,255,0.3)'
};

const contentStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px'
};

const statsContainerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px'
};

const statCardStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px'
};

const statIconStyle = {
  fontSize: '2rem'
};

const statContentStyle = {
  flex: 1
};

const statTitleStyle = {
  fontSize: '14px',
  color: '#6c757d',
  marginBottom: '4px'
};

const statValueStyle = {
  fontSize: '1.8rem',
  fontWeight: '700',
  marginBottom: '4px'
};

const statSubtitleStyle = {
  fontSize: '12px',
  color: '#6c757d'
};

const actionsContainerStyle = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const sectionTitleStyle = {
  margin: '0 0 20px 0',
  color: THEME_COLORS.dark,
  fontSize: '1.3rem',
  fontWeight: '600'
};

const actionsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px'
};

const actionCardStyle = {
  padding: '20px',
  border: '2px solid #e9ecef',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  textAlign: 'center',
  backgroundColor: 'white'
};

const actionIconStyle = {
  fontSize: '2rem',
  marginBottom: '12px'
};

const actionTitleStyle = {
  fontSize: '16px',
  fontWeight: '600',
  color: THEME_COLORS.dark,
  marginBottom: '8px'
};

const actionDescriptionStyle = {
  fontSize: '14px',
  color: '#6c757d'
};

// Contenedor del historial
const historialContainerStyle = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const historialHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '12px'
};

const historialActionsStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const historialMetaStyle = {
  fontSize: '12px',
  color: '#6c757d'
};

const tableWrapperStyle = {
  overflowX: 'auto'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const thStyle = {
  textAlign: 'left',
  padding: '12px',
  fontSize: '12px',
  letterSpacing: '0.02em',
  color: '#6c757d',
  borderBottom: '1px solid #e9ecef',
  whiteSpace: 'nowrap'
};

const trStyle = {
  backgroundColor: 'white'
};

const tdStyle = {
  padding: '12px',
  borderBottom: '1px solid #f1f3f5',
  fontSize: '13px',
  color: THEME_COLORS.dark,
  verticalAlign: 'top'
};

const secondaryButtonStyle = {
  backgroundColor: '#e9ecef',
  color: THEME_COLORS.dark,
  border: 'none',
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer'
};

const smallPrimaryButtonStyle = {
  backgroundColor: THEME_COLORS.primary,
  color: 'white',
  border: 'none',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,123,255,0.25)'
};

const smallSecondaryButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer'
};

const smallDangerButtonStyle = {
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: '600',
  cursor: 'pointer'
};

const errorBannerStyle = {
  backgroundColor: '#fff5f5',
  border: '1px solid #ffe3e3',
  color: '#c92a2a',
  padding: '10px 12px',
  borderRadius: '8px',
  marginBottom: '12px',
  fontSize: '13px'
};

const recentContainerStyle = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
};

const recentListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const recentItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px'
};

const recentIconStyle = {
  fontSize: '1.2rem'
};

const recentContentStyle = {
  flex: 1
};

const recentMessageStyle = {
  fontSize: '14px',
  color: THEME_COLORS.dark,
  fontWeight: '500'
};

const recentTimeStyle = {
  fontSize: '12px',
  color: '#6c757d',
  marginTop: '2px'
};

const notificationStyle = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  color: 'white',
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  zIndex: 1001,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: '400px',
  animation: 'slideInRight 0.3s ease-out'
};

const notificationContentStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const notificationIconStyle = {
  fontSize: '1.2rem'
};

const notificationMessageStyle = {
  fontWeight: '500',
  fontSize: '14px'
};

const notificationIdStyle = {
  fontSize: '12px',
  opacity: 0.9,
  marginTop: '2px'
};

const notificationCloseStyle = {
  background: 'none',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  fontSize: '16px',
  marginLeft: '12px'
};

// Estilos para notificación integrada
const notificationStyleIntegrado = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  color: 'white',
  padding: '16px',
  borderRadius: '12px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
  zIndex: 1001,
  maxWidth: '450px',
  minWidth: '350px',
  animation: 'slideInRight 0.3s ease-out'
};

const notificationContentStyleIntegrado = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
};

const notificationHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
};

const notificationRemisionStyle = {
  fontSize: '12px',
  opacity: 0.9,
  marginTop: '2px',
  fontWeight: '600'
};

const loadingContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 0',
  borderTop: '1px solid rgba(255, 255, 255, 0.2)'
};

const spinnerStyle = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  borderTop: '2px solid white',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
};

const loadingTextStyle = {
  fontSize: '13px',
  fontWeight: '500'
};

const successContainerStyle = {
  padding: '8px 0',
  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
  fontSize: '13px',
  fontWeight: '500'
};

const errorContainerStyle = {
  padding: '8px 0',
  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
  fontSize: '13px',
  fontWeight: '500',
  color: '#ffebee'
};

const opcionesContainerStyle = {
  marginTop: '12px',
  borderTop: '1px solid rgba(255, 255, 255, 0.2)',
  paddingTop: '12px'
};

const opcionesTitleStyle = {
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '8px',
  opacity: 0.9
};

const opcionesListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const opcionButtonStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '6px',
  color: 'white',
  padding: '10px 12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '12px',
  textAlign: 'left'
};

const opcionIconStyle = {
  fontSize: '16px',
  minWidth: '20px'
};

const opcionTitleStyle = {
  fontWeight: '600',
  fontSize: '12px',
  marginBottom: '2px'
};

const opcionDescStyle = {
  fontSize: '11px',
  opacity: 0.8,
  lineHeight: '1.2'
};

// Agregar animaciones CSS para la notificación
if (!document.getElementById('ingresarTrabajo-styles')) {
  const notificationStyleSheet = document.createElement('style');
  notificationStyleSheet.id = 'ingresarTrabajo-styles';
  notificationStyleSheet.textContent = `
    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
    
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;
  document.head.appendChild(notificationStyleSheet);
}

export default IngresarTrabajo;
