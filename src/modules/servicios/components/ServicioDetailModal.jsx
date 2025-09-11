import React from 'react';
import { motion } from 'framer-motion';

const ServicioDetailModal = ({ open, servicio, onClose }) => {
  if (!open || !servicio) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(44,62,80,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: 32, minWidth: 340, maxWidth: 420 }}>
        <h2 style={{ color: '#5DADE2', fontFamily: 'Poppins, Roboto, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 16 }}>Detalle del servicio</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, color: '#2C3E50' }}>
          <b>ID:</b> {servicio.id_servicio}
          <b>Título:</b> {servicio.titulo}
          <b>Descripción:</b> {servicio.descripcion_actividad}
          <b>Categoría:</b> {servicio.categoria}
          <b>Costo:</b> ${servicio.costo?.toLocaleString('es-CO') || '-'}
          <b>Materiales:</b> {servicio.materiales_suministrados}
          <b>Recurso humano:</b> {servicio.recurso_humano_requerido}
          <b>Tiempo estimado:</b> {servicio.tiempo_estimado} h
          <b>Estado:</b> {servicio.estado}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={onClose} style={{ background: '#BDC3C7', color: '#2C3E50', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cerrar</button>
        </div>
      </motion.div>
    </div>
  );
};

export default ServicioDetailModal;
