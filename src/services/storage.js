// services/storage.js
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll 
} from 'firebase/storage';
import { storage } from './firebase';

// ===== UPLOAD DE IMÁGENES =====

/**
 * Subir imagen a Storage
 * @param {File} archivo - Archivo de imagen
 * @param {string} remision - Número de remisión
 * @param {string} categoria - 'antes' o 'despues'
 * @returns {Object} Objeto con url y nombre de la imagen
 */
export const subirImagen = async (archivo, remision, categoria) => {
  try {
    if (!archivo || !remision || !categoria) {
      throw new Error('Faltan parámetros requeridos');
    }

    // Validar tipo de archivo
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(archivo.type)) {
      throw new Error('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y WEBP');
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (archivo.size > maxSize) {
      throw new Error('El archivo es demasiado grande. Máximo 5MB permitido');
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const nombreOriginal = archivo.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const nombreArchivo = `${timestamp}_${nombreOriginal}`;

    // Crear referencia en Storage
    const rutaArchivo = `informesTecnicos/${remision}/${categoria}/${nombreArchivo}`;
    const storageRef = ref(storage, rutaArchivo);

    // Subir archivo
    const snapshot = await uploadBytes(storageRef, archivo);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      nombre: nombreArchivo,
      rutaCompleta: rutaArchivo,
      tamaño: archivo.size,
      tipo: archivo.type
    };
  } catch (error) {
    console.error('Error subiendo imagen:', error);
    throw error;
  }
};

/**
 * Subir múltiples imágenes
 * @param {FileList|Array} archivos - Lista de archivos
 * @param {string} remision - Número de remisión
 * @param {string} categoria - 'antes' o 'despues'
 * @param {Function} onProgress - Callback de progreso (opcional)
 * @returns {Array} Array de objetos con datos de las imágenes subidas
 */
export const subirMultiplesImagenes = async (archivos, remision, categoria, onProgress) => {
  try {
    const archivosArray = Array.from(archivos);
    const resultados = [];
    const total = archivosArray.length;

    for (let i = 0; i < archivosArray.length; i++) {
      const archivo = archivosArray[i];
      
      try {
        const resultado = await subirImagen(archivo, remision, categoria);
        resultados.push(resultado);
        
        // Callback de progreso
        if (onProgress) {
          onProgress({
            completadas: i + 1,
            total: total,
            porcentaje: Math.round(((i + 1) / total) * 100),
            archivoActual: archivo.name
          });
        }
      } catch (error) {
        console.error(`Error subiendo archivo ${archivo.name}:`, error);
        // Continuar con el siguiente archivo en caso de error
        resultados.push({
          error: true,
          mensaje: error.message,
          nombreArchivo: archivo.name
        });
      }
    }

    return resultados;
  } catch (error) {
    console.error('Error en subida múltiple:', error);
    throw new Error('Error al subir las imágenes');
  }
};

// ===== ELIMINACIÓN DE IMÁGENES =====

/**
 * Eliminar una imagen específica
 * @param {string} rutaArchivo - Ruta completa del archivo en Storage
 * @returns {boolean} True si se eliminó correctamente
 */
export const eliminarImagen = async (rutaArchivo) => {
  try {
    if (!rutaArchivo) {
      throw new Error('Ruta de archivo requerida');
    }

    const storageRef = ref(storage, rutaArchivo);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error eliminando imagen:', error);
    // Si el archivo no existe, considerar como éxito
    if (error.code === 'storage/object-not-found') {
      console.warn('Archivo no encontrado, se considera eliminado:', rutaArchivo);
      return true;
    }
    throw error;
  }
};

/**
 * Eliminar todas las imágenes de una remisión
 * @param {string} remision - Número de remisión
 * @returns {Object} Resultado de la eliminación
 */
export const eliminarImagenesRemision = async (remision) => {
  try {
    if (!remision) {
      throw new Error('Número de remisión requerido');
    }

    const carpetaRef = ref(storage, `informesTecnicos/${remision}/`);
    let eliminadas = 0;
    let errores = 0;

    try {
      // Listar todos los archivos en la carpeta
      const listaCompleta = await listAll(carpetaRef);
      
      // Eliminar archivos en subcarpetas (antes y despues)
      for (const carpetaItem of listaCompleta.prefixes) {
        const archivosSubcarpeta = await listAll(carpetaItem);
        
        for (const archivo of archivosSubcarpeta.items) {
          try {
            await deleteObject(archivo);
            eliminadas++;
          } catch (error) {
            console.error(`Error eliminando ${archivo.fullPath}:`, error);
            errores++;
          }
        }
      }

      // Eliminar archivos directos en la carpeta principal (si los hay)
      for (const archivo of listaCompleta.items) {
        try {
          await deleteObject(archivo);
          eliminadas++;
        } catch (error) {
          console.error(`Error eliminando ${archivo.fullPath}:`, error);
          errores++;
        }
      }

    } catch (error) {
      // Si la carpeta no existe, es normal
      if (error.code === 'storage/object-not-found') {
        console.warn('Carpeta no encontrada, no hay imágenes que eliminar:', remision);
        return { eliminadas: 0, errores: 0 };
      }
      throw error;
    }

    return { eliminadas, errores };
  } catch (error) {
    console.error('Error eliminando imágenes de remisión:', error);
    throw new Error('Error al eliminar las imágenes de la remisión');
  }
};

// ===== UTILIDADES =====

/**
 * Convertir imagen de URL a dataURL (base64)
 * @param {string} imageUrl - URL de la imagen
 * @returns {string} DataURL de la imagen
 */
export const convertirUrlADataUrl = async (imageUrl) => {
  try {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      };
      
      img.onerror = function(error) {
        console.error('Error cargando imagen:', error);
        reject(new Error('No se pudo cargar la imagen'));
      };
      
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error convirtiendo URL a dataURL:', error);
    throw error;
  }
};

/**
 * Redimensionar imagen si es necesario
 * @param {File} archivo - Archivo de imagen
 * @param {number} maxWidth - Ancho máximo (opcional)
 * @param {number} maxHeight - Alto máximo (opcional)
 * @param {number} quality - Calidad (0-1, opcional)
 * @returns {Blob} Imagen redimensionada
 */
export const redimensionarImagen = async (archivo, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = function() {
      // Calcular nuevas dimensiones manteniendo aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      // Dibujar imagen redimensionada
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Error generando imagen redimensionada'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Error cargando imagen para redimensionar'));

    // Crear URL temporal para la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(archivo);
  });
};

/**
 * Validar archivo de imagen
 * @param {File} archivo - Archivo a validar
 * @returns {Object} Resultado de validación
 */
export const validarImagen = (archivo) => {
  const errores = [];
  
  // Validar tipo
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!tiposPermitidos.includes(archivo.type)) {
    errores.push('Tipo de archivo no permitido. Solo JPG, PNG y WEBP');
  }
  
  // Validar tamaño (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (archivo.size > maxSize) {
    errores.push('Archivo muy grande (máximo 5MB)');
  }
  
  // Validar nombre
  if (archivo.name.length > 100) {
    errores.push('Nombre de archivo muy largo');
  }
  
  return {
    valido: errores.length === 0,
    errores
  };
};
