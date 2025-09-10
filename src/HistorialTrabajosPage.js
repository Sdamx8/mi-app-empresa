import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

const HistorialTrabajosPage = () => {
  const [remisiones, setRemisiones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRemisiones, setFilteredRemisiones] = useState([]);

  useEffect(() => {
    const cargarRemisiones = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'remisiones'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Debug: Mostrar la estructura de los primeros documentos
        console.log('📊 Estructura de remisiones cargadas:');
        console.log('Total documentos:', data.length);
        if (data.length > 0) {
          console.log('Primer documento:', data[0]);
          console.log('Campos disponibles:', Object.keys(data[0]));
          
          // Mostrar los primeros 3 documentos para ver patrones
          console.log('📋 Muestra de documentos:');
          data.slice(0, 3).forEach((doc, index) => {
            console.log(`Documento ${index + 1}:`, {
              id: doc.id,
              movil: doc.movil || doc.numero_movil || 'NO_FIELD',
              remision: doc.remision || doc.numero_remision || 'NO_FIELD',
              fecha: doc.fecha || doc.fecha_remision || 'NO_FIELD',
              tecnico: doc.tecnico || doc.elaboradoPor || 'NO_FIELD',
              total: doc.total || doc.montoTotal || 'NO_FIELD'
            });
          });
        }
        
        setRemisiones(data);
      } catch (error) {
        console.error('Error al cargar las remisiones:', error);
      }
    };

    cargarRemisiones();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredRemisiones([]);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = remisiones.filter(remision => {
        // Verificar que existe el campo móvil y hacer la búsqueda
        const movil = remision.movil || remision.numero_movil || '';
        return movil.toString().toLowerCase().includes(lowerCaseSearchTerm);
      });
      setFilteredRemisiones(filtered);
    }
  }, [searchTerm, remisiones]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Historial de Trabajos</h2>

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Buscar por Número de Móvil</h3>
        <input
          type="text"
          placeholder="Ingresa el número de móvil..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-700 mb-4">Resultados de la Búsqueda</h3>
        {searchTerm === '' ? (
          <p className="text-gray-500">Ingresa un número de móvil para buscar.</p>
        ) : filteredRemisiones.length === 0 ? (
          <p className="text-gray-500">No se encontraron trabajos para el móvil "{searchTerm}".</p>
        ) : (
          <div className="space-y-6">
            {filteredRemisiones.map((remision) => {
              // Función para validar la fecha de remisión
              const validarFechaRemision = (fecha) => {
                const fechaRemision = new Date(fecha);
                const fechaActual = new Date();
                const diferenciaMeses = (fechaActual - fechaRemision) / (1000 * 60 * 60 * 24 * 30.44); // Aproximadamente 30.44 días por mes
                
                return diferenciaMeses < 6 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
              };

              const colorClaseFecha = validarFechaRemision(remision.fecha || remision.fecha_remision);

              return (
                <div key={remision.id} className="bg-white border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Móvil</span>
                        <span className="text-sm font-medium text-gray-900">{remision.movil || remision.numero_movil || 'N/A'}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Remisión</span>
                        <span className="text-sm text-gray-600">#{remision.remision || remision.numero_remision || remision.id || 'N/A'}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Fecha de Remisión</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${colorClaseFecha}`}>
                          {remision.fecha || remision.fecha_remision || 'N/A'}
                        </span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">UNE</span>
                        <span className="text-sm text-gray-600">{remision.une || 'N/A'}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Estado</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full w-fit ${
                          (remision.estado || 'Pendiente') === 'Pendiente' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {remision.estado || 'Pendiente'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Elaborado Por</span>
                        <span className="text-sm text-gray-600">{remision.elaboradoPor || remision.tecnico || 'N/A'}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Trabajo Realizado</span>
                        <span className="text-sm text-gray-600">{remision.trabajoRealizado || remision.descripcion || 'N/A'}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Monto Total</span>
                        <span className="text-sm font-medium text-gray-900">${remision.montoTotal || remision.total || '0'}</span>
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Evidencias</span>
                        <div className="text-sm text-gray-600">
                          {(!remision.evidencias || remision.evidencias.length === 0) ? (
                            <span className="text-gray-400 italic">Sin evidencias</span>
                          ) : (
                            <div className="flex gap-2 flex-wrap">
                              {remision.evidencias.slice(0, 4).map((url, index) => (
                                <img 
                                  key={index} 
                                  src={url} 
                                  alt={`Evidencia ${index + 1}`} 
                                  className="w-12 h-12 object-cover rounded border hover:scale-110 transition-transform cursor-pointer" 
                                />
                              ))}
                              {remision.evidencias.length > 4 && (
                                <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                                  <span className="text-xs text-gray-500">+{remision.evidencias.length - 4}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorialTrabajosPage;
