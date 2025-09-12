import React from 'react';
import { motion } from 'framer-motion';

const ServicioDetailModal = ({ open, servicio, onClose }) => {
  if (!open || !servicio) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(44,62,80,0.15)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '2rem' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0, y: -30 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ background: '#fff', borderRadius: 20, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', padding: 40, minWidth: 500, maxWidth: 650, maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ color: '#5DADE2', fontFamily: 'Poppins, Roboto, sans-serif', fontWeight: 700, fontSize: 26, marginBottom: 24, textAlign: 'center' }}>Detalle del servicio</h2>
        
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
          <button onClick={onClose} style={{ background: '#5DADE2', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 32px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 2px 8px rgba(93, 173, 226, 0.3)', transition: 'all 0.2s' }}>Cerrar</button>
        </div>
      </motion.div>
    </div>
  );
};

const labelStyle = {
  color: '#5DADE2',
  fontWeight: 600,
  fontSize: 13,
  marginBottom: 4,
  display: 'block',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  fontFamily: 'Poppins, Roboto, sans-serif'
};

const valueStyle = {
  color: '#2C3E50',
  fontSize: 15,
  lineHeight: 1.4,
  fontFamily: 'Poppins, Roboto, sans-serif'
};

const fieldContainerStyle = {
  background: '#F8F9FA',
  padding: 16,
  borderRadius: 12,
  border: '1px solid #E8F4FD'
};

export default ServicioDetailModal;
