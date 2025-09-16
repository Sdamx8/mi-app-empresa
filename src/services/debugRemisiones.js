// Debug script para verificar remisiones en Firestore
import { 
  collection, 
  getDocs, 
  query, 
  where,
  limit 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Listar todas las remisiones para debug
 */
export const debugListarRemisiones = async (limiteDocs = 20) => {
  try {
    console.log('🔍 Listando remisiones en Firestore...');
    
    const remisionesRef = collection(db, 'remisiones');
    const q = query(remisionesRef, limit(limiteDocs));
    const querySnapshot = await getDocs(q);

    console.log(`📊 Total documentos encontrados: ${querySnapshot.size}`);
    
    const remisiones = [];
    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`📄 ID: ${doc.id}`, data);
      remisiones.push({
        id: doc.id,
        ...data
      });
    });

    return remisiones;
  } catch (error) {
    console.error('❌ Error listando remisiones:', error);
    throw error;
  }
};

/**
 * Buscar remisión específica con diferentes métodos
 */
export const debugBuscarRemision = async (numeroRemision) => {
  try {
    console.log(`🔍 Debug búsqueda remisión: ${numeroRemision}`);
    
    // Método 1: Búsqueda exacta como string
    const remisionesRef = collection(db, 'remisiones');
    const q1 = query(remisionesRef, where('remision', '==', numeroRemision.toString()));
    const snapshot1 = await getDocs(q1);
    console.log(`🔍 Búsqueda como string "${numeroRemision}": ${snapshot1.size} resultados`);

    // Método 2: Búsqueda como número
    const q2 = query(remisionesRef, where('remision', '==', parseInt(numeroRemision)));
    const snapshot2 = await getDocs(q2);
    console.log(`🔍 Búsqueda como número ${parseInt(numeroRemision)}: ${snapshot2.size} resultados`);

    // Método 3: Búsqueda con ceros a la izquierda
    const numeroConCeros = numeroRemision.padStart(4, '0');
    const q3 = query(remisionesRef, where('remision', '==', numeroConCeros));
    const snapshot3 = await getDocs(q3);
    console.log(`🔍 Búsqueda con ceros "${numeroConCeros}": ${snapshot3.size} resultados`);

    // Método 4: Listar todas y filtrar manualmente
    const allDocsQuery = query(remisionesRef, limit(100));
    const allSnapshot = await getDocs(allDocsQuery);
    console.log(`📊 Total documentos para revisar: ${allSnapshot.size}`);
    
    const coincidencias = [];
    allSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const remisionValue = data.remision;
      
      if (remisionValue && (
        remisionValue.toString() === numeroRemision.toString() ||
        remisionValue.toString() === numeroConCeros ||
        parseInt(remisionValue) === parseInt(numeroRemision)
      )) {
        console.log(`✅ Coincidencia encontrada:`, {
          id: doc.id,
          remisionEnDoc: remisionValue,
          tipoDato: typeof remisionValue,
          ...data
        });
        coincidencias.push({
          id: doc.id,
          ...data
        });
      }
    });

    return {
      busquedaString: snapshot1.size,
      busquedaNumero: snapshot2.size, 
      busquedaConCeros: snapshot3.size,
      coincidenciasManual: coincidencias
    };

  } catch (error) {
    console.error('❌ Error en debug:', error);
    throw error;
  }
};

/**
 * Verificar estructura de datos de remisiones
 */
export const debugEstructuraRemisiones = async () => {
  try {
    console.log('🔍 Analizando estructura de remisiones...');
    
    const remisionesRef = collection(db, 'remisiones');
    const q = query(remisionesRef, limit(5));
    const querySnapshot = await getDocs(q);

    querySnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Documento ${index + 1}:`, {
        id: doc.id,
        campoRemision: data.remision,
        tipoCampoRemision: typeof data.remision,
        todasLasClaves: Object.keys(data),
        datosCompletos: data
      });
    });

  } catch (error) {
    console.error('❌ Error analizando estructura:', error);
    throw error;
  }
};