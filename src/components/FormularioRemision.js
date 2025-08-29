// components/FormularioRemision.js - Formulario flotante para nueva remisión
import React, { memo, useEffect } from 'react';
import { THEME_COLORS, MESSAGES, ESTADOS_REMISION, FORM_CONFIG } from '../constants';
import useFormRemision from '../hooks/useFormRemision';

const FormularioRemision = memo(({ isOpen, onClose, onSave }) => {
  const {
    formData,
    loading,
    errors,
    updateField,
    resetForm,
    saveRemision
  } = useFormRemision();

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSave = async () => {
    const result = await saveRemision();
    if (result.success) {
      onSave(result);
      onClose();
    } else {
      // El error se maneja en el hook
      console.error('Error al guardar:', result.error);
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

  return (
    <div
      style={overlayStyle}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div style={modalStyle}>
        {/* Header del modal */}
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            📝 {MESSAGES.FORM_TITLE}
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
        <div style={contentStyle}>
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

            {/* Fila 2: Estado y descripción */}
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
            </div>

            {/* Fila 3: Descripción (campo largo) */}
            <div style={fullWidthRowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Descripción del Trabajo *</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => updateField('descripcion', e.target.value)}
                  style={{
                    ...textareaStyle,
                    borderColor: errors.descripcion ? THEME_COLORS.danger : '#ced4da'
                  }}
                  placeholder="Describa detalladamente el trabajo realizado..."
                  rows={3}
                  disabled={loading}
                />
                {errors.descripcion && <span style={errorStyle}>{errors.descripcion}</span>}
              </div>
            </div>

            {/* Fila 4: Información adicional */}
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

            {/* Fila 5: Números de orden y factura */}
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
            </div>

            {/* Fila 6: Radicación y género */}
            <div style={rowStyle}>
              <FormField
                label="Radicación"
                value={formData.radicacion}
                onChange={(value) => updateField('radicacion', value)}
                placeholder="Número de radicación"
                disabled={loading}
              />
              <FormField
                label="Generó"
                value={formData.genero}
                onChange={(value) => updateField('genero', value)}
                placeholder="Quien generó"
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
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
  backdropFilter: 'blur(2px)'
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '100%',
  maxWidth: FORM_CONFIG.MODAL_WIDTH,
  maxHeight: FORM_CONFIG.MODAL_MAX_HEIGHT,
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  display: 'flex',
  flexDirection: 'column',
  animation: `modalSlideIn ${FORM_CONFIG.ANIMATION_DURATION} ease-out`
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
  overflowY: 'auto'
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

// Agregar animación CSS
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
`;
document.head.appendChild(style);

FormularioRemision.displayName = 'FormularioRemision';
FormField.displayName = 'FormField';

export default FormularioRemision;
