// FormularioInforme.jsx - Formulario editable con datos pre-llenados
import React, { useState, useEffect } from 'react';

const FormularioInforme = ({ 
  remisionData, 
  serviciosConsolidados, 
  empleadoData, 
  onDatosActualizados 
}) => {
  const [datosFormulario, setDatosFormulario] = useState({
    tituloTrabajo: '',
    tecnicoAsignado: '',
    descripcionGeneral: '',
    materialesUtilizados: '',
    recursosHumanos: '',
    tiempoEjecucion: '',
    observaciones: '',
    recomendaciones: ''
  });

  const [errores, setErrores] = useState({});

  // Inicializar datos cuando se reciban los props
  useEffect(() => {
    if (remisionData && serviciosConsolidados) {
      console.log('📝 Inicializando formulario con datos consolidados');
      
      // Crear título de trabajo concatenando servicios
      const servicios = [];
      for (let i = 1; i <= 5; i++) {
        const servicio = remisionData[`servicio${i}`];
        if (servicio && servicio.trim() !== '') {
          servicios.push(servicio.substring(0, 50) + (servicio.length > 50 ? '...' : ''));
        }
      }
      const tituloTrabajo = servicios.join(', ');

      // Obtener primer técnico asignado
      let tecnicoAsignado = '';
      for (let i = 1; i <= 3; i++) {
        const tecnico = remisionData[`tecnico${i}`];
        if (tecnico && tecnico.trim() !== '') {
          tecnicoAsignado = tecnico;
          break;
        }
      }

      // Consolidar datos
      const descripcionGeneral = serviciosConsolidados.descripciones?.join('. ') || '';
      const materialesUtilizados = serviciosConsolidados.materiales?.join(', ') || '';
      const recursosHumanos = serviciosConsolidados.recursos?.join(', ') || '';
      const tiempoEjecucion = serviciosConsolidados.tiempoTotal?.horas || 1;

      setDatosFormulario({
        tituloTrabajo,
        tecnicoAsignado,
        descripcionGeneral,
        materialesUtilizados,
        recursosHumanos,
        tiempoEjecucion: tiempoEjecucion.toString(),
        observaciones: '',
        recomendaciones: ''
      });
    }
  }, [remisionData, serviciosConsolidados]);

  // Notificar cambios al componente padre
  useEffect(() => {
    if (onDatosActualizados) {
      onDatosActualizados(datosFormulario);
    }
  }, [datosFormulario, onDatosActualizados]);

  const handleInputChange = (campo, valor) => {
    setDatosFormulario(prev => ({
      ...prev,
      [campo]: valor
    }));

    // Limpiar error del campo editado
    if (errores[campo]) {
      setErrores(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  };

  const validarCampo = (campo, valor) => {
    switch (campo) {
      case 'tituloTrabajo':
        return !valor.trim() ? 'El título del trabajo es requerido' : '';
      case 'tecnicoAsignado':
        return !valor.trim() ? 'El técnico asignado es requerido' : '';
      case 'descripcionGeneral':
        return !valor.trim() ? 'La descripción general es requerida' : '';
      case 'tiempoEjecucion':
        const tiempo = parseFloat(valor);
        if (isNaN(tiempo) || tiempo <= 0) {
          return 'El tiempo debe ser un número mayor a 0';
        }
        if (tiempo > 24) {
          return 'El tiempo no puede ser mayor a 24 horas';
        }
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (campo, valor) => {
    const error = validarCampo(campo, valor);
    setErrores(prev => ({
      ...prev,
      [campo]: error
    }));
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return new Date().toLocaleDateString('es-CO');
    
    try {
      if (fecha.toDate) {
        return fecha.toDate().toLocaleDateString('es-CO');
      } else if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-CO');
      } else {
        return fecha.toString();
      }
    } catch (error) {
      return new Date().toLocaleDateString('es-CO');
    }
  };

  return (
    <div className="formulario-informe">
      <div className="formulario-header">
        <h2>📝 Formulario del Informe</h2>
        <p>Completa y ajusta la información del informe técnico</p>
      </div>

      {/* Información de contexto */}
      <div className="contexto-info">
        <div className="contexto-item">
          <span className="contexto-label">Remisión:</span>
          <span className="contexto-valor">{remisionData?.remision}</span>
        </div>
        <div className="contexto-item">
          <span className="contexto-label">Fecha:</span>
          <span className="contexto-valor">{formatearFecha(remisionData?.fecha_remision)}</span>
        </div>
        <div className="contexto-item">
          <span className="contexto-label">Móvil:</span>
          <span className="contexto-valor">{remisionData?.movil || 'N/A'}</span>
        </div>
        <div className="contexto-item">
          <span className="contexto-label">Elaborado por:</span>
          <span className="contexto-valor">{empleadoData?.nombre_completo || 'Usuario actual'}</span>
        </div>
      </div>

      {/* Campos del formulario */}
      <div className="formulario-campos">
        
        {/* Título del trabajo */}
        <div className="campo-grupo">
          <label htmlFor="tituloTrabajo">
            Título del Trabajo *
          </label>
          <textarea
            id="tituloTrabajo"
            value={datosFormulario.tituloTrabajo}
            onChange={(e) => handleInputChange('tituloTrabajo', e.target.value)}
            onBlur={(e) => handleBlur('tituloTrabajo', e.target.value)}
            placeholder="Resumen de los servicios realizados..."
            rows={2}
            className={errores.tituloTrabajo ? 'campo-error' : ''}
          />
          {errores.tituloTrabajo && (
            <span className="error-mensaje">❌ {errores.tituloTrabajo}</span>
          )}
        </div>

        {/* Técnico asignado */}
        <div className="campo-grupo">
          <label htmlFor="tecnicoAsignado">
            Técnico Responsable *
          </label>
          <input
            id="tecnicoAsignado"
            type="text"
            value={datosFormulario.tecnicoAsignado}
            onChange={(e) => handleInputChange('tecnicoAsignado', e.target.value)}
            onBlur={(e) => handleBlur('tecnicoAsignado', e.target.value)}
            placeholder="Nombre del técnico principal"
            className={errores.tecnicoAsignado ? 'campo-error' : ''}
          />
          {errores.tecnicoAsignado && (
            <span className="error-mensaje">❌ {errores.tecnicoAsignado}</span>
          )}
        </div>

        {/* Descripción general */}
        <div className="campo-grupo">
          <label htmlFor="descripcionGeneral">
            Descripción de Actividades Realizadas *
          </label>
          <textarea
            id="descripcionGeneral"
            value={datosFormulario.descripcionGeneral}
            onChange={(e) => handleInputChange('descripcionGeneral', e.target.value)}
            onBlur={(e) => handleBlur('descripcionGeneral', e.target.value)}
            placeholder="Detalle de todas las actividades ejecutadas..."
            rows={4}
            className={errores.descripcionGeneral ? 'campo-error' : ''}
          />
          {errores.descripcionGeneral && (
            <span className="error-mensaje">❌ {errores.descripcionGeneral}</span>
          )}
        </div>

        {/* Materiales utilizados */}
        <div className="campo-grupo">
          <label htmlFor="materialesUtilizados">
            Materiales y Suministros Utilizados
          </label>
          <textarea
            id="materialesUtilizados"
            value={datosFormulario.materialesUtilizados}
            onChange={(e) => handleInputChange('materialesUtilizados', e.target.value)}
            placeholder="Lista de materiales, herramientas y suministros..."
            rows={3}
          />
        </div>

        {/* Recursos humanos */}
        <div className="campo-grupo">
          <label htmlFor="recursosHumanos">
            Recursos Humanos Requeridos
          </label>
          <input
            id="recursosHumanos"
            type="text"
            value={datosFormulario.recursosHumanos}
            onChange={(e) => handleInputChange('recursosHumanos', e.target.value)}
            placeholder="Técnico, Auxiliar, Especialista, etc."
          />
        </div>

        {/* Tiempo de ejecución */}
        <div className="campo-grupo">
          <label htmlFor="tiempoEjecucion">
            Tiempo de Ejecución (horas) *
          </label>
          <input
            id="tiempoEjecucion"
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={datosFormulario.tiempoEjecucion}
            onChange={(e) => handleInputChange('tiempoEjecucion', e.target.value)}
            onBlur={(e) => handleBlur('tiempoEjecucion', e.target.value)}
            placeholder="Ej: 2.5"
            className={errores.tiempoEjecucion ? 'campo-error' : ''}
          />
          {errores.tiempoEjecucion && (
            <span className="error-mensaje">❌ {errores.tiempoEjecucion}</span>
          )}
        </div>

        {/* Observaciones */}
        <div className="campo-grupo">
          <label htmlFor="observaciones">
            Observaciones
          </label>
          <textarea
            id="observaciones"
            value={datosFormulario.observaciones}
            onChange={(e) => handleInputChange('observaciones', e.target.value)}
            placeholder="Observaciones adicionales durante la ejecución..."
            rows={3}
          />
        </div>

        {/* Recomendaciones */}
        <div className="campo-grupo">
          <label htmlFor="recomendaciones">
            Recomendaciones
          </label>
          <textarea
            id="recomendaciones"
            value={datosFormulario.recomendaciones}
            onChange={(e) => handleInputChange('recomendaciones', e.target.value)}
            placeholder="Recomendaciones para futuros trabajos o mantenimientos..."
            rows={3}
          />
        </div>
      </div>

      {/* Información de ayuda */}
      <div className="ayuda-formulario">
        <h4>💡 Información</h4>
        <ul>
          <li>Los campos marcados con * son obligatorios</li>
          <li>Los datos se han pre-llenado automáticamente desde la remisión</li>
          <li>Puedes modificar cualquier campo según sea necesario</li>
          <li>El tiempo se debe especificar en horas (use decimales para minutos)</li>
        </ul>
      </div>

      <style jsx>{`
        .formulario-informe {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .formulario-header {
          margin-bottom: 24px;
        }

        .formulario-header h2 {
          color: #2c3e50;
          margin: 0 0 8px 0;
          font-size: 1.4rem;
        }

        .formulario-header p {
          color: #7f8c8d;
          margin: 0;
        }

        .contexto-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 6px;
          margin-bottom: 24px;
          border-left: 4px solid #3498db;
        }

        .contexto-item {
          display: flex;
          flex-direction: column;
        }

        .contexto-label {
          font-size: 0.85rem;
          color: #7f8c8d;
          margin-bottom: 2px;
        }

        .contexto-valor {
          font-weight: 500;
          color: #2c3e50;
        }

        .formulario-campos {
          display: grid;
          gap: 20px;
        }

        .campo-grupo {
          display: flex;
          flex-direction: column;
        }

        .campo-grupo label {
          font-weight: 500;
          color: #34495e;
          margin-bottom: 8px;
        }

        .campo-grupo input,
        .campo-grupo textarea {
          padding: 12px 16px;
          border: 2px solid #bdc3c7;
          border-radius: 6px;
          font-size: 1rem;
          font-family: inherit;
          transition: border-color 0.2s;
          resize: vertical;
        }

        .campo-grupo input:focus,
        .campo-grupo textarea:focus {
          outline: none;
          border-color: #3498db;
        }

        .campo-grupo input.campo-error,
        .campo-grupo textarea.campo-error {
          border-color: #e74c3c;
        }

        .error-mensaje {
          color: #e74c3c;
          font-size: 0.9rem;
          margin-top: 4px;
        }

        .ayuda-formulario {
          background: #f8f9fa;
          padding: 16px;
          border-radius: 6px;
          border-left: 4px solid #27ae60;
          margin-top: 24px;
        }

        .ayuda-formulario h4 {
          margin: 0 0 12px 0;
          color: #2c3e50;
          font-size: 1rem;
        }

        .ayuda-formulario ul {
          margin: 0;
          padding-left: 20px;
        }

        .ayuda-formulario li {
          color: #7f8c8d;
          margin-bottom: 4px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .formulario-informe {
            padding: 16px;
            margin: 0 -8px 20px -8px;
          }

          .contexto-info {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default FormularioInforme;