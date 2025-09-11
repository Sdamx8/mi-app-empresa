import React from 'react';
import { motion } from 'framer-motion';

const ConfirmDeleteModal = ({ open, onClose, onConfirm, servicio }) => {
  if (!open || !servicio) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(44,62,80,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: 32, minWidth: 340, maxWidth: 420 }}>
        <h2 style={{ color: '#E74C3C', fontFamily: 'Poppins, Roboto, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 16 }}>¿Eliminar servicio?</h2>
        <div style={{ color: '#2C3E50', fontSize: 15, marginBottom: 24 }}>
          ¿Estás seguro de que deseas eliminar el servicio <b>{servicio.titulo}</b>?
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onConfirm} style={{ background: '#E74C3C', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Eliminar</button>
          <button onClick={onClose} style={{ background: '#BDC3C7', color: '#2C3E50', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancelar</button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmDeleteModal;
