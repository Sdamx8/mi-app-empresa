/* 
🚀 GLOBAL MOBILITY SOLUTIONS - SERVICIO CARGA DE IMÁGENES
==========================================================
Servicio para subir, gestionar y eliminar imágenes en Firebase Storage
Con soporte para múltiples imágenes y resolución de errores CORS
*/

import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '../firebaseConfig';

class ImageUploadService {
  constructor() {
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  }

  /**
   * Subir múltiples imágenes a Firebase Storage
   */
  async subirImagenes(files, userEmail, informeId, tipo) {
    try {
      console.log(`📤 Subiendo ${files.length} imágenes ${tipo}...`);
      
      const imagenesSubidas = [];
      const timestamp = Date.now();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar archivo
        this.validarArchivo(file);
        
        // Generar nombre único
        const extension = file.name.split('.').pop();
        const nombreUnico = `${tipo}_${i + 1}_${timestamp}_${this.generarId()}.${extension}`;
        
        // Crear ruta en Storage
        const ruta = this.generarRutaStorage(userEmail, informeId, nombreUnico);
        const storageRef = ref(storage, ruta);
        
        console.log(`📁 Subiendo imagen ${i + 1}/${files.length}: ${nombreUnico}`);
        
        // Subir archivo
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        imagenesSubidas.push({
          url,
          nombre: file.name,
          nombreStorage: nombreUnico,
          tamaño: file.size,
          tipo: file.type,
          ruta,
          fechaSubida: new Date()
        });
        
        console.log(`✅ Imagen ${i + 1} subida: ${url}`);
      }
      
      console.log(`✅ ${imagenesSubidas.length} imágenes subidas exitosamente`);
      return imagenesSubidas;
    } catch (error) {
      console.error('❌ Error al subir imágenes:', error);
      throw new Error(`Error al subir las imágenes: ${error.message}`);
    }
  }

  /**
   * Subir una sola imagen
   */
  async subirImagen(file, userEmail, informeId, tipo, indice = 1) {
    try {
      console.log(`📤 Subiendo imagen ${tipo}...`);
      
      this.validarArchivo(file);
      
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const nombreUnico = `${tipo}_${indice}_${timestamp}_${this.generarId()}.${extension}`;
      
      const ruta = this.generarRutaStorage(userEmail, informeId, nombreUnico);
      const storageRef = ref(storage, ruta);
      
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      const imagen = {
        url,
        nombre: file.name,
        nombreStorage: nombreUnico,
        tamaño: file.size,
        tipo: file.type,
        ruta,
        fechaSubida: new Date()
      };
      
      console.log('✅ Imagen subida exitosamente:', url);
      return imagen;
    } catch (error) {
      console.error('❌ Error al subir imagen:', error);
      throw new Error(`Error al subir la imagen: ${error.message}`);
    }
  }

  /**
   * Eliminar imagen de Firebase Storage
   */
  async eliminarImagen(urlImagen) {
    try {
      console.log('🗑️ Eliminando imagen:', urlImagen);
      
      // Extraer la ruta del Storage desde la URL
      const ruta = this.extraerRutaDesdeURL(urlImagen);
      
      if (ruta) {
        const storageRef = ref(storage, ruta);
        await deleteObject(storageRef);
        console.log('✅ Imagen eliminada de Storage exitosamente');
      } else {
        console.warn('⚠️ No se pudo extraer la ruta de la imagen');
      }
    } catch (error) {
      console.error('❌ Error al eliminar imagen:', error);
      throw new Error(`Error al eliminar la imagen: ${error.message}`);
    }
  }

  /**
   * Eliminar múltiples imágenes
   */
  async eliminarImagenes(imagenes) {
    try {
      console.log(`🗑️ Eliminando ${imagenes.length} imágenes...`);
      
      const resultados = [];
      
      for (const imagen of imagenes) {
        try {
          await this.eliminarImagen(imagen.url);
          resultados.push({ url: imagen.url, eliminada: true });
        } catch (error) {
          console.error(`❌ Error al eliminar imagen ${imagen.url}:`, error);
          resultados.push({ url: imagen.url, eliminada: false, error: error.message });
        }
      }
      
      console.log('✅ Proceso de eliminación completado');
      return resultados;
    } catch (error) {
      console.error('❌ Error al eliminar imágenes:', error);
      throw new Error(`Error al eliminar las imágenes: ${error.message}`);
    }
  }

  /**
   * Convertir imagen a base64 para resolver errores CORS
   */
  async convertirABase64(urlImagen) {
    try {
      console.log('🔄 Convirtiendo imagen a base64:', urlImagen);
      
      const response = await fetch(urlImagen);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Error al convertir imagen a base64:', error);
      throw new Error(`Error al procesar la imagen: ${error.message}`);
    }
  }

  /**
   * Convertir múltiples imágenes a base64
   */
  async convertirImagenesABase64(imagenes) {
    try {
      console.log(`🔄 Convirtiendo ${imagenes.length} imágenes a base64...`);
      
      const imagenesBase64 = [];
      
      for (const imagen of imagenes) {
        try {
          const base64 = await this.convertirABase64(imagen.url);
          imagenesBase64.push({
            ...imagen,
            base64
          });
          console.log(`✅ Imagen convertida: ${imagen.nombre}`);
        } catch (error) {
          console.error(`❌ Error al convertir imagen ${imagen.nombre}:`, error);
          // Agregar placeholder en caso de error
          imagenesBase64.push({
            ...imagen,
            base64: this.generarImagenPlaceholder(),
            error: true
          });
        }
      }
      
      console.log(`✅ ${imagenesBase64.length} imágenes procesadas`);
      return imagenesBase64;
    } catch (error) {
      console.error('❌ Error al convertir imágenes:', error);
      throw new Error(`Error al procesar las imágenes: ${error.message}`);
    }
  }

  /**
   * Validar archivo antes de subir
   */
  validarArchivo(file) {
    if (!file) {
      throw new Error('No se proporcionó ningún archivo');
    }

    if (!this.allowedTypes.includes(file.type)) {
      throw new Error(`Tipo de archivo no permitido: ${file.type}. Solo se permiten: ${this.allowedTypes.join(', ')}`);
    }

    if (file.size > this.maxFileSize) {
      const sizeMB = (this.maxFileSize / (1024 * 1024)).toFixed(1);
      throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${sizeMB}MB`);
    }

    return true;
  }

  /**
   * Generar ruta en Storage
   */
  generarRutaStorage(userEmail, informeId, nombreArchivo) {
    const emailLimpio = userEmail.replace(/[@.]/g, '_');
    return `informes/${emailLimpio}/${informeId}/${nombreArchivo}`;
  }

  /**
   * Extraer ruta del Storage desde URL de descarga
   */
  extraerRutaDesdeURL(url) {
    try {
      // Buscar el patrón en la URL de Firebase Storage
      const match = url.match(/o\/(.+?)\?/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
      return null;
    } catch (error) {
      console.error('❌ Error al extraer ruta:', error);
      return null;
    }
  }

  /**
   * Generar ID único
   */
  generarId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Generar imagen placeholder en caso de error
   */
  generarImagenPlaceholder() {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="14">
          Global Mobility Solutions
        </text>
        <text x="50%" y="65%" text-anchor="middle" fill="#6c757d" font-family="Arial" font-size="12">
          Imagen no disponible
        </text>
      </svg>
    `)}`;
  }

  /**
   * Redimensionar imagen si es necesario
   */
  async redimensionarImagen(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo aspecto
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(resolve, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Obtener información del archivo
   */
  obtenerInfoArchivo(file) {
    return {
      nombre: file.name,
      tamaño: file.size,
      tipo: file.type,
      tamañoMB: (file.size / (1024 * 1024)).toFixed(2),
      extension: file.name.split('.').pop().toLowerCase()
    };
  }
}

// Exportar instancia única
export const imageUploadService = new ImageUploadService();
