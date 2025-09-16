/**
 * CARGADOR DE IMÁGENES
 * Componente para subir fotos antes y después
 */

import React, { useState } from 'react';
import { informesService } from '../../services/informesService';

const CargadorImagenes = ({ numeroRemision, onImagenesActualizadas, onError }) => {
  const [imagenesAntes, setImagenesAntes] = useState([]);
  const [imagenesDespues, setImagenesDespues] = useState([]);
  const [subiendo, setSubiendo] = useState(false);

  const validarArchivo = (archivo) => {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!tiposPermitidos.includes(archivo.type)) {
      throw new Error('Tipo de archivo no permitido. Solo JPG, JPEG y PNG.');
    }

    if (archivo.size > maxSize) {
      throw new Error('Archivo muy grande. Máximo 5MB.');
    }

    return true;
  };

  const subirImagen = async (archivo, tipo) => {
    try {
      validarArchivo(archivo);
      
      setSubiendo(true);
      const resultado = await informesService.subirImagen(archivo, numeroRemision, tipo);
      
      if (tipo === 'antes') {
        const nuevasImagenes = [...imagenesAntes, resultado];
        setImagenesAntes(nuevasImagenes);
        actualizarImagenesParent(nuevasImagenes, imagenesDespues);
      } else if (tipo === 'despues') {
        const nuevasImagenes = [...imagenesDespues, resultado];
        setImagenesDespues(nuevasImagenes);
        actualizarImagenesParent(imagenesAntes, nuevasImagenes);
      }
      
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      onError(error.message);
    } finally {
      setSubiendo(false);
    }
  };

  const actualizarImagenesParent = (antes, despues) => {
    onImagenesActualizadas({
      imagenesAntes: antes,
      imagenesDespues: despues
    });
  };

  const eliminarImagen = async (imagen, tipo) => {
    try {
      // Eliminar de Storage
      await informesService.eliminarImagen(imagen.storageRef);
      
      if (tipo === 'antes') {
        const nuevasImagenes = imagenesAntes.filter(img => img.storageRef !== imagen.storageRef);
        setImagenesAntes(nuevasImagenes);
        actualizarImagenesParent(nuevasImagenes, imagenesDespues);
      } else if (tipo === 'despues') {
        const nuevasImagenes = imagenesDespues.filter(img => img.storageRef !== imagen.storageRef);
        setImagenesDespues(nuevasImagenes);
        actualizarImagenesParent(imagenesAntes, nuevasImagenes);
      }
      
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      onError('Error eliminando imagen');
    }
  };

  const handleFileSelect = (e, tipo) => {
    const archivo = e.target.files[0];
    if (archivo) {
      subirImagen(archivo, tipo);
    }
    // Limpiar input
    e.target.value = '';
  };

  if (!numeroRemision) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
        <p className="text-gray-500 text-center">
          Primero busque una remisión para subir imágenes
        </p>
      </div>
    );
  }

  const ImagenItem = ({ imagen, tipo }) => (
    <div className="relative group border border-gray-200 rounded-lg overflow-hidden">
      <img
        src={imagen.url}
        alt={imagen.name}
        className="w-full h-32 object-cover"
      />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
        <button
          onClick={() => eliminarImagen(imagen, tipo)}
          className="opacity-0 group-hover:opacity-100 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all"
          title="Eliminar imagen"
        >
          🗑️
        </button>
      </div>
      <div className="p-2 bg-white">
        <p className="text-xs text-gray-600 truncate" title={imagen.name}>
          {imagen.name}
        </p>
        <p className="text-xs text-gray-400">
          {(imagen.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        📸 Carga de Imágenes
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Imágenes ANTES */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            📷 Fotos ANTES
            <span className="text-sm text-gray-500 ml-2">({imagenesAntes.length})</span>
          </h4>
          
          <div className="mb-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => handleFileSelect(e, 'antes')}
                className="hidden"
                disabled={subiendo}
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                {subiendo ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-blue-600">Subiendo...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-2">📤</div>
                    <p className="text-gray-600">Seleccionar foto ANTES</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG máx. 5MB</p>
                  </>
                )}
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {imagenesAntes.map((imagen, index) => (
              <ImagenItem key={index} imagen={imagen} tipo="antes" />
            ))}
          </div>
        </div>

        {/* Imágenes DESPUÉS */}
        <div>
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            📷 Fotos DESPUÉS
            <span className="text-sm text-gray-500 ml-2">({imagenesDespues.length})</span>
          </h4>
          
          <div className="mb-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={(e) => handleFileSelect(e, 'despues')}
                className="hidden"
                disabled={subiendo}
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                {subiendo ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-green-600">Subiendo...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-2">📤</div>
                    <p className="text-gray-600">Seleccionar foto DESPUÉS</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG máx. 5MB</p>
                  </>
                )}
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {imagenesDespues.map((imagen, index) => (
              <ImagenItem key={index} imagen={imagen} tipo="despues" />
            ))}
          </div>
        </div>
      </div>

      {(imagenesAntes.length > 0 || imagenesDespues.length > 0) && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Total: {imagenesAntes.length} fotos ANTES, {imagenesDespues.length} fotos DESPUÉS
          </p>
        </div>
      )}
    </div>
  );
};

export default CargadorImagenes;