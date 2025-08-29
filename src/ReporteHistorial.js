import React, { useState, useEffect, useCallback, memo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useRole } from './RoleContext';
import { logger } from './utils/logger';
import './ReporteHistorial.css';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement,
  PointElement,
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

// Función para normalizar nombres de técnicos
function normalizarNombreTecnico(nombre) {
  if (!nombre) return '';
  let nombreLimpio = nombre.toString().toUpperCase().trim();
  nombreLimpio = nombreLimpio
    .replace(/\s*[-–—]\s*/g, ' - ')
    .replace(/\s*[yY&]\s*/g, ' Y ')
    .replace(/\s+/g, ' ')
    .trim();
  return nombreLimpio;
}

// Función para verificar si un técnico coincide con un nombre de búsqueda
function coincideTecnico(nombreBD, nombreBusqueda) {
  if (!nombreBD || !nombreBusqueda) return false;
  const nombreBDNormalizado = normalizarNombreTecnico(nombreBD);
  const nombreBusquedaNormalizado = normalizarNombreTecnico(nombreBusqueda);

  if (nombreBDNormalizado === nombreBusquedaNormalizado) return true;
  if (nombreBDNormalizado.includes(nombreBusquedaNormalizado)) return true;

  const partesBusqueda = nombreBusquedaNormalizado.split(/[\s\-Y&]+/).filter(p => p.length > 0);
  const partesBD = nombreBDNormalizado.split(/[\s\-Y&]+/).filter(p => p.length > 0);

  return partesBusqueda.some(parteBusqueda => 
    parteBusqueda.length > 2 && 
    partesBD.some(parteBD => 
      parteBD.includes(parteBusqueda) || parteBusqueda.includes(parteBD)
    )
  );
}

// Función para agrupar técnicos similares
function agruparTecnicosSimilares(tecnicos) {
  const grupos = [];
  const procesados = new Set();

  tecnicos.forEach(tecnico => {
    if (procesados.has(tecnico)) return;

    const grupo = [tecnico];
    procesados.add(tecnico);

    tecnicos.forEach(otroTecnico => {
      if (otroTecnico !== tecnico && !procesados.has(otroTecnico)) {
        if (coincideTecnico(tecnico, otroTecnico) || coincideTecnico(otroTecnico, tecnico)) {
          grupo.push(otroTecnico);
          procesados.add(otroTecnico);
        }
      }
    });

    grupos.push(grupo);
  });

  return grupos;
}

// Función para convertir diferentes formatos de fecha a objeto Date válido
function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  if (typeof fechaStr === 'object' && fechaStr.seconds) {
    return new Date(fechaStr.seconds * 1000);
  }
  if (typeof fechaStr === 'string') {
    const delimitador = fechaStr.includes('/') ? '/' : '-';
    const partes = fechaStr.split(delimitador);
    if (partes.length !== 3) return null;
    let dd, mm, yyyy;
    if (delimitador === '/') {
      [dd, mm, yyyy] = partes;
    } else {
      [yyyy, mm, dd] = partes;
    }
    const fechaISO = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    const fecha = new Date(fechaISO);
    if (isNaN(fecha.getTime())) {
      console.warn('⚠️ Fecha inválida detectada:', fechaStr);
      return null;
    }
    return fecha;
  }
  return null;
}

