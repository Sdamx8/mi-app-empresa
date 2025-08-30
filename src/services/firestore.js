// services/firestore.js
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ===== REMISIONES =====

/**
 * Buscar remisión por número con múltiples estrategias de búsqueda
 * @param {string} numeroRemision - Número de remisión a buscar
 * @returns {Object|null} Datos de la remisión o null si no existe
 */
export const buscarRemision = async (numeroRemision) => {
  try {
    console.log('🔍 Buscando remisión:', numeroRemision);
    
    if (!numeroRemision || !numeroRemision.toString().trim()) {
      console.warn('❌ Número de remisión vacío');
      return null;
    }
    
    const remisionesRef = collection(db, 'remisiones');
    const numeroLimpio = numeroRemision.toString().trim();
    
    // Método 1: Búsqueda exacta por string
    console.log('🔍 Intentando búsqueda exacta por string...');
    let q = query(remisionesRef, where('remision', '==', numeroLimpio));
    let querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const result = { id: doc.id, ...doc.data() };
      console.log('✅ Remisión encontrada (búsqueda exacta string):', result);
      return result;
    }
    
    // Método 2: Búsqueda exacta por número (en caso de que esté almacenado como número)
    const numeroComoNumero = parseInt(numeroLimpio);
    if (!isNaN(numeroComoNumero)) {
      console.log('🔍 Intentando búsqueda exacta por número...');
      q = query(remisionesRef, where('remision', '==', numeroComoNumero));
      querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const result = { id: doc.id, ...doc.data() };
        console.log('✅ Remisión encontrada (búsqueda exacta número):', result);
        return result;
      }
    }
    
    // Método 3: Búsqueda con filtro en cliente (más flexible)
    console.log('🔍 Intentando búsqueda con filtro en cliente...');
    q = query(remisionesRef, limit(1000)); // Obtener un lote amplio para filtrar
    querySnapshot = await getDocs(q);
    
    const numerosBusqueda = numeroLimpio.toLowerCase();
    
    console.log(`📊 Revisando ${querySnapshot.docs.length} documentos...`);
    
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const remisionDoc = data.remision ? data.remision.toString().toLowerCase() : '';
      
      // Buscar coincidencia exacta o parcial
      if (remisionDoc === numerosBusqueda || 
          remisionDoc.includes(numerosBusqueda) ||
          numerosBusqueda.includes(remisionDoc)) {
        const result = { id: doc.id, ...data };
        console.log('✅ Remisión encontrada (búsqueda con filtro):', result);
        console.log('📋 Campo remisión encontrado:', data.remision, 'vs buscado:', numeroRemision);
        return result;
      }
    }
    
    // Método 4: Búsqueda por otros campos relacionados (número interno, id, etc.)
    console.log('🔍 Intentando búsqueda por campos alternativos...');
    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      
      // Buscar en diferentes campos que podrían contener el número
      const camposAlternativos = [
        data.id_interno,
        data.numero,
        data.codigo,
        data.numero_remision
      ].filter(campo => campo);
      
      for (const campo of camposAlternativos) {
        const valorCampo = campo.toString().toLowerCase();
        if (valorCampo === numerosBusqueda || valorCampo.includes(numerosBusqueda)) {
          const result = { id: doc.id, ...data };
          console.log('✅ Remisión encontrada (campo alternativo):', result);
          return result;
        }
      }
    }
    
    console.log('❌ Remisión no encontrada después de todas las búsquedas');
    console.log('📊 Total de documentos revisados:', querySnapshot.docs.length);
    console.log('🔍 Número buscado:', numeroRemision);
    
    // Log de algunos documentos para debug (solo primeros 3)
    if (querySnapshot.docs.length > 0) {
      console.log('📋 Muestra de documentos en la colección:');
      querySnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`  Documento ${index + 1}:`, {
          id: doc.id,
          remision: data.remision,
          movil: data.movil,
          tipo_remision: typeof data.remision
        });
      });
    }
    
    return null;
  } catch (error) {
    console.error('💥 Error buscando remisión:', error);
    throw new Error(`Error al buscar la remisión: ${error.message}`);
  }
};

// ===== EMPLEADOS =====

/**
 * Obtener tipo de empleado por UID o email
 * @param {string} uid - UID del usuario
 * @param {string} email - Email del usuario (opcional, se obtiene del auth si no se proporciona)
 * @returns {string|null} Tipo de empleado o null
 */
