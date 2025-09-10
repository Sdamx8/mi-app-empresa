import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import './App.css';

// Función para formatear fechas correctamente
function formatearFecha(fecha) {
  if (!fecha) return 'N/A';
  
  try {
    // Si es string en formato DD/MM/YYYY
    if (typeof fecha === 'string' && fecha.includes('/')) {
      const partes = fecha.split('/');
      if (partes.length === 3) {
        const [dia, mes, año] = partes;
        const fechaObj = new Date(`${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`);
        if (!isNaN(fechaObj.getTime())) {
          return fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
      }
    }
    return fecha.toString();
  } catch (error) {
    console.warn('Error formateando fecha:', fecha, error);
    return fecha.toString();
  }
}

function BuscarHistorial() {
  const [movil, setMovil] = useState('');
  const [resultados, setResultados] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const buscarHistorial = async () => {
    try {
      setCargando(true);
      setMensaje('');
      
      const numeroLimpio = movil.trim();
      
      if (!numeroLimpio) {
        setMensaje('');
        setResultados([]);
        setCargando(false);
        return;
      }

      const ref = collection(db, 'remisiones');
      const q = query(ref, where('MOVIL', '==', Number(numeroLimpio)));
      const querySnapshot = await getDocs(q);

      const datos = querySnapshot.docs.map(doc => doc.data());

      if (datos.length === 0) {
        setMensaje('No se encontraron resultados para este número de móvil.');
        setResultados([]);
      } else {
        setMensaje('');
        setResultados(datos);
      }
    } catch (error) {
      console.error('Error en la búsqueda:', error);
      setMensaje('Error al realizar la búsqueda. Por favor, intenta nuevamente.');
      setResultados([]);
    } finally {
      setCargando(false);
    }
  };

  const limpiarBusqueda = () => {
    setMovil('');
    setResultados([]);
    setMensaje('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="modern-card p-8 mb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="corporate-logo">
              <span className="logo-text">📋</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-4 fade-in">
            Consulta de Remisiones por Móvil
          </h1>
          <p className="text-gray-600 text-lg slide-in-left">
            Sistema de búsqueda de historial de mantenimiento de unidades móviles
          </p>
        </div>

        {/* Search Section */}
        <div className="modern-card p-8 mb-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              🔍 Buscar por Número de Móvil
            </h2>
            
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="movil" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Móvil
                </label>
                <input
                  type="text"
                  id="movil"
                  value={movil}
                  onChange={(e) => setMovil(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Ej: 123"
                  onKeyPress={(e) => e.key === 'Enter' && buscarHistorial()}
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={buscarHistorial}
                  disabled={cargando}
                  className="modern-button px-6 py-3 enhanced-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cargando ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Buscando...
                    </>
                  ) : (
                    <>🔍 Buscar</>
                  )}
                </button>
                
                <button
                  onClick={limpiarBusqueda}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 enhanced-hover"
                >
                  🗑️ Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {cargando && (
          <div className="modern-card p-8 text-center">
            <div className="corporate-spinner mx-auto mb-4"></div>
            <p className="text-gray-600">Consultando base de datos de remisiones...</p>
          </div>
        )}

        {/* Message */}
        {mensaje && !cargando && (
          <div className="modern-card p-6 mb-8 border-l-4 border-yellow-500 bg-yellow-50">
            <div className="flex items-center">
              <span className="text-2xl mr-3">⚠️</span>
              <p className="text-yellow-800 font-medium">{mensaje}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {resultados.length > 0 && !cargando && (
          <div className="modern-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                📊 Resultados de la Búsqueda
              </h2>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                <span className="font-semibold">{resultados.length}</span> remisión(es) encontrada(s)
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-modern">
                <thead className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Móvil</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Cliente</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Conductor</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Origen</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Destino</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resultados.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">🚛</span>
                          <span className="text-sm font-bold text-blue-600">{item.MOVIL}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        📅 {formatearFecha(item.FECHA)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{item.CLIENTE || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm mr-1">👨‍💼</span>
                          <span className="text-sm text-gray-900">{item.CONDUCTOR || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm mr-1">📍</span>
                          <span className="text-sm text-gray-900">{item.ORIGEN || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm mr-1">🎯</span>
                          <span className="text-sm text-gray-900">{item.DESTINO || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          item.ESTADO === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                          item.ESTADO === 'EN_PROCESO' ? 'bg-yellow-100 text-yellow-800' :
                          item.ESTADO === 'PENDIENTE' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.ESTADO || 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Card */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Resumen de Remisiones</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-modern">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📋</span>
                    <div>
                      <p className="text-sm text-gray-600">Total Remisiones</p>
                      <p className="text-2xl font-bold text-blue-600">{resultados.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-modern">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">✅</span>
                    <div>
                      <p className="text-sm text-gray-600">Completadas</p>
                      <p className="text-2xl font-bold text-green-600">
                        {resultados.filter(r => r.ESTADO === 'COMPLETADO').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-modern">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⏳</span>
                    <div>
                      <p className="text-sm text-gray-600">Pendientes</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {resultados.filter(r => r.ESTADO !== 'COMPLETADO').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="modern-card p-8 mt-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">💡 Ayuda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">🔍 Cómo buscar:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Ingresa el número de móvil (solo números)</li>
                <li>• Presiona "Buscar" o Enter</li>
                <li>• Los resultados aparecerán automáticamente</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">📊 Información mostrada:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Datos de remisiones de transporte</li>
                <li>• Información de conductor y cliente</li>
                <li>• Estado actual de cada remisión</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuscarHistorial;
