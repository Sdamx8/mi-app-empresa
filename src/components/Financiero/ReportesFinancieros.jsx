// components/Financiero/ReportesFinancieros.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  DollarSign,
  FileText,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from 'lucide-react';

const ReportesFinancieros = () => {
  const [loading, setLoading] = useState(true);
  const [reporteSeleccionado, setReporteSeleccionado] = useState('ventas-mensuales');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [datosReportes, setDatosReportes] = useState({});

  const tiposReporte = [
    {
      id: 'ventas-mensuales',
      titulo: 'Ventas Mensuales',
      descripcion: 'Análisis de ventas por mes',
      icono: BarChart3,
      color: 'blue'
    },
    {
      id: 'flujo-caja',
      titulo: 'Flujo de Caja',
      descripcion: 'Ingresos vs gastos',
      icono: TrendingUp,
      color: 'green'
    },
    {
      id: 'cuentas-cobrar',
      titulo: 'Cuentas por Cobrar',
      descripcion: 'Facturas pendientes de pago',
      icono: FileText,
      color: 'orange'
    },
    {
      id: 'analisis-clientes',
      titulo: 'Análisis de Clientes',
      descripcion: 'Top clientes y comportamiento',
      icono: PieChart,
      color: 'purple'
    }
  ];

  useEffect(() => {
    // Establecer fechas por defecto (último mes)
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setFechaInicio(primerDiaMes.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
    
    cargarDatosReportes();
  }, []);

  const cargarDatosReportes = async () => {
    try {
      setLoading(true);
      
      // Datos simulados para reportes
      const datos = {
        'ventas-mensuales': {
          resumen: {
            ventasActuales: 2547800,
            ventasAnterior: 2234500,
            crecimiento: 14.0,
            meta: 2800000
          },
          grafico: [
            { mes: 'Ene', ventas: 1850000, facturas: 12 },
            { mes: 'Feb', ventas: 2234500, facturas: 15 },
            { mes: 'Mar', ventas: 2547800, facturas: 18 },
            { mes: 'Abr', ventas: 2123400, facturas: 14 },
            { mes: 'May', ventas: 2891200, facturas: 21 },
            { mes: 'Jun', ventas: 2674300, facturas: 19 }
          ],
          detalles: [
            { concepto: 'Servicios Técnicos', valor: 1847200, porcentaje: 72.5 },
            { concepto: 'Venta de Repuestos', valor: 423600, porcentaje: 16.6 },
            { concepto: 'Mantenimientos', valor: 277000, porcentaje: 10.9 }
          ]
        },
        'flujo-caja': {
          resumen: {
            ingresosTotales: 2547800,
            gastosTotales: 1823400,
            flujoNeto: 724400,
            margen: 28.4
          },
          ingresos: [
            { categoria: 'Facturas Cobradas', valor: 2547800, porcentaje: 100 }
          ],
          gastos: [
            { categoria: 'Nómina', valor: 967200, porcentaje: 53.0 },
            { categoria: 'Repuestos e Insumos', valor: 423800, porcentaje: 23.2 },
            { categoria: 'Servicios Públicos', valor: 187500, porcentaje: 10.3 },
            { categoria: 'Combustible', valor: 156300, porcentaje: 8.6 },
            { categoria: 'Otros Gastos', valor: 88600, porcentaje: 4.9 }
          ],
          tendencia: [
            { mes: 'Ene', ingresos: 1850000, gastos: 1345000 },
            { mes: 'Feb', ingresos: 2234500, gastos: 1678200 },
            { mes: 'Mar', ingresos: 2547800, gastos: 1823400 }
          ]
        },
        'cuentas-cobrar': {
          resumen: {
            totalPendiente: 867200,
            facturasPendientes: 8,
            promedioVencimiento: 12,
            mayorDeuda: 238000
          },
          vencimientos: [
            { rango: 'Al día (0-30 días)', cantidad: 3, valor: 352800, porcentaje: 40.7 },
            { rango: 'Vencidas (31-60 días)', cantidad: 3, valor: 276400, porcentaje: 31.9 },
            { rango: 'Críticas (+60 días)', cantidad: 2, valor: 238000, porcentaje: 27.4 }
          ],
          topDeudores: [
            { cliente: 'Transportes ABC Ltda', valor: 238000, dias: 75, facturas: 2 },
            { cliente: 'Servicios DEF', valor: 214200, dias: 45, facturas: 1 },
            { cliente: 'Empresa GHI', valor: 175000, dias: 15, facturas: 1 },
            { cliente: 'Comercial JKL', valor: 125800, dias: 32, facturas: 2 }
          ]
        },
        'analisis-clientes': {
          resumen: {
            clientesActivos: 28,
            clientesNuevos: 4,
            ticketPromedio: 141544,
            retencion: 89.3
          },
          topClientes: [
            { cliente: 'Logística XYZ S.A.S', ventas: 487200, facturas: 8, ultima: '2025-01-16' },
            { cliente: 'Transportes ABC Ltda', ventas: 423800, facturas: 6, ultima: '2025-01-10' },
            { cliente: 'Servicios DEF', ventas: 356700, facturas: 5, ultima: '2025-01-12' },
            { cliente: 'Empresa GHI', ventas: 298900, facturas: 4, ultima: '2025-01-15' },
            { cliente: 'Comercial JKL', ventas: 234500, facturas: 3, ultima: '2025-01-14' }
          ],
          segmentos: [
            { segmento: 'Premium (+$300K)', clientes: 8, valor: 2134500, porcentaje: 83.8 },
            { segmento: 'Medio ($100K-$300K)', clientes: 12, valor: 324800, porcentaje: 12.8 },
            { segmento: 'Básico (-$100K)', clientes: 8, valor: 88500, porcentaje: 3.4 }
          ]
        }
      };
      
      setTimeout(() => {
        setDatosReportes(datos);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error cargando reportes:', error);
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

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[color] || colors.blue;
  };

  const renderReporteVentas = () => {
    const datos = datosReportes['ventas-mensuales'];
    if (!datos) return null;

    return (
      <div className="space-y-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas Actuales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(datos.resumen.ventasActuales)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-4 flex items-center">
              <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-green-600 text-sm font-medium">
                {formatPercentage(datos.resumen.crecimiento)} vs mes anterior
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Meta Mensual</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(datos.resumen.meta)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${(datos.resumen.ventasActuales / datos.resumen.meta) * 100}%` }}
                ></div>
              </div>
              <span className="text-purple-600 text-sm font-medium mt-1 block">
                {formatPercentage((datos.resumen.ventasActuales / datos.resumen.meta) * 100)} completado
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Facturas Emitidas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {datos.grafico[datos.grafico.length - 1]?.facturas || 0}
                </p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-4">
              <span className="text-orange-600 text-sm font-medium">
                Ticket promedio: {formatCurrency(datos.resumen.ventasActuales / datos.grafico[datos.grafico.length - 1]?.facturas)}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Crecimiento</p>
                <p className="text-2xl font-bold text-green-600">+{formatPercentage(datos.resumen.crecimiento)}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-4">
              <span className="text-gray-600 text-sm">
                +{formatCurrency(datos.resumen.ventasActuales - datos.resumen.ventasAnterior)}
              </span>
            </div>
          </div>
        </div>

        {/* Gráfico de barras simulado */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolución de Ventas</h3>
          <div className="space-y-4">
            {datos.grafico.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-gray-600">{item.mes}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{formatCurrency(item.ventas)}</span>
                    <span className="text-sm text-gray-500">{item.facturas} facturas</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full" 
                      style={{ width: `${(item.ventas / Math.max(...datos.grafico.map(g => g.ventas))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desglose por concepto */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Desglose por Concepto</h3>
          <div className="space-y-4">
            {datos.detalles.map((detalle, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{detalle.concepto}</h4>
                  <p className="text-sm text-gray-600">{formatPercentage(detalle.porcentaje)} del total</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(detalle.valor)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReporteCuentasCobrar = () => {
    const datos = datosReportes['cuentas-cobrar'];
    if (!datos) return null;

    return (
      <div className="space-y-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pendiente</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(datos.resumen.totalPendiente)}</p>
              </div>
              <FileText className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Facturas Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{datos.resumen.facturasPendientes}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio Vencimiento</p>
                <p className="text-2xl font-bold text-gray-900">{datos.resumen.promedioVencimiento} días</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mayor Deuda</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(datos.resumen.mayorDeuda)}</p>
              </div>
              <ArrowDownRight className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Análisis por vencimiento */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis por Vencimiento</h3>
          <div className="space-y-4">
            {datos.vencimientos.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900">{item.rango}</h4>
                    <div className="text-right">
                      <span className="font-bold text-gray-900">{formatCurrency(item.valor)}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.cantidad} facturas)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${
                        index === 0 ? 'bg-green-600' : 
                        index === 1 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${item.porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{formatPercentage(item.porcentaje)} del total</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top deudores */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Deudores</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-4 font-medium text-gray-600">Cliente</th>
                  <th className="text-right py-2 px-4 font-medium text-gray-600">Valor Adeudado</th>
                  <th className="text-center py-2 px-4 font-medium text-gray-600">Días Vencidos</th>
                  <th className="text-center py-2 px-4 font-medium text-gray-600">Facturas</th>
                </tr>
              </thead>
              <tbody>
                {datos.topDeudores.map((deudor, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-900">{deudor.cliente}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(deudor.valor)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        deudor.dias > 60 ? 'bg-red-100 text-red-800' :
                        deudor.dias > 30 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {deudor.dias} días
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-600">{deudor.facturas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderReporteSeleccionado = () => {
    switch (reporteSeleccionado) {
      case 'ventas-mensuales':
        return renderReporteVentas();
      case 'cuentas-cobrar':
        return renderReporteCuentasCobrar();
      case 'flujo-caja':
      case 'analisis-clientes':
        return (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reporte en Desarrollo</h3>
            <p className="text-gray-500">Este reporte estará disponible próximamente</p>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Reportes Financieros</h2>
          <p className="text-gray-600">Análisis detallado del desempeño financiero</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
          <Download className="w-5 h-5 mr-2" />
          Exportar PDF
        </button>
      </div>

      {/* Tipos de reporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiposReporte.map((tipo) => {
          const IconComponent = tipo.icono;
          const isSelected = reporteSeleccionado === tipo.id;
          
          return (
            <button
              key={tipo.id}
              onClick={() => setReporteSeleccionado(tipo.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                isSelected 
                  ? `${getColorClasses(tipo.color)} border-current` 
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <IconComponent className={`w-6 h-6 ${isSelected ? '' : 'text-gray-600'}`} />
                <h3 className={`font-medium ${isSelected ? '' : 'text-gray-900'}`}>
                  {tipo.titulo}
                </h3>
              </div>
              <p className={`text-sm ${isSelected ? 'opacity-90' : 'text-gray-600'}`}>
                {tipo.descripcion}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filtros de fecha */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={cargarDatosReportes}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filtrar
          </button>
        </div>
      </div>

      {/* Contenido del reporte */}
      <AnimatePresence mode="wait">
        <motion.div
          key={reporteSeleccionado}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderReporteSeleccionado()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ReportesFinancieros;
