// components/Financiero/Financiero.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  FileText, 
  CreditCard, 
  BarChart3, 
  Settings,
  AlertTriangle,
  Search
} from 'lucide-react';

import { useAuth } from '../../AuthContext';
import { useRole } from '../../RoleContext';
import DashboardFinanciero from './DashboardFinanciero';
import GestionFacturas from './GestionFacturas';
import GestionPagos from './GestionPagos';
import ReportesFinancieros from './ReportesFinancieros';
import ConfiguracionFinanciera from './ConfiguracionFinanciera';
import AlertasFinancieras from './AlertasFinancieras';
import BuscarTransacciones from './BuscarTransacciones';

const Financiero = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user } = useAuth();
  const { userRole, hasModuleAccess } = useRole();

  // Control de acceso
  if (!hasModuleAccess('financiero')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">No tienes permisos para acceder al módulo financiero.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: BarChart3,
      description: 'Resumen financiero y métricas principales',
      color: 'text-blue-600'
    },
    {
      id: 'facturas',
      name: 'Facturas',
      icon: FileText,
      description: 'Gestión de facturación y documentos',
      color: 'text-green-600'
    },
    {
      id: 'pagos',
      name: 'Pagos',
      icon: CreditCard,
      description: 'Control de pagos y cobros',
      color: 'text-purple-600'
    },
    {
      id: 'reportes',
      name: 'Reportes',
      icon: BarChart3,
      description: 'Análisis y reportes financieros',
      color: 'text-orange-600'
    },
    {
      id: 'buscar',
      name: 'Buscar',
      icon: Search,
      description: 'Búsqueda avanzada de transacciones',
      color: 'text-indigo-600'
    },
    {
      id: 'alertas',
      name: 'Alertas',
      icon: AlertTriangle,
      description: 'Notificaciones y alertas financieras',
      color: 'text-red-600'
    },
    {
      id: 'configuracion',
      name: 'Configuración',
      icon: Settings,
      description: 'Configuración del módulo financiero',
      color: 'text-gray-600',
      requireRole: ['directivo', 'administrativo']
    }
  ];

  // Filtrar tabs según permisos
  const availableTabs = tabs.filter(tab => {
    if (!tab.requireRole) return true;
    return tab.requireRole.includes(userRole);
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardFinanciero />;
      case 'facturas':
        return <GestionFacturas />;
      case 'pagos':
        return <GestionPagos />;
      case 'reportes':
        return <ReportesFinancieros />;
      case 'buscar':
        return <BuscarTransacciones />;
      case 'alertas':
        return <AlertasFinancieras />;
      case 'configuracion':
        return <ConfiguracionFinanciera />;
      default:
        return <DashboardFinanciero />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Módulo Financiero
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Gestión integral de facturación, pagos y reportes financieros
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  {userRole === 'directivo' ? 'Directivo' : 
                   userRole === 'administrativo' ? 'Administrativo' : 'Usuario'}
                </div>
                <div className="text-gray-500">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 mr-2 ${
                    activeTab === tab.id ? tab.color : 'text-gray-400'
                  }`} />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Financiero;
