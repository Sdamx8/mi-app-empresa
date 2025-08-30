import React from 'react';
import { formatearMoneda, formatearNumero, calcularTendencia } from '../utils/reportesUtils';

const MetricasReportes = ({ metricas, datosGraficos, cargando = false }) => {
  if (cargando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="modern-card p-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <div className="w-6 h-6 skeleton"></div>
              </div>
              <div className="ml-4 flex-1">
                <div className="h-4 skeleton mb-2 rounded"></div>
                <div className="h-6 skeleton w-16 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Calcular tendencias
  const tendenciaValor = calcularTendencia(datosGraficos.porMes, 'valor');
  const tendenciaCount = calcularTendencia(datosGraficos.porMes, 'count');

  const metricasCards = [
    {
      titulo: 'Total Remisiones',
      valor: formatearNumero(metricas.totalRemisiones),
      icono: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'blue',
      animationDelay: '0s',
      tendencia: tendenciaCount,
      descripcion: 'Número total de remisiones procesadas'
    },
    {
      titulo: 'Valor Total',
      valor: formatearMoneda(metricas.valorTotal),
      icono: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      color: 'green',
      animationDelay: '0.1s',
      tendencia: tendenciaValor,
      descripcion: 'Suma total del valor de todas las remisiones'
    },
    {
      titulo: 'Valor Promedio',
      valor: formatearMoneda(metricas.valorPromedio),
      icono: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      color: 'yellow',
      animationDelay: '0.2s',
      descripcion: 'Valor promedio por remisión'
    },
    {
      titulo: 'Técnicos Activos',
      valor: formatearNumero(metricas.totalTecnicos),
      icono: (
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'purple',
      animationDelay: '0.3s',
      descripcion: 'Número de técnicos únicos con remisiones'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        gradient: 'gradient-text'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        gradient: 'text-green-600'
      },
      yellow: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-600',
        gradient: 'text-yellow-600'
      },
      purple: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        gradient: 'text-purple-600'
      }
    };
    return colors[color] || colors.blue;
  };

  const getTendenciaIcon = (tendencia) => {
    switch (tendencia.tendencia) {
      case 'crecimiento':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 17l9.2-9.2M17 17V7h-10" />
          </svg>
        );
      case 'decrecimiento':
        return (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      case 'estable':
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
          </svg>
        );
    }
  };

  const getTendenciaColor = (tendencia) => {
    switch (tendencia.tendencia) {
      case 'crecimiento':
        return 'text-green-600';
      case 'decrecimiento':
        return 'text-red-600';
      case 'estable':
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="slide-in-right">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {metricasCards.map((metrica, index) => {
          const colorClasses = getColorClasses(metrica.color);
          
          return (
            <div 
              key={metrica.titulo}
              className="modern-card hover-scale p-6 fade-in"
              style={{ animationDelay: metrica.animationDelay }}
            >
              <div className="flex items-center">
                <div className={`p-2 ${colorClasses.bg} rounded-lg floating`} style={{animationDelay: `${0.5 + index * 0.2}s`}}>
                  {metrica.icono}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{metrica.titulo}</p>
                  <p className={`text-2xl font-bold ${colorClasses.gradient}`}>
                    {metrica.valor}
                  </p>
                  
                  {/* Tendencia (solo para métricas que la tienen) */}
                  {metrica.tendencia && (
                    <div className="flex items-center mt-2">
                      {getTendenciaIcon(metrica.tendencia)}
                      <span className={`text-xs font-medium ml-1 ${getTendenciaColor(metrica.tendencia)}`}>
                        {Math.abs(metrica.tendencia.porcentaje)}% este período
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tooltip con descripción */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{metrica.descripcion}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Remisión más reciente */}
        <div className="modern-card p-6 fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Última Remisión</h3>
            <div className="p-2 bg-indigo-100 rounded-lg">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold gradient-text mb-1">
              {metricas.remisionReciente}
            </p>
            <p className="text-sm text-gray-500">{metricas.fechaReciente}</p>
          </div>
        </div>

        {/* Total de móviles */}
        <div className="modern-card p-6 fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Móviles Únicos</h3>
            <div className="p-2 bg-orange-100 rounded-lg floating" style={{animationDelay: '1.2s'}}>
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 00-2 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2a2 2 0 00-2-2V7a2 2 0 012-2h2z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600 mb-1">
              {formatearNumero(metricas.totalMoviles)}
            </p>
            <p className="text-sm text-gray-500">Vehículos en operación</p>
          </div>
        </div>

        {/* Eficiencia promedio */}
        <div className="modern-card p-6 fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Eficiencia</h3>
            <div className="p-2 bg-cyan-100 rounded-lg floating" style={{animationDelay: '1.4s'}}>
              <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-cyan-600 mb-1">
              {metricas.totalTecnicos > 0 ? 
                formatearNumero(Math.round(metricas.totalRemisiones / metricas.totalTecnicos)) : 
                '0'
              }
            </p>
            <p className="text-sm text-gray-500">Remisiones por técnico</p>
          </div>
        </div>
      </div>

      {/* Indicadores de rendimiento */}
      <div className="modern-card p-6 mb-6 fade-in" style={{ animationDelay: '0.7s' }}>
        <h3 className="text-lg font-medium text-gray-900 mb-4 gradient-text">
          📈 Indicadores de Rendimiento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top técnico */}
          {datosGraficos.porTecnico.length > 0 && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-3 bounce-in">
                <span className="text-white font-bold text-lg">👑</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Técnico Destacado</h4>
              <p className="text-sm font-semibold gradient-text">
                {datosGraficos.porTecnico[0].nombre}
              </p>
              <p className="text-xs text-gray-500">
                {formatearNumero(datosGraficos.porTecnico[0].count)} remisiones
              </p>
            </div>
          )}

          {/* Top móvil */}
          {datosGraficos.porMovil.length > 0 && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-3 bounce-in" style={{animationDelay: '0.2s'}}>
                <span className="text-white font-bold text-lg">🚛</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Móvil Más Activo</h4>
              <p className="text-sm font-semibold text-green-600">
                {datosGraficos.porMovil[0].nombre}
              </p>
              <p className="text-xs text-gray-500">
                {formatearNumero(datosGraficos.porMovil[0].count)} remisiones
              </p>
            </div>
          )}

          {/* Mejor mes */}
          {datosGraficos.porMes.length > 0 && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-3 bounce-in" style={{animationDelay: '0.4s'}}>
                <span className="text-white font-bold text-lg">📅</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Mejor Período</h4>
              <p className="text-sm font-semibold text-yellow-600">
                {datosGraficos.porMes.reduce((mejor, actual) => 
                  actual.count > mejor.count ? actual : mejor
                ).nombre}
              </p>
              <p className="text-xs text-gray-500">
                Mayor actividad registrada
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetricasReportes;
