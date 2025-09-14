/**
 * 🚀 GLOBAL MOBILITY SOLUTIONS - HISTORIAL DE REMISIONES
 * ======================================================
 * Componente rediseñado para editar remisiones con formulario completo
 * Basado en el manual de identidad corporativa y tokens de diseño
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../core/auth/AuthContext';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';
import { updateRemision } from '../../../services/remisionesService';
import { getServicios } from '../../servicios/services/serviciosService';
import { getAllEmployees } from '../../empleados/services/employeeService';
import { THEME } from '../../../shared/tokens/theme';
import './HistorialRemisiones.css';

// Opciones para los campos select
const ESTADOS_OPCIONES = [
  { value: 'CANCELADO', label: 'Cancelado' },
  { value: 'GARANTIA', label: 'Garantía' },
  { value: 'CORTESIA', label: 'Cortesía' },
  { value: 'GENERADO', label: 'Generado' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'PROFORMA', label: 'Proforma' },
  { value: 'RADICADO', label: 'Radicado' },
  { value: 'SIN_VINCULAR', label: 'Sin Vincular' }
];

const UNE_OPCIONES = [
  { value: 'AUTOSUR', label: 'AUTOSUR' },
  { value: 'ALIMENTADORES', label: 'ALIMENTADORES' },
  { value: 'SEVILLANA', label: 'SEVILLANA' },
  { value: 'SANBERNARDINO', label: 'SANBERNARDINO' },
  { value: 'SANJOSE1', label: 'SANJOSE1' },
  { value: 'SANJOSE2', label: 'SANJOSE2' }
];

// Componente principal del formulario de edición
const ModalEditarRemision = ({ remision, onSave, onClose, loading }) => {
  // Estados para datos dinámicos
  const [servicios, setServicios] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

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

  // Estado del formulario con todos los campos requeridos
  const [formData, setFormData] = useState({
    // Información básica
    remision: remision.remision || '',
    movil: remision.movil || '',
    no_orden: remision.no_orden || '',
    estado: remision.estado || '',
    
    // Servicios (5 campos)
    servicio1: remision.servicio1 || '',
    servicio2: remision.servicio2 || '',
    servicio3: remision.servicio3 || '',
    servicio4: remision.servicio4 || '',
    servicio5: remision.servicio5 || '',
    
    // Fechas
    fecha_remision: convertirFechaParaInput(remision.fecha_remision),
    fecha_maximo: convertirFechaParaInput(remision.fecha_maximo),
    fecha_bit_prof: convertirFechaParaInput(remision.fecha_bit_prof),
    radicacion: convertirFechaParaInput(remision.radicacion),
    
    // Información técnica y administrativa
    no_id_bit: remision.no_id_bit || '',
    no_fact_elect: remision.no_fact_elect || '',
    une: remision.une || '',
    carroceria: remision.carroceria || '',
    autorizo: remision.autorizo || '',
    
    // Personal técnico
    tecnico1: remision.tecnico1 || '',
    tecnico2: remision.tecnico2 || '',
    tecnico3: remision.tecnico3 || '',
    genero: remision.genero || '',
    
    // Información financiera
    subtotal: remision.subtotal || '',
    total: remision.total || ''
  });

  // Estado para errores de validación
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Cargar datos dinámicos (servicios y técnicos)
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingData(true);
        
        // Cargar servicios
        const serviciosData = await getServicios();
        setServicios(serviciosData.map(servicio => ({
          value: servicio.titulo || servicio.título || '',
          label: servicio.titulo || servicio.título || 'Servicio sin nombre',
          id: servicio.id
        })));

        // Cargar técnicos
        const tecnicosQuery = query(
          collection(db, 'EMPLEADOS'),
          where('tipo_empleado', '==', 'tecnico')
        );
        const tecnicosSnapshot = await getDocs(tecnicosQuery);
        const tecnicosData = tecnicosSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            value: data.nombre_completo || 'Técnico sin nombre',
            label: data.nombre_completo || 'Técnico sin nombre',
            id: doc.id
          };
        });
        setTecnicos(tecnicosData);
        
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoadingData(false);
      }
    };

    cargarDatos();
  }, []);

  // Validación del formulario
  const validateForm = () => {
    const newErrors = {};
    
    // Campos obligatorios
    if (!formData.remision.trim()) {
      newErrors.remision = 'El número de remisión es obligatorio';
    }
    
    if (!formData.movil.trim()) {
      newErrors.movil = 'El móvil es obligatorio';
    }
    
    if (!formData.estado) {
      newErrors.estado = 'El estado es obligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar cambios en los campos
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo si existe
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Preparar datos para envío
      const datosActualizados = { ...formData };
      
      // Convertir fechas a Timestamp de Firestore
      if (datosActualizados.fecha_remision) {
        datosActualizados.fecha_remision = Timestamp.fromDate(new Date(datosActualizados.fecha_remision));
      }
      if (datosActualizados.fecha_maximo) {
        datosActualizados.fecha_maximo = Timestamp.fromDate(new Date(datosActualizados.fecha_maximo));
      }
      if (datosActualizados.fecha_bit_prof) {
        datosActualizados.fecha_bit_prof = Timestamp.fromDate(new Date(datosActualizados.fecha_bit_prof));
      }
      if (datosActualizados.radicacion) {
        datosActualizados.radicacion = Timestamp.fromDate(new Date(datosActualizados.radicacion));
      }
      
      // Convertir números
      if (datosActualizados.subtotal) {
        datosActualizados.subtotal = parseFloat(datosActualizados.subtotal);
      }
      if (datosActualizados.total) {
        datosActualizados.total = parseFloat(datosActualizados.total);
      }
      if (datosActualizados.no_id_bit) {
        datosActualizados.no_id_bit = parseInt(datosActualizados.no_id_bit) || 0;
      }
      
      await onSave(datosActualizados);
      
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setSaving(false);
    }
  };

  // Animaciones
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95, y: -20 }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="modal-overlay-historial"
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
        className="modal-content-historial"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div className="modal-header-historial">
          <h2>✏️ Editar Remisión {remision.remision}</h2>
          <motion.button 
            className="btn-close-historial" 
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✕
          </motion.button>
        </div>

        {/* Contenido del modal con scroll */}
        <div className="modal-body-historial">
          {loadingData ? (
            <div className="loading-data">
              <div className="spinner"></div>
              <p>Cargando datos...</p>
            </div>
          ) : (
            <>
              {/* Sección: Información Básica */}
              <motion.div 
                className="form-section-historial"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1 }}
              >
                <h3>📄 Información Básica</h3>
                <div className="form-grid-historial">
                  <div className="form-group-historial">
                    <label>Remisión *</label>
                    <input
                      type="text"
                      value={formData.remision}
                      onChange={(e) => handleChange('remision', e.target.value)}
                      disabled={saving}
                      className={errors.remision ? 'error' : ''}
                      placeholder="Ej: REM-001"
                    />
                    {errors.remision && <span className="error-text">{errors.remision}</span>}
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Móvil *</label>
                    <input
                      type="text"
                      value={formData.movil}
                      onChange={(e) => handleChange('movil', e.target.value)}
                      disabled={saving}
                      className={errors.movil ? 'error' : ''}
                      placeholder="Ej: MOV-001"
                    />
                    {errors.movil && <span className="error-text">{errors.movil}</span>}
                  </div>
                  
                  <div className="form-group-historial">
                    <label>No. Orden</label>
                    <input
                      type="text"
                      value={formData.no_orden}
                      onChange={(e) => handleChange('no_orden', e.target.value)}
                      disabled={saving}
                      placeholder="Número de orden"
                    />
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Estado *</label>
                    <select
                      value={formData.estado}
                      onChange={(e) => handleChange('estado', e.target.value)}
                      disabled={saving}
                      className={errors.estado ? 'error' : ''}
                    >
                      <option value="">Seleccionar estado</option>
                      {ESTADOS_OPCIONES.map(estado => (
                        <option key={estado.value} value={estado.value}>
                          {estado.label}
                        </option>
                      ))}
                    </select>
                    {errors.estado && <span className="error-text">{errors.estado}</span>}
                  </div>
                </div>
              </motion.div>

              {/* Sección: Servicios */}
              <motion.div 
                className="form-section-historial"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
              >
                <h3>🔧 Servicios</h3>
                <div className="form-grid-historial">
                  {[1, 2, 3, 4, 5].map(num => (
                    <div key={num} className="form-group-historial">
                      <label>Servicio {num}</label>
                      <select
                        value={formData[`servicio${num}`]}
                        onChange={(e) => handleChange(`servicio${num}`, e.target.value)}
                        disabled={saving}
                      >
                        <option value="">Seleccionar servicio</option>
                        {servicios.map(servicio => (
                          <option key={servicio.id} value={servicio.value}>
                            {servicio.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Sección: Fechas */}
              <motion.div 
                className="form-section-historial"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
              >
                <h3>📅 Fechas</h3>
                <div className="form-grid-historial">
                  <div className="form-group-historial">
                    <label>Fecha Remisión</label>
                    <input
                      type="date"
                      value={formData.fecha_remision}
                      onChange={(e) => handleChange('fecha_remision', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Fecha Máximo</label>
                    <input
                      type="date"
                      value={formData.fecha_maximo}
                      onChange={(e) => handleChange('fecha_maximo', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Fecha BIT Prof</label>
                    <input
                      type="date"
                      value={formData.fecha_bit_prof}
                      onChange={(e) => handleChange('fecha_bit_prof', e.target.value)}
                      disabled={saving}
                    />
                  </div>

                  <div className="form-group-historial">
                    <label>Radicación</label>
                    <input
                      type="date"
                      value={formData.radicacion}
                      onChange={(e) => handleChange('radicacion', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Sección: Personal */}
              <motion.div 
                className="form-section-historial"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.4 }}
              >
                <h3>👥 Personal</h3>
                <div className="form-grid-historial">
                  <div className="form-group-historial">
                    <label>Técnico 1</label>
                    <select
                      value={formData.tecnico1}
                      onChange={(e) => handleChange('tecnico1', e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Seleccionar técnico</option>
                      {tecnicos.map(tecnico => (
                        <option key={tecnico.id} value={tecnico.value}>
                          {tecnico.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Técnico 2</label>
                    <select
                      value={formData.tecnico2}
                      onChange={(e) => handleChange('tecnico2', e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Seleccionar técnico</option>
                      {tecnicos.map(tecnico => (
                        <option key={tecnico.id} value={tecnico.value}>
                          {tecnico.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Técnico 3</label>
                    <select
                      value={formData.tecnico3}
                      onChange={(e) => handleChange('tecnico3', e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Seleccionar técnico</option>
                      {tecnicos.map(tecnico => (
                        <option key={tecnico.id} value={tecnico.value}>
                          {tecnico.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Autorizó</label>
                    <input
                      type="text"
                      value={formData.autorizo}
                      onChange={(e) => handleChange('autorizo', e.target.value)}
                      disabled={saving}
                      placeholder="Persona que autorizó"
                    />
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Generó</label>
                    <input
                      type="text"
                      value={formData.genero}
                      onChange={(e) => handleChange('genero', e.target.value)}
                      disabled={saving}
                      placeholder="Persona que generó"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Sección: Técnica */}
              <motion.div 
                className="form-section-historial"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.5 }}
              >
                <h3>⚙️ Información Técnica</h3>
                <div className="form-grid-historial">
                  <div className="form-group-historial">
                    <label>UNE</label>
                    <select
                      value={formData.une}
                      onChange={(e) => handleChange('une', e.target.value)}
                      disabled={saving}
                    >
                      <option value="">Seleccionar UNE</option>
                      {UNE_OPCIONES.map(une => (
                        <option key={une.value} value={une.value}>
                          {une.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Carrocería</label>
                    <input
                      type="text"
                      value={formData.carroceria}
                      onChange={(e) => handleChange('carroceria', e.target.value)}
                      disabled={saving}
                      placeholder="Tipo de carrocería"
                    />
                  </div>
                  
                  <div className="form-group-historial">
                    <label>No. ID BIT</label>
                    <input
                      type="text"
                      value={formData.no_id_bit}
                      onChange={(e) => handleChange('no_id_bit', e.target.value)}
                      disabled={saving}
                      placeholder="Número ID BIT"
                    />
                  </div>
                  
                  <div className="form-group-historial">
                    <label>No. Fact. Elect</label>
                    <input
                      type="text"
                      value={formData.no_fact_elect}
                      onChange={(e) => handleChange('no_fact_elect', e.target.value)}
                      disabled={saving}
                      placeholder="Número factura electrónica"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Sección: Financiera */}
              <motion.div 
                className="form-section-historial"
                variants={sectionVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.6 }}
              >
                <h3>💰 Información Financiera</h3>
                <div className="form-grid-historial">
                  <div className="form-group-historial">
                    <label>Subtotal</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.subtotal}
                      onChange={(e) => handleChange('subtotal', e.target.value)}
                      disabled={saving}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="form-group-historial">
                    <label>Total</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.total}
                      onChange={(e) => handleChange('total', e.target.value)}
                      disabled={saving}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Footer con botones */}
        <div className="modal-footer-historial">
          <motion.button
            className="btn-cancel-historial"
            onClick={onClose}
            disabled={saving}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Cancelar
          </motion.button>
          
          <motion.button
            className="btn-save-historial"
            onClick={handleSave}
            disabled={saving || loadingData}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {saving ? (
              <>
                <div className="spinner-small"></div>
                Guardando...
              </>
            ) : (
              <>
                💾 Guardar
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModalEditarRemision;