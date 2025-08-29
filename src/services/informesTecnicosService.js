// services/informesTecnicosService.js - Servicio para gestión de informes técnicos
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { v4 as uuidv4 } from 'uuid';
import ImageService from './imageService';

export class InformesTecnicosService {
  static COLLECTION_NAME = 'informesTecnicos';

  // Generar ID de informe según normatividad ISO
  static generarIdInformeISO(numeroRemision, fechaRemision) {
    try {
      // Convertir fecha a formato ISO (YYYYMMDD)
      let fechaFormateada = '';
      if (fechaRemision) {
        const fecha = new Date(fechaRemision);
        if (!isNaN(fecha.getTime())) {
          fechaFormateada = fecha.toISOString().slice(0, 10).replace(/-/g, '');
        }
      }
      
      // Si no hay fecha válida, usar fecha actual
      if (!fechaFormateada) {
        fechaFormateada = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      }

      // Formato: IT-REMISION-YYYYMMDD (IT = Informe Técnico)
      const idISO = `IT-${numeroRemision}-${fechaFormateada}`;
      return idISO;
    } catch (error) {
      console.error('Error generando ID ISO:', error);
      // Fallback con timestamp
      return `IT-${numeroRemision}-${Date.now()}`;
    }
  }

  // Formatear número de móvil con prefijo Z70-
  static formatearMovil(movil) {
    if (!movil) return '';
    
    const movilStr = String(movil).trim();
    
    // Si ya tiene prefijo Z70- o BO-, no agregar
    if (movilStr.startsWith('Z70-') || movilStr.startsWith('BO-')) {
      return movilStr;
    }
    
    // Agregar prefijo Z70-
    return `Z70-${movilStr}`;
  }

