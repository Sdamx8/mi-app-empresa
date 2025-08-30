import React, { useState } from 'react';
import { formatearMoneda, formatearNumero, obtenerColor } from '../utils/reportesUtils';

const VisualizadorGraficos = ({ datosGraficos, cargando = false }) => {
  const [vistaActual, setVistaActual] = useState('tecnicos');
  const [tipoGrafico, setTipoGrafico] = useState('barras');

  if (cargando) {
    return (
      <div className="modern-card shadow-modern-lg p-6 mb-6 fade-in">
        <div className="flex justify-between items-center mb-6">
          <div className="h-6 w-32 skeleton rounded"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-20 skeleton rounded"></div>
            <div className="h-8 w-20 skeleton rounded"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 skeleton rounded"></div>
          <div className="h-64 skeleton rounded"></div>
        </div>
      </div>
    );
  }

  const opciones = [
    { id: 'tecnicos', titulo: '👷‍♂️ Por Técnico', datos: datosGraficos.porTecnico },
    { id: 'moviles', titulo: '🚛 Por Móvil', datos: datosGraficos.porMovil },
    { id: 'meses', titulo: '📅 Por Mes', datos: datosGraficos.porMes }
  ];

  const opcionActual = opciones.find(opt => opt.id === vistaActual);
  const datosActuales = opcionActual?.datos || [];

  // Componente de gráfico de barras
  const GraficoBarras = ({ datos, tipo = 'count' }) => {
    if (!datos.length) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No hay datos disponibles</p>
          </div>
        </div>
      );
    }

    const maxValor = Math.max(...datos.map(item => item[tipo]));
    
    return (
      <div className="h-64 flex items-end space-x-2 p-4 bg-gradient-to-t from-gray-50 to-transparent rounded-lg">
        {datos.slice(0, 8).map((item, index) => {
          const altura = maxValor > 0 ? (item[tipo] / maxValor) * 100 : 0;
          const color = obtenerColor(index);
          
          return (
            <div key={item.nombre} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full rounded-t-lg smooth-transition hover-scale cursor-pointer relative group"
                style={{ 
                  height: `${altura}%`, 
                  backgroundColor: color,
                  minHeight: '8px',
                  animation: `slideInLeft 0.8s ease-out ${index * 0.1}s both`
                }}
                title={`${item.nombre}: ${formatearNumero(item[tipo])} ${tipo === 'count' ? 'remisiones' : ''} ${tipo === 'valor' ? formatearMoneda(item[tipo]) : ''}`}
              >
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                  {tipo === 'count' ? formatearNumero(item[tipo]) : formatearMoneda(item[tipo])}
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-600 text-center transform rotate-45 origin-left w-16 truncate">
                {item.nombre.length > 10 ? `${item.nombre.substring(0, 10)}...` : item.nombre}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Componente de gráfico circular (dona)
  const GraficoDona = ({ datos, tipo = 'count' }) => {
    if (!datos.length) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No hay datos disponibles</p>
          </div>
        </div>
      );
    }

    const total = datos.reduce((sum, item) => sum + item[tipo], 0);
    const datosLimitados = datos.slice(0, 6);
    
    let anguloAcumulado = 0;
    const segmentos = datosLimitados.map((item, index) => {
      const porcentaje = (item[tipo] / total) * 100;
      const angulo = (item[tipo] / total) * 360;
      const anguloInicio = anguloAcumulado;
      anguloAcumulado += angulo;
      
      return {
        ...item,
        porcentaje,
        angulo,
        anguloInicio,
        color: obtenerColor(index)
      };
    });

    return (
      <div className="h-64 flex items-center">
        <div className="w-48 h-48 relative mx-auto">
          <svg width="192" height="192" viewBox="0 0 192 192" className="transform -rotate-90">
            <circle 
              cx="96" 
              cy="96" 
              r="80" 
              fill="none" 
              stroke="#f3f4f6" 
              strokeWidth="32"
            />
            
            {segmentos.map((segmento, index) => {
              const circumference = 2 * Math.PI * 80;
              const strokeDasharray = `${(segmento.porcentaje / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((segmento.anguloInicio / 360) * circumference);
              
              return (
                <circle
                  key={segmento.nombre}
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  stroke={segmento.color}
                  strokeWidth="32"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="smooth-transition hover:opacity-80 cursor-pointer"
                  style={{
                    animation: `slideInLeft 1s ease-out ${index * 0.2}s both`
                  }}
                >
                  <title>{`${segmento.nombre}: ${segmento.porcentaje.toFixed(1)}%`}</title>
                </circle>
              );
            })}
          </svg>
          
          {/* Centro con total */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold gradient-text">
                {formatearNumero(total)}
              </div>
              <div className="text-xs text-gray-500">
                {tipo === 'count' ? 'Total' : 'Valor'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Leyenda */}
        <div className="ml-6 space-y-2">
          {segmentos.map((segmento, index) => (
            <div key={segmento.nombre} className="flex items-center text-sm hover-scale">
              <div 
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: segmento.color }}
              ></div>
              <div className="flex-1">
                <div className="text-gray-900 font-medium">
                  {segmento.nombre.length > 15 ? `${segmento.nombre.substring(0, 15)}...` : segmento.nombre}
                </div>
                <div className="text-gray-500 text-xs">
                  {tipo === 'count' ? `${formatearNumero(segmento[tipo])} remisiones` : formatearMoneda(segmento[tipo])}
                  {' '}({segmento.porcentaje.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="modern-card shadow-modern-lg p-6 mb-6 fade-in" style={{animationDelay: '0.8s'}}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg floating mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium gradient-text">
            📈 Análisis Gráfico
          </h3>
        </div>
        
        <div className="flex space-x-2">
          {/* Selector de vista */}
          <select
            value={vistaActual}
            onChange={(e) => setVistaActual(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent smooth-transition text-sm"
          >
            {opciones.map(opcion => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.titulo}
              </option>
            ))}
          </select>
          
          {/* Selector de tipo de gráfico */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setTipoGrafico('barras')}
              className={`px-3 py-2 text-sm smooth-transition ${
                tipoGrafico === 'barras' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📊 Barras
            </button>
            <button
              onClick={() => setTipoGrafico('dona')}
              className={`px-3 py-2 text-sm smooth-transition ${
                tipoGrafico === 'dona' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🍩 Dona
            </button>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico por cantidad */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              📊 Por Cantidad de Remisiones
            </h4>
            <div className="text-sm text-gray-500">
              {datosActuales.length} elemento{datosActuales.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {tipoGrafico === 'barras' ? (
            <GraficoBarras datos={datosActuales} tipo="count" />
          ) : (
            <GraficoDona datos={datosActuales} tipo="count" />
          )}
        </div>

        {/* Gráfico por valor */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              💰 Por Valor Total
            </h4>
            <div className="text-sm text-gray-500">
              {formatearMoneda(datosActuales.reduce((sum, item) => sum + (item.valor || 0), 0))}
            </div>
          </div>
          
          {tipoGrafico === 'barras' ? (
            <GraficoBarras datos={datosActuales} tipo="valor" />
          ) : (
            <GraficoDona datos={datosActuales} tipo="valor" />
          )}
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          📋 Estadísticas Detalladas - {opcionActual?.titulo}
        </h4>
        
        {datosActuales.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {datosActuales.slice(0, 3).map((item, index) => (
              <div 
                key={item.nombre}
                className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg hover-scale"
                style={{animationDelay: `${1 + index * 0.1}s`}}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: obtenerColor(index) }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900">
                      {item.nombre.length > 20 ? `${item.nombre.substring(0, 20)}...` : item.nombre}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remisiones:</span>
                    <span className="font-medium text-blue-600">{formatearNumero(item.count)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Valor:</span>
                    <span className="font-medium text-green-600">{formatearMoneda(item.valor)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Promedio:</span>
                    <span className="font-medium text-purple-600">{formatearMoneda(item.valorPromedio)}</span>
                  </div>
                </div>
                
                {/* Barra de progreso relativa */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Participación</span>
                    <span>
                      {((item.count / datosActuales.reduce((sum, d) => sum + d.count, 0)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full smooth-transition"
                      style={{ 
                        backgroundColor: obtenerColor(index),
                        width: `${(item.count / datosActuales.reduce((sum, d) => sum + d.count, 0)) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p>No hay estadísticas disponibles para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizadorGraficos;
