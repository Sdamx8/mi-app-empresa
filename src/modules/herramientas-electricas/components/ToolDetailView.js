// ToolDetailView.js - Vista detallada de herramientas
import React from 'react';
import { THEME_COLORS } from '../../../shared/constants';

const TIPOS_MANTENIMIENTO = [
  { value: 'preventivo', label: 'Preventivo' },
  { value: 'correctivo', label: 'Correctivo' },
  { value: 'calibracion', label: 'Calibración' },
  { value: 'revision', label: 'Revisión' }
];

const ToolDetailView = ({ 
  tool, 
  maintenanceHistory, 
  onBack, 
  onAddMaintenance, 
  onPrintQR, 
  qrCode,
  showMaintenanceForm,
  maintenanceForm,
  empleados,
  onMaintenanceChange,
  onMaintenanceSubmit,
  onCancelMaintenance,
  loading
}) => {
  return (
    <div className="herramientas-container">
      {/* Header */}
      <div className="herramientas-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} className="btn-secondary">
            ← Volver
          </button>
          <h1 className="herramientas-title">
            📋 Hoja de Vida - {tool.description}
          </h1>
        </div>
        <div className="header-buttons">
          <button onClick={onAddMaintenance} className="btn-success">
            ➕ Nuevo Mantenimiento
          </button>
          <button onClick={onPrintQR} className="btn-info">
            🖨️ Imprimir QR
          </button>
        </div>
      </div>

      <div className="detail-container">
        {/* Información básica */}
        <div className="detail-sidebar">
          {/* Foto */}
          <div className="detail-card">
            <h3>📷 Fotografía</h3>
            {tool.foto_url ? (
              <img src={tool.foto_url} alt="Herramienta" className="detail-image" />
            ) : (
              <div className="detail-image-placeholder">🔧</div>
            )}
          </div>

          {/* QR Code */}
          {qrCode && (
            <div className="detail-card">
              <h3>📱 Código QR</h3>
              <div className="qr-container">
                <img src={qrCode} alt="QR Code" />
                <p>Escanea para acceso rápido</p>
              </div>
            </div>
          )}

          {/* Información básica */}
          <div className="detail-card">
            <h3>ℹ️ Información Básica</h3>
            <div className="detail-info">
              <div><strong>Serial Interno:</strong> {tool.internal_serial_number}</div>
              <div><strong>Serial Máquina:</strong> {tool.machine_serial}</div>
              <div><strong>Descripción:</strong> {tool.description}</div>
              <div><strong>Técnico:</strong> {tool.tecnico}</div>
              <div><strong>Lugar:</strong> {tool.lugar}</div>
              <div>
                <strong>Estado:</strong>{' '}
                <span className={`estado-badge estado-${tool.estado}`}>
                  {tool.estado.charAt(0).toUpperCase() + tool.estado.slice(1)}
                </span>
              </div>
              {tool.fabrication_date && (
                <div>
                  <strong>Fecha Fabricación:</strong>{' '}
                  {new Date(tool.fabrication_date).toLocaleDateString('es-ES')}
                </div>
              )}
              {tool.purchase_date && (
                <div>
                  <strong>Fecha Compra:</strong>{' '}
                  {new Date(tool.purchase_date).toLocaleDateString('es-ES')}
                </div>
              )}
              {tool.invoice && (
                <div><strong>Factura:</strong> {tool.invoice}</div>
              )}
            </div>
          </div>
        </div>

        {/* Historial de mantenimientos */}
        <div className="detail-main">
          <div className="detail-card">
            <h3>🔧 Historial de Mantenimientos ({maintenanceHistory.length})</h3>
            
            {/* Formulario de nuevo mantenimiento */}
            {showMaintenanceForm && (
              <div className="maintenance-form">
                <h4>Nuevo Mantenimiento</h4>
                <form onSubmit={onMaintenanceSubmit}>
                  <div className="maintenance-grid">
                    <div className="form-field">
                      <label>Fecha *</label>
                      <input
                        type="date"
                        name="fecha"
                        value={maintenanceForm.fecha}
                        onChange={onMaintenanceChange}
                        required
                      />
                    </div>
                    
                    <div className="form-field">
                      <label>Técnico Encargado *</label>
                      <select
                        name="tecnico_encargado"
                        value={maintenanceForm.tecnico_encargado}
                        onChange={onMaintenanceChange}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {empleados.map(empleado => (
                          <option key={empleado.id} value={empleado.nombre}>
                            {empleado.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="maintenance-grid">
                    <div className="form-field">
                      <label>Tipo</label>
                      <select
                        name="tipo"
                        value={maintenanceForm.tipo}
                        onChange={onMaintenanceChange}
                      >
                        {TIPOS_MANTENIMIENTO.map(tipo => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-field">
                      <label>Próxima Fecha</label>
                      <input
                        type="date"
                        name="proxima_fecha"
                        value={maintenanceForm.proxima_fecha}
                        onChange={onMaintenanceChange}
                      />
                    </div>
                  </div>
                  
                  <div className="form-field">
                    <label>Descripción *</label>
                    <textarea
                      name="descripcion"
                      value={maintenanceForm.descripcion}
                      onChange={onMaintenanceChange}
                      rows={3}
                      placeholder="Describir actividades realizadas..."
                      required
                    />
                  </div>
                  
                  <div className="form-field">
                    <label>Repuestos Utilizados</label>
                    <textarea
                      name="repuestos"
                      value={maintenanceForm.repuestos}
                      onChange={onMaintenanceChange}
                      rows={2}
                      placeholder="Listar repuestos utilizados..."
                    />
                  </div>
                  
                  <div className="form-field">
                    <label>Observaciones</label>
                    <textarea
                      name="observaciones"
                      value={maintenanceForm.observaciones}
                      onChange={onMaintenanceChange}
                      rows={2}
                      placeholder="Observaciones adicionales..."
                    />
                  </div>
                  
                  <div className="form-actions">
                    <button type="button" onClick={onCancelMaintenance} className="btn-secondary">
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="btn-success"
                    >
                      {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Lista de mantenimientos */}
            {maintenanceHistory.length === 0 ? (
              <div className="no-data">
                📋 No hay mantenimientos registrados
              </div>
            ) : (
              <div className="maintenance-history">
                {maintenanceHistory.map((maintenance, index) => (
                  <div 
                    key={maintenance.id} 
                    className="maintenance-item"
                    style={{
                      backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white'
                    }}
                  >
                    <div className="maintenance-header">
                      <div>
                        <div className="maintenance-type">
                          {TIPOS_MANTENIMIENTO.find(t => t.value === maintenance.tipo)?.label || maintenance.tipo}
                        </div>
                        <div className="maintenance-date">
                          📅 {new Date(maintenance.fecha).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                      <div className="maintenance-tech">
                        👨‍🔧 {maintenance.tecnico_encargado}
                      </div>
                    </div>
                    
                    <div className="maintenance-content">
                      <div><strong>Descripción:</strong> {maintenance.descripcion}</div>
                      
                      {maintenance.repuestos && (
                        <div><strong>Repuestos:</strong> {maintenance.repuestos}</div>
                      )}
                      
                      {maintenance.observaciones && (
                        <div><strong>Observaciones:</strong> {maintenance.observaciones}</div>
                      )}
                      
                      {maintenance.proxima_fecha && (
                        <div className="next-maintenance">
                          <strong>Próximo mantenimiento:</strong>{' '}
                          {new Date(maintenance.proxima_fecha).toLocaleDateString('es-ES')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolDetailView;