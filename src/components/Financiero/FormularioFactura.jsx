// components/Financiero/FormularioFactura.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Trash2, Calculator, FileText, Search } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const FormularioFactura = ({ factura, modoEdicion, onGuardar, onCerrar }) => {
  const [formData, setFormData] = useState({
    cliente: {
      nombre: '',
      nit: '',
      direccion: '',
      email: '',
      telefono: ''
    },
    fecha_vencimiento: '',
    items: [
      {
        descripcion: '',
        cantidad: 1,
        valor_unitario: 0,
        subtotal: 0
      }
    ],
    subtotal: 0,
    descuento: 0,
    iva_porcentaje: 19,
    iva: 0,
    retencion_porcentaje: 0,
    retencion: 0,
    total: 0,
    observaciones: '',
    remision_id: ''
  });

  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesSugeridos, setClientesSugeridos] = useState([]);
  const [remisionesSugeridas, setRemisionesSugeridas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modoEdicion && factura) {
      setFormData({
        ...formData,
        ...factura
      });
    } else {
      // Establecer fecha de vencimiento por defecto (30 días)
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
      setFormData({
        ...formData,
        fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0]
      });
    }
  }, [factura, modoEdicion]);

  useEffect(() => {
    calcularTotales();
  }, [formData.items, formData.descuento, formData.iva_porcentaje, formData.retencion_porcentaje]);

  const calcularTotales = () => {
    const subtotal = formData.items.reduce((acc, item) => acc + item.subtotal, 0);
    const descuento = formData.descuento || 0;
    const subtotalConDescuento = subtotal - descuento;
    const iva = (subtotalConDescuento * (formData.iva_porcentaje || 0)) / 100;
    const retencion = (subtotalConDescuento * (formData.retencion_porcentaje || 0)) / 100;
    const total = subtotalConDescuento + iva - retencion;

    setFormData(prev => ({
      ...prev,
      subtotal,
      iva,
      retencion,
      total
    }));
  };

  const buscarClientes = async (termino) => {
    if (termino.length < 2) {
      setClientesSugeridos([]);
      return;
    }

    try {
      // Simulación de búsqueda de clientes
      const clientesSimulados = [
        {
          nombre: 'Transportes ABC Ltda',
          nit: '123456789-1',
          direccion: 'Calle 123 #45-67',
          email: 'facturacion@abc.com',
          telefono: '3001234567'
        },
        {
          nombre: 'Logística XYZ S.A.S',
          nit: '987654321-2',
          direccion: 'Carrera 45 #78-90',
          email: 'contabilidad@xyz.com',
          telefono: '3009876543'
        }
      ];

      const resultados = clientesSimulados.filter(cliente =>
        cliente.nombre.toLowerCase().includes(termino.toLowerCase()) ||
        cliente.nit.includes(termino)
      );

      setClientesSugeridos(resultados);
    } catch (error) {
      console.error('Error buscando clientes:', error);
    }
  };

  const buscarRemisiones = async () => {
    try {
      // Simulación de búsqueda de remisiones
      const remisionesSimuladas = [
        {
          id: 'REM-2025-001',
          numero: 'REM-2025-001',
          cliente: 'Transportes ABC Ltda',
          fecha: '2025-01-15',
          total: 200000,
          servicios: [
            { descripcion: 'Mantenimiento preventivo', cantidad: 1, valor: 150000 },
            { descripcion: 'Cambio de filtros', cantidad: 2, valor: 25000 }
          ]
        }
      ];

      setRemisionesSugeridas(remisionesSimuladas);
    } catch (error) {
      console.error('Error buscando remisiones:', error);
    }
  };

  const seleccionarCliente = (cliente) => {
    setFormData(prev => ({
      ...prev,
      cliente: cliente
    }));
    setBusquedaCliente(cliente.nombre);
    setClientesSugeridos([]);
  };

  const seleccionarRemision = (remision) => {
    const itemsDesdeRemision = remision.servicios.map(servicio => ({
      descripcion: servicio.descripcion,
      cantidad: servicio.cantidad,
      valor_unitario: servicio.valor,
      subtotal: servicio.cantidad * servicio.valor
    }));

    setFormData(prev => ({
      ...prev,
      remision_id: remision.id,
      items: itemsDesdeRemision
    }));
  };

  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...formData.items];
    nuevosItems[index] = {
      ...nuevosItems[index],
      [campo]: valor
    };

    // Calcular subtotal del item
    if (campo === 'cantidad' || campo === 'valor_unitario') {
      nuevosItems[index].subtotal = nuevosItems[index].cantidad * nuevosItems[index].valor_unitario;
    }

    setFormData(prev => ({
      ...prev,
      items: nuevosItems
    }));
  };

  const agregarItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          descripcion: '',
          cantidad: 1,
          valor_unitario: 0,
          subtotal: 0
        }
      ]
    }));
  };

  const eliminarItem = (index) => {
    if (formData.items.length > 1) {
      const nuevosItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        items: nuevosItems
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.cliente.nombre || !formData.cliente.nit) {
      alert('Debe seleccionar un cliente válido');
      return;
    }

    if (formData.items.some(item => !item.descripcion || item.cantidad <= 0 || item.valor_unitario <= 0)) {
      alert('Todos los items deben tener descripción, cantidad y valor válidos');
      return;
    }

    onGuardar(formData);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onCerrar}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              {modoEdicion ? 'Editar Factura' : 'Nueva Factura'}
            </h2>
          </div>
          <button
            onClick={onCerrar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información del Cliente */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar Cliente
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={busquedaCliente}
                    onChange={(e) => {
                      setBusquedaCliente(e.target.value);
                      buscarClientes(e.target.value);
                    }}
                    placeholder="Nombre o NIT del cliente..."
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                </div>
                
                {clientesSugeridos.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {clientesSugeridos.map((cliente, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => seleccionarCliente(cliente)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{cliente.nombre}</div>
                        <div className="text-sm text-gray-500">{cliente.nit}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Vencimiento
                </label>
                <input
                  type="date"
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {formData.cliente.nombre && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-800">
                  <div><strong>Cliente:</strong> {formData.cliente.nombre}</div>
                  <div><strong>NIT:</strong> {formData.cliente.nit}</div>
                  <div><strong>Email:</strong> {formData.cliente.email}</div>
                </div>
              </div>
            )}
          </div>

          {/* Cargar desde Remisión */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cargar desde Remisión (Opcional)</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={formData.remision_id}
                onChange={(e) => setFormData(prev => ({ ...prev, remision_id: e.target.value }))}
                placeholder="Número de remisión..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={buscarRemisiones}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Items de la Factura */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Items de la Factura</h3>
              <button
                type="button"
                onClick={agregarItem}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-1" />
                Agregar Item
              </button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-12 md:col-span-5">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={item.descripcion}
                      onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)}
                      placeholder="Descripción del servicio..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={item.cantidad}
                      onChange={(e) => actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="col-span-4 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Valor Unitario
                    </label>
                    <input
                      type="number"
                      value={item.valor_unitario}
                      onChange={(e) => actualizarItem(index, 'valor_unitario', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="col-span-3 md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Subtotal
                    </label>
                    <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-medium">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => eliminarItem(index)}
                      disabled={formData.items.length === 1}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cálculos */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Cálculos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento
                </label>
                <input
                  type="number"
                  value={formData.descuento}
                  onChange={(e) => setFormData(prev => ({ ...prev, descuento: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IVA (%)
                </label>
                <input
                  type="number"
                  value={formData.iva_porcentaje}
                  onChange={(e) => setFormData(prev => ({ ...prev, iva_porcentaje: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retención (%)
                </label>
                <input
                  type="number"
                  value={formData.retencion_porcentaje}
                  onChange={(e) => setFormData(prev => ({ ...prev, retencion_porcentaje: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Resumen de totales */}
            <div className="mt-4 pt-4 border-t border-gray-300">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(formData.subtotal)}</span>
                </div>
                {formData.descuento > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span>-{formatCurrency(formData.descuento)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>IVA ({formData.iva_porcentaje}%):</span>
                  <span>{formatCurrency(formData.iva)}</span>
                </div>
                {formData.retencion > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Retención ({formData.retencion_porcentaje}%):</span>
                    <span>-{formatCurrency(formData.retencion)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                  <span>TOTAL:</span>
                  <span>{formatCurrency(formData.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              rows={3}
              placeholder="Observaciones adicionales..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Crear Factura')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default FormularioFactura;
