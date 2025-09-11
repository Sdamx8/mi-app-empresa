/**
 * 🎉 NOTIFICACIÓN DE ÉXITO - NUEVO MÓDULO DISPONIBLE
 * ================================================
 * Componente para notificar al usuario sobre nuevas funcionalidades
 */

import React, { useState, useEffect } from 'react';

const SuccessNotification = ({ message, onClose, duration = 5000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#28a745',
      color: 'white',
      padding: '1rem 1.5rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
      zIndex: 9999,
      maxWidth: '400px',
      fontSize: '0.9rem',
      animation: 'slideInRight 0.3s ease-out',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}>
      <span style={{ fontSize: '1.2rem' }}>✅</span>
      <div>
        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
          ¡Nueva funcionalidad disponible!
        </div>
        <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
          {message}
        </div>
      </div>
      <button
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: '1.2rem',
          cursor: 'pointer',
          padding: '0.25rem',
          marginLeft: '0.5rem',
          borderRadius: '4px',
          opacity: 0.8
        }}
        onMouseEnter={(e) => e.target.style.opacity = '1'}
        onMouseLeave={(e) => e.target.style.opacity = '0.8'}
      >
        ×
      </button>
      
      {/* Estilos CSS inline para animaciones */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessNotification;