  /**
   * Crear un nuevo informe técnico
   * @param {Object} informeData - Datos del informe
   * @returns {Promise<string>} ID del informe creado
   */
  static async crearInforme(informeData) {
    try {
      console.log('📝 Creando nuevo informe técnico...');
      console.log('📋 Datos recibidos:', informeData);

      // Verificar autenticación
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        console.error('❌ Usuario no autenticado o sin email');
        throw new Error('Usuario no autenticado correctamente');
      }

      console.log('👤 Usuario autenticado:', currentUser.email);

      // Generar ID único para el informe según ISO
      const informeId = this.generarIdInformeISO(informeData.numeroRemision, informeData.fechaRemision);

      // Formatear móvil con prefijo
      const movilFormateado = this.formatearMovil(informeData.movil);

      // Estructura base del informe SIMPLIFICADA
      const informeCompleto = {
        idInforme: informeId,
        numeroRemision: String(informeData.numeroRemision || ''),
        movil: movilFormateado,
        tituloTrabajo: String(informeData.tituloTrabajo || ''),
        ubicacionUNE: String(informeData.ubicacionUNE || ''),
        tecnico: String(informeData.tecnico || ''),
        fechaRemision: String(informeData.fechaRemision || ''),
        autorizadoPor: String(informeData.autorizadoPor || ''),
        elaboradoPor: currentUser.email,
        observaciones: String(informeData.observaciones || ''),
        subtotal: Number(informeData.subtotal || 0),
        total: Number(informeData.total || 0),
        imagenAntesURL: null,
        imagenDespuesURL: null,
        imagenesAntesURLs: null,
        imagenesDespuesURLs: null,
        fechaCreacion: new Date().toISOString(),
        estado: 'activo',
        version: '1'
      };

      console.log('📄 Documento a guardar:', informeCompleto);

      // Guardar en Firestore
      const docRef = await addDoc(
        collection(db, this.COLLECTION_NAME), 
        informeCompleto
      );

      console.log('✅ Informe técnico creado con ID:', docRef.id);
      return { id: docRef.id, informeId };

    } catch (error) {
      console.error('❌ Error creando informe técnico:', error);
      throw new Error(`Error al crear informe: ${error.message}`);
    }
  }

  /**
   * Subir imágenes al informe (múltiples imágenes soportadas)
   * @param {string} informeDocId - ID del documento en Firestore
   * @param {string} informeId - ID único del informe
   * @param {File|File[]} imagenesAntes - Archivo(s) imagen antes
   * @param {File|File[]} imagenesDespues - Archivo(s) imagen después
   */
  static async subirImagenes(informeDocId, informeId, imagenesAntes = null, imagenesDespues = null) {
    try {
      console.log('📷 Procesando imágenes del informe...');

      const urls = {};

      // Convertir a arrays si es necesario
      const antesArray = imagenesAntes ? (Array.isArray(imagenesAntes) ? imagenesAntes : [imagenesAntes]) : [];
      const despuesArray = imagenesDespues ? (Array.isArray(imagenesDespues) ? imagenesDespues : [imagenesDespues]) : [];

      // Procesar imágenes "antes" si existen
      if (antesArray.length > 0) {
        try {
          // Validar cada imagen
          antesArray.forEach(img => ImageService.validateImageFile(img));
          
          if (antesArray.length === 1) {
            // Una sola imagen - mantener compatibilidad
            const imageUrl = await ImageService.uploadImage(antesArray[0], informeId, 'antes');
            urls.imagenAntesURL = imageUrl;
            console.log('✅ Imagen "antes" subida a Firebase Storage');
          } else {
            // Múltiples imágenes
            urls.imagenesAntesURLs = await ImageService.uploadMultipleImages(antesArray, informeId, 'antes');
            console.log('✅ Múltiples imágenes "antes" subidas a Firebase Storage');
          }
        } catch (error) {
          console.error('❌ Error procesando imágenes "antes":', error);
          // No lanzar error aquí - mantener solo URLs en Firestore
          console.log('⚠️ Error procesando imágenes "antes", pero continuando...');
        }
      }

      // Procesar imágenes "después" si existen
      if (despuesArray.length > 0) {
        try {
          // Validar cada imagen
          despuesArray.forEach(img => ImageService.validateImageFile(img));
          
          if (despuesArray.length === 1) {
            // Una sola imagen - mantener compatibilidad
            const imageUrl = await ImageService.uploadImage(despuesArray[0], informeId, 'despues');
            urls.imagenDespuesURL = imageUrl;
            console.log('✅ Imagen "después" subida a Firebase Storage');
          } else {
            // Múltiples imágenes
            urls.imagenesDespuesURLs = await ImageService.uploadMultipleImages(despuesArray, informeId, 'despues');
            console.log('✅ Múltiples imágenes "después" subidas a Firebase Storage');
          }
        } catch (error) {
          console.error('❌ Error procesando imágenes "después":', error);
          // No lanzar error aquí - mantener solo URLs en Firestore
          console.log('⚠️ Error procesando imágenes "después", pero continuando...');
        }
      }

      // Actualizar documento con URLs de imágenes
      if (Object.keys(urls).length > 0) {
        await updateDoc(doc(db, this.COLLECTION_NAME, informeDocId), {
          ...urls,
          'trazabilidad.ultimaModificacion': new Date().toISOString(),
          'trazabilidad.estado': 'completado'
        });

        console.log('✅ Imágenes subidas y URLs guardadas');
      }

      return urls;

    } catch (error) {
      console.error('❌ Error subiendo imágenes:', error);
      throw new Error(`Error al subir imágenes: ${error.message}`);
    }
  }

  /**
   * Obtener todos los informes técnicos del usuario autenticado
   * @returns {Promise<Array>} Lista de informes
   */
  static async obtenerInformes() {
    try {
      console.log('📋 Obteniendo informes técnicos...');

      // Verificar autenticación
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Consulta simple por elaboradoPor (sin orderBy para evitar índice compuesto)
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('elaboradoPor', '==', currentUser.email) // FILTRAR POR EMAIL
      );

      const querySnapshot = await getDocs(q);
      const informes = [];

      querySnapshot.forEach((doc) => {
        informes.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Ordenar por fecha en el cliente
      informes.sort((a, b) => {
        const fechaA = new Date(a.fechaCreacion || 0);
        const fechaB = new Date(b.fechaCreacion || 0);
        return fechaB - fechaA; // Orden descendente
      });

      console.log(`✅ ${informes.length} informes obtenidos para correo: ${currentUser.email}`);
      return informes;

    } catch (error) {
      console.error('❌ Error obteniendo informes:', error);
      throw new Error(`Error al obtener informes: ${error.message}`);
    }
  }

  /**
   * Obtener informe por número de remisión (solo del usuario autenticado)
   * @param {string} numeroRemision - Número de remisión
   * @returns {Promise<Object|null>} Informe encontrado o null
   */
  static async obtenerInformePorRemision(numeroRemision) {
    try {
      console.log(`🔍 Buscando informe para remisión: ${numeroRemision}`);

      // Verificar autenticación
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Consulta simple por elaboradoPor primero
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('elaboradoPor', '==', currentUser.email) // FILTRAR POR EMAIL
      );

      const querySnapshot = await getDocs(q);
      
      // Filtrar por número de remisión en el cliente
      let informeEncontrado = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.numeroRemision == numeroRemision) {
          informeEncontrado = {
            id: doc.id,
            ...data
          };
        }
      });

      return informeEncontrado;

    } catch (error) {
      console.error('❌ Error buscando informe:', error);
      throw new Error(`Error al buscar informe: ${error.message}`);
    }
  }

  /**
   * Obtener datos de una remisión para prellenar el informe
   * @param {string} numeroRemision - Número de remisión
   * @returns {Promise<Object>} Datos de la remisión
   */
  static async obtenerDatosRemision(numeroRemision) {
    try {
      console.log(`🔍 Obteniendo datos de remisión: ${numeroRemision}`);

      // Obtener todos los documentos de remisiones y filtrar
      const remisionesRef = collection(db, 'remisiones');
      const querySnapshot = await getDocs(remisionesRef);
      
      if (querySnapshot.empty) {
        throw new Error('No hay remisiones en la base de datos');
      }

      console.log(`📋 Total de remisiones en base de datos: ${querySnapshot.size}`);

      // Buscar la remisión específica
      let remisionEncontrada = null;
      const numeroRemisionStr = String(numeroRemision).trim().toUpperCase();

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const remisionDoc = String(data.remision || '').trim().toUpperCase();
        
        console.log(`🔍 Comparando: "${remisionDoc}" con "${numeroRemisionStr}"`);
        
        if (remisionDoc === numeroRemisionStr) {
          remisionEncontrada = { id: doc.id, ...data };
          console.log('✅ Remisión encontrada:', remisionEncontrada);
        }
      });

      if (!remisionEncontrada) {
        // Mostrar las primeras 5 remisiones para debug
        const remisionesDisponibles = [];
        querySnapshot.forEach((doc) => {
          remisionesDisponibles.push(doc.data().remision);
        });
        
        console.log('❌ Remisiones disponibles (primeras 10):', remisionesDisponibles.slice(0, 10));
        throw new Error(`No se encontró la remisión ${numeroRemision}. Verifique que el número sea correcto.`);
      }

      // Formatear fecha de remisión
      let fechaRemision = 'Sin fecha';
      if (remisionEncontrada.fecha_remision) {
        if (typeof remisionEncontrada.fecha_remision === 'object' && remisionEncontrada.fecha_remision.seconds) {
          // Timestamp de Firebase
          fechaRemision = new Date(remisionEncontrada.fecha_remision.seconds * 1000).toLocaleDateString('es-ES');
        } else if (typeof remisionEncontrada.fecha_remision === 'string') {
          fechaRemision = remisionEncontrada.fecha_remision;
        }
      }

      return {
        numeroRemision: remisionEncontrada.remision,
        tecnico: remisionEncontrada.tecnico || 'No asignado',
        fechaRemision: fechaRemision,
        autorizadoPor: remisionEncontrada.autorizo || remisionEncontrada.autorizado_por || remisionEncontrada.autorizadoPor || 'No especificado', // CORREGIDO: usar "autorizo"
        movil: remisionEncontrada.movil || 'Sin móvil',
        une: remisionEncontrada.une || 'Sin UNE especificada', // NUEVO: Campo UNE
        subtotal: remisionEncontrada.subtotal || 0, // NUEVO: Subtotal
        total: remisionEncontrada.total || 0, // NUEVO: Total
        // Datos adicionales que podrían ser útiles
        observaciones: remisionEncontrada.observaciones || '',
        cliente: remisionEncontrada.cliente || 'Sin cliente'
      };

    } catch (error) {
      console.error('❌ Error obteniendo datos de remisión:', error);
      throw error;
    }
  }

  /**
   * Actualizar un informe técnico
   * @param {string} informeId - ID del informe
   * @param {Object} datosActualizados - Datos a actualizar
   */
  static async actualizarInforme(informeId, datosActualizados) {
    try {
      console.log(`📝 Actualizando informe: ${informeId}`);

      const updateData = {
        ...datosActualizados,
        'trazabilidad.ultimaModificacion': new Date().toISOString()
      };

      await updateDoc(doc(db, this.COLLECTION_NAME, informeId), updateData);
      
      console.log('✅ Informe actualizado exitosamente');

    } catch (error) {
      console.error('❌ Error actualizando informe:', error);
      throw new Error(`Error al actualizar informe: ${error.message}`);
    }
  }

  /**
   * Eliminar un informe técnico
   * @param {string} informeId - ID del informe
   * @param {string} imagenAntesURL - URL imagen antes
   * @param {string} imagenDespuesURL - URL imagen después
   */
  static async eliminarInforme(informeId, imagenAntesURL, imagenDespuesURL) {
    try {
      console.log(`🗑️ Eliminando informe: ${informeId}`);

      // Eliminar imágenes del Storage
      if (imagenAntesURL) {
        await ImageService.deleteImage(imagenAntesURL);
      }
      if (imagenDespuesURL) {
        await ImageService.deleteImage(imagenDespuesURL);
      }

      // Eliminar documento de Firestore
      await deleteDoc(doc(db, this.COLLECTION_NAME, informeId));
      
      console.log('✅ Informe eliminado exitosamente');

    } catch (error) {
      console.error('❌ Error eliminando informe:', error);
      throw new Error(`Error al eliminar informe: ${error.message}`);
    }
  }

  /**
   * Generar firma digital basada en el usuario autenticado
   * @param {Object} user - Usuario autenticado
   * @param {Object} informeData - Datos del informe
   * @returns {Object} Firma digital
   */
  static generarFirmaDigital(user, informeData) {
    const timestamp = new Date().toISOString();
    
    return {
      usuario: {
        email: user.email,
        uid: user.uid,
        displayName: user.displayName || user.email
      },
      timestamp,
      hash: btoa(`${user.uid}:${informeData.numeroRemision}:${timestamp}`),
      valida: true
    };
  }
  /**
   * Modificar un informe técnico existente
   * @param {string} informeId - ID del informe a modificar
   * @param {Object} datosActualizados - Nuevos datos del informe
   * @param {File|File[]} imagenAntes - Nueva(s) imagen(es) antes (opcional)
   * @param {File|File[]} imagenDespues - Nueva(s) imagen(es) después (opcional)
   * @returns {Promise<Object>} Resultado de la modificación
   */
  static async modificarInforme(informeId, datosActualizados, imagenAntes = null, imagenDespues = null) {
    try {
      console.log(`📝 Modificando informe: ${informeId}`);

      // Verificar autenticación
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Usuario no autenticado');
      }

      // Obtener el informe actual para preservar datos existentes
      const informeActual = await this.obtenerInformePorId(informeId);
      if (!informeActual) {
        throw new Error('Informe no encontrado');
      }

      // Verificar que el usuario actual sea el propietario
      if (informeActual.elaboradoPor !== currentUser.email) {
        throw new Error('No tienes permisos para modificar este informe');
      }

      // Preparar datos actualizados con metadatos
      const datosConMetadata = {
        ...datosActualizados,
        elaboradoPor: currentUser.email, // Asegurar que el email sea correcto
        'trazabilidad.ultimaModificacion': new Date().toISOString(),
        'trazabilidad.modificadoPor': currentUser.email,
        'trazabilidad.version': String((parseInt(informeActual.trazabilidad?.version || '1') + 1))
      };

      // Subir nuevas imágenes si se proporcionan
      const urls = {};
      
      // Procesar imágenes "antes"
      if (imagenAntes) {
        const antesArray = Array.isArray(imagenAntes) ? imagenAntes : [imagenAntes];
        
        // Eliminar imágenes anteriores
        if (informeActual.imagenAntesURL) {
          await ImageService.deleteImage(informeActual.imagenAntesURL);
        }
        if (informeActual.imagenesAntesURLs) {
          await ImageService.deleteMultipleImages(informeActual.imagenesAntesURLs);
        }
        
        // Validar y subir nuevas imágenes
        antesArray.forEach(img => ImageService.validateImageFile(img));
        
        if (antesArray.length === 1) {
          urls.imagenAntesURL = await ImageService.uploadImage(antesArray[0], informeId, 'antes');
          urls.imagenesAntesURLs = null; // Limpiar campo múltiple
        } else {
          urls.imagenesAntesURLs = await ImageService.uploadMultipleImages(antesArray, informeId, 'antes');
          urls.imagenAntesURL = null; // Limpiar campo único
        }
      }

      // Procesar imágenes "después"
      if (imagenDespues) {
        const despuesArray = Array.isArray(imagenDespues) ? imagenDespues : [imagenDespues];
        
        // Eliminar imágenes anteriores
        if (informeActual.imagenDespuesURL) {
          await ImageService.deleteImage(informeActual.imagenDespuesURL);
        }
        if (informeActual.imagenesDespuesURLs) {
          await ImageService.deleteMultipleImages(informeActual.imagenesDespuesURLs);
        }
        
        // Validar y subir nuevas imágenes
        despuesArray.forEach(img => ImageService.validateImageFile(img));
        
        if (despuesArray.length === 1) {
          urls.imagenDespuesURL = await ImageService.uploadImage(despuesArray[0], informeId, 'despues');
          urls.imagenesDespuesURLs = null; // Limpiar campo múltiple
        } else {
          urls.imagenesDespuesURLs = await ImageService.uploadMultipleImages(despuesArray, informeId, 'despues');
          urls.imagenDespuesURL = null; // Limpiar campo único
        }
      }

      // Combinar datos actualizados con nuevas URLs de imágenes
      const datosFinales = { ...datosConMetadata, ...urls };

      // Actualizar documento en Firestore
      await updateDoc(doc(db, this.COLLECTION_NAME, informeId), datosFinales);

      console.log('✅ Informe modificado exitosamente');
      return {
        success: true,
        message: 'Informe modificado exitosamente',
        informeId: informeId,
        datosActualizados: datosFinales
      };

    } catch (error) {
      console.error('❌ Error modificando informe:', error);
      throw new Error(`Error al modificar informe: ${error.message}`);
    }
  }

  /**
   * Obtener un informe técnico por ID
   * @param {string} informeId - ID del informe
   * @returns {Promise<Object>} Datos del informe
   */
  static async obtenerInformePorId(informeId) {
    try {
      console.log(`📄 Obteniendo informe por ID: ${informeId}`);
      
      const docRef = doc(db, this.COLLECTION_NAME, informeId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        console.log('✅ Informe encontrado');
        return data;
      } else {
        console.log('❌ Informe no encontrado');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo informe:', error);
      throw new Error(`Error al obtener informe: ${error.message}`);
    }
  }

  /**
   * Exportar informe directamente a PDF
   * @param {string} informeId - ID del informe a exportar
   * @returns {Promise<void>} PDF descargado
   */
  static async exportarInformePDF(informeId) {
    try {
      console.log(`📄 Exportando informe a PDF: ${informeId}`);
      
      // Obtener datos del informe
      const informeData = await this.obtenerInformePorId(informeId);
      if (!informeData) {
        throw new Error('Informe no encontrado');
      }

      console.log('📊 Datos del informe obtenidos:', informeData);

      // ✅ NUEVO: Generar base64 para PDF (no guardado en Firestore)
      console.log('🖼️ Generando imágenes base64 para PDF...');
      const base64Data = await this.generarBase64ParaPDF(informeData.id);
      
      // Combinar datos del informe con base64 generado
      const informeConBase64 = {
        ...informeData,
        ...base64Data
      };
      
      console.log('🔍 Verificando datos disponibles para PDF:');
      console.log('   imagenAntesURL:', !!informeConBase64.imagenAntesURL);
      console.log('   imagenAntesBase64:', !!informeConBase64.imagenAntesBase64);
      console.log('   imagenesAntesURLs:', !!informeConBase64.imagenesAntesURLs);
      console.log('   imagenesAntesBase64:', !!informeConBase64.imagenesAntesBase64);
      console.log('   imagenDespuesURL:', !!informeConBase64.imagenDespuesURL);
      console.log('   imagenDespuesBase64:', !!informeConBase64.imagenDespuesBase64);
      console.log('   imagenesDespuesURLs:', !!informeConBase64.imagenesDespuesURLs);
      console.log('   imagenesDespuesBase64:', !!informeConBase64.imagenesDespuesBase64);

      // Importar servicio PDF dinámicamente
      const { PDFService } = await import('./pdfService.js');
      
      // ✅ CORREGIDO: Pasar informeData con base64 generado dinámicamente
      await PDFService.generarYDescargarInforme(informeConBase64, {});
      
      console.log('✅ PDF exportado exitosamente');
      return { success: true, message: 'PDF exportado exitosamente' };
      
    } catch (error) {
      console.error('❌ Error exportando PDF:', error);
      throw new Error(`Error al exportar PDF: ${error.message}`);
    }
  }

  /**
   * Generar base64 de imágenes SOLO para PDFs (no guarda en Firestore)
   * Esta función resuelve el problema de límite de 1MB en Firestore
   * @param {string} informeDocId - ID del documento del informe
   * @returns {Promise<Object>} Objeto con base64 de imágenes para PDF
   */
  static async generarBase64ParaPDF(informeDocId) {
    try {
      console.log('🖼️ Generando base64 para PDF del informe:', informeDocId);
      
      // Obtener datos del informe desde Firestore
      const informeDoc = await getDoc(doc(db, this.COLLECTION_NAME, informeDocId));
      if (!informeDoc.exists()) {
        throw new Error('Informe no encontrado');
      }
      
      const informeData = informeDoc.data();
      const base64Data = {};
      
      // ✅ NUEVA ESTRATEGIA: Procesar imágenes secuencialmente con mejor manejo de errores
      
      // Generar base64 desde URLs de Firebase Storage - imagen individual "antes"
      if (informeData.imagenAntesURL) {
        try {
          console.log('🔄 Convirtiendo imagen "antes" con método Firebase nativo...');
          base64Data.imagenAntesBase64 = await ImageService.getImageBase64(informeData.imagenAntesURL);
          console.log('✅ Base64 "antes" generado exitosamente sin CORS');
        } catch (error) {
          console.warn('⚠️ No se pudo generar base64 "antes":', error.message);
          base64Data.imagenAntesBase64 = ImageService.generatePlaceholderImage();
        }
      }
      
      // Imagen individual "después"
      if (informeData.imagenDespuesURL) {
        try {
          console.log('🔄 Convirtiendo imagen "después" con método Firebase nativo...');
          base64Data.imagenDespuesBase64 = await ImageService.getImageBase64(informeData.imagenDespuesURL);
          console.log('✅ Base64 "después" generado exitosamente sin CORS');
        } catch (error) {
          console.warn('⚠️ No se pudo generar base64 "después":', error.message);
          base64Data.imagenDespuesBase64 = ImageService.generatePlaceholderImage();
        }
      }
      
      // Imágenes múltiples "antes" - procesamiento secuencial
      if (informeData.imagenesAntesURLs && Array.isArray(informeData.imagenesAntesURLs)) {
        console.log(`🔄 Procesando ${informeData.imagenesAntesURLs.length} imágenes "antes"...`);
        base64Data.imagenesAntesBase64 = [];
        
        for (let i = 0; i < informeData.imagenesAntesURLs.length; i++) {
          try {
            const url = informeData.imagenesAntesURLs[i];
            console.log(`📸 Procesando imagen antes ${i + 1}/${informeData.imagenesAntesURLs.length}`);
            const base64 = await ImageService.getImageBase64(url);
            base64Data.imagenesAntesBase64.push(base64);
            console.log(`✅ Imagen antes ${i + 1} convertida exitosamente sin CORS`);
            
            // Pequeña pausa para evitar sobrecargar Firebase
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.warn(`⚠️ Error procesando imagen antes ${i + 1}:`, error.message);
            // Agregar placeholder en lugar de saltar la imagen
            base64Data.imagenesAntesBase64.push(ImageService.generatePlaceholderImage());
          }
        }
        
        console.log(`✅ ${base64Data.imagenesAntesBase64.length} de ${informeData.imagenesAntesURLs.length} imágenes "antes" procesadas`);
      }
      
      // Imágenes múltiples "después" - procesamiento secuencial
      if (informeData.imagenesDespuesURLs && Array.isArray(informeData.imagenesDespuesURLs)) {
        console.log(`🔄 Procesando ${informeData.imagenesDespuesURLs.length} imágenes "después"...`);
        base64Data.imagenesDespuesBase64 = [];
        
        for (let i = 0; i < informeData.imagenesDespuesURLs.length; i++) {
          try {
            const url = informeData.imagenesDespuesURLs[i];
            console.log(`📸 Procesando imagen después ${i + 1}/${informeData.imagenesDespuesURLs.length}`);
            const base64 = await ImageService.getImageBase64(url);
            base64Data.imagenesDespuesBase64.push(base64);
            console.log(`✅ Imagen después ${i + 1} convertida exitosamente sin CORS`);
            
            // Pequeña pausa para evitar sobrecargar Firebase
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.warn(`⚠️ Error procesando imagen después ${i + 1}:`, error.message);
            // Agregar placeholder en lugar de saltar la imagen
            base64Data.imagenesDespuesBase64.push(ImageService.generatePlaceholderImage());
          }
        }
        
        console.log(`✅ ${base64Data.imagenesDespuesBase64.length} de ${informeData.imagenesDespuesURLs.length} imágenes "después" procesadas`);
      }
      
      // Resumen final
      console.log('🎯 Resumen final de conversión base64:', {
        antesIndividual: !!base64Data.imagenAntesBase64,
        antesMultiples: base64Data.imagenesAntesBase64?.length || 0,
        despuesIndividual: !!base64Data.imagenDespuesBase64,
        despuesMultiples: base64Data.imagenesDespuesBase64?.length || 0
      });
      
      return base64Data;
      
    } catch (error) {
      console.error('❌ Error generando base64 para PDF:', error);
      return {
        imagenAntesBase64: null,
        imagenesAntesBase64: [],
        imagenDespuesBase64: null,
        imagenesDespuesBase64: []
      };
    }
  }
}

export default InformesTecnicosService;
