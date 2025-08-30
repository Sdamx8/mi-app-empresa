// components/InformesTecnicos/UploaderDespues.jsx
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  FileImage,
  Trash2,
  Eye
} from 'lucide-react';
import { subirMultiplesImagenes, eliminarImagen, validarImagen } from '../../services/storage';
import './InformesTecnicos.css';

/**
 * Componente para cargar imágenes DESPUÉS del servicio
 */
const UploaderDespues = ({ 
  remision, 
  imagenesIniciales = [], 
  onChange, 
  disabled = false,
  maxImagenes = 10 
}) => {
  const [imagenes, setImagenes] = useState(imagenesIniciales);
  const [subiendo, setSubiendo] = useState(false);
  const [progreso, setProgreso] = useState({ completadas: 0, total: 0, porcentaje: 0 });
  const [error, setError] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);
  const inputFileRef = useRef(null);

  // Manejar cambios en imágenes
  const actualizarImagenes = (nuevasImagenes) => {
    setImagenes(nuevasImagenes);
    if (onChange) {
      onChange(nuevasImagenes);
    }
  };

  // Validar archivos antes de subir
  const validarArchivos = (archivos) => {
    const errores = [];
    const archivosValidos = [];

    for (let archivo of archivos) {
      const validacion = validarImagen(archivo);
      if (validacion.valido) {
        archivosValidos.push(archivo);
      } else {
        errores.push(`${archivo.name}: ${validacion.errores.join(', ')}`);
      }
    }

    return { archivosValidos, errores };
  };

  // Subir archivos
  const subirArchivos = async (archivos) => {
    if (!remision) {
      setError('Se requiere número de remisión para subir imágenes');
      return;
    }

    if (imagenes.length + archivos.length > maxImagenes) {
      setError(`Máximo ${maxImagenes} imágenes permitidas. Tienes ${imagenes.length} y estás intentando subir ${archivos.length} más.`);
      return;
    }

    const { archivosValidos, errores } = validarArchivos(archivos);

    if (errores.length > 0) {
      setError(`Archivos no válidos:\n${errores.join('\n')}`);
      if (archivosValidos.length === 0) return;
    }

    setSubiendo(true);
    setError(null);

    try {
      const resultados = await subirMultiplesImagenes(
        archivosValidos,
        remision,
        'despues', // Categoría DESPUÉS
        (progreso) => {
          setProgreso(progreso);
        }
      );

      // Filtrar solo resultados exitosos
      const imagenesExitosas = resultados.filter(r => !r.error);
      const imagenesError = resultados.filter(r => r.error);

      if (imagenesError.length > 0) {
        console.warn('Algunas imágenes no se pudieron subir:', imagenesError);
        setError(`${imagenesError.length} imagen(es) no se pudieron subir`);
      }

      // Agregar imágenes exitosas al estado
      const nuevasImagenes = [...imagenes, ...imagenesExitosas];
      actualizarImagenes(nuevasImagenes);

    } catch (err) {
      console.error('Error subiendo imágenes DESPUÉS:', err);
      setError(err.message || 'Error al subir las imágenes');
    } finally {
      setSubiendo(false);
      setProgreso({ completadas: 0, total: 0, porcentaje: 0 });
    }
  };

  // Eliminar imagen
  const eliminarImagenLocal = async (index) => {
    const imagen = imagenes[index];
    
    try {
      // Si tiene rutaCompleta, eliminar de Storage
      if (imagen.rutaCompleta) {
        await eliminarImagen(imagen.rutaCompleta);
      }

      const nuevasImagenes = imagenes.filter((_, i) => i !== index);
      actualizarImagenes(nuevasImagenes);
      
    } catch (err) {
      console.error('Error eliminando imagen:', err);
      // Eliminar del estado local aunque falle en Storage
      const nuevasImagenes = imagenes.filter((_, i) => i !== index);
      actualizarImagenes(nuevasImagenes);
    }
  };

  // Manejadores de eventos
  const handleFileSelect = (e) => {
    const archivos = Array.from(e.target.files);
    if (archivos.length > 0) {
      subirArchivos(archivos);
    }
    // Limpiar input
    if (inputFileRef.current) {
      inputFileRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled && !subiendo) {
      setArrastrando(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setArrastrando(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    
    if (disabled || subiendo) return;

    const archivos = Array.from(e.dataTransfer.files);
    if (archivos.length > 0) {
      subirArchivos(archivos);
    }
  };

  const abrirSelector = () => {
    if (inputFileRef.current) {
      inputFileRef.current.click();
    }
  };

  // Vista previa de imagen
  const [imagenPrevia, setImagenPrevia] = useState(null);

  const mostrarPrevia = (imagen) => {
    setImagenPrevia(imagen);
  };

  const cerrarPrevia = () => {
    setImagenPrevia(null);
  };

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Camera className="w-5 h-5 text-green-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">
            Evidencias DESPUÉS
          </h4>
          <span className="ml-2 text-sm text-gray-500">
            ({imagenes.length}/{maxImagenes})
          </span>
        </div>
        {imagenes.length > 0 && (
          <span className="text-sm text-green-600 font-medium">
            ✓ {imagenes.length} imagen(es) cargada(s)
          </span>
        )}
      </div>

      {/* Zona de carga */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-300
          ${arrastrando 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled || subiendo 
            ? 'opacity-50 cursor-not-allowed bg-gray-50' 
            : 'cursor-pointer hover:bg-gray-50'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!disabled && !subiendo ? abrirSelector : undefined}
      >
        <input
          ref={inputFileRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={disabled || subiendo}
          className="hidden"
        />

        {subiendo ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Subiendo Imágenes...
            </h3>
            <p className="text-gray-600 mb-4">
              {progreso.completadas} de {progreso.total} completadas ({progreso.porcentaje}%)
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progreso.porcentaje}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Cargar Imágenes DESPUÉS
            </h3>
            <p className="text-gray-600 mb-2">
              Arrastra y suelta las imágenes aquí, o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">
              JPG, PNG, WEBP hasta 5MB cada una
            </p>
          </div>
        )}
      </div>

      {/* Mensaje de error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700 mt-1 whitespace-pre-line">
                {error}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid de imágenes */}
      {imagenes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence>
            {imagenes.map((imagen, index) => (
              <motion.div
                key={imagen.nombre || index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                {/* Imagen */}
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {imagen.url ? (
                    <img
                      src={imagen.url}
                      alt={`Después ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FileImage className="w-12 h-12 text-gray-400" />
                  )}
                </div>

                {/* Overlay con botones */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        mostrarPrevia(imagen);
                      }}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50 transition-colors duration-200"
                      title="Ver imagen"
                    >
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarImagenLocal(index);
                      }}
                      disabled={disabled}
                      className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors duration-200"
                      title="Eliminar imagen"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Nombre del archivo */}
                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate" title={imagen.nombre}>
                    {imagen.nombre || `Imagen ${index + 1}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal de vista previa */}
      <AnimatePresence>
        {imagenPrevia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-4"
            onClick={cerrarPrevia}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-4xl max-h-full bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={cerrarPrevia}
                className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 rounded-full text-white hover:bg-opacity-70 transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={imagenPrevia.url}
                alt="Vista previa"
                className="max-w-full max-h-[80vh] object-contain"
              />
              <div className="p-4 bg-white">
                <h3 className="font-medium text-gray-900">
                  {imagenPrevia.nombre}
                </h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instrucciones */}
      {imagenes.length === 0 && !error && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Las imágenes DESPUÉS muestran el resultado final del trabajo realizado en el vehículo o equipo.
          </p>
        </div>
      )}
    </div>
  );
};

export default UploaderDespues;
