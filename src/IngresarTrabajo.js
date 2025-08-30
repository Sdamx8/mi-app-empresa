// IngresarTrabajo.js - Módulo principal para ingresar trabajo realizado
import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import LoginComponent from './LoginComponent';
import FormularioRemision from './components/FormularioRemision';
import { THEME_COLORS } from './constants';
import { 
  obtenerOpcionesIntegracion, 
  generarPDFDirecto,
  validarRemisionParaInforme,
  redirigirAInformesTecnicos
} from './services/integracionModulos';
import { remisionesService } from './services/remisionesService';
import { db } from './firebaseConfig';
import { doc, deleteDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

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
  
  // Estado para métricas del dashboard
  const [metricas, setMetricas] = useState({
    totalRemisiones: 0,
    remisionesHoy: 0,
    totalMonto: 0,
    promedioDiario: 0
  });
  const [cargandoMetricas, setCargandoMetricas] = useState(false);

  // Estado para filtros y paginación
  const [filtros, setFiltros] = useState({
    busqueda: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: 'todos'
  });
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    porPagina: 10,
    total: 0
  });

  const openModal = useCallback(() => {
    setEditingRemision(null);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // Cargar historial de remisiones con filtros y paginación
  const cargarHistorialRemisiones = useCallback(async (resetPagina = false) => {
    try {
      setCargandoHistorial(true);
      setErrorHistorial(null);
      
      if (resetPagina) {
        setPaginacion(prev => ({ ...prev, pagina: 1 }));
      }
      
      // Construir query base
      const remisionesRef = collection(db, 'remisiones');
      let q = query(
        remisionesRef,
        orderBy('created_at', 'desc'),
        limit(paginacion.porPagina * paginacion.pagina)
      );
      
      const snapshot = await getDocs(q);
      const remisiones = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        remisiones.push({
          id: doc.id,
          ...data,
          // Normalizar fechas para visualización (preferir timestamp, fallback a string)
          fecha_remision: normalizarFecha(data.fecha_remision_ts || data.fecha_remision),
          created_at: data.created_at?.toDate?.() || data.created_at
        });
      });
      
      // Aplicar filtros del lado del cliente (para filtros simples)
      let remisionesFiltradas = remisiones;
      
      if (filtros.busqueda) {
        const busqueda = filtros.busqueda.toLowerCase();
        remisionesFiltradas = remisiones.filter(r => 
          r.remision?.toLowerCase().includes(busqueda) ||
          r.movil?.toLowerCase().includes(busqueda) ||
          r.tecnico?.toLowerCase().includes(busqueda) ||
          r.descripcion?.toLowerCase().includes(busqueda)
        );
      }
      
      if (filtros.estado !== 'todos') {
        remisionesFiltradas = remisionesFiltradas.filter(r => r.estado === filtros.estado);
      }
      
      setHistorialRemisiones(remisionesFiltradas);
      setPaginacion(prev => ({ ...prev, total: snapshot.size }));
      
    } catch (error) {
      console.error('❌ Error cargando historial de remisiones:', error);
      setErrorHistorial(error.message || 'Error al cargar el historial');
    } finally {
      setCargandoHistorial(false);
    }
  }, [filtros, paginacion.porPagina, paginacion.pagina]);

  // Cargar métricas del dashboard
  const cargarMetricas = useCallback(async () => {
    try {
      setCargandoMetricas(true);
      
      // Obtener remisiones de los últimos 30 días para cálculos
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - 30);
      
      const remisionesRef = collection(db, 'remisiones');
      const q = query(
        remisionesRef,
        orderBy('created_at', 'desc'),
        limit(100) // Obtener muestra representativa
      );
      
      const snapshot = await getDocs(q);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      let totalRemisiones = 0;
      let remisionesHoy = 0;
      let totalMonto = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        totalRemisiones++;
        
        const fechaCreacion = data.created_at?.toDate?.() || new Date();
        if (fechaCreacion >= hoy) {
          remisionesHoy++;
        }
        
        if (data.total && !isNaN(parseFloat(data.total))) {
          totalMonto += parseFloat(data.total);
        }
      });
      
      const promedioDiario = totalRemisiones > 0 ? totalMonto / Math.max(1, totalRemisiones) : 0;
      
      setMetricas({
        totalRemisiones,
        remisionesHoy,
        totalMonto,
        promedioDiario
      });
      
    } catch (error) {
      console.error('❌ Error cargando métricas:', error);
    } finally {
      setCargandoMetricas(false);
    }
  }, []);

  // Estado para modal de vista previa
  const [modalVistaPrevia, setModalVistaPrevia] = useState(null);

  // Acciones de tabla: Ver, Editar, Eliminar
  const handleVerRemision = useCallback((remision) => {
    setModalVistaPrevia(remision);
  }, []);

  const handleEditarRemision = useCallback((remision) => {
    setEditingRemision(remision);
    setShowModal(true);
  }, []);

  const handleEliminarRemision = useCallback(async (remision) => {
    try {
      if (!remision?.id) return;
      const ok = window.confirm(`¿Eliminar la remisión ${remision.remision || remision.id}?\n\nEsta acción no se puede deshacer.`);
      if (!ok) return;
      
      await deleteDoc(doc(db, 'remisiones', remision.id));
      setNotification({ 
        type: 'success', 
        message: `Remisión ${remision.remision || ''} eliminada exitosamente.` 
      });
      
    // Recargar historial y métricas después de guardar
    await cargarHistorialRemisiones(true);
    await cargarMetricas();      // Auto-ocultar notificación
      setTimeout(() => setNotification(null), 3000);
      
    } catch (e) {
      console.error('Error eliminando remisión:', e);
      setNotification({ 
        type: 'error', 
        message: `Error eliminando remisión: ${e.message}` 
      });
      setTimeout(() => setNotification(null), 5000);
    }
  }, [cargarHistorialRemisiones, cargarMetricas]);

  // Cargar historial y métricas al montar
  useEffect(() => {
    cargarHistorialRemisiones(true);
    cargarMetricas();
  }, []);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      cargarHistorialRemisiones(true);
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [filtros]);

  // Función para actualizar filtros
  const actualizarFiltro = useCallback((campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  const handleSaveSuccess = useCallback(async (result) => {
    // Extraer número de remisión del mensaje o resultado
    const numeroRemision = result.numeroRemision || result.message?.match(/\d+/)?.[0] || null;
    
    console.log('🎉 Remisión guardada exitosamente:', { result, numeroRemision });
    
    // CERRAR EL MODAL inmediatamente después de guardar exitosamente
    setShowModal(false);
    setEditingRemision(null);
    
    // Agregar a la lista de remisiones recientes
    const newRemision = {
      id: result.id,
      timestamp: new Date().toISOString(),
      message: result.message,
      numeroRemision: numeroRemision
    };
    
    setRecentRemisiones(prev => [newRemision, ...prev.slice(0, 4)]); // Mantener solo las últimas 5
    
    // Recargar datos actualizados
    await cargarHistorialRemisiones(true);
    await cargarMetricas();
    
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
  }, [cargarHistorialRemisiones, cargarMetricas]);

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
    <div style={containerStyle}>
      {/* Header del módulo */}
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>
            🔧 Ingresar Trabajo Realizado
          </h1>
          <p style={subtitleStyle}>
            Registre los trabajos y servicios realizados en las unidades móviles
          </p>
        </div>
        <button onClick={openModal} style={primaryButtonStyle}>
          ➕ Nueva Remisión
        </button>
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
        {/* Estadísticas rápidas */}
        <div style={statsContainerStyle}>
          <StatCard
            icon="📝"
            title="Remisiones Hoy"
            value={cargandoMetricas ? "..." : metricas.remisionesHoy.toString()}
            subtitle={`${metricas.totalRemisiones} en total`}
            color={THEME_COLORS.primary}
          />
          <StatCard
            icon="💰"
            title="Monto Total"
            value={cargandoMetricas ? "..." : formatearMoneda(metricas.totalMonto)}
            subtitle="Remisiones registradas"
            color={THEME_COLORS.success}
          />
          <StatCard
            icon="�"
            title="Promedio"
            value={cargandoMetricas ? "..." : formatearMoneda(metricas.promedioDiario)}
            subtitle="Por remisión"
            color={THEME_COLORS.info}
          />
          <StatCard
            icon="📋"
            title="En Sistema"
            value={cargandoMetricas ? "..." : historialRemisiones.length.toString()}
            subtitle="Remisiones cargadas"
            color={THEME_COLORS.secondary}
          />
        </div>

        {/* Acciones rápidas */}
        <div style={actionsContainerStyle}>
          <h3 style={sectionTitleStyle}>⚡ Acciones Rápidas</h3>
          <div style={actionsGridStyle}>
            <ActionCard
              icon="📝"
              title="Nueva Remisión"
              description="Crear una nueva remisión de trabajo"
              onClick={openModal}
              primary={true}
            />
            <ActionCard
              icon="🔍"
              title="Buscar Remisiones"
              description="Consultar historial de trabajos"
              onClick={() => window.location.hash = '#historial'}
            />
            <ActionCard
              icon="📊"
              title="Generar Reporte"
              description="Exportar datos para análisis"
              onClick={() => alert('Función próximamente disponible')}
            />
            <ActionCard
              icon="⚙️"
              title="Configuración"
              description="Ajustar parámetros del sistema"
              onClick={() => alert('Función próximamente disponible')}
            />
          </div>
        </div>

        {/* Historial de últimas remisiones ingresadas */}
        <div style={historialContainerStyle}>
          <div style={historialHeaderStyle}>
            <h3 style={sectionTitleStyle}>📚 Historial de últimas remisiones</h3>
            <div style={historialActionsStyle}>
              <span style={historialMetaStyle}>
                {cargandoHistorial ? 'Cargando…' : `Mostrando ${historialRemisiones.length} remisiones`}
              </span>
              <button
                onClick={() => cargarHistorialRemisiones(20)}
                style={secondaryButtonStyle}
                disabled={cargandoHistorial}
                title="Refrescar historial"
              >
                🔄 Refrescar
              </button>
            </div>
          </div>

          {errorHistorial && (
            <div style={errorBannerStyle}>
              ❌ {errorHistorial}
            </div>
          )}

          {/* Controles de filtro */}
          <div style={filtrosContainerStyle}>
            <div style={filtrosRowStyle}>
              <input
                type="text"
                placeholder="Buscar por remisión, móvil, técnico..."
                value={filtros.busqueda}
                onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
                style={filtroInputStyle}
              />
              <select
                value={filtros.estado}
                onChange={(e) => actualizarFiltro('estado', e.target.value)}
                style={filtroSelectStyle}
              >
                <option value="todos">Todos los estados</option>
                <option value="CANCELADO">CANCELADO</option>
                <option value="CORTECIA">CORTECIA</option>
                <option value="GARANTIA">GARANTIA</option>
                <option value="GENERADO">GENERADO</option>
                <option value="PENDIENTE">PENDIENTE</option>
                <option value="PROFORMA">PROFORMA</option>
                <option value="RADICADO">RADICADO</option>
                <option value="SIN VINCULAR">SIN VINCULAR</option>
              </select>
              <input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => actualizarFiltro('fechaDesde', e.target.value)}
                style={filtroDateStyle}
                title="Fecha desde"
              />
              <input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => actualizarFiltro('fechaHasta', e.target.value)}
                style={filtroDateStyle}
                title="Fecha hasta"
              />
              <button
                onClick={() => setFiltros({ busqueda: '', fechaDesde: '', fechaHasta: '', estado: 'todos' })}
                style={limpiarFiltrosButtonStyle}
                title="Limpiar filtros"
              >
                🗑️ Limpiar
              </button>
            </div>
          </div>

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Remisión</th>
                  <th style={thStyle}>Móvil</th>
                  <th style={thStyle}>Técnico</th>
                  <th style={thStyle}>Fecha</th>
                  <th style={{...thStyle, textAlign:'right'}}>Total</th>
                  <th style={{...thStyle, textAlign:'center'}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargandoHistorial ? (
                  <tr>
                    <td style={tdStyle} colSpan={6}>Cargando historial…</td>
                  </tr>
                ) : (
                  historialRemisiones.length === 0 ? (
                    <tr>
                      <td style={tdStyle} colSpan={6}>No hay remisiones registradas aún.</td>
                    </tr>
                  ) : (
                    historialRemisiones.map((r) => (
                      <tr key={r.id} style={trStyle}>
                        <td style={tdStyle}><strong>{r.remision || '—'}</strong></td>
                        <td style={tdStyle}>{r.movil || '—'}</td>
                        <td style={tdStyle}>{formatearTecnicos(r.tecnico) || r.autorizo || '—'}</td>
                        <td style={tdStyle}>{formatearFechaBasica(r.fecha_remision)}</td>
                        <td style={{...tdStyle, textAlign:'right'}}>{formatearMoneda(r.total)}</td>
                        <td style={{...tdStyle, textAlign:'center'}}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                              style={smallInfoButtonStyle}
                              onClick={() => handleVerRemision(r)}
                              title="Ver detalles"
                            >
                              👁️ Ver
                            </button>
                            <button
                              style={smallPrimaryButtonStyle}
                              onClick={() => redirigirAInformesTecnicos(r.remision)}
                              title="Crear/Completar Informe Técnico"
                            >
                              📝 Informe
                            </button>
                            <button
                              style={smallSecondaryButtonStyle}
                              onClick={() => handleEditarRemision(r)}
                              title="Editar remisión"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              style={smallDangerButtonStyle}
                              onClick={() => handleEliminarRemision(r)}
                              title="Eliminar remisión"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
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
      <FormularioRemision
        isOpen={showModal}
        onClose={closeModal}
        onSave={handleSaveSuccess}
        initialData={editingRemision}
      />

      {/* Modal de vista previa */}
      {modalVistaPrevia && (
        <ModalVistaPrevia
          remision={modalVistaPrevia}
          onClose={() => setModalVistaPrevia(null)}
        />
      )}
    </div>
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

// Componente de tarjeta estadística
const StatCard = ({ icon, title, value, subtitle, color }) => (
  <div style={statCardStyle}>
    <div style={statIconStyle}>{icon}</div>
    <div style={statContentStyle}>
      <div style={statTitleStyle}>{title}</div>
      <div style={{ ...statValueStyle, color }}>{value}</div>
      <div style={statSubtitleStyle}>{subtitle}</div>
    </div>
  </div>
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
// Función para formatear técnicos (puede ser array o string)
const formatearTecnicos = (tecnicos) => {
  if (!tecnicos) return null;
  
  // Si es un array, unir con comas
  if (Array.isArray(tecnicos)) {
    return tecnicos.length > 0 ? tecnicos.join(', ') : null;
  }
  
  // Si es string, devolverlo directamente
  if (typeof tecnicos === 'string') {
    return tecnicos.trim() || null;
  }
  
  return null;
};

// Función para normalizar fechas desde diferentes formatos
const normalizarFecha = (fecha) => {
  if (!fecha) return null;
  
  try {
    // Si es un timestamp de Firestore
    if (fecha?.toDate && typeof fecha.toDate === 'function') {
      return fecha.toDate();
    }
    
    // Si ya es una instancia de Date
    if (fecha instanceof Date) {
      return fecha;
    }
    
    // Si es string en formato DD/MM/YYYY
    if (typeof fecha === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(fecha)) {
      const [dia, mes, año] = fecha.split('/');
      return new Date(año, mes - 1, dia); // mes - 1 porque Date usa índice 0 para enero
    }
    
    // Si es string en formato YYYY-MM-DD
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return new Date(fecha);
    }
    
    // Intentar conversión directa
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) {
      return d;
    }
    
    return null;
  } catch (error) {
    console.warn('Error normalizando fecha:', fecha, error);
    return null;
  }
};

const formatearFechaBasica = (fecha) => {
  if (!fecha) return '—';
  try {
    const d = normalizarFecha(fecha);
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

// Componente Modal de Vista Previa
const ModalVistaPrevia = ({ remision, onClose }) => {
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div style={vistaPreviewModalStyle}>
        {/* Header */}
        <div style={vistaPreviewHeaderStyle}>
          <h3 style={vistaPreviewTitleStyle}>
            📄 Vista Previa - Remisión {remision.remision}
          </h3>
          <button onClick={onClose} style={closeButtonStyle}>
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div style={vistaPreviewContentStyle}>
          <div style={vistaPreviewGridStyle}>
            <div style={vistaPreviewFieldStyle}>
              <label style={vistaPreviewLabelStyle}>Número de Remisión:</label>
              <span style={vistaPreviewValueStyle}>{remision.remision || 'N/A'}</span>
            </div>
            
            <div style={vistaPreviewFieldStyle}>
              <label style={vistaPreviewLabelStyle}>Móvil:</label>
              <span style={vistaPreviewValueStyle}>{remision.movil || 'N/A'}</span>
            </div>

            <div style={vistaPreviewFieldStyle}>
              <label style={vistaPreviewLabelStyle}>Estado:</label>
              <span style={{
                ...vistaPreviewValueStyle,
                backgroundColor: getEstadoColor(remision.estado),
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {remision.estado?.toUpperCase() || 'N/A'}
              </span>
            </div>

            <div style={vistaPreviewFieldStyle}>
              <label style={vistaPreviewLabelStyle}>Técnico:</label>
              <span style={vistaPreviewValueStyle}>{remision.tecnico || remision.autorizo || 'N/A'}</span>
            </div>

            <div style={vistaPreviewFieldStyle}>
              <label style={vistaPreviewLabelStyle}>Fecha de Remisión:</label>
              <span style={vistaPreviewValueStyle}>{formatearFechaBasica(remision.fecha_remision)}</span>
            </div>

            <div style={vistaPreviewFieldStyle}>
              <label style={vistaPreviewLabelStyle}>Total:</label>
              <span style={{...vistaPreviewValueStyle, fontWeight: '700', fontSize: '16px', color: THEME_COLORS.success}}>
                {formatearMoneda(remision.total)}
              </span>
            </div>
          </div>

          {/* Descripción completa */}
          <div style={vistaPreviewDescripcionStyle}>
            <label style={vistaPreviewLabelStyle}>Descripción del Trabajo:</label>
            <div style={vistaPreviewDescripcionContentStyle}>
              {remision.descripcion || 'No hay descripción disponible'}
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div style={vistaPreviewFooterStyle}>
          <button
            onClick={onClose}
            style={primaryButtonStyle}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para obtener color según estado
const getEstadoColor = (estado) => {
  switch (estado?.toLowerCase()) {
    case 'completado':
      return THEME_COLORS.success;
    case 'en_proceso':
      return THEME_COLORS.warning;
    case 'pendiente':
      return THEME_COLORS.info;
    case 'cancelado':
      return THEME_COLORS.danger;
    default:
      return THEME_COLORS.secondary;
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

// Estilos para filtros
const filtrosContainerStyle = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '8px',
  marginBottom: '16px',
  border: '1px solid #e9ecef'
};

const filtrosRowStyle = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap'
};

const filtroInputStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  minWidth: '200px',
  flex: '1'
};

const filtroSelectStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  minWidth: '150px',
  backgroundColor: 'white'
};

const filtroDateStyle = {
  padding: '8px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '14px',
  minWidth: '140px'
};

const limpiarFiltrosButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

// Estilo para botón "Ver"
const smallInfoButtonStyle = {
  backgroundColor: '#17a2b8',
  color: 'white',
  border: 'none',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '11px',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

// Estilos para modal de vista previa
const vistaPreviewModalStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '90vh',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  position: 'relative'
};

const vistaPreviewHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: THEME_COLORS.primary,
  color: 'white'
};

const vistaPreviewTitleStyle = {
  margin: 0,
  fontSize: '18px',
  fontWeight: '600'
};

const vistaPreviewContentStyle = {
  padding: '20px',
  maxHeight: 'calc(90vh - 140px)',
  overflowY: 'auto'
};

const vistaPreviewGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '16px',
  marginBottom: '20px'
};

const vistaPreviewFieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const vistaPreviewLabelStyle = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#6c757d',
  textTransform: 'uppercase'
};

const vistaPreviewValueStyle = {
  fontSize: '14px',
  color: '#333',
  fontWeight: '500'
};

const vistaPreviewDescripcionStyle = {
  marginTop: '20px',
  paddingTop: '20px',
  borderTop: '1px solid #e9ecef'
};

const vistaPreviewDescripcionContentStyle = {
  backgroundColor: '#f8f9fa',
  padding: '12px',
  borderRadius: '6px',
  lineHeight: '1.5',
  fontSize: '14px',
  marginTop: '8px'
};

const vistaPreviewFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderTop: '1px solid #e9ecef'
};

// Estilos básicos para modales
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  animation: 'slideInRight 0.3s ease'
};

const closeButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: 'white',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '5px',
  borderRadius: '4px',
  transition: 'background-color 0.2s'
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
