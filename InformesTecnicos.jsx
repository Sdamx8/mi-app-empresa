import React, { useState } from 'react';
import { motion } from 'framer-motion';

import FormularioInforme from './FormularioInforme';
import GestionInformes from './GestionInformes';
import { useAuth } from '../../core/auth/AuthContext';
import { useRole } from '../../core/auth/RoleContext';

const InformesTecnicos = () => {
  const [activeTab, setActiveTab] = useState('nuevo');
  const { user } = useAuth();
  const { hasModuleAccess } = useRole();

  // Verificar permisos de acceso
  if (!hasModuleAccess('informes_tecnicos')) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center min-h-screen bg-gray-50"
      >
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">
            Este módulo solo está disponible para usuarios con rol administrativo o directivo.
          </p>
        </div>
      </motion.div>
    );
  }

  const tabs = [
    { id: 'nuevo', label: 'Nuevo Informe', icon: '📝' },
    { id: 'gestion', label: 'Gestión de Informes', icon: '📊' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6"
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Informes Técnicos</h1>
                <p className="text-gray-600 mt-1">Genera y gestiona informes técnicos de servicios</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {user?.rol || 'Usuario'}
                </span>
                <span>{user?.email}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'nuevo' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Nuevo Informe Técnico</h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      📝 Formulario de informe técnico en desarrollo
                    </p>
                    <p className="mt-1 text-sm text-blue-600">
                      Esta sección permitirá crear nuevos informes técnicos detallados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'gestion' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestión de Informes</h2>
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-green-700">
                      📊 Sistema de gestión en desarrollo
                    </p>
                    <p className="mt-1 text-sm text-green-600">
                      Aquí podrás ver, editar y gestionar todos los informes técnicos existentes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InformesTecnicos;
