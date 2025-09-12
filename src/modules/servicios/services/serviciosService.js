// serviciosService.js - CRUD para la colección 'servicios' en Firestore
import { collection, getDocs, query, where, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../../core/config/firebaseConfig';

export async function getServicios(filtros = {}) {
  try {
    let q = collection(db, 'servicios');
    const condiciones = [];
    if (filtros.categoria) condiciones.push(where('categoría', '==', filtros.categoria));
    if (filtros.texto) {
      // Búsqueda por id_servicio o título (case-insensitive)
      // NOTA: Firestore no soporta OR, así que se filtra en cliente
    }
    if (condiciones.length) q = query(q, ...condiciones);
    const snap = await getDocs(q);
    
    let servicios = snap.docs.map(doc => {
      const data = doc.data();
      
      return { 
        id: doc.id, 
        ...data,
        // Usar los nombres correctos de los campos como están en Firestore
        titulo: data.título || data.titulo || '',
        categoria: data.categoría || data.categoria || '',
        id_servicio: data.id_servicio || doc.id,
        costo: typeof data.costo === 'number' ? data.costo : 0,
        tiempo_estimado: typeof data.tiempo_estimado === 'number' ? data.tiempo_estimado : 0,
        descripcion_actividad: data.descripcion_actividad || '',
        materiales_suministrados: data.materiales_suministrados || '',
        recurso_humano_requerido: data.recurso_humano_requerido || ''
      };
    });
    
    if (filtros.texto) {
      const texto = filtros.texto.toLowerCase();
      servicios = servicios.filter(s =>
        (s.id_servicio && s.id_servicio.toLowerCase().includes(texto)) ||
        (s.titulo && s.titulo.toLowerCase().includes(texto))
      );
    }
    
    return servicios;
  } catch (error) {
    console.error('Error fetching servicios:', error);
    throw error;
  }
}


export async function deleteServicio(id) {
  if (!id) throw new Error('ID de documento requerido');
  await deleteDoc(doc(db, 'servicios', id));
}

export async function addServicio(data, usuario = null) {
  if (!data.id_servicio || !data.titulo) throw new Error('ID y título requeridos');
  const now = serverTimestamp();
  const docData = {
    ...data,
    // Usar los nombres correctos de los campos como están en Firestore
    título: data.titulo,
    categoría: data.categoria,
    costo: Number(data.costo),
    tiempo_estimado: Number(data.tiempo_estimado),
    fechaActualizacion: now,
    actualizadoPorScript: false,
    historial: [
      {
        accion: 'creado',
        fecha: now,
        usuario: usuario || 'sistema'
      }
    ]
  };
  // Remover campos duplicados
  delete docData.titulo;
  delete docData.categoria;
  
  await addDoc(collection(db, 'servicios'), docData);
}


export async function updateServicio(data, usuario = null) {
  if (!data.id) throw new Error('ID de documento requerido');
  const docRef = doc(db, 'servicios', data.id);
  const now = serverTimestamp();
  // Mantener historial anterior y agregar nueva entrada
  const prevHistorial = Array.isArray(data.historial) ? data.historial : [];
  const docData = {
    ...data,
    // Usar los nombres correctos de los campos como están en Firestore
    título: data.titulo,
    categoría: data.categoria,
    costo: Number(data.costo),
    tiempo_estimado: Number(data.tiempo_estimado),
    fechaActualizacion: now,
    actualizadoPorScript: false,
    historial: [
      ...prevHistorial,
      {
        accion: 'editado',
        fecha: now,
        usuario: usuario || 'sistema'
      }
    ]
  };
  // Remover campos duplicados
  delete docData.titulo;
  delete docData.categoria;
  
  await updateDoc(docRef, docData);
}
