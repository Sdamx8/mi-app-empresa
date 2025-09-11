/**
 * 🚀 GLOBAL MOBILITY SOLUTIONS - NAVEGACIÓN
 * =========================================
 * Componente de navegación para toda la aplicación
 * Incluye botones de retroceder, avanzar y breadcrumbs
 */

import React from 'react';
import { motion } from 'framer-motion';
import './NavigationBar.css';

const NavigationBar = ({ 
  onBack, 
  onForward, 
  canGoBack = true, 
  canGoForward = false,
  currentPath = '',
  showBreadcrumbs = true,
  title = ''
}) => {
  
  // Generar breadcrumbs desde la ruta actual
  const generateBreadcrumbs = () => {
    if (!currentPath || !showBreadcrumbs) return [];
    
    const pathMap = {
      'dashboard': 'Dashboard',
      'historial-trabajos': 'Historial de Trabajos',
      'administrar-remisiones': 'Consultar Trabajos',
      'ingresar-trabajo': 'Ingresar Trabajo',
      'empleados': 'Empleados',
      'herramientas-electricas': 'Herramientas Eléctricas',
      'herramientas-manuales': 'Herramientas Manuales',
      'informes-tecnicos': 'Informes Técnicos',
      'perfil-empleado': 'Perfil Empleado',
      'crm': 'CRM',
      'financiero': 'Financiero'
    };
    
    const segments = currentPath.split('/').filter(Boolean);
    const breadcrumbs = [];
    
    let currentSegment = '';
    for (const segment of segments) {
      currentSegment += (currentSegment ? '/' : '') + segment;
      breadcrumbs.push({
        path: currentSegment,
        label: pathMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      });
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <motion.div 
      className="navigation-bar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Controles de navegación */}
      <div className="nav-controls">
        <motion.button
          className={`nav-btn nav-back ${!canGoBack ? 'disabled' : ''}`}
          onClick={onBack}
          disabled={!canGoBack}
          whileHover={canGoBack ? { scale: 1.05 } : {}}
          whileTap={canGoBack ? { scale: 0.95 } : {}}
          title="Retroceder"
        >
          <span className="nav-icon">←</span>
          <span className="nav-text">Atrás</span>
        </motion.button>

        <motion.button
          className={`nav-btn nav-forward ${!canGoForward ? 'disabled' : ''}`}
          onClick={onForward}
          disabled={!canGoForward}
          whileHover={canGoForward ? { scale: 1.05 } : {}}
          whileTap={canGoForward ? { scale: 0.95 } : {}}
          title="Avanzar"
        >
          <span className="nav-text">Adelante</span>
          <span className="nav-icon">→</span>
        </motion.button>
      </div>

      {/* Título y breadcrumbs */}
      <div className="nav-content">
        {title && (
          <h1 className="nav-title">{title}</h1>
        )}
        
        {breadcrumbs.length > 0 && (
          <nav className="breadcrumbs" aria-label="Navegación de rutas">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <span className="breadcrumb-home">🏠</span>
                <span className="breadcrumb-text">Inicio</span>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.path}>
                  <li className="breadcrumb-separator">›</li>
                  <li className={`breadcrumb-item ${index === breadcrumbs.length - 1 ? 'active' : ''}`}>
                    <span className="breadcrumb-text">{crumb.label}</span>
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>
        )}
      </div>

      {/* Botón de refrescar */}
      <div className="nav-actions">
        <motion.button
          className="nav-btn nav-refresh"
          onClick={() => window.location.reload()}
          whileHover={{ scale: 1.05, rotate: 180 }}
          whileTap={{ scale: 0.95 }}
          title="Refrescar página"
        >
          <span className="nav-icon">⟳</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default NavigationBar;
