// components/InformesTecnicos/BuscarRemisionForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertCircle, FileText, Clock, User } from 'lucide-react';
import { buscarRemision, normalizarMovil, formatearFecha } from '../../services/firestore';
import './InformesTecnicos.css';

/**
 * Componente para buscar remisión y mostrar datos encontrados
 */
const BuscarRemisionForm = ({ onRemisionEncontrada, onError, disabled = false }) => {
  const [numeroRemision, setNumeroRemision] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [remisionEncontrada, setRemisionEncontrada] = useState(null);
  const [error, setError] = useState(null);

  // Limpiar estado de error cuando cambia el input
  const handleInputChange = (e) => {
    const valor = e.target.value.trim();
    setNumeroRemision(valor);
    
    if (error) setError(null);
    if (remisionEncontrada) setRemisionEncontrada(null);
  };

  // Buscar remisión en Firestore
  const handleBuscarRemision = async (e) => {
    e.preventDefault();

    if (!numeroRemision.trim()) {
      setError('Por favor, ingresa un número de remisión');
      return;
    }

    setBuscando(true);
    setError(null);
    setRemisionEncontrada(null);

    try {
      console.log('Buscando remisión:', numeroRemision);
      
      const remision = await buscarRemision(numeroRemision.trim());
      
      if (!remision) {
        setError('No se encontró la remisión especificada');
        if (onError) onError('Remisión no encontrada');
        return;
      }

      console.log('Remisión encontrada:', remision);

      // Normalizar datos antes de mostrar
      const datosNormalizados = {
        ...remision,
        movil: normalizarMovil(remision.movil)
      };

      setRemisionEncontrada(datosNormalizados);
      
      // Notificar al componente padre
      if (onRemisionEncontrada) {
        onRemisionEncontrada(datosNormalizados);
      }

    } catch (err) {
      console.error('Error buscando remisión:', err);
      const mensajeError = err.message || 'Error al buscar la remisión';
      setError(mensajeError);
      if (onError) onError(mensajeError);
    } finally {
      setBuscando(false);
    }
  };

  // Limpiar búsqueda
  const handleLimpiar = () => {
    setNumeroRemision('');
    setRemisionEncontrada(null);
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
    >
      {/* Encabezado */}
      <div className="flex items-center mb-6">
        <Search className="w-6 h-6 text-blue-600 mr-3" />
        <h3 className="text-lg font-semibold text-gray-900">
          Buscar Remisión
        </h3>
      </div>

      {/* Formulario de búsqueda */}
      <form onSubmit={handleBuscarRemision} className="space-y-4">
        <div>
          <label 
            htmlFor="numeroRemision" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Número de Remisión *
          </label>
          <div className="relative">
            <input
              type="text"
              id="numeroRemision"
              value={numeroRemision}
              onChange={handleInputChange}
              disabled={disabled || buscando}
              placeholder="Ej: REM-001, 12345, etc."
              className={`
                block w-full px-4 py-3 pr-10 border rounded-lg transition-colors duration-200
                ${error 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                }
                ${disabled || buscando 
                  ? 'bg-gray-100 cursor-not-allowed' 
                  : 'bg-white hover:border-gray-400'
                }
                focus:outline-none focus:ring-2 focus:ring-opacity-50
              `}
            />
            <Search className="w-5 h-5 text-gray-400 absolute right-3 top-3.5" />
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={disabled || buscando || !numeroRemision.trim()}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all duration-200
              ${disabled || buscando || !numeroRemision.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md'
              }
            `}
          >
            {buscando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Buscando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Buscar
              </>
            )}
          </button>

          {(numeroRemision || remisionEncontrada || error) && (
            <button
              type="button"
              onClick={handleLimpiar}
              disabled={disabled || buscando}
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              Limpiar
            </button>
          )}
        </div>
      </form>

      {/* Mensaje de error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Remisión no encontrada
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Datos de remisión encontrada */}
      {remisionEncontrada && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 p-5 bg-green-50 border border-green-200 rounded-lg"
        >
          {/* Encabezado de éxito */}
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <FileText className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-800">
                Remisión Encontrada
              </h4>
              <p className="text-xs text-green-600">
                Los datos se autocompletarán en el formulario
              </p>
            </div>
          </div>

          {/* Grid de datos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-green-700">Remisión</label>
              <p className="text-sm font-semibold text-green-800">
                {remisionEncontrada.remision || 'No especificada'}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-green-700">Móvil</label>
              <p className="text-sm font-semibold text-green-800">
                {remisionEncontrada.movil || 'No especificado'}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-green-700">Técnico</label>
              <div className="flex items-center">
                <User className="w-3 h-3 text-green-600 mr-1" />
                <p className="text-sm font-semibold text-green-800">
                  {remisionEncontrada.tecnico || 'No especificado'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-green-700">Fecha Remisión</label>
              <div className="flex items-center">
                <Clock className="w-3 h-3 text-green-600 mr-1" />
                <p className="text-sm font-semibold text-green-800">
                  {formatearFecha(remisionEncontrada.fecha_remision) || 'No especificada'}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-green-700">Total</label>
              <p className="text-sm font-semibold text-green-800">
                {remisionEncontrada.total 
                  ? `$${Number(remisionEncontrada.total).toLocaleString('es-CO')}`
                  : 'No especificado'
                }
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-green-700">Autorizado por</label>
              <p className="text-sm font-semibold text-green-800">
                {remisionEncontrada.autorizo || 'No especificado'}
              </p>
            </div>
          </div>

          {/* Descripción/Título del trabajo */}
          {remisionEncontrada.descripcion && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <label className="text-xs font-medium text-green-700">Descripción del Trabajo</label>
              <p className="text-sm text-green-800 mt-1 leading-relaxed">
                {remisionEncontrada.descripcion}
              </p>
            </div>
          )}

          {/* Nota informativa */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <svg 
                className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" 
                  clipRule="evenodd" 
                />
              </svg>
              <p className="text-xs text-blue-700">
                Los campos del formulario de informe se han completado automáticamente con estos datos.
                Puedes proceder a agregar las observaciones técnicas y evidencias fotográficas.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BuscarRemisionForm;
