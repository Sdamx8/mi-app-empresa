import React, { useState } from 'react';
import CRM from './CRM';
import BuscarHistorialOptimizado from './BuscarHistorialOptimizado';
import IngresarTrabajo from './IngresarTrabajo';
import HerramientaElectrica from './HerramientaElectrica';
import HerramientaManual from './HerramientaManual';
import Empleados from './Empleados';
import PerfilEmpleado from './PerfilEmpleado';
import ErrorBoundary from './ErrorBoundary';
import InformesTecnicosPage from './components/InformesTecnicos/InformesTecnicosPage';
import Financiero from './components/Financiero/Financiero';
import Servicios from './components/Servicios/Servicios';
import ReportesInformes from './components/ReportesInformes/ReportesInformes';
import MainLayout from './components/Navigation/MainLayout';
import { useAuth } from './AuthContext';
import { useRole } from './RoleContext';

const Dashboard = () => {
  const [activeModule, setActiveModule] = useState('perfil');
  const { logout } = useAuth();
  const { 
    userRole = null, 
    currentEmployee = null, 
    userPermissions = null, 
    roleLoading = false 
  } = useRole() || {};

  // Funciones seguras para evitar errores
  const safeUserPermissions = userPermissions || {
    canEditHistorial: false,
    canDeleteHistorial: false,
    canViewReports: false,
    canExportData: false
  };

  // Renderizar contenido del módulo activo
  const renderModuleContent = () => {
    switch (activeModule) {
      case 'perfil':
        return (
          <ErrorBoundary>
            <PerfilEmpleado onModulo={setActiveModule} />
          </ErrorBoundary>
        );
      case 'crm':
        return <ErrorBoundary><CRM /></ErrorBoundary>;
      case 'historial_trabajos':
        return (
          <ErrorBoundary>
            <BuscarHistorialOptimizado 
              canEdit={safeUserPermissions.canEditHistorial}
              canDelete={safeUserPermissions.canDeleteHistorial}
              userRole={userRole}
            />
          </ErrorBoundary>
        );
      case 'ingresar_trabajo':
        return <ErrorBoundary><IngresarTrabajo /></ErrorBoundary>;
      case 'herramientas_electricas':
        return <ErrorBoundary><HerramientaElectrica /></ErrorBoundary>;
      case 'herramientas_manuales':
        return <ErrorBoundary><HerramientaManual /></ErrorBoundary>;
      case 'empleados':
        return <ErrorBoundary><Empleados /></ErrorBoundary>;
      case 'informes_tecnicos':
        return <ErrorBoundary><InformesTecnicosPage /></ErrorBoundary>;
      case 'reportes_informes':
        return <ErrorBoundary><ReportesInformes /></ErrorBoundary>;
      case 'financiero':
        return <ErrorBoundary><Financiero /></ErrorBoundary>;
      case 'servicios':
        return <ErrorBoundary><Servicios /></ErrorBoundary>;
      default:
        return <ErrorBoundary><PerfilEmpleado onModulo={setActiveModule} /></ErrorBoundary>;
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Cargando datos del empleado...</p>
          <p className="text-sm opacity-80">Verificando permisos y configurando el dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      activeModule={activeModule}
      setActiveModule={setActiveModule}
      onLogout={logout}
      userRole={userRole}
    >
      {renderModuleContent()}
    </MainLayout>
  );
};

export default Dashboard;
