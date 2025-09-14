/**
 * 🚀 GLOBAL MOBILITY SOLUTIONS - GESTIONAR REMISIONES
 * ===================================================
 * Componente principal del módulo de gestión de remisiones
 * Incluye 3 submódulos: Consultar Móvil, Ingresar Trabajo y Administrar Remisiones
 * 
 * Versión: 3.0 - Rediseño según Manual de Identidad Corporativa
 * Actualizado: Septiembre 2025
 */

import React, { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../core/auth/AuthContext';
import { useRole } from '../../../core/auth/RoleContext';
import { THEME } from '../../../shared/tokens/theme';
import './GestionarRemisiones.css';

// Importación lazy de submódulos para optimización
const ConsultarMovil = lazy(() => import('../../historial-trabajos/components/ConsultarMovil'));
const IngresarTrabajo = lazy(() => import('../../ingresar-trabajo'));
const AdministrarRemisiones = lazy(() => import('../../historial-trabajos/components/AdministrarRemisiones'));

// Definición de submódulos
const SUBMODULOS = {
  consultar: {
    key: 'consultar',
    title: 'Consultar Móvil',
    description: 'Buscar y consultar remisiones por número de móvil',
    icon: '🔍',
    component: ConsultarMovil,
    color: THEME.colors.info
  },
  ingresar: {
    key: 'ingresar', 
    title: 'Ingresar Trabajo',
    description: 'Registrar nuevas remisiones de trabajo realizado',
    icon: '📝',
    component: IngresarTrabajo,
    color: THEME.colors.success
  },
  administrar: {
    key: 'administrar',
    title: 'Administrar Remisiones', 
    description: 'Gestionar y editar remisiones existentes',
    icon: '⚙️',
    component: AdministrarRemisiones,
    color: THEME.colors.warning
  }
};

// Componente de carga
const LoadingSpinner = ({ message = 'Cargando submódulo...' }) => (
  <div className="loading-container">
    <motion.div
      className="loading-spinner"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
    <p className="loading-message">{message}</p>
  </div>
);

// Componente de tarjeta de submódulo
const SubmoduleCard = ({ submodulo, isActive, onClick }) => (
  <motion.div
    className={`submodule-card ${isActive ? 'active' : ''}`}
    onClick={onClick}
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    style={{
      borderLeftColor: submodulo.color
    }}
  >
    <div className="submodule-icon">{submodulo.icon}</div>
    <div className="submodule-content">
      <h3 className="submodule-title">{submodulo.title}</h3>
      <p className="submodule-description">{submodulo.description}</p>
    </div>
    <div className="submodule-arrow">
      {isActive ? '📂' : '📁'}
    </div>
  </motion.div>
);

const GestionarRemisiones = () => {
  const { user } = useAuth();
  const { userRole, currentEmployee } = useRole();
  const [activeSubmodule, setActiveSubmodule] = useState(null);

  // Función para manejar el cambio de submódulo
  const handleSubmoduleChange = (submoduleKey) => {
    setActiveSubmodule(submoduleKey);
  };

  // Función para volver al dashboard principal
  const handleBackToDashboard = () => {
    setActiveSubmodule(null);
  };

  // Obtener componente activo
  const ActiveComponent = activeSubmodule ? SUBMODULOS[activeSubmodule]?.component : null;

  return (
    <div className="gestionar-remisiones">
      {/* Header del módulo */}
      <motion.header 
        className="module-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="header-content">
          <div className="header-title-section">
            <h1 className="module-title">
              📋 Gestionar Remisiones
            </h1>
            <p className="module-subtitle">
              Sistema integral para la gestión de remisiones de trabajo
            </p>
          </div>
          
          {/* Información del usuario */}
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">{currentEmployee?.nombre || user?.email}</span>
              <span className="user-role">{userRole?.toUpperCase() || 'USUARIO'}</span>
            </div>
          </div>
        </div>
        
        {/* Navegación breadcrumb */}
        {activeSubmodule && (
          <motion.nav 
            className="breadcrumb-nav"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <button 
              className="breadcrumb-link"
              onClick={handleBackToDashboard}
            >
              📋 Gestionar Remisiones
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">
              {SUBMODULOS[activeSubmodule]?.icon} {SUBMODULOS[activeSubmodule]?.title}
            </span>
          </motion.nav>
        )}
      </motion.header>

      {/* Contenido principal */}
      <main className="module-content">
        <AnimatePresence mode="wait">
          {!activeSubmodule ? (
            // Dashboard de submódulos
            <motion.div
              key="dashboard"
              className="submodules-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Estadísticas rápidas */}
              <div className="stats-section">
                <h2 className="stats-title">📊 Resumen General</h2>
                <div className="stats-grid">
                  <motion.div 
                    className="stat-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <div className="stat-icon">📈</div>
                    <div className="stat-content">
                      <div className="stat-value">247</div>
                      <div className="stat-label">Remisiones este mes</div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="stat-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                      <div className="stat-value">189</div>
                      <div className="stat-label">Completadas</div>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="stat-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.3 }}
                  >
                    <div className="stat-icon">🔄</div>
                    <div className="stat-content">
                      <div className="stat-value">58</div>
                      <div className="stat-label">En proceso</div>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Grid de submódulos */}
              <div className="submodules-section">
                <h2 className="section-title">🚀 Submódulos Disponibles</h2>
                <div className="submodules-grid">
                  {Object.values(SUBMODULOS).map((submodulo, index) => (
                    <motion.div
                      key={submodulo.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <SubmoduleCard
                        submodulo={submodulo}
                        isActive={false}
                        onClick={() => handleSubmoduleChange(submodulo.key)}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            // Submódulo activo
            <motion.div
              key={activeSubmodule}
              className="active-submodule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={<LoadingSpinner message={`Cargando ${SUBMODULOS[activeSubmodule]?.title}...`} />}>
                {ActiveComponent && <ActiveComponent onBack={handleBackToDashboard} />}
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default GestionarRemisiones;