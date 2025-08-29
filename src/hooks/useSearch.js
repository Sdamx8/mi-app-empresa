// hooks/useSearch.js - Hook personalizado para búsquedas
import { useState, useCallback } from 'react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { CACHE_DURATION, MAX_DOCUMENTS_LIMIT, MESSAGES } from '../constants';

export const useSearch = () => {
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [totalEncontrados, setTotalEncontrados] = useState(0);
  const [cache, setCache] = useState([]);
  const [cacheTimestamp, setCacheTimestamp] = useState(null);

  const buscarRemisiones = useCallback(async (criterios) => {
    // Validar que al menos un campo tenga valor
    const { remision, movil, estado } = criterios;
    if (!remision.trim() && !movil.trim() && !estado.trim()) {
      setMensaje(MESSAGES.NO_CRITERIA);
      return;
    }

    setCargando(true);
    setMensaje('');
    setResultados([]);
    setTotalEncontrados(0);

    try {
      let documentos = [];
      
      // Verificar si tenemos caché válido
      const ahora = Date.now();
      const cacheValido = cacheTimestamp && (ahora - cacheTimestamp) < CACHE_DURATION;
      
      if (cacheValido && cache.length > 0) {
        documentos = cache;
      } else {
        // Obtener datos de Firestore y actualizar caché
        const remisionesRef = collection(db, 'remisiones');
        const q = query(remisionesRef, limit(MAX_DOCUMENTS_LIMIT));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          documentos.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Actualizar caché
        setCache(documentos);
        setCacheTimestamp(ahora);
      }

      // Filtrar los resultados en el cliente
      let resultadosFiltrados = documentos;

      // Filtrar por remisión si se especifica
      if (remision.trim()) {
        const remisionBusqueda = remision.trim().toLowerCase();
        resultadosFiltrados = resultadosFiltrados.filter(doc => {
          const remisionDoc = doc.remision ? doc.remision.toString().toLowerCase() : '';
          return remisionDoc.includes(remisionBusqueda);
        });
      }

      // Filtrar por móvil si se especifica
      if (movil.trim()) {
        const movilBusqueda = movil.trim().toLowerCase();
        resultadosFiltrados = resultadosFiltrados.filter(doc => {
          const movilDoc = doc.movil ? doc.movil.toString().toLowerCase() : '';
          return movilDoc.includes(movilBusqueda);
        });
      }

      // Filtrar por estado si se especifica
      if (estado.trim()) {
        const estadoBusqueda = estado.trim().toLowerCase();
        resultadosFiltrados = resultadosFiltrados.filter(doc => {
          const estadoDoc = doc.estado ? doc.estado.toString().toLowerCase() : '';
          return estadoDoc.includes(estadoBusqueda);
        });
      }

      setResultados(resultadosFiltrados);
      setTotalEncontrados(resultadosFiltrados.length);

      if (resultadosFiltrados.length === 0) {
        setMensaje(MESSAGES.NO_RESULTS);
      } else {
        setMensaje(`Se encontraron ${resultadosFiltrados.length} remisiones`);
      }

    } catch (error) {
      console.error('Error en búsqueda:', error);
      setMensaje(`${MESSAGES.ERROR_SEARCH}${error.message}`);
    } finally {
      setCargando(false);
    }
  }, [cache, cacheTimestamp]);

  const limpiarResultados = useCallback(() => {
    setResultados([]);
    setMensaje('');
    setTotalEncontrados(0);
  }, []);

  return {
    resultados,
    cargando,
    mensaje,
    totalEncontrados,
    cache: cache.length > 0,
    buscarRemisiones,
    limpiarResultados
  };
};

export default useSearch;
