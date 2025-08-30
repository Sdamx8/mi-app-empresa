// components/InformesTecnicos/InformesTable.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '../../RoleContext';
import { 
  Search,
  Edit3,
  Trash2,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  FileText,
  Calendar,
  User,
  Filter
} from 'lucide-react';
import { 
  obtenerInformesTecnicos, 
  buscarInformes,
  eliminarInformeTecnico,
  formatearFecha
} from '../../services/firestore';
import { eliminarImagenesRemision } from '../../services/storage';
import { generarPDFInforme, obtenerVersionPDF } from '../../services/pdf';
import './InformesTecnicos.css';

// Debug: verificar que estamos usando la versión correcta del servicio PDF
console.log('🔍 InformesTable usando:', obtenerVersionPDF());

/**
 * Componente tabla para gestionar informes técnicos
 */
const InformesTable = ({ 
  onEditarInforme, 
  onNuevoInforme,
  actualizarLista = false,
  setActualizarLista 
}) => {
  // Obtener información del empleado logueado
  const { currentEmployee } = useRole();
  const [informes, setInformes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [informesPorPagina] = useState(10);
  const [totalInformes, setTotalInformes] = useState(0);
  const [hayMasPaginas, setHayMasPaginas] = useState(false);

  // Búsqueda y filtros
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [buscando, setBuscando] = useState(false);

  // Estados para acciones
  const [informeSeleccionado, setInformeSeleccionado] = useState(null);
  const [mostrandoConfirmacion, setMostrandoConfirmacion] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(null);

  // Cargar informes
  const cargarInformes = async (pagina = 1, busqueda = '') => {
    try {
      setCargando(true);
      setError(null);

      let informesObtenidos = [];

      if (busqueda.trim()) {
        setBuscando(true);
        informesObtenidos = await buscarInformes(busqueda, informesPorPagina);
      } else {
        const ultimoDoc = pagina > 1 ? informes[informes.length - 1]?.creadoEn : null;
        informesObtenidos = await obtenerInformesTecnicos(informesPorPagina, ultimoDoc);
      }

      if (pagina === 1) {
        setInformes(informesObtenidos);
      } else {
        setInformes(prev => [...prev, ...informesObtenidos]);
      }

      setTotalInformes(informesObtenidos.length);
      setHayMasPaginas(informesObtenidos.length === informesPorPagina);
      
    } catch (err) {
      console.error('Error cargando informes:', err);
      setError(err.message || 'Error al cargar los informes');
    } finally {
      setCargando(false);
      setBuscando(false);
    }
  };

  // Effect para carga inicial y actualización
  useEffect(() => {
    cargarInformes(1, terminoBusqueda);
  }, [actualizarLista]);

  // Reset actualizar lista
  useEffect(() => {
    if (actualizarLista && setActualizarLista) {
      setActualizarLista(false);
    }
  }, [actualizarLista, setActualizarLista]);

  // Buscar informes
  const handleBuscar = async (e) => {
    e.preventDefault();
    setPaginaActual(1);
    await cargarInformes(1, terminoBusqueda);
  };

  // Limpiar búsqueda
  const limpiarBusqueda = async () => {
    setTerminoBusqueda('');
    setPaginaActual(1);
    await cargarInformes(1, '');
  };

  // Cargar más resultados (paginación)
  const cargarMasPaginas = async () => {
    const nuevaPagina = paginaActual + 1;
    setPaginaActual(nuevaPagina);
    await cargarInformes(nuevaPagina, terminoBusqueda);
  };

  // Confirmar eliminación
  const confirmarEliminacion = (informe) => {
    setInformeSeleccionado(informe);
    setMostrandoConfirmacion(true);
  };

  // Eliminar informe
  const eliminarInforme = async () => {
    if (!informeSeleccionado) return;

    setEliminando(true);

    try {
      // Eliminar imágenes de Storage
      if (informeSeleccionado.remision) {
        await eliminarImagenesRemision(informeSeleccionado.remision);
      }

      // Eliminar documento de Firestore
      await eliminarInformeTecnico(informeSeleccionado.id);

      // Actualizar lista local
      setInformes(prev => prev.filter(inf => inf.id !== informeSeleccionado.id));
      
      console.log('Informe eliminado exitosamente:', informeSeleccionado.id);

    } catch (err) {
      console.error('Error eliminando informe:', err);
      setError(err.message || 'Error al eliminar el informe');
    } finally {
      setEliminando(false);
      setMostrandoConfirmacion(false);
      setInformeSeleccionado(null);
    }
  };

  // Generar PDF
  const generarPDF = async (informe) => {
    setGenerandoPDF(informe.id);

    try {
      // Pasar información del empleado actual para incluir en el PDF
      await generarPDFInforme(informe, {
        currentEmployee: currentEmployee,
        incluirLogo: true,
        abrirEnNuevaVentana: true
      });
      console.log('PDF generado exitosamente para:', informe.idInforme);
    } catch (err) {
      console.error('Error generando PDF:', err);
      setError(err.message || 'Error al generar el PDF');
    } finally {
      setGenerandoPDF(null);
    }
  };

  // Renderizar miniaturas de imágenes
  const renderMiniaturas = (informe) => {
    const totalImagenes = 
      (informe.imagenesAntes?.length || 0) + 
      (informe.imagenesDespues?.length || 0);

    if (totalImagenes === 0) {
      return (
        <span className="text-xs text-gray-500 italic">
          Sin imágenes
        </span>
      );
    }

    const primeraImagen = informe.imagenesAntes?.[0] || informe.imagenesDespues?.[0];

    return (
      <div className="flex items-center gap-2">
        {primeraImagen && (
          <img
            src={primeraImagen.url}
            alt="Vista previa"
            className="w-8 h-8 rounded object-cover border border-gray-200"
          />
        )}
        <span className="text-xs text-gray-600">
          {totalImagenes} imagen{totalImagenes !== 1 ? 'es' : ''}
        </span>
      </div>
    );
  };

  if (cargando && informes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Cargando Informes
          </h3>
          <p className="text-gray-600">
            Obteniendo la lista de informes técnicos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200"
    >
      {/* Encabezado y controles */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Informes Técnicos
              </h3>
              <p className="text-sm text-gray-600">
                {totalInformes} informe{totalInformes !== 1 ? 's' : ''} encontrado{totalInformes !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Botón nuevo informe */}
          {onNuevoInforme && (
            <button
              onClick={onNuevoInforme}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <FileText className="w-4 h-4" />
              Nuevo Informe
            </button>
          )}
        </div>

        {/* Barra de búsqueda */}
        <form onSubmit={handleBuscar} className="mt-6 flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={terminoBusqueda}
              onChange={(e) => setTerminoBusqueda(e.target.value)}
              placeholder="Buscar por ID, remisión, móvil, técnico o título..."
              className="w-full px-4 py-2.5 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors duration-200"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          </div>
          
          <button
            type="submit"
            disabled={buscando}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors duration-200"
          >
            {buscando ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <Search className="w-4 h-4" />
            )}
            Buscar
          </button>

          {terminoBusqueda && (
            <button
              type="button"
              onClick={limpiarBusqueda}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        {informes.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay informes técnicos
            </h3>
            <p className="text-gray-600">
              {terminoBusqueda 
                ? 'No se encontraron informes que coincidan con tu búsqueda'
                : 'Aún no se han creado informes técnicos'
              }
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Informe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Móvil
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Evidencias
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {informes.map((informe) => (
                  <motion.tr
                    key={informe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    {/* ID Informe */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {informe.idInforme || 'Sin ID'}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs" title={informe.tituloTrabajo}>
                          {informe.tituloTrabajo || 'Sin título'}
                        </div>
                      </div>
                    </td>

                    {/* Remisión */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {informe.remision || 'No especificada'}
                      </div>
                    </td>

                    {/* Móvil */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {informe.movil || 'No especificado'}
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {informe.estado || 'Generado con éxito'}
                      </span>
                    </td>

                    {/* Evidencias */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderMiniaturas(informe)}
                    </td>

                    {/* Fecha creación */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900">
                          {formatearFecha(informe.creadoEn)}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {informe.tecnico || 'N/A'}
                        </div>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {/* Exportar PDF */}
                        <button
                          onClick={() => generarPDF(informe)}
                          disabled={generandoPDF === informe.id}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Exportar a PDF"
                        >
                          {generandoPDF === informe.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>

                        {/* Editar */}
                        {onEditarInforme && (
                          <button
                            onClick={() => onEditarInforme(informe)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                            title="Editar informe"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Eliminar */}
                        <button
                          onClick={() => confirmarEliminacion(informe)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                          title="Eliminar informe"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {informes.length > 0 && hayMasPaginas && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-center">
            <button
              onClick={cargarMasPaginas}
              disabled={cargando}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {cargando ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              Cargar más informes
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      <AnimatePresence>
        {mostrandoConfirmacion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-start">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    ¿Estás seguro de que quieres eliminar el informe <strong>{informeSeleccionado?.idInforme}</strong>?
                  </p>
                  <p className="text-xs text-red-600 mb-6">
                    Esta acción también eliminará todas las imágenes asociadas y no se puede deshacer.
                  </p>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={eliminarInforme}
                      disabled={eliminando}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors duration-200"
                    >
                      {eliminando ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {eliminando ? 'Eliminando...' : 'Eliminar'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setMostrandoConfirmacion(false);
                        setInformeSeleccionado(null);
                      }}
                      disabled={eliminando}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InformesTable;
