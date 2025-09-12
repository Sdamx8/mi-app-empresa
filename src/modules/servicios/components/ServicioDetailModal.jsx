import React from 'react';
import { motion } from 'framer-motion';

const ServicioDetailModal = ({ open, servicio, onClose }) => {
  if (!open || !servicio) return null;
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(44,62,80,0.15)', 
      zIndex: 1000, 
      display: 'flex', 
      alignItems: 'flex-start', 
      justifyContent: 'center', 
      paddingTop: '2rem' 
    }}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }} 
        style={{ 
          background: '#FFFFFF', /* Blanco según manual */
          borderRadius: 16, /* Border-radius 16px según manual */
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
          padding: 20, /* Espaciado interno 16-20px según manual */
          minWidth: 500, 
          maxWidth: 650, 
          maxHeight: '90vh', 
          overflowY: 'auto',
          border: '1px solid #BDC3C7' /* Borde secundario según manual */
        }}>
        <h2 style={{ 
          color: '#2C3E50', /* Texto principal según manual */
          fontFamily: 'Poppins, Roboto, sans-serif', 
          fontWeight: 700, /* Bold para H1 según manual */
          fontSize: 24, /* H1: 20-24px según manual */
          marginBottom: 24, 
          textAlign: 'center',
          lineHeight: 1.5 /* Interlineado según manual */
        }}>
          Detalle del servicio
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>ID del servicio</label>
              <div style={valueStyle}>{servicio.id_servicio || 'No especificado'}</div>
            </div>
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Título</label>
              <div style={valueStyle}>{servicio.titulo || 'No especificado'}</div>
            </div>
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Descripción</label>
              <div style={valueStyle}>{servicio.descripcion_actividad || 'No especificado'}</div>
            </div>
          </div>
          
          <div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Categoría</label>
              <div style={valueStyle}>{servicio.categoria || 'No especificado'}</div>
            </div>
          </div>
          
          <div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Costo</label>
              <div style={{...valueStyle, color: '#27AE60', fontWeight: 600}}>
                {servicio.costo ? `$${Number(servicio.costo).toLocaleString('es-CO')}` : 'No especificado'}
              </div>
            </div>
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Materiales suministrados</label>
              <div style={valueStyle}>{servicio.materiales_suministrados || 'No especificado'}</div>
            </div>
          </div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Recurso humano requerido</label>
              <div style={valueStyle}>{servicio.recurso_humano_requerido || 'No especificado'}</div>
            </div>
          </div>
          
          <div>
            <div style={fieldContainerStyle}>
              <label style={labelStyle}>Tiempo estimado</label>
              <div style={{...valueStyle, color: '#F39C12', fontWeight: 600}}>
                {servicio.tiempo_estimado ? `${servicio.tiempo_estimado} horas` : 'No especificado'}
              </div>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#5DADE2', /* Primario según manual */
              color: '#FFFFFF', /* Blanco según manual */
              border: 'none', 
              borderRadius: 12, /* Botones redondeados según manual */
              padding: '12px 32px', 
              fontWeight: 600, /* Semibold según manual */
              fontSize: 14, /* Botones: 14px según manual */
              cursor: 'pointer', 
              boxShadow: '0 2px 8px rgba(93, 173, 226, 0.3)', 
              transition: 'all 0.3s',
              textTransform: 'uppercase', /* Uppercase según manual */
              letterSpacing: '0.5px',
              minHeight: 40, /* Altura mínima según manual */
              lineHeight: 1.5 /* Interlineado según manual */
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = '0 6px 20px rgba(93, 173, 226, 0.4)'}
            onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 8px rgba(93, 173, 226, 0.3)'}
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const labelStyle = {
  /* Labels según manual */
  color: '#2C3E50', /* Texto principal según manual */
  fontWeight: 600, /* Semibold según manual */
  fontSize: 14, /* Texto general: 14px según manual */
  marginBottom: 8,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontFamily: 'Poppins, Roboto, sans-serif',
  lineHeight: 1.5 /* Interlineado según manual */
};

const valueStyle = {
  /* Valores según manual */
  color: '#2C3E50', /* Texto principal según manual */
  fontSize: 15, /* Texto general: 14-16px según manual */
  lineHeight: 1.5, /* Interlineado según manual */
  fontFamily: 'Poppins, Roboto, sans-serif'
};

const fieldContainerStyle = {
  /* Contenedores según manual */
  background: '#F8F9FA', /* Fondo general según manual */
  padding: 16, /* Espaciado interno 16-20px según manual */
  borderRadius: 12, /* Forma redondeada según manual */
  border: '1px solid #BDC3C7' /* Borde secundario según manual */
};

export default ServicioDetailModal;
