import React, { useState } from 'react';
import CRM from './CRM';
import BuscarHistorialOptimizado from './BuscarHistorialOptimizado';
import IngresarTrabajo from './IngresarTrabajo';
import HerramientaElectrica from './HerramientaElectrica';
import HerramientaManual from './HerramientaManual';
import Empleados from './Empleados';
import PerfilEmpleado from './PerfilEmpleado';
import CorporateLogo from './CorporateLogo';
import ErrorBoundary from './ErrorBoundary';
import ModuleTransition, { ModuleLoader, useModuleLoader } from './ModuleTransition';
import './Dashboard.css';

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('perfil');
  const { isLoading, loadingModule } = useModuleLoader(activeModule);

  const renderContent = () => {
    if (isLoading) {
      return <ModuleLoader moduleName={loadingModule} />;
    }

    switch (activeModule) {
      case 'perfil':
        return (
          <ModuleTransition moduleKey="perfil" isActive={!isLoading}>
            <ErrorBoundary>
              <PerfilEmpleado onModulo={setActiveModule} />
            </ErrorBoundary>
          </ModuleTransition>
        );
      case 'crm':
        return (
          <ModuleTransition moduleKey="crm" isActive={!isLoading}>
            <ErrorBoundary>
              <CRM />
            </ErrorBoundary>
          </ModuleTransition>
        );
      case 'historial_trabajos':
        return (
          <ModuleTransition moduleKey="historial_trabajos" isActive={!isLoading}>
            <ErrorBoundary>
              <BuscarHistorialOptimizado />
            </ErrorBoundary>
          </ModuleTransition>
        );
      case 'ingresar_trabajo':
        return (
          <ModuleTransition moduleKey="ingresar_trabajo" isActive={!isLoading}>
            <ErrorBoundary>
              <IngresarTrabajo />
            </ErrorBoundary>
          </ModuleTransition>
        );
      case 'herramientas_electricas':
        return (
          <ModuleTransition moduleKey="herramientas_electricas" isActive={!isLoading}>
            <ErrorBoundary>
              <HerramientaElectrica />
            </ErrorBoundary>
          </ModuleTransition>
        );
      case 'herramientas_manuales':
        return (
          <ModuleTransition moduleKey="herramientas_manuales" isActive={!isLoading}>
            <ErrorBoundary>
              <HerramientaManual />
            </ErrorBoundary>
          </ModuleTransition>
        );
      case 'empleados':
        return (
          <ModuleTransition moduleKey="empleados" isActive={!isLoading}>
            <ErrorBoundary>
              <Empleados />
            </ErrorBoundary>
          </ModuleTransition>
        );
      default:
        return (
          <ModuleTransition moduleKey="perfil" isActive={!isLoading}>
            <ErrorBoundary>
              <PerfilEmpleado onModulo={setActiveModule} />
            </ErrorBoundary>
          </ModuleTransition>
        );
    }
  };

  const createNavButton = (moduleKey, icon, label, specialStyle = {}) => (
    <button
      key={moduleKey}
      onClick={() => setActiveModule(moduleKey)}
      className={`nav-button ${activeModule === moduleKey ? 'active' : ''}`}
      style={{
        backgroundColor: activeModule === moduleKey ? '#007bff' : '#6c757d',
        color: 'white',
        border: 'none',
        padding: '0.75rem 1.25rem',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        boxShadow: activeModule === moduleKey ? '0 2px 8px rgba(0,123,255,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
        transform: activeModule === moduleKey ? 'translateY(-1px)' : 'none',
        ...specialStyle
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        padding: '1rem',
        marginBottom: '2rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000
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
          
          <nav style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }} className="fade-in">
            {createNavButton('perfil', '🏠', 'Inicio')}
            {createNavButton('crm', '💼', 'CRM')}
            {createNavButton('historial_trabajos', '📊', 'Historial')}
            {createNavButton('ingresar_trabajo', '🔧', 'Ingresar Trabajo')}
            {createNavButton('herramientas_electricas', '⚡', 'Herramientas')}
            {createNavButton('herramientas_manuales', '🔨', 'Manuales')}
            {createNavButton('empleados', '👥', 'Empleados')}
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
          © 2024 Sistema de Gestión Empresarial | Desarrollado con ❤️ para la eficiencia laboral
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
