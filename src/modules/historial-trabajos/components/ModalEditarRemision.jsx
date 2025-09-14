/**
 * 🚀 MODAL EDITAR REMISIÓN - COMPONENTE PROFESIONAL
 * ==================================================
 * Formulario profesional para edición de remisiones con:
 * - Diseño corporativo GMS
 * - Dropdowns dinámicos desde Firestore
 * - Validación de formularios
 * - Animaciones suaves
 * - Responsive design
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { 
  FaEdit, FaTimes, FaFileAlt, FaUser, FaTools, FaUserTie, 
  FaCog, FaDollarSign, FaClipboardList 
} from 'react-icons/fa';
import { db } from '../../../core/config/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-toastify';
import './ModalEditarRemisionFlat.css';

const ModalEditarRemision = ({ remision, estadosDisponibles, onSave, onClose, loading }) => {
  // Estados para datos dinámicos
  const [servicios, setServicios] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cargar datos dinámicos de Firestore
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        
        // Cargar servicios
        const serviciosSnapshot = await getDocs(collection(db, 'servicios'));
        const serviciosData = serviciosSnapshot.docs.map(doc => ({
          id: doc.id,
          nombre: doc.data().nombre || doc.data().servicio || doc.id
        }));
        setServicios(serviciosData);

        // Cargar técnicos  
        const tecnicosSnapshot = await getDocs(collection(db, 'empleados'));
        const tecnicosData = tecnicosSnapshot.docs
          .map(doc => ({
            id: doc.id,
            nombre: doc.data().nombre || doc.data().displayName || doc.id,
            cargo: doc.data().cargo
          }))
          .filter(tecnico => tecnico.cargo && tecnico.cargo.toLowerCase().includes('tecnico'));
        setTecnicos(tecnicosData);

      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar datos del formulario');
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, []);

  // Función helper para convertir fechas de Firestore a formato de input
  const convertirFechaParaInput = (fecha) => {
    if (!fecha) return '';
    
    try {
      let fechaObj;
      
      // Si es un Timestamp de Firestore
      if (fecha && typeof fecha === 'object' && fecha.seconds !== undefined) {
        fechaObj = new Date(fecha.seconds * 1000);
      }
      // Si ya es un objeto Date
      else if (fecha instanceof Date) {
        fechaObj = fecha;
      }
      // Si es una cadena o número
      else {
        fechaObj = new Date(fecha);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(fechaObj.getTime())) {
        return '';
      }
      
      // Convertir a formato YYYY-MM-DD para input date
      return fechaObj.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error al convertir fecha para input:', error, fecha);
      return '';
    }
  };

  // Estado del formulario
  const [formData, setFormData] = useState({
    // Información básica
    remision: remision.remision || '',
    movil: remision.movil || '',
    no_orden: remision.no_orden || '',
    estado: remision.estado || '',
    
    // Servicios
    servicio1: remision.servicio1 || '',
    servicio2: remision.servicio2 || '',
    servicio3: remision.servicio3 || '',
    servicio4: remision.servicio4 || '',
    servicio5: remision.servicio5 || '',
    
    // Fechas - usando la función helper
    fecha_remision: convertirFechaParaInput(remision.fecha_remision),
    fecha_maximo: convertirFechaParaInput(remision.fecha_maximo),
    fecha_bit_prof: convertirFechaParaInput(remision.fecha_bit_prof),
    
    // Personal
    tecnico1: remision.tecnico1 || '',
    tecnico2: remision.tecnico2 || '',
    tecnico3: remision.tecnico3 || '',
    autorizo: remision.autorizo || '',
    genero: remision.genero || '',
    
    // Información técnica
    une: remision.une || '',
    carroceria: remision.carroceria || '',
    radicacion: remision.radicacion || '',
    no_id_bit: remision.no_id_bit || '',
    no_fact_elect: remision.no_fact_elect || '',
    
    // Información financiera
    subtotal: remision.subtotal || '',
    total: remision.total || '',
    
    // Observaciones
    observaciones: remision.observaciones || ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error si existe
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Validar campos requeridos
    const newErrors = {};
    if (!formData.remision?.trim()) {
      newErrors.remision = 'Número de remisión es requerido';
    }
    if (!formData.movil?.trim()) {
      newErrors.movil = 'Móvil es requerido';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSaving(false);
      return;
    }
    
    try {
      // Preparar datos para envío
      const datosActualizados = { ...formData };
      
      // Convertir fechas
      if (datosActualizados.fecha_remision) {
        datosActualizados.fecha_remision = new Date(datosActualizados.fecha_remision);
      }
      if (datosActualizados.fecha_maximo) {
        datosActualizados.fecha_maximo = new Date(datosActualizados.fecha_maximo);
      }
      if (datosActualizados.fecha_bit_prof) {
        datosActualizados.fecha_bit_prof = new Date(datosActualizados.fecha_bit_prof);
      }
      
      // Convertir números
      if (datosActualizados.subtotal) {
        datosActualizados.subtotal = parseFloat(datosActualizados.subtotal);
      }
      if (datosActualizados.total) {
        datosActualizados.total = parseFloat(datosActualizados.total);
      }
      
      await onSave(datosActualizados);
    } catch (error) {
      console.error('Error guardando remisión:', error);
      toast.error('Error al guardar la remisión');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        className="modal-content-professional"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header-professional">
          <div className="modal-title-section">
            <div className="modal-icon">
              <FaEdit />
            </div>
            <h2>Editar Remisión</h2>
          </div>
          <button
            onClick={onClose}
            className="modal-close-btn"
            disabled={saving}
          >
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form-professional">
          
          {/* Información Básica */}
          <div className="section-title">
            <FaFileAlt className="section-icon" />
            Información Básica
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label required">Número de Remisión</label>
              <input
                type="text"
                value={formData.remision || ''}
                onChange={(e) => handleInputChange('remision', e.target.value)}
                className={`form-input ${errors.remision ? 'error' : ''}`}
                placeholder="Ej: REM-2024-001"
              />
              {errors.remision && <span className="form-error">{errors.remision}</span>}
            </div>
            
            <div className="form-field">
              <label className="form-label required">Móvil</label>
              <input
                type="text"
                value={formData.movil || ''}
                onChange={(e) => handleInputChange('movil', e.target.value)}
                className={`form-input ${errors.movil ? 'error' : ''}`}
                placeholder="Número de móvil"
              />
              {errors.movil && <span className="form-error">{errors.movil}</span>}
            </div>

            <div className="form-field">
              <label className="form-label">No. Orden</label>
              <input
                type="text"
                value={formData.no_orden || ''}
                onChange={(e) => handleInputChange('no_orden', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Estado</label>
              <select
                value={formData.estado || ''}
                onChange={(e) => handleInputChange('estado', e.target.value)}
                className="form-select"
              >
                <option value="">Seleccionar estado...</option>
                {estadosDisponibles.map(estado => (
                  <option key={estado.value || estado} value={estado.value || estado}>
                    {estado.label || estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">Fecha Remisión</label>
              <input
                type="date"
                value={formData.fecha_remision || ''}
                onChange={(e) => handleInputChange('fecha_remision', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Fecha Máximo</label>
              <input
                type="date"
                value={formData.fecha_maximo || ''}
                onChange={(e) => handleInputChange('fecha_maximo', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Servicios */}
          <div className="section-title">
            <FaTools className="section-icon" />
            Servicios Solicitados
          </div>
          {loadingData ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <span>Cargando servicios...</span>
            </div>
          ) : (
            <div className="form-grid-5">
              {[1, 2, 3, 4, 5].map(num => (
                <div key={num} className="form-field">
                  <label className="form-label">Servicio {num}</label>
                  <select
                    value={formData[`servicio${num}`] || ''}
                    onChange={(e) => handleInputChange(`servicio${num}`, e.target.value)}
                    className="form-select"
                  >
                    <option value="">Seleccionar...</option>
                    {servicios.map(servicio => (
                      <option key={servicio.id} value={servicio.titulo || servicio.nombre || servicio.servicio}>
                        {servicio.titulo || servicio.nombre || servicio.servicio}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Personal */}
          <div className="section-title">
            <FaUserTie className="section-icon" />
            Personal Asignado
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Técnico 1</label>
              <input
                type="text"
                value={formData.tecnico1 || ''}
                onChange={(e) => handleInputChange('tecnico1', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Técnico 2</label>
              <input
                type="text"
                value={formData.tecnico2 || ''}
                onChange={(e) => handleInputChange('tecnico2', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Técnico 3</label>
              <input
                type="text"
                value={formData.tecnico3 || ''}
                onChange={(e) => handleInputChange('tecnico3', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Autorizado por</label>
              <input
                type="text"
                value={formData.autorizo || ''}
                onChange={(e) => handleInputChange('autorizo', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Generado por</label>
              <input
                type="text"
                value={formData.genero || ''}
                onChange={(e) => handleInputChange('genero', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Información Técnica */}
          <div className="section-title">
            <FaCog className="section-icon" />
            Información Técnica
          </div>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">UNE</label>
              <input
                type="text"
                value={formData.une || ''}
                onChange={(e) => handleInputChange('une', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Carrocería</label>
              <input
                type="text"
                value={formData.carroceria || ''}
                onChange={(e) => handleInputChange('carroceria', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Radicación</label>
              <input
                type="text"
                value={formData.radicacion || ''}
                onChange={(e) => handleInputChange('radicacion', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">No. ID BIT</label>
              <input
                type="text"
                value={formData.no_id_bit || ''}
                onChange={(e) => handleInputChange('no_id_bit', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">No. Fact. Elect.</label>
              <input
                type="text"
                value={formData.no_fact_elect || ''}
                onChange={(e) => handleInputChange('no_fact_elect', e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Fecha BIT Prof.</label>
              <input
                type="date"
                value={formData.fecha_bit_prof || ''}
                onChange={(e) => handleInputChange('fecha_bit_prof', e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {/* Información Financiera */}
          <div className="section-title">
            <FaDollarSign className="section-icon" />
            Información Financiera
          </div>
          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-label">Subtotal</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.subtotal || ''}
                onChange={(e) => handleInputChange('subtotal', e.target.value)}
                className="form-input"
                placeholder="0.00"
              />
            </div>

            <div className="form-field">
              <label className="form-label">Total</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.total || ''}
                onChange={(e) => handleInputChange('total', e.target.value)}
                className="form-input"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div className="section-title">
            <FaClipboardList className="section-icon" />
            Observaciones
          </div>
          <div className="form-field full-width">
            <label className="form-label">Observaciones Adicionales</label>
            <textarea
              value={formData.observaciones || ''}
              onChange={(e) => handleInputChange('observaciones', e.target.value)}
              rows={3}
              className="form-textarea"
              placeholder="Información adicional sobre la remisión..."
            />
          </div>

          {/* Botones de Acción */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || loadingData}
            >
              {saving && <div className="btn-spinner"></div>}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default ModalEditarRemision;