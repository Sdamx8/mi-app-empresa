// Función mejorada de búsqueda de remisiones - más flexible
import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Búsqueda mejorada de remisión con múltiples estrategias
 */
export const buscarRemisionMejorada = async (numeroRemision) => {
  try {
    console.log(`🔍 Búsqueda mejorada para remisión: ${numeroRemision}`);
    
    if (!numeroRemision || numeroRemision.trim() === '') {
      throw new Error('Número de remisión requerido');
    }

    const numeroLimpio = numeroRemision.toString().trim();
    const remisionesRef = collection(db, 'remisiones');
    
    // Estrategia 1: Búsqueda exacta como string
    console.log('🔍 Estrategia 1: Búsqueda exacta como string');
    const q1 = query(remisionesRef, where('remision', '==', numeroLimpio));
    const snapshot1 = await getDocs(q1);
    
    if (!snapshot1.empty) {
      const doc = snapshot1.docs[0];
      console.log('✅ Encontrada con estrategia 1 (string exacto)');
      return { 
        success: true, 
        data: { id: doc.id, ...doc.data() },
        estrategia: 'string-exacto'
      };
    }

    // Estrategia 2: Búsqueda como número
    console.log('🔍 Estrategia 2: Búsqueda como número');
    if (!isNaN(numeroLimpio)) {
      const q2 = query(remisionesRef, where('remision', '==', parseInt(numeroLimpio)));
      const snapshot2 = await getDocs(q2);
      
      if (!snapshot2.empty) {
        const doc = snapshot2.docs[0];
        console.log('✅ Encontrada con estrategia 2 (número)');
        return { 
          success: true, 
          data: { id: doc.id, ...doc.data() },
          estrategia: 'numero'
        };
      }
    }

    // Estrategia 3: Búsqueda con padding de ceros
    console.log('🔍 Estrategia 3: Búsqueda con padding de ceros');
    const numeroConCeros = numeroLimpio.padStart(4, '0');
    if (numeroConCeros !== numeroLimpio) {
      const q3 = query(remisionesRef, where('remision', '==', numeroConCeros));
      const snapshot3 = await getDocs(q3);
      
      if (!snapshot3.empty) {
        const doc = snapshot3.docs[0];
        console.log('✅ Encontrada con estrategia 3 (con ceros)');
        return { 
          success: true, 
          data: { id: doc.id, ...doc.data() },
          estrategia: 'con-ceros'
        };
      }
    }

    // Estrategia 4: Búsqueda sin ceros a la izquierda
    console.log('🔍 Estrategia 4: Búsqueda sin ceros');
    const numeroSinCeros = parseInt(numeroLimpio).toString();
    if (numeroSinCeros !== numeroLimpio) {
      const q4 = query(remisionesRef, where('remision', '==', numeroSinCeros));
      const snapshot4 = await getDocs(q4);
      
      if (!snapshot4.empty) {
        const doc = snapshot4.docs[0];
        console.log('✅ Encontrada con estrategia 4 (sin ceros)');
        return { 
          success: true, 
          data: { id: doc.id, ...doc.data() },
          estrategia: 'sin-ceros'
        };
      }
    }

    // Estrategia 5: Búsqueda manual (último recurso)
    console.log('🔍 Estrategia 5: Búsqueda manual en todos los documentos');
    const qAll = query(remisionesRef, limit(500)); // Limitamos por rendimiento
    const snapshotAll = await getDocs(qAll);
    
    for (const doc of snapshotAll.docs) {
      const data = doc.data();
      const remisionValue = data.remision;
      
      if (remisionValue && (
        remisionValue.toString().toLowerCase() === numeroLimpio.toLowerCase() ||
        parseInt(remisionValue) === parseInt(numeroLimpio) ||
        remisionValue.toString() === numeroConCeros ||
        remisionValue.toString() === numeroSinCeros
      )) {
        console.log('✅ Encontrada con estrategia 5 (búsqueda manual)');
        console.log('📄 Valor en BD:', remisionValue, '| Tipo:', typeof remisionValue);
        return { 
          success: true, 
          data: { id: doc.id, ...data },
          estrategia: 'manual',
          valorEncontrado: remisionValue,
          tipoDato: typeof remisionValue
        };
      }
    }

    // No encontrada
    console.log(`❌ Remisión ${numeroRemision} no encontrada con ninguna estrategia`);
    return { 
      success: false, 
      error: `Remisión ${numeroRemision} no encontrada en la base de datos`,
      estrategiasUsadas: ['string-exacto', 'numero', 'con-ceros', 'sin-ceros', 'manual']
    };

  } catch (error) {
    console.error('❌ Error en búsqueda mejorada:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Función para obtener estadísticas de remisiones
 */
export const obtenerEstadisticasRemisiones = async () => {
  try {
    console.log('📊 Obteniendo estadísticas de remisiones...');
    
    const remisionesRef = collection(db, 'remisiones');
    const q = query(remisionesRef, limit(100));
    const snapshot = await getDocs(q);
    
    const stats = {
      totalDocumentos: snapshot.size,
      tiposDato: {},
      muestras: [],
      formatosEncontrados: []
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const remisionValue = data.remision;
      const tipo = typeof remisionValue;
      
      stats.tiposDato[tipo] = (stats.tiposDato[tipo] || 0) + 1;
      
      if (stats.muestras.length < 10) {
        stats.muestras.push({
          id: doc.id,
          remision: remisionValue,
          tipo: tipo,
          esNumero: !isNaN(remisionValue),
          longitud: remisionValue ? remisionValue.toString().length : 0
        });
      }
      
      if (remisionValue && !stats.formatosEncontrados.includes(remisionValue.toString())) {
        stats.formatosEncontrados.push(remisionValue.toString());
      }
    });
    
    console.log('📊 Estadísticas:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
};