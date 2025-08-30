import React, { useState } from 'react';

import CorporateLogo from '../../CorporateLogo';
import MetricasReportes from './components/MetricasReportes';
import FiltrosReportes from './components/FiltrosReportes';
import TablaReportes from './components/TablaReportes';
import VisualizadorGraficos from './components/VisualizadorGraficos';
import { useReportesData } from './hooks/useReportesData';
import '../../App.css';

const ReportesInformes = () => {
  const [vistaActual, setVistaActual] = useState('dashboard');
  const {
    datos,
    cargando,
    error,
    filtros,
    metricas,
    datosGraficos,
    opcionesFiltros,
    actualizarFiltro,
    limpiarFiltros,
    cargarDatos,
    exportarDatos
  } = useReportesData();

  const vistas = [
    { id: 'dashboard', titulo: '📊 Dashboard', icono: '📊' },
    { id: 'graficos', titulo: '📈 Gráficos', icono: '📈' },
    { id: 'tabla', titulo: '📋 Tabla Detallada', icono: '📋' }
  ];

  const handleExportar = (formato = 'csv') => {
    try {
      exportarDatos(formato);
    } catch (err) {
      console.error('Error al exportar:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header with Corporate Logo */}
        <div className="mb-8 slide-in-left">
          <div className="flex items-center justify-between mb-6">
            <CorporateLogo size="medium" showText={true} className="bounce-in" />
            <div className="text-right">
              <div className="text-sm text-gray-500">Última actualización</div>
              <div className="text-sm font-semibold text-gray-700">
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 typing-animation">
            📊 Reportes e Informes
          </h1>
          <p className="text-gray-600">
            Análisis completo de las remisiones con métricas, gráficos y reportes detallados
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="modern-card shadow-modern-lg mb-6 fade-in" style={{animationDelay: '0.2s'}}>
          <div className="flex border-b border-gray-200">
            {vistas.map((vista, index) => (
              <button
                key={vista.id}
                onClick={() => setVistaActual(vista.id)}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 smooth-transition nav-tab hover-scale ${
                  vistaActual === vista.id
                    ? 'border-blue-500 gradient-text glow-effect'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={{animationDelay: `${0.3 + index * 0.1}s`}}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{vista.icono}</span>
                  <span className="hidden md:inline">{vista.titulo}</span>
                  <span className="md:hidden">{vista.titulo.split(' ')[1] || vista.titulo}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="modern-card shadow-modern-lg p-6 mb-6 bg-red-50 border-l-4 border-red-500 fade-in">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error al cargar datos</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={cargarDatos}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 smooth-transition hover-scale"
                >
                  🔄 Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters - Always visible */}
        <FiltrosReportes
          filtros={filtros}
          onFiltroChange={actualizarFiltro}
          onLimpiarFiltros={limpiarFiltros}
          opcionesFiltros={opcionesFiltros}
          totalResultados={datos.length}
          cargando={cargando}
        />

        {/* Main Content based on selected view */}
        <div className="module-transition">
          {vistaActual === 'dashboard' && (
            <>
              <MetricasReportes
                metricas={metricas}
                datosGraficos={datosGraficos}
                cargando={cargando}
              />
              
              {/* Quick Summary */}
              <div className="modern-card shadow-modern-lg p-6 mb-6 fade-in" style={{animationDelay: '1s'}}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium gradient-text">
                    🎯 Resumen Ejecutivo
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setVistaActual('graficos')}
                      className="text-sm text-blue-600 hover:text-blue-800 smooth-transition hover-scale"
                    >
                      Ver gráficos →
                    </button>
                    <button
                      onClick={() => setVistaActual('tabla')}
                      className="text-sm text-green-600 hover:text-green-800 smooth-transition hover-scale"
                    >
                      Ver tabla →
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Top Técnico */}
                  {datosGraficos.porTecnico.length > 0 && (
                    <div className="text-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg hover-scale">
                      <div className="text-2xl mb-2">👷‍♂️</div>
                      <h4 className="font-medium text-gray-900 mb-1">Técnico Líder</h4>
                      <p className="text-lg font-bold text-blue-600">
                        {datosGraficos.porTecnico[0].nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {datosGraficos.porTecnico[0].count} remisiones
                      </p>
                    </div>
                  )}

                  {/* Top Móvil */}
                  {datosGraficos.porMovil.length > 0 && (
                    <div className="text-center bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg hover-scale">
                      <div className="text-2xl mb-2">🚛</div>
                      <h4 className="font-medium text-gray-900 mb-1">Móvil Más Activo</h4>
                      <p className="text-lg font-bold text-green-600">
                        {datosGraficos.porMovil[0].nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {datosGraficos.porMovil[0].count} remisiones
                      </p>
                    </div>
                  )}

                  {/* Período Destacado */}
                  {datosGraficos.porMes.length > 0 && (
                    <div className="text-center bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg hover-scale">
                      <div className="text-2xl mb-2">📅</div>
                      <h4 className="font-medium text-gray-900 mb-1">Mejor Mes</h4>
                      <p className="text-lg font-bold text-purple-600">
                        {datosGraficos.porMes.reduce((mejor, actual) => 
                          actual.count > mejor.count ? actual : mejor
                        ).nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        Período más productivo
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {vistaActual === 'graficos' && (
            <>
              <MetricasReportes
                metricas={metricas}
                datosGraficos={datosGraficos}
                cargando={cargando}
              />
              
              <VisualizadorGraficos
                datosGraficos={datosGraficos}
                cargando={cargando}
              />
            </>
          )}

          {vistaActual === 'tabla' && (
            <>
              {/* Mini metrics for table view */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 slide-in-right">
                <div className="modern-card p-4 text-center">
                  <div className="text-2xl font-bold gradient-text">{metricas.totalRemisiones}</div>
                  <div className="text-sm text-gray-600">Remisiones</div>
                </div>
                <div className="modern-card p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">${Math.round(metricas.valorTotal / 1000000)}M</div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                </div>
                <div className="modern-card p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{metricas.totalTecnicos}</div>
                  <div className="text-sm text-gray-600">Técnicos</div>
                </div>
                <div className="modern-card p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{metricas.totalMoviles}</div>
                  <div className="text-sm text-gray-600">Móviles</div>
                </div>
              </div>

              <TablaReportes
                datos={datos}
                cargando={cargando}
                onExportar={handleExportar}
              />
            </>
          )}
        </div>

        {/* Loading State */}
        {cargando && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 fade-in">
            <div className="modern-card p-8 text-center bounce-in">
              <div className="corporate-spinner mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Cargando datos...
              </h3>
              <p className="text-gray-600">
                Obteniendo información de las remisiones
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 fade-in" style={{animationDelay: '1.2s'}}>
          <div className="modern-card p-4 bg-gradient-to-r from-gray-50 to-gray-100">
            <p className="text-sm">
              💡 <strong>Sistema de Reportes e Informes</strong> - 
              Datos actualizados en tiempo real desde la colección de remisiones
            </p>
            <div className="flex justify-center items-center space-x-4 mt-2 text-xs">
              <span>📊 {datos.length} registros procesados</span>
              <span>•</span>
              <span>🔄 Actualizado: {new Date().toLocaleString('es-ES')}</span>
              <span>•</span>
              <span>⚡ Global Mobility Solutions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportesInformes;
