// services/imageService.js - Servicio para manejo de imágenes en Firebase Storage
import { storage, auth } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export class ImageService {
  
  // Obtener usuario actual de manera segura
  static getCurrentUserId() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    return currentUser.uid;
  }
  
  // Inicializar y diagnosticar Storage al cargar el servicio
  static async initialize() {
    try {
      console.log('🔧 Inicializando servicio de imágenes...');
      const result = await this.diagnosticarStorage();
      if (!result) {
        console.warn('⚠️ Hay problemas con Firebase Storage');
      }
      return result;
    } catch (error) {
      console.error('❌ Error inicializando ImageService:', error);
      return false;
    }
  }
  
  /**
   * Sube una imagen a Firebase Storage
   * @param {File} file - Archivo de imagen
   * @param {string} informeId - ID del informe técnico
   * @param {string} tipo - 'antes' o 'despues'
   * @returns {Promise<string>} URL de descarga de la imagen
   */
  static async uploadImage(file, informeId, tipo) {
    try {
      // Validar autenticación
      const userId = this.getCurrentUserId();
      
      // Validar archivo
      if (!file || !file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen válida');
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('La imagen debe ser menor a 5MB');
      }

      // Generar nombre único para la imagen (sin caracteres especiales)
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const timestamp = Date.now();
      const uuid = uuidv4().replace(/-/g, ''); // Remover guiones del UUID
      const fileName = `${tipo}_${timestamp}_${uuid}.${fileExtension}`;
      
      // Crear path con userId para seguridad
      const informeIdClean = informeId.replace(/[^a-zA-Z0-9]/g, '_');
      const imagePath = `informes/${userId}/${informeIdClean}/${fileName}`;

      console.log(`📤 Subiendo imagen ${tipo} para informe ${informeId}...`);
      console.log(`📁 Ruta: ${imagePath}`);
      console.log(`👤 Usuario: ${userId}`);

      // Crear referencia en Storage
      const imageRef = ref(storage, imagePath);

      // Subir imagen con manejo de errores específico
      try {
        const snapshot = await uploadBytes(imageRef, file);
        console.log(`✅ Imagen ${tipo} subida exitosamente`);
        
        // Obtener URL de descarga
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log(`🔗 URL obtenida:`, downloadURL);
        
        return downloadURL;
        
      } catch (uploadError) {
        console.error(`❌ Error en uploadBytes:`, uploadError);
        
        // Si el error es de CORS, usar fallback base64
        if (uploadError.code === 'storage/unknown' || uploadError.message.includes('CORS') || uploadError.message.includes('ERR_FAILED')) {
          console.log('🔄 Fallback: usando base64 temporal...');
          
          const base64Url = await this.generatePreview(file);
          console.log(`✅ Imagen ${tipo} convertida a base64 (fallback)`);
          return base64Url;
          
        } else {
          throw uploadError;
        }
      }

    } catch (error) {
      console.error(`❌ Error subiendo imagen ${tipo}:`, error);
      
      // Fallback final: convertir a base64 para continuar funcionando
      try {
        console.log('🔄 Aplicando fallback base64 por error general...');
        const base64Url = await this.generatePreview(file);
        console.log(`✅ Imagen ${tipo} convertida a base64 (fallback de emergencia)`);
        return base64Url;
      } catch (fallbackError) {
        console.error('❌ Error en fallback base64:', fallbackError);
        throw new Error(`No se pudo procesar la imagen: ${error.message}`);
      }
    }
  }

  /**
   * Genera una vista previa en base64 de una imagen
   * @param {File} file - Archivo de imagen
   * @returns {Promise<string>} URL en base64
   */
  static async generatePreview(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        resolve(reader.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convierte una imagen a base64 con redimensionamiento opcional
   * @param {File} file - Archivo de imagen
   * @param {number} maxWidth - Ancho máximo (opcional)
   * @param {number} maxHeight - Alto máximo (opcional)
   * @returns {Promise<string>} URL en base64
   */
  static async convertToBase64(file, maxWidth = 800, maxHeight = 600) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calcular dimensiones manteniendo proporción
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      };

      img.onerror = () => {
        reject(new Error('Error al cargar la imagen'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Elimina una imagen de Firebase Storage
   * @param {string} imageUrl - URL de la imagen a eliminar
   * @returns {Promise<boolean>} true si se eliminó exitosamente
   */
  static async deleteImage(imageUrl) {
    try {
      if (!imageUrl || typeof imageUrl !== 'string') {
        console.warn('⚠️ URL de imagen inválida para eliminar');
        return false;
      }

      // Si es una imagen base64, no hay nada que eliminar de Storage
      if (imageUrl.startsWith('data:')) {
        console.log('📝 Imagen base64, no requiere eliminación de Storage');
        return true;
      }

      // Verificar que sea una URL de Firebase Storage
      if (!imageUrl.includes('firebasestorage.googleapis.com') && !imageUrl.includes('storage.googleapis.com')) {
        console.warn('⚠️ URL no es de Firebase Storage, omitiendo eliminación');
        return false;
      }

      console.log('🗑️ Eliminando imagen de Storage:', imageUrl);

      // Crear referencia desde URL
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      
      console.log('✅ Imagen eliminada de Storage exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      
      // Si el archivo no existe, considerarlo como éxito
      if (error.code === 'storage/object-not-found') {
        console.log('ℹ️ La imagen ya no existe en Storage');
        return true;
      }
      
      return false;
    }
  }

  /**
   * Diagnostica el estado de Firebase Storage
   * @returns {Promise<boolean>} true si Storage está funcionando
   */
  static async diagnosticarStorage() {
    try {
      console.log('🔍 Diagnosticando Firebase Storage...');
      
      // Verificar autenticación
      if (!auth.currentUser) {
        console.warn('⚠️ Usuario no autenticado para diagnóstico');
        return false;
      }

      // Crear archivo de prueba muy pequeño
      const testContent = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      
      const testPath = `diagnosticos/${auth.currentUser.uid}/test_${Date.now()}.txt`;
      const testRef = ref(storage, testPath);

      // Intentar subir archivo de prueba
      const snapshot = await uploadBytes(testRef, testFile);
      console.log('✅ Upload test exitoso');

      // Intentar obtener URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('✅ Download URL obtenida');

      // Limpiar archivo de prueba
      try {
        await deleteObject(testRef);
        console.log('✅ Archivo de prueba eliminado');
      } catch (cleanupError) {
        console.warn('⚠️ No se pudo eliminar archivo de prueba:', cleanupError);
      }

      console.log('🎉 Firebase Storage funcionando correctamente');
      return true;

    } catch (error) {
      console.error('❌ Error en diagnóstico de Storage:', error);
      
      if (error.code === 'storage/unknown' || error.message.includes('CORS')) {
        console.error('🚫 Error de CORS detectado - Storage no accesible desde localhost');
      }
      
      return false;
    }
  }

  /**
   * Obtiene información de una imagen
   * @param {string} imageUrl - URL de la imagen
   * @returns {Promise<Object>} Información de la imagen
   */
  static async getImageInfo(imageUrl) {
    try {
      if (imageUrl.startsWith('data:')) {
        return {
          type: 'base64',
          size: 'unknown',
          source: 'local'
        };
      }

      if (imageUrl.includes('firebasestorage.googleapis.com')) {
        return {
          type: 'firebase',
          size: 'unknown',
          source: 'storage'
        };
      }

      return {
        type: 'external',
        size: 'unknown',
        source: 'external'
      };

    } catch (error) {
      console.error('Error obteniendo info de imagen:', error);
      return {
        type: 'unknown',
        size: 'unknown',
        source: 'unknown'
      };
    }
  }
}
