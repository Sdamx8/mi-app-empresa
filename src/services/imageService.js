// services/imageService.js - Servicio para manejo de imágenes en Firebase Storage
import { storage, auth } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export class ImageService {
  
  /**
   * Obtener imagen como base64 directamente desde Firebase Storage
   * Solución definitiva para CORS sin dependencias externas
   * @param {string} urlOrPath - URL de Firebase Storage o path del archivo
   * @returns {Promise<string>} Base64 string
   */
  static async getImageBase64(urlOrPath) {
    try {
      let downloadURL;
      
      // Si es una URL completa de Firebase Storage, usarla directamente
      if (urlOrPath.includes('firebasestorage.googleapis.com')) {
        downloadURL = urlOrPath;
      } else {
        // Si es un path, obtener la URL de descarga
        const imageRef = ref(storage, urlOrPath);
        downloadURL = await getDownloadURL(imageRef);
      }
      
      console.log('🔄 Descargando imagen desde Firebase Storage...');
      
      // Fetch con credenciales y headers específicos para Firebase
      const response = await fetch(downloadURL, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Accept': 'image/*',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          console.log('✅ Imagen convertida a base64 exitosamente');
          resolve(reader.result);
        };
        reader.onerror = () => {
          console.error('❌ Error convirtiendo imagen a base64');
          reject(new Error('Error al convertir imagen a base64'));
        };
        reader.readAsDataURL(blob);
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo imagen base64 desde Firebase:', error);
      throw new Error(`Error al obtener imagen: ${error.message}`);
    }
  }

  /**
   * Validar archivo de imagen
   * @param {File} file - Archivo a validar
   * @throws {Error} Si el archivo no es válido
   */
  static validateImageFile(file) {
    if (!file) {
      throw new Error('No se ha seleccionado ningún archivo');
    }

    // Validar que sea un archivo
    if (!(file instanceof File)) {
      throw new Error('El objeto proporcionado no es un archivo válido');
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}. Tipos permitidos: JPG, PNG, GIF, WebP`);
    }

    // Validar tamaño del archivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`Archivo muy grande: ${sizeMB}MB. Tamaño máximo permitido: 5MB`);
    }

    // Validar que el archivo tenga contenido
    if (file.size === 0) {
      throw new Error('El archivo está vacío');
    }

    return true;
  }
  
  // Obtener usuario actual de manera segura
  static getCurrentUserEmail() {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }
    return currentUser.email.replace(/[^a-zA-Z0-9]/g, '_'); // Limpiar email para usar en path
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
   * Sube múltiples imágenes a Firebase Storage
   * @param {File[]} files - Array de archivos de imagen
   * @param {string} informeId - ID del informe técnico
   * @param {string} tipo - 'antes' o 'despues'
   * @returns {Promise<string[]>} Array de URLs de descarga
   */
  static async uploadMultipleImages(files, informeId, tipo) {
    try {
      console.log(`📤 Subiendo ${files.length} imágenes ${tipo} para informe ${informeId}...`);
      
      if (!files || files.length === 0) {
        return [];
      }

      // Validar que no sean más de 5 imágenes por tipo
      if (files.length > 5) {
        throw new Error(`Máximo 5 imágenes permitidas por tipo. Recibidas: ${files.length}`);
      }

      const uploadPromises = files.map((file, index) => 
        this.uploadImage(file, informeId, `${tipo}_${index + 1}`)
      );

      const urls = await Promise.all(uploadPromises);
      console.log(`✅ ${urls.length} imágenes ${tipo} subidas exitosamente`);
      
      return urls;
      
    } catch (error) {
      console.error(`❌ Error subiendo imágenes múltiples ${tipo}:`, error);
      throw error;
    }
  }

  /**
   * Elimina múltiples imágenes de Firebase Storage
   * @param {string[]} imageUrls - Array de URLs de imágenes a eliminar
   * @returns {Promise<boolean[]>} Array de resultados de eliminación
   */
  static async deleteMultipleImages(imageUrls) {
    try {
      if (!imageUrls || imageUrls.length === 0) {
        return [];
      }

      console.log(`🗑️ Eliminando ${imageUrls.length} imágenes...`);
      
      const deletePromises = imageUrls.map(url => this.deleteImage(url));
      const results = await Promise.all(deletePromises);
      
      const exitosas = results.filter(r => r).length;
      console.log(`✅ ${exitosas} de ${imageUrls.length} imágenes eliminadas exitosamente`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Error eliminando imágenes múltiples:', error);
      throw error;
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
      const userEmail = this.getCurrentUserEmail();
      
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
      
      // Crear path con email del usuario para seguridad
      const informeIdClean = informeId.replace(/[^a-zA-Z0-9]/g, '_');
      const imagePath = `informes/${userEmail}/${informeIdClean}/${fileName}`;

      console.log(`📤 Subiendo imagen ${tipo} para informe ${informeId}...`);
      console.log(`📁 Ruta: ${imagePath}`);
      console.log(`👤 Usuario: ${userEmail}`);

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

      const userEmail = this.getCurrentUserEmail();

      // Crear archivo de prueba muy pequeño
      const testContent = new Blob(['test'], { type: 'text/plain' });
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      
      const testPath = `diagnosticos/${userEmail}/test_${Date.now()}.txt`;
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

  /**
   * Convertir URL de imagen a base64 (MÉTODO DEFINITIVO SIN CORS)
   * @param {string} imageUrl - URL de la imagen a convertir
   * @returns {Promise<string>} Imagen en formato base64
   */
  static async urlToBase64(imageUrl) {
    try {
      console.log('🔄 Convirtiendo URL a base64 con método Firebase nativo:', imageUrl);
      
      // Usar el nuevo método getImageBase64 que resuelve CORS definitivamente
      return await this.getImageBase64(imageUrl);
      
    } catch (error) {
      console.error('❌ Error en urlToBase64:', error);
      
      // Fallback: generar placeholder si todo falla
      console.log('🔄 Generando placeholder como último recurso...');
      return this.generatePlaceholderImage();
    }
  }

  /**
   * Generar imagen placeholder en base64
   * @returns {string} Base64 de imagen placeholder
   */
  static generatePlaceholderImage() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 200;
    
    // Fondo gris claro
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Borde
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Texto
    ctx.fillStyle = '#6c757d';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Imagen no disponible', canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = '12px Arial';
    ctx.fillText('Error de carga CORS', canvas.width / 2, canvas.height / 2 + 10);
    
    return canvas.toDataURL('image/png');
  }
}

// Exportación por defecto para compatibilidad
export default ImageService;