export const obtenerTipoEmpleado = async (uid, email = null) => {
  try {
    console.log('🔍 Buscando empleado - UID:', uid, 'Email:', email);
    
    // Primero intentar buscar por UID (método original)
    const empleadoRef = doc(db, 'EMPLEADOS', uid);
    const empleadoSnap = await getDoc(empleadoRef);
    
    if (empleadoSnap.exists()) {
      const data = empleadoSnap.data();
      console.log('✅ Empleado encontrado por UID:', data);
      return data.tipo_empleado || null;
    }
    
    // Si no encuentra por UID y se proporciona email, buscar por email
    if (email) {
      console.log('🔍 Buscando empleado por email:', email);
      const empleadosRef = collection(db, 'EMPLEADOS');
      
      // Buscar por contacto.correo (estructura correcta según employeeService.js)
      const q1 = query(empleadosRef, where('contacto.correo', '==', email));
      const querySnapshot1 = await getDocs(q1);
      
      if (!querySnapshot1.empty) {
        const empleadoDoc = querySnapshot1.docs[0];
        const data = empleadoDoc.data();
        console.log('✅ Empleado encontrado por contacto.correo:', data);
        
        // Mapear el tipo de empleado a los valores esperados por el sistema
        let tipoEmpleado = data.tipo_empleado;
        if (tipoEmpleado) {
          // Normalizar el tipo (capitalizar primera letra)
          tipoEmpleado = tipoEmpleado.toLowerCase();
          if (tipoEmpleado === 'administrativo') tipoEmpleado = 'Administrativo';
          else if (tipoEmpleado === 'directivo') tipoEmpleado = 'Directivo';
          else if (tipoEmpleado === 'tecnico') tipoEmpleado = 'Tecnico';
        }
        console.log('📋 Tipo de empleado normalizado:', tipoEmpleado);
        return tipoEmpleado;
      }
      
      // Intentar con campo 'email' directo
      const q2 = query(empleadosRef, where('email', '==', email));
      const querySnapshot2 = await getDocs(q2);
      
      if (!querySnapshot2.empty) {
        const empleadoDoc = querySnapshot2.docs[0];
        const data = empleadoDoc.data();
        console.log('✅ Empleado encontrado por email directo:', data);
        return data.tipo_empleado || null;
      }
      
      // Intentar con campo 'correo' directo
      const q3 = query(empleadosRef, where('correo', '==', email));
      const querySnapshot3 = await getDocs(q3);
      
      if (!querySnapshot3.empty) {
        const empleadoDoc = querySnapshot3.docs[0];
        const data = empleadoDoc.data();
        console.log('✅ Empleado encontrado por correo directo:', data);
        return data.tipo_empleado || null;
      }
      
      // Como último recurso, obtener todos los empleados y buscar manualmente
      console.log('🔍 Realizando búsqueda manual en todos los empleados...');
      const allEmpleadosSnapshot = await getDocs(empleadosRef);
      
      for (const empleadoDoc of allEmpleadosSnapshot.docs) {
        const data = empleadoDoc.data();
        const empleadoEmail = data.contacto?.correo || data.email || data.correo;
        
        if (empleadoEmail && empleadoEmail.toLowerCase() === email.toLowerCase()) {
          console.log('✅ Empleado encontrado en búsqueda manual:', data);
          let tipoEmpleado = data.tipo_empleado;
          if (tipoEmpleado) {
            // Normalizar el tipo (capitalizar primera letra)
            tipoEmpleado = tipoEmpleado.toLowerCase();
            if (tipoEmpleado === 'administrativo') tipoEmpleado = 'Administrativo';
            else if (tipoEmpleado === 'directivo') tipoEmpleado = 'Directivo';
            else if (tipoEmpleado === 'tecnico') tipoEmpleado = 'Tecnico';
          }
          return tipoEmpleado;
        }
      }
      
      console.log('📊 Total de empleados revisados:', allEmpleadosSnapshot.docs.length);
      console.log('📧 Email buscado:', email);
    }
    
    console.warn('❌ No se encontró empleado con UID:', uid, 'ni email:', email);
    return null;
  } catch (error) {
    console.error('💥 Error obteniendo tipo de empleado:', error);
    return null;
  }
};

// ===== INFORMES TÉCNICOS =====

/**
 * Crear nuevo informe técnico
 * @param {Object} informeData - Datos del informe
 * @param {string} uid - UID del usuario que crea el informe
 * @returns {string} ID del documento creado
 */
export const crearInformeTecnico = async (informeData, uid) => {
  try {
    const informeCompleto = {
      ...informeData,
      estado: "Generado con éxito",
      creadoEn: Timestamp.now(),
      creadoPor: uid
    };
    
    const docRef = await addDoc(collection(db, 'informesTecnicos'), informeCompleto);
    return docRef.id;
  } catch (error) {
    console.error('Error creando informe técnico:', error);
    throw new Error('Error al crear el informe técnico');
  }
};

/**
 * Obtener todos los informes técnicos
 * @param {number} limiteDocs - Límite de documentos a obtener
 * @param {Object} ultimoDoc - Último documento para paginación
 * @returns {Array} Array de informes
 */
