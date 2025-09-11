import React, { useState, useEffect } from 'react';

import { getServicios, updateServicio, addServicio, deleteServicio } from '../services/serviciosService';
// import ServicioCard from './ServicioCard';
import FiltrosServicios from './FiltrosServicios';
import ServicioFormModal from './ServicioFormModal';
import ServicioDetailModal from './ServicioDetailModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { motion } from 'framer-motion';


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

  const fetchServicios = () => {
    setLoading(true);
    getServicios(filtros)
      .then(data => {
        // Ordenar por título alfabéticamente
        setServicios(data.sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '')));
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServicios();
    // eslint-disable-next-line
  }, [filtros]);

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <FiltrosServicios onChange={setFiltros} />
        <button
          onClick={() => { setShowModal(true); setModalData(null); }}
          style={{ background: '#5DADE2', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,123,255,0.10)', marginLeft: 16 }}
        >
          + Agregar servicio
        </button>
      </div>
      <ServicioFormModal open={showModal} onClose={() => setShowModal(false)} onSuccess={fetchServicios} initialData={modalData} />
      <ServicioDetailModal open={showDetail} servicio={detailData} onClose={() => setShowDetail(false)} />
      <ConfirmDeleteModal open={showDelete} servicio={deleteData} onClose={() => setShowDelete(false)} onConfirm={handleDeleteConfirm} />
      {loading && <div style={{ color: '#5DADE2', margin: 24 }}>Cargando servicios...</div>}
      {error && <div style={{ color: '#E74C3C', margin: 24 }}>Error: {error.message || error.toString()}</div>}
      <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }} style={{ marginTop: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', fontFamily: 'Poppins, Roboto, sans-serif', fontSize: 15, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#F8F9FA', color: '#5DADE2' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left', cursor: 'pointer' }}>Título</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Categoría</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Costo</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Tiempo estimado</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '12px 8px', textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && servicios.length === 0 && (
              <tr><td colSpan={6} style={{ color: '#2C3E50', padding: 24, textAlign: 'center' }}>No hay servicios registrados.</td></tr>
            )}
            {servicios.map((servicio, idx) => (
              <motion.tr key={servicio.id_servicio || idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: idx * 0.02 }} style={{ borderBottom: '1px solid #F0F0F0', cursor: 'pointer' }} whileHover={{ backgroundColor: '#f8f9fa' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600, color: '#34495E' }}>{servicio.titulo || '-'}</td>
                <td style={{ padding: '10px 8px' }}>{servicio.categoria || '-'}</td>
                <td style={{ padding: '10px 8px' }}>{typeof servicio.costo === 'number' ? `$${Number(servicio.costo).toLocaleString('es-CO')}` : '-'}</td>
                <td style={{ padding: '10px 8px' }}>{servicio.tiempo_estimado ? `${servicio.tiempo_estimado} h` : '-'}</td>
                <td style={{ padding: '10px 8px', color: '#888' }}>{servicio.id_servicio || '-'}</td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <button onClick={() => handleVer(servicio)} style={btnActionStyle}>Ver</button>
                  <button onClick={() => handleEditar(servicio)} style={{ ...btnActionStyle, background: '#F1C40F', color: '#2C3E50' }}>Editar</button>
                  <button onClick={() => handleEliminar(servicio)} style={{ ...btnActionStyle, background: '#E74C3C' }}>Eliminar</button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

const btnActionStyle = {
  background: '#5DADE2',
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '6px 14px',
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
  marginRight: 6,
  boxShadow: '0 1px 2px rgba(0,123,255,0.08)',
  transition: 'transform 0.2s',
};

export default ServiciosList;
