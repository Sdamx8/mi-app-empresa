import React from 'react';
import { motion } from 'framer-motion';

const ConfirmDeleteModal = ({ open, onClose, onConfirm, servicio }) => {
  if (!open || !servicio) return null;
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(44,62,80,0.15)', 
      zIndex: 1000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }} 
        style={{ 
          background: '#FFFFFF', /* Blanco según manual */
          borderRadius: 16, /* Border-radius 16px según manual */
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)', 
          padding: 20, /* Espaciado interno 16-20px según manual */
          minWidth: 340, 
          maxWidth: 420,
          border: '1px solid #BDC3C7' /* Borde secundario según manual */
        }}>
        <h2 style={{ 
          color: '#E74C3C', /* Color peligro */
          fontFamily: 'Poppins, Roboto, sans-serif', 
          fontWeight: 700, /* Bold para H1 según manual */
          fontSize: 22, /* H2-H3: 16-18px ajustado para modal según manual */
          marginBottom: 16,
          lineHeight: 1.5 /* Interlineado según manual */
        }}>
          ¿Eliminar servicio?
        </h2>
        <div style={{ 
          color: '#2C3E50', /* Texto principal según manual */
          fontSize: 15, /* Texto general: 14-16px según manual */
          marginBottom: 24,
          lineHeight: 1.5 /* Interlineado según manual */
        }}>
          ¿Estás seguro de que deseas eliminar el servicio <b>{servicio.titulo}</b>?
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={onConfirm} 
            style={{ 
              background: '#E74C3C', /* Color peligro */
              color: '#FFFFFF', /* Blanco según manual */
              border: 'none', 
              borderRadius: 12, /* Botones redondeados según manual */
              padding: '12px 20px', 
              fontWeight: 600, /* Semibold según manual */
              fontSize: 14, /* Botones: 14px según manual */
              cursor: 'pointer',
              transition: 'all 0.3s',
              textTransform: 'uppercase', /* Uppercase según manual */
              letterSpacing: '0.5px',
              minHeight: 40, /* Altura mínima según manual */
              lineHeight: 1.5 /* Interlineado según manual */
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 12px rgba(231, 76, 60, 0.4)'}
            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
          >
            Eliminar
          </button>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#BDC3C7', /* Secundario según manual */
              color: '#2C3E50', /* Texto principal según manual */
              border: 'none', 
              borderRadius: 12, /* Botones redondeados según manual */
              padding: '12px 20px', 
              fontWeight: 600, /* Semibold según manual */
              fontSize: 14, /* Botones: 14px según manual */
              cursor: 'pointer',
              transition: 'all 0.3s',
              textTransform: 'uppercase', /* Uppercase según manual */
              letterSpacing: '0.5px',
              minHeight: 40, /* Altura mínima según manual */
              lineHeight: 1.5 /* Interlineado según manual */
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 12px rgba(189, 195, 199, 0.4)'}
            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
          >
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmDeleteModal;
