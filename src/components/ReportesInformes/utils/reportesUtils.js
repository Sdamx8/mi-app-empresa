/**
 * 📊 UTILIDADES PARA REPORTES E INFORMES
 * Funciones de utilidad para formatear datos, calcular métricas y exportar reportes
 */

// Formatear moneda en pesos colombianos
export const formatearMoneda = (valor) => {
  if (typeof valor !== 'number' || isNaN(valor)) return '$0';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
};

// Formatear números con separadores de miles
export const formatearNumero = (numero) => {
  if (typeof numero !== 'number' || isNaN(numero)) return '0';
  
  return new Intl.NumberFormat('es-CO').format(numero);
};

// Formatear porcentajes
export const formatearPorcentaje = (valor, decimales = 1) => {
  if (typeof valor !== 'number' || isNaN(valor)) return '0%';
  
  return `${valor.toFixed(decimales)}%`;
};

// Formatear fechas de manera consistente
export const formatearFecha = (fecha, formato = 'completo') => {
  if (!fecha) return 'Sin fecha';
  
  let fechaObj;
  
  try {
    if (fecha.toDate) {
      fechaObj = fecha.toDate();
    } else if (typeof fecha === 'string') {
      fechaObj = new Date(fecha);
    } else {
      fechaObj = new Date(fecha);
    }
    
    if (isNaN(fechaObj.getTime())) return 'Fecha inválida';
    
    switch (formato) {
      case 'corto':
        return fechaObj.toLocaleDateString('es-CO');
      case 'medio':
        return fechaObj.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      case 'completo':
      default:
        return fechaObj.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
    }
  } catch (error) {
    console.warn('Error al formatear fecha:', error);
    return 'Fecha inválida';
  }
};

// Calcular estadísticas avanzadas
export const calcularEstadisticas = (datos) => {
  if (!Array.isArray(datos) || datos.length === 0) {
    return {
      total: 0,
      promedio: 0,
      mediana: 0,
      maximo: 0,
      minimo: 0,
      desviacionEstandar: 0,
      varianza: 0
    };
  }

  const valores = datos.map(item => item.total || 0).filter(val => !isNaN(val));
  
  if (valores.length === 0) {
    return {
      total: 0,
      promedio: 0,
      mediana: 0,
      maximo: 0,
      minimo: 0,
      desviacionEstandar: 0,
      varianza: 0
    };
  }

  const total = valores.reduce((sum, val) => sum + val, 0);
  const promedio = total / valores.length;
  
  // Calcular mediana
  const valoresOrdenados = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(valoresOrdenados.length / 2);
  const mediana = valoresOrdenados.length % 2 !== 0
    ? valoresOrdenados[medio]
    : (valoresOrdenados[medio - 1] + valoresOrdenados[medio]) / 2;

  const maximo = Math.max(...valores);
  const minimo = Math.min(...valores);

  // Calcular varianza y desviación estándar
  const varianza = valores.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / valores.length;
  const desviacionEstandar = Math.sqrt(varianza);

  return {
    total,
    promedio,
    mediana,
    maximo,
    minimo,
    desviacionEstandar,
    varianza
  };
};

// Agrupar datos por campo específico
export const agruparPor = (datos, campo) => {
  if (!Array.isArray(datos)) return {};
  
  return datos.reduce((grupos, item) => {
    const clave = item[campo] || 'Sin definir';
    if (!grupos[clave]) {
      grupos[clave] = [];
    }
    grupos[clave].push(item);
    return grupos;
  }, {});
};

// Generar resumen por período
export const generarResumenPorPeriodo = (datos, tipoPeriodo = 'mes') => {
  if (!Array.isArray(datos)) return [];

  const grupos = {};

  datos.forEach(item => {
    if (!item.fecha) return;

    let fecha;
    if (item.fecha.toDate) {
      fecha = item.fecha.toDate();
    } else {
      fecha = new Date(item.fecha);
    }

    if (isNaN(fecha.getTime())) return;

    let clave;
    switch (tipoPeriodo) {
      case 'dia':
        clave = fecha.toLocaleDateString('es-CO');
        break;
      case 'semana':
        const inicioSemana = new Date(fecha);
        inicioSemana.setDate(fecha.getDate() - fecha.getDay());
        clave = `Semana ${inicioSemana.toLocaleDateString('es-CO')}`;
        break;
      case 'mes':
      default:
        clave = fecha.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
        break;
      case 'año':
        clave = fecha.getFullYear().toString();
        break;
    }

    if (!grupos[clave]) {
      grupos[clave] = {
        periodo: clave,
        fecha: fecha,
        count: 0,
        valorTotal: 0,
        promedio: 0,
        items: []
      };
    }

    grupos[clave].count++;
    grupos[clave].valorTotal += item.total || 0;
    grupos[clave].items.push(item);
  });

  // Calcular promedios y ordenar por fecha
  return Object.values(grupos)
    .map(grupo => ({
      ...grupo,
      promedio: grupo.count > 0 ? grupo.valorTotal / grupo.count : 0
    }))
    .sort((a, b) => a.fecha - b.fecha);
};

// Obtener top N elementos
export const obtenerTop = (datos, campo, limite = 10, ordenPor = 'count') => {
  const grupos = agruparPor(datos, campo);
  
  return Object.entries(grupos)
    .map(([nombre, items]) => ({
      nombre,
      count: items.length,
      valorTotal: items.reduce((sum, item) => sum + (item.total || 0), 0),
      valorPromedio: items.length > 0 ? items.reduce((sum, item) => sum + (item.total || 0), 0) / items.length : 0,
      items
    }))
    .sort((a, b) => {
      switch (ordenPor) {
        case 'valor':
          return b.valorTotal - a.valorTotal;
        case 'promedio':
          return b.valorPromedio - a.valorPromedio;
        case 'count':
        default:
          return b.count - a.count;
      }
    })
    .slice(0, limite);
};

