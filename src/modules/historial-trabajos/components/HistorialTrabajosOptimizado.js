import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';
import { THEME_COLORS } from '../../../shared/constants';

const HistorialTrabajosOptimizado = () => {
  const [remisiones, setRemisiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
    tecnico: '',
    movil: ''
  });
  const [tipoVista, setTipoVista] = useState('tarjetas'); // 'tarjetas' o 'tabla'
  const [paginaActual, setPaginaActual] = useState(1);
  const [error, setError] = useState('');

  const ITEMS_POR_PAGINA = 10;

  // Función para formatear fechas
  const formatearFecha = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const fecha = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return fecha.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para obtener estado con color
  const obtenerEstadoConColor = (estado) => {
    const estadosColor = {
      'RADICADO': { color: 'bg-green-100 text-green-800', icono: '✅' },
      'PENDIENTE': { color: 'bg-yellow-100 text-yellow-800', icono: '⏳' },
      'EN_PROCESO': { color: 'bg-blue-100 text-blue-800', icono: '🔄' },
      'COMPLETADO': { color: 'bg-purple-100 text-purple-800', icono: '🎯' },
      'CANCELADO': { color: 'bg-red-100 text-red-800', icono: '❌' }
    };
    
    const estadoUpper = estado?.toUpperCase() || 'PENDIENTE';
    return estadosColor[estadoUpper] || estadosColor.PENDIENTE;
  };

  // Función para obtener servicios como array
  const obtenerServicios = (remision) => {
    const servicios = [];
    for (let i = 1; i <= 5; i++) {
      const servicio = remision[`servicio${i}`];
      if (servicio && servicio.trim()) {
        servicios.push(servicio);
      }
    }
    return servicios;
  };

  // Función para obtener técnicos como array
  const obtenerTecnicos = (remision) => {
    const tecnicos = [];
    for (let i = 1; i <= 3; i++) {
      const tecnico = remision[`tecnico${i}`];
      if (tecnico && tecnico.trim()) {
        tecnicos.push(tecnico);
      }
    }
    return tecnicos;
  };

  // Cargar remisiones
  const cargarRemisiones = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Construir query base
      let queryRef = collection(db, 'remisiones');
      
      // Aplicar filtros específicos si existen
      if (filtros.estado) {
        queryRef = query(queryRef, where('estado', '==', filtros.estado));
      }
      
      if (filtros.movil) {
        queryRef = query(queryRef, where('movil', '==', parseInt(filtros.movil)));
      }

      // Ordenar por fecha de remisión descendente
      queryRef = query(queryRef, orderBy('fecha_remision', 'desc'), limit(100));
      
      const querySnapshot = await getDocs(queryRef);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setRemisiones(data);
      console.log(`📊 Cargadas ${data.length} remisiones`);
      
    } catch (error) {
      console.error('❌ Error al cargar remisiones:', error);
      setError('Error al cargar los datos. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [filtros.estado, filtros.movil]);

  // Efecto para cargar datos inicial
  useEffect(() => {
    cargarRemisiones();
  }, [cargarRemisiones]);

  // Filtrar remisiones en el frontend
  const remisionesFiltradas = useMemo(() => {
    return remisiones.filter(remision => {
      // Filtro de búsqueda general
      if (filtros.busqueda) {
        const busquedaLower = filtros.busqueda.toLowerCase();
        const campos = [
          remision.remision?.toString(),
          remision.movil?.toString(),
          remision.autorizo,
          remision.carroceria,
          remision.genero,
          remision.no_orden,
          remision.une,
          ...obtenerTecnicos(remision),
          ...obtenerServicios(remision)
        ];
        
        const coincide = campos.some(campo => 
          campo?.toString().toLowerCase().includes(busquedaLower)
        );
        
        if (!coincide) return false;
      }

      // Filtro de técnico
      if (filtros.tecnico) {
        const tecnicos = obtenerTecnicos(remision);
        const coincideTecnico = tecnicos.some(tecnico =>
          tecnico.toLowerCase().includes(filtros.tecnico.toLowerCase())
        );
        if (!coincideTecnico) return false;
      }

      // Filtro de fecha desde
      if (filtros.fechaDesde) {
        const fechaRemision = remision.fecha_remision?.toDate?.() || new Date(remision.fecha_remision);
        const fechaDesde = new Date(filtros.fechaDesde);
        if (fechaRemision < fechaDesde) return false;
      }

      // Filtro de fecha hasta
      if (filtros.fechaHasta) {
        const fechaRemision = remision.fecha_remision?.toDate?.() || new Date(remision.fecha_remision);
        const fechaHasta = new Date(filtros.fechaHasta);
        fechaHasta.setHours(23, 59, 59); // Incluir todo el día
        if (fechaRemision > fechaHasta) return false;
      }

      return true;
    });
  }, [remisiones, filtros]);

  // Paginación
  const totalPaginas = Math.ceil(remisionesFiltradas.length / ITEMS_POR_PAGINA);
  const remisionesPaginadas = remisionesFiltradas.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  );

  // Manejador de cambio de filtros
  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
    setPaginaActual(1); // Resetear a la primera página
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estado: '',
      fechaDesde: '',
      fechaHasta: '',
      tecnico: '',
      movil: ''
    });
    setPaginaActual(1);
  };

  // Componente de tarjeta de remisión
  const TarjetaRemision = ({ remision }) => {
    const estadoInfo = obtenerEstadoConColor(remision.estado);
    const servicios = obtenerServicios(remision);
    const tecnicos = obtenerTecnicos(remision);

    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Remisión #{remision.remision}
            </h3>
            <p className="text-sm text-gray-600">Móvil: {remision.movil}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${estadoInfo.color}`}>
            {estadoInfo.icono} {remision.estado || 'PENDIENTE'}
          </span>
        </div>

        {/* Información principal */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha Remisión</p>
            <p className="text-sm font-medium">{formatearFecha(remision.fecha_remision)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-sm font-medium text-green-600">
              ${remision.total?.toLocaleString('es-CO') || '0'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Carrocería</p>
            <p className="text-sm">{remision.carroceria || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">UNE</p>
            <p className="text-sm">{remision.une || 'N/A'}</p>
          </div>
        </div>

        {/* Técnicos */}
        {tecnicos.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Técnicos</p>
            <div className="flex flex-wrap gap-2">
              {tecnicos.map((tecnico, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {tecnico}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Servicios */}
        {servicios.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Servicios</p>
            <div className="space-y-1">
              {servicios.slice(0, 2).map((servicio, index) => (
                <p key={index} className="text-xs text-gray-700 line-clamp-1">
                  • {servicio}
                </p>
              ))}
              {servicios.length > 2 && (
                <p className="text-xs text-gray-500">+{servicios.length - 2} servicios más</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 Historial de Trabajos
        </h1>
        <p className="text-gray-600">
          Gestión y búsqueda de remisiones de trabajo
        </p>
      </div>

      {/* Panel de filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          {/* Búsqueda general */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Búsqueda General
            </label>
            <input
              type="text"
              placeholder="Remisión, móvil, técnico..."
              value={filtros.busqueda}
              onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Móvil específico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Móvil
            </label>
            <input
              type="number"
              placeholder="Ej: 4097"
              value={filtros.movil}
              onChange={(e) => handleFiltroChange('movil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filtros.estado}
              onChange={(e) => handleFiltroChange('estado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="RADICADO">Radicado</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="COMPLETADO">Completado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
          </div>

          {/* Fecha desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <input
              type="date"
              value={filtros.fechaDesde}
              onChange={(e) => handleFiltroChange('fechaDesde', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <input
              type="date"
              value={filtros.fechaHasta}
              onChange={(e) => handleFiltroChange('fechaHasta', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Técnico y botones */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Técnico
            </label>
            <input
              type="text"
              placeholder="Nombre del técnico..."
              value={filtros.tecnico}
              onChange={(e) => handleFiltroChange('tecnico', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={limpiarFiltros}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              🗑️ Limpiar
            </button>
            <button
              onClick={cargarRemisiones}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄' : '🔍'} {loading ? 'Cargando...' : 'Recargar'}
            </button>
          </div>
        </div>
      </div>

      {/* Controles de vista */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {remisionesFiltradas.length} remisiones encontradas
          </span>
          
          {/* Toggle vista */}
          <div className="flex bg-gray-200 rounded-md">
            <button
              onClick={() => setTipoVista('tarjetas')}
              className={`px-3 py-1 rounded-md text-sm ${
                tipoVista === 'tarjetas' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🔲 Tarjetas
            </button>
            <button
              onClick={() => setTipoVista('tabla')}
              className={`px-3 py-1 rounded-md text-sm ${
                tipoVista === 'tabla' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📊 Tabla
            </button>
          </div>
        </div>

        {/* Paginación info */}
        {totalPaginas > 1 && (
          <span className="text-sm text-gray-600">
            Página {paginaActual} de {totalPaginas}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          ❌ {error}
        </div>
      )}

      {/* Contenido principal */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Cargando remisiones...</p>
        </div>
      ) : remisionesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">
            📭 No se encontraron remisiones con los filtros aplicados
          </p>
          <button
            onClick={limpiarFiltros}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Ver todas las remisiones
          </button>
        </div>
      ) : tipoVista === 'tarjetas' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remisionesPaginadas.map(remision => (
            <TarjetaRemision key={remision.id} remision={remision} />
          ))}
        </div>
      ) : (
        // Vista de tabla (implementar si es necesario)
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-medium">Vista de tabla</h3>
            <p className="text-sm text-gray-600">Funcionalidad en desarrollo</p>
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <button
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Anterior
            </button>
            
            {[...Array(totalPaginas)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setPaginaActual(index + 1)}
                className={`px-3 py-2 border rounded-md ${
                  paginaActual === index + 1
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-2 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialTrabajosOptimizado;
