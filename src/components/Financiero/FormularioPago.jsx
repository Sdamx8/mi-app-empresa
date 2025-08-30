// components/Financiero/FormularioPago.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  User, 
  FileText, 
  Building,
  Hash,
  Save,
  AlertCircle
} from 'lucide-react';

const FormularioPago = ({ pago, modoEdicion, onGuardar, onCerrar }) => {
  const [formData, setFormData] = useState({
    factura_id: '',
    numero_factura: '',
    cliente: '',
    valor_pagado: '',
    metodo_pago: '',
    fecha_pago: '',
    referencia_pago: '',
    banco: '',
    observaciones: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [clientes] = useState([
    'Transportes ABC Ltda',
    'Logística XYZ S.A.S',
    'Servicios DEF',
    'Empresa GHI',
    'Comercial JKL'
  ]);

  const metodosPago = [
    { value: 'efectivo', label: 'Efectivo', requiereBanco: false, requiereReferencia: false },
    { value: 'transferencia', label: 'Transferencia Bancaria', requiereBanco: true, requiereReferencia: true },
    { value: 'cheque', label: 'Cheque', requiereBanco: true, requiereReferencia: true },
    { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito', requiereBanco: false, requiereReferencia: true }
  ];

  const bancos = [
    'Bancolombia',
    'Banco de Bogotá',
    'Davivienda',
    'BBVA',
    'Banco Popular',
    'Banco Caja Social',
    'Banco AV Villas',
    'Banco Agrario',
    'Citibank',
    'Scotiabank Colpatria'
  ];

  useEffect(() => {
    if (pago) {
      // Si viene desde factura pendiente
      if (pago.numero_factura && !pago.numero_recibo) {
        setFormData({
          factura_id: pago.id,
          numero_factura: pago.numero_factura,
          cliente: pago.cliente,
          valor_pagado: pago.total.toString(),
          metodo_pago: '',
          fecha_pago: new Date().toISOString().split('T')[0],
          referencia_pago: '',
          banco: '',
          observaciones: ''
        });
      } else {
        // Si es edición de pago existente
        setFormData({
          factura_id: pago.factura_id || '',
          numero_factura: pago.numero_factura || '',
          cliente: pago.cliente || '',
          valor_pagado: pago.valor_pagado?.toString() || '',
          metodo_pago: pago.metodo_pago || '',
          fecha_pago: pago.fecha_pago || '',
          referencia_pago: pago.referencia_pago || '',
          banco: pago.banco || '',
          observaciones: pago.observaciones || ''
        });
      }
    } else {
      // Nuevo pago sin factura
      setFormData({
        factura_id: '',
        numero_factura: '',
        cliente: '',
        valor_pagado: '',
        metodo_pago: '',
        fecha_pago: new Date().toISOString().split('T')[0],
        referencia_pago: '',
        banco: '',
        observaciones: ''
      });
    }
  }, [pago]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo modificado
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }

    // Limpiar campos dependientes cuando cambia el método de pago
    if (name === 'metodo_pago') {
      const metodoPago = metodosPago.find(m => m.value === value);
      if (metodoPago) {
        setFormData(prev => ({
          ...prev,
          referencia_pago: metodoPago.requiereReferencia ? prev.referencia_pago : '',
          banco: metodoPago.requiereBanco ? prev.banco : ''
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.cliente.trim()) {
      newErrors.cliente = 'El cliente es requerido';
    }

    if (!formData.valor_pagado || parseFloat(formData.valor_pagado) <= 0) {
      newErrors.valor_pagado = 'El valor debe ser mayor a 0';
    }

    if (!formData.metodo_pago) {
      newErrors.metodo_pago = 'Selecciona un método de pago';
    }

    if (!formData.fecha_pago) {
      newErrors.fecha_pago = 'La fecha de pago es requerida';
    }

    const metodoPago = metodosPago.find(m => m.value === formData.metodo_pago);
    if (metodoPago) {
      if (metodoPago.requiereReferencia && !formData.referencia_pago.trim()) {
        newErrors.referencia_pago = 'La referencia es requerida para este método de pago';
      }
      if (metodoPago.requiereBanco && !formData.banco) {
        newErrors.banco = 'El banco es requerido para este método de pago';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const datosPago = {
        ...formData,
        valor_pagado: parseFloat(formData.valor_pagado)
      };

      await onGuardar(datosPago);
      
    } catch (error) {
      console.error('Error guardando pago:', error);
      setErrors({ general: 'Error al guardar el pago. Intenta nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const numericValue = parseFloat(value.toString().replace(/[^\d]/g, ''));
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numericValue);
  };

  const handleValueChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setFormData(prev => ({
      ...prev,
      valor_pagado: value
    }));
  };

  const metodoPagoSeleccionado = metodosPago.find(m => m.value === formData.metodo_pago);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {modoEdicion ? 'Editar Pago' : 'Registrar Pago'}
              </h2>
              <p className="text-sm text-gray-600">
                {modoEdicion ? 'Modifica los datos del pago' : 'Completa la información del pago recibido'}
              </p>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          )}

          {/* Información de la Factura */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Información de la Factura
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Factura
                </label>
                <input
                  type="text"
                  name="numero_factura"
                  value={formData.numero_factura}
                  onChange={handleChange}
                  placeholder="FAC-2025-XXX"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.numero_factura ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.numero_factura && (
                  <p className="mt-1 text-sm text-red-600">{errors.numero_factura}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <input
                  type="text"
                  name="cliente"
                  value={formData.cliente}
                  onChange={handleChange}
                  list="clientes"
                  placeholder="Nombre del cliente"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cliente ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <datalist id="clientes">
                  {clientes.map((cliente, index) => (
                    <option key={index} value={cliente} />
                  ))}
                </datalist>
                {errors.cliente && (
                  <p className="mt-1 text-sm text-red-600">{errors.cliente}</p>
                )}
              </div>
            </div>
          </div>

          {/* Información del Pago */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Detalles del Pago
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Pagado *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    name="valor_pagado"
                    value={formData.valor_pagado}
                    onChange={handleValueChange}
                    placeholder="0"
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.valor_pagado ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {formData.valor_pagado && (
                  <p className="mt-1 text-sm text-green-600 font-medium">
                    {formatCurrency(formData.valor_pagado)}
                  </p>
                )}
                {errors.valor_pagado && (
                  <p className="mt-1 text-sm text-red-600">{errors.valor_pagado}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Pago *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    name="fecha_pago"
                    value={formData.fecha_pago}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.fecha_pago ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.fecha_pago && (
                  <p className="mt-1 text-sm text-red-600">{errors.fecha_pago}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de Pago *
                </label>
                <select
                  name="metodo_pago"
                  value={formData.metodo_pago}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.metodo_pago ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar método</option>
                  {metodosPago.map((metodo) => (
                    <option key={metodo.value} value={metodo.value}>
                      {metodo.label}
                    </option>
                  ))}
                </select>
                {errors.metodo_pago && (
                  <p className="mt-1 text-sm text-red-600">{errors.metodo_pago}</p>
                )}
              </div>

              {metodoPagoSeleccionado?.requiereReferencia && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia/Número *
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      name="referencia_pago"
                      value={formData.referencia_pago}
                      onChange={handleChange}
                      placeholder={
                        formData.metodo_pago === 'transferencia' ? 'Número de transferencia' :
                        formData.metodo_pago === 'cheque' ? 'Número de cheque' :
                        'Número de autorización'
                      }
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.referencia_pago ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.referencia_pago && (
                    <p className="mt-1 text-sm text-red-600">{errors.referencia_pago}</p>
                  )}
                </div>
              )}

              {metodoPagoSeleccionado?.requiereBanco && (
                <div className={metodoPagoSeleccionado?.requiereReferencia ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banco *
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <select
                      name="banco"
                      value={formData.banco}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.banco ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Seleccionar banco</option>
                      {bancos.map((banco) => (
                        <option key={banco} value={banco}>
                          {banco}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.banco && (
                    <p className="mt-1 text-sm text-red-600">{errors.banco}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              rows={3}
              placeholder="Notas adicionales sobre el pago..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {modoEdicion ? 'Actualizar Pago' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default FormularioPago;
