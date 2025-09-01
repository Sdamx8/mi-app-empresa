import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Clock, Copy, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Plus, X } from 'lucide-react';

/**
 * 🎯 COMPONENTE ACTIVIDADES REALIZADAS - VERSIÓN CONSOLIDADA
 * ==========================================================
 * 
 * Consulta la colección 'servicios' por campo 'titulo' y consolida múltiples actividades:
 * - Elimina duplicados en descripciones
 * - Combina materiales únicos + permite agregar manualmente
 * - Consolida recurso humano sin duplicados
 * - Suma tiempos estimados (convierte a horas y minutos)
 * 
 * Props esperadas:
 * - tituloTrabajo: Campo titulo para consultar en servicios
 * - onMaterialesChange: Callback para notificar cambios en materiales al componente padre
 * - onDatosConsolidadosChange: Callback para notificar datos consolidados completos (para PDF)
 */

const ActividadesRealizadas = ({ 
  tituloTrabajo,
  onMaterialesChange,
  onDatosConsolidadosChange
}) => {
  // Estados para el manejo de la consulta a Firestore
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [actividades, setActividades] = useState([]);
  const [errorActividades, setErrorActividades] = useState(null);
  
  // Estados para UI interactiva
  const [descripcionesExpandidas, setDescripcionesExpandidas] = useState({});
  const [copiado, setCopiado] = useState({});
  
  // Estados para materiales adicionales
  const [materialesAdicionales, setMaterialesAdicionales] = useState([]);
  const [nuevoMaterial, setNuevoMaterial] = useState('');

  // CRÍTICO: Función para cargar actividades desde Firestore por título
  const cargarActividades = useCallback(async (titulo) => {
    if (!titulo || typeof titulo !== 'string' || titulo.trim() === '') {
      console.log('ActividadesFetch: No hay título válido para consultar');
      setActividades([]);
      setErrorActividades(null);
      return;
    }

    console.log('ActividadesFetch: Iniciando consulta para título:', titulo);
    setLoadingActividades(true);
    setErrorActividades(null);

    try {
      // NUEVO: Separar títulos múltiples por coma y buscar cada uno
      const titulosIndividuales = titulo.split(',').map(t => t.trim()).filter(t => t !== '');
      console.log('ActividadesFetch: Títulos individuales a buscar:', titulosIndividuales);
      
      const serviciosRef = collection(db, 'servicios');
      const todasLasActividades = [];

      // Buscar cada título individualmente
      for (const tituloIndividual of titulosIndividuales) {
        console.log('ActividadesFetch: Buscando título individual:', tituloIndividual);
        const q = query(serviciosRef, where('titulo', '==', tituloIndividual));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            todasLasActividades.push({
              id: doc.id,
              tituloOriginal: tituloIndividual, // Agregar referencia al título original
              ...data
            });
          });
        } else {
          console.log('ActividadesFetch: No se encontraron resultados para:', tituloIndividual);
        }
      }

      if (todasLasActividades.length > 0) {
        console.log('ActividadesFetch: Total de actividades encontradas:', todasLasActividades.length);
        console.log('ActividadesFetch: Detalles de actividades encontradas:');
        todasLasActividades.forEach((act, index) => {
          console.log(`  ${index + 1}. Título: "${act.tituloOriginal}" | Descripción: "${act.descripcion_actividad?.substring(0, 100)}..."`);
        });
        setActividades(todasLasActividades);
      } else {
        console.log('ActividadesFetch: No se encontraron actividades para ninguno de los títulos');
        setActividades([]);
      }
    } catch (error) {
      console.error('ActividadesFetch: Error en consulta:', error);
      setErrorActividades('Error al cargar actividades');
      setActividades([]);
    } finally {
      setLoadingActividades(false);
    }
  }, []); // Sin dependencias para estabilidad

  // CRÍTICO: useEffect con control de cancelación para evitar setState tras desmontaje
  useEffect(() => {
    let cancelado = false;

    const ejecutarConsulta = async () => {
      await cargarActividades(tituloTrabajo);
      
      // Verificar si el componente sigue montado
      if (cancelado) {
        console.log('ActividadesFetch: Consulta cancelada por desmontaje');
        return;
      }
    };

    ejecutarConsulta();

    // Cleanup: cancelar operaciones pendientes
    return () => {
      cancelado = true;
    };
  }, [tituloTrabajo, cargarActividades]);

  // CONSOLIDACIÓN DE DATOS: Procesar actividades para eliminar duplicados y combinar
  const datosConsolidados = useMemo(() => {
    if (actividades.length === 0) return null;

    // 1. DESCRIPCIONES: Eliminar duplicados inteligentes (descripcion_actividad)
    const descripcionesConProcesamiento = actividades
      .map(act => act.descripcion_actividad)
      .filter(desc => desc && desc.trim() !== '');
    
    console.log('🔍 ActividadesRealizadas - ENTRADA COMPLETA:');
    console.log('  - Total actividades encontradas:', actividades.length);
    actividades.forEach((act, index) => {
      console.log(`  ${index + 1}. Título: "${act.tituloOriginal}" | ID: ${act.id}`);
      console.log(`      Descripción: "${act.descripcion_actividad?.substring(0, 200)}..."`);
    });
    
    console.log('🔍 ActividadesRealizadas - DESCRIPCIONES EXTRAÍDAS:');
    descripcionesConProcesamiento.forEach((desc, index) => {
      console.log(`  ${index + 1}. "${desc?.substring(0, 200)}..."`);
    });
    
    // Normalizar descripciones para detectar duplicados más eficientemente
    const descripcionesNormalizadas = new Map();
    descripcionesConProcesamiento.forEach((desc, index) => {
      // Primero eliminar prefijos comunes antes de normalizar
      let textoLimpio = desc.trim()
        .replace(/^["']?actividad\s+realizada\s*:\s*/i, '') // Eliminar "Actividad realizada:"
        .replace(/^["']?descripci[oó]n\s*:\s*/i, '') // Eliminar "Descripción:"
        .replace(/^["']?detalle\s*:\s*/i, '') // Eliminar "Detalle:"
        .replace(/^["']/, '') // Eliminar comillas al inicio
        .replace(/["']$/, '') // Eliminar comillas al final
        .trim();
      
      // Normalizar: minúsculas, sin espacios extra, sin caracteres especiales al final
      const normalizada = textoLimpio.toLowerCase()
        .replace(/\s+/g, ' ')  // Múltiples espacios a uno solo
        .replace(/[.,:;!?]+$/g, '');  // Remover puntuación al final
      
      console.log(`🔍 Procesando descripción ${index + 1}:`);
      console.log(`    Original: "${desc?.substring(0, 100)}..."`);
      console.log(`    Texto limpio: "${textoLimpio?.substring(0, 100)}..."`);
      console.log(`    Normalizada: "${normalizada?.substring(0, 100)}..."`);
      
      // Si no existe esta descripción normalizada, guardar la original
      if (!descripcionesNormalizadas.has(normalizada)) {
        descripcionesNormalizadas.set(normalizada, desc.trim());
        console.log(`    ✅ NUEVA - Guardada`);
      } else {
        console.log(`    ❌ DUPLICADA - Ignorada`);
      }
    });
    
    const descripcionesUnicas = Array.from(descripcionesNormalizadas.values());
    
    console.log('🔍 Consolidación de descripciones:');
    console.log('  - Descripciones originales:', descripcionesConProcesamiento.length);
    console.log('  - Descripciones únicas:', descripcionesUnicas.length);
    console.log('  - Descripciones procesadas:', descripcionesUnicas);

    // 2. MATERIALES: Combinar y eliminar duplicados
    const materialesOriginales = [];
    actividades.forEach(act => {
      if (act.materiales_suministrados) {
        if (Array.isArray(act.materiales_suministrados)) {
          materialesOriginales.push(...act.materiales_suministrados);
        } else if (typeof act.materiales_suministrados === 'string') {
          materialesOriginales.push(...act.materiales_suministrados.split(',').map(m => m.trim()));
        }
      }
    });
    const materialesUnicos = [...new Set(materialesOriginales.filter(m => m && m.trim() !== ''))];

    // 3. RECURSO HUMANO: Combinar y eliminar duplicados
    const recursosOriginales = [];
    actividades.forEach(act => {
      if (act.recurso_humano_requerido) {
        if (Array.isArray(act.recurso_humano_requerido)) {
          recursosOriginales.push(...act.recurso_humano_requerido);
        } else if (typeof act.recurso_humano_requerido === 'string') {
          recursosOriginales.push(...act.recurso_humano_requerido.split(',').map(r => r.trim()));
        }
      }
    });
    const recursosUnicos = [...new Set(recursosOriginales.filter(r => r && r.trim() !== ''))];

    // 4. TIEMPO ESTIMADO: Convertir a minutos y sumar
    let tiempoTotalMinutos = 0;
    actividades.forEach(act => {
      if (act.tiempo_estimado) {
        const tiempo = act.tiempo_estimado.toString().toLowerCase();
        
        // Extraer horas y minutos del texto
        const horasMatch = tiempo.match(/(\d+)\s*h/);
        const minutosMatch = tiempo.match(/(\d+)\s*m/);
        
        if (horasMatch) {
          tiempoTotalMinutos += parseInt(horasMatch[1]) * 60;
        }
        if (minutosMatch) {
          tiempoTotalMinutos += parseInt(minutosMatch[1]);
        }
        
        // Si solo hay números, asumir que son minutos para casos como "30 minutos"
        if (!horasMatch && !minutosMatch) {
          const soloNumero = tiempo.match(/(\d+)/);
          if (soloNumero) {
            tiempoTotalMinutos += parseInt(soloNumero[1]);
          }
        }
      }
    });

    const horas = Math.floor(tiempoTotalMinutos / 60);
    const minutos = tiempoTotalMinutos % 60;

    return {
      descripciones: descripcionesUnicas,
      materiales: materialesUnicos,
      recursos: recursosUnicos,
      tiempoTotal: { horas, minutos, totalMinutos: tiempoTotalMinutos }
    };
  }, [actividades]);

  // CRÍTICO: Notificar cambios de materiales al componente padre
  useEffect(() => {
    console.log('🔍 ActividadesRealizadas - ENVIANDO DATOS CONSOLIDADOS:', datosConsolidados);
    
    if (datosConsolidados && onMaterialesChange) {
      const materialesCompletos = [
        ...datosConsolidados.materiales,
        ...materialesAdicionales
      ];
      onMaterialesChange(materialesCompletos);
    }
  }, [datosConsolidados, materialesAdicionales, onMaterialesChange]);

  // NUEVO: Notificar datos consolidados completos para PDF
  useEffect(() => {
    console.log('🔄 ActividadesRealizadas: useEffect de datos consolidados ejecutado');
    console.log('   >> onDatosConsolidadosChange disponible:', !!onDatosConsolidadosChange);
    console.log('   >> datosConsolidados:', datosConsolidados);
    console.log('   >> materialesAdicionales:', materialesAdicionales);
    
    if (onDatosConsolidadosChange) {
      // Incluir materiales adicionales en los datos consolidados para PDF
      const datosCompletos = datosConsolidados ? {
        ...datosConsolidados,
        materiales: [
          ...datosConsolidados.materiales,
          ...materialesAdicionales
        ]
      } : null;
      
      console.log('   ✅ Enviando datos consolidados completos al formulario:', datosCompletos);
      onDatosConsolidadosChange(datosCompletos);
    }
  }, [datosConsolidados, materialesAdicionales, onDatosConsolidadosChange]);

  // Handler para copiar descripción al portapapeles
  const copiarDescripcion = useCallback(async (descripcion, index) => {
    try {
      await navigator.clipboard.writeText(descripcion);
      setCopiado(prev => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setCopiado(prev => ({ ...prev, [index]: false }));
      }, 2000);
    } catch (error) {
      console.error('Error copiando al portapapeles:', error);
    }
  }, []);

  // Handler para expandir/colapsar descripción
  const toggleDescripcion = useCallback((index) => {
    setDescripcionesExpandidas(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);

  // Handler para agregar material adicional
  const agregarMaterial = useCallback(() => {
    const material = nuevoMaterial.trim();
    if (material && !materialesAdicionales.includes(material)) {
      setMaterialesAdicionales(prev => [...prev, material]);
      setNuevoMaterial('');
    }
  }, [nuevoMaterial, materialesAdicionales]);

  // Handler para eliminar material adicional
  const eliminarMaterialAdicional = useCallback((index) => {
    setMaterialesAdicionales(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handler para reintentar la consulta
  const reintentar = useCallback(() => {
    if (tituloTrabajo) {
      cargarActividades(tituloTrabajo);
    }
  }, [tituloTrabajo, cargarActividades]);

  // Renderizar chips para materiales y recursos
  const renderChips = useCallback((data, color = 'blue', esEliminable = false, onEliminar = null) => {
    if (!data || data.length === 0) {
      return <span className="text-gray-500 text-sm">No especificado</span>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {data.map((item, index) => (
          <span
            key={index}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border ${
              color === 'blue' 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-green-50 text-green-700 border-green-200'
            }`}
          >
            {item}
            {esEliminable && onEliminar && (
              <button
                onClick={() => onEliminar(index)}
                className="ml-1 hover:bg-red-100 rounded-full p-0.5"
                aria-label={`Eliminar ${item}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    );
  }, []);

  // Caso: No hay título de trabajo disponible
  if (!tituloTrabajo || tituloTrabajo.trim() === '') {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 text-amber-600">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            Complete el título del trabajo para cargar actividades relacionadas.
          </span>
        </div>
      </div>
    );
  }

  // Caso: Cargando datos
  if (loadingActividades) {
    return (
      <div className="p-6 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">
            Cargando actividades para servicios relacionados...
          </span>
        </div>
      </div>
    );
  }

  // Caso: Error en la consulta
  if (errorActividades) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{errorActividades}</span>
          </div>
          <button
            onClick={reintentar}
            className="flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
            aria-label="Reintentar carga de actividades"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Caso: No hay actividades encontradas
  if (!datosConsolidados || actividades.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center gap-2 text-gray-600">
          <AlertCircle className="w-5 h-5" />
          <div className="text-sm">
            <p className="font-medium mb-1">No se encontraron actividades registradas para estos servicios.</p>
            <p className="text-xs text-gray-500">
              Verifique que los títulos de los servicios coincidan exactamente con los registrados en la base de datos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-gray-50 overflow-hidden shadow-sm">
      {/* Layout responsive: desktop (grid) vs mobile (stack) */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
        
        {/* Columna principal: Descripciones de actividades */}
        <div className="p-4 border-r-0 lg:border-r border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">
            Descripción de Actividades 
            <span className="text-xs text-gray-500 font-normal ml-2">
              ({actividades.length} servicio{actividades.length !== 1 ? 's' : ''} encontrado{actividades.length !== 1 ? 's' : ''})
            </span>
          </h4>
          
          <div className="space-y-3">
            {datosConsolidados.descripciones.map((descripcion, index) => {
              const necesitaExpansion = descripcion.length > 200;
              const expandida = descripcionesExpandidas[index];
              const descripcionMostrada = necesitaExpansion && !expandida 
                ? descripcion.substring(0, 200) + '...'
                : descripcion;

              return (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500 font-medium">Actividad {index + 1}</span>
                    <button
                      onClick={() => copiarDescripcion(descripcion, index)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      aria-label="Copiar descripción al portapapeles"
                      title={copiado[index] ? "¡Copiado!" : "Copiar descripción"}
                    >
                      <Copy className="w-3 h-3" />
                      {copiado[index] ? "¡Copiado!" : "Copiar"}
                    </button>
                  </div>
                  
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {descripcionMostrada}
                  </pre>
                  
                  {necesitaExpansion && (
                    <button
                      onClick={() => toggleDescripcion(index)}
                      className="flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                      aria-expanded={expandida}
                      aria-label={expandida ? "Ver menos" : "Ver más"}
                    >
                      {expandida ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Ver más
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Columna lateral: Metadatos consolidados */}
        <div className="p-4 bg-white space-y-4">
          
          {/* Tiempo estimado total */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <strong className="text-sm font-medium text-gray-900">Tiempo Estimado Total</strong>
            </div>
            <p className="text-sm font-medium text-blue-700">
              {datosConsolidados.tiempoTotal.horas > 0 && `${datosConsolidados.tiempoTotal.horas} horas `}
              {datosConsolidados.tiempoTotal.minutos > 0 && `${datosConsolidados.tiempoTotal.minutos} minutos`}
              {datosConsolidados.tiempoTotal.totalMinutos === 0 && 'No especificado'}
            </p>
          </div>

          {/* Materiales consolidados + agregador manual */}
          <div>
            <strong className="block text-sm font-medium text-gray-900 mb-2">
              Materiales Suministrados ({datosConsolidados.materiales.length + materialesAdicionales.length})
            </strong>
            
            {/* Materiales originales */}
            {renderChips(datosConsolidados.materiales, 'blue')}
            
            {/* Materiales adicionales */}
            {materialesAdicionales.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-gray-500 font-medium block mb-1">Materiales adicionales:</span>
                {renderChips(materialesAdicionales, 'green', true, eliminarMaterialAdicional)}
              </div>
            )}
            
            {/* Agregador de materiales */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={nuevoMaterial}
                onChange={(e) => setNuevoMaterial(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && agregarMaterial()}
                placeholder="Agregar material..."
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Agregar material adicional"
              />
              <button
                onClick={agregarMaterial}
                disabled={!nuevoMaterial.trim()}
                className="flex items-center gap-1 px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Agregar material"
              >
                <Plus className="w-3 h-3" />
                Agregar
              </button>
            </div>
          </div>

          {/* Recurso humano consolidado */}
          <div>
            <strong className="block text-sm font-medium text-gray-900 mb-2">
              Recurso Humano Requerido ({datosConsolidados.recursos.length})
            </strong>
            {renderChips(datosConsolidados.recursos, 'green')}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ActividadesRealizadas;
