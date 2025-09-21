/**
 * 🔄 Status Flow Manager
 * =====================
 * Componente para gestionar el flujo de estados de remisiones
 * Incluye validaciones, transiciones automáticas y reglas de negocio
 * 
 * @author: Global Mobility Solutions
 * @version: 1.0.0
 * @date: September 2025
 */

import React, { useState, useEffect } from 'react';
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';
import { useAuth } from '../../../core/auth/AuthContext';
import { 
  ESTADOS_REMISION, 
  ESTADOS_CON_JUSTIFICACION 
} from '../hooks/useRealTimeRemisiones';
import './StatusFlowManager.css';

const StatusFlowManager = ({ 
  remision, 
  onStatusChange = () => {}, 
  disabled = false 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [justification, setJustification] = useState('');
  const [notification, setNotification] = useState(null);

  // Estados disponibles según el estado actual
  const getAvailableStates = (currentState) => {
    const currentIndex = ESTADOS_REMISION.indexOf(currentState);
    
    // Reglas de transición de estados
    switch (currentState) {
      case 'GENERADO':
        return ['PENDIENTE', 'CANCELADO', 'CORTESIA', 'GARANTIA'];
      
      case 'PENDIENTE':
        return ['PROFORMA', 'RADICADO', 'CANCELADO', 'SIN_VINCULAR'];
        
      case 'PROFORMA':
        return ['RADICADO', 'CANCELADO', 'PENDIENTE'];
        
      case 'RADICADO':
        return ['FACTURADO', 'CANCELADO'];
        
      case 'FACTURADO':
        return []; // Estado final, no se puede cambiar
        
      case 'CANCELADO':
      case 'CORTESIA':
      case 'GARANTIA':
      case 'SIN_VINCULAR':
        // Estados especiales pueden volver a estados anteriores
        return ['GENERADO', 'PENDIENTE'];
        
      default:
        return ESTADOS_REMISION.filter(estado => estado !== currentState);
    }
  };

  // Validar si se puede cambiar al estado seleccionado
  const canChangeToStatus = (newStatus, currentStatus, attachments = {}) => {
    // No se puede revertir desde FACTURADO
    if (currentStatus === 'FACTURADO') {
      return { 
        canChange: false, 
        reason: 'No se puede cambiar el estado desde FACTURADO' 
      };
    }

    // Validaciones específicas por estado
    switch (newStatus) {
      case 'RADICADO':
        // Para radicar, idealmente debería tener al menos la orden de trabajo
        if (!attachments.orden_url && !attachments.remision_url) {
          return {
            canChange: true,
            warning: 'Se recomienda tener al menos un adjunto antes de radicar'
          };
        }
        break;
        
      case 'FACTURADO':
        // Para facturar, debe estar previamente radicado
        if (currentStatus !== 'RADICADO') {
          return {
            canChange: false,
            reason: 'Solo se puede facturar desde estado RADICADO'
          };
        }
        break;
    }

    return { canChange: true };
  };

  // Obtener el color del estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'GENERADO': return '#6c757d';
      case 'PENDIENTE': return '#ffc107';
      case 'PROFORMA': return '#17a2b8';
      case 'RADICADO': return '#28a745';
      case 'FACTURADO': return '#198754';
      case 'CANCELADO': return '#dc3545';
      case 'CORTESIA': return '#6f42c1';
      case 'GARANTIA': return '#e83e8c';
      case 'SIN_VINCULAR': return '#fd7e14';
      default: return '#6c757d';
    }
  };

  // Obtener descripción del estado
  const getStatusDescription = (status) => {
    switch (status) {
      case 'GENERADO': return 'Remisión creada, esperando procesamiento';
      case 'PENDIENTE': return 'En espera de documentación o aprobación';
      case 'PROFORMA': return 'Proforma generada, esperando confirmación';
      case 'RADICADO': return 'Documentos radicados oficialmente';
      case 'FACTURADO': return 'Proceso completado y facturado';
      case 'CANCELADO': return 'Remisión cancelada';
      case 'CORTESIA': return 'Servicio de cortesía sin costo';
      case 'GARANTIA': return 'Trabajo bajo garantía';
      case 'SIN_VINCULAR': return 'Remisión sin vincular a proceso';
      default: return 'Estado desconocido';
    }
  };

  // Manejar cambio de estado
  const handleStatusChange = (newStatus) => {
    const validation = canChangeToStatus(
      newStatus, 
      remision.estado, 
      remision.adjuntos
    );

    if (!validation.canChange) {
      showNotification(validation.reason, 'error');
      return;
    }

    if (validation.warning) {
      showNotification(validation.warning, 'warning');
    }

    setSelectedStatus(newStatus);
    setJustification('');
    setShowModal(true);
  };

  // Confirmar cambio de estado
  const confirmStatusChange = async () => {
    if (!selectedStatus) return;

    // Validar justificación si es requerida
    if (ESTADOS_CON_JUSTIFICACION.includes(selectedStatus) && !justification.trim()) {
      showNotification('Se requiere justificación para este estado', 'error');
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        estado: selectedStatus,
        updated_at: serverTimestamp()
      };

      // Agregar justificación si es necesaria
      if (ESTADOS_CON_JUSTIFICACION.includes(selectedStatus)) {
        updateData.justificacion_estado = justification.trim();
      }

      // Agregar timestamps específicos
      if (selectedStatus === 'RADICADO') {
        updateData.fecha_radicacion = serverTimestamp();
      } else if (selectedStatus === 'FACTURADO') {
        updateData.fecha_facturacion = serverTimestamp();
      }

      // Actualizar en Firestore
      await updateDoc(doc(db, 'remisiones', remision.id), updateData);

      // Registrar en historial
      await addDoc(collection(db, 'historial_remisiones'), {
        remision_id: remision.id,
        usuario: user?.email || 'Usuario desconocido',
        accion: 'Cambio de estado',
        detalles: `Estado cambiado de ${remision.estado} a ${selectedStatus}${
          justification ? ` - Justificación: ${justification}` : ''
        }`,
        estado_anterior: remision.estado,
        estado_nuevo: selectedStatus,
        fecha: serverTimestamp()
      });

      showNotification(`Estado cambiado a ${selectedStatus}`, 'success');
      setShowModal(false);
      onStatusChange(selectedStatus);

    } catch (error) {
      console.error('Error changing status:', error);
      showNotification('Error al cambiar estado: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Determinar cambio automático basado en adjuntos
  const suggestAutoStatusChange = () => {
    if (!remision.adjuntos) return null;

    const { orden_url, remision_url, informe_url } = remision.adjuntos;
    const currentStatus = remision.estado;

    // Sugerir PENDIENTE si está en GENERADO y hay adjuntos
    if (currentStatus === 'GENERADO' && (orden_url || remision_url)) {
      return 'PENDIENTE';
    }

    // Sugerir RADICADO si está en PENDIENTE y tiene documentos completos
    if (currentStatus === 'PENDIENTE' && orden_url && remision_url) {
      return 'RADICADO';
    }

    return null;
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const availableStates = getAvailableStates(remision.estado);
  const suggestedStatus = suggestAutoStatusChange();

  return (
    <div className="status-flow-manager">
      {/* Notificación */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Estado actual */}
      <div className="current-status">
        <h4>Estado Actual</h4>
        <div className="status-display">
          <span 
            className="status-badge current"
            style={{ backgroundColor: getStatusColor(remision.estado) }}
          >
            {remision.estado}
          </span>
          <div className="status-info">
            <p className="status-description">
              {getStatusDescription(remision.estado)}
            </p>
            {remision.justificacion_estado && (
              <p className="status-justification">
                <strong>Justificación:</strong> {remision.justificacion_estado}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sugerencia automática */}
      {suggestedStatus && (
        <div className="auto-suggestion">
          <div className="suggestion-content">
            <span className="suggestion-icon">💡</span>
            <div className="suggestion-text">
              <strong>Sugerencia:</strong> Basándose en los adjuntos disponibles, 
              se sugiere cambiar a <strong>{suggestedStatus}</strong>
            </div>
            <button
              className="btn-suggestion"
              onClick={() => handleStatusChange(suggestedStatus)}
              disabled={disabled || loading}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Estados disponibles */}
      {availableStates.length > 0 && (
        <div className="available-states">
          <h4>Cambiar Estado</h4>
          <div className="states-grid">
            {availableStates.map(status => (
              <button
                key={status}
                className="state-option"
                style={{ borderColor: getStatusColor(status) }}
                onClick={() => handleStatusChange(status)}
                disabled={disabled || loading}
              >
                <span 
                  className="state-color"
                  style={{ backgroundColor: getStatusColor(status) }}
                ></span>
                <div className="state-info">
                  <span className="state-name">{status}</span>
                  <span className="state-desc">
                    {getStatusDescription(status)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cambiar Estado</h3>
            
            <div className="status-change-preview">
              <div className="status-transition">
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(remision.estado) }}
                >
                  {remision.estado}
                </span>
                <span className="transition-arrow">→</span>
                <span 
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(selectedStatus) }}
                >
                  {selectedStatus}
                </span>
              </div>
              <p className="new-status-description">
                {getStatusDescription(selectedStatus)}
              </p>
            </div>

            {/* Justificación si es requerida */}
            {ESTADOS_CON_JUSTIFICACION.includes(selectedStatus) && (
              <div className="form-group">
                <label>Justificación *</label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Ingrese la justificación para este cambio de estado..."
                  rows={3}
                  required
                />
                <p className="help-text">
                  Se requiere justificación para estados especiales
                </p>
              </div>
            )}

            <div className="modal-actions">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Cambiando...' : 'Confirmar Cambio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Información de flujo */}
      <div className="flow-info">
        <h5>📋 Flujo de Estados</h5>
        <div className="flow-sequence">
          {ESTADOS_REMISION.slice(0, 5).map((estado, index) => (
            <React.Fragment key={estado}>
              <span 
                className={`flow-state ${remision.estado === estado ? 'current' : ''}`}
                style={{ color: getStatusColor(estado) }}
              >
                {estado}
              </span>
              {index < 4 && <span className="flow-arrow">→</span>}
            </React.Fragment>
          ))}
        </div>
        <p className="flow-note">
          Estados especiales (CANCELADO, CORTESIA, GARANTIA, SIN_VINCULAR) 
          pueden aplicarse en cualquier momento
        </p>
      </div>
    </div>
  );
};

export default StatusFlowManager;