// IngresarTrabajo.js - Módulo principal para ingresar trabajo realizado
import React, { useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import LoginComponent from './LoginComponent';
import FormularioRemision from './components/FormularioRemision';
import { THEME_COLORS } from './constants';

const IngresarTrabajo = () => {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [recentRemisiones, setRecentRemisiones] = useState([]);

  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleSaveSuccess = useCallback((result) => {
    // Mostrar notificación de éxito
    setNotification({
      type: 'success',
      message: result.message,
      id: result.id
    });

    // Agregar a la lista de remisiones recientes
    const newRemision = {
      id: result.id,
      timestamp: new Date().toISOString(),
      message: result.message
    };
    
    setRecentRemisiones(prev => [newRemision, ...prev.slice(0, 4)]); // Mantener solo las últimas 5

    // Ocultar notificación después de 5 segundos
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  }, []);

  const dismissNotification = useCallback(() => {
    setNotification(null);
  }, []);

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

      {/* Notificación */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          id={notification.id}
          onDismiss={dismissNotification}
        />
      )}

      {/* Contenido principal */}
      <div style={contentStyle}>
        {/* Estadísticas rápidas */}
        <div style={statsContainerStyle}>
          <StatCard
            icon="📝"
            title="Remisiones Hoy"
            value="8"
            subtitle="3 pendientes"
            color={THEME_COLORS.primary}
          />
          <StatCard
            icon="✅"
            title="Completadas"
            value="15"
            subtitle="Esta semana"
            color={THEME_COLORS.success}
          />
          <StatCard
            icon="🔄"
            title="En Proceso"
            value="5"
            subtitle="Requieren atención"
            color={THEME_COLORS.warning}
          />
          <StatCard
            icon="💰"
            title="Total Facturado"
            value="$2.4M"
            subtitle="Este mes"
            color={THEME_COLORS.info}
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

        {/* Remisiones recientes */}
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
      />
    </div>
  );
};

// Componente de notificación
const Notification = ({ type, message, id, onDismiss }) => (
  <div style={{
    ...notificationStyle,
    backgroundColor: type === 'success' ? THEME_COLORS.success : THEME_COLORS.danger
  }}>
    <div style={notificationContentStyle}>
      <span style={notificationIconStyle}>
        {type === 'success' ? '✅' : '❌'}
      </span>
      <div>
        <div style={notificationMessageStyle}>{message}</div>
        {id && (
          <div style={notificationIdStyle}>
            ID del documento: {id.substring(0, 12)}...
          </div>
        )}
      </div>
    </div>
    <button onClick={onDismiss} style={notificationCloseStyle}>
      ✕
    </button>
  </div>
);

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

// Agregar animación CSS para la notificación
const notificationStyleSheet = document.createElement('style');
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
`;
document.head.appendChild(notificationStyleSheet);

export default IngresarTrabajo;
