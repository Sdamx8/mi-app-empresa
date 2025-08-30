import React, { useState } from 'react';

const FiltrosReportes = ({ 
  filtros, 
  onFiltroChange, 
  onLimpiarFiltros, 
  opcionesFiltros,
  totalResultados = 0,
  cargando = false 
}) => {
  const [filtrosAvanzadosAbiertos, setFiltrosAvanzadosAbiertos] = useState(false);

  const handleInputChange = (campo, valor) => {
    onFiltroChange(campo, valor);
  };

  const toggleFiltrosAvanzados = () => {
    setFiltrosAvanzadosAbiertos(!filtrosAvanzadosAbiertos);
  };

  return (
    <div className="modern-card shadow-modern-lg p-6 mb-6 fade-in" style={{animationDelay: '0.4s'}}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg floating mr-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium gradient-text">
            🔍 Filtros de Búsqueda
          </h3>
        </div>
        
        <div className="flex items-center space-x-3">
          {totalResultados > 0 && (
            <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              📊 {totalResultados} resultado{totalResultados !== 1 ? 's' : ''}
            </span>
          )}
          
          <button
            onClick={toggleFiltrosAvanzados}
            className="text-sm text-blue-600 hover:text-blue-800 smooth-transition hover-scale"
          >
            {filtrosAvanzadosAbiertos ? '▼ Menos filtros' : '▶ Más filtros'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Filtros básicos - siempre visibles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda general */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Búsqueda General
            </label>
            <div className="relative">
              <input
                type="text"
                value={filtros.busqueda}
                onChange={(e) => handleInputChange('busqueda', e.target.value)}
                placeholder="Buscar en remisión, técnico, móvil, descripción..."
                disabled={cargando}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent smooth-transition disabled:opacity-50"
              />
              
              {filtros.busqueda && (
                <button
                  onClick={() => handleInputChange('busqueda', '')}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 smooth-transition hover-scale"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Técnico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              👷‍♂️ Técnico
            </label>
            <div className="relative">
              <select
                value={filtros.tecnico}
                onChange={(e) => handleInputChange('tecnico', e.target.value)}
                disabled={cargando}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent smooth-transition disabled:opacity-50 appearance-none"
              >
                <option value="">Todos los técnicos</option>
                {opcionesFiltros.tecnicos.map((tecnico) => (
                  <option key={tecnico} value={tecnico}>
                    {tecnico}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-4 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filtros avanzados - colapsibles */}
        <div className={`transition-all duration-300 ease-in-out ${filtrosAvanzadosAbiertos ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'}`}>
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Móvil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🚛 Móvil
                </label>
                <select
                  value={filtros.movil}
                  onChange={(e) => handleInputChange('movil', e.target.value)}
                  disabled={cargando}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent smooth-transition disabled:opacity-50 appearance-none"
                >
                  <option value="">Todos los móviles</option>
                  {opcionesFiltros.moviles.map((movil) => (
                    <option key={movil} value={movil}>
                      {movil}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha desde */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Fecha Desde
                </label>
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => handleInputChange('fechaDesde', e.target.value)}
                  disabled={cargando}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent smooth-transition disabled:opacity-50"
                />
              </div>

              {/* Fecha hasta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => handleInputChange('fechaHasta', e.target.value)}
                  disabled={cargando}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent smooth-transition disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {/* Indicadores de filtros activos */}
            {Object.entries(filtros).filter(([_, valor]) => valor).map(([campo, valor]) => (
              <span 
                key={campo}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {campo === 'busqueda' && '🔍'}
                {campo === 'tecnico' && '👷‍♂️'}
                {campo === 'movil' && '🚛'}
                {campo === 'fechaDesde' && '📅'}
                {campo === 'fechaHasta' && '📅'}
                {' '}
                {campo}: {typeof valor === 'string' && valor.length > 20 ? `${valor.substring(0, 20)}...` : valor}
                <button
                  onClick={() => handleInputChange(campo, '')}
                  className="ml-1 hover:text-blue-600"
                >
                  ×
                </button>
              </span>
            ))}
            
            {Object.values(filtros).some(valor => valor) && (
              <span className="text-xs text-gray-500">
                {Object.values(filtros).filter(valor => valor).length} filtro{Object.values(filtros).filter(valor => valor).length !== 1 ? 's' : ''} activo{Object.values(filtros).filter(valor => valor).length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex space-x-3">
            {/* Botón limpiar filtros */}
            <button
              onClick={onLimpiarFiltros}
              disabled={cargando || !Object.values(filtros).some(valor => valor)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 smooth-transition hover-scale disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar Filtros
            </button>

            {/* Indicador de estado */}
            <div className="flex items-center">
              {cargando ? (
                <div className="flex items-center text-blue-600">
                  <div className="corporate-spinner w-4 h-4 mr-2"></div>
                  <span className="text-sm">Filtrando...</span>
                </div>
              ) : (
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm">Filtros aplicados</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros predefinidos rápidos */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-3">🚀 Filtros Rápidos:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const hoy = new Date().toISOString().split('T')[0];
              handleInputChange('fechaDesde', hoy);
              handleInputChange('fechaHasta', hoy);
            }}
            disabled={cargando}
            className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 smooth-transition hover-scale disabled:opacity-50"
          >
            📅 Hoy
          </button>
          
          <button
            onClick={() => {
              const hoy = new Date();
              const hace7dias = new Date(hoy.getTime() - 7 * 24 * 60 * 60 * 1000);
              handleInputChange('fechaDesde', hace7dias.toISOString().split('T')[0]);
              handleInputChange('fechaHasta', hoy.toISOString().split('T')[0]);
            }}
            disabled={cargando}
            className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded-full hover:bg-green-100 smooth-transition hover-scale disabled:opacity-50"
          >
            📊 Última semana
          </button>
          
          <button
            onClick={() => {
              const hoy = new Date();
              const hace30dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);
              handleInputChange('fechaDesde', hace30dias.toISOString().split('T')[0]);
              handleInputChange('fechaHasta', hoy.toISOString().split('T')[0]);
            }}
            disabled={cargando}
            className="px-3 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-full hover:bg-yellow-100 smooth-transition hover-scale disabled:opacity-50"
          >
            📈 Último mes
          </button>

          {opcionesFiltros.tecnicos.length > 0 && (
            <button
              onClick={() => handleInputChange('tecnico', opcionesFiltros.tecnicos[0])}
              disabled={cargando}
              className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 smooth-transition hover-scale disabled:opacity-50"
            >
              👷‍♂️ {opcionesFiltros.tecnicos[0]?.substring(0, 15)}{opcionesFiltros.tecnicos[0]?.length > 15 ? '...' : ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltrosReportes;
