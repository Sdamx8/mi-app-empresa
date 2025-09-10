/* 
🚀 GLOBAL MOBILITY SOLUTIONS - SERVICIO INFORMES TÉCNICOS
==========================================================
Servicio completo para gestión de informes técnicos con Firestore
Sin errores CORS y con normativa ISO
*/

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { imageUploadService } from './imageUploadService';

// informesTecnicosService removed - stub kept during purge
export const informesTecnicosService = {
  obtenerInformes: async () => [],
  obtenerInformePorId: async () => null,
  crearInforme: async () => { throw new Error('InformesTecnicosService removed'); },
  actualizarInforme: async () => { throw new Error('InformesTecnicosService removed'); },
  eliminarInforme: async () => { throw new Error('InformesTecnicosService removed'); }
};