function ReporteHistorial() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [tecnicos, setTecnicos] = useState([]);
  const [todosTecnicos, setTodosTecnicos] = useState([]);
  const [reporte, setReporte] = useState(null);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const [tipoGrafico, setTipoGrafico] = useState('bar');
  const [vistaPorTecnico, setVistaPorTecnico] = useState(false);
  const [mostrarTabla, setMostrarTabla] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina] = useState(10);

  const { 
    userRole, 
    userPermissions, 
    currentEmployee,
  } = useRole() || {};

  const canExportReports = userPermissions?.canExportReportes || false;
  const canAccessAllTechnicians = userPermissions?.canAccessAllTechnicians || false;
  const currentTechnicianName = currentEmployee?.nombre || '';

  // Variables computadas para paginación
  const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = indiceInicio + registrosPorPagina;
  const registrosActuales = datosFiltrados.slice(indiceInicio, indiceFin);

  const configurarFechasIniciales = useCallback(() => {
    const hoy = new Date();
    // Configurar desde hace 6 meses para permitir más rango
    const fechaDesde = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
    setDesde(fechaDesde.toISOString().split('T')[0]);
    setHasta(hoy.toISOString().split('T')[0]);
  }, []);

  const cargarTecnicos = useCallback(async () => {
    try {
      const ref = collection(db, 'remisiones');
      const snapshot = await getDocs(ref);
      let tecnicosRaw = snapshot.docs.map(doc => doc.data().tecnico).filter(Boolean);

      const gruposTecnicos = agruparTecnicosSimilares(tecnicosRaw);

      let tecnicosUnicos = gruposTecnicos.map(grupo => {
        const conteo = {};
        grupo.forEach(nombre => {
          const normalizado = normalizarNombreTecnico(nombre);
          conteo[normalizado] = (conteo[normalizado] || 0) + 1;
        });
        const nombreRepresentativo = Object.entries(conteo)
          .sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            return a[0].length - b[0].length;
          })[0][0];
        return nombreRepresentativo;
      }).sort();

      if (userRole === 'tecnico' && !canAccessAllTechnicians && currentTechnicianName) {
        tecnicosUnicos = tecnicosUnicos.filter(tecnico => 
          coincideTecnico(tecnico, currentTechnicianName)
        );
      }

      setTodosTecnicos(tecnicosUnicos);
    } catch (error) {
      console.error('Error al cargar técnicos:', error);
    }
  }, [userRole, canAccessAllTechnicians, currentTechnicianName]);

  const configurarTecnicoInicial = useCallback(() => {
    if (userRole === 'tecnico' && currentTechnicianName && !canAccessAllTechnicians) {
      const tecnicoCoincidente = todosTecnicos.find(tecnico => 
        coincideTecnico(tecnico, currentTechnicianName)
      );
      if (tecnicoCoincidente) {
        setTecnicos([tecnicoCoincidente]);
      }
    }
  }, [userRole, currentTechnicianName, canAccessAllTechnicians, todosTecnicos]);

  useEffect(() => {
    cargarTecnicos();
    configurarFechasIniciales();
    configurarTecnicoInicial();
  }, [cargarTecnicos, configurarFechasIniciales, configurarTecnicoInicial]);

  const generarDatosPorFecha = (datos) => {
    const agrupados = {};
    datos.forEach(doc => {
      const fecha = doc.__fechaObjeto;
      const dia = fecha ? fecha.toLocaleDateString() : 'Sin fecha';
      let valor = doc.total ?? 0;
      if (typeof valor === 'string') valor = valor.replace(/[^\d.]/g, '');
      valor = parseFloat(valor || 0);
      if (isNaN(valor)) valor = 0;
      agrupados[dia] = (agrupados[dia] || 0) + valor;
    });

    return Object.entries(agrupados)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
  };

  const generarDatosPorTecnico = (datos) => {
    const agrupados = {};
    datos.forEach(doc => {
      const tecnicoOriginal = doc.tecnico || 'Sin asignar';
      let tecnicoGrupo = tecnicoOriginal;
      Object.keys(agrupados).forEach(tecnicoExistente => {
        if (coincideTecnico(tecnicoOriginal, tecnicoExistente)) {
          tecnicoGrupo = tecnicoExistente;
        }
      });
      if (tecnicoGrupo === tecnicoOriginal && tecnicoOriginal !== 'Sin asignar') {
        tecnicoGrupo = normalizarNombreTecnico(tecnicoOriginal);
      }
      let valor = doc.total ?? 0;
      if (typeof valor === 'string') valor = valor.replace(/[^\d.]/g, '');
      valor = parseFloat(valor || 0);
      if (isNaN(valor)) valor = 0;
      agrupados[tecnicoGrupo] = (agrupados[tecnicoGrupo] || 0) + valor;
    });

    return Object.entries(agrupados)
      .map(([tecnico, total]) => ({ fecha: tecnico, total }))
      .sort((a, b) => b.total - a.total);
  };

  const generarReporte = async () => {
    if (!desde || !hasta) {
      setMensaje('⚠️ Por favor selecciona las fechas de inicio y fin');
      return;
    }

    setLoading(true);
    setMensaje('');

    try {
      const ref = collection(db, 'remisiones');
      const snapshot = await getDocs(ref);

      let datosFiltradosLocal = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const desdeDate = new Date(desde);
      const hastaDate = new Date(hasta);
      hastaDate.setHours(23, 59, 59, 999);

      datosFiltradosLocal = datosFiltradosLocal.filter(doc => {
        const fecha = parseFecha(doc.fecha_remision);
        if (!fecha) return false;
        doc.__fechaObjeto = fecha;
        return fecha >= desdeDate && fecha <= hastaDate;
      });

      if (tecnicos.length > 0) {
        datosFiltradosLocal = datosFiltradosLocal.filter(doc => 
          tecnicos.some(tecnicoSeleccionado => coincideTecnico(doc.tecnico, tecnicoSeleccionado))
        );
      } else if (userRole === 'tecnico' && !canAccessAllTechnicians && currentTechnicianName) {
        datosFiltradosLocal = datosFiltradosLocal.filter(doc => 
          coincideTecnico(doc.tecnico, currentTechnicianName)
        );
      }

      const datosParaGrafico = vistaPorTecnico 
        ? generarDatosPorTecnico(datosFiltradosLocal)
        : generarDatosPorFecha(datosFiltradosLocal);

      const totalGeneral = datosFiltradosLocal.reduce((sum, doc) => {
        let valor = doc.total ?? 0;
        if (typeof valor === 'string') valor = valor.replace(/[^\d.]/g, '');
        return sum + parseFloat(valor || 0);
      }, 0);

      const promedioSemanal = totalGeneral / Math.max(1, 
        Math.ceil((new Date(hasta) - new Date(desde)) / (7 * 24 * 60 * 60 * 1000))
      );

      setReporte({
        totalGeneral,
        promedioSemanal,
        cantidadTrabajos: datosFiltradosLocal.length,
        desde: desdeDate.toLocaleDateString(),
        hasta: hastaDate.toLocaleDateString(),
        tecnicosInvolucrados: [...new Set(datosFiltradosLocal.map(doc => doc.tecnico).filter(Boolean))].length
      });

      setDatosGrafico(datosParaGrafico);
      setDatosFiltrados(datosFiltradosLocal);
      setPaginaActual(1);

    } catch (error) {
      console.error('Error al generar el reporte:', error);
      setMensaje('❌ Ocurrió un error al generar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const exportarACSV = () => {
    const headers = ['N° Remisión', 'Fecha', 'Técnico', 'Total'];
    const rows = datosFiltrados.map(doc => [
      doc.remision || '',
      doc.__fechaObjeto ? doc.__fechaObjeto.toLocaleDateString() : doc.fecha_remision || '',
      doc.tecnico || '',
      doc.total || 0
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_historial_${desde}_${hasta}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const configurarGrafico = () => {
    const colores = [
      '#1976d2', '#dc004e', '#388e3c', '#f57c00', 
      '#7b1fa2', '#0288d1', '#d32f2f', '#689f38'
    ];

    const baseConfig = {
      labels: datosGrafico.map(d => d.fecha),
      datasets: [
        {
          label: vistaPorTecnico ? 'Total por Técnico' : 'Total por Día',
          data: datosGrafico.map(d => d.total),
          backgroundColor: tipoGrafico === 'doughnut' 
            ? colores.slice(0, datosGrafico.length)
            : '#1976d2',
          borderColor: '#1976d2',
          borderWidth: 2,
          tension: 0.4
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: tipoGrafico === 'doughnut',
          position: 'right'
        },
        title: { 
          display: true,
          text: vistaPorTecnico ? 'Ingresos por Técnico' : 'Ingresos por Fecha',
          font: { size: 16, weight: 'bold' }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: $${context.parsed.y?.toLocaleString() || context.parsed?.toLocaleString()}`;
            }
          }
        }
      },
      scales: tipoGrafico !== 'doughnut' ? {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        },
        x: {
          ticks: {
            maxRotation: 45
          }
        }
      } : {}
    };

    return { data: baseConfig, options };
  };

  const { data: chartData, options: chartOptions } = datosGrafico.length > 0 ? configurarGrafico() : { data: null, options: null };

  return (
    <div className="reporte-container" style={{ 
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        padding: '2rem',
        borderRadius: '12px',
        color: 'white',
        marginBottom: '2rem',
        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '2rem',
          fontWeight: '300',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📊 Informe de Remisiones
          {userRole === 'tecnico' && !canAccessAllTechnicians && (
            <span style={{ 
              fontSize: '0.8rem',
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              marginLeft: '1rem'
            }}>
              {currentTechnicianName}
            </span>
          )}
        </h1>
        <p style={{ 
          margin: '0.5rem 0 0 0', 
          opacity: 0.9,
          fontSize: '1.1rem'
        }}>
          {canAccessAllTechnicians 
            ? 'Análisis detallado de ingresos por fecha y técnico'
            : 'Análisis de tus trabajos realizados'
          }
        </p>
      </div>

      {/* Panel de Filtros */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ 
          margin: '0 0 1rem 0',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🎛️ Filtros y Configuración
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }} className="filter-controls">
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#555'
            }}>
              📅 Fecha Desde:
            </label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="filter-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#555'
            }}>
              📅 Fecha Hasta:
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="filter-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
          </div>
          
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: '#555'
            }}>
              👨‍🔧 Técnicos:
            </label>
            <select
              multiple
              value={tecnicos}
              onChange={e => setTecnicos(Array.from(e.target.selectedOptions, opt => opt.value))}
              disabled={userRole === 'tecnico' && !canAccessAllTechnicians}
              className="filter-input"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '1rem',
                minHeight: '100px',
                opacity: (userRole === 'tecnico' && !canAccessAllTechnicians) ? 0.6 : 1
              }}
            >
              {todosTecnicos.map((tec, idx) => (
                <option key={idx} value={tec}>{tec}</option>
              ))}
            </select>
            <small style={{ color: '#666', marginTop: '0.25rem', display: 'block' }}>
              {canAccessAllTechnicians 
                ? 'Mantén Ctrl para seleccionar múltiples'
                : userRole === 'tecnico' 
                  ? 'Solo puedes ver tus propios trabajos'
                  : 'Selecciona los técnicos a incluir'
              }
            </small>
          </div>
        </div>

        {/* Configuración de Vista */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          paddingTop: '1rem',
          borderTop: '1px solid #e0e0e0'
        }}>
          <div>
            <label style={{ marginRight: '0.5rem', fontWeight: '500' }}>
              📈 Tipo de Gráfico:
            </label>
            <select
              value={tipoGrafico}
              onChange={(e) => setTipoGrafico(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="bar">Barras</option>
              <option value="line">Líneas</option>
              <option value="doughnut">Circular</option>
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={vistaPorTecnico}
              onChange={(e) => setVistaPorTecnico(e.target.checked)}
            />
            📊 Agrupar por Técnico
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={mostrarTabla}
              onChange={(e) => setMostrarTabla(e.target.checked)}
            />
            📋 Mostrar Tabla
          </label>
        </div>

        {/* Botones de Acción */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: '500', color: '#555' }}>🗓️ Rangos rápidos:</span>
            <button
              onClick={() => {
                const hoy = new Date();
                const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                setDesde(primerDiaMes.toISOString().split('T')[0]);
                setHasta(hoy.toISOString().split('T')[0]);
              }}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Este mes
            </button>
            <button
              onClick={() => {
                const hoy = new Date();
                const hace3Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 3, 1);
                setDesde(hace3Meses.toISOString().split('T')[0]);
                setHasta(hoy.toISOString().split('T')[0]);
              }}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Últimos 3 meses
            </button>
            <button
              onClick={() => {
                const hoy = new Date();
                const hace6Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 6, 1);
                setDesde(hace6Meses.toISOString().split('T')[0]);
                setHasta(hoy.toISOString().split('T')[0]);
              }}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Últimos 6 meses
            </button>
            <button
              onClick={() => {
                const hoy = new Date();
                const eneroEsteAno = new Date(hoy.getFullYear(), 0, 1);
                setDesde(eneroEsteAno.toISOString().split('T')[0]);
                setHasta(hoy.toISOString().split('T')[0]);
              }}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Este año
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem'
        }}>
          <button
            onClick={generarReporte}
            disabled={loading}
            className={`report-button ${loading ? 'button-loading' : ''}`}
            style={{
              background: loading ? '#ccc' : 'linear-gradient(135deg, #1976d2, #1565c0)',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
              position: 'relative'
            }}
          >
            {loading ? '⏳' : '🚀'} {loading ? 'Generando...' : 'Generar Informe'}
          </button>

          {reporte && canExportReports && (
            <button
              onClick={exportarACSV}
              className="report-button"
              style={{
                background: 'linear-gradient(135deg, #388e3c, #2e7d32)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 8px rgba(56, 142, 60, 0.3)'
              }}
            >
              📥 Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Mensaje de Error */}
      {mensaje && (
        <div className="message-error" style={{
          backgroundColor: '#ffebee',
          color: '#c62828',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1rem',
          border: '1px solid #ef5350'
        }}>
          {mensaje}
        </div>
      )}

      {/* Resumen del Reporte */}
      {reporte && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ 
            margin: '0 0 1rem 0',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📈 Resumen del Período: {reporte.desde} al {reporte.hasta}
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div className="stats-card" style={{
              background: 'linear-gradient(135deg, #4caf50, #388e3c)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                ${reporte.totalGeneral.toLocaleString()}
              </div>
              <div>💰 Total General</div>
            </div>
            
            <div className="stats-card" style={{
              background: 'linear-gradient(135deg, #2196f3, #1976d2)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {reporte.cantidadTrabajos}
              </div>
              <div>📋 Trabajos Realizados</div>
            </div>
            
            <div className="stats-card" style={{
              background: 'linear-gradient(135deg, #ff9800, #f57c00)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                ${reporte.promedioSemanal.toLocaleString()}
              </div>
              <div>📊 Promedio Semanal</div>
            </div>
            
            <div className="stats-card" style={{
              background: 'linear-gradient(135deg, #9c27b0, #7b1fa2)',
              color: 'white',
              padding: '1rem',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                {reporte.tecnicosInvolucrados}
              </div>
              <div>👨‍🔧 Técnicos Activos</div>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico */}
      {chartData && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <div className="chart-container" style={{ height: '400px' }}>
            {tipoGrafico === 'bar' && <Bar data={chartData} options={chartOptions} />}
            {tipoGrafico === 'line' && <Line data={chartData} options={chartOptions} />}
            {tipoGrafico === 'doughnut' && <Doughnut data={chartData} options={chartOptions} />}
          </div>
        </div>
      )}

      {/* Tabla de Trabajos */}
      {mostrarTabla && datosFiltrados.length > 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ 
              margin: 0,
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📋 Detalle de Trabajos ({datosFiltrados.length} registros)
            </h3>
            
            {/* Paginación Info */}
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              Página {paginaActual} de {totalPaginas}
            </div>
          </div>

          {/* Tabla Responsiva */}
          <div style={{ overflowX: 'auto' }}>
            <table className="reports-table" style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #e0e0e0'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5' }}>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                    N° Remisión
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                    Fecha
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                    Técnico
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrosActuales.map((doc, idx) => (
                  <tr key={doc.id || idx} className="table-row-hover" style={{
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <td style={{ padding: '0.75rem' }}>
                      {doc.remision || '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      {doc.__fechaObjeto 
                        ? doc.__fechaObjeto.toLocaleDateString() 
                        : doc.fecha_remision || '-'}

                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        background: '#e3f2fd',
                        color: '#1976d2',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.9rem'
                      }}>
                        {doc.tecnico || 'Sin asignar'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '0.75rem', 
                      textAlign: 'right',
                      fontWeight: 'bold',
                      color: '#2e7d32'
                    }}>
                      ${parseFloat(doc.total || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Controles de Paginación */}
          {totalPaginas > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                className="pagination-button"
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: paginaActual === 1 ? '#f5f5f5' : 'white',
                  cursor: paginaActual === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Anterior
              </button>
              
              <span style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#1976d2',
                color: 'white',
                borderRadius: '4px'
              }}>
                {paginaActual}
              </span>
              
              <button
                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
                disabled={paginaActual === totalPaginas}
                className="pagination-button"
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: paginaActual === totalPaginas ? '#f5f5f5' : 'white',
                  cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer'
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(ReporteHistorial);
