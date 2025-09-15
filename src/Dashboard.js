import React, { useState, useEffect } from 'react';
import CRM from './modules/crm';
import ServiciosPage from './modules/servicios';
import GestionarRemisiones from './modules/gestionar-remisiones'; // Nuevo módulo unificado
import HistorialTrabajosOptimizado from './modules/historial-trabajos/components/HistorialTrabajosOptimizado'; // Mantener para compatibilidad
import IngresarTrabajo from './modules/ingresar-trabajo'; // Mantener para compatibilidad
import HerramientaElectrica from './modules/herramientas-electricas';
import HerramientaManual from './modules/herramientas-manuales';
import Empleados from './modules/empleados';
import PerfilEmpleado from './modules/perfil-empleado';
import { GestionMantenimientos } from './modules/gestion-mantenimientos'; // Nuevo módulo de mantenimientos
import CorporateLogo from './shared/components/CorporateLogo';
import ErrorBoundary from './shared/components/ErrorBoundary'; // Error Boundary corregido
import SuccessNotification from './shared/components/SuccessNotification';
import NotificationCenter from './shared/components/NotificationCenter';
import InformesTecnicosPage from './modules/informes-tecnicos/InformesTecnicosPage';
import Financiero from './modules/financiero/Financiero';
import { useAuth } from './core/auth/AuthContext';
import { useRole } from './core/auth/RoleContext';
import './Dashboard.css';

// Hook personalizado para manejar carga de módulos
const useModuleLoader = (activeModule) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingModule, setLoadingModule] = useState('');

  useEffect(() => {
    setIsLoading(true);
    setLoadingModule(activeModule);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [activeModule]);

  return { isLoading, loadingModule };
};

