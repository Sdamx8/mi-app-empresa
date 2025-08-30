// components/FormularioRemision.js - Formulario para nueva remisión con campos según especificación
import React, { memo, useEffect } from 'react';
import { THEME_COLORS, MESSAGES, ESTADOS_REMISION, OPCIONES_UNE, OPCIONES_CARROCERIA, FORM_CONFIG } from '../constants';
import useFormRemision from '../hooks/useFormRemision';

const FormularioRemision = memo(({ isOpen, onClose, onSave, initialData = null }) => {
  const {
    formData,
    loading,
    errors,
    servicios,
    tecnicos,
    loadingServicios,
    loadingTecnicos,
    cargarServicios,
    cargarTecnicos,
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
      
      // Cargar datos de servicios y técnicos
      cargarServicios();
      cargarTecnicos();
    }
  }, [isOpen, initialData, resetForm, loadFromData, cargarServicios, cargarTecnicos]);

  // Manejar guardar
  const handleSave = async () => {
    const result = await saveRemision();
    
    if (result.success) {
      onSave(result);
    } else {
      alert(result.error || 'Error al guardar la remisión');
    }
  };

  // Manejar tecla Escape
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  // Formatear número para visualización
  const formatearNumero = (valor) => {
    if (!valor) return '';
    const num = parseFloat(valor);
    if (isNaN(num)) return valor;
    return new Intl.NumberFormat('es-CO').format(Math.round(num));
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
            📝 {initialData?.id ? 'Editar Remisión' : 'Nueva Remisión'}
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
                placeholder="Ej: 1292"
                disabled={loading}
              />
              <FormField
                label="Móvil *"
                value={formData.movil}
                onChange={(value) => updateField('movil', value)}
                error={errors.movil}
                placeholder="Ej: 7194"
                disabled={loading}
              />
              <FormField
                label="No. Orden"
                value={formData.no_orden}
                onChange={(value) => updateField('no_orden', value)}
                error={errors.no_orden}
                placeholder="Ej: JU1601526"
                disabled={loading}
              />
            </div>

            {/* Fila 2: Estado, Carrocería y UNE */}
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

              <div style={fieldStyle}>
                <label style={labelStyle}>Carrocería</label>
                <select
                  value={formData.carroceria}
                  onChange={(e) => updateField('carroceria', e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.carroceria ? THEME_COLORS.danger : '#ced4da'
                  }}
                  disabled={loading}
                >
                  <option value="">Seleccionar carrocería...</option>
                  {OPCIONES_CARROCERIA.map(carroceria => (
                    <option key={carroceria.value} value={carroceria.value}>
                      {carroceria.label}
                    </option>
                  ))}
                </select>
                {errors.carroceria && <span style={errorStyle}>{errors.carroceria}</span>}
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>UNE</label>
                <select
                  value={formData.une}
                  onChange={(e) => updateField('une', e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.une ? THEME_COLORS.danger : '#ced4da'
                  }}
                  disabled={loading}
                >
                  {OPCIONES_UNE.map(une => (
                    <option key={une.value} value={une.value}>
                      {une.label}
                    </option>
                  ))}
                </select>
                {errors.une && <span style={errorStyle}>{errors.une}</span>}
              </div>
            </div>

            {/* Fila 3: Servicios (Descripción) - Selección múltiple */}
            <div style={fullWidthRowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Descripción (Servicios) *</label>
                <select
                  multiple
                  value={formData.descripcion}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    updateField('descripcion', selectedOptions);
                  }}
                  style={{
                    ...selectMultipleStyle,
                    borderColor: errors.descripcion ? THEME_COLORS.danger : '#ced4da'
                  }}
                  disabled={loading || loadingServicios}
                >
                  {loadingServicios ? (
                    <option disabled>Cargando servicios...</option>
                  ) : (
                    servicios.map(servicio => (
                      <option key={servicio.id} value={servicio.id}>
                        {servicio.titulo} - ${formatearNumero(servicio.subtotal)}
                      </option>
                    ))
                  )}
                </select>
                <small style={helpTextStyle}>
                  Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples servicios
                </small>
                {errors.descripcion && <span style={errorStyle}>{errors.descripcion}</span>}
              </div>
            </div>

            {/* Fila 4: Fechas principales */}
            <div style={rowStyle}>
              <FormField
                label="Fecha Remisión *"
                value={formData.fecha_remision}
                onChange={(value) => updateField('fecha_remision', value)}
                error={errors.fecha_remision}
                type="date"
                disabled={loading}
              />
              <FormField
                label="Fecha Máximo"
                value={formData.fecha_maximo}
                onChange={(value) => updateField('fecha_maximo', value)}
                error={errors.fecha_maximo}
                type="date"
                disabled={loading}
              />
              <FormField
                label="Fecha Bitácora Profesional"
                value={formData.fecha_bit_prof}
                onChange={(value) => updateField('fecha_bit_prof', value)}
                error={errors.fecha_bit_prof}
                type="date"
                disabled={loading}
              />
            </div>

            {/* Fila 5: Fechas adicionales y campos de texto */}
            <div style={rowStyle}>
              <FormField
                label="Radicación"
                value={formData.radicacion}
                onChange={(value) => updateField('radicacion', value)}
                error={errors.radicacion}
                type="date"
                disabled={loading}
              />
              <FormField
                label="Fecha ID Bit"
                value={formData.fecha_id_bit}
                onChange={(value) => updateField('fecha_id_bit', value)}
                error={errors.fecha_id_bit}
                placeholder="Ej: 133445"
                disabled={loading}
              />
              <FormField
                label="No. Factura Elect."
                value={formData.no_fact_elect}
                onChange={(value) => updateField('no_fact_elect', value)}
                error={errors.no_fact_elect}
                placeholder="Ej: FVGM-144"
                disabled={loading}
              />
            </div>

            {/* Fila 6: Personal */}
            <div style={rowStyle}>
              <FormField
                label="Autorizó"
                value={formData.autorizo}
                onChange={(value) => updateField('autorizo', value)}
                error={errors.autorizo}
                placeholder="Ej: FABIAN GIRALDO"
                disabled={loading}
              />
              <FormField
                label="Generó"
                value={formData.genero}
                onChange={(value) => updateField('genero', value)}
                error={errors.genero}
                placeholder="Cargado automáticamente"
                disabled={true}
                helpText="Se carga automáticamente del usuario autenticado"
              />
            </div>

            {/* Fila 7: Técnicos - Selección múltiple */}
            <div style={fullWidthRowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Técnico(s) *</label>
                <select
                  multiple
                  value={formData.tecnico}
                  onChange={(e) => {
                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                    updateField('tecnico', selectedOptions);
                  }}
                  style={{
                    ...selectMultipleStyle,
                    borderColor: errors.tecnico ? THEME_COLORS.danger : '#ced4da'
                  }}
                  disabled={loading || loadingTecnicos}
                >
                  {loadingTecnicos ? (
                    <option disabled>Cargando técnicos...</option>
                  ) : (
                    tecnicos.map(tecnico => (
                      <option key={tecnico.id} value={tecnico.id}>
                        {tecnico.nombre}
                      </option>
                    ))
                  )}
                </select>
                <small style={helpTextStyle}>
                  Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples técnicos
                </small>
                {errors.tecnico && <span style={errorStyle}>{errors.tecnico}</span>}
              </div>
            </div>

            {/* Fila 8: Valores monetarios */}
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Subtotal</label>
                <input
                  type="text"
                  value={formatearNumero(formData.subtotal)}
                  onChange={(e) => {
                    // Remover formato para almacenar solo números
                    const numero = e.target.value.replace(/[^\d]/g, '');
                    updateField('subtotal', numero);
                  }}
                  style={{
                    ...inputStyle,
                    borderColor: errors.subtotal ? THEME_COLORS.danger : '#ced4da',
                    textAlign: 'right'
                  }}
                  placeholder="Ej: 180,000"
                  disabled={loading}
                />
                {errors.subtotal && <span style={errorStyle}>{errors.subtotal}</span>}
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Total (con IVA 19%)</label>
                <input
                  type="text"
                  value={formatearNumero(formData.total)}
                  style={{
                    ...inputStyle,
                    backgroundColor: '#f8f9fa',
                    textAlign: 'right'
                  }}
                  placeholder="Calculado automáticamente"
                  disabled={true}
                />
                <small style={helpTextStyle}>
                  Se calcula automáticamente: subtotal + 19% IVA
                </small>
              </div>
            </div>
          </form>
        </div>

        {/* Footer con botones */}
        <div style={footerStyle}>
          <button
            onClick={onClose}
            style={secondaryButtonStyle}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              ...primaryButtonStyle,
              opacity: loading ? 0.7 : 1
            }}
            disabled={loading}
          >
            {loading ? '⏳ Guardando...' : (initialData?.id ? '💾 Actualizar' : '✅ Guardar')}
          </button>
        </div>
      </div>
    </div>
  );
});

