import React, { useState } from 'react';
import { addServicio, updateServicio } from '../services/serviciosService';
import { motion } from 'framer-motion';

const categorias = ['Instalación', 'Mantenimiento', 'Reparación', 'Otro'];

const initialState = {
  id_servicio: '',
  titulo: '',
  descripcion_actividad: '',
  categoria: '',
  costo: '',
  materiales_suministrados: '',
  recurso_humano_requerido: '',
  tiempo_estimado: '',
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
        initial={{ scale: 0.9, opacity: 0, y: 20 }} 
        animate={{ scale: 1, opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }} 
        style={{ 
          background: '#FFFFFF', /* Color blanco según manual */
          borderRadius: 16, /* Border-radius 16px según manual */
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
          padding: 20, /* Espaciado interno 16-20px según manual */
          minWidth: 500, 
          maxWidth: 600, 
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
          {initialData ? 'Editar servicio' : 'Agregar servicio'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>ID único del servicio *</label>
              <input 
                name="id_servicio" 
                placeholder="Ej: IN-MRC-SNR-02" 
                value={form.id_servicio} 
                onChange={handleChange} 
                required 
                style={inputStyle} 
                disabled={!!initialData}
                onFocus={(e) => {
                  e.target.style.borderColor = '#5DADE2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(93, 173, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#BDC3C7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Título del servicio *</label>
              <input 
                name="titulo" 
                placeholder="Ingrese el título del servicio" 
                value={form.titulo} 
                onChange={handleChange} 
                required 
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#5DADE2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(93, 173, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#BDC3C7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Descripción de la actividad *</label>
              <textarea 
                name="descripcion_actividad" 
                placeholder="Describa detalladamente la actividad a realizar" 
                value={form.descripcion_actividad} 
                onChange={handleChange} 
                required 
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#5DADE2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(93, 173, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#BDC3C7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Categoría *</label>
              <select 
                name="categoria" 
                value={form.categoria} 
                onChange={handleChange} 
                required 
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#5DADE2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(93, 173, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#BDC3C7';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <option value="">Selecciona categoría</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Costo *</label>
              <input 
                name="costo" 
                type="number" 
                placeholder="0" 
                value={form.costo} 
                onChange={handleChange} 
                required 
                style={inputStyle} 
                min={0}
                onFocus={(e) => {
                  e.target.style.borderColor = '#5DADE2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(93, 173, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#BDC3C7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Materiales suministrados</label>
              <input 
                name="materiales_suministrados" 
                placeholder="Detalle de materiales incluidos" 
                value={form.materiales_suministrados} 
                onChange={handleChange} 
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#5DADE2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(93, 173, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#BDC3C7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Recurso humano requerido</label>
              <input 
                name="recurso_humano_requerido" 
                placeholder="Personal necesario para la actividad" 
                value={form.recurso_humano_requerido} 
                onChange={handleChange} 
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = '#5DADE2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(93, 173, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#BDC3C7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Tiempo estimado (horas) *</label>
              <input 
                name="tiempo_estimado" 
                type="number" 
                placeholder="0" 
                value={form.tiempo_estimado} 
                onChange={handleChange} 
                required 
                style={inputStyle} 
                min={0} 
                step="0.1"
                onFocus={(e) => {
                  e.target.style.borderColor = '#5DADE2';
                  e.target.style.boxShadow = '0 0 0 3px rgba(93, 173, 226, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#BDC3C7';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          </div>
          {error && <div style={{ color: '#E74C3C', marginBottom: 16, padding: 12, background: '#FCF2F2', borderRadius: 8, border: '1px solid #F5B7B1' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginTop: 24 }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ 
                background: '#BDC3C7', /* Secundario según manual */
                color: '#2C3E50', /* Texto principal según manual */
                border: 'none', 
                borderRadius: 12, /* Botones redondeados según manual */
                padding: '12px 24px', 
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
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                background: loading ? '#95A5A6' : '#5DADE2', /* Primario según manual */
                color: '#FFFFFF', /* Blanco según manual */
                border: 'none', 
                borderRadius: 12, /* Botones redondeados según manual */
                padding: '12px 24px', 
                fontWeight: 600, /* Semibold según manual */
                fontSize: 14, /* Botones: 14px según manual */
                cursor: loading ? 'not-allowed' : 'pointer', 
                boxShadow: loading ? 'none' : '0 2px 8px rgba(93, 173, 226, 0.3)', 
                transition: 'all 0.3s',
                textTransform: 'uppercase', /* Uppercase según manual */
                letterSpacing: '0.5px',
                minHeight: 40, /* Altura mínima según manual */
                lineHeight: 1.5 /* Interlineado según manual */
              }}
              onMouseEnter={(e) => !loading && (e.target.style.boxShadow = '0 6px 20px rgba(93, 173, 226, 0.4)')}
              onMouseLeave={(e) => !loading && (e.target.style.boxShadow = '0 2px 8px rgba(93, 173, 226, 0.3)')}
            >
              {loading ? 'Guardando...' : 'Guardar servicio'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const inputStyle = {
  /* Inputs según manual */
  border: '2px solid #BDC3C7', /* Borde gris secundario según manual */
  borderRadius: 10,
  padding: '12px 16px',
  fontFamily: 'Poppins, Roboto, sans-serif',
  fontSize: 14, /* Texto general: 14-16px según manual */
  color: '#2C3E50', /* Texto principal según manual */
  outline: 'none',
  transition: 'all 0.3s',
  background: '#FFFFFF', /* Fondo blanco según manual */
  width: '100%',
  boxSizing: 'border-box',
  lineHeight: 1.5 /* Interlineado según manual */
};

const labelStyle = {
  /* Labels encima del input según manual */
  display: 'block',
  color: '#2C3E50', /* Texto principal según manual */
  fontWeight: 600, /* Semibold según manual */
  fontSize: 14, /* Texto general: 14px según manual */
  marginBottom: 8,
  fontFamily: 'Poppins, Roboto, sans-serif',
  lineHeight: 1.5 /* Interlineado según manual */
};

export default ServicioFormModal;
