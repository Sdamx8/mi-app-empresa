// components/Financiero/BuscarTransacciones.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  FileText,
  CreditCard,
  User,
  Eye,
  Download,
  RefreshCw,
  ArrowUpDown,
  SlidersHorizontal
} from 'lucide-react';

const BuscarTransacciones = () => {
  const [transacciones, setTransacciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState({
    tipo: '',
    metodo_pago: '',
    estado: '',
    fecha_inicio: '',
    fecha_fin: '',
    monto_min: '',
    monto_max: '',
    cliente: ''
  });
  const [mostrarFiltrosAvanzados, setMostrarFiltrosAvanzados] = useState(false);
  const [ordenamiento, setOrdenamiento] = useState({ campo: 'fecha', direccion: 'desc' });
  const [paginaActual, setPaginaActual] = useState(1);
  const [transaccionesPorPagina] = useState(10);

  useEffect(() => {
    cargarTransacciones();
  }, []);

  const cargarTransacciones = async () => {
    try {
      setLoading(true);
      
      // Datos simulados de transacciones mixtas (facturas + pagos)
      const transaccionesSimuladas = [
        {
          id: '1',
          tipo: 'factura',
          numero: 'FAC-2025-001',
          fecha: '2025-01-15',
          cliente: 'Transportes ABC Ltda',
          concepto: 'Mantenimiento preventivo flota',
          valor: 238000,
          estado: 'pendiente',
          metodo_pago: '',
          referencia: '',
          vencimiento: '2025-02-14'
        },
        {
          id: '2',
          tipo: 'pago',
          numero: 'REC-2025-001',
          fecha: '2025-01-16',
          cliente: 'Logística XYZ S.A.S',
          concepto: 'Pago factura FAC-2025-002',
          valor: 416500,
          estado: 'confirmado',
          metodo_pago: 'transferencia',
          referencia: 'TRF-123456',
          numero_factura: 'FAC-2025-002'
        },
        {
          id: '3',
          tipo: 'factura',
          numero: 'FAC-2025-003',
          fecha: '2025-01-10',
          cliente: 'Servicios DEF',
          concepto: 'Reparación motor diesel',
          valor: 214200,
          estado: 'vencida',
          metodo_pago: '',
          referencia: '',
          vencimiento: '2025-01-25'
        },
        {
          id: '4',
          tipo: 'pago',
          numero: 'REC-2025-002',
          fecha: '2025-01-17',
          cliente: 'Comercial JKL',
          concepto: 'Pago factura FAC-2025-005',
          valor: 125000,
          estado: 'confirmado',
          metodo_pago: 'efectivo',
          referencia: '',
          numero_factura: 'FAC-2025-005'
        },
        {
          id: '5',
          tipo: 'factura',
          numero: 'FAC-2025-004',
          fecha: '2025-01-18',
          cliente: 'Empresa GHI',
          concepto: 'Instalación sistema de frenos',
          valor: 175000,
          estado: 'enviada',
          metodo_pago: '',
          referencia: '',
          vencimiento: '2025-02-17'
        },
        {
          id: '6',
          tipo: 'pago',
          numero: 'REC-2025-003',
          fecha: '2025-01-19',
          cliente: 'Transportes ABC Ltda',
          concepto: 'Pago parcial FAC-2025-001',
          valor: 100000,
          estado: 'confirmado',
          metodo_pago: 'cheque',
          referencia: 'CHE-789012',
          numero_factura: 'FAC-2025-001'
        },
        {
          id: '7',
          tipo: 'factura',
          numero: 'FAC-2025-006',
          fecha: '2025-01-20',
          cliente: 'Logística XYZ S.A.S',
          concepto: 'Cambio de aceite y filtros',
          valor: 89500,
          estado: 'enviada',
          metodo_pago: '',
          referencia: '',
          vencimiento: '2025-02-19'
        },
        {
          id: '8',
          tipo: 'pago',
          numero: 'REC-2025-004',
          fecha: '2025-01-21',
          cliente: 'Servicios DEF',
          concepto: 'Pago factura FAC-2025-003',
          valor: 214200,
          estado: 'pendiente',
          metodo_pago: 'transferencia',
          referencia: 'TRF-456789',
          numero_factura: 'FAC-2025-003'
        }
      ];
      
      setTimeout(() => {
        setTransacciones(transaccionesSimuladas);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error('Error cargando transacciones:', error);
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

  const getEstadoStyle = (estado, tipo) => {
    if (tipo === 'factura') {
      switch (estado) {
        case 'pagada':
          return 'bg-green-100 text-green-800';
        case 'enviada':
          return 'bg-blue-100 text-blue-800';
        case 'vencida':
          return 'bg-red-100 text-red-800';
        case 'pendiente':
          return 'bg-yellow-100 text-yellow-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    } else {
      switch (estado) {
        case 'confirmado':
          return 'bg-green-100 text-green-800';
        case 'pendiente':
          return 'bg-yellow-100 text-yellow-800';
        case 'rechazado':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const getTipoStyle = (tipo) => {
    return tipo === 'factura' 
      ? 'bg-orange-100 text-orange-800' 
      : 'bg-green-100 text-green-800';
  };

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setFiltros({
      tipo: '',
      metodo_pago: '',
      estado: '',
      fecha_inicio: '',
      fecha_fin: '',
      monto_min: '',
      monto_max: '',
      cliente: ''
    });
    setSearchTerm('');
    setPaginaActual(1);
  };

  const handleOrdenamiento = (campo) => {
    setOrdenamiento(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }));
  };

  const transaccionesFiltradas = transacciones.filter(transaccion => {
    // Búsqueda por texto
    const matchesSearch = 
      transaccion.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaccion.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaccion.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaccion.referencia && transaccion.referencia.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtros específicos
    const matchesTipo = !filtros.tipo || transaccion.tipo === filtros.tipo;
    const matchesMetodo = !filtros.metodo_pago || transaccion.metodo_pago === filtros.metodo_pago;
    const matchesEstado = !filtros.estado || transaccion.estado === filtros.estado;
    const matchesCliente = !filtros.cliente || transaccion.cliente.toLowerCase().includes(filtros.cliente.toLowerCase());

    // Filtros de fecha
    const fechaTransaccion = new Date(transaccion.fecha);
    const matchesFechaInicio = !filtros.fecha_inicio || fechaTransaccion >= new Date(filtros.fecha_inicio);
    const matchesFechaFin = !filtros.fecha_fin || fechaTransaccion <= new Date(filtros.fecha_fin);

    // Filtros de monto
    const matchesMontoMin = !filtros.monto_min || transaccion.valor >= parseFloat(filtros.monto_min);
    const matchesMontoMax = !filtros.monto_max || transaccion.valor <= parseFloat(filtros.monto_max);

    return matchesSearch && matchesTipo && matchesMetodo && matchesEstado && 
           matchesCliente && matchesFechaInicio && matchesFechaFin && 
           matchesMontoMin && matchesMontoMax;
  });

  // Ordenamiento
  const transaccionesOrdenadas = [...transaccionesFiltradas].sort((a, b) => {
    let valorA, valorB;

    switch (ordenamiento.campo) {
      case 'fecha':
        valorA = new Date(a.fecha);
        valorB = new Date(b.fecha);
        break;
      case 'valor':
        valorA = a.valor;
        valorB = b.valor;
        break;
      case 'cliente':
        valorA = a.cliente.toLowerCase();
        valorB = b.cliente.toLowerCase();
        break;
      default:
        valorA = a[ordenamiento.campo];
        valorB = b[ordenamiento.campo];
    }

    if (valorA < valorB) return ordenamiento.direccion === 'asc' ? -1 : 1;
    if (valorA > valorB) return ordenamiento.direccion === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginación
  const indiceInicio = (paginaActual - 1) * transaccionesPorPagina;
  const indiceFin = indiceInicio + transaccionesPorPagina;
  const transaccionesPaginadas = transaccionesOrdenadas.slice(indiceInicio, indiceFin);
  const totalPaginas = Math.ceil(transaccionesOrdenadas.length / transaccionesPorPagina);

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
          <h2 className="text-2xl font-bold text-gray-900">Buscar Transacciones</h2>
          <p className="text-gray-600">
            Busca y filtra todas las transacciones financieras
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarTransacciones}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Actualizar
          </button>
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Download className="w-5 h-5 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Barra de búsqueda principal */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, concepto o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setMostrarFiltrosAvanzados(!mostrarFiltrosAvanzados)}
            className={`inline-flex items-center px-4 py-3 rounded-lg border transition-colors duration-200 ${
              mostrarFiltrosAvanzados 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5 mr-2" />
            Filtros Avanzados
          </button>
        </div>
      </div>

      {/* Filtros avanzados */}
      <AnimatePresence>
        {mostrarFiltrosAvanzados && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Transacción
                  </label>
                  <select
                    value={filtros.tipo}
                    onChange={(e) => handleFiltroChange('tipo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="factura">Facturas</option>
                    <option value="pago">Pagos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => handleFiltroChange('estado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="enviada">Enviada</option>
                    <option value="pagada">Pagada</option>
                    <option value="vencida">Vencida</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={filtros.metodo_pago}
                    onChange={(e) => handleFiltroChange('metodo_pago', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={filtros.cliente}
                    onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                    placeholder="Nombre del cliente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fecha_inicio}
                    onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filtros.fecha_fin}
                    onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Mínimo
                  </label>
                  <input
                    type="number"
                    value={filtros.monto_min}
                    onChange={(e) => handleFiltroChange('monto_min', e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monto Máximo
                  </label>
                  <input
                    type="number"
                    value={filtros.monto_max}
                    onChange={(e) => handleFiltroChange('monto_max', e.target.value)}
                    placeholder="Sin límite"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {transaccionesFiltradas.length} transacciones encontradas
                </div>
                <button
                  onClick={limpiarFiltros}
                  className="inline-flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultados */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header de tabla con ordenamiento */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-600">
            <button
              onClick={() => handleOrdenamiento('tipo')}
              className="flex items-center text-left hover:text-gray-900"
            >
              Tipo
              <ArrowUpDown className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => handleOrdenamiento('numero')}
              className="flex items-center text-left hover:text-gray-900"
            >
              Número
              <ArrowUpDown className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => handleOrdenamiento('fecha')}
              className="flex items-center text-left hover:text-gray-900"
            >
              Fecha
              <ArrowUpDown className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => handleOrdenamiento('cliente')}
              className="flex items-center text-left hover:text-gray-900"
            >
              Cliente
              <ArrowUpDown className="w-4 h-4 ml-1" />
            </button>
            <button
              onClick={() => handleOrdenamiento('valor')}
              className="flex items-center text-right hover:text-gray-900"
            >
              Valor
              <ArrowUpDown className="w-4 h-4 ml-1" />
            </button>
            <div className="text-center">Estado</div>
            <div className="text-center">Acciones</div>
          </div>
        </div>

        {/* Lista de transacciones */}
        <div className="divide-y divide-gray-200">
          {transaccionesPaginadas.map((transaccion) => (
            <div
              key={transaccion.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="grid grid-cols-7 gap-4 items-center">
                <div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoStyle(transaccion.tipo)}`}>
                    {transaccion.tipo === 'factura' ? (
                      <FileText className="w-3 h-3 mr-1" />
                    ) : (
                      <CreditCard className="w-3 h-3 mr-1" />
                    )}
                    {transaccion.tipo.charAt(0).toUpperCase() + transaccion.tipo.slice(1)}
                  </span>
                </div>

                <div>
                  <div className="font-medium text-gray-900">{transaccion.numero}</div>
                  {transaccion.referencia && (
                    <div className="text-sm text-gray-500">Ref: {transaccion.referencia}</div>
                  )}
                </div>

                <div>
                  <div className="text-gray-900">{new Date(transaccion.fecha).toLocaleDateString('es-CO')}</div>
                  {transaccion.vencimiento && (
                    <div className="text-sm text-gray-500">
                      Vence: {new Date(transaccion.vencimiento).toLocaleDateString('es-CO')}
                    </div>
                  )}
                </div>

                <div>
                  <div className="font-medium text-gray-900">{transaccion.cliente}</div>
                  <div className="text-sm text-gray-500 truncate">{transaccion.concepto}</div>
                </div>

                <div className="text-right">
                  <div className="font-bold text-gray-900">{formatCurrency(transaccion.valor)}</div>
                  {transaccion.metodo_pago && (
                    <div className="text-sm text-gray-500 capitalize">{transaccion.metodo_pago}</div>
                  )}
                </div>

                <div className="text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoStyle(transaccion.estado, transaccion.tipo)}`}>
                    {transaccion.estado.charAt(0).toUpperCase() + transaccion.estado.slice(1)}
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors duration-200"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors duration-200"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sin resultados */}
        {transaccionesPaginadas.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron transacciones</h3>
            <p className="text-gray-500 mb-4">
              Intenta ajustar los filtros de búsqueda o términos utilizados
            </p>
            <button
              onClick={limpiarFiltros}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              Limpiar Filtros
            </button>
          </div>
        )}

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {indiceInicio + 1} - {Math.min(indiceFin, transaccionesOrdenadas.length)} de {transaccionesOrdenadas.length} resultados
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Anterior
              </button>
              
              {[...Array(totalPaginas)].map((_, index) => {
                const pagina = index + 1;
                if (
                  pagina === 1 ||
                  pagina === totalPaginas ||
                  (pagina >= paginaActual - 2 && pagina <= paginaActual + 2)
                ) {
                  return (
                    <button
                      key={pagina}
                      onClick={() => setPaginaActual(pagina)}
                      className={`px-3 py-2 rounded-lg transition-colors duration-200 ${
                        pagina === paginaActual
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pagina}
                    </button>
                  );
                } else if (
                  pagina === paginaActual - 3 ||
                  pagina === paginaActual + 3
                ) {
                  return (
                    <span key={pagina} className="px-2 text-gray-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
              
              <button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuscarTransacciones;
