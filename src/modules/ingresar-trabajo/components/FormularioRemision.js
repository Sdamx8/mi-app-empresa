// components/FormularioRemision.js - Formulario flotante para nueva remisión
import React, { memo, useEffect } from 'react';
import { THEME_COLORS, MESSAGES, ESTADOS_REMISION, FORM_CONFIG } from '../../../shared/constants';
import useFormRemision from '../hooks/useFormRemision';
import './FormularioRemision.css';

const FormularioRemision = memo(({ isOpen, onClose, onSave, initialData = null }) => {
  const {
    formData,
    loading,
    errors,
    updateField,
    resetForm,
    loadFromData,
    saveRemision
  } = useFormRemision(initialData);

  // Resetear / cargar formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (initialData?.id) {
        loadFromData(initialData);
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialData, resetForm, loadFromData]);

  // Manejo mejorado del scroll del modal
  useEffect(() => {
    if (isOpen) {
      // Obtener ancho de scrollbar para compensar
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Prevenir scroll del fondo pero NO bloquear completamente
      const originalOverflow = document.body.style.overflow;
      const originalPadding = document.body.style.paddingRight;
      
      // Solo aplicar overflow hidden si realmente hay una scrollbar
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
        document.body.style.overflow = 'hidden';
      }
      
      // Forzar que los elementos del modal mantengan su scroll
      const modalElements = document.querySelectorAll('.modal-scrollable');
      modalElements.forEach(element => {
        element.style.overflow = 'auto';
        element.style.overflowY = 'auto';
        element.style.overflowX = 'hidden';
      });
      
      return () => {
        // Restaurar estilos originales
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPadding;
      };
    }
  }, [isOpen]);

  const handleSave = async () => {
    const result = await saveRemision();
    if (result.success) {
      // Enviar resultado con número de remisión incluido
      onSave(result);
      // NO cerrar inmediatamente - permitir que IngresarTrabajo.js maneje la integración
      // onClose(); // Comentado para permitir que se muestren las opciones de integración
    } else {
      // El error se maneja en el hook
      console.error('Error al guardar:', result.error);
    }
  };

  const handleSaveAndCreateReport = async () => {
    const result = await saveRemision();
    if (result.success) {
      console.log('🚀 Guardando y redirigiendo a Informes Técnicos:', result.numeroRemision);
      
      // Enviar resultado con flag especial para redirección automática
      onSave({
        ...result,
        redirectToReports: true // Flag especial para indicar redirección
      });
      
      // Cerrar modal inmediatamente para esta acción
      onClose();
      
      // Intentar redirección directa como fallback
      try {
        const { redirigirAInformesTecnicos } = await import('../../../shared/services/integracionModulos');
        setTimeout(() => {
          redirigirAInformesTecnicos(result.numeroRemision);
        }, 500); // Dar tiempo para que se procese el guardado
      } catch (error) {
        console.error('❌ Error en redirección directa:', error);
      }
    } else {
      console.error('Error al guardar para crear informe:', result.error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  // Función para manejar clicks en el overlay (solo cerrar si es exactamente el overlay)
  const handleOverlayClick = (e) => {
    // Solo cerrar si el click fue exactamente en el overlay, no en el modal
    if (e.target.classList && e.target.classList.contains('formulario-modal-overlay')) {
      onClose();
    }
  };

  // Prevenir la propagación de eventos del modal hacia el overlay
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="formulario-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="formulario-modal" onClick={handleModalClick}>
        {/* Header del modal */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            📝 {initialData?.id ? 'Editar Remisión' : MESSAGES.FORM_TITLE}
          </h2>
          <button
            onClick={onClose}
            style={closeButtonStyle}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Contenido del formulario */}
        <div style={contentStyle} className="modal-scrollable">
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Fila 1: Información básica */}
            <div style={rowStyle}>
              <FormField
                label="Número de Remisión *"
                value={formData.remision}
                onChange={(value) => updateField('remision', value)}
                error={errors.remision}
                placeholder="Ej: REM-2025-001"
                disabled={loading}
              />
              <FormField
                label="Móvil *"
                value={formData.movil}
                onChange={(value) => updateField('movil', value)}
                error={errors.movil}
                placeholder="Ej: MOV-001"
                disabled={loading}
              />
            </div>

            {/* Fila 2: Estado y totales */}
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Estado *</label>
                <select
                  value={formData.estado}
                  onChange={(e) => updateField('estado', e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.estado ? THEME_COLORS.danger : '#ced4da'
                  }}
                  disabled={loading}
                >
                  {ESTADOS_REMISION.map(estado => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
                {errors.estado && <span style={errorStyle}>{errors.estado}</span>}
              </div>
              <FormField
                label="Subtotal"
                value={formData.subtotal}
                onChange={(value) => updateField('subtotal', value)}
                error={errors.subtotal}
                placeholder="Ej: 150000"
                type="number"
                disabled={loading}
              />
              <div style={fieldStyle}>
                <label style={labelStyle}>Total (incluye IVA 19%)</label>
                <input
                  type="number"
                  value={formData.total}
                  style={{
                    ...inputStyle,
                    backgroundColor: '#f8f9fa',
                    cursor: 'not-allowed'
                  }}
                  placeholder="Calculado automáticamente"
                  disabled={true}
                  readOnly={true}
                />
                {formData.subtotal && formData.total && (
                  <span style={{fontSize: '12px', color: '#6c757d', marginTop: '4px'}}>
                    IVA (19%): ${(parseFloat(formData.subtotal) * 0.19).toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Fila 3: Fechas */}
            <div style={rowStyle}>
              <FormField
                label="Fecha Remisión"
                value={formData.fecha_remision}
                onChange={(value) => updateField('fecha_remision', value)}
                placeholder="YYYY-MM-DD"
                type="date"
                disabled={loading}
              />
              <FormField
                label="Fecha Bitácora Profesional"
                value={formData.fecha_bit_prof}
                onChange={(value) => updateField('fecha_bit_prof', value)}
                placeholder="YYYY-MM-DD"
                type="date"
                disabled={loading}
              />
            </div>

            <div style={rowStyle}>
              <FormField
                label="Fecha Máximo"
                value={formData.fecha_maximo}
                onChange={(value) => updateField('fecha_maximo', value)}
                placeholder="YYYY-MM-DD"
                type="date"
                disabled={loading}
              />
            </div>

            {/* Fila 4: Servicios realizados */}
            <div style={fullWidthRowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Servicios Realizados</label>
                <div style={{display: 'grid', gap: '8px'}}>
                  <FormField
                    label="Servicio 1 *"
                    value={formData.servicio1}
                    onChange={(value) => updateField('servicio1', value)}
                    error={errors.servicio1}
                    placeholder="Describa el primer servicio realizado..."
                    disabled={loading}
                  />
                  <FormField
                    label="Servicio 2"
                    value={formData.servicio2}
                    onChange={(value) => updateField('servicio2', value)}
                    placeholder="Describa el segundo servicio (opcional)..."
                    disabled={loading}
                  />
                  <FormField
                    label="Servicio 3"
                    value={formData.servicio3}
                    onChange={(value) => updateField('servicio3', value)}
                    placeholder="Describa el tercer servicio (opcional)..."
                    disabled={loading}
                  />
                  <FormField
                    label="Servicio 4"
                    value={formData.servicio4}
                    onChange={(value) => updateField('servicio4', value)}
                    placeholder="Describa el cuarto servicio (opcional)..."
                    disabled={loading}
                  />
                  <FormField
                    label="Servicio 5"
                    value={formData.servicio5}
                    onChange={(value) => updateField('servicio5', value)}
                    placeholder="Describa el quinto servicio (opcional)..."
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Fila 5: Técnicos asignados */}
            <div style={rowStyle}>
              <FormField
                label="Técnico 1 *"
                value={formData.tecnico1}
                onChange={(value) => updateField('tecnico1', value)}
                error={errors.tecnico1}
                placeholder="Nombre del técnico principal"
                disabled={loading}
              />
              <FormField
                label="Técnico 2"
                value={formData.tecnico2}
                onChange={(value) => updateField('tecnico2', value)}
                placeholder="Nombre del segundo técnico (opcional)"
                disabled={loading}
              />
              <FormField
                label="Técnico 3"
                value={formData.tecnico3}
                onChange={(value) => updateField('tecnico3', value)}
                placeholder="Nombre del tercer técnico (opcional)"
                disabled={loading}
              />
            </div>

            {/* Fila 6: Información adicional */}
            <div style={rowStyle}>
              <FormField
                label="Autorizó"
                value={formData.autorizo}
                onChange={(value) => updateField('autorizo', value)}
                placeholder="Nombre quien autorizó"
                disabled={loading}
              />
              <FormField
                label="Carrocería"
                value={formData.carroceria}
                onChange={(value) => updateField('carroceria', value)}
                placeholder="Tipo de carrocería"
                disabled={loading}
              />
            </div>

            {/* Fila 7: Números de orden y factura */}
            <div style={rowStyle}>
              <FormField
                label="No. Orden"
                value={formData.no_orden}
                onChange={(value) => updateField('no_orden', value)}
                placeholder="Número de orden"
                disabled={loading}
              />
              <FormField
                label="No. Factura Electrónica"
                value={formData.no_fact_elect}
                onChange={(value) => updateField('no_fact_elect', value)}
                placeholder="Número de factura"
                disabled={loading}
              />
              <FormField
                label="No. ID Bit"
                value={formData.no_id_bit}
                onChange={(value) => updateField('no_id_bit', value)}
                placeholder="Número ID bit"
                type="number"
                disabled={loading}
              />
            </div>

            {/* Fila 8: Radicación y género */}
            <div style={rowStyle}>
              <FormField
                label="Radicación"
                value={formData.radicacion}
                onChange={(value) => updateField('radicacion', value)}
                placeholder="Fecha de radicación"
                type="date"
                disabled={loading}
              />
              <FormField
                label="Generó"
                value={formData.genero}
                onChange={(value) => updateField('genero', value)}
                placeholder="Quien generó"
                disabled={loading}
              />
              <FormField
                label="UNE"
                value={formData.une}
                onChange={(value) => updateField('une', value)}
                placeholder="Código UNE"
                disabled={loading}
              />
            </div>
          </form>
        </div>

        {/* Footer con botones */}
        <div style={footerStyle}>
          <div style={buttonGroupStyle}>
            <button
              onClick={onClose}
              style={cancelButtonStyle}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              style={{
                ...saveButtonStyle,
                backgroundColor: loading ? '#6c757d' : THEME_COLORS.success,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar'}
            </button>
            
            {/* Botón para guardar y crear informe técnico directamente */}
            <button
              onClick={handleSaveAndCreateReport}
              style={{
                ...saveButtonStyle,
                backgroundColor: loading ? '#6c757d' : THEME_COLORS.info,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
              title="Guardar remisión e ir directamente a crear informe técnico"
            >
              {loading ? '⏳ Guardando...' : '📝 Guardar + Informe Técnico'}
            </button>
          </div>
          <div style={hintStyle}>
            💡 Tip: Presiona Ctrl+Enter para guardar rápidamente
          </div>
        </div>
      </div>
    </div>
  );
});

// Componente reutilizable para campos del formulario
const FormField = memo(({ label, value, onChange, error, placeholder, type = 'text', disabled }) => (
  <div style={fieldStyle}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...inputStyle,
        borderColor: error ? THEME_COLORS.danger : '#ced4da'
      }}
      placeholder={placeholder}
      disabled={disabled}
    />
    {error && <span style={errorStyle}>{error}</span>}
  </div>
));

// Estilos del componente
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'flex-start', // Cambiar de 'center' a 'flex-start' para posicionar al inicio
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
  paddingTop: '40px', // Espacio desde la parte superior
  backdropFilter: 'blur(2px)',
  overflowY: 'auto' // Permitir scroll si el modal es muy alto
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '100%',
  maxWidth: FORM_CONFIG.MODAL_WIDTH,
  maxHeight: 'calc(100vh - 80px)', // Ajustar altura máxima considerando padding
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  flexDirection: 'column',
  animation: `modalSlideIn ${FORM_CONFIG.ANIMATION_DURATION} ease-out`,
  margin: '0 20px' // Margen lateral para pantallas pequeñas
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: '1px solid #e9ecef',
  backgroundColor: THEME_COLORS.light
};

const titleStyle = {
  margin: 0,
  color: THEME_COLORS.dark,
  fontSize: '1.5rem',
  fontWeight: '600'
};

const closeButtonStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer',
  color: '#6c757d',
  padding: '5px',
  borderRadius: '4px',
  transition: 'all 0.2s'
};

const contentStyle = {
  padding: '24px',
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  maxHeight: 'calc(85vh - 140px)', // Aumentar altura disponible
  scrollbarWidth: 'thin', // Firefox
  scrollbarColor: '#cbd5e0 #f7fafc', // Firefox - colores personalizados
  // Webkit scrollbar personalizado
  WebkitScrollbar: {
    width: '8px'
  },
  // Asegurar que el scroll funcione correctamente
  scrollBehavior: 'smooth',
  // Permitir interacción táctil en dispositivos móviles
  WebkitOverflowScrolling: 'touch'
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
  marginBottom: '20px'
};

const fullWidthRowStyle = {
  marginBottom: '20px'
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column'
};

const labelStyle = {
  marginBottom: '6px',
  fontWeight: '500',
  color: THEME_COLORS.dark,
  fontSize: '14px'
};

const inputStyle = {
  padding: '10px 12px',
  border: '1px solid #ced4da',
  borderRadius: '6px',
  fontSize: '14px',
  transition: 'border-color 0.2s',
  backgroundColor: 'white'
};

const textareaStyle = {
  ...inputStyle,
  resize: 'vertical',
  minHeight: '80px',
  fontFamily: 'inherit'
};

const errorStyle = {
  color: THEME_COLORS.danger,
  fontSize: '12px',
  marginTop: '4px'
};

const footerStyle = {
  padding: '20px 24px',
  borderTop: '1px solid #e9ecef',
  backgroundColor: THEME_COLORS.light,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '12px'
};

const cancelButtonStyle = {
  padding: '10px 20px',
  border: '1px solid #6c757d',
  borderRadius: '6px',
  backgroundColor: 'white',
  color: '#6c757d',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s'
};

const saveButtonStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '6px',
  color: 'white',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s'
};

const hintStyle = {
  fontSize: '12px',
  color: '#6c757d',
  fontStyle: 'italic'
};

// Agregar estilos CSS incluyendo scrollbar personalizada
const style = document.createElement('style');
style.textContent = `
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-50px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  /* Estilos personalizados para scrollbar del modal */
  .modal-scrollable::-webkit-scrollbar {
    width: 8px;
  }
  
  .modal-scrollable::-webkit-scrollbar-track {
    background: #f7fafc;
    border-radius: 4px;
  }
  
  .modal-scrollable::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
    transition: background 0.2s ease;
  }
  
  .modal-scrollable::-webkit-scrollbar-thumb:hover {
    background: #a0aec0;
  }
  
  /* Asegurar que el scroll funcione en todos los navegadores */
  .modal-scrollable {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
`;
document.head.appendChild(style);

FormularioRemision.displayName = 'FormularioRemision';
FormField.displayName = 'FormField';

export default FormularioRemision;
