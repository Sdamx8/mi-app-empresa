// InformesTecnicos.jsx - Página principal con navegación por pasos
import React, { useState, useEffect } from 'react';

// Importar componentes
import BuscadorRemision from '../components/informes/BuscadorRemision';
import ConsolidadorServicios from '../components/informes/ConsolidadorServicios';
import FormularioInforme from '../components/informes/FormularioInforme';
import CargadorImagenes from '../components/informes/CargadorImagenes';
import VistaPrevia from '../components/informes/VistaPrevia';

// Importar servicios
import { 
  buscarRemision, 
  consolidarServicios, 
  validarPermisos,
  verificarInformeExistente 
} from '../services/informesService';

const PASOS = {
  BUSCAR: 'buscar',
  REVISAR: 'revisar', 
  FORMULARIO: 'formulario',
  IMAGENES: 'imagenes',
  VISTA_PREVIA: 'vista_previa',
  COMPLETADO: 'completado'
};

const InformesTecnicos = () => {
  // Estados principales
  const [pasoActual, setPasoActual] = useState(PASOS.BUSCAR);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Estados de datos
  const [empleadoData, setEmpleadoData] = useState(null);
  const [remisionData, setRemisionData] = useState(null);
  const [serviciosConsolidados, setServiciosConsolidados] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState({});
  const [imagenes, setImagenes] = useState({ 
    imagenesAntes: [], 
    imagenesDespues: [] 
  });
  const [informeGuardado, setInformeGuardado] = useState(null);

  // Validar permisos al cargar
  useEffect(() => {
    validarPermisosUsuario();
  }, []);

  const validarPermisosUsuario = async () => {
    try {
      setCargando(true);
      console.log('🔒 Validando permisos de usuario...');
      
      const resultado = await validarPermisos();
      
      if (resultado.success) {
        setEmpleadoData(resultado.empleado);
        console.log('✅ Permisos validados:', resultado.empleado);
      } else {
        setError(`Acceso denegado: ${resultado.error}`);
        console.error('❌ Error de permisos:', resultado.error);
      }
      
    } catch (error) {
      setError(`Error verificando permisos: ${error.message}`);
      console.error('❌ Error en validación:', error);
    } finally {
      setCargando(false);
    }
  };

  const manejarBusquedaRemision = async (numeroRemision) => {
    try {
      setCargando(true);
      setError('');
      console.log('🔍 Buscando remisión:', numeroRemision);

      // Verificar si ya existe un informe para esta remisión
      const verificacion = await verificarInformeExistente(numeroRemision);
      if (verificacion.exists) {
        const fechaCreacion = verificacion.data.creadoEn ? 
          new Date(verificacion.data.creadoEn.seconds * 1000).toLocaleDateString('es-CO') : 'Fecha no disponible';
        const tecnicoElaborador = verificacion.data.elaboradoPor || 'No especificado';
        const estadoInforme = verificacion.data.estado || 'No especificado';
        
        setError(`⚠️ Ya existe un informe técnico para la remisión ${numeroRemision}:
        • ID: ${verificacion.data.idInforme || 'No disponible'}
        • Estado: ${estadoInforme}
        • Elaborado por: ${tecnicoElaborador}
        • Fecha: ${fechaCreacion}
        
        💡 Si necesitas crear un nuevo informe, primero debe eliminarse el existente o usar una remisión diferente.`);
        return;
      }

      // Buscar la remisión
      const resultadoRemision = await buscarRemision(numeroRemision);
      
      if (!resultadoRemision.success) {
        setError(resultadoRemision.error);
        return;
      }

      setRemisionData(resultadoRemision.data);
      console.log('✅ Remisión encontrada:', resultadoRemision.data);

      // Consolidar servicios automáticamente
      const resultadoServicios = await consolidarServicios(resultadoRemision.data);
      
      if (resultadoServicios.success) {
        setServiciosConsolidados(resultadoServicios.data);
        console.log('✅ Servicios consolidados:', resultadoServicios.data);
      } else {
        console.warn('⚠️ Error consolidando servicios:', resultadoServicios.error);
        // Continuar sin servicios consolidados
      }

      setPasoActual(PASOS.REVISAR);
      
    } catch (error) {
      setError(`Error en la búsqueda: ${error.message}`);
      console.error('❌ Error buscando remisión:', error);
    } finally {
      setCargando(false);
    }
  };

  const avanzarPaso = () => {
    switch (pasoActual) {
      case PASOS.REVISAR:
        setPasoActual(PASOS.FORMULARIO);
        break;
      case PASOS.FORMULARIO:
        setPasoActual(PASOS.IMAGENES);
        break;
      case PASOS.IMAGENES:
        setPasoActual(PASOS.VISTA_PREVIA);
        break;
      default:
        break;
    }
  };

  const retrocederPaso = () => {
    switch (pasoActual) {
      case PASOS.REVISAR:
        setPasoActual(PASOS.BUSCAR);
        limpiarDatos();
        break;
      case PASOS.FORMULARIO:
        setPasoActual(PASOS.REVISAR);
        break;
      case PASOS.IMAGENES:
        setPasoActual(PASOS.FORMULARIO);
        break;
      case PASOS.VISTA_PREVIA:
        setPasoActual(PASOS.IMAGENES);
        break;
      default:
        break;
    }
  };

  const limpiarDatos = () => {
    setRemisionData(null);
    setServiciosConsolidados(null);
    setDatosFormulario({});
    setImagenes({ imagenesAntes: [], imagenesDespues: [] });
    setError('');
  };

  const manejarInformeGuardado = (resultado) => {
    setInformeGuardado(resultado);
    setPasoActual(PASOS.COMPLETADO);
  };

  const reiniciarProceso = () => {
    setPasoActual(PASOS.BUSCAR);
    limpiarDatos();
    setInformeGuardado(null);
  };

  const obtenerTituloPaso = () => {
    switch (pasoActual) {
      case PASOS.BUSCAR: return 'Buscar Remisión';
      case PASOS.REVISAR: return 'Revisar Datos';
      case PASOS.FORMULARIO: return 'Completar Informe';
      case PASOS.IMAGENES: return 'Cargar Imágenes';
      case PASOS.VISTA_PREVIA: return 'Vista Previa';
      case PASOS.COMPLETADO: return 'Informe Completado';
      default: return 'Informes Técnicos';
    }
  };

  const IndicadorPasos = () => (
    <div className="indicador-pasos">
      {Object.values(PASOS).slice(0, -1).map((paso, index) => {
        const esActivo = pasoActual === paso;
        const esCompletado = Object.values(PASOS).indexOf(pasoActual) > index;
        
        return (
          <div 
            key={paso} 
            className={`paso-item ${esActivo ? 'activo' : ''} ${esCompletado ? 'completado' : ''}`}
          >
            <div className="paso-numero">
              {esCompletado ? '✓' : index + 1}
            </div>
            <span className="paso-label">
              {paso === PASOS.BUSCAR && 'Buscar'}
              {paso === PASOS.REVISAR && 'Revisar'}
              {paso === PASOS.FORMULARIO && 'Formulario'}
              {paso === PASOS.IMAGENES && 'Imágenes'}
              {paso === PASOS.VISTA_PREVIA && 'Preview'}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Pantalla de carga inicial
  if (cargando && !empleadoData && pasoActual === PASOS.BUSCAR) {
    return (
      <div className="pantalla-carga">
        <div className="carga-contenido">
          <div className="spinner-grande"></div>
          <h3>🔒 Verificando Permisos</h3>
          <p>Validando acceso al módulo de informes técnicos...</p>
        </div>
      </div>
    );
  }

  // Error de permisos
  if (error && !empleadoData) {
    return (
      <div className="error-permisos">
        <div className="error-contenido">
          <div className="error-icono">🚫</div>
          <h3>Acceso Denegado</h3>
          <p>{error}</p>
          <button onClick={validarPermisosUsuario} className="btn-reintentar">
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="informes-tecnicos">
      {/* Encabezado */}
      <div className="encabezado-modulo">
        <div className="encabezado-info">
          <h1>📋 Informes Técnicos</h1>
          <p>Crear informes técnicos detallados a partir de remisiones</p>
        </div>
        
        {empleadoData && (
          <div className="usuario-info">
            <div className="usuario-avatar">👤</div>
            <div className="usuario-datos">
              <div className="usuario-nombre">{empleadoData.nombre_completo}</div>
              <div className="usuario-rol">{empleadoData.tipo_empleado}</div>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de pasos */}
      {pasoActual !== PASOS.COMPLETADO && <IndicadorPasos />}

      {/* Título del paso actual */}
      <div className="titulo-paso">
        <h2>{obtenerTituloPaso()}</h2>
      </div>

      {/* Error global */}
      {error && pasoActual !== PASOS.BUSCAR && (
        <div className={`error-global ${error.includes('Ya existe un informe') ? 'error-informe-existente' : ''}`}>
          <div className="error-contenido">
            {error.includes('Ya existe un informe') ? (
              <div>
                <h4>⚠️ Informe Duplicado Detectado</h4>
                <pre style={{ whiteSpace: 'pre-line', margin: '8px 0', fontSize: '14px' }}>{error}</pre>
                <div style={{ marginTop: '12px' }}>
                  <button 
                    onClick={() => {
                      setError('');
                      setPasoActual(PASOS.BUSCAR);
                      limpiarDatos();
                    }}
                    style={{
                      backgroundColor: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    🔍 Probar con otra remisión
                  </button>
                </div>
              </div>
            ) : (
              <span>❌ {error}</span>
            )}
          </div>
          <button onClick={() => setError('')} className="btn-cerrar-error">×</button>
        </div>
      )}

      {/* Contenido según el paso */}
      <div className="contenido-paso">
        
        {pasoActual === PASOS.BUSCAR && (
          <BuscadorRemision 
            onRemisionEncontrada={manejarBusquedaRemision}
            loading={cargando}
          />
        )}

        {pasoActual === PASOS.REVISAR && (
          <>
            <ConsolidadorServicios 
              remisionData={remisionData}
              serviciosConsolidados={serviciosConsolidados}
              onContinuar={avanzarPaso}
            />
            <div className="navegacion-pasos">
              <button onClick={retrocederPaso} className="btn-anterior">
                ← Nueva Búsqueda
              </button>
            </div>
          </>
        )}

        {pasoActual === PASOS.FORMULARIO && (
          <>
            <FormularioInforme 
              remisionData={remisionData}
              serviciosConsolidados={serviciosConsolidados}
              empleadoData={empleadoData}
              onDatosActualizados={setDatosFormulario}
            />
            <div className="navegacion-pasos">
              <button onClick={retrocederPaso} className="btn-anterior">
                ← Volver a Revisar
              </button>
              <button onClick={avanzarPaso} className="btn-siguiente">
                Continuar con Imágenes →
              </button>
            </div>
          </>
        )}

        {pasoActual === PASOS.IMAGENES && (
          <>
            <CargadorImagenes 
              numeroRemision={remisionData?.remision}
              onImagenesActualizadas={setImagenes}
            />
            <div className="navegacion-pasos">
              <button onClick={retrocederPaso} className="btn-anterior">
                ← Volver al Formulario
              </button>
              <button onClick={avanzarPaso} className="btn-siguiente">
                Ver Vista Previa →
              </button>
            </div>
          </>
        )}

        {pasoActual === PASOS.VISTA_PREVIA && (
          <VistaPrevia 
            remisionData={remisionData}
            datosFormulario={datosFormulario}
            imagenes={imagenes}
            empleadoData={empleadoData}
            onInformeGuardado={manejarInformeGuardado}
            onVolver={retrocederPaso}
          />
        )}

        {pasoActual === PASOS.COMPLETADO && (
          <div className="informe-completado">
            <div className="completado-contenido">
              <div className="completado-icono">✅</div>
              <h3>¡Informe Creado Exitosamente!</h3>
              
              <div className="completado-info">
                <div className="info-item">
                  <label>ID del Informe:</label>
                  <span className="valor-codigo">{informeGuardado?.idInforme}</span>
                </div>
                <div className="info-item">
                  <label>Remisión:</label>
                  <span>{remisionData?.remision}</span>
                </div>
                <div className="info-item">
                  <label>Fecha de Creación:</label>
                  <span>{new Date().toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="completado-acciones">
                <button onClick={reiniciarProceso} className="btn-nuevo-informe">
                  📋 Crear Otro Informe
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .informes-tecnicos {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          min-height: calc(100vh - 100px);
        }

        .pantalla-carga,
        .error-permisos {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
        }

        .carga-contenido,
        .error-contenido {
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .spinner-grande {
          width: 48px;
          height: 48px;
          border: 4px solid #ecf0f1;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        .error-icono {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .btn-reintentar {
          background: #3498db;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 1rem;
          margin-top: 16px;
        }

        .encabezado-modulo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }

        .encabezado-info h1 {
          color: #2c3e50;
          margin: 0 0 8px 0;
          font-size: 1.8rem;
        }

        .encabezado-info p {
          color: #7f8c8d;
          margin: 0;
          font-size: 1rem;
        }

        .usuario-info {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8f9fa;
          padding: 12px 16px;
          border-radius: 8px;
        }

        .usuario-avatar {
          font-size: 1.5rem;
          background: #3498db;
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .usuario-nombre {
          font-weight: 600;
          color: #2c3e50;
        }

        .usuario-rol {
          font-size: 0.9rem;
          color: #7f8c8d;
          text-transform: capitalize;
        }

        .indicador-pasos {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .paso-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          transition: all 0.2s;
        }

        .paso-item.activo {
          background: #3498db;
          color: white;
        }

        .paso-item.completado {
          background: #27ae60;
          color: white;
        }

        .paso-numero {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .paso-item:not(.activo):not(.completado) .paso-numero {
          background: #bdc3c7;
          color: white;
        }

        .paso-item:not(.activo):not(.completado) {
          color: #7f8c8d;
        }

        .paso-label {
          font-size: 0.9rem;
          font-weight: 500;
        }

        .titulo-paso {
          text-align: center;
          margin-bottom: 24px;
        }

        .titulo-paso h2 {
          color: #2c3e50;
          margin: 0;
          font-size: 1.4rem;
        }

        .error-global {
          background: #fee;
          color: #e74c3c;
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #e74c3c;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .error-informe-existente {
          background: #fff3cd;
          color: #856404;
          border-left-color: #ffc107;
        }

        .error-contenido {
          flex: 1;
        }

        .error-contenido h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: bold;
        }

        .btn-cerrar-error {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0;
          margin-left: 16px;
          flex-shrink: 0;
        }

        .contenido-paso {
          margin-bottom: 24px;
        }

        .navegacion-pasos {
          display: flex;
          gap: 16px;
          justify-content: center;
          padding: 24px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          margin-top: 20px;
        }

        .btn-anterior,
        .btn-siguiente {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-anterior {
          background: #95a5a6;
          color: white;
        }

        .btn-anterior:hover {
          background: #7f8c8d;
        }

        .btn-siguiente {
          background: #27ae60;
          color: white;
        }

        .btn-siguiente:hover {
          background: #229954;
        }

        .informe-completado {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .completado-contenido {
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          max-width: 500px;
          width: 100%;
        }

        .completado-icono {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .completado-contenido h3 {
          color: #27ae60;
          margin: 0 0 24px 0;
          font-size: 1.5rem;
        }

        .completado-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .info-item:last-child {
          margin-bottom: 0;
        }

        .info-item label {
          font-weight: 500;
          color: #34495e;
        }

        .valor-codigo {
          background: #3498db;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9rem;
        }

        .btn-nuevo-informe {
          background: #3498db;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-nuevo-informe:hover {
          background: #2980b9;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .informes-tecnicos {
            padding: 12px;
          }

          .encabezado-modulo {
            flex-direction: column;
            gap: 16px;
            padding: 20px;
          }

          .usuario-info {
            align-self: stretch;
            justify-content: center;
          }

          .indicador-pasos {
            padding: 16px;
          }

          .paso-item {
            padding: 6px 12px;
          }

          .paso-label {
            font-size: 0.8rem;
          }

          .navegacion-pasos {
            flex-direction: column;
            gap: 12px;
          }

          .completado-contenido {
            padding: 24px;
            margin: 0 -8px;
          }
        }
      `}</style>
    </div>
  );
};

export default InformesTecnicos;