/**
 * ⚙️ CONFIGURACIÓN MÓDULO INFORMES TÉCNICOS
 * ==========================================
 * 
 * Configuraciones y ajustes del módulo
 * Solo accesible para administradores
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ConfiguracionModule = ({ userRole, currentUser }) => {
  const [configuraciones, setConfiguraciones] = useState({
    autoApproval: false,
    notificaciones: true,
    templatesPersonalizados: true,
    backupAutomatico: true
  });

  const opciones = [
    {
      key: 'autoApproval',
      titulo: 'Auto-aprobación',
      descripcion: 'Los informes se aprueban automáticamente al completarse',
      icono: '✅'
    },
    {
      key: 'notificaciones',
      titulo: 'Notificaciones',
      descripcion: 'Enviar notificaciones por email cuando se actualice el estado',
      icono: '📧'
    },
    {
      key: 'templatesPersonalizados',
      titulo: 'Templates Personalizados',
      descripcion: 'Permitir el uso de plantillas personalizadas para PDFs',
      icono: '🎨'
    },
    {
      key: 'backupAutomatico',
      titulo: 'Backup Automático',
      descripcion: 'Realizar copias de seguridad automáticas de los informes',
      icono: '💾'
    }
  ];

  const handleToggle = (key) => {
    setConfiguraciones(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Verificar si el usuario tiene permisos de administrador
  if (userRole !== 'directivo' && userRole !== 'administrativo') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        flexDirection: 'column',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#343a40' }}>
          Acceso Restringido
        </h3>
        <p style={{ color: '#6c757d' }}>
          Esta sección está disponible solo para administradores
        </p>
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
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem', color: '#343a40' }}>
          ⚙️ Configuración del Módulo
        </h2>
        <p style={{ margin: 0, color: '#6c757d' }}>
          Ajusta las configuraciones generales del módulo de informes técnicos
        </p>
      </div>

      <div style={{
        display: 'grid',
        gap: '1.5rem',
        maxWidth: '800px'
      }}>
        {opciones.map((opcion, index) => (
          <motion.div
            key={opcion.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e9ecef',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem'
            }}
          >
            <div style={{ fontSize: '2.5rem' }}>{opcion.icono}</div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: '#343a40' }}>
                {opcion.titulo}
              </h3>
              <p style={{ margin: 0, color: '#6c757d', fontSize: '0.95rem' }}>
                {opcion.descripcion}
              </p>
            </div>

            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '60px',
              height: '34px'
            }}>
              <input
                type="checkbox"
                checked={configuraciones[opcion.key]}
                onChange={() => handleToggle(opcion.key)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: configuraciones[opcion.key] ? '#007bff' : '#ccc',
                transition: 'all 0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: configuraciones[opcion.key] ? '30px' : '4px',
                  bottom: '4px',
                  backgroundColor: 'white',
                  transition: 'all 0.4s',
                  borderRadius: '50%'
                }} />
              </span>
            </label>
          </motion.div>
        ))}
      </div>

      {/* Sección de estadísticas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        style={{
          marginTop: '3rem',
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e9ecef'
        }}
      >
        <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.3rem', color: '#343a40' }}>
          📊 Estadísticas del Módulo
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#007bff' }}>0</div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Total Informes</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#28a745' }}>0</div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Usuarios Activos</div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💾</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ffc107' }}>0 MB</div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>Almacenamiento</div>
          </div>
        </div>
      </motion.div>

      {/* Botón de guardado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        style={{ marginTop: '2rem', textAlign: 'center' }}
      >
        <button
          onClick={() => {
            alert('¡Configuraciones guardadas exitosamente!');
          }}
          style={{
            background: 'linear-gradient(135deg, #28a745, #20c997)',
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
            boxShadow: '0 6px 20px rgba(40, 167, 69, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          <span>💾</span>
          Guardar Configuraciones
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ConfiguracionModule;
