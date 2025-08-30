/**
 * 🔄 SCRIPT DE FORZADO DE RECARGA - MÓDULO PDF
 * ===========================================
 * Limpia el caché del navegador y fuerza la recarga del módulo PDF
 * actualizado para que los cambios se apliquen inmediatamente
 */

// Función para limpiar caché específico del módulo PDF
function limpiarCachePDF() {
    console.log('🧹 Limpiando caché del módulo PDF...');
    
    // 1. Limpiar caché de módulos ES6 si existe
    if ('moduleCache' in window) {
        delete window.moduleCache;
    }
    
    // 2. Limpiar service worker cache
    if ('caches' in window) {
        caches.keys().then(function(names) {
            names.forEach(function(name) {
                caches.delete(name);
            });
        });
    }
    
    // 3. Forzar recarga de módulos específicos
    const modulesToReload = [
        '/src/services/pdf.js',
        '/src/services/pdfGeneratorService.js'
    ];
    
    modulesToReload.forEach(modulePath => {
        const timestamp = Date.now();
        const scriptElement = document.createElement('script');
        scriptElement.type = 'module';
        scriptElement.src = modulePath + '?v=' + timestamp;
        document.head.appendChild(scriptElement);
        console.log(`🔄 Recargando módulo: ${modulePath}?v=${timestamp}`);
    });
    
    // 4. Mostrar mensaje de confirmación
    setTimeout(() => {
        console.log('✅ Caché limpiado. Los cambios deberían aplicarse ahora.');
        console.log('🔍 Nueva versión esperada: v5.1 - ENCABEZADO CORREGIDO: Logo en círculo blanco');
    }, 1000);
}

// Función para verificar versión actual
async function verificarVersion() {
    try {
        // Importar dinámicamente para evitar caché
        const timestamp = Date.now();
        const module = await import(`/src/services/pdf.js?v=${timestamp}`);
        
        if (module.obtenerVersionPDF) {
            const version = module.obtenerVersionPDF();
            console.log('📦 Versión actual detectada:', version);
            
            // Verificar si es la versión correcta
            if (version.includes('v5.1') && version.includes('ENCABEZADO CORREGIDO')) {
                console.log('✅ ¡ÉXITO! Versión correcta cargada');
                return true;
            } else {
                console.log('⚠️ Versión antigua detectada, forzando recarga...');
                return false;
            }
        }
    } catch (error) {
        console.error('❌ Error verificando versión:', error);
        return false;
    }
}

// Función principal de forzado de recarga
async function forzarRecargaPDF() {
    console.log('🚀 INICIANDO FORZADO DE RECARGA DEL MÓDULO PDF');
    console.log('================================================');
    
    // Paso 1: Verificar versión actual
    const versionCorrecta = await verificarVersion();
    
    if (!versionCorrecta) {
        // Paso 2: Limpiar caché
        limpiarCachePDF();
        
        // Paso 3: Esperar y verificar nuevamente
        setTimeout(async () => {
            const versionVerificada = await verificarVersion();
            if (versionVerificada) {
                console.log('🎉 ¡RECARGA EXITOSA! Los cambios están activos.');
            } else {
                console.log('🔄 Intentando recarga completa de la página...');
                window.location.reload(true);
            }
        }, 2000);
    } else {
        console.log('✅ La versión correcta ya está cargada');
    }
}

// Auto-ejecutar si se carga directamente
if (typeof window !== 'undefined') {
    // Agregar función global
    window.forzarRecargaPDF = forzarRecargaPDF;
    window.limpiarCachePDF = limpiarCachePDF;
    window.verificarVersionPDF = verificarVersion;
    
    console.log('🛠️ Herramientas de recarga disponibles:');
    console.log('   - window.forzarRecargaPDF()');
    console.log('   - window.limpiarCachePDF()');
    console.log('   - window.verificarVersionPDF()');
}

// Exportar para uso como módulo
export { forzarRecargaPDF, limpiarCachePDF, verificarVersion };
