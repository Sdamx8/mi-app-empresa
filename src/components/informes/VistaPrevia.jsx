/**
 * VISTA PREVIA DEL INFORME
 * Muestra el informe antes de guardarlo
 */

import React from 'react';

const VistaPrevia = ({ 
  remision, 
  datosFormulario, 
  datosConsolidados, 
  imagenes, 
  onGuardar, 
  guardando 
}) => {
  
  if (!remision || !datosFormulario) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
        <p className="text-gray-500 text-center">
          Complete todos los pasos anteriores para ver la vista previa
        </p>
      </div>
    );
  }

  const crearTituloTrabajo = () => {
    const servicios = [];
    if (remision.servicio1) servicios.push('SERVICIO 1');
    if (remision.servicio2) servicios.push('SERVICIO 2');
    if (remision.servicio3) servicios.push('SERVICIO 3');
    return servicios.join(', ');
  };

  const formatearFecha = (timestamp) => {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('es-ES');
    }
    return new Date(timestamp).toLocaleDateString('es-ES');
  };

  const validarDatos = () => {
    if (!datosFormulario.tecnico) {
      return 'Falta seleccionar el técnico responsable';
    }
    return null;
  };

  const error = validarDatos();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        👁️ Vista Previa del Informe
      </h3>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">❌ {error}</p>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Header del informe */}
        <div className="bg-blue-600 text-white p-6">
          <h1 className="text-2xl font-bold text-center">INFORME TÉCNICO</h1>
          <p className="text-center text-blue-100 mt-2">
            Global Mobility Solutions
          </p>
        </div>

        {/* Contenido del informe */}
        <div className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                INFORMACIÓN GENERAL
              </h4>
              <div className="space-y-2 text-sm">
                <p><strong>ID Informe:</strong> INF-{remision.remision}-{Date.now()}</p>
                <p><strong>Número de Remisión:</strong> {remision.remision}</p>
                <p><strong>Fecha de Remisión:</strong> {formatearFecha(remision.fecha_remision)}</p>
                <p><strong>Móvil:</strong> {remision.movil || 'N/A'}</p>
                <p><strong>Autorizado por:</strong> {remision.autorizo || 'N/A'}</p>
                <p><strong>Estado:</strong> {datosFormulario.estadoTrabajo}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                DETALLES TÉCNICOS
              </h4>
              <div className="space-y-2 text-sm">
                <p><strong>Técnico Responsable:</strong> {datosFormulario.tecnico}</p>
                <p><strong>Carrocería:</strong> {remision.carroceria || 'N/A'}</p>
                <p><strong>UNE:</strong> {remision.une || 'N/A'}</p>
                <p><strong>Elaborado en:</strong> {new Date().toLocaleDateString('es-ES')}</p>
              </div>
            </div>
          </div>

          {/* Título del trabajo */}
          <div>
            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-1">
              TRABAJO REALIZADO
            </h4>
            <p className="text-sm bg-blue-50 p-3 rounded">
              {crearTituloTrabajo()}
            </p>
          </div>

          {/* Datos consolidados */}
          {datosConsolidados && (
            <div>
              <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                INFORMACIÓN TÉCNICA CONSOLIDADA
              </h4>
              
              {datosConsolidados.descripciones.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-700 mb-2">Actividades Realizadas:</h5>
                  <ul className="text-sm space-y-1">
                    {datosConsolidados.descripciones.map((desc, i) => (
                      <li key={i} className="text-gray-600">• {desc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {datosConsolidados.materiales.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-700 mb-2">Materiales Utilizados:</h5>
                  <div className="flex flex-wrap gap-2">
                    {datosConsolidados.materiales.map((material, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {datosConsolidados.recursos.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-semibold text-gray-700 mb-2">Recursos Humanos:</h5>
                  <div className="flex flex-wrap gap-2">
                    {datosConsolidados.recursos.map((recurso, i) => (
                      <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {recurso}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h5 className="font-semibold text-gray-700 mb-2">Tiempo Total Estimado:</h5>
                <p className="text-sm text-gray-600">
                  {datosConsolidados.tiempoTotal.horas} horas {datosConsolidados.tiempoTotal.minutos} minutos
                </p>
              </div>
            </div>
          )}

          {/* Observaciones y Recomendaciones */}
          {(datosFormulario.observaciones || datosFormulario.recomendaciones) && (
            <div className="grid md:grid-cols-2 gap-6">
              {datosFormulario.observaciones && (
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Observaciones:</h5>
                  <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded">
                    {datosFormulario.observaciones}
                  </p>
                </div>
              )}

              {datosFormulario.recomendaciones && (
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Recomendaciones:</h5>
                  <p className="text-sm text-gray-600 bg-green-50 p-3 rounded">
                    {datosFormulario.recomendaciones}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Imágenes */}
          {(imagenes?.imagenesAntes?.length > 0 || imagenes?.imagenesDespues?.length > 0) && (
            <div>
              <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-200 pb-1">
                EVIDENCIA FOTOGRÁFICA
              </h4>
              
              <div className="grid md:grid-cols-2 gap-6">
                {imagenes.imagenesAntes?.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-3">Fotos ANTES ({imagenes.imagenesAntes.length})</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {imagenes.imagenesAntes.map((imagen, i) => (
                        <div key={i} className="border border-gray-200 rounded overflow-hidden">
                          <img 
                            src={imagen.url} 
                            alt={`Antes ${i+1}`}
                            className="w-full h-20 object-cover"
                          />
                          <p className="text-xs p-1 bg-gray-50 text-gray-600 truncate">
                            {imagen.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {imagenes.imagenesDespues?.length > 0 && (
                  <div>
                    <h5 className="font-semibold text-gray-700 mb-3">Fotos DESPUÉS ({imagenes.imagenesDespues.length})</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {imagenes.imagenesDespues.map((imagen, i) => (
                        <div key={i} className="border border-gray-200 rounded overflow-hidden">
                          <img 
                            src={imagen.url} 
                            alt={`Después ${i+1}`}
                            className="w-full h-20 object-cover"
                          />
                          <p className="text-xs p-1 bg-gray-50 text-gray-600 truncate">
                            {imagen.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Informe generado el {new Date().toLocaleDateString('es-ES')} por el sistema de Global Mobility Solutions
          </p>
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onGuardar}
          disabled={guardando || !!error}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {guardando ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Guardando...
            </>
          ) : (
            <>
              💾 Guardar Informe Técnico
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VistaPrevia;