// Componente auxiliar para campos de formulario
const FormField = ({ label, value, onChange, error, type = 'text', placeholder, disabled, helpText }) => (
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
    {helpText && <small style={helpTextStyle}>{helpText}</small>}
    {error && <span style={errorStyle}>{error}</span>}
  </div>
);
                placeholder="Ej: 7194"
                disabled={loading}
              />
            </div>

            {/* Fila 2: Estado y UNE */}
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
              <div style={fieldStyle}>
                <label style={labelStyle}>UNE *</label>
                <select
                  value={formData.une}
                  onChange={(e) => updateField('une', e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.une ? THEME_COLORS.danger : '#ced4da'
                  }}
                  disabled={loading}
                >
                  {OPCIONES_UNE.map(opcion => (
                    <option key={opcion.value} value={opcion.value}>
                      {opcion.label}
                    </option>
                  ))}
                </select>
                {errors.une && <span style={errorStyle}>{errors.une}</span>}
              </div>
            </div>

            {/* Fila 3: Técnico y Autorizo */}
            <div style={rowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Técnico *</label>
                <select
                  value={formData.tecnico}
                  onChange={(e) => updateField('tecnico', e.target.value)}
                  style={{
                    ...inputStyle,
                    borderColor: errors.tecnico ? THEME_COLORS.danger : '#ced4da'
                  }}
                  disabled={loading || loadingTecnicos}
                >
                  <option value="">
                    {loadingTecnicos ? 'Cargando técnicos...' : 'Seleccionar técnico'}
                  </option>
                  {tecnicos.map(tecnico => (
                    <option key={tecnico.id} value={tecnico.nombre}>
                      {tecnico.nombre}
                    </option>
                  ))}
                </select>
                {errors.tecnico && <span style={errorStyle}>{errors.tecnico}</span>}
              </div>
              <FormField
                label="Autorizó *"
                value={formData.autorizo}
                onChange={(value) => updateField('autorizo', value)}
                error={errors.autorizo}
                placeholder="Ej: FABIAN GIRALDO"
                disabled={loading}
              />
            </div>

            {/* Fila 4: Descripción del servicio */}
            <div style={fullWidthRowStyle}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Descripción del Trabajo *</label>
                <select
                  value={formData.descripcion}
                  onChange={(e) => {
                    const selectedService = servicios.find(s => s.titulo === e.target.value);
                    if (selectedService) {
                      updateField('descripcion', selectedService);
                    } else {
                      updateField('descripcion', e.target.value);
                    }
                  }}
                  style={{
                    ...inputStyle,
                    borderColor: errors.descripcion ? THEME_COLORS.danger : '#ced4da'
                  }}
                  disabled={loading || loadingServicios}
                >
                  <option value="">
                    {loadingServicios ? 'Cargando servicios...' : 'Seleccionar servicio'}
                  </option>
                  {servicios.map(servicio => (
                    <option key={servicio.id} value={servicio.titulo}>
                      {servicio.titulo}
                    </option>
                  ))}
                </select>
                {errors.descripcion && <span style={errorStyle}>{errors.descripcion}</span>}
              </div>
            </div>

            {/* Fila 5: Fechas principales */}
            <div style={rowStyle}>
              <FormField
                label="Fecha Remisión *"
                value={formData.fecha_remision}
                onChange={(value) => updateField('fecha_remision', value)}
                error={errors.fecha_remision}
                type="date"
                disabled={loading}
              />
              <FormField
                label="Fecha Bitácora Profesional"
                value={formData.fecha_bit_prof}
                onChange={(value) => updateField('fecha_bit_prof', value)}
                error={errors.fecha_bit_prof}
                type="date"
                disabled={loading}
              />
            </div>

            {/* Fila 6: Fechas adicionales */}
            <div style={rowStyle}>
              <FormField
                label="Fecha Máximo"
                value={formData.fecha_maximo}
                onChange={(value) => updateField('fecha_maximo', value)}
                error={errors.fecha_maximo}
                type="date"
                disabled={loading}
              />
              <FormField
                label="Radicación"
                value={formData.radicacion}
                onChange={(value) => updateField('radicacion', value)}
                error={errors.radicacion}
                type="date"
                disabled={loading}
              />
            </div>

            {/* Fila 7: Información del vehículo */}
            <div style={rowStyle}>
              <FormField
                label="Carrocería"
                value={formData.carroceria}
                onChange={(value) => updateField('carroceria', value)}
                error={errors.carroceria}
                placeholder="Ej: VOLVO-B215RH"
                disabled={loading}
              />
              <FormField
                label="Generó"
                value={formData.genero}
                onChange={(value) => updateField('genero', value)}
                error={errors.genero}
                placeholder="Ej: ERICA FAJARDO"
                disabled={loading}
              />
            </div>

            {/* Fila 8: Números de documentos */}
            <div style={rowStyle}>
              <FormField
                label="No. Orden"
                value={formData.no_orden}
                onChange={(value) => updateField('no_orden', value)}
                error={errors.no_orden}
                placeholder="Ej: JU1601526"
                disabled={loading}
              />
              <FormField
                label="No. Factura Electrónica"
                value={formData.no_fact_elect}
                onChange={(value) => updateField('no_fact_elect', value)}
                error={errors.no_fact_elect}
                placeholder="Ej: FVGM-144"
                disabled={loading}
              />
            </div>

            {/* Fila 9: ID Bitácora */}
            <div style={rowStyle}>
              <FormField
                label="No. ID-Bit"
                value={formData['No_id-bit']}
                onChange={(value) => updateField('No_id-bit', value)}
                error={errors['No_id-bit']}
                placeholder="Ej: 133445"
                disabled={loading}
              />
            </div>

            {/* Fila 10: Valores monetarios */}
            <div style={rowStyle}>
              <FormField
                label="Subtotal"
                value={formData.subtotal}
                onChange={(value) => updateField('subtotal', value)}
                error={errors.subtotal}
                placeholder="Ej: 180000"
                type="number"
                disabled={loading}
                readOnly
              />
              <FormField
                label="Total (con IVA 19%)"
                value={formData.total}
                onChange={(value) => updateField('total', value)}
                error={errors.total}
                placeholder="Ej: 214200"
                type="number"
                disabled={loading}
                readOnly
              />
            </div>
          </form>
        </div>

        {/* Footer con botones */}
        <div style={footerStyle}>
          <button
            type="button"
            onClick={onClose}
            style={cancelButtonStyle}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={saveButtonStyle}
            disabled={loading}
          >
            {loading ? 'Guardando...' : (initialData?.id ? 'Actualizar' : 'Guardar')}
          </button>
        </div>
      </div>
    </div>
  );
});

