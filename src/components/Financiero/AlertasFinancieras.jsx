// components/Financiero/AlertasFinancieras.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  AlertTriangle, 
  TrendingDown,
  Calendar,
  DollarSign,
  CheckCircle,
  X,
  Settings,
  Filter,
  RefreshCw,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';

const AlertasFinancieras = () => {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activas');
  const [configuracionAlertas, setConfiguracionAlertas] = useState({
    facturas_vencidas: true,
    facturas_por_vencer: true,
    metas_ventas: true,
    flujo_caja_bajo: true,
    grandes_deudores: true
  });
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false);

  const tiposAlerta = [
    { id: 'factura_vencida', nombre: 'Factura Vencida', icono: AlertTriangle, color: 'red' },
    { id: 'factura_por_vencer', nombre: 'Por Vencer', icono: Calendar, color: 'yellow' },
    { id: 'meta_ventas', nombre: 'Meta de Ventas', icono: TrendingDown, color: 'orange' },
    { id: 'flujo_caja', nombre: 'Flujo de Caja', icono: DollarSign, color: 'purple' },
    { id: 'deudor_critico', nombre: 'Deudor Crítico', icono: AlertTriangle, color: 'red' }
  ];

  useEffect(() => {
    cargarAlertas();
  }, []);

  const cargarAlertas = async () => {
    try {
      setLoading(true);
      
      // Datos simulados de alertas
      const alertasSimuladas = [
        {
          id: '1',
          tipo: 'factura_vencida',
          titulo: 'Factura vencida - FAC-2025-003',
          descripcion: 'La factura FAC-2025-003 de Servicios DEF está vencida desde hace 5 días',
          valor: 214200,
          cliente: 'Servicios DEF',
          fecha_creacion: '2025-01-30',
          fecha_vencimiento: '2025-01-25',
          estado: 'activa',
          prioridad: 'alta',
          dias_vencimiento: 5,
          acciones_disponibles: ['marcar_leida', 'generar_recordatorio', 'ver_factura']
        },
        {
          id: '2',
          tipo: 'factura_por_vencer',
          titulo: 'Factura por vencer en 2 días',
          descripcion: 'La factura FAC-2025-001 de Transportes ABC Ltda vence el 14/02/2025',
          valor: 238000,
          cliente: 'Transportes ABC Ltda',
          fecha_creacion: '2025-01-30',
          fecha_vencimiento: '2025-02-14',
          estado: 'activa',
          prioridad: 'media',
          dias_vencimiento: -2,
          acciones_disponibles: ['marcar_leida', 'enviar_recordatorio', 'ver_factura']
        },
        {
          id: '3',
          tipo: 'meta_ventas',
          titulo: 'Meta mensual en riesgo',
          descripcion: 'Las ventas actuales están al 85% de la meta mensual con 5 días restantes',
          valor: 2800000,
          meta_actual: 2380000,
          fecha_creacion: '2025-01-30',
          estado: 'activa',
          prioridad: 'media',
          porcentaje_completado: 85,
          acciones_disponibles: ['marcar_leida', 'ver_reporte', 'estrategias']
        },
        {
          id: '4',
          tipo: 'flujo_caja',
          titulo: 'Flujo de caja por debajo del mínimo',
          descripcion: 'El flujo de caja actual está $150,000 por debajo del mínimo recomendado',
          valor: 450000,
          minimo_recomendado: 600000,
          fecha_creacion: '2025-01-29',
          estado: 'activa',
          prioridad: 'alta',
          acciones_disponibles: ['marcar_leida', 'ver_flujo', 'gestionar_cobros']
        },
        {
          id: '5',
          tipo: 'deudor_critico',
          titulo: 'Deudor crítico - Transportes ABC Ltda',
          descripcion: 'Cliente con $238,000 en facturas vencidas por más de 60 días',
          valor: 238000,
          cliente: 'Transportes ABC Ltda',
          fecha_creacion: '2025-01-28',
          estado: 'activa',
          prioridad: 'alta',
          dias_vencimiento: 75,
          acciones_disponibles: ['marcar_leida', 'gestionar_cobro', 'ver_historial']
        },
        {
          id: '6',
          tipo: 'factura_vencida',
          titulo: 'Factura vencida resuelta',
          descripcion: 'La factura FAC-2025-005 fue pagada completamente',
          valor: 125000,
          cliente: 'Comercial JKL',
          fecha_creacion: '2025-01-25',
          estado: 'resuelta',
          prioridad: 'baja',
          fecha_resolucion: '2025-01-27',
          acciones_disponibles: ['eliminar']
        }
      ];
      
      setTimeout(() => {
        setAlertas(alertasSimuladas);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error('Error cargando alertas:', error);
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

  const getPrioridadStyle = (prioridad) => {
    switch (prioridad) {
      case 'alta':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTipoInfo = (tipo) => {
    return tiposAlerta.find(t => t.id === tipo) || tiposAlerta[0];
  };

  const getEstadoStyle = (estado) => {
    switch (estado) {
      case 'activa':
        return 'bg-blue-100 text-blue-800';
      case 'resuelta':
        return 'bg-green-100 text-green-800';
      case 'descartada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMarcarLeida = async (alertaId) => {
    try {
      setAlertas(alertas.map(alerta => 
        alerta.id === alertaId 
          ? { ...alerta, estado: 'resuelta', fecha_resolucion: new Date().toISOString().split('T')[0] }
          : alerta
      ));
    } catch (error) {
      console.error('Error marcando alerta como leída:', error);
    }
  };

  const handleEliminarAlerta = async (alertaId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta alerta?')) {
      try {
        setAlertas(alertas.filter(alerta => alerta.id !== alertaId));
      } catch (error) {
        console.error('Error eliminando alerta:', error);
      }
    }
  };

  const handleConfiguracionChange = (tipo) => {
    setConfiguracionAlertas(prev => ({
      ...prev,
      [tipo]: !prev[tipo]
    }));
  };

  const alertasFiltradas = alertas.filter(alerta => {
    const matchesTipo = !filtroTipo || alerta.tipo === filtroTipo;
    const matchesEstado = filtroEstado === 'todas' || 
                         (filtroEstado === 'activas' && alerta.estado === 'activa') ||
                         (filtroEstado === 'resueltas' && alerta.estado === 'resuelta');
    
    return matchesTipo && matchesEstado;
  });

  const alertasActivas = alertas.filter(a => a.estado === 'activa');
  const alertasAlta = alertasActivas.filter(a => a.prioridad === 'alta');

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
          <h2 className="text-2xl font-bold text-gray-900">Alertas Financieras</h2>
          <p className="text-gray-600">
            Monitoreo y notificaciones de eventos financieros importantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarConfiguracion(!mostrarConfiguracion)}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            <Settings className="w-5 h-5 mr-2" />
            Configurar
          </button>
          <button
            onClick={cargarAlertas}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
              <p className="text-2xl font-bold text-blue-600">{alertasActivas.length}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Prioridad Alta</p>
              <p className="text-2xl font-bold text-red-600">{alertasAlta.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resueltas Hoy</p>
              <p className="text-2xl font-bold text-green-600">
                {alertas.filter(a => a.estado === 'resuelta' && a.fecha_resolucion === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Configuración de alertas */}
      <AnimatePresence>
        {mostrarConfiguracion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Alertas</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Facturas Vencidas</h4>
                    <p className="text-sm text-gray-600">Alertas cuando una factura supera su fecha de vencimiento</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracionAlertas.facturas_vencidas}
                      onChange={() => handleConfiguracionChange('facturas_vencidas')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Facturas por Vencer</h4>
                    <p className="text-sm text-gray-600">Alertas 3 días antes del vencimiento de facturas</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracionAlertas.facturas_por_vencer}
                      onChange={() => handleConfiguracionChange('facturas_por_vencer')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Metas de Ventas</h4>
                    <p className="text-sm text-gray-600">Alertas cuando las ventas están por debajo del 80% de la meta</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracionAlertas.metas_ventas}
                      onChange={() => handleConfiguracionChange('metas_ventas')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Flujo de Caja Bajo</h4>
                    <p className="text-sm text-gray-600">Alertas cuando el flujo de caja está por debajo del mínimo</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracionAlertas.flujo_caja_bajo}
                      onChange={() => handleConfiguracionChange('flujo_caja_bajo')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Grandes Deudores</h4>
                    <p className="text-sm text-gray-600">Alertas para clientes con deudas superiores a $200,000</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracionAlertas.grandes_deudores}
                      onChange={() => handleConfiguracionChange('grandes_deudores')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              {tiposAlerta.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="activas">Solo Activas</option>
            <option value="resueltas">Solo Resueltas</option>
            <option value="todas">Todas</option>
          </select>
        </div>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-4">
        {alertasFiltradas.map((alerta) => {
          const tipoInfo = getTipoInfo(alerta.tipo);
          const IconComponent = tipoInfo.icono;
          
          return (
            <motion.div
              key={alerta.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-lg border-2 p-6 ${
                alerta.prioridad === 'alta' && alerta.estado === 'activa' 
                  ? 'border-red-200 bg-red-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-2 rounded-lg ${
                    tipoInfo.color === 'red' ? 'bg-red-100' :
                    tipoInfo.color === 'yellow' ? 'bg-yellow-100' :
                    tipoInfo.color === 'orange' ? 'bg-orange-100' :
                    tipoInfo.color === 'purple' ? 'bg-purple-100' :
                    'bg-blue-100'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      tipoInfo.color === 'red' ? 'text-red-600' :
                      tipoInfo.color === 'yellow' ? 'text-yellow-600' :
                      tipoInfo.color === 'orange' ? 'text-orange-600' :
                      tipoInfo.color === 'purple' ? 'text-purple-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{alerta.titulo}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPrioridadStyle(alerta.prioridad)}`}>
                        {alerta.prioridad.charAt(0).toUpperCase() + alerta.prioridad.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoStyle(alerta.estado)}`}>
                        {alerta.estado.charAt(0).toUpperCase() + alerta.estado.slice(1)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3">{alerta.descripcion}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {alerta.valor && (
                        <div>
                          <span className="font-medium text-gray-700">Valor:</span>{' '}
                          <span className="font-bold text-gray-900">{formatCurrency(alerta.valor)}</span>
                        </div>
                      )}
                      
                      {alerta.cliente && (
                        <div>
                          <span className="font-medium text-gray-700">Cliente:</span>{' '}
                          <span className="text-gray-900">{alerta.cliente}</span>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-700">Fecha:</span>{' '}
                        <span className="text-gray-900">{new Date(alerta.fecha_creacion).toLocaleDateString('es-CO')}</span>
                      </div>
                      
                      {alerta.dias_vencimiento !== undefined && (
                        <div>
                          <span className="font-medium text-gray-700">Vencimiento:</span>{' '}
                          <span className={alerta.dias_vencimiento > 0 ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                            {alerta.dias_vencimiento > 0 
                              ? `${alerta.dias_vencimiento} días vencido` 
                              : `${Math.abs(alerta.dias_vencimiento)} días restantes`}
                          </span>
                        </div>
                      )}
                      
                      {alerta.porcentaje_completado && (
                        <div>
                          <span className="font-medium text-gray-700">Progreso:</span>{' '}
                          <span className="text-gray-900">{alerta.porcentaje_completado}% completado</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {alerta.estado === 'activa' && (
                    <button
                      onClick={() => handleMarcarLeida(alerta.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                      title="Marcar como resuelta"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  
                  <button
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Ver detalles"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => handleEliminarAlerta(alerta.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Eliminar alerta"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {alertasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filtroEstado === 'activas' ? '¡Excelente! No hay alertas activas' : 'No se encontraron alertas'}
            </h3>
            <p className="text-gray-500">
              {filtroEstado === 'activas' 
                ? 'Todo está funcionando correctamente' 
                : 'Intenta ajustar los filtros de búsqueda'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertasFinancieras;
