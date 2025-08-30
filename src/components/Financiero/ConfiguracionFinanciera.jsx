// components/Financiero/ConfiguracionFinanciera.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Save,
  RefreshCw,
  FileText,
  DollarSign,
  Building,
  User,
  Bell,
  Calculator,
  Percent,
  Calendar,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react';

const ConfiguracionFinanciera = () => {
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [configuracion, setConfiguracion] = useState({
    empresa: {
      razon_social: '',
      nit: '',
      direccion: '',
      telefono: '',
      email: '',
      sitio_web: ''
    },
    facturacion: {
      prefijo_factura: 'FAC',
      numeracion_inicial: 1,
      numeracion_actual: 1,
      iva_defecto: 19,
      descuento_maximo: 20,
      terminos_pago_defecto: 30,
      moneda: 'COP',
      decimales: 0
    },
    cobros: {
      dias_vencimiento_alerta: 3,
      maximo_dias_credito: 60,
      interes_mora: 2.5,
      comision_cobranza: 5,
      metodos_pago_activos: {
        efectivo: true,
        transferencia: true,
        cheque: true,
        tarjeta: false
      }
    },
    metas: {
      meta_mensual: 2500000,
      meta_anual: 30000000,
      margen_utilidad_minimo: 25,
      flujo_caja_minimo: 500000
    },
    alertas: {
      facturas_vencidas: true,
      facturas_por_vencer: true,
      metas_ventas: true,
      flujo_caja_bajo: true,
      grandes_deudores: true,
      umbral_deuda_critica: 200000
    },
    reportes: {
      frecuencia_backup: 'semanal',
      retention_backup: 12,
      envio_automatico_reportes: false,
      emails_reportes: []
    }
  });

  const [tabActiva, setTabActiva] = useState('empresa');
  const [errores, setErrores] = useState({});
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const tabs = [
    { id: 'empresa', nombre: 'Datos de Empresa', icono: Building },
    { id: 'facturacion', nombre: 'Facturación', icono: FileText },
    { id: 'cobros', nombre: 'Cobros y Pagos', icono: DollarSign },
    { id: 'metas', nombre: 'Metas y Objetivos', icono: Calculator },
    { id: 'alertas', nombre: 'Alertas', icono: Bell },
    { id: 'reportes', nombre: 'Reportes', icono: FileText }
  ];

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      
      // Datos simulados de configuración
      const configSimulada = {
        empresa: {
          razon_social: 'Servicios Técnicos Empresariales S.A.S',
          nit: '900123456-7',
          direccion: 'Carrera 50 #123-45, Bogotá D.C.',
          telefono: '+57 1 234-5678',
          email: 'facturacion@empresa.com',
          sitio_web: 'www.empresa.com'
        },
        facturacion: {
          prefijo_factura: 'FAC',
          numeracion_inicial: 1,
          numeracion_actual: 7,
          iva_defecto: 19,
          descuento_maximo: 20,
          terminos_pago_defecto: 30,
          moneda: 'COP',
          decimales: 0
        },
        cobros: {
          dias_vencimiento_alerta: 3,
          maximo_dias_credito: 60,
          interes_mora: 2.5,
          comision_cobranza: 5,
          metodos_pago_activos: {
            efectivo: true,
            transferencia: true,
            cheque: true,
            tarjeta: false
          }
        },
        metas: {
          meta_mensual: 2800000,
          meta_anual: 33600000,
          margen_utilidad_minimo: 25,
          flujo_caja_minimo: 600000
        },
        alertas: {
          facturas_vencidas: true,
          facturas_por_vencer: true,
          metas_ventas: true,
          flujo_caja_bajo: true,
          grandes_deudores: true,
          umbral_deuda_critica: 200000
        },
        reportes: {
          frecuencia_backup: 'semanal',
          retention_backup: 12,
          envio_automatico_reportes: false,
          emails_reportes: ['gerencia@empresa.com', 'contabilidad@empresa.com']
        }
      };
      
      setTimeout(() => {
        setConfiguracion(configSimulada);
        setLoading(false);
      }, 800);

    } catch (error) {
      console.error('Error cargando configuración:', error);
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

  const handleChange = (seccion, campo, valor) => {
    setConfiguracion(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor
      }
    }));

    // Limpiar error si existe
    if (errores[`${seccion}.${campo}`]) {
      setErrores(prev => ({
        ...prev,
        [`${seccion}.${campo}`]: null
      }));
    }
  };

  const handleMetodoPagoChange = (metodo) => {
    setConfiguracion(prev => ({
      ...prev,
      cobros: {
        ...prev.cobros,
        metodos_pago_activos: {
          ...prev.cobros.metodos_pago_activos,
          [metodo]: !prev.cobros.metodos_pago_activos[metodo]
        }
      }
    }));
  };

  const validarConfiguracion = () => {
    const nuevosErrores = {};

    // Validar datos de empresa
    if (!configuracion.empresa.razon_social.trim()) {
      nuevosErrores['empresa.razon_social'] = 'La razón social es requerida';
    }
    if (!configuracion.empresa.nit.trim()) {
      nuevosErrores['empresa.nit'] = 'El NIT es requerido';
    }

    // Validar facturación
    if (configuracion.facturacion.iva_defecto < 0 || configuracion.facturacion.iva_defecto > 100) {
      nuevosErrores['facturacion.iva_defecto'] = 'El IVA debe estar entre 0 y 100%';
    }
    if (configuracion.facturacion.descuento_maximo < 0 || configuracion.facturacion.descuento_maximo > 100) {
      nuevosErrores['facturacion.descuento_maximo'] = 'El descuento máximo debe estar entre 0 y 100%';
    }

    // Validar metas
    if (configuracion.metas.meta_mensual <= 0) {
      nuevosErrores['metas.meta_mensual'] = 'La meta mensual debe ser mayor a 0';
    }
    if (configuracion.metas.margen_utilidad_minimo < 0 || configuracion.metas.margen_utilidad_minimo > 100) {
      nuevosErrores['metas.margen_utilidad_minimo'] = 'El margen debe estar entre 0 y 100%';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async () => {
    if (!validarConfiguracion()) {
      return;
    }

    try {
      setGuardando(true);
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aquí se guardaría en Firebase
      console.log('Configuración guardada:', configuracion);
      
      // Mostrar mensaje de éxito
      alert('Configuración guardada correctamente');
      
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const renderTabEmpresa = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Razón Social *
          </label>
          <input
            type="text"
            value={configuracion.empresa.razon_social}
            onChange={(e) => handleChange('empresa', 'razon_social', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores['empresa.razon_social'] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errores['empresa.razon_social'] && (
            <p className="mt-1 text-sm text-red-600">{errores['empresa.razon_social']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            NIT *
          </label>
          <input
            type="text"
            value={configuracion.empresa.nit}
            onChange={(e) => handleChange('empresa', 'nit', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores['empresa.nit'] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errores['empresa.nit'] && (
            <p className="mt-1 text-sm text-red-600">{errores['empresa.nit']}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección
          </label>
          <input
            type="text"
            value={configuracion.empresa.direccion}
            onChange={(e) => handleChange('empresa', 'direccion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono
          </label>
          <input
            type="text"
            value={configuracion.empresa.telefono}
            onChange={(e) => handleChange('empresa', 'telefono', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={configuracion.empresa.email}
            onChange={(e) => handleChange('empresa', 'email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sitio Web
          </label>
          <input
            type="url"
            value={configuracion.empresa.sitio_web}
            onChange={(e) => handleChange('empresa', 'sitio_web', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const renderTabFacturacion = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prefijo de Factura
          </label>
          <input
            type="text"
            value={configuracion.facturacion.prefijo_factura}
            onChange={(e) => handleChange('facturacion', 'prefijo_factura', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numeración Actual
          </label>
          <input
            type="number"
            value={configuracion.facturacion.numeracion_actual}
            onChange={(e) => handleChange('facturacion', 'numeracion_actual', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            Próxima factura: {configuracion.facturacion.prefijo_factura}-{new Date().getFullYear()}-{String(configuracion.facturacion.numeracion_actual + 1).padStart(3, '0')}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IVA por Defecto (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={configuracion.facturacion.iva_defecto}
            onChange={(e) => handleChange('facturacion', 'iva_defecto', parseFloat(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores['facturacion.iva_defecto'] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errores['facturacion.iva_defecto'] && (
            <p className="mt-1 text-sm text-red-600">{errores['facturacion.iva_defecto']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descuento Máximo (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={configuracion.facturacion.descuento_maximo}
            onChange={(e) => handleChange('facturacion', 'descuento_maximo', parseFloat(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores['facturacion.descuento_maximo'] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errores['facturacion.descuento_maximo'] && (
            <p className="mt-1 text-sm text-red-600">{errores['facturacion.descuento_maximo']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Términos de Pago (días)
          </label>
          <input
            type="number"
            value={configuracion.facturacion.terminos_pago_defecto}
            onChange={(e) => handleChange('facturacion', 'terminos_pago_defecto', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moneda
          </label>
          <select
            value={configuracion.facturacion.moneda}
            onChange={(e) => handleChange('facturacion', 'moneda', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="COP">Peso Colombiano (COP)</option>
            <option value="USD">Dólar Americano (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderTabCobros = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Días para Alerta de Vencimiento
          </label>
          <input
            type="number"
            value={configuracion.cobros.dias_vencimiento_alerta}
            onChange={(e) => handleChange('cobros', 'dias_vencimiento_alerta', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Máximo Días de Crédito
          </label>
          <input
            type="number"
            value={configuracion.cobros.maximo_dias_credito}
            onChange={(e) => handleChange('cobros', 'maximo_dias_credito', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Interés de Mora (% mensual)
          </label>
          <input
            type="number"
            step="0.1"
            value={configuracion.cobros.interes_mora}
            onChange={(e) => handleChange('cobros', 'interes_mora', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comisión Cobranza (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={configuracion.cobros.comision_cobranza}
            onChange={(e) => handleChange('cobros', 'comision_cobranza', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Métodos de Pago Activos</h4>
        <div className="space-y-3">
          {Object.entries(configuracion.cobros.metodos_pago_activos).map(([metodo, activo]) => (
            <div key={metodo} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900 capitalize">{metodo}</h5>
                <p className="text-sm text-gray-600">
                  {metodo === 'efectivo' && 'Pagos en efectivo'}
                  {metodo === 'transferencia' && 'Transferencias bancarias'}
                  {metodo === 'cheque' && 'Pagos con cheque'}
                  {metodo === 'tarjeta' && 'Tarjetas de crédito/débito'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={() => handleMetodoPagoChange(metodo)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTabMetas = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Mensual de Ventas
          </label>
          <input
            type="number"
            value={configuracion.metas.meta_mensual}
            onChange={(e) => handleChange('metas', 'meta_mensual', parseInt(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores['metas.meta_mensual'] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          <p className="mt-1 text-sm text-gray-500">
            {formatCurrency(configuracion.metas.meta_mensual)}
          </p>
          {errores['metas.meta_mensual'] && (
            <p className="mt-1 text-sm text-red-600">{errores['metas.meta_mensual']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meta Anual de Ventas
          </label>
          <input
            type="number"
            value={configuracion.metas.meta_anual}
            onChange={(e) => handleChange('metas', 'meta_anual', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formatCurrency(configuracion.metas.meta_anual)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Margen de Utilidad Mínimo (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={configuracion.metas.margen_utilidad_minimo}
            onChange={(e) => handleChange('metas', 'margen_utilidad_minimo', parseFloat(e.target.value))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errores['metas.margen_utilidad_minimo'] ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errores['metas.margen_utilidad_minimo'] && (
            <p className="mt-1 text-sm text-red-600">{errores['metas.margen_utilidad_minimo']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Flujo de Caja Mínimo
          </label>
          <input
            type="number"
            value={configuracion.metas.flujo_caja_minimo}
            onChange={(e) => handleChange('metas', 'flujo_caja_minimo', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">
            {formatCurrency(configuracion.metas.flujo_caja_minimo)}
          </p>
        </div>
      </div>
    </div>
  );

  const renderTabActiva = () => {
    switch (tabActiva) {
      case 'empresa':
        return renderTabEmpresa();
      case 'facturacion':
        return renderTabFacturacion();
      case 'cobros':
        return renderTabCobros();
      case 'metas':
        return renderTabMetas();
      case 'alertas':
        return (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de Alertas</h3>
            <p className="text-gray-500">
              Ve al módulo de Alertas para configurar las notificaciones
            </p>
          </div>
        );
      case 'reportes':
        return (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configuración de Reportes</h3>
            <p className="text-gray-500">
              Próximamente: Configuración automática de reportes
            </p>
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
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuración Financiera</h2>
          <p className="text-gray-600">Configura los parámetros del sistema financiero</p>
        </div>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {guardando ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          ) : (
            <Save className="w-5 h-5 mr-2" />
          )}
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Navegación de tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => {
              const IconComponent = tab.icono;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTabActiva(tab.id)}
                  className={`group inline-flex items-center py-4 px-6 border-b-2 font-medium text-sm ${
                    tabActiva === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <IconComponent className={`-ml-0.5 mr-2 h-5 w-5 ${
                    tabActiva === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`} />
                  {tab.nombre}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido del tab */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tabActiva}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabActiva()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Información adicional */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Información Importante</h3>
            <p className="text-sm text-blue-700 mt-1">
              Los cambios en la configuración se aplicarán inmediatamente. Asegúrate de revisar todos los valores antes de guardar.
              Algunos cambios como la numeración de facturas no se pueden deshacer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionFinanciera;
