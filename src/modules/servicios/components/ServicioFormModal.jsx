import React, { useState } from 'react';
import { addServicio, updateServicio } from '../services/serviciosService';
import { motion } from 'framer-motion';

const categorias = ['Instalación', 'Mantenimiento', 'Reparación', 'Otro'];
const estados = ['pendiente', 'proceso', 'finalizado', 'entregado'];

const initialState = {
  id_servicio: '',
  titulo: '',
  descripcion_actividad: '',
  categoria: '',
  costo: '',
  materiales_suministrados: '',
  recurso_humano_requerido: '',
  tiempo_estimado: '',
  estado: 'pendiente',
};

const ServicioFormModal = ({ open, onClose, onSuccess, initialData }) => {
  const [form, setForm] = useState(initialData || initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const getUsuario = () => {
    // Intenta obtener email del usuario autenticado (ajusta según tu auth)
    if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
      return window.auth.currentUser.email;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.email) return user.email;
    } catch {}
    return 'sistema';
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const usuario = getUsuario();
    try {
      if (initialData) {
        await updateServicio(form, usuario);
      } else {
        await addServicio(form, usuario);
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(44,62,80,0.15)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.2 }} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: 32, minWidth: 340, maxWidth: 420 }}>
        <h2 style={{ color: '#5DADE2', fontFamily: 'Poppins, Roboto, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 16 }}>{initialData ? 'Editar servicio' : 'Agregar servicio'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input name="id_servicio" placeholder="ID único (ej: IN-MRC-SNR-02)" value={form.id_servicio} onChange={handleChange} required style={inputStyle} disabled={!!initialData} />
            <input name="titulo" placeholder="Título del servicio" value={form.titulo} onChange={handleChange} required style={inputStyle} />
            <textarea name="descripcion_actividad" placeholder="Descripción de la actividad" value={form.descripcion_actividad} onChange={handleChange} required style={{ ...inputStyle, minHeight: 60 }} />
            <select name="categoria" value={form.categoria} onChange={handleChange} required style={inputStyle}>
              <option value="">Selecciona categoría</option>
              {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input name="costo" type="number" placeholder="Costo" value={form.costo} onChange={handleChange} required style={inputStyle} min={0} />
            <input name="materiales_suministrados" placeholder="Materiales suministrados" value={form.materiales_suministrados} onChange={handleChange} style={inputStyle} />
            <input name="recurso_humano_requerido" placeholder="Recurso humano requerido" value={form.recurso_humano_requerido} onChange={handleChange} style={inputStyle} />
            <input name="tiempo_estimado" type="number" placeholder="Tiempo estimado (horas)" value={form.tiempo_estimado} onChange={handleChange} required style={inputStyle} min={0} />
            <select name="estado" value={form.estado} onChange={handleChange} required style={inputStyle}>
              {estados.map(est => <option key={est} value={est}>{est.charAt(0).toUpperCase() + est.slice(1)}</option>)}
            </select>
          </div>
          {error && <div style={{ color: '#E74C3C', marginTop: 12 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="submit" disabled={loading} style={{ background: '#5DADE2', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,123,255,0.10)', transition: 'transform 0.2s' }}>{loading ? 'Guardando...' : 'Guardar'}</button>
            <button type="button" onClick={onClose} style={{ background: '#BDC3C7', color: '#2C3E50', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const inputStyle = {
  border: '1px solid #BDC3C7',
  borderRadius: 8,
  padding: 8,
  fontFamily: 'Poppins, Roboto, sans-serif',
  fontSize: 14,
  color: '#2C3E50',
  outline: 'none',
  marginBottom: 0,
};

export default ServicioFormModal;
