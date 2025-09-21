// informesService.js - Servicio único para toda la lógica Firebase del módulo
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  where,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, auth, storage } from '../firebaseConfig';

/**
 * Buscar remisión por número - Mejorada con múltiples estrategias
 */
export const buscarRemision = async (numeroRemision) => {
  try {
    console.log(`🔍 Buscando remisión: ${numeroRemision}`);
    
    const safeNumeroRemision = String(numeroRemision || "").trim();
    if (!safeNumeroRemision) {
      throw new Error('Número de remisión requerido');
    }

    const numeroLimpio = safeNumeroRemision;
    const remisionesRef = collection(db, 'remisiones');
    
    // Estrategia 1: Búsqueda como string
    console.log(`🔍 Estrategia 1: Búsqueda como string "${numeroLimpio}"`);
    const q1 = query(remisionesRef, where('remision', '==', numeroLimpio));
    const querySnapshot1 = await getDocs(q1);
    
    if (!querySnapshot1.empty) {
      const remisionDoc = querySnapshot1.docs[0];
      const remisionData = remisionDoc.data();
      console.log(`✅ Remisión encontrada (string):`, remisionData);
      return { 
        success: true, 
        data: {
          id: remisionDoc.id,
          ...remisionData
        }
      };
    }

    // Estrategia 2: Búsqueda como número
    if (!isNaN(numeroLimpio)) {
      console.log(`🔍 Estrategia 2: Búsqueda como número ${parseInt(numeroLimpio)}`);
      const q2 = query(remisionesRef, where('remision', '==', parseInt(numeroLimpio)));
      const querySnapshot2 = await getDocs(q2);
      
      if (!querySnapshot2.empty) {
        const remisionDoc = querySnapshot2.docs[0];
        const remisionData = remisionDoc.data();
        console.log(`✅ Remisión encontrada (número):`, remisionData);
        return { 
          success: true, 
          data: {
            id: remisionDoc.id,
            ...remisionData
          }
        };
      }
    }

    // Si no se encuentra con ninguna estrategia
    console.log(`❌ Remisión ${numeroRemision} no encontrada con ninguna estrategia`);
    return { 
      success: false, 
      error: `Remisión ${numeroRemision} no encontrada en la base de datos` 
    };

  } catch (error) {
    console.error('❌ Error buscando remisión:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Buscar servicio por título exacto
 */
export const buscarServicioPorTitulo = async (titulo) => {
  try {
    if (!titulo || titulo.trim() === '') {
      return { success: false, data: null };
    }

    console.log(`🔍 Buscando servicio: "${titulo}"`);
    
    const serviciosRef = collection(db, 'servicios');
    const q = query(serviciosRef, where('título', '==', titulo.trim()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log(`⚠️ Servicio no encontrado: "${titulo}"`);
      return { success: false, data: null };
    }

    const servicioDoc = querySnapshot.docs[0];
    const servicioData = servicioDoc.data();
    
    console.log(`✅ Servicio encontrado:`, servicioData);
    return { 
      success: true, 
      data: {
        id: servicioDoc.id,
        ...servicioData
      }
    };

  } catch (error) {
    console.error('❌ Error buscando servicio:', error);
    return { success: false, data: null };
  }
};

/**
 * Consolidar servicios de una remisión
 */
export const consolidarServicios = async (remisionData) => {
  try {
    console.log('🔄 Consolidando servicios de la remisión...');
    
    const servicios = [];
    const serviciosEncontrados = [];
    
    // Buscar servicios 1-5
    for (let i = 1; i <= 5; i++) {
      const servicioTitulo = remisionData[`servicio${i}`];
      if (servicioTitulo && servicioTitulo.trim() !== '') {
        const resultado = await buscarServicioPorTitulo(servicioTitulo);
        if (resultado.success && resultado.data) {
          serviciosEncontrados.push(resultado.data);
        } else {
          // Servicio no encontrado, crear objeto básico
          serviciosEncontrados.push({
            título: servicioTitulo,
            descripcion_actividad: 'Descripción no disponible',
            materiales_suministrados: 'No especificado',
            recurso_humano_requerido: 'Técnico',
            tiempo_estimado: 1
          });
        }
      }
    }

    // Consolidar datos
    const descripciones = serviciosEncontrados.map(s => s.descripcion_actividad || 'Descripción no disponible');
    const materiales = serviciosEncontrados.map(s => s.materiales_suministrados || 'No especificado');
    const recursos = serviciosEncontrados.map(s => s.recurso_humano_requerido || 'Técnico');
    const tiempoTotal = serviciosEncontrados.reduce((total, s) => total + (s.tiempo_estimado || 1), 0);

    const datosConsolidados = {
      descripciones: descripciones.filter(d => d !== 'Descripción no disponible'),
      materiales: [...new Set(materiales.filter(m => m !== 'No especificado'))], // Eliminar duplicados
      recursos: [...new Set(recursos)], // Eliminar duplicados
      tiempoTotal: {
        horas: Math.floor(tiempoTotal),
        minutos: (tiempoTotal % 1) * 60,
        totalMinutos: tiempoTotal * 60
      }
    };

    console.log('✅ Servicios consolidados:', datosConsolidados);
    return { success: true, data: datosConsolidados, servicios: serviciosEncontrados };

  } catch (error) {
    console.error('❌ Error consolidando servicios:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validar permisos de usuario
 */
export const validarPermisos = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    console.log(`🔒 Validando permisos para: ${currentUser.email}`);
    
    const empleadosRef = collection(db, 'EMPLEADOS');
    const q = query(empleadosRef, where('contacto.correo', '==', currentUser.email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, error: 'Usuario no encontrado en la base de datos' };
    }

    const empleadoDoc = querySnapshot.docs[0];
    const empleadoData = empleadoDoc.data();
    
    const tipoPermitido = ['directivo', 'administrativo'].includes(empleadoData.tipo_empleado);
    
    if (!tipoPermitido) {
      return { 
        success: false, 
        error: `Acceso denegado. Tipo de empleado: ${empleadoData.tipo_empleado}` 
      };
    }

    console.log('✅ Permisos válidos:', empleadoData);
    return { 
      success: true, 
      empleado: empleadoData,
      email: currentUser.email 
    };

  } catch (error) {
    console.error('❌ Error validando permisos:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subir imagen a Firebase Storage
 */
export const subirImagen = async (file, numeroRemision, tipo) => {
  try {
    console.log(`📤 Subiendo imagen: ${file.name}, tipo: ${tipo}`);
    
    // Validaciones
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Use JPG, PNG o WEBP');
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Archivo muy grande. Máximo 10MB permitido');
    }

    // Generar nombre único
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${numeroRemision}_${tipo}_${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    
    // Crear referencia y subir
    const storageRef = ref(storage, `informes/${fileName}`);
    const uploadResult = await uploadBytes(storageRef, file);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    const imageData = {
      name: file.name,
      url: downloadURL,
      storageRef: fileName,
      size: file.size,
      type: file.type,
      uploadedAt: Timestamp.now()
    };

    console.log('✅ Imagen subida exitosamente:', imageData);
    return { success: true, data: imageData };

  } catch (error) {
    console.error('❌ Error subiendo imagen:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar imagen de Firebase Storage
 */
export const eliminarImagen = async (storageRef) => {
  try {
    console.log(`🗑️ Eliminando imagen: ${storageRef}`);
    const imageRef = ref(storage, `informes/${storageRef}`);
    await deleteObject(imageRef);
    console.log('✅ Imagen eliminada exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Guardar informe técnico en Firestore
 */
export const guardarInforme = async (datosInforme) => {
  try {
    console.log('💾 Guardando informe técnico...');
    
    // Validaciones básicas
    if (!datosInforme.numeroRemision) {
      throw new Error('Número de remisión requerido');
    }
    
    if (!datosInforme.elaboradoPor) {
      throw new Error('Campo "elaborado por" requerido');
    }

    // Generar ID único
    const timestamp = Date.now();
    const idInforme = `INF-${datosInforme.numeroRemision}-${timestamp}`;

    // Preparar documento
    const documentoInforme = {
      idInforme,
      numeroRemision: datosInforme.numeroRemision,
      fechaRemision: datosInforme.fechaRemision || new Date().toLocaleDateString('es-CO'),
      movil: datosInforme.movil || '',
      autorizo: datosInforme.autorizo || '',
      tecnico: datosInforme.tecnico || '',
      estado: 'completado',
      tituloTrabajo: datosInforme.tituloTrabajo || '',
      datosConsolidados: datosInforme.datosConsolidados || {},
      imagenesAntes: datosInforme.imagenesAntes || [],
      imagenesDespues: datosInforme.imagenesDespues || [],
      elaboradoPor: datosInforme.elaboradoPor,
      creadoEn: Timestamp.now(),
      remisionEncontrada: datosInforme.remisionEncontrada || null
    };

    // Guardar en Firestore
    const informesRef = collection(db, 'informesTecnicos');
    const docRef = await addDoc(informesRef, documentoInforme);

    console.log('✅ Informe guardado exitosamente:', docRef.id);
    return { 
      success: true, 
      id: docRef.id, 
      idInforme,
      data: documentoInforme 
    };

  } catch (error) {
    console.error('❌ Error guardando informe:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verificar si ya existe un informe para una remisión
 */
export const verificarInformeExistente = async (numeroRemision) => {
  try {
    console.log(`🔍 Verificando informe existente para remisión: ${numeroRemision}`);
    
    const informesRef = collection(db, 'informesTecnicos');
    const q = query(informesRef, where('numeroRemision', '==', numeroRemision.toString()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const informeDoc = querySnapshot.docs[0];
      const informeData = informeDoc.data();
      
      console.log('⚠️ Ya existe un informe para esta remisión:', informeData);
      return { 
        exists: true, 
        data: {
          id: informeDoc.id,
          ...informeData
        }
      };
    }

    return { exists: false };

  } catch (error) {
    console.error('❌ Error verificando informe existente:', error);
    return { exists: false, error: error.message };
  }
};

/**
 * Obtener informe completo por ID
 * @param {string} idInforme - ID del informe
 * @returns {Promise<Object>} - Informe completo
 */
export const obtenerInformePorId = async (idInforme) => {
  try {
    console.log(`🔍 Obteniendo informe por ID: ${idInforme}`);
    
    if (!idInforme || idInforme.trim() === '') {
      throw new Error('ID de informe requerido');
    }

    const informeRef = doc(db, 'informesTecnicos', idInforme);
    const informeSnap = await getDoc(informeRef);
    
    if (!informeSnap.exists()) {
      console.log(`❌ Informe ${idInforme} no encontrado`);
      throw new Error('Informe no encontrado');
    }
    
    const informeData = { id: informeSnap.id, ...informeSnap.data() };
    console.log(`✅ Informe obtenido:`, informeData);
    
    return informeData;
  } catch (error) {
    console.error('❌ Error obteniendo informe:', error);
    throw error;
  }
};