// serviciosService.js - CRUD para la colección 'servicios' en Firestore
import { collection, getDocs, query, where, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';
export async function deleteServicio(id) {
  if (!id) throw new Error('ID de documento requerido');
  await deleteDoc(doc(db, 'servicios', id));
}
import { db } from '../../../core/config/firebaseConfig';

export async function getServicios(filtros = {}) {
  let q = collection(db, 'servicios');
  const condiciones = [];
  if (filtros.categoria) condiciones.push(where('categoria', '==', filtros.categoria));
  if (filtros.estado) condiciones.push(where('estado', '==', filtros.estado));
  if (filtros.texto) {
    // Búsqueda por id_servicio o título (case-insensitive)
    // NOTA: Firestore no soporta OR, así que se filtra en cliente
  }
  if (condiciones.length) q = query(q, ...condiciones);
  const snap = await getDocs(q);
  let servicios = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  if (filtros.texto) {
    const texto = filtros.texto.toLowerCase();
    servicios = servicios.filter(s =>
      (s.id_servicio && s.id_servicio.toLowerCase().includes(texto)) ||
      (s.titulo && s.titulo.toLowerCase().includes(texto))
    );
  }
  return servicios;
}


export async function addServicio(data, usuario = null) {
  if (!data.id_servicio || !data.titulo) throw new Error('ID y título requeridos');
  const now = serverTimestamp();
  const docData = {
    ...data,
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
  await updateDoc(docRef, docData);
}
