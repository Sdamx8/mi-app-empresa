/**
 * 📋 FORMULARIO REMISIÓN PLANO - DISEÑO ULTRA SIMPLE
 * ==================================================
 * Formulario completamente plano sin secciones colapsables
 * CSS Grid optimizado para desktop
 * Sin animaciones complejas
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './FormularioRemisionPlano.css';

const FormularioRemisionPlano = ({ remision, estadosDisponibles, onSave, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Helper para convertir fechas
  const convertirFechaParaInput = (fecha) => {
    if (!fecha) return '';
    try {
      let fechaObj;
      if (fecha && typeof fecha.toDate === 'function') {
        fechaObj = fecha.toDate();
      } else if (fecha instanceof Date) {
        fechaObj = fecha;
      } else {
        fechaObj = new Date(fecha);
      }
      
      if (isNaN(fechaObj.getTime())) return '';
      return fechaObj.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  // Función para inicializar datos del formulario
  const inicializarFormData = (remisionData) => {
    console.log('🔍 Datos de remisión recibidos:', remisionData);
    
    const datos = {
      remision: remisionData.remision || '',
      movil: remisionData.movil || '',
      no_orden: remisionData.no_orden || '',
      estado: remisionData.estado || '',
      servicio1: remisionData.servicio1 || '',
      servicio2: remisionData.servicio2 || '',
      servicio3: remisionData.servicio3 || '',
      servicio4: remisionData.servicio4 || '',
      servicio5: remisionData.servicio5 || '',
      fecha_remision: convertirFechaParaInput(remisionData.fecha_remision),
      fecha_maximo: convertirFechaParaInput(remisionData.fecha_maximo),
      fecha_bit_prof: convertirFechaParaInput(remisionData.fecha_bit_prof),
      tecnico1: remisionData.tecnico1 || '',
      tecnico2: remisionData.tecnico2 || '',
      tecnico3: remisionData.tecnico3 || '',
      autorizo: remisionData.autorizo || '',
      genero: remisionData.genero || '',
      une: remisionData.une || '',
      carroceria: remisionData.carroceria || '',
      radicacion: remisionData.radicacion || '',
      no_id_bit: remisionData.no_id_bit || '',
      no_fact_elect: remisionData.no_fact_elect || '',
      subtotal: remisionData.subtotal || '',
      total: remisionData.total || '',
      observaciones: remisionData.observaciones || ''
    };
    
    console.log('📝 Datos procesados para el formulario:', datos);
    return datos;
  };

  // Estado del formulario
  const [formData, setFormData] = useState(() => inicializarFormData(remision));

  // Actualizar formulario cuando cambie la remisión
  useEffect(() => {
    console.log('🔄 Actualizando formulario con nueva remisión:', remision);
    setFormData(inicializarFormData(remision));
  }, [remision]);



  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.remision?.trim()) {
      newErrors.remision = 'El número de remisión es requerido';
    }
    
    if (!formData.movil?.trim()) {
      newErrors.movil = 'El móvil es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }
    
    setSaving(true);
    try {
      const datosActualizados = { ...formData };
      
      // Convertir campos numéricos
      if (datosActualizados.subtotal) {
        datosActualizados.subtotal = parseFloat(datosActualizados.subtotal) || 0;
      }
      if (datosActualizados.total) {
        datosActualizados.total = parseFloat(datosActualizados.total) || 0;
      }
      
      await onSave(datosActualizados);
      toast.success('Remisión actualizada correctamente');
    } catch (error) {
      console.error('Error guardando remisión:', error);
      toast.error('Error al guardar la remisión');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="overlay-plano" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-plano">
        
        {/* Header */}
        <div className="header-plano">
          <h2 className="titulo-plano">Editar Remisión</h2>
          <button type="button" className="boton-cerrar" onClick={onClose} disabled={saving}>
            <FaTimes />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="formulario-plano">
          
          {/* Información Básica */}
          <div className="seccion-plana">
            <h3 className="titulo-seccion">📄 Información Básica</h3>
            <div className="campos-grid">
              <div className="campo">
                <label className="etiqueta">Número de Remisión *</label>
                <input
                  type="text"
                  value={formData.remision}
                  onChange={(e) => handleInputChange('remision', e.target.value)}
                  className={`entrada ${errors.remision ? 'error' : ''}`}
                  placeholder="Ej: REM-2024-001"
                />
                {errors.remision && <span className="error-mensaje">{errors.remision}</span>}
              </div>
              
              <div className="campo">
                <label className="etiqueta">Móvil *</label>
                <input
                  type="text"
                  value={formData.movil}
                  onChange={(e) => handleInputChange('movil', e.target.value)}
                  className={`entrada ${errors.movil ? 'error' : ''}`}
                  placeholder="Número de móvil"
                />
                {errors.movil && <span className="error-mensaje">{errors.movil}</span>}
              </div>

              <div className="campo">
                <label className="etiqueta">No. Orden</label>
                <input
                  type="text"
                  value={formData.no_orden}
                  onChange={(e) => handleInputChange('no_orden', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="entrada"
                >
                  <option value="">Seleccionar estado...</option>
                  {estadosDisponibles.map(estado => (
                    <option key={estado.value || estado} value={estado.value || estado}>
                      {estado.label || estado}
                    </option>
                  ))}
                </select>
              </div>

              <div className="campo">
                <label className="etiqueta">Fecha Remisión</label>
                <input
                  type="date"
                  value={formData.fecha_remision}
                  onChange={(e) => handleInputChange('fecha_remision', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Fecha Máximo</label>
                <input
                  type="date"
                  value={formData.fecha_maximo}
                  onChange={(e) => handleInputChange('fecha_maximo', e.target.value)}
                  className="entrada"
                />
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="seccion-plana">
            <h3 className="titulo-seccion">🔧 Servicios Solicitados</h3>
            <div className="campos-grid-5">
              {[1, 2, 3, 4, 5].map(num => (
                <div key={num} className="campo">
                  <label className="etiqueta">Servicio {num}</label>
                  <input
                    type="text"
                    value={formData[`servicio${num}`]}
                    onChange={(e) => handleInputChange(`servicio${num}`, e.target.value)}
                    className="entrada"
                    placeholder={`Servicio ${num}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Personal */}
          <div className="seccion-plana">
            <h3 className="titulo-seccion">👤 Personal Asignado</h3>
            <div className="campos-grid">
              <div className="campo">
                <label className="etiqueta">Técnico 1</label>
                <input
                  type="text"
                  value={formData.tecnico1}
                  onChange={(e) => handleInputChange('tecnico1', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Técnico 2</label>
                <input
                  type="text"
                  value={formData.tecnico2}
                  onChange={(e) => handleInputChange('tecnico2', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Técnico 3</label>
                <input
                  type="text"
                  value={formData.tecnico3}
                  onChange={(e) => handleInputChange('tecnico3', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Autorizado por</label>
                <input
                  type="text"
                  value={formData.autorizo}
                  onChange={(e) => handleInputChange('autorizo', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Generado por</label>
                <input
                  type="text"
                  value={formData.genero}
                  onChange={(e) => handleInputChange('genero', e.target.value)}
                  className="entrada"
                />
              </div>
            </div>
          </div>

          {/* Información Técnica */}
          <div className="seccion-plana">
            <h3 className="titulo-seccion">⚙️ Información Técnica</h3>
            <div className="campos-grid">
              <div className="campo">
                <label className="etiqueta">UNE</label>
                <input
                  type="text"
                  value={formData.une}
                  onChange={(e) => handleInputChange('une', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Carrocería</label>
                <input
                  type="text"
                  value={formData.carroceria}
                  onChange={(e) => handleInputChange('carroceria', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Radicación</label>
                <input
                  type="text"
                  value={formData.radicacion}
                  onChange={(e) => handleInputChange('radicacion', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">No. ID BIT</label>
                <input
                  type="text"
                  value={formData.no_id_bit}
                  onChange={(e) => handleInputChange('no_id_bit', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">No. Fact. Elect.</label>
                <input
                  type="text"
                  value={formData.no_fact_elect}
                  onChange={(e) => handleInputChange('no_fact_elect', e.target.value)}
                  className="entrada"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Fecha BIT Prof.</label>
                <input
                  type="date"
                  value={formData.fecha_bit_prof}
                  onChange={(e) => handleInputChange('fecha_bit_prof', e.target.value)}
                  className="entrada"
                />
              </div>
            </div>
          </div>

          {/* Información Financiera */}
          <div className="seccion-plana">
            <h3 className="titulo-seccion">💰 Información Financiera</h3>
            <div className="campos-grid-2">
              <div className="campo">
                <label className="etiqueta">Subtotal</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.subtotal}
                  onChange={(e) => handleInputChange('subtotal', e.target.value)}
                  className="entrada"
                  placeholder="0.00"
                />
              </div>

              <div className="campo">
                <label className="etiqueta">Total</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total}
                  onChange={(e) => handleInputChange('total', e.target.value)}
                  className="entrada"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="seccion-plana">
            <h3 className="titulo-seccion">📝 Observaciones</h3>
            <div className="campo-completo">
              <label className="etiqueta">Observaciones Adicionales</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                rows={3}
                className="entrada"
                placeholder="Información adicional sobre la remisión..."
              />
            </div>
          </div>

          {/* Botones */}
          <div className="botones-accion">
            <button type="button" onClick={onClose} className="boton-cancelar" disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="boton-guardar" disabled={saving}>
              {saving && <div className="spinner-pequeño"></div>}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};

export default FormularioRemisionPlano;