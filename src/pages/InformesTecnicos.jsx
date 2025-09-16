/**
 * PÁGINA PRINCIPAL - INFORMES TÉCNICOS
 * Navegación por pasos con validación de permisos
 */

import React, { useState, useEffect } from 'react';
import { auth } from '../core/config/firebaseConfig';
import { informesService } from '../services/informesService';

// Componentes
import BuscadorRemision from '../components/informes/BuscadorRemision';
import ConsolidadorServicios from '../components/informes/ConsolidadorServicios';
import FormularioInforme from '../components/informes/FormularioInforme';
import CargadorImagenes from '../components/informes/CargadorImagenes';
import VistaPrevia from '../components/informes/VistaPrevia';

const InformesTecnicos = () => {
  // Estados principales
  const [pasoActual, setPasoActual] = useState(1);
  const [usuario, setUsuario] = useState(null);
  const [permisos, setPermisos] = useState(null);
  const [cargandoPermisos, setCargandoPermisos] = useState(true);

  // Estados de datos
  const [remision, setRemision] = useState(null);
  const [datosConsolidados, setDatosConsolidados] = useState(null);
  const [datosFormulario, setDatosFormulario] = useState(null);
  const [imagenes, setImagenes] = useState({ imagenesAntes: [], imagenesDespues: [] });

  // Estados de UI
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [guardando, setGuardando] = useState(false);

  // Definición de pasos
  const pasos = [
    { numero: 1, titulo: 'Buscar Remisión', icono: '🔍', completado: !!remision },
    { numero: 2, titulo: 'Consolidar Servicios', icono: '⚙️', completado: !!datosConsolidados },
    { numero: 3, titulo: 'Llenar Formulario', icono: '📝', completado: !!datosFormulario?.tecnico },
    { numero: 4, titulo: 'Cargar Imágenes', icono: '📸', completado: false }, // Opcional
    { numero: 5, titulo: 'Vista Previa', icono: '👁️', completado: false }
  ];

  // Validar permisos al cargar
  useEffect(() => {
    const validarAcceso = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setCargandoPermisos(false);
          return;
        }

        setUsuario(currentUser);
        const resultadoPermisos = await informesService.validarPermisos(currentUser.email);
        setPermisos(resultadoPermisos);
        
      } catch (error) {
        console.error('Error validando permisos:', error);
        setPermisos({ esValido: false, motivo: 'Error de validación' });
      } finally {
        setCargandoPermisos(false);
      }
    };

    // Escuchar cambios de autenticación
    const unsubscribe = auth.onAuthStateChanged(validarAcceso);
    return () => unsubscribe();
  }, []);

  // Manejo de mensajes
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  // Handlers de eventos
  const handleRemisionEncontrada = (remisionData) => {
    setRemision(remisionData);
    mostrarMensaje('success', `Remisión ${remisionData.remision} encontrada`);
    setPasoActual(2);
  };

  const handleDatosConsolidados = (datos) => {
    setDatosConsolidados(datos);
    mostrarMensaje('success', 'Servicios consolidados correctamente');
    if (pasoActual === 2) {
      setPasoActual(3);
    }
  };

  const handleDatosFormulario = (datos) => {
    setDatosFormulario(datos);
  };

  const handleImagenesActualizadas = (nuevasImagenes) => {
    setImagenes(nuevasImagenes);
  };

  const handleError = (error) => {
    mostrarMensaje('error', error);
  };

  // Guardar informe
  const guardarInforme = async () => {
    try {
      setGuardando(true);

      // Preparar datos del informe
      const datosInforme = {
        numeroRemision: remision.remision,
        fechaRemision: remision.fecha_remision?.toDate ? 
          remision.fecha_remision.toDate().toLocaleDateString('es-ES') : 
          new Date().toLocaleDateString('es-ES'),
        movil: remision.movil,
        autorizo: remision.autorizo,
        tecnico: datosFormulario.tecnico,
        tituloTrabajo: crearTituloTrabajo(),
        datosConsolidados: {
          ...datosConsolidados,
          observaciones: datosFormulario.observaciones,
          recomendaciones: datosFormulario.recomendaciones,
          estadoTrabajo: datosFormulario.estadoTrabajo
        },
        imagenesAntes: imagenes.imagenesAntes,
        imagenesDespues: imagenes.imagenesDespues
      };

      const informeGuardado = await informesService.guardarInforme(datosInforme);
      
      mostrarMensaje('success', `Informe ${informeGuardado.idInforme} guardado exitosamente`);
      
      // Reiniciar formulario
      setTimeout(() => {
        reiniciarFormulario();
      }, 2000);

    } catch (error) {
      console.error('Error guardando informe:', error);
      handleError(error.message);
    } finally {
      setGuardando(false);
    }
  };

  const crearTituloTrabajo = () => {
    if (!remision) return '';
    const servicios = [];
    if (remision.servicio1) servicios.push('SERVICIO 1');
    if (remision.servicio2) servicios.push('SERVICIO 2');
    if (remision.servicio3) servicios.push('SERVICIO 3');
    return servicios.join(', ');
  };

  const reiniciarFormulario = () => {
    setRemision(null);
    setDatosConsolidados(null);
    setDatosFormulario(null);
    setImagenes({ imagenesAntes: [], imagenesDespues: [] });
    setPasoActual(1);
  };

  // Navegación entre pasos
  const puedeAvanzarAPaso = (numeroPaso) => {
    switch (numeroPaso) {
      case 1: return true;
      case 2: return !!remision;
      case 3: return !!remision && !!datosConsolidados;
      case 4: return !!remision && !!datosConsolidados && !!datosFormulario?.tecnico;
      case 5: return !!remision && !!datosConsolidados && !!datosFormulario?.tecnico;
      default: return false;
    }
  };

  // Loading de permisos
  if (cargandoPermisos) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando permisos...</p>
        </div>
      </div>
    );
  }

  // Sin usuario autenticado
  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Autenticación Requerida</h2>
          <p className="text-gray-600">
            Debe iniciar sesión para acceder a los informes técnicos.
          </p>
        </div>
      </div>
    );
  }

  // Sin permisos
  if (permisos && !permisos.esValido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600 mb-4">
            Este módulo solo está disponible para usuarios con rol administrativo o directivo.
          </p>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Motivo:</strong> {permisos.motivo}
            </p>
            <p className="text-sm text-red-600 mt-1">
              Usuario: {usuario.email}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            📋 Informes Técnicos
          </h1>
          <p className="text-gray-600 mt-2">
            Creación de informes técnicos basados en remisiones
          </p>
          
          {permisos?.empleado && (
            <div className="mt-4 bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700">
                ✅ Autorizado como <strong>{permisos.empleado.tipo_empleado}</strong> - {permisos.empleado.nombre_completo}
              </p>
            </div>
          )}
        </div>

        {/* Navegación por pasos */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center justify-between">
            {pasos.map((paso, index) => (
              <div key={paso.numero} className="flex items-center">
                <button
                  onClick={() => puedeAvanzarAPaso(paso.numero) && setPasoActual(paso.numero)}
                  disabled={!puedeAvanzarAPaso(paso.numero)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    pasoActual === paso.numero
                      ? 'bg-blue-600 text-white'
                      : paso.completado
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : puedeAvanzarAPaso(paso.numero)
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-xl">{paso.icono}</span>
                  <span className="text-sm font-medium hidden md:block">{paso.titulo}</span>
                  {paso.completado && <span className="text-green-600">✓</span>}
                </button>
                
                {index < pasos.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    paso.completado ? 'bg-green-400' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes */}
        {mensaje.texto && (
          <div className={`p-4 rounded-lg mb-6 ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            <p className="flex items-center gap-2">
              <span>{mensaje.tipo === 'success' ? '✅' : '❌'}</span>
              {mensaje.texto}
            </p>
          </div>
        )}

        {/* Contenido por pasos */}
        <div className="space-y-6">
          {pasoActual === 1 && (
            <BuscadorRemision
              onRemisionEncontrada={handleRemisionEncontrada}
              onError={handleError}
            />
          )}

          {pasoActual >= 2 && (
            <ConsolidadorServicios
              remision={remision}
              onDatosConsolidados={handleDatosConsolidados}
              onError={handleError}
            />
          )}

          {pasoActual >= 3 && (
            <FormularioInforme
              remision={remision}
              datosConsolidados={datosConsolidados}
              onDatosFormulario={handleDatosFormulario}
              onError={handleError}
            />
          )}

          {pasoActual >= 4 && (
            <CargadorImagenes
              numeroRemision={remision?.remision}
              onImagenesActualizadas={handleImagenesActualizadas}
              onError={handleError}
            />
          )}

          {pasoActual >= 5 && (
            <VistaPrevia
              remision={remision}
              datosFormulario={datosFormulario}
              datosConsolidados={datosConsolidados}
              imagenes={imagenes}
              onGuardar={guardarInforme}
              guardando={guardando}
            />
          )}
        </div>

        {/* Botones de navegación */}
        {pasoActual < 5 && pasoActual > 1 && (
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setPasoActual(pasoActual - 1)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← Anterior
            </button>
            
            {puedeAvanzarAPaso(pasoActual + 1) && (
              <button
                onClick={() => setPasoActual(pasoActual + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Siguiente →
              </button>
            )}
          </div>
        )}

        {/* Botón de reiniciar */}
        {(remision || datosConsolidados || datosFormulario) && (
          <div className="mt-6 text-center">
            <button
              onClick={reiniciarFormulario}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              🔄 Reiniciar Formulario
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InformesTecnicos;