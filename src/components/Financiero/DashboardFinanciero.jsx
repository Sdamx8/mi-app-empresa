// components/Financiero/DashboardFinanciero.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Calendar,
  PieChart,
  BarChart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const DashboardFinanciero = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    ingresosMes: 0,
    facturasPendientes: 0,
    facturasVencidas: 0,
    rentabilidad: 0,
    totalFacturado: 0,
    totalCobrado: 0,
    clientesActivos: 0,
    promedioCobranza: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [topClientes, setTopClientes] = useState([]);

  useEffect(() => {
    cargarDatosFinancieros();
  }, []);

  const cargarDatosFinancieros = async () => {
    try {
      setLoading(true);
      
      // Simular carga de datos desde Firebase
      // En implementación real, aquí harían las consultas a Firestore
      
      const datosSimulados = {
        ingresosMes: 2450000,
        facturasPendientes: 15,
        facturasVencidas: 3,
        rentabilidad: 23.5,
        totalFacturado: 8750000,
        totalCobrado: 6950000,
        clientesActivos: 45,
        promedioCobranza: 18
      };

      const actividadReciente = [
        {
          id: 1,
          tipo: 'pago',
          descripcion: 'Pago recibido - Cliente ABC',
          monto: 350000,
          fecha: new Date().toISOString(),
          estado: 'completado'
        },
        {
          id: 2,
          tipo: 'factura',
          descripcion: 'Nueva factura generada - Cliente XYZ',
          monto: 180000,
          fecha: new Date(Date.now() - 3600000).toISOString(),
          estado: 'enviada'
        },
        {
          id: 3,
          tipo: 'vencimiento',
          descripcion: 'Factura próxima a vencer - Cliente DEF',
          monto: 275000,
          fecha: new Date(Date.now() - 7200000).toISOString(),
          estado: 'alerta'
        }
      ];

      const clientesTop = [
        { nombre: 'Transportes ABC', facturacion: 850000, participacion: 12.3 },
        { nombre: 'Logística XYZ', facturacion: 720000, participacion: 10.4 },
        { nombre: 'Servicios DEF', facturacion: 650000, participacion: 9.4 },
        { nombre: 'Empresa GHI', facturacion: 480000, participacion: 6.9 },
        { nombre: 'Comercial JKL', facturacion: 420000, participacion: 6.1 }
      ];

      setTimeout(() => {
        setMetrics(datosSimulados);
        setRecentActivity(actividadReciente);
        setTopClientes(clientesTop);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error cargando datos financieros:', error);
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

  const MetricCard = ({ title, value, icon: Icon, color, trend, trendValue, isLoading }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {isLoading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mt-2"></div>
          ) : (
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          )}
          {trend && !isLoading && (
            <div className={`flex items-center mt-1 text-sm ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? (
                <ArrowUpRight className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownRight className="w-4 h-4 mr-1" />
              )}
              {trendValue}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('600', '100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ingresos del Mes"
          value={formatCurrency(metrics.ingresosMes)}
          icon={DollarSign}
          color="text-green-600"
          trend="up"
          trendValue="+12.5%"
        />
        
        <MetricCard
          title="Facturas Pendientes"
          value={metrics.facturasPendientes}
          icon={FileText}
          color="text-blue-600"
          trend="down"
          trendValue="-3"
        />
        
        <MetricCard
          title="Facturas Vencidas"
          value={metrics.facturasVencidas}
          icon={AlertTriangle}
          color="text-red-600"
          trend="up"
          trendValue="+1"
        />
        
        <MetricCard
          title="Rentabilidad"
          value={`${metrics.rentabilidad}%`}
          icon={TrendingUp}
          color="text-purple-600"
          trend="up"
          trendValue="+2.1%"
        />
      </div>

      {/* Métricas Secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Facturado"
          value={formatCurrency(metrics.totalFacturado)}
          icon={BarChart}
          color="text-indigo-600"
        />
        
        <MetricCard
          title="Total Cobrado"
          value={formatCurrency(metrics.totalCobrado)}
          icon={PieChart}
          color="text-teal-600"
        />
        
        <MetricCard
          title="Clientes Activos"
          value={metrics.clientesActivos}
          icon={Users}
          color="text-orange-600"
        />
        
        <MetricCard
          title="Promedio Cobranza"
          value={`${metrics.promedioCobranza} días`}
          icon={Calendar}
          color="text-gray-600"
        />
      </div>

      {/* Actividad Reciente y Top Clientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
            <p className="text-sm text-gray-500">Últimas transacciones y eventos</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      activity.tipo === 'pago' ? 'bg-green-500' :
                      activity.tipo === 'factura' ? 'bg-blue-500' :
                      'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.descripcion}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.fecha).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(activity.monto)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.estado === 'completado' ? 'bg-green-100 text-green-800' :
                      activity.estado === 'enviada' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Top Clientes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Clientes</h3>
            <p className="text-sm text-gray-500">Clientes con mayor facturación</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topClientes.map((cliente, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cliente.nombre}</p>
                      <p className="text-xs text-gray-500">{cliente.participacion}% del total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(cliente.facturacion)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Botones de Acción Rápida */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200">
            <FileText className="w-6 h-6 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Nueva Factura</span>
          </button>
          
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors duration-200">
            <DollarSign className="w-6 h-6 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Registrar Pago</span>
          </button>
          
          <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200">
            <BarChart className="w-6 h-6 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Ver Reportes</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardFinanciero;
