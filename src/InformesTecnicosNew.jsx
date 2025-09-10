// InformesTecnicos.jsx - Módulo de gestión de informes técnicos con soporte para múltiples imágenes
import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from './AuthContext';
import { useRole } from './RoleContext';
import InformesTecnicosService from './services/informesTecnicosService';
import ImageService from './services/imageService';
import PDFService from './services/pdfService';
import MultipleImageUpload from './components/MultipleImageUpload';

// Función logger simplificada
const logger = {
  error: (message, error) => {
    console.error(message, error);
  },
  info: (message) => {
    console.log('[INFO]', message);
  }
};

// Componente para vista previa de imágenes
const ImagePreview = memo(({ file, onRemove, label }) => {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (file) {
      ImageService.generatePreview(file)
        .then(setPreview)
        .catch(() => setPreview(''));
    }
    
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  if (!file) return null;

  return (
    <div className="relative inline-block">
      <img 
        src={preview} 
        alt={label}
        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
      />
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
      >
        ×
      </button>
      <p className="text-xs text-gray-600 mt-1 text-center">{label}</p>
    </div>
  );
});

// Componente principal
const InformesTecnicos = memo(({ initialData = null, onDataUsed = null }) => {
  const { user } = useAuth();
  const { userRole, userPermissions } = useRole();
  
  // Estados del formulario
  const [numeroRemision, setNumeroRemision] = useState('');
  const [datosRemision, setDatosRemision] = useState(null);
  const [tituloTrabajo, setTituloTrabajo] = useState(''); // NUEVO: Título del trabajo
  const [ubicacionUNE, setUbicacionUNE] = useState(''); // NUEVO: Ubicación UNE
  const [observaciones, setObservaciones] = useState('');
  const [imagenAntes, setImagenAntes] = useState([]);  // Ahora es un array
  const [imagenDespues, setImagenDespues] = useState([]);  // Ahora es un array
  
  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [informes, setInformes] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  // Estados de búsqueda y filtros
  const [filtroRemision, setFiltroRemision] = useState('');
  const [filtroTecnico, setFiltroTecnico] = useState('');

  // NUEVOS: Estados para edición
  const [modoEdicion, setModoEdicion] = useState(false);
  const [informeEditando, setInformeEditando] = useState(null);
  const [mostrarModalConfirmacion, setMostrarModalConfirmacion] = useState(false);
  const [accionConfirmacion, setAccionConfirmacion] = useState(null);

  // Manejar datos iniciales desde otra pantalla
  useEffect(() => {
    if (initialData && initialData.autoOpen) {
      setNumeroRemision(initialData.numeroRemision || '');
      setDatosRemision(initialData.datosRemision || null);
      
      // Pre-llenar ubicación UNE si viene en los datos
      if (initialData.datosRemision?.une) {
        setUbicacionUNE(initialData.datosRemision.une);
      }
      
      setMostrarFormulario(true);
      
      // Notificar que se usaron los datos
      if (onDataUsed) {
        onDataUsed();
      }
      
      showMessage(`Datos de remisión ${initialData.numeroRemision} cargados automáticamente`, 'success');
    }
  }, [initialData, onDataUsed]);

  // Cargar informes existentes
  const cargarInformes = useCallback(async () => {
    try {
      setLoading(true);
      const informesData = await InformesTecnicosService.obtenerInformes();
      setInformes(informesData);
      showMessage(`${informesData.length} informes cargados`, 'success');
    } catch (error) {
      logger.error('Error cargando informes:', error);
      showMessage('Error al cargar informes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarInformes();
  }, [cargarInformes]);

  // Función para mostrar mensajes
  const showMessage = useCallback((msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  }, []);

  // Buscar datos de remisión
  const buscarRemision = useCallback(async () => {
    if (!numeroRemision.trim()) {
      showMessage('Ingrese un número de remisión', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      // Verificar si ya existe un informe para esta remisión
      const informeExistente = await InformesTecnicosService.obtenerInformePorRemision(numeroRemision);
      if (informeExistente) {
        showMessage('Ya existe un informe técnico para esta remisión', 'warning');
        return;
      }

      // Obtener datos de la remisión
      const datos = await InformesTecnicosService.obtenerDatosRemision(numeroRemision);
      setDatosRemision(datos);
      
      // Pre-llenar ubicación UNE si viene en los datos
      if (datos.une) {
        setUbicacionUNE(datos.une);
      }
      
      setMostrarFormulario(true);
      showMessage('Datos de remisión cargados exitosamente', 'success');

    } catch (error) {
      logger.error('Error buscando remisión:', error);
      showMessage(error.message, 'error');
      setDatosRemision(null);
    } finally {
      setLoading(false);
    }
  }, [numeroRemision]);

  // Resetear formulario (MOVER ANTES de guardarInforme)
  const resetearFormulario = useCallback(() => {
    setNumeroRemision('');
    setDatosRemision(null);
    setTituloTrabajo('');
    setUbicacionUNE('');
    setObservaciones('');
    setImagenAntes([]);
    setImagenDespues([]);
    setMostrarFormulario(false);
    setModoEdicion(false);
    setInformeEditando(null);
  }, []);

  // Ya no necesitamos handleImageSelect - se usa MultipleImageUpload

  // Guardar informe técnico (crear o modificar)
  const guardarInforme = useCallback(async () => {
    // Validaciones básicas
    if (!observaciones.trim() || !tituloTrabajo.trim()) {
      showMessage('Complete todos los campos requeridos (observaciones y título del trabajo)', 'warning');
      return;
    }

    // Validar autenticación del usuario
    if (!user || !user.email) {
      showMessage('Error: Usuario no autenticado. Por favor, inicie sesión nuevamente.', 'error');
      return;
    }

    console.log('👤 Usuario validado:', user.email);

    try {
      setLoading(true);

      // Si estamos en modo edición
      if (modoEdicion && informeEditando?.id) {
        logger.info('Guardando cambios en informe:', informeEditando.id);

        // Preparar datos actualizados para edición
        const datosActualizados = {
          tituloTrabajo: tituloTrabajo.trim(),
          ubicacionUNE: ubicacionUNE.trim(),
          observaciones: observaciones.trim(),
          elaboradoPor: user?.email || 'unknown'
        };

        // Llamar al servicio de modificación
        await InformesTecnicosService.modificarInforme(
          informeEditando.id, 
          datosActualizados, 
          imagenAntes, 
          imagenDespues
        );

        showMessage('Informe modificado exitosamente', 'success');
      } else {
        // Modo creación - Validar datos de remisión
        if (!datosRemision) {
          showMessage('Primero debe buscar una remisión válida', 'warning');
          return;
        }

        // Crear informe base
        const informeData = {
          numeroRemision: datosRemision.numeroRemision,
          movil: datosRemision.movil || '', // INCLUIR MÓVIL
          tituloTrabajo: tituloTrabajo.trim(), // NUEVO: Título del trabajo
          ubicacionUNE: ubicacionUNE.trim(), // NUEVO: Ubicación UNE
          tecnico: datosRemision.tecnico,
          fechaRemision: datosRemision.fechaRemision,
          autorizadoPor: datosRemision.autorizadoPor,
          elaboradoPor: user.email,
          observaciones: observaciones.trim(),
          subtotal: datosRemision.subtotal || 0, // NUEVO: Subtotal
          total: datosRemision.total || 0 // NUEVO: Total
        };

        // Crear informe en Firestore
        const { id: informeDocId, informeId } = await InformesTecnicosService.crearInforme(informeData);

        // Subir imágenes si existen
        if (imagenAntes.length > 0 || imagenDespues.length > 0) {
          await InformesTecnicosService.subirImagenes(informeDocId, informeId, imagenAntes, imagenDespues);
        }

        showMessage('Informe técnico creado exitosamente', 'success');
      }

      // Limpiar formulario y recargar lista
      resetearFormulario();
      await cargarInformes();

    } catch (error) {
      logger.error('Error guardando informe:', error);
      showMessage(error.message || 'Error al guardar informe', 'error');
    } finally {
      setLoading(false);
    }
  }, [datosRemision, observaciones, tituloTrabajo, ubicacionUNE, imagenAntes, imagenDespues, user, cargarInformes, modoEdicion, informeEditando, resetearFormulario, showMessage]);

  // NUEVA: Función para editar informe - SIMPLIFICADA
  const editarInforme = useCallback(async (informe) => {
    try {
      setLoading(true);
      logger.info('Iniciando edición de informe:', informe.numeroRemision);
      
      // Cargar datos del informe en el formulario
      setNumeroRemision(informe.numeroRemision || '');
      setTituloTrabajo(informe.tituloTrabajo || '');
      setUbicacionUNE(informe.ubicacionUNE || '');
      setObservaciones(informe.observaciones || '');
      
      // Crear objeto datosRemision a partir del informe
      const datosRemisionEditando = {
        numeroRemision: informe.numeroRemision || '',
        movil: informe.movil || '',
        tecnico: informe.tecnico || '',
        fechaRemision: informe.fechaRemision || '',
        autorizadoPor: informe.autorizadoPor || '',
        une: informe.ubicacionUNE || '',
        subtotal: informe.subtotal || 0,
        total: informe.total || 0
      };
      
      setDatosRemision(datosRemisionEditando);

      // Configurar modo edición
      setModoEdicion(true);
      setInformeEditando(informe);
      setMostrarFormulario(true);
      
      showMessage(`Editando informe ${informe.numeroRemision}`, 'info');
      
    } catch (error) {
      logger.error('Error cargando informe para edición:', error);
      showMessage('Error al cargar informe para edición', 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // NUEVA: Función para confirmar eliminación - SIMPLIFICADA
  const confirmarEliminacion = useCallback((informe) => {
    if (!informe?.id) {
      showMessage('Informe no válido', 'error');
      return;
    }
    
    setAccionConfirmacion(() => () => eliminarInforme(informe));
    setMostrarModalConfirmacion(true);
  }, [showMessage]);

  // NUEVA: Función para eliminar informe - SIMPLIFICADA
  const eliminarInforme = useCallback(async (informe) => {
    try {
      if (!informe?.id) {
        showMessage('Informe no válido', 'error');
        return;
      }
      
      setLoading(true);
      setMostrarModalConfirmacion(false);
      logger.info('Eliminando informe:', informe.id);
      
      // Llamar al servicio de eliminación
      await InformesTecnicosService.eliminarInforme(
        informe.id,
        informe.imagenAntesURL || null,
        informe.imagenDespuesURL || null
      );

      // Recargar lista de informes
      await cargarInformes();
      
      showMessage('Informe eliminado exitosamente', 'success');

    } catch (error) {
      logger.error('Error eliminando informe:', error);
      showMessage('Error al eliminar informe: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setLoading(false);
    }
  }, [cargarInformes, showMessage]);

  // NUEVA: Función para exportar PDF directamente - SIMPLIFICADA
  const exportarPDF = useCallback(async (informe) => {
    try {
      if (!informe?.id) {
        showMessage('Informe no válido', 'error');
        return;
      }
      
      setLoading(true);
      showMessage('Generando PDF...', 'info');
      logger.info('Exportando PDF para informe:', informe.id);
      
      // Intentar usar el servicio de exportación si existe
      try {
        await InformesTecnicosService.exportarInformePDF(informe.id);
      } catch (serviceError) {
        logger.error('Error en servicio exportarInformePDF, usando método alternativo:', serviceError);
        
        // Fallback: usar el método tradicional
        const imagenes = {};
        if (informe.imagenAntesURL) imagenes.antes = informe.imagenAntesURL;
        if (informe.imagenDespuesURL) imagenes.despues = informe.imagenDespuesURL;
        
        await PDFService.generarYDescargarInforme(informe, imagenes);
      }
      
      showMessage('PDF exportado exitosamente', 'success');

    } catch (error) {
      logger.error('Error exportando PDF:', error);
      showMessage('Error al exportar PDF: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showMessage]);

  // NUEVA: Función para cancelar edición - SIMPLIFICADA
  const cancelarEdicion = useCallback(() => {
    resetearFormulario();
    showMessage('Edición cancelada', 'info');
  }, [resetearFormulario, showMessage]);

  // Filtrar informes
  const informesFiltrados = informes.filter(informe => {
    const matchRemision = !filtroRemision || 
      informe.numeroRemision.toLowerCase().includes(filtroRemision.toLowerCase());
    const matchTecnico = !filtroTecnico || 
      informe.tecnico.toLowerCase().includes(filtroTecnico.toLowerCase());
    
    return matchRemision && matchTecnico;
  });

  // Función para exportar informe a PDF
  const exportarInformePDF = useCallback(async (informe) => {
    try {
      setLoading(true);
      showMessage('Generando PDF...', 'info');

      // Preparar datos del informe
      const informeData = {
        id: String(informe.id || ''),
        idInforme: String(informe.idInforme || ''),
        numeroRemision: String(informe.numeroRemision || ''),
        movil: String(informe.movil || 'Sin móvil'),
        tituloTrabajo: String(informe.tituloTrabajo || 'Sin título especificado'), // NUEVO
        ubicacionUNE: String(informe.ubicacionUNE || 'Sin ubicación especificada'), // NUEVO
        tecnico: String(informe.tecnico || ''),
        fechaRemision: String(informe.fechaRemision || ''),
        autorizadoPor: String(informe.autorizadoPor || ''),
        elaboradoPor: String(informe.elaboradoPor || ''),
        observaciones: String(informe.observaciones || ''),
        subtotal: informe.subtotal || 0, // NUEVO
        total: informe.total || 0, // NUEVO
        fechaCreacion: String(informe.fechaCreacion || '')
      };

      // Preparar imágenes con soporte para múltiples imágenes
      const imagenes = {
        antes: [],
        despues: []
      };
      
      // Imágenes "antes" - soporte para campos únicos y múltiples
      if (informe.imagenAntesURL) {
        imagenes.antes.push(informe.imagenAntesURL);
      }
      if (informe.imagenesAntesURLs && Array.isArray(informe.imagenesAntesURLs)) {
        imagenes.antes.push(...informe.imagenesAntesURLs);
      }
      
      // Imágenes "después" - soporte para campos únicos y múltiples
      if (informe.imagenDespuesURL) {
        imagenes.despues.push(informe.imagenDespuesURL);
      }
      if (informe.imagenesDespuesURLs && Array.isArray(informe.imagenesDespuesURLs)) {
        imagenes.despues.push(...informe.imagenesDespuesURLs);
      }

      // Generar y descargar PDF
      await PDFService.generarYDescargarInforme(informeData, imagenes);
      showMessage('PDF generado y descargado exitosamente', 'success');

    } catch (error) {
      logger.error('Error exportando PDF:', error);
      showMessage('Error al generar el PDF: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            📋 Informes Técnicos
          </h1>
          <div className="flex gap-3">
            <button
              onClick={cargarInformes}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? '🔄' : '🔄'} Recargar
            </button>
            <button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              {mostrarFormulario ? '❌ Cancelar' : '➕ Nuevo Informe'}
            </button>
          </div>
        </div>
        
        <p className="text-gray-600">
          Gestión de informes técnicos con trazabilidad ISO y evidencias fotográficas
        </p>
      </div>

      {/* Mensajes */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-100 text-green-700 border border-green-300' :
          messageType === 'error' ? 'bg-red-100 text-red-700 border border-red-300' :
          messageType === 'warning' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
          'bg-blue-100 text-blue-700 border border-blue-300'
        }`}>
          {message}
        </div>
      )}

      {/* Formulario de nuevo informe */}
      {mostrarFormulario && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">
            {modoEdicion 
              ? `📝 Editando Informe: ${informeEditando?.numeroRemision}` 
              : '🆕 Crear Nuevo Informe Técnico'
            }
          </h2>

          {/* Buscar remisión (solo en modo creación) */}
          {!modoEdicion && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📄 Número de Remisión
                </label>
                <input
                  type="text"
                  value={numeroRemision}
                  onChange={(e) => setNumeroRemision(e.target.value)}
                  placeholder="Ingrese el número de remisión"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading || datosRemision}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={buscarRemision}
                  disabled={loading || !numeroRemision.trim() || datosRemision}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? '🔍 Buscando...' : '🔍 Buscar'}
                </button>
              </div>
            </div>
          )}

          {/* Datos de la remisión (readonly) */}
          {(datosRemision || modoEdicion) && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    👨‍🔧 Técnico Asignado
                  </label>
                  <input
                    type="text"
                    value={datosRemision.tecnico}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📅 Fecha de Remisión
                  </label>
                  <input
                    type="text"
                    value={datosRemision.fechaRemision}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🚗 Número de Móvil
                  </label>
                  <input
                    type="text"
                    value={datosRemision.movil || 'Sin móvil asignado'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ✅ Autorizado Por
                  </label>
                  <input
                    type="text"
                    value={datosRemision.autorizadoPor}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Elaborado Por
                  </label>
                  <input
                    type="text"
                    value={user?.email || ''}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                  />
                </div>
              </div>

              {/* Título del Trabajo */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🎯 Título Principal del Trabajo *
                </label>
                <input
                  type="text"
                  value={tituloTrabajo}
                  onChange={(e) => setTituloTrabajo(e.target.value)}
                  placeholder="Ej: Reparación de sistema eléctrico, Mantenimiento preventivo, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Ubicación UNE */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📍 Ubicación UNE (Lugar del trabajo)
                </label>
                <input
                  type="text"
                  value={ubicacionUNE}
                  onChange={(e) => setUbicacionUNE(e.target.value)}
                  placeholder="Ej: UNE Bosa, UNE Centro, Dirección específica, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Observaciones técnicas */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📝 Observaciones Técnicas *
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Describa las observaciones técnicas del trabajo realizado..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Carga de imágenes múltiples */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Múltiples Imágenes "Antes" */}
                <MultipleImageUpload
                  label="📷 Imágenes ANTES del servicio"
                  images={imagenAntes}
                  onImagesChange={setImagenAntes}
                  maxImages={5}
                  disabled={loading}
                />

                {/* Múltiples Imágenes "Después" */}
                <MultipleImageUpload
                  label="📷 Imágenes DESPUÉS del servicio"
                  images={imagenDespues}
                  onImagesChange={setImagenDespues}
                  maxImages={5}
                  disabled={loading}
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4">
                <button
                  onClick={guardarInforme}
                  disabled={loading || !observaciones.trim() || !tituloTrabajo.trim()}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading 
                    ? (modoEdicion ? '� Guardando cambios...' : '�💾 Guardando...') 
                    : (modoEdicion ? '� Guardar Cambios' : '�💾 Guardar Informe')
                  }
                </button>
                
                {modoEdicion && (
                  <button
                    onClick={cancelarEdicion}
                    disabled={loading}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
                  >
                    ❌ Cancelar Edición
                  </button>
                )}
                
                <button
                  onClick={resetearFormulario}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                >
                  🔄 {modoEdicion ? 'Cancelar' : 'Limpiar Formulario'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Lista de informes */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            📋 Informes Registrados ({informesFiltrados.length})
          </h2>
          
          {/* Filtros */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="🔍 Filtrar por remisión..."
              value={filtroRemision}
              onChange={(e) => setFiltroRemision(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="🔍 Filtrar por técnico..."
              value={filtroTecnico}
              onChange={(e) => setFiltroTecnico(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabla de informes */}
        {informesFiltrados.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {informes.length === 0 
              ? '📝 No hay informes técnicos registrados' 
              : '🔍 No se encontraron informes con los filtros aplicados'
            }
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Remisión</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Móvil</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Técnico</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Elaborado Por</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Imágenes</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {informesFiltrados.map((informe) => (
                  <tr key={informe.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium text-blue-600">
                        {informe.numeroRemision}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                        {informe.movil || 'Sin móvil'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{informe.tecnico}</td>
                    <td className="px-4 py-3 text-sm">{informe.elaboradoPor}</td>
                    <td className="px-4 py-3 text-sm">
                      {informe.fechaCreacion ? 
                        new Date(informe.fechaCreacion).toLocaleDateString('es-ES') :
                        'Sin fecha'
                      }
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {informe.imagenAntesURL && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            📷 Antes
                          </span>
                        )}
                        {informe.imagenDespuesURL && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            📷 Después
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        informe.trazabilidad?.estado === 'completado' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {informe.trazabilidad?.estado === 'completado' ? '✅ Completado' : '⏳ Borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2 flex-wrap">
                        {/* Botón Exportar PDF */}
                        <button
                          onClick={() => exportarPDF(informe)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-xs flex items-center gap-1"
                          title="Exportar a PDF"
                        >
                          📄 PDF
                        </button>
                        
                        {/* Botón Editar */}
                        <button
                          onClick={() => editarInforme(informe)}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-xs flex items-center gap-1"
                          title="Editar informe"
                        >
                          ✏️ Editar
                        </button>
                        
                        {/* Botón Eliminar */}
                        <button
                          onClick={() => confirmarEliminacion(informe)}
                          disabled={loading}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-xs flex items-center gap-1"
                          title="Eliminar informe"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de confirmación para eliminar */}
      {mostrarModalConfirmacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              🗑️ Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Está seguro de que desea eliminar este informe técnico? 
              Esta acción no se puede deshacer y también eliminará las imágenes asociadas.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setMostrarModalConfirmacion(false)}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
              >
                ❌ Cancelar
              </button>
              <button
                onClick={accionConfirmacion}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? '🗑️ Eliminando...' : '🗑️ Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default InformesTecnicos;
