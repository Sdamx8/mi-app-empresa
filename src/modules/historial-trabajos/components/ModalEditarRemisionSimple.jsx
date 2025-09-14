/**
 * 🔧 MODAL EDITAR REMISIÓN SIMPLIFICADO
 * =====================================
 * Formulario plano sin secciones colapsables
 * Optimizado para desktop con mejor UX
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  FaTimes, FaFileAlt, FaTools, FaUserTie, 
  FaCog, FaDollarSign, FaClipboardList 
} from 'react-icons/fa';
import { db } from '../../../core/config/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import './ModalEditarRemisionSimple.css';

const ModalEditarRemisionSimple = ({ remision, estadosDisponibles, onSave, onClose }) => {
  const [servicios, setServicios] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
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

  // Estado del formulario
  const [formData, setFormData] = useState({
    remision: remision.remision || '',
    movil: remision.movil || '',
    no_orden: remision.no_orden || '',
    estado: remision.estado || '',
    servicio1: remision.servicio1 || '',
    servicio2: remision.servicio2 || '',
    servicio3: remision.servicio3 || '',
    servicio4: remision.servicio4 || '',
    servicio5: remision.servicio5 || '',
    fecha_remision: convertirFechaParaInput(remision.fecha_remision),
    fecha_maximo: convertirFechaParaInput(remision.fecha_maximo),
    fecha_bit_prof: convertirFechaParaInput(remision.fecha_bit_prof),
    tecnico1: remision.tecnico1 || '',
    tecnico2: remision.tecnico2 || '',
    tecnico3: remision.tecnico3 || '',
    autorizo: remision.autorizo || '',
    genero: remision.genero || '',
    une: remision.une || '',
    carroceria: remision.carroceria || '',
    radicacion: remision.radicacion || '',
    no_id_bit: remision.no_id_bit || '',
    no_fact_elect: remision.no_fact_elect || '',
    subtotal: remision.subtotal || '',
    total: remision.total || '',
    observaciones: remision.observaciones || ''
  });

  // Cargar servicios de Firestore
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        const serviciosSnapshot = await getDocs(collection(db, 'servicios'));
        const serviciosData = serviciosSnapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().titulo || doc.data().nombre || doc.data().servicio || doc.id
        }));
        setServicios(serviciosData);
      } catch (error) {
        console.error('Error cargando servicios:', error);
        toast.error('Error al cargar servicios');
      } finally {
        setLoadingData(false);
      }
    };

    cargarServicios();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
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
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave(formData);
      toast.success('Remisión actualizada exitosamente');
      onClose();
    } catch (error) {
      console.error('Error guardando remisión:', error);
      toast.error('Error al guardar la remisión');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay-simple" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container-simple">
        
        {/* Header */}
        <div className="modal-header-simple">
          <div className="modal-title-simple">
            <FaFileAlt className="title-icon" />
            Editar Remisión
          </div>
          <button 
            className="modal-close-simple" 
            onClick={onClose}
            disabled={saving}
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form-simple">
          
          {/* Información Básica */}
          <div className="section-simple">
            <div className="section-header-simple">
              <FaFileAlt className="section-icon-simple" />
              <span>Información Básica</span>
            </div>
            
            <div className="form-row-simple">
              <div className="form-group-simple">
                <label className="form-label-simple">
                  Número de Remisión <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.remision}
                  onChange={(e) => handleInputChange('remision', e.target.value)}
                  className={`form-input-simple ${errors.remision ? 'error' : ''}`}
                  placeholder="Ej: REM-2024-001"
                />
                {errors.remision && <span className="error-text">{errors.remision}</span>}
              </div>
              
              <div className="form-group-simple">
                <label className="form-label-simple">
                  Móvil <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.movil}
                  onChange={(e) => handleInputChange('movil', e.target.value)}
                  className={`form-input-simple ${errors.movil ? 'error' : ''}`}
                  placeholder="Número de móvil"
                />
                {errors.movil && <span className="error-text">{errors.movil}</span>}
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">No. Orden</label>
                <input
                  type="text"
                  value={formData.no_orden}
                  onChange={(e) => handleInputChange('no_orden', e.target.value)}
                  className="form-input-simple"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">Estado</label>
                <select
                  value={formData.estado}
                  onChange={(e) => handleInputChange('estado', e.target.value)}
                  className="form-select-simple"
                >
                  <option value="">Seleccionar estado...</option>
                  {estadosDisponibles?.map(estado => (
                    <option key={estado.value || estado} value={estado.value || estado}>
                      {estado.label || estado}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-simple">
              <div className="form-group-simple">
                <label className="form-label-simple">Fecha Remisión</label>
                <input
                  type="date"
                  value={formData.fecha_remision}
                  onChange={(e) => handleInputChange('fecha_remision', e.target.value)}
                  className="form-input-simple"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">Fecha Máximo</label>
                <input
                  type="date"
                  value={formData.fecha_maximo}
                  onChange={(e) => handleInputChange('fecha_maximo', e.target.value)}
                  className="form-input-simple"
                />
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="section-simple">
            <div className="section-header-simple">
              <FaTools className="section-icon-simple" />
              <span>Servicios Solicitados</span>
            </div>
            
            {loadingData ? (
              <div className="loading-simple">Cargando servicios...</div>
            ) : (
              <div className="form-row-simple">
                {[1, 2, 3, 4, 5].map(num => (
                  <div key={num} className="form-group-simple">
                    <label className="form-label-simple">Servicio {num}</label>
                    <select
                      value={formData[`servicio${num}`]}
                      onChange={(e) => handleInputChange(`servicio${num}`, e.target.value)}
                      className="form-select-simple"
                    >
                      <option value="">Seleccionar...</option>
                      {servicios.map(servicio => (
                        <option key={servicio.id} value={servicio.nombre}>
                          {servicio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal */}
          <div className="section-simple">
            <div className="section-header-simple">
              <FaUserTie className="section-icon-simple" />
              <span>Personal Asignado</span>
            </div>
            
            <div className="form-row-simple">
              <div className="form-group-simple">
                <label className="form-label-simple">Técnico 1</label>
                <input
                  type="text"
                  value={formData.tecnico1}
                  onChange={(e) => handleInputChange('tecnico1', e.target.value)}
                  className="form-input-simple"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">Técnico 2</label>
                <input
                  type="text"
                  value={formData.tecnico2}
                  onChange={(e) => handleInputChange('tecnico2', e.target.value)}
                  className="form-input-simple"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">Técnico 3</label>
                <input
                  type="text"
                  value={formData.tecnico3}
                  onChange={(e) => handleInputChange('tecnico3', e.target.value)}
                  className="form-input-simple"
                />
              </div>
            </div>

            <div className="form-row-simple">
              <div className="form-group-simple">
                <label className="form-label-simple">Autorizado por</label>
                <input
                  type="text"
                  value={formData.autorizo}
                  onChange={(e) => handleInputChange('autorizo', e.target.value)}
                  className="form-input-simple"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">Generado por</label>
                <input
                  type="text"
                  value={formData.genero}
                  onChange={(e) => handleInputChange('genero', e.target.value)}
                  className="form-input-simple"
                />
              </div>
            </div>
          </div>

          {/* Información Técnica */}
          <div className="section-simple">
            <div className="section-header-simple">
              <FaCog className="section-icon-simple" />
              <span>Información Técnica</span>
            </div>
            
            <div className="form-row-simple">
              <div className="form-group-simple">
                <label className="form-label-simple">UNE</label>
                <input
                  type="text"
                  value={formData.une}
                  onChange={(e) => handleInputChange('une', e.target.value)}
                  className="form-input-simple"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">Carrocería</label>
                <input
                  type="text"
                  value={formData.carroceria}
                  onChange={(e) => handleInputChange('carroceria', e.target.value)}
                  className="form-input-simple"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">Radicación</label>
                <input
                  type="text"
                  value={formData.radicacion}
                  onChange={(e) => handleInputChange('radicacion', e.target.value)}
                  className="form-input-simple"
                />
              </div>
            </div>

            <div className="form-row-simple">
              <div className="form-group-simple">
                <label className="form-label-simple">No. ID BIT</label>
                <input
                  type="text"
                  value={formData.no_id_bit}
                  onChange={(e) => handleInputChange('no_id_bit', e.target.value)}
                  className="form-input-simple"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">No. Fact. Elect.</label>
                <input
                  type="text"
                  value={formData.no_fact_elect}
                  onChange={(e) => handleInputChange('no_fact_elect', e.target.value)}
                  className="form-input-simple"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">Fecha BIT Prof.</label>
                <input
                  type="date"
                  value={formData.fecha_bit_prof}
                  onChange={(e) => handleInputChange('fecha_bit_prof', e.target.value)}
                  className="form-input-simple"
                />
              </div>
            </div>
          </div>

          {/* Información Financiera */}
          <div className="section-simple">
            <div className="section-header-simple">
              <FaDollarSign className="section-icon-simple" />
              <span>Información Financiera</span>
            </div>
            
            <div className="form-row-simple">
              <div className="form-group-simple">
                <label className="form-label-simple">Subtotal</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.subtotal}
                  onChange={(e) => handleInputChange('subtotal', e.target.value)}
                  className="form-input-simple"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group-simple">
                <label className="form-label-simple">Total</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total}
                  onChange={(e) => handleInputChange('total', e.target.value)}
                  className="form-input-simple"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="section-simple">
            <div className="section-header-simple">
              <FaClipboardList className="section-icon-simple" />
              <span>Observaciones</span>
            </div>
            
            <div className="form-group-simple full-width">
              <label className="form-label-simple">Observaciones Adicionales</label>
              <textarea
                value={formData.observaciones}
                onChange={(e) => handleInputChange('observaciones', e.target.value)}
                rows={3}
                className="form-textarea-simple"
                placeholder="Información adicional sobre la remisión..."
              />
            </div>
          </div>

          {/* Botones */}
          <div className="modal-actions-simple">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel-simple"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-save-simple"
              disabled={saving || loadingData}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};

export default ModalEditarRemisionSimple;