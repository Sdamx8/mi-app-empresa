// services/integracionModulos.js - Servicio de integración entre módulos
import { generarPDFInforme } from './pdf';
import { buscarRemision } from './firestore';

/**
 * 🔗 SERVICIO DE INTEGRACIÓN ENTRE MÓDULOS
 * ========================================
 * 
 * Este servicio facilita la comunicación entre:
 * - IngresarTrabajo.js: Registro de remisiones
 * - InformesTecnicos.js: Generación de informes técnicos y PDFs
 * 
 * Mantiene la modularidad y permite reutilización de funciones
 */

/**
 * Redirigir al módulo de Informes Técnicos con una remisión específica
 * @param {string} numeroRemision - Número de remisión a buscar automáticamente
 * @param {boolean} autoGenerar - Si debe generar PDF automáticamente (opcional)
 * @returns {Promise<boolean>} - Promise que resuelve true si la redirección fue exitosa
 */
export const redirigirAInformesTecnicos = async (numeroRemision, autoGenerar = false) => {
  try {
    console.log(`🔗 Redirigiendo a Informes Técnicos con remisión: ${numeroRemision}`);
    
    // Construir URL con parámetros
    const params = new URLSearchParams();
    params.set('remision', numeroRemision);
    if (autoGenerar) {
      params.set('autoGenerar', 'true');
    }
    
    // Detectar si estamos en una SPA (Single Page Application)
    const currentPath = window.location.pathname;
    const isReactApp = document.getElementById('root') || document.querySelector('[data-reactroot]');
    
    console.log(`📍 Ubicación actual: ${currentPath}, Es React App: ${!!isReactApp}`);
    
    // Opción 1: Si detectamos hash routing en React
    if (window.location.hash.includes('#') || currentPath.includes('ingresa')) {
      const newHash = `#/informes_tecnicos?${params.toString()}`;
      console.log(`🔄 Usando hash routing: ${newHash}`);
      
      // Cambiar el hash
      if (window.location.hash !== newHash) {
        window.location.hash = newHash;
        
        // Esperar un momento para que el hash se establezca
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Notificar al dashboard explícitamente
      try {
        window.dispatchEvent(new CustomEvent('navigation-change', {
          detail: {
            module: 'informes-tecnicos',
            params: { numeroRemision, autoGenerar },
            url: newHash
          }
        }));
      } catch {}
      
      return true;
    }
    
    // Opción 2: Navegación directa con pathname
    const baseUrl = window.location.origin;
    const targetUrl = `${baseUrl}/informes-tecnicos?${params.toString()}`;
    
    console.log(`🎯 URL de destino: ${targetUrl}`);
    
    // Opción 2a: History API (para SPAs)
    if (window.history && window.history.pushState && isReactApp) {
      console.log('📝 Usando History API para navegación SPA');
      
      window.history.pushState(
        { module: 'informes-tecnicos', remision: numeroRemision },
        'Informes Técnicos',
        targetUrl
      );
      
      // Disparar eventos para que React Router u otros sistemas detecten el cambio
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { module: 'informes-tecnicos', remision: numeroRemision }
      }));
      
      window.dispatchEvent(new CustomEvent('navigation-change', {
        detail: {
          module: 'informes-tecnicos',
          params: { numeroRemision, autoGenerar },
          url: targetUrl
        }
      }));
      
      // Esperar y verificar si la navegación funcionó
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Si no funcionó, usar fallback
      if (!document.querySelector('[data-module="informes-tecnicos"]')) {
        console.log('⚠️ History API no funcionó, usando fallback...');
        window.location.href = targetUrl;
      }
      
      return true;
    }
    
    // Opción 2b: Navegación directa (fallback universal)
    console.log('🌐 Usando navegación directa');
    window.location.href = targetUrl;
    return true;
    
  } catch (error) {
    console.error('❌ Error redirigiendo a Informes Técnicos:', error);
    
    // Fallback de emergencia
    try {
      const fallbackUrl = `${window.location.origin}/informes-tecnicos?remision=${encodeURIComponent(numeroRemision)}`;
      console.log(`🆘 Usando URL de emergencia: ${fallbackUrl}`);
      window.location.href = fallbackUrl;
      return true;
    } catch (emergencyError) {
      console.error('💥 Error en fallback de emergencia:', emergencyError);
      return false;
    }
  }
};

/**
 * Generar PDF directamente desde cualquier módulo
 * @param {string} numeroRemision - Número de remisión
 * @param {Object} opciones - Opciones adicionales para la generación
 * @returns {Promise<boolean>} - True si se generó exitosamente
 */
