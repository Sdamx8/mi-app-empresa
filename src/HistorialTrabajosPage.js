import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

const HistorialTrabajosPage = () => {
  const [informes, setInformes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInformes, setFilteredInformes] = useState([]);

  useEffect(() => {
    const cargarInformes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'informes'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setInformes(data);
      } catch (error) {
        console.error('Error al cargar los informes:', error);
      }
    };

    cargarInformes();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredInformes([]);
    } else {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const filtered = informes.filter(informe =>
        informe.movil.toLowerCase().includes(lowerCaseSearchTerm)
      );
      setFilteredInformes(filtered);
    }
  }, [searchTerm, informes]);

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
        ) : filteredInformes.length === 0 ? (
          <p className="text-gray-500">No se encontraron trabajos para el móvil "{searchTerm}".</p>
        ) : (
          <ul className="space-y-4">
            {filteredInformes.map((informe) => (
              <li key={informe.id} className="p-4 border rounded-lg shadow-sm bg-gray-50">
                <p className="font-semibold text-gray-800">Móvil: {informe.movil} - Remisión #{informe.remision}</p>
                <p className="text-sm text-gray-600">Fecha: {informe.fecha} - UNE: {informe.une}</p>
                <p className="text-sm text-gray-600">Elaborado Por: {informe.elaboradoPor} - Aprobado Por: {informe.aprobadoPor}</p>
                <p className="text-sm text-gray-600">Estado: <span className={`font-medium ${informe.estado === 'Pendiente' ? 'text-yellow-600' : 'text-green-600'}`}>{informe.estado}</span></p>

                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Trabajo Realizado:</p>
                  <p className="text-sm text-gray-600 italic">{informe.trabajoRealizado}</p>
                </div>

                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Servicios:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {informe.serviciosSeleccionados.map((servicio, index) => (
                      <li key={index}>{servicio}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-gray-600 mt-2">Valor Servicio Unitario: ${informe.valorServicioUnitario} - Monto Total: ${informe.montoTotal}</p>

                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700">Evidencia Fotográfica:</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {informe.evidencias.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No hay evidencia fotográfica.</p>
                    ) : (
                      informe.evidencias.map((url, index) => (
                        <img key={index} src={url} alt={`Evidencia ${index + 1}`} className="w-20 h-20 object-cover rounded-lg shadow-sm" />
                      ))
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HistorialTrabajosPage;
