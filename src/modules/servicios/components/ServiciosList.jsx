import React, { useState, useEffect, useMemo } from 'react';
import { getServicios, updateServicio, addServicio, deleteServicio } from '../services/serviciosService';
import FiltrosServicios from './FiltrosServicios';
import ServicioFormModal from './ServicioFormModal';
import ServicioDetailModal from './ServicioDetailModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { motion } from 'framer-motion';
import './CatalogServicios.css';


const ServiciosList = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null); // Para editar
  const [showDetail, setShowDetail] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [ordenamiento, setOrdenamiento] = useState({ campo: '', direccion: '' });

  const fetchServicios = () => {
    setLoading(true);
    getServicios(filtros)
      .then(data => {
        setServicios(data);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServicios();
    // eslint-disable-next-line
  }, [filtros]);

  // Función para manejar ordenamiento
  const handleOrdenar = (campo) => {
    setOrdenamiento(prev => ({
      campo: campo,
      direccion: prev.campo === campo && prev.direccion === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Aplicar ordenamiento a los servicios
  const serviciosOrdenados = useMemo(() => {
    if (!ordenamiento.campo) return servicios;
    
    return [...servicios].sort((a, b) => {
      let valorA = a[ordenamiento.campo];
      let valorB = b[ordenamiento.campo];
      
      // Manejar valores null/undefined
      if (valorA === null || valorA === undefined) valorA = '';
      if (valorB === null || valorB === undefined) valorB = '';
      
      // Convertir a string para comparación
      valorA = valorA.toString().toLowerCase();
      valorB = valorB.toString().toLowerCase();
      
      if (ordenamiento.direccion === 'asc') {
        return valorA.localeCompare(valorB);
      } else {
        return valorB.localeCompare(valorA);
      }
    });
  }, [servicios, ordenamiento]);

  // Acciones
  const handleVer = (servicio) => {
    setDetailData(servicio);
    setShowDetail(true);
  };
  const handleEditar = (servicio) => {
    setModalData(servicio);
    setShowModal(true);
  };
  const handleEliminar = (servicio) => {
    setDeleteData(servicio);
    setShowDelete(true);
  };
  const handleDeleteConfirm = async () => {
    if (!deleteData) return;
    try {
      await deleteServicio(deleteData.id);
      setShowDelete(false);
      setDeleteData(null);
      fetchServicios();
    } catch (err) {
      alert('Error al eliminar: ' + (err.message || err));
    }
  };

  return (
    <div className="catalogo-servicios">
      {/* Header Section */}
      <div className="header-section">
        <h1 className="page-title">Catálogo de Servicios</h1>
        <motion.button
          className="add-service-button"
          onClick={() => { setShowModal(true); setModalData(null); }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>📝</span> Agregar Servicio
        </motion.button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <FiltrosServicios onChange={setFiltros} />
      </div>

      {/* Results Section */}
      <div className="results-section">
        <div className="results-header">
          <div className="results-count">
            📊 {serviciosOrdenados.length} servicio(s) encontrado(s)
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-message">
            <span>🔄</span>
            Cargando servicios...
          </div>
        )}
        
        {/* Error State */}
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error.message || error.toString()}
          </div>
        )}

        {/* Services Table */}
        {!loading && !error && (
          <motion.div 
            className="tabla-servicios"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <table className="servicios-table">
              <thead>
                <tr>
                  <th 
                    className={`sortable ${ordenamiento.campo === 'titulo' ? ordenamiento.direccion : ''}`}
                    onClick={() => handleOrdenar('titulo')}
                  >
                    TÍTULO
                    {ordenamiento.campo === 'titulo' && (
                      <span className="sort-indicator">
                        {ordenamiento.direccion === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${ordenamiento.campo === 'categoria' ? ordenamiento.direccion : ''}`}
                    onClick={() => handleOrdenar('categoria')}
                  >
                    CATEGORÍA
                    {ordenamiento.campo === 'categoria' && (
                      <span className="sort-indicator">
                        {ordenamiento.direccion === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${ordenamiento.campo === 'costo' ? ordenamiento.direccion : ''}`}
                    onClick={() => handleOrdenar('costo')}
                  >
                    COSTO
                    {ordenamiento.campo === 'costo' && (
                      <span className="sort-indicator">
                        {ordenamiento.direccion === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${ordenamiento.campo === 'tiempo_estimado' ? ordenamiento.direccion : ''}`}
                    onClick={() => handleOrdenar('tiempo_estimado')}
                  >
                    TIEMPO ESTIMADO
                    {ordenamiento.campo === 'tiempo_estimado' && (
                      <span className="sort-indicator">
                        {ordenamiento.direccion === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${ordenamiento.campo === 'id_servicio' ? ordenamiento.direccion : ''}`}
                    onClick={() => handleOrdenar('id_servicio')}
                  >
                    ID
                    {ordenamiento.campo === 'id_servicio' && (
                      <span className="sort-indicator">
                        {ordenamiento.direccion === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>ACCIONES</th>
                </tr>
              </thead>
              <tbody>
                {serviciosOrdenados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      <div className="empty-state">
                        <span className="empty-state-icon">📋</span>
                        <div>No hay servicios registrados.</div>
                        <small>Haz clic en "Agregar Servicio" para comenzar.</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  serviciosOrdenados.map((servicio, index) => (
                    <motion.tr 
                      key={servicio.id_servicio || index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.02 }}
                      whileHover={{ backgroundColor: '#f8f9fa' }}
                    >
                      <td className="titulo-cell">
                        <strong>{servicio.titulo || 'Sin título'}</strong>
                      </td>
                      <td className="categoria-cell">
                        <span className="categoria-badge">
                          {servicio.categoria || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="costo-cell">
                        <strong className="price-table">
                          {typeof servicio.costo === 'number' ? 
                            `$${Number(servicio.costo).toLocaleString('es-CO')}` : 
                            'No definido'
                          }
                        </strong>
                      </td>
                      <td className="tiempo-cell">
                        <span className="tiempo-badge">
                          {servicio.tiempo_estimado ? 
                            `${servicio.tiempo_estimado} h` : 
                            'No definido'
                          }
                        </span>
                      </td>
                      <td className="id-cell">
                        <code className="id-code">
                          {servicio.id_servicio || 'Sin ID'}
                        </code>
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <motion.button 
                            onClick={() => handleVer(servicio)} 
                            className="btn-action-table btn-view"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Ver detalles"
                          >
                            👁️
                          </motion.button>
                          <motion.button 
                            onClick={() => handleEditar(servicio)} 
                            className="btn-action-table btn-edit"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Editar servicio"
                          >
                            ✏️
                          </motion.button>
                          <motion.button 
                            onClick={() => handleEliminar(servicio)} 
                            className="btn-action-table btn-delete"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Eliminar servicio"
                          >
                            🗑️
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>

      {/* Modales */}
      <ServicioFormModal open={showModal} onClose={() => setShowModal(false)} onSuccess={fetchServicios} initialData={modalData} />
      <ServicioDetailModal open={showDetail} servicio={detailData} onClose={() => setShowDetail(false)} />
      <ConfirmDeleteModal open={showDelete} servicio={deleteData} onClose={() => setShowDelete(false)} onConfirm={handleDeleteConfirm} />
    </div>
  );
}

export default ServiciosList;
