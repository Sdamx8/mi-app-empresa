// components/Financiero/GestionPagos.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Eye,
  Trash2,
  Download
} from 'lucide-react';
import FormularioPago from './FormularioPago';

const GestionPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [facturasPendientes, setFacturasPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMetodo, setFilterMetodo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [showFormulario, setShowFormulario] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [activeTab, setActiveTab] = useState('facturas-pendientes');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Datos simulados de facturas pendientes
      const facturasPendientesSimuladas = [
        {
          id: '1',
          numero_factura: 'FAC-2025-001',
          fecha_factura: '2025-01-15',
          fecha_vencimiento: '2025-02-14',
          cliente: 'Transportes ABC Ltda',
          total: 238000,
          estado: 'enviada',
          dias_vencimiento: 5
        },
        {
          id: '3',
          numero_factura: 'FAC-2025-003',
          fecha_factura: '2025-01-10',
          fecha_vencimiento: '2025-01-25',
          cliente: 'Servicios DEF',
          total: 214200,
          estado: 'vencida',
          dias_vencimiento: -5
        },
        {
          id: '4',
          numero_factura: 'FAC-2025-004',
          fecha_factura: '2025-01-18',
          fecha_vencimiento: '2025-02-17',
          cliente: 'Empresa GHI',
          total: 175000,
          estado: 'enviada',
          dias_vencimiento: 8
        }
      ];

      // Datos simulados de pagos registrados
      const pagosSimulados = [
        {
          id: '1',
          numero_recibo: 'REC-2025-001',
          factura_id: '2',
          numero_factura: 'FAC-2025-002',
          fecha_pago: '2025-01-16',
          valor_pagado: 416500,
          metodo_pago: 'transferencia',
          referencia_pago: 'TRF-123456',
          banco: 'Bancolombia',
          cliente: 'Logística XYZ S.A.S',
          estado: 'confirmado',
          observaciones: 'Pago completo por transferencia'
        },
        {
          id: '2',
          numero_recibo: 'REC-2025-002',
          factura_id: '5',
          numero_factura: 'FAC-2025-005',
          fecha_pago: '2025-01-17',
          valor_pagado: 125000,
          metodo_pago: 'efectivo',
          referencia_pago: '',
          banco: '',
          cliente: 'Comercial JKL',
          estado: 'confirmado',
          observaciones: 'Pago en efectivo'
        }
      ];
      
      setTimeout(() => {
        setFacturasPendientes(facturasPendientesSimuladas);
        setPagos(pagosSimulados);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error('Error cargando datos de pagos:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getEstadoFacturaStyle = (estado, diasVencimiento) => {
    if (estado === 'vencida' || diasVencimiento < 0) {
      return 'bg-red-100 text-red-800';
    }
    if (diasVencimiento <= 3) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getMetodoPagoStyle = (metodo) => {
    switch (metodo) {
      case 'efectivo':
        return 'bg-green-100 text-green-800';
      case 'transferencia':
        return 'bg-blue-100 text-blue-800';
      case 'cheque':
        return 'bg-purple-100 text-purple-800';
      case 'tarjeta':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleNuevoPago = (factura = null) => {
    setPagoSeleccionado(factura);
    setModoEdicion(false);
    setShowFormulario(true);
  };

  const handleEditarPago = (pago) => {
    setPagoSeleccionado(pago);
    setModoEdicion(true);
    setShowFormulario(true);
  };

  const handleEliminarPago = async (pagoId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      try {
        setPagos(pagos.filter(p => p.id !== pagoId));
      } catch (error) {
        console.error('Error eliminando pago:', error);
      }
    }
  };

  const handleGuardarPago = async (datosPago) => {
    try {
      if (modoEdicion) {
        // Actualizar pago existente
        const pagosActualizados = pagos.map(p => 
          p.id === pagoSeleccionado.id ? { ...p, ...datosPago } : p
        );
        setPagos(pagosActualizados);
      } else {
        // Crear nuevo pago
        const nuevoPago = {
          id: Date.now().toString(),
          numero_recibo: `REC-2025-${String(pagos.length + 1).padStart(3, '0')}`,
          fecha_pago: new Date().toISOString().split('T')[0],
          estado: 'confirmado',
          ...datosPago
        };
        setPagos([nuevoPago, ...pagos]);
        
        // Si es pago desde factura pendiente, removerla de pendientes
        if (datosPago.factura_id) {
          setFacturasPendientes(facturasPendientes.filter(f => f.id !== datosPago.factura_id));
        }
      }
      
      setShowFormulario(false);
      setPagoSeleccionado(null);
      setModoEdicion(false);
    } catch (error) {
      console.error('Error guardando pago:', error);
    }
  };

  const filteredPagos = pagos.filter(pago => {
    const matchesSearch = 
      pago.numero_recibo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pago.cliente.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesMetodo = filterMetodo === '' || pago.metodo_pago === filterMetodo;
    const matchesEstado = filterEstado === '' || pago.estado === filterEstado;
    
    return matchesSearch && matchesMetodo && matchesEstado;
  });

  const filteredFacturasPendientes = facturasPendientes.filter(factura => {
    return factura.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
           factura.cliente.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Pagos</h2>
          <p className="text-gray-600">Administra pagos y facturas pendientes</p>
        </div>
        <button
          onClick={() => handleNuevoPago()}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Registrar Pago
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('facturas-pendientes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'facturas-pendientes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="w-5 h-5 inline mr-2" />
            Facturas Pendientes ({facturasPendientes.length})
          </button>
          <button
            onClick={() => setActiveTab('pagos-registrados')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pagos-registrados'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            Pagos Registrados ({pagos.length})
          </button>
        </nav>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={activeTab === 'facturas-pendientes' ? 'Buscar facturas...' : 'Buscar pagos...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {activeTab === 'pagos-registrados' && (
            <>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterMetodo}
                  onChange={(e) => setFilterMetodo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los métodos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </div>
              
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="confirmado">Confirmado</option>
                <option value="pendiente">Pendiente</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* Contenido según tab activo */}
      <AnimatePresence mode="wait">
        {activeTab === 'facturas-pendientes' ? (
          <motion.div
            key="facturas-pendientes"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {filteredFacturasPendientes.map((factura) => (
              <div
                key={factura.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {factura.numero_factura}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoFacturaStyle(factura.estado, factura.dias_vencimiento)}`}>
                        {factura.dias_vencimiento < 0 ? 'Vencida' : 
                         factura.dias_vencimiento <= 3 ? 'Por vencer' : 'Vigente'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Cliente:</span> {factura.cliente}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span> {new Date(factura.fecha_factura).toLocaleDateString('es-CO')}
                      </div>
                      <div>
                        <span className="font-medium">Vencimiento:</span> {new Date(factura.fecha_vencimiento).toLocaleDateString('es-CO')}
                      </div>
                      <div>
                        <span className="font-medium">Días:</span> 
                        <span className={factura.dias_vencimiento < 0 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                          {factura.dias_vencimiento < 0 ? `${Math.abs(factura.dias_vencimiento)} vencidos` : `${factura.dias_vencimiento} restantes`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-lg font-bold text-gray-900">
                        Total: {formatCurrency(factura.total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleNuevoPago(factura)}
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Registrar Pago
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredFacturasPendientes.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron facturas' : '¡Excelente! No hay facturas pendientes'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Intenta ajustar los filtros de búsqueda' : 'Todas las facturas han sido pagadas'}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="pagos-registrados"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {filteredPagos.map((pago) => (
              <div
                key={pago.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {pago.numero_recibo}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMetodoPagoStyle(pago.metodo_pago)}`}>
                        {pago.metodo_pago.charAt(0).toUpperCase() + pago.metodo_pago.slice(1)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Factura:</span> {pago.numero_factura}
                      </div>
                      <div>
                        <span className="font-medium">Cliente:</span> {pago.cliente}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span> {new Date(pago.fecha_pago).toLocaleDateString('es-CO')}
                      </div>
                      <div>
                        <span className="font-medium">Referencia:</span> {pago.referencia_pago || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <span className="text-lg font-bold text-green-600">
                        Pagado: {formatCurrency(pago.valor_pagado)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      title="Ver detalles"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleEditarPago(pago)}
                      className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      title="Editar pago"
                    >
                      <CreditCard className="w-5 h-5" />
                    </button>
                    
                    <button
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                      title="Descargar recibo"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleEliminarPago(pago.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      title="Eliminar pago"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredPagos.length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron pagos</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterMetodo || filterEstado ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza registrando el primer pago'}
                </p>
                {!searchTerm && !filterMetodo && !filterEstado && (
                  <button
                    onClick={() => handleNuevoPago()}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Registrar Pago
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal formulario */}
      <AnimatePresence>
        {showFormulario && (
          <FormularioPago
            pago={pagoSeleccionado}
            modoEdicion={modoEdicion}
            onGuardar={handleGuardarPago}
            onCerrar={() => {
              setShowFormulario(false);
              setPagoSeleccionado(null);
              setModoEdicion(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionPagos;
