// components/InformesTecnicos/InformesTecnicosPage.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Plus, 
  List, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
// import RoleGuard from './RoleGuard';
import InformeForm from './FormularioInforme';
import InformesTable from './InformesTable';
import { obtenerParametrosURL, limpiarParametrosURL } from '../../services/integracionModulos';
import './InformesTecnicos.css';

/**
 * Página principal del módulo Informes Técnicos
 * Incluye navegación entre crear informe y ver lista de informes
 */
const InformesTecnicosPage = () => {
  // Log de confirmación para verificar que se carga el componente correcto
  console.log('✅ COMPONENTE CORRECTO: InformesTecnicosPage cargado exitosamente');
  console.log('📝 Módulo: Informes Técnicos - Versión completa con PDF ISO');
  
  // Efecto para detectar parámetros URL al cargar
  useEffect(() => {
    const parametros = obtenerParametrosURL();
    console.log('🔍 Parámetros URL detectados:', parametros);
    
    if (parametros.remision) {
      console.log(`🔗 Redirección detectada desde otro módulo con remisión: ${parametros.remision}`);
      
      // Configurar para precargar remisión
      setRemisionPrecargada(parametros.remision);
      setAutoGenerarPDF(parametros.autoGenerar);
      
      // Ir directamente al modo crear
      setVistaActual('crear');
      
      // Mostrar notificación informativa
      mostrarNotificacion(
        `🔄 Redirección desde Ingresar Trabajo - Precargando datos de remisión ${parametros.remision}`,
        'success'
      );
      
      // Limpiar parámetros URL para evitar confusión en navegación posterior
      setTimeout(() => {
        limpiarParametrosURL();
      }, 1000);
    }
  }, []); // Solo ejecutar al montar el componente
  
  // Estados de navegación
  const [vistaActual, setVistaActual] = useState('lista'); // 'lista', 'crear', 'editar'
  const [informeEnEdicion, setInformeEnEdicion] = useState(null);
  const [actualizarLista, setActualizarLista] = useState(false);
  
  // Estados para notificaciones
  const [notificacion, setNotificacion] = useState(null);
  
  // Estados para integración con otros módulos
  const [remisionPrecargada, setRemisionPrecargada] = useState(null);
  const [autoGenerarPDF, setAutoGenerarPDF] = useState(false);

  // Mostrar notificación temporal
  const mostrarNotificacion = (mensaje, tipo = 'success') => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 5000);
  };

  // Navegación a crear nuevo informe
  const irACrearInforme = () => {
    setInformeEnEdicion(null);
    setVistaActual('crear');
  };

  // Navegación a editar informe
  const irAEditarInforme = (informe) => {
    setInformeEnEdicion(informe);
    setVistaActual('editar');
  };

  // Regresar a la lista
  const volverALista = () => {
    setInformeEnEdicion(null);
    setVistaActual('lista');
    
    // Limpiar datos de precarga al regresar a la lista
    setRemisionPrecargada(null);
    setAutoGenerarPDF(false);
  };

  // Manejar guardado exitoso
  const handleGuardadoExitoso = (informe) => {
    const accion = vistaActual === 'editar' ? 'actualizado' : 'creado';
    mostrarNotificacion(`Informe ${accion} exitosamente: ${informe.idInforme}`);
    
    // Limpiar datos de precarga después del guardado exitoso
    setRemisionPrecargada(null);
    setAutoGenerarPDF(false);
    
    // Actualizar la lista si estamos creando un nuevo informe
    if (vistaActual === 'crear') {
      setActualizarLista(true);
    }
    
    // En edición, regresar a la lista inmediatamente
    if (vistaActual === 'editar') {
      setActualizarLista(true);
      volverALista();
    }
  };

  // Manejar errores
  const handleError = (mensaje) => {
    mostrarNotificacion(mensaje, 'error');
  };

  // Cerrar notificación manualmente
  const cerrarNotificacion = () => {
    setNotificacion(null);
  };

  // Renderizar notificación
  const renderNotificacion = () => {
    if (!notificacion) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`
            fixed top-4 right-4 z-50 max-w-md w-full shadow-lg rounded-lg p-4 border
            ${notificacion.tipo === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
            }
          `}
        >
          <div className="flex items-start">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0
              ${notificacion.tipo === 'success' 
                ? 'bg-green-100' 
                : 'bg-red-100'
              }
            `}>
              {notificacion.tipo === 'success' ? (
                <CheckCircle2 className={`w-5 h-5 ${notificacion.tipo === 'success' ? 'text-green-600' : 'text-red-600'}`} />
              ) : (
                <AlertCircle className={`w-5 h-5 ${notificacion.tipo === 'success' ? 'text-green-600' : 'text-red-600'}`} />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                notificacion.tipo === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {notificacion.tipo === 'success' ? 'Éxito' : 'Error'}
              </h4>
              <p className={`text-sm mt-1 ${
                notificacion.tipo === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {notificacion.mensaje}
              </p>
            </div>
            <button
              onClick={cerrarNotificacion}
              className={`ml-3 p-1 rounded-md hover:bg-opacity-20 transition-colors duration-200 ${
                notificacion.tipo === 'success' 
                  ? 'text-green-600 hover:bg-green-600' 
                  : 'text-red-600 hover:bg-red-600'
              }`}
            >
              ✕
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
      <div className="min-h-screen bg-gray-50" data-module="informes-tecnicos">
        {/* Notificaciones */}
        {renderNotificacion()}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header con navegación */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Título y breadcrumb */}
              <div className="flex items-center">
                {vistaActual !== 'lista' && (
                  <button
                    onClick={volverALista}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-3"
                    title="Volver a la lista"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <FileText className="w-8 h-8 text-blue-600 mr-3" />
                    Informes Técnicos
                  </h1>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <span className={vistaActual === 'lista' ? 'text-blue-600 font-medium' : ''}>
                      Lista de Informes
                    </span>
                    {vistaActual !== 'lista' && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-blue-600 font-medium">
                          {vistaActual === 'crear' ? 'Crear Nuevo Informe' : 'Editar Informe'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              {vistaActual === 'lista' && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  onClick={irACrearInforme}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Informe
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Contenido principal con animaciones */}
          <AnimatePresence mode="wait">
            {vistaActual === 'lista' && (
              <motion.div
                key="lista"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <InformesTable
                  onEditarInforme={irAEditarInforme}
                  onNuevoInforme={irACrearInforme}
                  actualizarLista={actualizarLista}
                  setActualizarLista={setActualizarLista}
                />
              </motion.div>
            )}

            {vistaActual === 'crear' && (
              <motion.div
                key="crear"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <InformeForm />
              </motion.div>
            )}

            {vistaActual === 'editar' && informeEnEdicion && (
              <motion.div
                key="editar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <InformeForm />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats o información adicional en el pie */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 border-t border-gray-200 bg-white py-6"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Módulo de Informes Técnicos - Global Mobility Solutions GMS SAS
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Gestión integral de reportes técnicos con evidencia fotográfica y exportación PDF
              </p>
            </div>
          </div>
        </motion.div>
      </div>
  );
};

/**
 * Componente wrapper para integración con el router de la aplicación
 * Este componente puede ser importado en App.js o en el sistema de rutas principal
 */
export default InformesTecnicosPage;
