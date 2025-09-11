import React from 'react';
import { motion } from 'framer-motion';

const estadoColors = {
  pendiente: '#E74C3C',
  proceso: '#F1C40F',
  finalizado: '#27AE60',
  entregado: '#5DADE2',
};


const ServicioCard = ({ servicio, onVer, onEditar, onEliminar }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    style={{
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      padding: 24,
      minWidth: 320,
      maxWidth: 360,
      flex: '1 1 320px',
      fontFamily: 'Poppins, Roboto, sans-serif',
      color: '#2C3E50',
      position: 'relative',
      marginBottom: 8
    }}
  >
    <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{servicio.titulo}</div>
    <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{servicio.descripcion_actividad}</div>
    <div style={{ fontSize: 13, color: '#5DADE2', marginBottom: 8 }}>Categoría: {servicio.categoria}</div>
    <div style={{ fontSize: 13, color: '#2C3E50', marginBottom: 8 }}>Costo: ${servicio.costo?.toLocaleString('es-CO') || '-'}</div>
    <div style={{ fontSize: 13, color: '#2C3E50', marginBottom: 8 }}>Materiales: {servicio.materiales_suministrados}</div>
    <div style={{ fontSize: 13, color: '#2C3E50', marginBottom: 8 }}>Recurso humano: {servicio.recurso_humano_requerido}</div>
    <div style={{ fontSize: 13, color: '#2C3E50', marginBottom: 8 }}>Tiempo estimado: {servicio.tiempo_estimado} h</div>
    <div style={{ fontSize: 13, color: '#2C3E50', marginBottom: 8 }}>ID: {servicio.id_servicio}</div>
    {servicio.estado && (
      <span style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: estadoColors[servicio.estado] || '#BDC3C7',
        color: '#fff',
        borderRadius: 12,
        padding: '4px 12px',
        fontWeight: 600,
        fontSize: 13,
        boxShadow: '0 1px 4px rgba(0,0,0,0.10)'
      }}>{servicio.estado.charAt(0).toUpperCase() + servicio.estado.slice(1)}</span>
    )}
    <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
      <button onClick={() => onVer(servicio)} style={btnStyle}>Ver</button>
      <button onClick={() => onEditar(servicio)} style={{ ...btnStyle, background: '#F1C40F', color: '#2C3E50' }}>Editar</button>
      <button onClick={() => onEliminar(servicio)} style={{ ...btnStyle, background: '#E74C3C' }}>Eliminar</button>
    </div>
  </motion.div>
);

const btnStyle = {
  background: '#5DADE2',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '6px 14px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,123,255,0.08)',
  transition: 'transform 0.2s',
};

export default ServicioCard;