export const obtenerInformesTecnicos = async (limiteDocs = 10, ultimoDoc = null) => {
  try {
    let q;
    
    if (ultimoDoc) {
      q = query(
        collection(db, 'informesTecnicos'),
        orderBy('creadoEn', 'desc'),
        startAfter(ultimoDoc),
        limit(limiteDocs)
      );
    } else {
      q = query(
        collection(db, 'informesTecnicos'),
        orderBy('creadoEn', 'desc'),
        limit(limiteDocs)
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error obteniendo informes técnicos:', error);
    throw new Error('Error al obtener los informes técnicos');
  }
};

/**
 * Buscar informes por texto
 * @param {string} textoBusqueda - Texto a buscar
 * @param {number} limiteDocs - Límite de documentos
 * @returns {Array} Array de informes encontrados
 */
export const buscarInformes = async (textoBusqueda, limiteDocs = 10) => {
  try {
    const informesRef = collection(db, 'informesTecnicos');
    const querySnapshot = await getDocs(informesRef);
    
    const informes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filtrado en cliente (para búsqueda flexible)
    const informesFiltrados = informes.filter(informe => {
      const textoMin = textoBusqueda.toLowerCase();
      return (
        informe.idInforme?.toLowerCase().includes(textoMin) ||
        informe.remision?.toLowerCase().includes(textoMin) ||
        informe.movil?.toLowerCase().includes(textoMin) ||
        informe.tituloTrabajo?.toLowerCase().includes(textoMin) ||
        informe.tecnico?.toLowerCase().includes(textoMin)
      );
    });
    
    return informesFiltrados
      .sort((a, b) => b.creadoEn?.toDate() - a.creadoEn?.toDate())
      .slice(0, limiteDocs);
  } catch (error) {
    console.error('Error buscando informes:', error);
    throw new Error('Error al buscar informes');
  }
};

/**
 * Obtener un informe técnico por ID
 * @param {string} id - ID del documento
 * @returns {Object|null} Datos del informe o null
 */
export const obtenerInformeTecnico = async (id) => {
  try {
    const docRef = doc(db, 'informesTecnicos', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo informe técnico:', error);
    throw new Error('Error al obtener el informe técnico');
  }
};

/**
 * Actualizar informe técnico
 * @param {string} id - ID del documento
 * @param {Object} datosActualizados - Datos a actualizar
 * @param {string} uid - UID del usuario que actualiza
 * @returns {boolean} True si se actualizó correctamente
 */
export const actualizarInformeTecnico = async (id, datosActualizados, uid) => {
  try {
    const docRef = doc(db, 'informesTecnicos', id);
    
    const datosCompletos = {
      ...datosActualizados,
      actualizadoEn: Timestamp.now(),
      actualizadoPor: uid
    };
    
    await updateDoc(docRef, datosCompletos);
    return true;
  } catch (error) {
    console.error('Error actualizando informe técnico:', error);
    throw new Error('Error al actualizar el informe técnico');
  }
};

/**
 * Eliminar informe técnico
 * @param {string} id - ID del documento a eliminar
 * @returns {boolean} True si se eliminó correctamente
 */
export const eliminarInformeTecnico = async (id) => {
  try {
    const docRef = doc(db, 'informesTecnicos', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error eliminando informe técnico:', error);
    throw new Error('Error al eliminar el informe técnico');
  }
};

// ===== FUNCIONES AUXILIARES =====

/**
 * Normalizar número de móvil según reglas de negocio
 * @param {string} movil - Número de móvil original
 * @returns {string} Número de móvil normalizado
 */
export const normalizarMovil = (movil) => {
  if (!movil) return '';
  
  let movilNormalizado = movil.toString().trim();
  
  // Remover prefijo BO- si existe
  if (movilNormalizado.startsWith('BO-')) {
    movilNormalizado = movilNormalizado.substring(3);
  }
  
  // Si tras remover BO- no inicia por Z70- y es numérico, anteponer Z70-
  if (!movilNormalizado.startsWith('Z70-') && /^\d+$/.test(movilNormalizado)) {
    movilNormalizado = 'Z70-' + movilNormalizado;
  }
  
  return movilNormalizado;
};

/**
 * Generar ID de informe técnico
 * @param {string} remision - Número de remisión
 * @returns {string} ID del informe generado
 */
export const generarIdInforme = (remision) => {
  const ahora = new Date();
  const dia = String(ahora.getDate()).padStart(2, '0');
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const año = ahora.getFullYear();
  
  return `IT-${remision}-${dia}${mes}${año}`;
};

/**
 * Formatear fecha para mostrar en UI y PDF
 * @param {string|Date|Timestamp} fecha - Fecha a formatear
 * @returns {string} Fecha en formato DD/MM/AAAA
 */
export const formatearFecha = (fecha) => {
  if (!fecha) return '';
  
  let fechaObj;
  
  if (typeof fecha === 'string') {
    fechaObj = new Date(fecha);
  } else if (fecha.toDate && typeof fecha.toDate === 'function') {
    // Firebase Timestamp
    fechaObj = fecha.toDate();
  } else if (fecha instanceof Date) {
    fechaObj = fecha;
  } else {
    return '';
  }
  
  if (isNaN(fechaObj.getTime())) return '';
  
  const dia = String(fechaObj.getDate()).padStart(2, '0');
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const año = fechaObj.getFullYear();
  
  return `${dia}/${mes}/${año}`;
};