// Componente FormField
const FormField = ({ label, value, onChange, error, placeholder, type = 'text', disabled = false, readOnly = false }) => (
  <div style={fieldStyle}>
    <label style={labelStyle}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...inputStyle,
        borderColor: error ? THEME_COLORS.danger : '#ced4da',
        backgroundColor: readOnly ? '#f8f9fa' : 'white'
      }}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
    />
    {error && <span style={errorStyle}>{error}</span>}
  </div>
);

// Estilos del componente
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  width: '90%',
  maxWidth: '900px',
  maxHeight: '90vh',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  position: 'relative'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px',
  backgroundColor: THEME_COLORS.primary,
  color: 'white'
};

const titleStyle = {
  margin: 0,
  fontSize: '18px',
  fontWeight: '600'
};

const closeButtonStyle = {
  backgroundColor: 'transparent',
  border: 'none',
  color: 'white',
  fontSize: '20px',
  cursor: 'pointer',
  padding: '5px',
  borderRadius: '4px'
};

const contentStyle = {
  padding: '20px',
  maxHeight: 'calc(90vh - 140px)',
  overflowY: 'auto'
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '16px',
  marginBottom: '16px'
};

const fullWidthRowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '16px',
  marginBottom: '16px'
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const labelStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#333',
  marginBottom: '4px'
};

const inputStyle = {
  padding: '10px 12px',
  border: '1px solid #ced4da',
  borderRadius: '6px',
  fontSize: '14px',
  transition: 'border-color 0.2s'
};

const errorStyle = {
  fontSize: '12px',
  color: THEME_COLORS.danger,
  marginTop: '2px'
};

const footerStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderTop: '1px solid #e9ecef'
};

const cancelButtonStyle = {
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer'
};

const saveButtonStyle = {
  backgroundColor: THEME_COLORS.primary,
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer'
};

export default FormularioRemision;
