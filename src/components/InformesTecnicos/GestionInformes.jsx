import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  orderBy,
  query 
} from 'firebase/firestore';
import { ref as firebaseRef, deleteObject } from 'firebase/storage';
import { db, storage } from '../../firebaseConfig';
import { useAuth } from '../../AuthContext';
import PDFGenerator from './PDFGenerator';

const GestionInformes = () => {
  const [informes, setInformes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInforme, setSelectedInforme] = useState(null);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { user } = useAuth();

  // Cargar informes
  useEffect(() => {
    cargarInformes();
  }, []);

  const cargarInformes = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'informesTecnicos'),
        orderBy('fechaCreacion', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const informesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate?.() || new Date(),
        fechaModificacion: doc.data().fechaModificacion?.toDate?.() || new Date()
      }));
      
      setInformes(informesData);
    } catch (error) {
      console.error('Error al cargar informes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar informes por término de búsqueda
  const informesFiltrados = informes.filter(informe =>
    informe.numeroRemision?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    informe.idInforme?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    informe.remisionData?.tecnico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    informe.remisionData?.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Eliminar informe
  const eliminarInforme = async (informe) => {
    try {
      setLoading(true);
      
      // Eliminar evidencias de Firebase Storage
      if (informe.evidencias && informe.evidencias.length > 0) {
        const deletePromises = informe.evidencias.map(evidencia => {
          if (evidencia.storagePath) {
            const storageRef = firebaseRef(storage, evidencia.storagePath);
            return deleteObject(storageRef);
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
      }
      
      // Eliminar documento de Firestore
      await deleteDoc(doc(db, 'informesTecnicos', informe.id));
      
      // Actualizar estado local
      setInformes(prev => prev.filter(inf => inf.id !== informe.id));
      setDeleteConfirm(null);
      
      alert('Informe eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar informe:', error);
      alert('Error al eliminar el informe');
    } finally {
      setLoading(false);
    }
  };

  // Ver detalles del informe
  const verDetalles = (informe) => {
    setSelectedInforme(informe);
  };

  // Generar PDF
  const generarPDF = (informe) => {
    setSelectedInforme(informe);
    setShowPDFPreview(true);
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Encabezado y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            📋 Gestión de Informes Técnicos
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por remisión, ID o técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <button
              onClick={cargarInformes}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '🔄' : '🔄 Actualizar'}
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {informesFiltrados.length} de {informes.length} informes
        </div>
      </div>

      {/* Tabla de informes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando informes...</p>
          </div>
        ) : informesFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No se encontraron informes que coincidan con la búsqueda' : 'No hay informes técnicos registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Informe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remisión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Técnico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Móvil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evidencias
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {informesFiltrados.map((informe) => (
                  <motion.tr
                    key={informe.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                      {informe.idInforme || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {informe.numeroRemision || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {informe.remisionData?.tecnico || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {informe.remisionData?.movil || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {informe.estado || 'Generado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatearFecha(informe.fechaCreacion)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        📸 {informe.evidencias?.length || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => verDetalles(informe)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalles"
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => generarPDF(informe)}
                          className="text-green-600 hover:text-green-900"
                          title="Generar PDF"
                        >
                          📄
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(informe)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedInforme && !showPDFPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedInforme(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  📋 Detalles del Informe: {selectedInforme.idInforme}
                </h3>
                <button
                  onClick={() => setSelectedInforme(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Información de la remisión */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Datos de la Remisión</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Número:</strong> {selectedInforme.numeroRemision}</div>
                    <div><strong>Móvil:</strong> {selectedInforme.remisionData?.movil}</div>
                    <div><strong>Técnico:</strong> {selectedInforme.remisionData?.tecnico}</div>
                    <div><strong>Fecha:</strong> {selectedInforme.remisionData?.fecha_remision}</div>
                    <div><strong>Autorizado por:</strong> {selectedInforme.remisionData?.autorizo}</div>
                    <div><strong>Total:</strong> ${selectedInforme.remisionData?.total}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Información del Informe</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Creado por:</strong> {selectedInforme.creadoPor}</div>
                    <div><strong>Fecha creación:</strong> {formatearFecha(selectedInforme.fechaCreacion)}</div>
                    <div><strong>Estado:</strong> {selectedInforme.estado}</div>
                    <div><strong>Evidencias:</strong> {selectedInforme.evidencias?.length || 0} imágenes</div>
                  </div>
                </div>
              </div>

              {/* Descripción del trabajo */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Descripción del Trabajo</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                  {selectedInforme.remisionData?.descripcion || 'N/A'}
                </p>
              </div>

              {/* Observaciones técnicas */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Observaciones Técnicas</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                  {selectedInforme.observaciones || 'N/A'}
                </p>
              </div>

              {/* Evidencias fotográficas */}
              {selectedInforme.evidencias && selectedInforme.evidencias.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Evidencias Fotográficas ({selectedInforme.evidencias.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedInforme.evidencias.map((evidencia, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={evidencia.url}
                          alt={`Evidencia ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer"
                          onClick={() => window.open(evidencia.url, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                          <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => generarPDF(selectedInforme)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  📄 Generar PDF
                </button>
                <button
                  onClick={() => setSelectedInforme(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Modal de confirmación de eliminación */}
      {deleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ⚠️ Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro de que desea eliminar el informe <strong>{deleteConfirm.idInforme}</strong>?
              Esta acción no se puede deshacer y eliminará todas las evidencias asociadas.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={() => eliminarInforme(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Vista previa del PDF */}
      {showPDFPreview && selectedInforme && (
        <PDFGenerator
          informeData={selectedInforme}
          isPreview={true}
          onClose={() => {
            setShowPDFPreview(false);
            setSelectedInforme(null);
          }}
        />
      )}
    </motion.div>
  );
};

export default GestionInformes;
