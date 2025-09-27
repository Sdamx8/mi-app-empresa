/**
 * 📊 Enhanced Remisiones Consolidado - Main Component
 * =================================================
 * Componente principal mejorado que integra la hoja de cálculo existente
 * con la nueva tabla de visualización en tiempo real y administración completa
 * 
 * @author: Global Mobility Solutions
 * @version: 2.0.0
 * @date: September 2025
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../../core/auth/AuthContext';
import { FilterPersistenceProvider } from '../context/FilterPersistenceContext';
import RemisionesSpreadsheet from './RemisionesSpreadsheet';
import RemisionesTable from './RemisionesTable';
import RemisionDetail from './RemisionDetail';
import { useRealTimeRemisiones } from '../hooks/useRealTimeRemisiones';
import './EnhancedRemisionesConsolidado.css';

const EnhancedRemisionesConsolidado = () => {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('consolidated'); // 'consolidated' | 'spreadsheet' | 'detail'
  const [selectedRemisionId, setSelectedRemisionId] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Hook para datos en tiempo real
  const { remisiones, loading, contadores } = useRealTimeRemisiones();

  // Verificar permisos de administrador
  const isAdmin = user?.email === 'davian.ayala7@gmail.com';
  const hasAdminAccess = isAdmin;

  // Handlers para navegación
  const handleViewRemision = useCallback((remision) => {
    setSelectedRemisionId(remision.id);
    setActiveView('detail');
  }, []);

  const handleEditRemision = useCallback((remision) => {
    setSelectedRemisionId(remision.id);
    setActiveView('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedRemisionId(null);
    setActiveView('consolidated');
  }, []);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Si estamos viendo el detalle de una remisión
  if (activeView === 'detail' && selectedRemisionId) {
    return (
      <RemisionDetail 
        remisionId={selectedRemisionId}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="enhanced-remisiones-consolidado">
      {/* Notificación global */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header con navegación */}
      <div className="module-header">
        <div className="header-content">
          <div className="header-left">
            <h1>📊 Remisiones Consolidado</h1>
            <p className="module-description">
              Gestión completa de remisiones con adjuntos, estados y PDF consolidado
            </p>
          </div>
          
          <div className="header-actions">
            <div className="view-switcher">
              <button
                className={`view-btn ${activeView === 'consolidated' ? 'active' : ''}`}
                onClick={() => setActiveView('consolidated')}
              >
                📋 Vista Consolidada
              </button>
              <button
                className={`view-btn ${activeView === 'spreadsheet' ? 'active' : ''}`}
                onClick={() => setActiveView('spreadsheet')}
              >
                📊 Hoja de Cálculo
              </button>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="quick-stats">
          <div className="stat-card pendientes">
            <div className="stat-icon">🔴</div>
            <div className="stat-content">
              <span className="stat-number">{contadores.PENDIENTE || 0}</span>
              <span className="stat-label">Pendientes</span>
            </div>
          </div>
          
          <div className="stat-card radicados">
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <span className="stat-number">{contadores.RADICADO || 0}</span>
              <span className="stat-label">Radicados</span>
            </div>
          </div>
          
          <div className="stat-card facturados">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-number">{contadores.FACTURADO || 0}</span>
              <span className="stat-label">Facturados</span>
            </div>
          </div>
          
          <div className="stat-card total">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <span className="stat-number">{remisiones.length}</span>
              <span className="stat-label">Total</span>
            </div>
          </div>
          
          {hasAdminAccess && (
            <div className="stat-card admin">
              <div className="stat-icon">👑</div>
              <div className="stat-content">
                <span className="stat-number">ADMIN</span>
                <span className="stat-label">Acceso completo</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="module-content">
        {activeView === 'spreadsheet' ? (
          /* Vista de hoja de cálculo original */
          <div className="spreadsheet-section">
            <div className="section-header">
              <h2>📊 Hoja de Cálculo - Ingreso Masivo</h2>
              <p>
                Utiliza la interfaz tipo Google Sheets para ingresar múltiples remisiones 
                de forma rápida con validaciones en tiempo real.
              </p>
            </div>
            
            <RemisionesSpreadsheet 
              onNotification={showNotification}
            />
          </div>
        ) : (
          /* Vista consolidada mejorada */
          <div className="consolidated-section">
            <div className="section-header">
              <h2>📋 Vista Consolidada - Administración Completa</h2>
              <p>
                Administra todas las remisiones con funciones avanzadas: filtros, 
                ordenamiento, adjuntos, estados y consolidación de PDFs.
              </p>
            </div>

            <RemisionesTable
              onViewRemision={handleViewRemision}
              onEditRemision={handleEditRemision}
              onNotification={showNotification}
            />
          </div>
        )}
      </div>

      {/* Información del módulo */}
      <div className="module-info">
        <div className="info-grid">
          <div className="info-card">
            <h4>🔄 Estados de Remisión</h4>
            <p>
              <strong>GENERADO</strong> → <strong>PENDIENTE</strong> → <strong>PROFORMA</strong> → <strong>RADICADO</strong> → <strong>FACTURADO</strong>
            </p>
            <p>Estados especiales: CANCELADO, CORTESIA, GARANTIA, SIN_VINCULAR</p>
          </div>
          
          <div className="info-card">
            <h4>📎 Adjuntos Soportados</h4>
            <ul>
              <li><strong>Orden de Trabajo:</strong> PDF únicamente</li>
              <li><strong>Remisión Escaneada:</strong> PDF, JPG, PNG, WEBP</li>
              <li><strong>Informe Técnico:</strong> PDF o imágenes</li>
            </ul>
          </div>
          
          <div className="info-card">
            <h4>📄 PDF Consolidado</h4>
            <p>
              Orden de consolidación:<br />
              1. Orden de Trabajo<br />
              2. Remisión Escaneada<br />
              3. Informe Técnico
            </p>
            <p>Nomenclatura: <code>NO_ORDEN-MOVIL.pdf</code></p>
          </div>
          
          {hasAdminAccess && (
            <div className="info-card admin-info">
              <h4>👑 Funciones de Administrador</h4>
              <ul>
                <li>Eliminar remisiones</li>
                <li>Editar cualquier campo</li>
                <li>Acceso completo a todos los estados</li>
                <li>Gestión de adjuntos avanzada</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Loading overlay si es necesario */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="spinner"></div>
            <p>Cargando remisiones...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente envuelto con el proveedor de contexto de filtros
const EnhancedRemisionesConsolidadoWithFilters = () => {
  return (
    <FilterPersistenceProvider>
      <EnhancedRemisionesConsolidado />
    </FilterPersistenceProvider>
  );
};

export default EnhancedRemisionesConsolidadoWithFilters;