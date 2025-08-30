// components/Financiero/GestionFacturas.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Send,
  AlertCircle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import FormularioFactura from './FormularioFactura';
import VisualizadorFactura from './VisualizadorFactura';

const GestionFacturas = () => {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [showFormulario, setShowFormulario] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [showVisualizador, setShowVisualizador] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  useEffect(() => {
    cargarFacturas();
  }, []);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      
      // Datos simulados - En implementación real cargar desde Firestore
      const facturasSimuladas = [
        {
          id: '1',
          numero_factura: 'FAC-2025-001',
          fecha_factura: '2025-01-15',
          fecha_vencimiento: '2025-02-14',
          cliente: {
            nombre: 'Transportes ABC Ltda',
            nit: '123456789-1',
            email: 'facturacion@abc.com'
          },
          subtotal: 200000,
          iva: 38000,
          total: 238000,
          estado: 'enviada',
          remision_id: 'REM-2025-001'
        },
        {
          id: '2',
          numero_factura: 'FAC-2025-002',
          fecha_factura: '2025-01-16',
          fecha_vencimiento: '2025-02-15',
          cliente: {
            nombre: 'Logística XYZ S.A.S',
            nit: '987654321-2',
            email: 'contabilidad@xyz.com'
          },
          subtotal: 350000,
          iva: 66500,
          total: 416500,
          estado: 'pagada',
          remision_id: 'REM-2025-002'
        },
        {
          id: '3',
          numero_factura: 'FAC-2025-003',
          fecha_factura: '2025-01-10',
          fecha_vencimiento: '2025-01-25',
          cliente: {
            nombre: 'Servicios DEF',
            nit: '456789123-3',
            email: 'admin@def.com'
          },
          subtotal: 180000,
          iva: 34200,
          total: 214200,
          estado: 'vencida',
          remision_id: 'REM-2025-003'
        }
      ];
      
      setTimeout(() => {
        setFacturas(facturasSimuladas);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error('Error cargando facturas:', error);
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

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'borrador':
        return 'bg-gray-100 text-gray-800';
      case 'enviada':
        return 'bg-blue-100 text-blue-800';
      case 'pagada':
        return 'bg-green-100 text-green-800';
      case 'vencida':
        return 'bg-red-100 text-red-800';
      case 'anulada':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'borrador':
        return <Edit className="w-4 h-4" />;
      case 'enviada':
        return <Send className="w-4 h-4" />;
      case 'pagada':
        return <CheckCircle className="w-4 h-4" />;
      case 'vencida':
        return <AlertCircle className="w-4 h-4" />;
      case 'anulada':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredFacturas = facturas.filter(factura => {
    const matchesSearch = 
      factura.numero_factura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.cliente.nit.includes(searchTerm);
    
    const matchesFilter = filterEstado === '' || factura.estado === filterEstado;
    
    return matchesSearch && matchesFilter;
  });

  const handleNuevaFactura = () => {
    setFacturaSeleccionada(null);
    setModoEdicion(false);
    setShowFormulario(true);
  };

  const handleEditarFactura = (factura) => {
    setFacturaSeleccionada(factura);
    setModoEdicion(true);
    setShowFormulario(true);
  };

  const handleVerFactura = (factura) => {
    setFacturaSeleccionada(factura);
    setShowVisualizador(true);
  };

  const handleEliminarFactura = async (facturaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta factura?')) {
      try {
        // En implementación real: await deleteDoc(doc(db, 'facturas', facturaId));
        setFacturas(facturas.filter(f => f.id !== facturaId));
      } catch (error) {
        console.error('Error eliminando factura:', error);
      }
    }
  };

  const handleGuardarFactura = async (datosFactura) => {
    try {
      if (modoEdicion) {
        // Actualizar factura existente
        const facturasActualizadas = facturas.map(f => 
          f.id === facturaSeleccionada.id ? { ...f, ...datosFactura } : f
        );
        setFacturas(facturasActualizadas);
      } else {
        // Crear nueva factura
        const nuevaFactura = {
          id: Date.now().toString(),
          numero_factura: `FAC-2025-${String(facturas.length + 1).padStart(3, '0')}`,
          fecha_factura: new Date().toISOString().split('T')[0],
          ...datosFactura
        };
        setFacturas([nuevaFactura, ...facturas]);
      }
      
      setShowFormulario(false);
      setFacturaSeleccionada(null);
      setModoEdicion(false);
    } catch (error) {
      console.error('Error guardando factura:', error);
    }
  };

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
      {/* Header con acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Facturas</h2>
          <p className="text-gray-600">Administra todas las facturas del sistema</p>
        </div>
        <button
          onClick={handleNuevaFactura}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nueva Factura
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por número, cliente o NIT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="enviada">Enviada</option>
              <option value="pagada">Pagada</option>
              <option value="vencida">Vencida</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de facturas */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredFacturas.map((factura) => (
            <motion.div
              key={factura.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {factura.numero_factura}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1 ${getEstadoStyle(factura.estado)}`}>
                      {getEstadoIcon(factura.estado)}
                      {factura.estado.charAt(0).toUpperCase() + factura.estado.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Cliente:</span> {factura.cliente.nombre}
                    </div>
                    <div>
                      <span className="font-medium">Fecha:</span> {new Date(factura.fecha_factura).toLocaleDateString('es-CO')}
                    </div>
                    <div>
                      <span className="font-medium">Vencimiento:</span> {new Date(factura.fecha_vencimiento).toLocaleDateString('es-CO')}
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
                    onClick={() => handleVerFactura(factura)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Ver factura"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleEditarFactura(factura)}
                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                    title="Editar factura"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  
                  <button
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                    title="Descargar PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleEliminarFactura(factura.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Eliminar factura"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredFacturas.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron facturas</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filterEstado ? 'Intenta ajustar los filtros de búsqueda' : 'Comienza creando tu primera factura'}
            </p>
            {!searchTerm && !filterEstado && (
              <button
                onClick={handleNuevaFactura}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Nueva Factura
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal formulario */}
      <AnimatePresence>
        {showFormulario && (
          <FormularioFactura
            factura={facturaSeleccionada}
            modoEdicion={modoEdicion}
            onGuardar={handleGuardarFactura}
            onCerrar={() => {
              setShowFormulario(false);
              setFacturaSeleccionada(null);
              setModoEdicion(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Modal visualizador */}
      <AnimatePresence>
        {showVisualizador && facturaSeleccionada && (
          <VisualizadorFactura
            factura={facturaSeleccionada}
            onCerrar={() => {
              setShowVisualizador(false);
              setFacturaSeleccionada(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GestionFacturas;