// Buscar anomalías en los datos
export const detectarAnomalias = (datos) => {
  if (!Array.isArray(datos) || datos.length === 0) return [];

  const estadisticas = calcularEstadisticas(datos);
  const umbralSuperior = estadisticas.promedio + (2 * estadisticas.desviacionEstandar);
  const umbralInferior = estadisticas.promedio - (2 * estadisticas.desviacionEstandar);

  return datos.filter(item => {
    const valor = item.total || 0;
    return valor > umbralSuperior || valor < umbralInferior;
  }).map(item => ({
    ...item,
    tipoAnomalia: (item.total || 0) > umbralSuperior ? 'superior' : 'inferior',
    desviacion: Math.abs((item.total || 0) - estadisticas.promedio)
  }));
};

// Exportar datos a diferentes formatos
export const exportarAFormato = (datos, formato = 'csv', nombre = 'reporte') => {
  if (!Array.isArray(datos) || datos.length === 0) {
    throw new Error('No hay datos para exportar');
  }

  const fechaHoy = new Date().toISOString().split('T')[0];
  
  switch (formato.toLowerCase()) {
    case 'csv':
      return exportarCSV(datos, `${nombre}_${fechaHoy}.csv`);
    case 'json':
      return exportarJSON(datos, `${nombre}_${fechaHoy}.json`);
    default:
      throw new Error(`Formato ${formato} no soportado`);
  }
};

// Exportar a CSV
const exportarCSV = (datos, nombreArchivo) => {
  const headers = [
    'Remisión', 'Fecha', 'Técnico', 'Móvil', 'Descripción', 
    'Autorizo', 'UNE', 'Subtotal', 'Total'
  ];
  
  const csvContent = [
    headers.join(','),
    ...datos.map(item => [
      item.remision || '',
      formatearFecha(item.fecha, 'corto'),
      item.tecnico || '',
      item.movil || '',
      `"${(item.descripcion || '').replace(/"/g, '""')}"`,
      item.autorizo || '',
      item.une || '',
      item.subtotal || 0,
      item.total || 0
    ].join(','))
  ].join('\n');

  descargarArchivo(csvContent, nombreArchivo, 'text/csv;charset=utf-8;');
};

// Exportar a JSON
const exportarJSON = (datos, nombreArchivo) => {
  const jsonContent = JSON.stringify(datos, null, 2);
  descargarArchivo(jsonContent, nombreArchivo, 'application/json;charset=utf-8;');
};

// Función auxiliar para descargar archivos
const descargarArchivo = (contenido, nombreArchivo, tipoMime) => {
  const blob = new Blob([contenido], { type: tipoMime });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', nombreArchivo);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Validar estructura de datos
export const validarDatos = (datos) => {
  if (!Array.isArray(datos)) {
    return { valido: false, error: 'Los datos deben ser un array' };
  }

  if (datos.length === 0) {
    return { valido: false, error: 'No hay datos para procesar' };
  }

  const camposRequeridos = ['remision', 'fecha', 'tecnico', 'movil'];
  const errores = [];

  datos.forEach((item, index) => {
    camposRequeridos.forEach(campo => {
      if (!item[campo]) {
        errores.push(`Elemento ${index + 1}: falta el campo '${campo}'`);
      }
    });

    if (item.total && (typeof item.total !== 'number' || isNaN(item.total))) {
      errores.push(`Elemento ${index + 1}: el campo 'total' debe ser un número válido`);
    }
  });

  return {
    valido: errores.length === 0,
    errores: errores.slice(0, 10), // Limitar a 10 errores para no saturar
    totalErrores: errores.length
  };
};

// Generar ID único para elementos
export const generarId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Colores para gráficos
export const coloresGraficos = [
  '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
  '#43e97b', '#38f9d7', '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3',
  '#ff9a9e', '#fad0c4', '#ffefd5', '#ffdfba', '#c2e9fb', '#a1c4fd',
  '#d299c2', '#fef9d7', '#667eea', '#764ba2'
];

// Obtener color por índice
export const obtenerColor = (index) => {
  return coloresGraficos[index % coloresGraficos.length];
};

// Formatear texto para visualización
export const formatearTexto = (texto, longitudMaxima = 50) => {
  if (!texto || typeof texto !== 'string') return '';
  
  if (texto.length <= longitudMaxima) return texto;
  
  return `${texto.substring(0, longitudMaxima - 3)}...`;
};

// Calcular tendencia (crecimiento/decrecimiento)
export const calcularTendencia = (datos, campo = 'total') => {
  if (!Array.isArray(datos) || datos.length < 2) {
    return { tendencia: 'sin-datos', porcentaje: 0 };
  }

  const valores = datos.map(item => item[campo] || 0);
  const inicio = valores[0];
  const fin = valores[valores.length - 1];

  if (inicio === 0 && fin === 0) {
    return { tendencia: 'estable', porcentaje: 0 };
  }

  if (inicio === 0) {
    return { tendencia: 'crecimiento', porcentaje: 100 };
  }

  const porcentaje = ((fin - inicio) / inicio) * 100;

  let tendencia;
  if (Math.abs(porcentaje) < 5) {
    tendencia = 'estable';
  } else if (porcentaje > 0) {
    tendencia = 'crecimiento';
  } else {
    tendencia = 'decrecimiento';
  }

  return { tendencia, porcentaje: Math.round(porcentaje * 100) / 100 };
};
