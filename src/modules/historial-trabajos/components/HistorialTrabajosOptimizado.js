/**
 * Componente principal del módulo Historial de Trabajos
 * 
 * Características:
 * - Navegación por pestañas entre Consultar Móvil y Administrar Remisiones
 * - Diseño ERP profesional con Material Design
 * - Integración con hooks de empleado y autenticación
 */

import React, { useState } from 'react';
import { useEmpleadoAuth } from '../hooks/useEmpleadoAuth';
import AdministrarRemisiones from './AdministrarRemisiones';
import ConsultarMovil from './ConsultarMovil';
import './Historial.css';

const HistorialTrabajosOptimizado = () => {
  // Estado para la navegación por pestañas
  const [activeTab, setActiveTab] = useState('buscar');

  // Hook de autenticación y datos del empleado
  const { empleado, rol } = useEmpleadoAuth();

  return (
    <div className="historial-container">
      {/* Header del módulo */}
      <div className="historial-header">
        <div className="header-content">
          <div className="header-title">
            <h1>📋 Historial de Trabajos</h1>
            <p>Gestión y consulta de remisiones de trabajo</p>
          </div>
          
          {/* Pestañas de navegación */}
          <div className="tabs-navigation">
            <button
              className={`tab-button ${activeTab === 'buscar' ? 'active' : ''}`}
              onClick={() => setActiveTab('buscar')}
            >
              🔍 Consultar Móvil
            </button>
            <button
              className={`tab-button ${activeTab === 'administrar' ? 'active' : ''}`}
              onClick={() => setActiveTab('administrar')}
            >
              ⚙️ Administrar Remisiones
            </button>
          </div>
          
          {empleado && (
            <div className="header-user-info">
              <div className="user-badge">
                <span className="user-name">{empleado.identificacion}</span>
                <span className="user-role">{rol}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido según pestaña activa */}
      {activeTab === 'buscar' ? (
        /* Pestaña de Consultar Móvil */
        <ConsultarMovil />
      ) : (
        /* Pestaña de Administrar Remisiones */
        <AdministrarRemisiones />
      )}
    </div>
  );
};

export default HistorialTrabajosOptimizado;
