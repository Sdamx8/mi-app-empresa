import React, { useState, useMemo } from 'react';
import { formatearMoneda, formatearTexto } from '../utils/reportesUtils';

const TablaReportes = ({ datos, cargando = false, onExportar }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [ordenarPor, setOrdenarPor] = useState({ campo: 'remision', direccion: 'desc' });
  const itemsPerPage = 10;

  // Datos ordenados
  const datosOrdenados = useMemo(() => {
    if (!Array.isArray(datos)) return [];
    
    return [...datos].sort((a, b) => {
      const aValue = a[ordenarPor.campo] || '';
      const bValue = b[ordenarPor.campo] || '';
      
      // Manejo especial para números
      if (ordenarPor.campo === 'total' || ordenarPor.campo === 'subtotal') {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        return ordenarPor.direccion === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Manejo especial para fechas
      if (ordenarPor.campo === 'fecha') {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return ordenarPor.direccion === 'asc' ? aDate - bDate : bDate - aDate;
      }
      
      // Manejo para strings
      const aStr = aValue.toString().toLowerCase();
      const bStr = bValue.toString().toLowerCase();
      
      if (ordenarPor.direccion === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [datos, ordenarPor]);

  // Paginación
  const datosPaginados = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return datosOrdenados.slice(startIndex, startIndex + itemsPerPage);
  }, [datosOrdenados, currentPage]);

  const totalPages = Math.ceil(datosOrdenados.length / itemsPerPage);

  const handleSort = (campo) => {
    setOrdenarPor(prev => ({
      campo,
      direccion: prev.campo === campo && prev.direccion === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getSortIcon = (campo) => {
    if (ordenarPor.campo !== campo) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return ordenarPor.direccion === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    );
  };

  if (cargando) {
    return (
      <div className="modern-card shadow-modern-lg overflow-hidden fade-in">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div className="h-6 w-32 skeleton rounded"></div>
            <div className="h-8 w-24 skeleton rounded"></div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <th key={i} className="px-6 py-3">
                    <div className="h-4 skeleton rounded w-20"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <td key={j} className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 skeleton rounded"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!Array.isArray(datos) || datos.length === 0) {
    return (
      <div className="modern-card shadow-modern-lg p-8 text-center fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
        <p className="text-gray-600 mb-4">
          No se encontraron remisiones que coincidan con los filtros aplicados.
        </p>
        <div className="text-sm text-gray-500">
          💡 Intenta ajustar los filtros o cargar más datos
        </div>
      </div>
    );
  }

  return (
    <div className="modern-card shadow-modern-lg overflow-hidden fade-in" style={{animationDelay: '0.6s'}}>
      {/* Header de la tabla */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium gradient-text">
              📊 Tabla de Remisiones
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {datosOrdenados.length} remision{datosOrdenados.length !== 1 ? 'es' : ''} encontrada{datosOrdenados.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {onExportar && datosOrdenados.length > 0 && (
            <button
              onClick={() => onExportar('csv')}
              className="modern-button glow-effect"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 smooth-transition group"
                onClick={() => handleSort('remision')}
              >
                <div className="flex items-center space-x-1">
                  <span>Remisión</span>
                  <div className="group-hover:opacity-100 opacity-50">
                    {getSortIcon('remision')}
                  </div>
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 smooth-transition group"
                onClick={() => handleSort('fecha')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fecha</span>
                  <div className="group-hover:opacity-100 opacity-50">
                    {getSortIcon('fecha')}
                  </div>
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 smooth-transition group"
                onClick={() => handleSort('tecnico')}
              >
                <div className="flex items-center space-x-1">
                  <span>Técnico</span>
                  <div className="group-hover:opacity-100 opacity-50">
                    {getSortIcon('tecnico')}
                  </div>
                </div>
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 smooth-transition group"
                onClick={() => handleSort('movil')}
              >
                <div className="flex items-center space-x-1">
                  <span>Móvil</span>
                  <div className="group-hover:opacity-100 opacity-50">
                    {getSortIcon('movil')}
                  </div>
                </div>
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Autorizo
              </th>
              
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 smooth-transition group"
                onClick={() => handleSort('total')}
              >
                <div className="flex items-center space-x-1">
                  <span>Total</span>
                  <div className="group-hover:opacity-100 opacity-50">
                    {getSortIcon('total')}
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {datosPaginados.map((item, index) => (
              <tr 
                key={item.id || `${item.remision}-${index}`} 
                className="hover:bg-gray-50 smooth-transition slide-in-left" 
                style={{animationDelay: `${0.8 + index * 0.05}s`}}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-xs font-bold">
                        {item.remision ? item.remision.toString().slice(-2) : '??'}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 hover-scale">
                      {item.remision || 'N/A'}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{item.fechaTexto || 'Sin fecha'}</div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    </div>
                    <div className="text-sm text-gray-900 hover-scale">
                      {formatearTexto(item.tecnico || 'Sin asignar', 20)}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover-scale">
                    🚛 {item.movil || 'N/A'}
                  </span>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900" title={item.descripcion}>
                    {formatearTexto(item.descripcion || 'Sin descripción', 40)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatearTexto(item.autorizo || 'No especificado', 20)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold">
                    {item.total > 0 ? (
                      <span className="text-green-600">{formatearMoneda(item.total)}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  {item.subtotal && item.subtotal !== item.total && (
                    <div className="text-xs text-gray-500">
                      Subtotal: {formatearMoneda(item.subtotal)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 slide-in-right" style={{animationDelay: '1s'}}>
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="modern-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="modern-button disabled:opacity-50 disabled:cursor-not-allowed ml-3"
            >
              Siguiente
            </button>
          </div>
          
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando{' '}
                <span className="font-medium gradient-text">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                a{' '}
                <span className="font-medium gradient-text">
                  {Math.min(currentPage * itemsPerPage, datosOrdenados.length)}
                </span>{' '}
                de{' '}
                <span className="font-medium gradient-text">
                  {datosOrdenados.length}
                </span>{' '}
                resultados
              </p>
            </div>
            
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {/* Botón primera página */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 smooth-transition hover-scale disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7M21 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Botón página anterior */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 smooth-transition hover-scale disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Números de página */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium smooth-transition hover-scale ${
                        pageNumber === currentPage
                          ? 'z-10 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-500 gradient-text glow-effect'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                {/* Botón página siguiente */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 smooth-transition hover-scale disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Botón última página */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 smooth-transition hover-scale disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M3 5l7 7-7 7" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablaReportes;
