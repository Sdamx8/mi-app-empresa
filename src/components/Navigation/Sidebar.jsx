import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  FileText, 
  BarChart3, 
  Wrench, 
  Package, 
  DollarSign, 
  Building2, 
  Briefcase,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
  Hammer,
  ClipboardList,
  TrendingUp,
  FileBarChart
} from 'lucide-react';
import CorporateLogo from '../../CorporateLogo';

const Sidebar = ({ activeModule, setActiveModule, onLogout, userRole, isCollapsed, onToggleCollapse }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  // Definir módulos agrupados por categorías
  const menuSections = [
    {
      id: 'operativa',
      title: 'Gestión Operativa',
      icon: <Wrench className="w-4 h-4" />,
      modules: [
        { key: 'ingresar_trabajo', icon: <ClipboardList className="w-4 h-4" />, label: 'Ingresar Trabajo', roles: ['directivo', 'administrativo'] },
        { key: 'historial_trabajos', icon: <FileText className="w-4 h-4" />, label: 'Historial', roles: ['directivo', 'administrativo', 'tecnico'] },
        { key: 'reportes_informes', icon: <TrendingUp className="w-4 h-4" />, label: 'Reportes Historial', roles: ['directivo', 'administrativo'] },
        { key: 'informes_tecnicos', icon: <FileBarChart className="w-4 h-4" />, label: 'Informes Técnicos', roles: ['directivo', 'administrativo'] },
        { key: 'herramientas_electricas', icon: <Zap className="w-4 h-4" />, label: 'Herramientas Eléctricas', roles: ['directivo', 'administrativo'] },
        { key: 'herramientas_manuales', icon: <Hammer className="w-4 h-4" />, label: 'Herramientas Manuales', roles: ['directivo', 'administrativo'] },
        { key: 'servicios', icon: <Package className="w-4 h-4" />, label: 'Servicios', roles: ['directivo', 'administrativo'] }
      ]
    },
    {
      id: 'comercial',
      title: 'Gestión Comercial',
      icon: <Briefcase className="w-4 h-4" />,
      modules: [
        { key: 'crm', icon: <Building2 className="w-4 h-4" />, label: 'CRM', roles: ['directivo', 'administrativo'] }
      ]
    },
    {
      id: 'financiera',
      title: 'Gestión Financiera',
      icon: <DollarSign className="w-4 h-4" />,
      modules: [
        { key: 'financiero', icon: <BarChart3 className="w-4 h-4" />, label: 'Financiero', roles: ['directivo', 'administrativo'] }
      ]
    },
    {
      id: 'talento',
      title: 'Gestión del Talento Humano',
      icon: <Users className="w-4 h-4" />,
      modules: [
        { key: 'empleados', icon: <Users className="w-4 h-4" />, label: 'Empleados', roles: ['directivo', 'administrativo'] }
      ]
    },
    {
      id: 'general',
      title: 'Administración General',
      icon: <Settings className="w-4 h-4" />,
      modules: [
        { key: 'perfil', icon: <Home className="w-4 h-4" />, label: 'Inicio', roles: ['directivo', 'administrativo', 'tecnico'] }
      ]
    }
  ];

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const hasAccess = (moduleRoles) => {
    if (!userRole) return true; // Temporal hasta que se cargue el rol
    return moduleRoles.includes(userRole.toLowerCase());
  };

  const getVisibleSections = () => {
    return menuSections.map(section => ({
      ...section,
      modules: section.modules.filter(module => hasAccess(module.roles))
    })).filter(section => section.modules.length > 0);
  };

  const SidebarContent = ({ isMobile = false }) => (
    <div className={`flex flex-col h-full ${isMobile ? 'w-80' : 'w-64'} bg-white border-r border-gray-200`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <CorporateLogo size="sm" />
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">GMS</h1>
              <p className="text-xs text-gray-500">Global Management System</p>
            </div>
          )}
        </div>
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-1 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {getVisibleSections().map((section) => (
          <div key={section.id} className="space-y-1">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
            >
              <div className="flex items-center space-x-2">
                {section.icon}
                {!isCollapsed && <span>{section.title}</span>}
              </div>
              {!isCollapsed && (
                collapsedSections[section.id] ? 
                  <ChevronRight className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {/* Section Modules */}
            {(!collapsedSections[section.id] || isCollapsed) && (
              <div className={`space-y-1 ${!isCollapsed ? 'ml-4' : ''}`}>
                {section.modules.map((module) => (
                  <button
                    key={module.key}
                    onClick={() => {
                      setActiveModule(module.key);
                      if (isMobile) setIsMobileOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full p-2 text-left text-sm rounded-md transition-all duration-200 ${
                      activeModule === module.key
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title={isCollapsed ? module.label : ''}
                  >
                    {module.icon}
                    {!isCollapsed && <span>{module.label}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 w-full p-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          title={isCollapsed ? 'Cerrar Sesión' : ''}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full z-40">
        <SidebarContent />
      </div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black opacity-50"
            onClick={() => setIsMobileOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="relative bg-white">
            <SidebarContent isMobile />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