// Componente de carga de módulos
const ModuleLoader = ({ moduleName }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    backgroundColor: '#f8f9fa'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid #e9ecef',
        borderTop: '4px solid #007bff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem'
      }}></div>
      <p style={{ color: '#6c757d', fontSize: '1rem' }}>
        Cargando {moduleName}...
      </p>
    </div>
  </div>
);

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('perfil');
  const [showSuccessNotification, setShowSuccessNotification] = useState(true);
  const { isLoading, loadingModule } = useModuleLoader(activeModule);
  const { logout } = useAuth();
  const { 
    userRole = null, 
    currentEmployee = null, 
    userPermissions = null, 
    hasModuleAccess = null,
    roleLoading = false 
  } = useRole() || {};

  // Funciones seguras para evitar errores
  const safeHasModuleAccess = (module) => {
    try {
      return typeof hasModuleAccess === 'function' ? hasModuleAccess(module) : true;
    } catch (error) {
      console.error('Error verificando acceso al módulo:', error);
      return true;
    }
  };

  const safeUserPermissions = userPermissions || {
    canEditHistorial: false,
    canDeleteHistorial: false,
    canViewReports: false,
    canExportData: false
  };

  const safeGetRoleDisplayName = () => {
    switch ((userRole || '').toLowerCase()) {
      case 'directivo': return 'Directivo';
      case 'administrativo': return 'Administrativo';
      case 'tecnico': return 'Técnico';
      default: return 'Usuario';
    }
  };

  // Componente para mostrar cuando no se tiene acceso
  const AccessDenied = ({ module }) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      textAlign: 'center',
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '12px',
      border: '2px solid #e9ecef'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
      <h2 style={{ color: '#6c757d', marginBottom: '1rem' }}>Acceso Restringido</h2>
      <p style={{ color: '#6c757d', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
        No tienes permisos para acceder al módulo: <strong>{module}</strong>
      </p>
      <p style={{ color: '#6c757d', fontSize: '0.9rem' }}>
        Tu rol actual: <strong>{safeGetRoleDisplayName()}</strong>
      </p>
      <button
        onClick={() => setActiveModule('perfil')}
        style={{
          marginTop: '1.5rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '0.9rem'
        }}
      >
        🏠 Volver al Inicio
      </button>
    </div>
  );

  // Sincronizar módulo activo con URL (hash, pathname) y eventos personalizados
  useEffect(() => {
    const applyFromLocation = () => {
      try {
        const path = (window.location.pathname || '').toLowerCase();
        const hash = (window.location.hash || '').toLowerCase();

        // Detectar módulo Informes Técnicos por pathname o hash
        if (path.includes('informes-tecnicos') || hash.includes('informes-tecnicos') || hash.includes('informes_tecnicos')) {
          setActiveModule('informes_tecnicos');
          return;
        }
      } catch (e) {
        console.warn('No se pudo aplicar navegación desde URL:', e);
      }
    };

    const handleCustomNavigation = (event) => {
      try {
        const detail = event.detail || {};
        const mod = (detail.module || '').toLowerCase();
        if (mod.includes('informes')) {
          setActiveModule('informes_tecnicos');
        }
      } catch (e) {
        console.warn('Error manejando navigation-change:', e);
      }
    };

    // Aplicar al montar
    applyFromLocation();

    // Listeners
    window.addEventListener('hashchange', applyFromLocation);
    window.addEventListener('popstate', applyFromLocation);
    window.addEventListener('navigation-change', handleCustomNavigation);

    return () => {
      window.removeEventListener('hashchange', applyFromLocation);
      window.removeEventListener('popstate', applyFromLocation);
      window.removeEventListener('navigation-change', handleCustomNavigation);
    };
  }, []);

  const renderContent = () => {
    if (isLoading) return <ModuleLoader moduleName={loadingModule} />;

    switch (activeModule) {
      case 'perfil':
        return (
          <ErrorBoundary>
            <PerfilEmpleado onModulo={setActiveModule} />
          </ErrorBoundary>
        );
      case 'crm':
        if (!safeHasModuleAccess('crm')) return <AccessDenied module="CRM" />;
        return <ErrorBoundary><CRM /></ErrorBoundary>;
      case 'servicios':
        if (!safeHasModuleAccess('servicios')) return <AccessDenied module="Catálogo de servicios" />;
        return <ErrorBoundary><ServiciosPage /></ErrorBoundary>;
      case 'gestionar_remisiones':
        if (!safeHasModuleAccess('gestionar_remisiones')) return <AccessDenied module="Gestionar Remisiones" />;
        return (
          <ErrorBoundary>
            <GestionarRemisiones 
              canEdit={safeUserPermissions.canEditHistorial}
              canDelete={safeUserPermissions.canDeleteHistorial}
              userRole={userRole}
            />
          </ErrorBoundary>
        );
      case 'historial_trabajos':
        // Mantener para compatibilidad con enlaces directos
        if (!safeHasModuleAccess('historial_trabajos')) return <AccessDenied module="Historial de Trabajos" />;
        return (
          <ErrorBoundary>
            <HistorialTrabajosOptimizado 
              canEdit={safeUserPermissions.canEditHistorial}
              canDelete={safeUserPermissions.canDeleteHistorial}
              userRole={userRole}
            />
          </ErrorBoundary>
        );
      case 'ingresar_trabajo':
        // Mantener para compatibilidad con enlaces directos
        if (!safeHasModuleAccess('ingresar_trabajo')) return <AccessDenied module="Ingresar Trabajo" />;
        return <ErrorBoundary><IngresarTrabajo /></ErrorBoundary>;
      case 'herramientas_electricas':
        if (!safeHasModuleAccess('herramientas_electricas')) return <AccessDenied module="Herramientas Eléctricas" />;
        return <ErrorBoundary><HerramientaElectrica /></ErrorBoundary>;
      case 'herramientas_manuales':
        if (!safeHasModuleAccess('herramientas_manuales')) return <AccessDenied module="Herramientas Manuales" />;
        return <ErrorBoundary><HerramientaManual /></ErrorBoundary>;
      case 'empleados':
        if (!safeHasModuleAccess('empleados')) return <AccessDenied module="Gestión de Empleados" />;
        return <ErrorBoundary><Empleados /></ErrorBoundary>;
      case 'informes_tecnicos':
        if (!safeHasModuleAccess('informes_tecnicos')) return <AccessDenied module="Informes Técnicos" />;
        return <ErrorBoundary><InformesTecnicosPage /></ErrorBoundary>;
      case 'financiero':
        if (!safeHasModuleAccess('financiero')) return <AccessDenied module="Módulo Financiero" />;
        return <ErrorBoundary><Financiero /></ErrorBoundary>;
      case 'gestion_mantenimientos':
        if (!safeHasModuleAccess('gestion_mantenimientos')) return <AccessDenied module="Gestión de Mantenimientos" />;
        return <ErrorBoundary><GestionMantenimientos /></ErrorBoundary>;
      default:
        return <ErrorBoundary><PerfilEmpleado onModulo={setActiveModule} /></ErrorBoundary>;
    }
  };

  // Definir módulos disponibles organizados por categorías
  const moduleCategories = {
    core: [
      { key: 'perfil', icon: '🏠', label: 'Inicio' },
      { key: 'crm', icon: '💼', label: 'CRM' }
    ],
    trabajo: [
      { key: 'gestionar_remisiones', icon: '📋', label: 'Gestionar Remisiones', isNew: true }, // Nuevo módulo unificado
      // Mantener módulos individuales para compatibilidad (ocultos del menú principal)
      // { key: 'historial_trabajos', icon: '📊', label: 'Historial' },
      // { key: 'ingresar_trabajo', icon: '🔧', label: 'Ingresar Trabajo' }
    ],
    recursos: [
      { key: 'herramientas_electricas', icon: '⚡', label: 'Herramientas' },
      { key: 'herramientas_manuales', icon: '🔨', label: 'Manuales' },
      { key: 'empleados', icon: '👥', label: 'Empleados' },
      { key: 'servicios', icon: '🛠️', label: 'Catálogo de servicios', isNew: true }
    ],
    gestion: [
      { key: 'informes_tecnicos', icon: '📄', label: 'Informes Técnicos' },
      { key: 'financiero', icon: '💰', label: 'Financiero' }
    ]
  };

  // Lista plana para compatibilidad
  const modules = Object.values(moduleCategories).flat();

  const createNavButton = (moduleKey, icon, label, isNewModule = false) => (
    <button
      key={moduleKey}
      onClick={() => setActiveModule(moduleKey)}
      className={`nav-button ${activeModule === moduleKey ? 'active' : ''}`}
      style={{
        backgroundColor: activeModule === moduleKey ? '#5DADE2' : 'rgba(255, 255, 255, 0.1)', // secondary color para activo, transparencia para inactivo
        color: '#FFFFFF', // texto blanco según manual
        border: activeModule === moduleKey ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
        padding: '0.75rem 1.25rem',
        borderRadius: '8px', // radio según manual
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500', // medium según manual
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: activeModule === moduleKey ? '0 4px 6px rgba(0, 0, 0, 0.07)' : 'none', // sombra según manual
        transform: activeModule === moduleKey ? 'translateY(-1px)' : 'none',
        transition: 'all 300ms ease-in-out', // duración estándar según manual
        position: 'relative'
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span>{label}</span>
      {isNewModule && (
        <span className="new-module-badge">
          NUEVO
        </span>
      )}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}> {/* background token según manual */}
      {/* Notificación de éxito del nuevo módulo */}
      {showSuccessNotification && safeHasModuleAccess('gestionar_remisiones') && (
        <SuccessNotification
          message="¡Nuevo módulo disponible! 'Gestionar Remisiones' unifica todas las funcionalidades de gestión de trabajos en un solo lugar. ¡Explóralo ahora!"
          onClose={() => setShowSuccessNotification(false)}
          duration={8000}
        />
      )}
      
      {roleLoading ? (
        // Pantalla de carga mientras se obtienen los datos del empleado
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)',
          color: 'white',
          fontSize: '1.2rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTop: '4px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p>Cargando datos del empleado...</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Verificando permisos y configurando el dashboard
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header style={{
        backgroundColor: '#1E3C72', // primary color según manual
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '1rem 2rem',
        marginBottom: '2rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        color: '#FFFFFF' // texto blanco según manual
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div className="slide-in">
            <CorporateLogo />
          </div>

          {/* Información del usuario y notificaciones */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            color: 'rgba(255, 255, 255, 0.8)', // texto blanco con transparencia
            fontSize: '0.9rem'
          }}>
            <NotificationCenter />
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end'
            }}>
              <span style={{ fontWeight: '600', color: '#FFFFFF' }}> {/* texto blanco según manual */}
                {currentEmployee?.nombre_completo || currentEmployee?.nombre || 'Usuario'}
              </span>
              <span style={{
                fontSize: '0.8rem',
                padding: '4px 12px',
                backgroundColor: userRole === 'directivo' ? '#27AE60' : // success color según manual
                                userRole === 'administrativo' ? '#5DADE2' : '#6C757D', // secondary y muted según manual
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600' // semibold según manual
              }}>
                {safeGetRoleDisplayName()}
              </span>
            </div>
          </div>
          
          <nav style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }} className="fade-in">
            {modules.filter(module => safeHasModuleAccess(module.key)).map(module => 
              createNavButton(module.key, module.icon, module.label, module.isNew)
            )}
            
            {/* Botón de cerrar sesión */}
            <button
              onClick={async () => {
                if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                  try {
                    // Limpiar localStorage y sessionStorage
                    localStorage.clear();
                    sessionStorage.clear();
                    // Usar el método logout del contexto de autenticación
                    await logout();
                  } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    // Si hay error, forzar recarga
                    window.location.reload();
                  }
                }
              }}
              style={{
                backgroundColor: '#E74C3C', // danger color según manual
                color: '#FFFFFF', // texto blanco según manual
                border: 'none',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px', // radio según manual
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500', // medium según manual
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginLeft: '1rem',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', // sombra sutil según manual
                transition: 'all 300ms ease-in-out' // duración estándar según manual
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#C0392B'; // danger dark según manual
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'; // sombra hover según manual
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#E74C3C'; // danger según manual
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'; // sombra sutil según manual
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1rem 2rem',
        minHeight: 'calc(100vh - 140px)'
      }}>
        <div className="module-card" style={{
          minHeight: '500px',
          padding: '0',
          overflow: 'hidden'
        }}>
          {renderContent()}
        </div>
      </main>

      {/* Footer opcional */}
      <footer style={{
        backgroundColor: '#fff',
        borderTop: '1px solid #e9ecef',
        padding: '1rem',
        textAlign: 'center',
        color: '#6c757d',
        fontSize: '0.9rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          © {new Date().getFullYear()} Global Mobility Solutions | Sistema de Gestión Empresarial
        </div>
      </footer>
        </>
      )}
    </div>
  );
};

export default Dashboard;
