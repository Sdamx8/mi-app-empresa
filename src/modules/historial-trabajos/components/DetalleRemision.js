import React from 'react';
import { THEME_COLORS } from '../../../shared/constants';

const DetalleRemision = ({ remision, onClose }) => {
  if (!remision) return null;

  // Función para formatear fechas
  const formatearFecha = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return fecha.toLocaleString('es-CO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Obtener servicios
  const obtenerServicios = () => {
    const servicios = [];
    for (let i = 1; i <= 5; i++) {
      const servicio = remision[`servicio${i}`];
      if (servicio && servicio.trim()) {
        servicios.push({ numero: i, descripcion: servicio });
      }
    }
    return servicios;
  };

  // Obtener técnicos
  const obtenerTecnicos = () => {
    const tecnicos = [];
    for (let i = 1; i <= 3; i++) {
      const tecnico = remision[`tecnico${i}`];
      if (tecnico && tecnico.trim()) {
        tecnicos.push({ numero: i, nombre: tecnico });
      }
    }
    return tecnicos;
  };

  // Obtener estado con color
  const obtenerEstadoConColor = (estado) => {
    const estadosColor = {
      'RADICADO': { color: 'bg-green-100 text-green-800 border-green-200', icono: '✅' },
      'PENDIENTE': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icono: '⏳' },
      'EN_PROCESO': { color: 'bg-blue-100 text-blue-800 border-blue-200', icono: '🔄' },
      'COMPLETADO': { color: 'bg-purple-100 text-purple-800 border-purple-200', icono: '🎯' },
      'CANCELADO': { color: 'bg-red-100 text-red-800 border-red-200', icono: '❌' }
    };
    
    const estadoUpper = estado?.toUpperCase() || 'PENDIENTE';
    return estadosColor[estadoUpper] || estadosColor.PENDIENTE;
  };

  const servicios = obtenerServicios();
  const tecnicos = obtenerTecnicos();
  const estadoInfo = obtenerEstadoConColor(remision.estado);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Remisión #{remision.remision}
            </h2>
            <p className="text-sm text-gray-600">Móvil: {remision.movil}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${estadoInfo.color}`}>
              {estadoInfo.icono} {remision.estado || 'PENDIENTE'}
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6 space-y-8">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                📋 Información General
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Remisión</span>
                  <p className="font-medium">{remision.remision}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Móvil</span>
                  <p className="font-medium">{remision.movil}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">UNE</span>
                  <p className="font-medium">{remision.une || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Carrocería</span>
                  <p className="font-medium">{remision.carroceria || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                💰 Información Financiera
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Subtotal</span>
                  <p className="font-medium text-lg">
                    ${remision.subtotal?.toLocaleString('es-CO') || '0'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Total</span>
                  <p className="font-bold text-xl text-green-600">
                    ${remision.total?.toLocaleString('es-CO') || '0'}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">No. Factura Electrónica</span>
                  <p className="font-medium">{remision.no_fact_elect || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">No. Orden</span>
                  <p className="font-medium">{remision.no_orden || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                📅 Fechas Importantes
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Fecha Remisión</span>
                  <p className="font-medium text-sm">{formatearFecha(remision.fecha_remision)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Fecha Máximo</span>
                  <p className="font-medium text-sm">{formatearFecha(remision.fecha_maximo)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Fecha Bit Prof</span>
                  <p className="font-medium text-sm">{formatearFecha(remision.fecha_bit_prof)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Radicación</span>
                  <p className="font-medium text-sm">{formatearFecha(remision.radicacion)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personas involucradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                👥 Personal Involucrado
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Generó</span>
                  <p className="font-medium">{remision.genero || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Autorizó</span>
                  <p className="font-medium">{remision.autorizo || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">No. ID Bit</span>
                  <p className="font-medium">{remision.no_id_bit || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Técnicos */}
            {tecnicos.length > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  🔧 Técnicos Asignados
                </h3>
                <div className="space-y-2">
                  {tecnicos.map((tecnico, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                        #{tecnico.numero}
                      </span>
                      <span className="font-medium">{tecnico.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Servicios */}
          {servicios.length > 0 && (
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                🛠️ Servicios Realizados
              </h3>
              <div className="space-y-3">
                {servicios.map((servicio, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-white rounded border border-indigo-200">
                    <span className="bg-indigo-200 text-indigo-800 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                      Servicio {servicio.numero}
                    </span>
                    <p className="text-sm text-gray-700 flex-1">
                      {servicio.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">📊 Datos Técnicos</h3>
              <div className="text-sm space-y-1">
                <p><span className="font-medium">ID Documento:</span> {remision.id}</p>
                {/* Añadir más campos técnicos si están disponibles */}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">⚠️ Notas</h3>
              <p className="text-sm text-gray-600">
                {remision.notas || remision.observaciones || 'Sin notas adicionales'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            📄 Generar Reporte
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            📧 Enviar por Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleRemision;
