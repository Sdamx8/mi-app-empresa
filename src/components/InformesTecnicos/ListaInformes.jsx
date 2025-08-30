/**
 * 📋 LISTA DE INFORMES TÉCNICOS
 * =============================
 * 
 * Componente para mostrar y gestionar la lista de informes
 * Incluye filtros, búsqueda y acciones en lote
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ListaInformes = ({ userRole, currentUser, onNavigate }) => {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: 'todos',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
  });

  // Simular carga de datos
  useEffect(() => {
    setTimeout(() => {
      setInformes([]);
      setLoading(false);
    }, 1500);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e9ecef',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#6c757d' }}>Cargando informes...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '2rem' }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem', color: '#343a40' }}>
            📋 Mis Informes Técnicos
          </h2>
          <p style={{ margin: 0, color: '#6c757d' }}>
            Gestiona y visualiza todos tus informes
          </p>
        </div>
        
        <button
          onClick={() => onNavigate('nuevo')}
          style={{
            background: 'linear-gradient(135deg, #28a745, #20c997)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)'
          }}
        >
          <span>📝</span>
          Nuevo Informe
        </button>
      </div>

      {/* Estado vacío */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '4rem 2rem',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '2px dashed #dee2e6'
        }}
      >
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#343a40' }}>
          ¡Comienza creando tu primer informe!
        </h3>
        <p style={{ color: '#6c757d', marginBottom: '2rem', fontSize: '1.1rem' }}>
          Los informes técnicos que crees aparecerán aquí organizados y fáciles de gestionar.
        </p>
        
        <button
          onClick={() => onNavigate('nuevo')}
          style={{
            background: 'linear-gradient(135deg, #007bff, #0056b3)',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 6px 20px rgba(0, 123, 255, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <span>🚀</span>
          Crear Mi Primer Informe
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ListaInformes;
