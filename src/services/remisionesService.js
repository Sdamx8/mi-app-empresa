// services/remisionesService.js
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Obtener todas las remisiones
export const obtenerRemisiones = async () => {
  try {
    console.log('📋 Obteniendo lista de remisiones...');
    const q = query(collection(db, 'remisiones'), orderBy('fechaCreacion', 'desc'));
    const querySnapshot = await getDocs(q);
    const remisiones = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log(`✅ ${remisiones.length} remisiones obtenidas`);
    return remisiones;
  } catch (error) {
    console.error('Error obteniendo remisiones:', error);
    return [];
  }
};

// Crear nueva remisión
export const crearRemision = async (remisionData) => {
  try {
    const docRef = await addDoc(collection(db, 'remisiones'), {
      ...remisionData,
      fechaCreacion: new Date(),
      fechaModificacion: new Date()
    });
    console.log('✅ Remisión creada con ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creando remisión:', error);
    return { success: false, error: error.message };
  }
};

// Actualizar remisión
export const actualizarRemision = async (id, remisionData) => {
  try {
    await updateDoc(doc(db, 'remisiones', id), {
      ...remisionData,
      fechaModificacion: new Date()
    });
    console.log('✅ Remisión actualizada:', id);
    return { success: true };
  } catch (error) {
    console.error('Error actualizando remisión:', error);
    return { success: false, error: error.message };
  }
};

// Eliminar remisión
export const eliminarRemision = async (id) => {
  try {
    await deleteDoc(doc(db, 'remisiones', id));
    console.log('✅ Remisión eliminada:', id);
    return { success: true };
  } catch (error) {
    console.error('Error eliminando remisión:', error);
    return { success: false, error: error.message };
  }
};

// Buscar remisiones por criterios
export const buscarRemisiones = async (criterios) => {
  try {
    let q = collection(db, 'remisiones');
    
    if (criterios.numero) {
      q = query(q, where('numero', '==', criterios.numero));
    }
    
    if (criterios.movil) {
      q = query(q, where('movil', '==', criterios.movil));
    }
    
    if (criterios.tecnico) {
      q = query(q, where('tecnico', '==', criterios.tecnico));
    }
    
    const querySnapshot = await getDocs(q);
    const remisiones = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return remisiones;
  } catch (error) {
    console.error('Error buscando remisiones:', error);
    return [];
  }
};

// Obtener técnicos únicos
export const obtenerTecnicos = async () => {
  try {
    console.log('👷‍♂️ Obteniendo lista de técnicos...');
    const remisiones = await obtenerRemisiones();
    const tecnicos = [...new Set(remisiones.map(r => r.tecnico).filter(Boolean))];
    console.log(`✅ ${tecnicos.length} técnicos únicos encontrados`);
    return tecnicos;
  } catch (error) {
    console.error('Error obteniendo técnicos:', error);
    return [];
  }
};

// Obtener móviles únicos
export const obtenerMoviles = async () => {
  try {
    console.log('🚛 Obteniendo lista de móviles...');
    const remisiones = await obtenerRemisiones();
    const moviles = [...new Set(remisiones.map(r => r.movil).filter(Boolean))];
    console.log(`✅ ${moviles.length} móviles únicos encontrados`);
    return moviles;
  } catch (error) {
    console.error('Error obteniendo móviles:', error);
    return [];
  }
};

export default {
  obtenerRemisiones,
  crearRemision,
  actualizarRemision,
  eliminarRemision,
  buscarRemisiones,
  obtenerTecnicos,
  obtenerMoviles
};

// También exportar como named export
export const remisionesService = {
  obtenerRemisiones,
  crearRemision,
  actualizarRemision,
  eliminarRemision,
  buscarRemisiones,
  obtenerTecnicos,
  obtenerMoviles
};
