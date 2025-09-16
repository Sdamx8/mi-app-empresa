/**
 * FORMULARIO PRINCIPAL DEL INFORME
 * Formulario editable con validación simple
 */

import React, { useState, useEffect } from 'react';

const FormularioInforme = ({ remision, datosConsolidados, onDatosFormulario, onError }) => {
  const [formulario, setFormulario] = useState({
    tecnico: '',
    observaciones: '',
    recomendaciones: '',
    estadoTrabajo: 'completado'
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (remision) {
      // Pre-llenar con datos de la remisión
      const nuevoFormulario = {
        ...formulario,
        tecnico: remision.tecnico1 || remision.tecnico2 || remision.tecnico3 || ''
      };
      setFormulario(nuevoFormulario);
      onDatosFormulario(nuevoFormulario);
    }
  }, [remision]);

  const validarCampo = (nombre, valor) => {
    const nuevosErrores = { ...errores };

    switch (nombre) {
      case 'tecnico':
        if (!valor.trim()) {
          nuevosErrores.tecnico = 'El técnico es requerido';
        } else if (valor.length < 3) {
          nuevosErrores.tecnico = 'El nombre del técnico debe tener al menos 3 caracteres';
        } else {
          delete nuevosErrores.tecnico;
        }
        break;
      
      case 'observaciones':
        if (valor.length > 500) {
          nuevosErrores.observaciones = 'Las observaciones no pueden exceder 500 caracteres';
        } else {
          delete nuevosErrores.observaciones;
        }
        break;
      
      case 'recomendaciones':
        if (valor.length > 500) {
          nuevosErrores.recomendaciones = 'Las recomendaciones no pueden exceder 500 caracteres';
        } else {
          delete nuevosErrores.recomendaciones;
        }
        break;
      
      default:
        break;
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    const nuevoFormulario = {
      ...formulario,
      [name]: value
    };
    
    setFormulario(nuevoFormulario);
    validarCampo(name, value);
    onDatosFormulario(nuevoFormulario);
  };

  const validarFormulario = () => {
    let esValido = true;
    const nuevosErrores = {};

    // Validar campos requeridos
    if (!formulario.tecnico.trim()) {
      nuevosErrores.tecnico = 'El técnico es requerido';
      esValido = false;
    }

    setErrores(nuevosErrores);
    
    if (!esValido) {
      onError('Por favor complete todos los campos requeridos');
    }
    
    return esValido;
  };

  if (!remision) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
        <p className="text-gray-500 text-center">
          Primero busque una remisión para llenar el formulario
        </p>
      </div>
    );
  }

  const crearTituloTrabajo = () => {
    const servicios = [];
    if (remision.servicio1) servicios.push('SERVICIO 1');
    if (remision.servicio2) servicios.push('SERVICIO 2');
    if (remision.servicio3) servicios.push('SERVICIO 3');
    return servicios.join(', ');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        📝 Formulario del Informe
      </h3>

      <div className="space-y-6">
        {/* Información de la Remisión (Solo lectura) */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-3">Información de la Remisión</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-gray-600 font-medium">Número de Remisión</label>
              <p className="text-gray-800">{remision.remision}</p>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Móvil</label>
              <p className="text-gray-800">{remision.movil || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Fecha</label>
              <p className="text-gray-800">
                {remision.fecha_remision?.toDate ? 
                  remision.fecha_remision.toDate().toLocaleDateString() : 
                  'N/A'
                }
              </p>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Autorizado por</label>
              <p className="text-gray-800">{remision.autorizo || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">Carrocería</label>
              <p className="text-gray-800">{remision.carroceria || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-gray-600 font-medium">UNE</label>
              <p className="text-gray-800">{remision.une || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Título del Trabajo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título del Trabajo
          </label>
          <p className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
            {crearTituloTrabajo()}
          </p>
        </div>

        {/* Técnico Responsable */}
        <div>
          <label htmlFor="tecnico" className="block text-sm font-medium text-gray-700 mb-2">
            Técnico Responsable *
          </label>
          <select
            id="tecnico"
            name="tecnico"
            value={formulario.tecnico}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errores.tecnico ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Seleccionar técnico...</option>
            {remision.tecnico1 && <option value={remision.tecnico1}>{remision.tecnico1}</option>}
            {remision.tecnico2 && <option value={remision.tecnico2}>{remision.tecnico2}</option>}
            {remision.tecnico3 && <option value={remision.tecnico3}>{remision.tecnico3}</option>}
          </select>
          {errores.tecnico && (
            <p className="mt-1 text-sm text-red-600">{errores.tecnico}</p>
          )}
        </div>

        {/* Estado del Trabajo */}
        <div>
          <label htmlFor="estadoTrabajo" className="block text-sm font-medium text-gray-700 mb-2">
            Estado del Trabajo
          </label>
          <select
            id="estadoTrabajo"
            name="estadoTrabajo"
            value={formulario.estadoTrabajo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="completado">Completado</option>
            <option value="parcial">Parcialmente Completado</option>
            <option value="pendiente">Pendiente</option>
          </select>
        </div>

        {/* Observaciones */}
        <div>
          <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 mb-2">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            name="observaciones"
            value={formulario.observaciones}
            onChange={handleChange}
            rows={4}
            placeholder="Observaciones adicionales sobre el trabajo realizado..."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
              errores.observaciones ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errores.observaciones && (
              <p className="text-sm text-red-600">{errores.observaciones}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {formulario.observaciones.length}/500
            </p>
          </div>
        </div>

        {/* Recomendaciones */}
        <div>
          <label htmlFor="recomendaciones" className="block text-sm font-medium text-gray-700 mb-2">
            Recomendaciones
          </label>
          <textarea
            id="recomendaciones"
            name="recomendaciones"
            value={formulario.recomendaciones}
            onChange={handleChange}
            rows={4}
            placeholder="Recomendaciones para futuros mantenimientos o mejoras..."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
              errores.recomendaciones ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errores.recomendaciones && (
              <p className="text-sm text-red-600">{errores.recomendaciones}</p>
            )}
            <p className="text-sm text-gray-500 ml-auto">
              {formulario.recomendaciones.length}/500
            </p>
          </div>
        </div>

        {/* Resumen de datos consolidados */}
        {datosConsolidados && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-700 mb-2">
              ✅ Datos Consolidados Automáticamente
            </h4>
            <div className="text-sm text-green-600 space-y-1">
              <p>• {datosConsolidados.descripciones.length} descripciones de actividades</p>
              <p>• {datosConsolidados.materiales.length} materiales únicos identificados</p>
              <p>• {datosConsolidados.recursos.length} recursos humanos requeridos</p>
              <p>• Tiempo total estimado: {datosConsolidados.tiempoTotal.horas}h {datosConsolidados.tiempoTotal.minutos}m</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormularioInforme;