/**
 * CONSOLIDADOR DE SERVICIOS
 * Muestra los servicios de una remisión y sus datos consolidados
 */

import React, { useState, useEffect } from 'react';
import { informesService } from '../../services/informesService';

const ConsolidadorServicios = ({ remision, onDatosConsolidados, onError }) => {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [datosConsolidados, setDatosConsolidados] = useState(null);

  useEffect(() => {
    if (remision) {
      buscarServicios();
    }
  }, [remision]);

  const buscarServicios = async () => {
    setCargando(true);
    
    try {
      // Extraer títulos de servicios de la remisión
      const titulosServicios = [];
      if (remision.servicio1) titulosServicios.push(remision.servicio1);
      if (remision.servicio2) titulosServicios.push(remision.servicio2);
      if (remision.servicio3) titulosServicios.push(remision.servicio3);

      const serviciosEncontrados = await informesService.buscarServicios(titulosServicios);
      setServicios(serviciosEncontrados);

      // Consolidar datos
      const consolidado = informesService.consolidarDatosServicios(serviciosEncontrados);
      setDatosConsolidados(consolidado);
      onDatosConsolidados(consolidado);
      
    } catch (error) {
      console.error('Error buscando servicios:', error);
      onError(error.message);
    } finally {
      setCargando(false);
    }
  };

  if (!remision) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
        <p className="text-gray-500 text-center">
          Primero busque una remisión para ver los servicios
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        ⚙️ Servicios de la Remisión {remision.remision}
      </h3>

      {cargando ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando servicios...</p>
        </div>
      ) : (
        <>
          {/* Lista de servicios */}
          <div className="space-y-4 mb-6">
            {[remision.servicio1, remision.servicio2, remision.servicio3]
              .filter(servicio => servicio)
              .map((titulo, index) => {
                const servicioData = servicios.find(s => s.título === titulo);
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Servicio {index + 1}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">{titulo}</p>
                    
                    {servicioData ? (
                      <div className="text-xs text-gray-500 space-y-1">
                        <p><strong>ID:</strong> {servicioData.id_servicio}</p>
                        <p><strong>Categoría:</strong> {servicioData.categoría}</p>
                        <p><strong>Costo:</strong> ${servicioData.costo?.toLocaleString()}</p>
                        <p><strong>Tiempo estimado:</strong> {servicioData.tiempo_estimado}h</p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600">
                        ⚠️ Información detallada no encontrada
                      </p>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Datos consolidados */}
          {datosConsolidados && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3">
                📊 Datos Consolidados
              </h4>
              
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">Descripciones</h5>
                  <div className="space-y-1">
                    {datosConsolidados.descripciones.length > 0 ? (
                      datosConsolidados.descripciones.map((desc, i) => (
                        <p key={i} className="text-blue-600 text-xs">
                          • {desc.substring(0, 100)}...
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-500">Sin descripciones</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-blue-700 mb-2">Materiales</h5>
                  <div className="flex flex-wrap gap-1">
                    {datosConsolidados.materiales.length > 0 ? (
                      datosConsolidados.materiales.map((material, i) => (
                        <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {material}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">Sin materiales</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-blue-700 mb-2">Recursos Humanos</h5>
                  <div className="flex flex-wrap gap-1">
                    {datosConsolidados.recursos.length > 0 ? (
                      datosConsolidados.recursos.map((recurso, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          {recurso}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500">Sin recursos</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-blue-700 mb-2">Tiempo Total</h5>
                  <p className="text-blue-600">
                    {datosConsolidados.tiempoTotal.horas}h {datosConsolidados.tiempoTotal.minutos}m
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ConsolidadorServicios;