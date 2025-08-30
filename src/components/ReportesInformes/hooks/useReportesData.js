import { useState, useEffect, useMemo, useCallback } from 'react';
import { remisionesService } from '../../../services/remisionesService';

export const useReportesData = () => {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    tecnico: '',
    movil: '',
    fechaDesde: '',
    fechaHasta: '',
    busqueda: ''
  });
  
  // Cargar datos iniciales
  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      
      console.log('🔄 Cargando datos de reportes...');
      const remisiones = await remisionesService.obtenerRemisiones(1000);
      
      // Procesar y limpiar datos
      const datosLimpios = remisiones.map(remision => ({
        ...remision,
        total: parseFloat(remision.total) || 0,
        subtotal: parseFloat(remision.subtotal) || 0,
        fecha: remision.fecha_remision || remision.fecha,
        fechaTexto: remisionesService.formatearFecha(remision.fecha_remision || remision.fecha)
      }));
      
      setDatos(datosLimpios);
      console.log(`✅ ${datosLimpios.length} remisiones cargadas`);
      
    } catch (err) {
      console.error('❌ Error al cargar datos:', err);
      setError('Error al cargar los datos de reportes');
    } finally {
      setCargando(false);
    }
  }, []);

  // Datos filtrados
  const datosFiltrados = useMemo(() => {
    let resultado = [...datos];

    // Filtro por técnico
    if (filtros.tecnico) {
      resultado = resultado.filter(item => 
        item.tecnico && item.tecnico.toLowerCase().includes(filtros.tecnico.toLowerCase())
      );
    }

    // Filtro por móvil
    if (filtros.movil) {
      resultado = resultado.filter(item => 
        item.movil && item.movil.toLowerCase().includes(filtros.movil.toLowerCase())
      );
    }

    // Filtro por búsqueda general
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      resultado = resultado.filter(item => 
        (item.remision && item.remision.toString().toLowerCase().includes(busqueda)) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(busqueda)) ||
        (item.tecnico && item.tecnico.toLowerCase().includes(busqueda)) ||
        (item.movil && item.movil.toLowerCase().includes(busqueda)) ||
        (item.autorizo && item.autorizo.toLowerCase().includes(busqueda))
      );
    }

    // Filtro por fecha
    if (filtros.fechaDesde && filtros.fechaHasta) {
      const fechaDesde = new Date(filtros.fechaDesde);
      const fechaHasta = new Date(filtros.fechaHasta);
      
      resultado = resultado.filter(item => {
        if (!item.fecha) return false;
        
        let fechaItem;
        if (item.fecha.toDate) {
          fechaItem = item.fecha.toDate();
        } else if (typeof item.fecha === 'string') {
          fechaItem = new Date(item.fecha);
        } else {
          fechaItem = new Date(item.fecha);
        }
        
        return fechaItem >= fechaDesde && fechaItem <= fechaHasta;
      });
    }

    return resultado;
  }, [datos, filtros]);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const total = datosFiltrados.length;
    const valorTotal = datosFiltrados.reduce((sum, item) => sum + (item.total || 0), 0);
    const valorPromedio = total > 0 ? valorTotal / total : 0;
    
    // Técnicos únicos
    const tecnicos = new Set(datosFiltrados.map(item => item.tecnico).filter(Boolean));
    
    // Móviles únicos
    const moviles = new Set(datosFiltrados.map(item => item.movil).filter(Boolean));
    
    // Remisión más reciente
    const remisionReciente = datosFiltrados
      .sort((a, b) => {
        const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha || 0);
        const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha || 0);
        return fechaB - fechaA;
      })[0];

    return {
      totalRemisiones: total,
      valorTotal: valorTotal,
      valorPromedio: valorPromedio,
      totalTecnicos: tecnicos.size,
      totalMoviles: moviles.size,
      remisionReciente: remisionReciente?.remision || 'N/A',
      fechaReciente: remisionReciente?.fechaTexto || 'N/A'
    };
  }, [datosFiltrados]);

  // Datos para gráficos
  const datosGraficos = useMemo(() => {
    // Agrupar por técnico
    const porTecnico = {};
    datosFiltrados.forEach(item => {
      const tecnico = item.tecnico || 'Sin asignar';
      if (!porTecnico[tecnico]) {
        porTecnico[tecnico] = { count: 0, valor: 0 };
      }
      porTecnico[tecnico].count++;
      porTecnico[tecnico].valor += item.total || 0;
    });

    // Agrupar por móvil
    const porMovil = {};
    datosFiltrados.forEach(item => {
      const movil = item.movil || 'Sin móvil';
      if (!porMovil[movil]) {
        porMovil[movil] = { count: 0, valor: 0 };
      }
      porMovil[movil].count++;
      porMovil[movil].valor += item.total || 0;
    });

    // Agrupar por mes (últimos 6 meses)
    const porMes = {};
    datosFiltrados.forEach(item => {
      if (item.fecha) {
        const fecha = item.fecha.toDate ? item.fecha.toDate() : new Date(item.fecha);
        const mes = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
        if (!porMes[mes]) {
          porMes[mes] = { count: 0, valor: 0 };
        }
        porMes[mes].count++;
        porMes[mes].valor += item.total || 0;
      }
    });

    return {
      porTecnico: Object.entries(porTecnico)
        .map(([nombre, datos]) => ({ nombre, ...datos }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      porMovil: Object.entries(porMovil)
        .map(([nombre, datos]) => ({ nombre, ...datos }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      porMes: Object.entries(porMes)
        .map(([nombre, datos]) => ({ nombre, ...datos }))
        .sort((a, b) => new Date(a.nombre) - new Date(b.nombre))
        .slice(-6)
    };
  }, [datosFiltrados]);

  // Funciones para filtros
  const actualizarFiltro = useCallback((campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltros({
      tecnico: '',
      movil: '',
      fechaDesde: '',
      fechaHasta: '',
      busqueda: ''
    });
  }, []);

  // Obtener listas para filtros
  const [opcionesFiltros, setOpcionesFiltros] = useState({
    tecnicos: [],
    moviles: []
  });

  const cargarOpcionesFiltros = useCallback(async () => {
    try {
      const [tecnicos, moviles] = await Promise.all([
        remisionesService.obtenerTecnicos(),
        remisionesService.obtenerMoviles()
      ]);

      setOpcionesFiltros({
        tecnicos,
        moviles
      });
    } catch (err) {
      console.error('❌ Error al cargar opciones de filtros:', err);
    }
  }, []);

  // Función para exportar datos
  const exportarDatos = useCallback((formato = 'csv') => {
    if (formato === 'csv') {
      const headers = [
        'Remisión', 'Fecha', 'Técnico', 'Móvil', 'Descripción', 
        'Autorizo', 'Subtotal', 'Total'
      ];
      
      const csvContent = [
        headers.join(','),
        ...datosFiltrados.map(item => [
          item.remision || '',
          item.fechaTexto || '',
          item.tecnico || '',
          item.movil || '',
          `"${(item.descripcion || '').replace(/"/g, '""')}"`,
          item.autorizo || '',
          item.subtotal || 0,
          item.total || 0
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reportes_remisiones_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [datosFiltrados]);

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
    cargarOpcionesFiltros();
  }, [cargarDatos, cargarOpcionesFiltros]);

  return {
    datos: datosFiltrados,
    datosOriginales: datos,
    cargando,
    error,
    filtros,
    metricas,
    datosGraficos,
    opcionesFiltros,
    actualizarFiltro,
    limpiarFiltros,
    cargarDatos,
    exportarDatos
  };
};