export const generarPDFDirecto = async (numeroRemision, opciones = {}) => {
  try {
    console.log(`📄 Generando PDF directamente para remisión: ${numeroRemision}`);
    
    // 1. Buscar los datos de la remisión
    const datosRemision = await buscarRemision(numeroRemision);
    if (!datosRemision) {
      throw new Error(`No se encontraron datos para la remisión: ${numeroRemision}`);
    }
    
    console.log('✅ Datos de remisión encontrados:', datosRemision);
    
    // 2. Estructurar los datos para el generador de PDF
    const datosInforme = {
      // IDs y referencias
      idInforme: `INF-${numeroRemision}-${Date.now()}`,
      remision: numeroRemision,
      
      // Datos básicos de la remisión
      movil: datosRemision.movil || 'N/A',
      tituloTrabajo: datosRemision.descripcion || 'Trabajo no especificado',
      tecnico: datosRemision.autorizo || 'Técnico no especificado',
      fechaRemision: datosRemision.fecha_remision || 'Fecha no especificada',
      autorizo: datosRemision.autorizo || 'N/A',
      une: datosRemision.une || 'N/A',
      
      // Valores monetarios
      subtotal: datosRemision.subtotal || 0,
      total: datosRemision.total || datosRemision.subtotal || 0,
      
      // Información adicional
      observacionesTecnicas: opciones.observaciones || 'Sin observaciones técnicas registradas.',
      
      // Imágenes (vacías por defecto, se pueden agregar después)
      imagenesAntes: opciones.imagenesAntes || [],
      imagenesDespues: opciones.imagenesDespues || []
    };
    
    // 3. Configuración del PDF
    const configuracionPDF = {
      abrirEnNuevaVentana: opciones.descargar === false ? false : true,
      nombreArchivo: opciones.nombreArchivo || `Informe_Tecnico_${numeroRemision}.pdf`,
      incluirLogo: true,
      currentEmployee: opciones.empleadoActual || null
    };
    
    console.log('📋 Datos estructurados para PDF:', datosInforme);
    
    // 4. Generar el PDF
    await generarPDFInforme(datosInforme, configuracionPDF);
    
    console.log('✅ PDF generado exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error generando PDF directo:', error);
    throw error;
  }
};

/**
 * Validar si una remisión existe y tiene los datos necesarios
 * @param {string} numeroRemision - Número de remisión a validar
 * @returns {Promise<Object>} - Resultado de la validación
 */
export const validarRemisionParaInforme = async (numeroRemision) => {
  try {
    const datosRemision = await buscarRemision(numeroRemision);
    
    if (!datosRemision) {
      return {
        valida: false,
        error: 'Remisión no encontrada',
        codigo: 'REMISION_NO_ENCONTRADA'
      };
    }
    
    // Validar campos mínimos requeridos
    const camposRequeridos = ['movil', 'descripcion'];
    const camposFaltantes = camposRequeridos.filter(campo => !datosRemision[campo]);
    
    if (camposFaltantes.length > 0) {
      return {
        valida: false,
        error: `Faltan campos requeridos: ${camposFaltantes.join(', ')}`,
        codigo: 'CAMPOS_FALTANTES',
        camposFaltantes
      };
    }
    
    return {
      valida: true,
      datos: datosRemision
    };
    
  } catch (error) {
    return {
      valida: false,
      error: error.message,
      codigo: 'ERROR_VALIDACION'
    };
  }
};

/**
 * Crear opciones de integración para mostrar al usuario
 * @param {string} numeroRemision - Número de remisión recién creada
 * @returns {Array} - Array de opciones disponibles
 */
export const obtenerOpcionesIntegracion = (numeroRemision) => {
  return [
    {
      id: 'crear-informe',
      titulo: '📝 Crear Informe Técnico',
      descripcion: 'Ir al módulo de Informes Técnicos para completar con evidencias',
      accion: () => redirigirAInformesTecnicos(numeroRemision),
      tipo: 'navegacion',
      icono: '📝'
    },
    {
      id: 'generar-pdf-basico',
      titulo: '📄 Generar PDF Básico',
      descripcion: 'Generar informe PDF con los datos actuales (sin evidencias fotográficas)',
      accion: () => generarPDFDirecto(numeroRemision, { 
        observaciones: 'Informe técnico generado automáticamente desde registro de remisión.' 
      }),
      tipo: 'pdf',
      icono: '📄'
    }
  ];
};

/**
 * Función utilitaria para obtener parámetros URL
 * @returns {Object} - Parámetros de la URL actual
 */
export const obtenerParametrosURL = () => {
  // 1) Intentar con querystring normal
  let params = new URLSearchParams(window.location.search);
  let remision = params.get('remision');
  let autoGenerar = params.get('autoGenerar') === 'true';

  // 2) Si no hay en search, intentar extraer del hash (p.ej. #/informes_tecnicos?remision=123)
  if (!remision && typeof window !== 'undefined' && window.location?.hash) {
    const hash = window.location.hash; // ej: #/informes_tecnicos?remision=123&autoGenerar=true
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const hashQuery = hash.substring(queryIndex + 1);
      const hashParams = new URLSearchParams(hashQuery);
      remision = hashParams.get('remision') || remision;
      autoGenerar = hashParams.get('autoGenerar') === 'true' || autoGenerar;
    }
  }

  return {
    remision: remision,
    autoGenerar
  };
};

/**
 * Limpiar parámetros de la URL sin recargar la página
 */
export const limpiarParametrosURL = () => {
  try {
    if (window.history && window.history.replaceState) {
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', newUrl);
    }
  } catch (error) {
    console.warn('No se pudieron limpiar los parámetros URL:', error);
  }
};

/**
 * Event listener para manejar navegación entre módulos
 * @param {Function} callback - Función a ejecutar cuando cambie la navegación
 */
export const configurarListenerNavegacion = (callback) => {
  const handleNavigationChange = (event) => {
    callback(event.detail);
  };
  
  window.addEventListener('navigation-change', handleNavigationChange);
  
  // Retornar función para remover el listener
  return () => {
    window.removeEventListener('navigation-change', handleNavigationChange);
  };
};

// Logging para confirmar carga del servicio
console.log('🔗 Servicio de Integración de Módulos cargado exitosamente');
console.log('📋 Funciones disponibles:');
console.log('  • redirigirAInformesTecnicos()');
console.log('  • generarPDFDirecto()');
console.log('  • validarRemisionParaInforme()');
console.log('  • obtenerOpcionesIntegracion()');
console.log('  • obtenerParametrosURL()');
console.log('  • limpiarParametrosURL()');
console.log('  • configurarListenerNavegacion()');
