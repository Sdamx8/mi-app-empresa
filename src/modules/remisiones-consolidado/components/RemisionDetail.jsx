/**
 * 📝 Vista Detallada de Remisión
 * ==============================
 * Página completa para visualizar y editar una remisión individual
 * Incluye gestión de adjuntos, historial y validaciones
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp, collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../core/auth/AuthContext';
import { db } from '../../../core/config/firebaseConfig';
import { ESTADOS_REMISION, ESTADOS_CON_JUSTIFICACION } from '../hooks/useRealTimeRemisiones';
import AttachmentUploader from './AttachmentUploader';
import StatusFlowManager from './StatusFlowManager';
import './RemisionDetail.css';

const RemisionDetail = ({ remisionId, onBack }) => {
  const { user } = useAuth();
  
  // Estados locales
  const [remision, setRemision] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  // Cargar datos iniciales
  useEffect(() => {
    if (remisionId) {
      loadRemisionData();
      loadHistorial();
    }
  }, [remisionId]);

  const loadRemisionData = async () => {
    try {
      const docRef = doc(db, 'remisiones', remisionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const remisionData = {
          id: docSnap.id,
          ...data,
          // Convertir timestamps
          fecha_remision: data.fecha_remision?.toDate?.() || new Date(),
          fecha_maximo: data.fecha_maximo?.toDate?.() || new Date(),
          fecha_bit_prof: data.fecha_bit_prof?.toDate?.() || new Date(),
          radicacion: data.radicacion?.toDate?.() || new Date(),
          created_at: data.created_at?.toDate?.() || new Date(),
          updated_at: data.updated_at?.toDate?.() || new Date(),
        };
        
        setRemision(remisionData);
        setFormData(remisionData);
      } else {
        setError('Remisión no encontrada');
      }
    } catch (err) {
      console.error('Error loading remision:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistorial = async () => {
    try {
      const q = query(
        collection(db, 'historial_remisiones'),
        where('remision_id', '==', remisionId),
        orderBy('fecha', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const historialData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fecha: doc.data().fecha?.toDate?.() || new Date(),
      }));
      
      setHistorial(historialData);
    } catch (err) {
      console.error('Error loading historial:', err);
    }
  };

  // Validaciones
  const validateForm = (data) => {
    const errors = {};
    
    if (!data.remision?.trim()) {
      errors.remision = 'La remisión es obligatoria';
    }
    
    if (!data.movil?.trim()) {
      errors.movil = 'El móvil es obligatorio';
    }
    
    if (!data.no_orden?.trim()) {
      errors.no_orden = 'El número de orden es obligatorio';
    }
    
    // Validar fechas
    if (data.fecha_maximo && data.fecha_remision) {
      if (new Date(data.fecha_maximo) < new Date(data.fecha_remision)) {
        errors.fecha_maximo = 'La fecha máximo debe ser mayor o igual a la fecha de remisión';
      }
    }
    
    // Validar montos
    if (data.subtotal && data.subtotal < 0) {
      errors.subtotal = 'El subtotal no puede ser negativo';
    }
    
    if (data.total && data.total < 0) {
      errors.total = 'El total no puede ser negativo';
    }
    
    return errors;
  };

  // Guardar cambios
  const handleSave = async () => {
    const errors = validateForm(formData);
    setValidationErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      showNotification('Por favor corrige los errores antes de guardar', 'error');
      return;
    }
    
    setSaving(true);
    
    try {
      // Preparar datos para guardar
      const updateData = {
        ...formData,
        updated_at: serverTimestamp(),
      };
      
      // Eliminar campos que no deben guardarse
      delete updateData.id;
      delete updateData.created_at;
      
      // Actualizar documento
      const docRef = doc(db, 'remisiones', remisionId);
      await updateDoc(docRef, updateData);
      
      // Registrar en historial
      await addDoc(collection(db, 'historial_remisiones'), {
        remision_id: remisionId,
        usuario: user?.email || 'Usuario desconocido',
        accion: 'Actualización',
        detalles: 'Remisión actualizada desde vista detallada',
        fecha: serverTimestamp(),
      });
      
      showNotification('Remisión actualizada correctamente', 'success');
      setEditMode(false);
      loadRemisionData(); // Recargar datos
      loadHistorial(); // Recargar historial
      
    } catch (err) {
      console.error('Error saving remision:', err);
      showNotification('Error al guardar: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Cambiar estado
  const handleChangeEstado = async (nuevoEstado, justificacion = '') => {
    setSaving(true);
    
    try {
      const updateData = {
        estado: nuevoEstado,
        updated_at: serverTimestamp(),
      };
      
      if (ESTADOS_CON_JUSTIFICACION.includes(nuevoEstado) && justificacion) {
        updateData.justificacion_estado = justificacion;
      }
      
      // Agregar timestamps específicos
      if (nuevoEstado === 'RADICADO') {
        updateData.fecha_radicacion = serverTimestamp();
      } else if (nuevoEstado === 'FACTURADO') {
        updateData.fecha_facturacion = serverTimestamp();
      }
      
      const docRef = doc(db, 'remisiones', remisionId);
      await updateDoc(docRef, updateData);
      
      // Registrar en historial
      await addDoc(collection(db, 'historial_remisiones'), {
        remision_id: remisionId,
        usuario: user?.email || 'Usuario desconocido',
        accion: 'Cambio de estado',
        detalles: `Estado cambiado a ${nuevoEstado}${justificacion ? ` - Justificación: ${justificacion}` : ''}`,
        fecha: serverTimestamp(),
      });
      
      showNotification(`Estado cambiado a ${nuevoEstado}`, 'success');
      loadRemisionData();
      loadHistorial();
      
    } catch (err) {
      console.error('Error changing estado:', err);
      showNotification('Error al cambiar estado: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error de validación si existe
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-CO');
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('es-CO');
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="remision-detail-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando remisión...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="remision-detail-container">
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={onBack} className="btn-primary">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="remision-detail-container">
      {/* Notificación */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="detail-header">
        <div className="header-left">
          <button 
            onClick={onBack}
            className="btn-back"
          >
            ← Volver
          </button>
          <h1>Remisión {remision?.remision}</h1>
          <span className={`status-badge status-${remision?.estado?.toLowerCase()}`}>
            {remision?.estado}
          </span>
        </div>
        
        <div className="header-actions">
          {!editMode ? (
            <button 
              onClick={() => setEditMode(true)}
              className="btn-primary"
            >
              ✏️ Editar
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                onClick={() => {
                  setEditMode(false);
                  setFormData(remision);
                  setValidationErrors({});
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="btn-success"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-grid">
          {/* Información Principal */}
          <div className="detail-section">
            <h2>Información Principal</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Remisión *</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.remision || ''}
                    onChange={(e) => handleInputChange('remision', e.target.value)}
                    className={validationErrors.remision ? 'error' : ''}
                  />
                ) : (
                  <span className="form-value">{remision?.remision}</span>
                )}
                {validationErrors.remision && (
                  <span className="error-text">{validationErrors.remision}</span>
                )}
              </div>

              <div className="form-group">
                <label>Móvil *</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.movil || ''}
                    onChange={(e) => handleInputChange('movil', e.target.value)}
                    className={validationErrors.movil ? 'error' : ''}
                  />
                ) : (
                  <span className="form-value">{remision?.movil}</span>
                )}
                {validationErrors.movil && (
                  <span className="error-text">{validationErrors.movil}</span>
                )}
              </div>

              <div className="form-group">
                <label>No. Orden *</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.no_orden || ''}
                    onChange={(e) => handleInputChange('no_orden', e.target.value)}
                    className={validationErrors.no_orden ? 'error' : ''}
                  />
                ) : (
                  <span className="form-value">{remision?.no_orden}</span>
                )}
                {validationErrors.no_orden && (
                  <span className="error-text">{validationErrors.no_orden}</span>
                )}
              </div>

              <div className="form-group">
                <label>Estado</label>
                {editMode ? (
                  <select
                    value={formData.estado || 'GENERADO'}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                  >
                    {ESTADOS_REMISION.map(estado => (
                      <option key={estado} value={estado}>{estado}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`form-value status-${remision?.estado?.toLowerCase()}`}>
                    {remision?.estado}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>UNE</label>
                {editMode ? (
                  <select
                    value={formData.une || ''}
                    onChange={(e) => handleInputChange('une', e.target.value)}
                  >
                    <option value="">Seleccionar UNE</option>
                    <option value="AUTOSUR">AUTOSUR</option>
                    <option value="ALIMENTADORES">ALIMENTADORES</option>
                    <option value="SEVILLANA">SEVILLANA</option>
                    <option value="SANBERNARDINO">SANBERNARDINO</option>
                    <option value="SANJOSE1">SANJOSE1</option>
                    <option value="SANJOSE2">SANJOSE2</option>
                  </select>
                ) : (
                  <span className="form-value">{remision?.une || '-'}</span>
                )}
              </div>

              <div className="form-group">
                <label>Carrocería</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.carroceria || ''}
                    onChange={(e) => handleInputChange('carroceria', e.target.value)}
                  />
                ) : (
                  <span className="form-value">{remision?.carroceria || '-'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="detail-section">
            <h2>Fechas</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Fecha Remisión</label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.fecha_remision ? new Date(formData.fecha_remision).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('fecha_remision', new Date(e.target.value))}
                  />
                ) : (
                  <span className="form-value">{formatDate(remision?.fecha_remision)}</span>
                )}
              </div>

              <div className="form-group">
                <label>Fecha Máximo</label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.fecha_maximo ? new Date(formData.fecha_maximo).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('fecha_maximo', new Date(e.target.value))}
                    className={validationErrors.fecha_maximo ? 'error' : ''}
                  />
                ) : (
                  <span className="form-value">{formatDate(remision?.fecha_maximo)}</span>
                )}
                {validationErrors.fecha_maximo && (
                  <span className="error-text">{validationErrors.fecha_maximo}</span>
                )}
              </div>

              <div className="form-group">
                <label>Fecha BIT Prof</label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.fecha_bit_prof ? new Date(formData.fecha_bit_prof).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('fecha_bit_prof', new Date(e.target.value))}
                  />
                ) : (
                  <span className="form-value">{formatDate(remision?.fecha_bit_prof)}</span>
                )}
              </div>

              <div className="form-group">
                <label>Radicación</label>
                {editMode ? (
                  <input
                    type="date"
                    value={formData.radicacion ? new Date(formData.radicacion).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleInputChange('radicacion', new Date(e.target.value))}
                  />
                ) : (
                  <span className="form-value">{formatDate(remision?.radicacion)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="detail-section">
            <h2>Valores</h2>
            
            <div className="form-grid">
              <div className="form-group">
                <label>Subtotal</label>
                {editMode ? (
                  <input
                    type="number"
                    value={formData.subtotal || 0}
                    onChange={(e) => handleInputChange('subtotal', Number(e.target.value))}
                    className={validationErrors.subtotal ? 'error' : ''}
                  />
                ) : (
                  <span className="form-value">{formatCurrency(remision?.subtotal)}</span>
                )}
                {validationErrors.subtotal && (
                  <span className="error-text">{validationErrors.subtotal}</span>
                )}
              </div>

              <div className="form-group">
                <label>Total</label>
                {editMode ? (
                  <input
                    type="number"
                    value={formData.total || 0}
                    onChange={(e) => handleInputChange('total', Number(e.target.value))}
                    className={validationErrors.total ? 'error' : ''}
                  />
                ) : (
                  <span className="form-value total-amount">{formatCurrency(remision?.total)}</span>
                )}
                {validationErrors.total && (
                  <span className="error-text">{validationErrors.total}</span>
                )}
              </div>

              <div className="form-group">
                <label>No. ID BIT</label>
                {editMode ? (
                  <input
                    type="number"
                    value={formData.no_id_bit || 0}
                    onChange={(e) => handleInputChange('no_id_bit', Number(e.target.value))}
                  />
                ) : (
                  <span className="form-value">{remision?.no_id_bit || 0}</span>
                )}
              </div>

              <div className="form-group">
                <label>No. Fact. Elect.</label>
                {editMode ? (
                  <input
                    type="text"
                    value={formData.no_fact_elect || ''}
                    onChange={(e) => handleInputChange('no_fact_elect', e.target.value)}
                  />
                ) : (
                  <span className="form-value">{remision?.no_fact_elect || '-'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Servicios */}
          <div className="detail-section">
            <h2>Servicios</h2>
            
            <div className="form-grid">
              {[1, 2, 3, 4, 5].map(num => (
                <div key={num} className="form-group">
                  <label>Servicio {num}</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData[`servicio${num}`] || ''}
                      onChange={(e) => handleInputChange(`servicio${num}`, e.target.value)}
                    />
                  ) : (
                    <span className="form-value">{remision?.[`servicio${num}`] || '-'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Técnicos */}
          <div className="detail-section">
            <h2>Técnicos</h2>
            
            <div className="form-grid">
              {[1, 2, 3].map(num => (
                <div key={num} className="form-group">
                  <label>Técnico {num}</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData[`tecnico${num}`] || ''}
                      onChange={(e) => handleInputChange(`tecnico${num}`, e.target.value)}
                    />
                  ) : (
                    <span className="form-value">{remision?.[`tecnico${num}`] || '-'}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Adjuntos */}
          <div className="detail-section">
            <h2>Adjuntos y Archivos</h2>
            <AttachmentUploader 
              remisionId={remisionId}
              remision={remision}
              onUpdate={loadRemisionData}
            />
          </div>

          {/* Gestión de estados */}
          <div className="detail-section">
            <h2>Gestión de Estados</h2>
            <StatusFlowManager
              remision={remision}
              onStatusChange={loadRemisionData}
              disabled={saving}
            />
          </div>

          {/* Historial */}
          <div className="detail-section">
            <h2>Historial de Cambios</h2>
            <div className="historial-container">
              {historial.length > 0 ? (
                historial.map(entry => (
                  <div key={entry.id} className="historial-entry">
                    <div className="historial-header">
                      <span className="historial-action">{entry.accion}</span>
                      <span className="historial-date">{formatDateTime(entry.fecha)}</span>
                    </div>
                    <div className="historial-user">Por: {entry.usuario}</div>
                    <div className="historial-details">{entry.detalles}</div>
                  </div>
                ))
              ) : (
                <p className="no-historial">No hay historial de cambios disponible</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemisionDetail;